from django.db import models
from django.db.models import Q
from django.utils import timezone

from accounts.models import School


class Vehicle(models.Model):
    class VehicleType(models.TextChoices):
        BUS = "BUS", "Bus"
        MINIBUS = "MINIBUS", "Minibus"
        VAN = "VAN", "Van"
        CAR = "CAR", "Car"
        OTHER = "OTHER", "Other"

    class Status(models.TextChoices):
        ACTIVE = "ACTIVE", "Active"
        SERVICE = "SERVICE", "In service"
        RETIRED = "RETIRED", "Retired"

    class FuelType(models.TextChoices):
        DIESEL = "DIESEL", "Diesel"
        PETROL = "PETROL", "Petrol"
        CNG = "CNG", "CNG"
        ELECTRIC = "ELECTRIC", "Electric"
        OTHER = "OTHER", "Other"

    school = models.ForeignKey(
        School,
        on_delete=models.CASCADE,
        related_name="vehicles",
    )
    vehicle_no = models.CharField(max_length=50)
    driver_name = models.CharField(max_length=100)
    driver_phone = models.CharField(max_length=20, blank=True)
    vehicle_type = models.CharField(max_length=10, choices=VehicleType.choices, default=VehicleType.BUS)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.ACTIVE)
    fuel_type = models.CharField(max_length=10, choices=FuelType.choices, default=FuelType.DIESEL)
    make = models.CharField(max_length=60, blank=True)
    model = models.CharField(max_length=60, blank=True)
    year = models.PositiveSmallIntegerField(null=True, blank=True)
    capacity = models.PositiveSmallIntegerField()
    odometer_km = models.PositiveIntegerField(default=0)
    insurance_expiry = models.DateField(null=True, blank=True)
    fitness_expiry = models.DateField(null=True, blank=True)
    permit_expiry = models.DateField(null=True, blank=True)
    next_service_due = models.DateField(null=True, blank=True)
    notes = models.CharField(max_length=300, blank=True)

    class Meta:
        ordering = ("vehicle_no",)
        constraints = [
            models.CheckConstraint(condition=Q(capacity__gt=0), name="vehicle_capacity_must_be_positive"),
        ]

    @property
    def compliance_status(self):
        today = timezone.localdate()
        expiry_dates = (self.insurance_expiry, self.fitness_expiry, self.permit_expiry, self.next_service_due)
        if any(value and value < today for value in expiry_dates):
            return "OVERDUE"
        if any(value and (value - today).days <= 30 for value in expiry_dates):
            return "DUE_SOON"
        return "CURRENT"

    def __str__(self):
        return self.vehicle_no


class Route(models.Model):
    school = models.ForeignKey(
        School,
        on_delete=models.CASCADE,
        related_name="routes",
    )
    route_name = models.CharField(max_length=100)
    start_point = models.CharField(max_length=100)
    end_point = models.CharField(max_length=100)
    stops = models.JSONField(default=list, blank=True)
    distance_km = models.DecimalField(max_digits=7, decimal_places=2, default=0)
    estimated_minutes = models.PositiveSmallIntegerField(default=0)
    pickup_time = models.TimeField(null=True, blank=True)
    dropoff_time = models.TimeField(null=True, blank=True)
    assigned_vehicle = models.ForeignKey(
        Vehicle,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="routes",
    )
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ("route_name",)
        constraints = [
            models.UniqueConstraint(
                fields=("school", "route_name"),
                name="unique_route_per_school",
            ),
        ]

    def __str__(self):
        return self.route_name


class StudentTransportAssignment(models.Model):
    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name="transport_assignments")
    student = models.ForeignKey("students.Student", on_delete=models.CASCADE, related_name="transport_assignments")
    route = models.ForeignKey(Route, on_delete=models.PROTECT, related_name="student_assignments")
    pickup_stop = models.CharField(max_length=100)
    dropoff_stop = models.CharField(max_length=100)
    start_date = models.DateField(default=timezone.localdate)
    end_date = models.DateField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    notes = models.CharField(max_length=300, blank=True)

    class Meta:
        ordering = ("route__route_name", "student__admission_no")
        constraints = [
            models.UniqueConstraint(
                fields=("school", "student"),
                condition=Q(is_active=True),
                name="unique_active_transport_assignment_per_student",
            ),
        ]


class VehicleMaintenance(models.Model):
    class Kind(models.TextChoices):
        SERVICE = "SERVICE", "Service"
        REPAIR = "REPAIR", "Repair"
        INSPECTION = "INSPECTION", "Inspection"
        TYRES = "TYRES", "Tyres"
        OTHER = "OTHER", "Other"

    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name="vehicle_maintenance")
    vehicle = models.ForeignKey(Vehicle, on_delete=models.CASCADE, related_name="maintenance_records")
    kind = models.CharField(max_length=12, choices=Kind.choices)
    description = models.CharField(max_length=200)
    service_date = models.DateField(default=timezone.localdate)
    odometer_km = models.PositiveIntegerField()
    cost = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    vendor = models.CharField(max_length=100, blank=True)
    next_service_due = models.DateField(null=True, blank=True)
    notes = models.CharField(max_length=300, blank=True)

    class Meta:
        ordering = ("-service_date", "-pk")
        constraints = [
            models.CheckConstraint(condition=Q(cost__gte=0), name="maintenance_cost_nonnegative"),
        ]

    def __str__(self):
        return self.route_name
