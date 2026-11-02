from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("attendance", "0003_attendance_school_scope"),
    ]

    operations = [
        migrations.AlterField(
            model_name="attendance",
            name="status",
            field=models.CharField(
                choices=[
                    ("Present", "Present"),
                    ("Absent", "Absent"),
                    ("Late", "Late"),
                    ("Excused", "Excused"),
                ],
                max_length=10,
            ),
        ),
    ]
