from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("attendance", "0004_attendance_late_excused_statuses"),
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
                    ("Half Day", "Half Day"),
                ],
                max_length=10,
            ),
        ),
        migrations.AddField(
            model_name="attendance",
            name="note",
            field=models.CharField(blank=True, max_length=300),
        ),
    ]
