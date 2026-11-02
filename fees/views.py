from decimal import Decimal

from django.db import transaction
from django.db.models import Count, F, Q, Sum
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.authentication import JWTAuthentication

from accounts.permissions import IsSchoolAdministrator
from accounts.tenancy import SchoolScopedModelViewSet
from students.models import Student

from .models import Fee
from .models import FeePayment
from .serializers import FeePaymentInputSerializer, FeePaymentSerializer, FeeSerializer


class FeeViewSet(SchoolScopedModelViewSet):
    queryset = Fee.objects.select_related("student", "student__user").prefetch_related("payments", "payments__received_by").all()
    serializer_class = FeeSerializer
    authentication_classes = (JWTAuthentication,)
    permission_classes = (IsAuthenticated, IsSchoolAdministrator)
    tenant_related_fields = ("student",)

    def get_queryset(self):
        queryset = super().get_queryset()
        params = self.request.query_params
        today = timezone.localdate()
        grade = params.get("grade")
        section = params.get("section")
        academic_year = params.get("academic_year")
        status_filter = params.get("status")
        category = params.get("category")
        query = params.get("q", "").strip()
        due_before = params.get("due_before")
        due_after = params.get("due_after")
        if grade:
            queryset = queryset.filter(student__grade=grade)
        if section:
            queryset = queryset.filter(student__section=section)
        if academic_year:
            queryset = queryset.filter(academic_year=academic_year)
        if category:
            queryset = queryset.filter(category=category)
        if query:
            queryset = queryset.filter(
                Q(title__icontains=query)
                | Q(student__user__first_name__icontains=query)
                | Q(student__user__last_name__icontains=query)
                | Q(student__admission_no__icontains=query)
            )
        if due_before:
            queryset = queryset.filter(due_date__lte=due_before)
        if due_after:
            queryset = queryset.filter(due_date__gte=due_after)
        if status_filter == "paid":
            queryset = queryset.filter(paid_amount__gte=F("amount"))
        elif status_filter == "overdue":
            queryset = queryset.filter(paid_amount__lt=F("amount"), due_date__lt=today)
        elif status_filter == "partial":
            queryset = queryset.filter(paid_amount__gt=0, paid_amount__lt=F("amount"), due_date__gte=today)
        elif status_filter == "pending":
            queryset = queryset.filter(paid_amount=0, due_date__gte=today)
        elif status_filter and status_filter != "all":
            raise ValidationError({"status": "Choose paid, partial, overdue, or pending."})
        return queryset.order_by("due_date", "student__admission_no", "pk")

    @action(detail=False, methods=("get",), url_path="summary")
    def summary(self, request):
        fees = self.filter_queryset(self.get_queryset())
        totals = fees.aggregate(
            charges=Sum("amount"),
            collected=Sum("paid_amount"),
            count=Count("id"),
        )
        charges = totals["charges"] or Decimal("0.00")
        collected = totals["collected"] or Decimal("0.00")
        balance = charges - collected
        overdue = fees.filter(paid_amount__lt=F("amount"), due_date__lt=timezone.localdate())
        overdue_totals = overdue.aggregate(balance=Sum(F("amount") - F("paid_amount")), count=Count("id"))
        return Response({
            "fee_count": totals["count"],
            "total_charges": charges,
            "collected": collected,
            "outstanding": balance,
            "overdue_balance": overdue_totals["balance"] or Decimal("0.00"),
            "overdue_count": overdue_totals["count"],
            "collection_rate": round(float(collected * 100 / charges), 1) if charges else 0,
        })

    @action(detail=False, methods=("get",), url_path="students")
    def students(self, request):
        school = self.get_school()
        students = Student.objects.filter(school=school).select_related("user").order_by("grade", "section", "admission_no")
        return Response([
            {
                "id": student.pk,
                "name": student.name,
                "admission_no": student.admission_no,
                "grade": student.grade,
                "section": student.section,
            }
            for student in students
        ])

    @action(detail=True, methods=("get", "post"), url_path="payments")
    def payments(self, request, pk=None):
        fee = self.get_object()
        if request.method == "GET":
            payments = fee.payments.select_related("received_by").all()
            return Response(FeePaymentSerializer(payments, many=True).data)

        payload = FeePaymentInputSerializer(data=request.data)
        payload.is_valid(raise_exception=True)
        school = self.get_school()
        with transaction.atomic():
            locked_fee = Fee.objects.select_for_update().get(pk=fee.pk, school=school)
            amount = payload.validated_data["amount"]
            balance = locked_fee.amount - locked_fee.paid_amount
            if amount > balance:
                raise ValidationError({"amount": f"Payment exceeds the outstanding balance of {balance:.2f}."})
            payment = FeePayment.objects.create(
                school=school,
                fee=locked_fee,
                received_by=request.user,
                **payload.validated_data,
            )
            locked_fee.paid_amount = F("paid_amount") + amount
            locked_fee.save(update_fields=("paid_amount",))
        return Response(FeePaymentSerializer(payment).data, status=status.HTTP_201_CREATED)