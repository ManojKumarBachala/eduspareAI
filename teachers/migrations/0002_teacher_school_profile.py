import django.db.models.deletion
from django.db import migrations, models


def assign_teacher_school(apps, schema_editor):
    Teacher = apps.get_model("teachers", "Teacher")
    School = apps.get_model("accounts", "School")
    existing_schools = list(School.objects.order_by("pk")[:2])
    fallback_school = existing_schools[0] if len(existing_schools) == 1 else None

    if fallback_school is None and Teacher.objects.filter(school__isnull=True).exists():
        fallback_school, _ = School.objects.get_or_create(
            slug="legacy-teachers",
            defaults={"name": "Legacy Teacher Records"},
        )

    if fallback_school:
        Teacher.objects.filter(school__isnull=True).update(school_id=fallback_school.pk)


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0002_school_tenancy"),
        ("teachers", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="teacher",
            name="school",
            field=models.ForeignKey(
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="teachers",
                to="accounts.school",
            ),
        ),
        migrations.AddField(
            model_name="teacher",
            name="user",
            field=models.OneToOneField(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="teacher_profile",
                to="accounts.user",
            ),
        ),
        migrations.RunPython(assign_teacher_school, migrations.RunPython.noop),
        migrations.AlterField(
            model_name="teacher",
            name="school",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name="teachers",
                to="accounts.school",
            ),
        ),
        migrations.AlterField(
            model_name="teacher",
            name="email",
            field=models.EmailField(max_length=254),
        ),
        migrations.AddConstraint(
            model_name="teacher",
            constraint=models.UniqueConstraint(
                fields=("school", "email"),
                name="unique_teacher_email_per_school",
            ),
        ),
        migrations.AlterModelOptions(
            name="teacher",
            options={"ordering": ("name",)},
        ),
    ]
