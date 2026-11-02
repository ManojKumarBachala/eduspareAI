import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="School",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=160)),
                ("slug", models.SlugField(max_length=80, unique=True)),
                ("email", models.EmailField(blank=True, max_length=254)),
                ("phone", models.CharField(blank=True, max_length=20)),
                ("address", models.TextField(blank=True)),
                ("city", models.CharField(blank=True, max_length=100)),
                ("website", models.URLField(blank=True)),
                ("logo_url", models.URLField(blank=True)),
                ("primary_color", models.CharField(default="#2563EB", max_length=7)),
                ("about", models.TextField(blank=True)),
                ("plan", models.CharField(choices=[("STARTER", "Starter"), ("PROFESSIONAL", "Professional"), ("ENTERPRISE", "Enterprise")], default="STARTER", max_length=20)),
                ("is_active", models.BooleanField(default=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={"ordering": ("name",)},
        ),
        migrations.AddField(
            model_name="user",
            name="school",
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="users", to="accounts.school"),
        ),
        migrations.AlterField(
            model_name="user",
            name="phone",
            field=models.CharField(blank=True, max_length=20),
        ),
        migrations.AlterField(
            model_name="user",
            name="role",
            field=models.CharField(
                choices=[
                    ("PLATFORM_ADMIN", "Platform Admin"),
                    ("SCHOOL_ADMIN", "School Admin"),
                    ("TEACHER", "Teacher"),
                    ("STUDENT", "Student"),
                    ("PARENT", "Parent"),
                    ("ADMIN", "School Admin (legacy)"),
                ],
                default="STUDENT",
                max_length=20,
            ),
        ),
    ]
