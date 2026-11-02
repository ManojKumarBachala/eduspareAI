from django.db.models import Count, Q
from datetime import timedelta
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, SAFE_METHODS
from rest_framework.response import Response
from rest_framework_simplejwt.authentication import JWTAuthentication

from accounts.permissions import IsSchoolAdministrator, IsSchoolStaff
from accounts.tenancy import SchoolScopedModelViewSet
from students.models import Student

from .models import Route, StudentTransportAssignment, Vehicle, VehicleMaintenance
from .serializers import (
    RouteSerializer,
    StudentTransportAssignmentSerializer,
    VehicleMaintenanceSerializer,
    VehicleSerializer,
)


class SchoolTransportViewSet(SchoolScopedModelViewSet):
    authentication_classes = (JWTAuthentication,)

    def get_permissions(self):
        permission = IsSchoolStaff if self.request.method in SAFE_METHODS else IsSchoolAdministrator
        return [IsAuthenticated(), permission()]


class VehicleViewSet(SchoolTransportViewSet):
    queryset = Vehicle.objects.all()
    serializer_class = VehicleSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        status_filter = self.request.query_params.get("status")
        search = self.request.query_params.get("q", "").strip()
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        if search:
            queryset = queryset.filter(
                Q(vehicle_no__icontains=search)
                | Q(driver_name__icontains=search)
                | Q(make__icontains=search)
                | Q(model__icontains=search)
            )
        return queryset.order_by("vehicle_no")

    @action(detail=False, methods=("get",), url_path="summary")
    def summary(self, request):
        school = self.get_school()
        vehicles = Vehicle.objects.filter(school=school)
        today = timezone.localdate()
        return Response({
            "vehicle_count": vehicles.count(),
            "can_manage": request.user.is_school_admin,
            "active_vehicles": vehicles.filter(status=Vehicle.Status.ACTIVE).count(),
            "in_service": vehicles.filter(status=Vehicle.Status.SERVICE).count(),
            "retired": vehicles.filter(status=Vehicle.Status.RETIRED).count(),
            "compliance_due": vehicles.filter(
                Q(insurance_expiry__lte=today + timedelta(days=30))
                | Q(fitness_expiry__lte=today + timedelta(days=30))
                | Q(permit_expiry__lte=today + timedelta(days=30))
                | Q(next_service_due__lte=today + timedelta(days=30))
            ).distinct().count(),
            "active_routes": Route.objects.filter(school=school, is_active=True).count(),
            "assigned_students": StudentTransportAssignment.objects.filter(school=school, is_active=True).count(),
            "maintenance_due": vehicles.filter(next_service_due__lte=today + timedelta(days=30)).count(),
        })


class RouteViewSet(SchoolTransportViewSet):
    queryset = Route.objects.select_related("assigned_vehicle").all()
    serializer_class = RouteSerializer
    tenant_related_fields = ("assigned_vehicle",)

    def get_queryset(self):
        queryset = super().get_queryset()
        active = self.request.query_params.get("active")
        if active in ("true", "false"):
            queryset = queryset.filter(is_active=(active == "true"))
        return queryset.order_by("route_name")


class StudentTransportAssignmentViewSet(SchoolTransportViewSet):
    queryset = StudentTransportAssignment.objects.select_related("student", "student__user", "route").all()
    serializer_class = StudentTransportAssignmentSerializer
    tenant_related_fields = ("student", "route")

    def get_queryset(self):
        queryset = super().get_queryset()
        route = self.request.query_params.get("route")
        active = self.request.query_params.get("active")
        if route:
            queryset = queryset.filter(route_id=route)
        if active in ("true", "false"):
            queryset = queryset.filter(is_active=(active == "true"))
        return queryset

    @action(detail=False, methods=("get",), url_path="student-options")
    def student_options(self, request):
        school = self.get_school()
        students = Student.objects.filter(school=school).select_related("user").order_by("grade", "section", "admission_no")
        return Response([
            {
                "id": student.pk,
                "name": student.name,
                "admission_no": student.admission_no,
                "grade": student.grade,
                "section": student.section,
                "assigned": StudentTransportAssignment.objects.filter(
                    school=school, student=student, is_active=True,
                ).exists(),
            }
            for student in students
        ])


class VehicleMaintenanceViewSet(SchoolTransportViewSet):
    queryset = VehicleMaintenance.objects.select_related("vehicle").all()
    serializer_class = VehicleMaintenanceSerializer
    tenant_related_fields = ("vehicle",)

    def get_queryset(self):
        queryset = super().get_queryset()
        vehicle = self.request.query_params.get("vehicle")
        if vehicle:
            queryset = queryset.filter(vehicle_id=vehicle)
        return queryset.order_by("-service_date", "-pk")

    def perform_create(self, serializer):
        serializer.save(school=self.get_school())