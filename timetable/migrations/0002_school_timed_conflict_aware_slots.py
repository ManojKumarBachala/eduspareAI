import django.db.models.deletion
from django.db import migrations, models


def assign_school_and_resolve_duplicate_slots(apps, schema_editor):
    School = apps.get_model("accounts", "School")
    Student = apps.get_model("students", "Student")
    Timetable = apps.get_model("timetable", "Timetable")
    legacy_school = None

    for entry_id, grade, section in list(
        Timetable.objects.filter(school__isnull=True).values_list("pk", "grade", "section")
    ):
        school_ids = list(
            Student.objects.filter(grade=grade, section=section)
            .values_list("school_id", flat=True)
            .distinct()[:2]
        )
        if len(school_ids) == 1:
            school_id = school_ids[0]
        else:
            if legacy_school is None:
                legacy_school, _ = School.objects.get_or_create(
                    slug="legacy-timetable",
                    defaults={"name": "Legacy Timetable Records"},
                )
            school_id = legacy_school.pk
        Timetable.objects.filter(pk=entry_id).update(school_id=school_id)

    used_classes = set()
    used_teachers = set()
    used_rooms = set()
    for entry in Timetable.objects.order_by("pk").values(
        "pk", "school_id", "day", "period", "grade", "section", "teacher_id", "room",
    ):
        period = entry["period"]
        class_key = (entry["school_id"], entry["day"], period, entry["grade"], entry["section"])
        teacher_key = (entry["school_id"], entry["day"], period, entry["teacher_id"])
        room_key = (entry["school_id"], entry["day"], period, entry["room"].casefold())
        while class_key in used_classes or teacher_key in used_teachers or (entry["room"] and room_key in used_rooms):
            period += 1
            class_key = (entry["school_id"], entry["day"], period, entry["grade"], entry["section"])
            teacher_key = (entry["school_id"], entry["day"], period, entry["teacher_id"])
            room_key = (entry["school_id"], entry["day"], period, entry["room"].casefold())
        if period != entry["period"]:
            Timetable.objects.filter(pk=entry["pk"]).update(period=period)
        used_classes.add(class_key)
        used_teachers.add(teacher_key)
        if entry["room"]:
            used_rooms.add(room_key)


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0002_school_tenancy"),
        ("students", "0002_student_school_and_admission_scope"),
        ("teachers", "0002_teacher_school_profile"),
        ("timetable", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="timetable",
            name="school",
            field=models.ForeignKey(
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="timetable_entries",
                to="accounts.school",
            ),
        ),
        migrations.AddField(
            model_name="timetable",
            name="start_time",
            field=models.TimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="timetable",
            name="end_time",
            field=models.TimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="timetable",
            name="room",
            field=models.CharField(blank=True, max_length=60),
        ),
        migrations.AddField(
            model_name="timetable",
            name="notes",
            field=models.CharField(blank=True, max_length=300),
        ),
        migrations.RunPython(assign_school_and_resolve_duplicate_slots, migrations.RunPython.noop),
        migrations.AlterField(
            model_name="timetable",
            name="school",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name="timetable_entries",
                to="accounts.school",
            ),
        ),
        migrations.AlterField(
            model_name="timetable",
            name="day",
            field=models.CharField(
                choices=[
                    ("Monday", "Monday"),
                    ("Tuesday", "Tuesday"),
                    ("Wednesday", "Wednesday"),
                    ("Thursday", "Thursday"),
                    ("Friday", "Friday"),
                    ("Saturday", "Saturday"),
                    ("Sunday", "Sunday"),
                ],
                max_length=20,
            ),
        ),
        migrations.AlterField(
            model_name="timetable",
            name="period",
            field=models.PositiveSmallIntegerField(),
        ),
        migrations.AlterField(
            model_name="timetable",
            name="teacher",
            field=models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, to="teachers.teacher"),
        ),
        migrations.AddConstraint(
            model_name="timetable",
            constraint=models.UniqueConstraint(
                fields=("school", "day", "period", "grade", "section"),
                name="unique_timetable_slot_per_school",
            ),
        ),
        migrations.AddConstraint(
            model_name="timetable",
            constraint=models.UniqueConstraint(
                fields=("school", "day", "period", "teacher"),
                name="unique_teacher_timetable_slot_per_school",
            ),
        ),
        migrations.AddConstraint(
            model_name="timetable",
            constraint=models.UniqueConstraint(
                condition=~models.Q(room=""),
                fields=("school", "day", "period", "room"),
                name="unique_room_timetable_slot_per_school",
            ),
        ),
        migrations.AlterModelOptions(
            name="timetable",
            options={"ordering": ("day", "grade", "section", "period")},
        ),
    ]
