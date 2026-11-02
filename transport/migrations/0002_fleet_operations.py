import django.db.models.deletion
import django.utils.timezone
from django.db import migrations, models
from django.db.models import Q


def assign_transport_school_and_normalize(apps, schema_editor):
    School = apps.get_model("accounts", "School")
    Vehicle = apps.get_model("transport", "Vehicle")
    Route = apps.get_model("transport", "Route")
    schools = list(School.objects.order_by("pk")[:2])
    school = schools[0] if len(schools) == 1 else None
    if school is None and (
        Vehicle.objects.filter(school__isnull=True).exists()
        or Route.objects.filter(school__isnull=True).exists()
    ):
        school, _ = School.objects.get_or_create(
            slug="legacy-transport",
            defaults={"name": "Legacy Transport Records"},
        )

    if school:
        Vehicle.objects.filter(school__isnull=True).update(school_id=school.pk)
        Route.objects.filter(school__isnull=True).update(school_id=school.pk)

    Vehicle.objects.filter(capacity__lte=0).update(capacity=1)

    seen_route_names = set()
    for route in Route.objects.order_by("pk").values("pk", "school_id", "route_name"):
        key = (route["school_id"], route["route_name"].casefold())
        if key in seen_route_names:
            suffix = 2
            candidate = f"{route['route_name']} ({suffix})"
            while (route["school_id"], candidate.casefold()) in seen_route_names:
                suffix += 1
                candidate = f"{route['route_name']} ({suffix})"
            Route.objects.filter(pk=route["pk"]).update(route_name=candidate)
            key = (route["school_id"], candidate.casefold())
        seen_route_names.add(key)


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0002_school_tenancy"),
        ("students", "0002_student_school_and_admission_scope"),
        ("transport", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="vehicle",
            name="school",
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.CASCADE, related_name="vehicles", to="accounts.school"),
        ),
        migrations.AddField(
            model_name="route",
            name="school",
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.CASCADE, related_name="routes", to="accounts.school"),
        ),
        migrations.AddField(model_name="vehicle", name="driver_phone", field=models.CharField(blank=True, max_length=20)),
        migrations.AddField(model_name="vehicle", name="vehicle_type", field=models.CharField(choices=[("BUS", "Bus"), ("MINIBUS", "Minibus"), ("VAN", "Van"), ("CAR", "Car"), ("OTHER", "Other")], default="BUS", max_length=10)),
        migrations.AddField(model_name="vehicle", name="status", field=models.CharField(choices=[("ACTIVE", "Active"), ("SERVICE", "In service"), ("RETIRED", "Retired")], default="ACTIVE", max_length=10)),
        migrations.AddField(model_name="vehicle", name="fuel_type", field=models.CharField(choices=[("DIESEL", "Diesel"), ("PETROL", "Petrol"), ("CNG", "CNG"), ("ELECTRIC", "Electric"), ("OTHER", "Other")], default="DIESEL", max_length=10)),
        migrations.AddField(model_name="vehicle", name="make", field=models.CharField(blank=True, max_length=60)),
        migrations.AddField(model_name="vehicle", name="model", field=models.CharField(blank=True, max_length=60)),
        migrations.AddField(model_name="vehicle", name="year", field=models.PositiveSmallIntegerField(blank=True, null=True)),
        migrations.AddField(model_name="vehicle", name="odometer_km", field=models.PositiveIntegerField(default=0)),
        migrations.AddField(model_name="vehicle", name="insurance_expiry", field=models.DateField(blank=True, null=True)),
        migrations.AddField(model_name="vehicle", name="fitness_expiry", field=models.DateField(blank=True, null=True)),
        migrations.AddField(model_name="vehicle", name="permit_expiry", field=models.DateField(blank=True, null=True)),
        migrations.AddField(model_name="vehicle", name="next_service_due", field=models.DateField(blank=True, null=True)),
        migrations.AddField(model_name="vehicle", name="notes", field=models.CharField(blank=True, max_length=300)),
        migrations.AddField(model_name="route", name="stops", field=models.JSONField(blank=True, default=list)),
        migrations.AddField(model_name="route", name="distance_km", field=models.DecimalField(decimal_places=2, default=0, max_digits=7)),
        migrations.AddField(model_name="route", name="estimated_minutes", field=models.PositiveSmallIntegerField(default=0)),
        migrations.AddField(model_name="route", name="pickup_time", field=models.TimeField(blank=True, null=True)),
        migrations.AddField(model_name="route", name="dropoff_time", field=models.TimeField(blank=True, null=True)),
        migrations.AddField(model_name="route", name="is_active", field=models.BooleanField(default=True)),
        migrations.AddField(model_name="route", name="assigned_vehicle", field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="routes", to="transport.vehicle")),
        migrations.RunPython(assign_transport_school_and_normalize, migrations.RunPython.noop),
        migrations.AlterField(model_name="vehicle", name="school", field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="vehicles", to="accounts.school")),
        migrations.AlterField(model_name="route", name="school", field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="routes", to="accounts.school")),
        migrations.AlterField(model_name="vehicle", name="capacity", field=models.PositiveSmallIntegerField()),
        migrations.AddConstraint(model_name="vehicle", constraint=models.CheckConstraint(condition=Q(capacity__gt=0), name="vehicle_capacity_must_be_positive")),
        migrations.AddConstraint(model_name="route", constraint=models.UniqueConstraint(fields=("school", "route_name"), name="unique_route_per_school")),
        migrations.CreateModel(
            name="VehicleMaintenance",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("kind", models.CharField(choices=[("SERVICE", "Service"), ("REPAIR", "Repair"), ("INSPECTION", "Inspection"), ("TYRES", "Tyres"), ("OTHER", "Other")], max_length=12)),
                ("description", models.CharField(max_length=200)),
                ("service_date", models.DateField(default=django.utils.timezone.localdate)),
                ("odometer_km", models.PositiveIntegerField()),
                ("cost", models.DecimalField(decimal_places=2, default=0, max_digits=10)),
                ("vendor", models.CharField(blank=True, max_length=100)),
                ("next_service_due", models.DateField(blank=True, null=True)),
                ("notes", models.CharField(blank=True, max_length=300)),
                ("school", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="vehicle_maintenance", to="accounts.school")),
                ("vehicle", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="maintenance_records", to="transport.vehicle")),
            ],
            options={"ordering": ("-service_date", "-pk")},
        ),
        migrations.AddConstraint(model_name="vehiclemaintenance", constraint=models.CheckConstraint(condition=Q(cost__gte=0), name="maintenance_cost_nonnegative")),
        migrations.CreateModel(
            name="StudentTransportAssignment",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("pickup_stop", models.CharField(max_length=100)),
                ("dropoff_stop", models.CharField(max_length=100)),
                ("start_date", models.DateField(default=django.utils.timezone.localdate)),
                ("end_date", models.DateField(blank=True, null=True)),
                ("is_active", models.BooleanField(default=True)),
                ("notes", models.CharField(blank=True, max_length=300)),
                ("route", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="student_assignments", to="transport.route")),
                ("school", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="transport_assignments", to="accounts.school")),
                ("student", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="transport_assignments", to="students.student")),
            ],
            options={"ordering": ("route__route_name", "student__admission_no")},
        ),
        migrations.AddConstraint(model_name="studenttransportassignment", constraint=models.UniqueConstraint(condition=Q(is_active=True), fields=("school", "student"), name="unique_active_transport_assignment_per_student")),
        migrations.AlterModelOptions(name="vehicle", options={"ordering": ("vehicle_no",)}),
        migrations.AlterModelOptions(name="route", options={"ordering": ("route_name",)}),
    ]
