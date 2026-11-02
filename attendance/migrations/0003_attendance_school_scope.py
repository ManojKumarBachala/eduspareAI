from django.db import migrations, models
import django.db.models.deletion
from django.db.models import Count


def assign_school_and_remove_duplicate_days(apps, schema_editor):
    Attendance = apps.get_model("attendance", "Attendance")
    Student = apps.get_model("students", "Student")
    rows_to_update = list(
        Attendance.objects.filter(school__isnull=True).values_list("pk", "student_id")
    )
    for attendance_id, student_id in rows_to_update:
        school_id = Student.objects.values_list("school_id", flat=True).get(pk=student_id)
        Attendance.objects.filter(pk=attendance_id).update(school_id=school_id)

    duplicate_groups = (
        Attendance.objects.values("student_id", "date")
        .annotate(record_count=Count("pk"))
        .filter(record_count__gt=1)
    )
    for group in duplicate_groups:
        duplicate_ids = list(
            Attendance.objects.filter(
                student_id=group["student_id"],
                date=group["date"],
            ).order_by("-pk").values_list("pk", flat=True)
        )
        Attendance.objects.filter(pk__in=duplicate_ids[1:]).delete()


class Migration(migrations.Migration):
    dependencies = [
        ("students", "0002_student_school_and_admission_scope"),
        ("attendance", "0002_remove_attendance_created_at_alter_attendance_status"),
    ]

    operations = [
        migrations.AddField(
            model_name="attendance",
            name="school",
            field=models.ForeignKey(
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="attendance_records",
                to="accounts.school",
            ),
        ),
        migrations.RunPython(assign_school_and_remove_duplicate_days, migrations.RunPython.noop),
        migrations.AlterField(
            model_name="attendance",
            name="school",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name="attendance_records",
                to="accounts.school",
            ),
        ),
        migrations.AddConstraint(
            model_name="attendance",
            constraint=models.UniqueConstraint(
                fields=("school", "student", "date"),
                name="unique_student_attendance_per_day",
            ),
        ),
        migrations.AlterModelOptions(
            name="attendance",
            options={"ordering": ("-date",)},
        ),
    ]
