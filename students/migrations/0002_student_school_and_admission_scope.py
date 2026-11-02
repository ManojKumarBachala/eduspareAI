import django.db.models.deletion
from django.db import migrations, models


def assign_existing_students_to_schools(apps, schema_editor):
    Student = apps.get_model("students", "Student")
    User = apps.get_model("accounts", "User")
    School = apps.get_model("accounts", "School")
    fallback_school = None

    for student in Student.objects.filter(school__isnull=True).iterator():
        user = User.objects.get(pk=student.user_id)
        school_id = user.school_id
        if school_id is None:
            if fallback_school is None:
                fallback_school, _ = School.objects.get_or_create(
                    slug="legacy-students",
                    defaults={"name": "Legacy Student Records"},
                )
            school_id = fallback_school.pk
            User.objects.filter(pk=user.pk, school__isnull=True).update(school_id=school_id)
        Student.objects.filter(pk=student.pk).update(school_id=school_id)


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0002_school_tenancy"),
        ("students", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="student",
            name="school",
            field=models.ForeignKey(
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="students",
                to="accounts.school",
            ),
        ),
        migrations.RunPython(assign_existing_students_to_schools, migrations.RunPython.noop),
        migrations.AlterField(
            model_name="student",
            name="school",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name="students",
                to="accounts.school",
            ),
        ),
        migrations.AlterField(
            model_name="student",
            name="admission_no",
            field=models.CharField(max_length=50),
        ),
        migrations.AlterField(
            model_name="student",
            name="user",
            field=models.OneToOneField(
                on_delete=django.db.models.deletion.CASCADE,
                related_name="student_profile",
                to="accounts.user",
            ),
        ),
        migrations.AddConstraint(
            model_name="student",
            constraint=models.UniqueConstraint(
                fields=("school", "admission_no"),
                name="unique_student_admission_no_per_school",
            ),
        ),
        migrations.AlterModelOptions(
            name="student",
            options={"ordering": ("admission_no",)},
        ),
    ]
