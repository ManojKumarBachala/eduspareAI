from django.db import transaction
from datetime import timedelta
from django.db.models import Count, Q
from django.utils.dateparse import parse_date
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.authentication import JWTAuthentication

from accounts.permissions import IsSchoolStaff
from accounts.tenancy import SchoolScopedModelViewSet

from .models import Attendance
from .serializers import AttendanceBulkSerializer, AttendanceSerializer
from students.models import Student


class AttendanceViewSet(SchoolScopedModelViewSet):
    queryset = Attendance.objects.select_related("student", "student__user").all()
    serializer_class = AttendanceSerializer
    authentication_classes = (JWTAuthentication,)
    permission_classes = (IsAuthenticated, IsSchoolStaff)
    tenant_related_fields = ("student",)

    @action(detail=False, methods=("get",), url_path="roster")
    def roster(self, request):
        school = self.get_school()
        date_value = request.query_params.get("date")
        if date_value:
            selected_date = parse_date(date_value)
            if selected_date is None:
                raise ValidationError({"date": "Enter a valid date in YYYY-MM-DD format."})
        else:
            selected_date = timezone.localdate()

        students = Student.objects.filter(school=school).select_related("user")
        grade = request.query_params.get("grade")
        section = request.query_params.get("section")
        if grade:
            students = students.filter(grade=grade)
        if section:
            students = students.filter(section=section)

        attendance_by_student = {
            student_id: (record_status, note)
            for student_id, record_status, note in Attendance.objects.filter(
                school=school,
                date=selected_date,
                student__school=school,
            ).values_list("student_id", "status", "note")
        }
        return Response([
            {
                "student_id": student.pk,
                "name": student.name,
                "admission_no": student.admission_no,
                "grade": student.grade,
                "section": student.section,
                "status": attendance_by_student.get(student.pk, (None, ""))[0],
                "note": attendance_by_student.get(student.pk, (None, ""))[1],
            }
            for student in students
        ])

    @action(detail=False, methods=("put",), url_path="bulk")
    def bulk(self, request):
        payload = AttendanceBulkSerializer(data=request.data)
        payload.is_valid(raise_exception=True)
        school = self.get_school()
        records = payload.validated_data["records"]
        student_ids = [record["student_id"] for record in records]
        students = {
            student.pk: student
            for student in Student.objects.filter(school=school, pk__in=student_ids)
        }
        if len(students) != len(student_ids):
            raise ValidationError({"records": "One or more students do not belong to this school."})

        with transaction.atomic():
            for record in records:
                lookup = {
                    "school": school,
                    "student": students[record["student_id"]],
                    "date": payload.validated_data["date"],
                }
                if record["status"] is None:
                    Attendance.objects.filter(**lookup).delete()
                    continue
                defaults = {"status": record["status"]}
                if "note" in record:
                    defaults["note"] = record["note"]
                Attendance.objects.update_or_create(
                    **lookup,
                    defaults=defaults,
                )

        saved_records = Attendance.objects.filter(
            school=school,
            date=payload.validated_data["date"],
            student_id__in=student_ids,
        ).select_related("student", "student__user")
        return Response(AttendanceSerializer(saved_records, many=True).data, status=status.HTTP_200_OK)

    @action(detail=False, methods=("get",), url_path="report")
    def report(self, request):
        school = self.get_school()
        today = timezone.localdate()
        start_value = request.query_params.get("start_date")
        end_value = request.query_params.get("end_date")
        start_date = parse_date(start_value) if start_value else today - timedelta(days=29)
        end_date = parse_date(end_value) if end_value else today
        if start_date is None:
            raise ValidationError({"start_date": "Enter a valid date in YYYY-MM-DD format."})
        if end_date is None:
            raise ValidationError({"end_date": "Enter a valid date in YYYY-MM-DD format."})
        if start_date > end_date:
            raise ValidationError({"end_date": "End date must be on or after the start date."})
        try:
            risk_threshold = float(request.query_params.get("risk_threshold", "75"))
        except ValueError as exc:
            raise ValidationError({"risk_threshold": "Enter a number from 0 to 100."}) from exc
        if not 0 <= risk_threshold <= 100:
            raise ValidationError({"risk_threshold": "Enter a number from 0 to 100."})

        students = Student.objects.filter(school=school).select_related("user")
        grade = request.query_params.get("grade")
        section = request.query_params.get("section")
        if grade:
            students = students.filter(grade=grade)
        if section:
            students = students.filter(section=section)

        student_ids = list(students.values_list("pk", flat=True))
        records = Attendance.objects.filter(
            school=school,
            student_id__in=student_ids,
            date__range=(start_date, end_date),
        )
        counts = {
            item["student_id"]: item
            for item in records.values("student_id").annotate(
                present=Count("pk", filter=Q(status=Attendance.Status.PRESENT)),
                absent=Count("pk", filter=Q(status=Attendance.Status.ABSENT)),
                late=Count("pk", filter=Q(status=Attendance.Status.LATE)),
                excused=Count("pk", filter=Q(status=Attendance.Status.EXCUSED)),
                half_day=Count("pk", filter=Q(status=Attendance.Status.HALF_DAY)),
            )
        }
        recent_statuses = {}
        for student_id, record_status in records.order_by("student_id", "-date").values_list("student_id", "status"):
            recent_statuses.setdefault(student_id, []).append(record_status)
        student_rows = []
        totals = {"present": 0, "absent": 0, "late": 0, "excused": 0, "half_day": 0}
        for student in students.order_by("user__first_name", "user__last_name", "admission_no"):
            student_counts = counts.get(student.pk, {})
            present = student_counts.get("present", 0)
            absent = student_counts.get("absent", 0)
            late = student_counts.get("late", 0)
            excused = student_counts.get("excused", 0)
            half_day = student_counts.get("half_day", 0)
            eligible_days = present + absent + late + half_day
            attendance_rate = round((present + late + half_day * 0.5) * 100 / eligible_days, 1) if eligible_days else None
            absence_streak = 0
            for record_status in recent_statuses.get(student.pk, []):
                if record_status != Attendance.Status.ABSENT:
                    break
                absence_streak += 1
            at_risk = attendance_rate is not None and attendance_rate < risk_threshold
            for key, value in (("present", present), ("absent", absent), ("late", late), ("excused", excused), ("half_day", half_day)):
                totals[key] += value
            student_rows.append({
                "student_id": student.pk,
                "name": student.name,
                "admission_no": student.admission_no,
                "grade": student.grade,
                "section": student.section,
                "present": present,
                "absent": absent,
                "late": late,
                "excused": excused,
                "half_day": half_day,
                "attendance_rate": attendance_rate,
                "absence_streak": absence_streak,
                "at_risk": at_risk,
            })

        daily_trend = list(
            records.values("date").annotate(
                present=Count("pk", filter=Q(status=Attendance.Status.PRESENT)),
                absent=Count("pk", filter=Q(status=Attendance.Status.ABSENT)),
                late=Count("pk", filter=Q(status=Attendance.Status.LATE)),
                excused=Count("pk", filter=Q(status=Attendance.Status.EXCUSED)),
                half_day=Count("pk", filter=Q(status=Attendance.Status.HALF_DAY)),
            ).order_by("date")
        )
        eligible_total = totals["present"] + totals["absent"] + totals["late"] + totals["half_day"]
        return Response({
            "start_date": start_date,
            "end_date": end_date,
            "risk_threshold": risk_threshold,
            "summary": {
                "total_students": len(student_rows),
                "present": totals["present"],
                "absent": totals["absent"],
                "late": totals["late"],
                "excused": totals["excused"],
                "half_day": totals["half_day"],
                "at_risk_students": sum(1 for student in student_rows if student["at_risk"]),
                "attendance_rate": round((totals["present"] + totals["late"] + totals["half_day"] * 0.5) * 100 / eligible_total, 1) if eligible_total else None,
            },
            "daily_trend": daily_trend,
            "students": student_rows,
        })

    def get_queryset(self):
        queryset = super().get_queryset()
        date_value = self.request.query_params.get("date")
        if date_value:
            selected_date = parse_date(date_value)
            if selected_date is None:
                raise ValidationError({"date": "Enter a valid date in YYYY-MM-DD format."})
            queryset = queryset.filter(date=selected_date)
        grade = self.request.query_params.get("grade")
        section = self.request.query_params.get("section")
        if grade:
            queryset = queryset.filter(student__grade=grade)
        if section:
            queryset = queryset.filter(student__section=section)
        return queryset