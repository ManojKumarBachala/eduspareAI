from rest_framework import serializers

from students.models import Student

from .models import Route, StudentTransportAssignment, Vehicle, VehicleMaintenance


class VehicleSerializer(serializers.ModelSerializer):
    compliance_status = serializers.ReadOnlyField()
    active_routes = serializers.SerializerMethodField()

    class Meta:
        model = Vehicle
        fields = (
            "id", "vehicle_no", "driver_name", "driver_phone", "vehicle_type", "status",
            "fuel_type", "make", "model", "year", "capacity", "odometer_km",
            "insurance_expiry", "fitness_expiry", "permit_expiry", "next_service_due",
            "notes", "compliance_status", "active_routes",
        )
        read_only_fields = ("id", "compliance_status", "active_routes")

    def validate_vehicle_no(self, value):
        request = self.context.get("request")
        view = self.context.get("view")
        school = view.get_school() if view and hasattr(view, "get_school") else getattr(request.user, "school", None)
        if school:
            vehicles = Vehicle.objects.filter(school=school, vehicle_no__iexact=value)
            if self.instance:
                vehicles = vehicles.exclude(pk=self.instance.pk)
            if vehicles.exists():
                raise serializers.ValidationError("This registration number is already in use.")
        return value

    def get_active_routes(self, vehicle):
        return vehicle.routes.filter(is_active=True).count()


class RouteSerializer(serializers.ModelSerializer):
    vehicle_no = serializers.CharField(source="assigned_vehicle.vehicle_no", read_only=True, default="")
    driver_name = serializers.CharField(source="assigned_vehicle.driver_name", read_only=True, default="")
    assigned_students = serializers.SerializerMethodField()

    class Meta:
        model = Route
        fields = (
            "id", "route_name", "start_point", "end_point", "stops", "distance_km",
            "estimated_minutes", "pickup_time", "dropoff_time", "assigned_vehicle",
            "vehicle_no", "driver_name", "is_active", "assigned_students",
        )
        read_only_fields = ("id", "vehicle_no", "driver_name", "assigned_students")

    def get_assigned_students(self, route):
        return route.student_assignments.filter(is_active=True).count()

    def validate_stops(self, value):
        if not isinstance(value, list) or any(not isinstance(stop, str) or not stop.strip() for stop in value):
            raise serializers.ValidationError("Stops must be a list of non-empty names.")
        return [stop.strip() for stop in value]

    def validate(self, attrs):
        request = self.context.get("request")
        view = self.context.get("view")
        school = view.get_school() if view and hasattr(view, "get_school") else getattr(request.user, "school", None)
        vehicle = attrs.get("assigned_vehicle", self.instance.assigned_vehicle if self.instance else None)
        if vehicle and school and vehicle.school_id != school.pk:
            raise serializers.ValidationError({"assigned_vehicle": "Choose a vehicle from this school."})
        return attrs


class StudentTransportAssignmentSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source="student.name", read_only=True)
    admission_no = serializers.CharField(source="student.admission_no", read_only=True)
    grade = serializers.CharField(source="student.grade", read_only=True)
    section = serializers.CharField(source="student.section", read_only=True)
    route_name = serializers.CharField(source="route.route_name", read_only=True)

    class Meta:
        model = StudentTransportAssignment
        fields = (
            "id", "student", "student_name", "admission_no", "grade", "section", "route",
            "route_name", "pickup_stop", "dropoff_stop", "start_date", "end_date", "is_active", "notes",
        )
        read_only_fields = ("id", "student_name", "admission_no", "grade", "section", "route_name")

    def validate(self, attrs):
        request = self.context.get("request")
        view = self.context.get("view")
        school = view.get_school() if view and hasattr(view, "get_school") else getattr(request.user, "school", None)
        student = attrs.get("student", self.instance.student if self.instance else None)
        route = attrs.get("route", self.instance.route if self.instance else None)
        is_active = attrs.get("is_active", self.instance.is_active if self.instance else True)
        if school and student and student.school_id != school.pk:
            raise serializers.ValidationError({"student": "Choose a student from this school."})
        if school and route and route.school_id != school.pk:
            raise serializers.ValidationError({"route": "Choose a route from this school."})
        if is_active and route and route.assigned_vehicle_id:
            active_count = route.student_assignments.filter(is_active=True).exclude(pk=self.instance.pk if self.instance else None).count()
            if active_count >= route.assigned_vehicle.capacity:
                raise serializers.ValidationError({"route": "This route has reached the assigned vehicle capacity."})
        return attrs


class VehicleMaintenanceSerializer(serializers.ModelSerializer):
    vehicle_no = serializers.CharField(source="vehicle.vehicle_no", read_only=True)

    class Meta:
        model = VehicleMaintenance
        fields = (
            "id", "vehicle", "vehicle_no", "kind", "description", "service_date", "odometer_km",
            "cost", "vendor", "next_service_due", "notes",
        )
        read_only_fields = ("id", "vehicle_no")

    def validate_vehicle(self, value):
        request = self.context.get("request")
        view = self.context.get("view")
        school = view.get_school() if view and hasattr(view, "get_school") else getattr(request.user, "school", None)
        if school and value.school_id != school.pk:
            raise serializers.ValidationError("Choose a vehicle from this school.")
        return value

    def create(self, validated_data):
        record = super().create(validated_data)
        vehicle = record.vehicle
        vehicle.odometer_km = max(vehicle.odometer_km, record.odometer_km)
        if record.next_service_due:
            vehicle.next_service_due = record.next_service_due
        vehicle.save(update_fields=("odometer_km", "next_service_due"))
        return record