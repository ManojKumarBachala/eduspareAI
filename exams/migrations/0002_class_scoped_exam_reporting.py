import django.db.models.deletion
from django.db import migrations, models
from django.db.models import F, Q


def assign_exam_tenants(apps, schema_editor):
    School = apps.get_model("accounts", "School")
    Student = apps.get_model("students", "Student")
    Exam = apps.get_model("exams", "Exam")
    Result = apps.get_model("exams", "Result")
    schools = list(School.objects.order_by("pk")[:2])
    fallback_school = schools[0] if len(schools) == 1 else None

    for exam_id in Exam.objects.filter(school__isnull=True).values_list("pk", flat=True):
        result_school_ids = list(
            Student.objects.filter(result__exam_id=exam_id)
            .values_list("school_id", flat=True)
            .distinct()[:2]
        )
        if len(result_school_ids) == 1:
            school_id = result_school_ids[0]
        else:
            if fallback_school is None:
                fallback_school, _ = School.objects.get_or_create(
                    slug="legacy-assessments",
                    defaults={"name": "Legacy Exam Records"},
                )
            school_id = fallback_school.pk
        Exam.objects.filter(pk=exam_id).update(school_id=school_id)

    for result_id, student_id in Result.objects.filter(school__isnull=True).values_list("pk", "student_id"):
        school_id = Student.objects.values_list("school_id", flat=True).get(pk=student_id)
        Result.objects.filter(pk=result_id).update(school_id=school_id)


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0002_school_tenancy"),
        ("students", "0002_student_school_and_admission_scope"),
        ("exams", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="exam",
            name="school",
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.CASCADE, related_name="exams", to="accounts.school"),
        ),
        migrations.AddField(
            model_name="exam",
            name="grade",
            field=models.CharField(blank=True, default="", max_length=20),
        ),
        migrations.AddField(
            model_name="exam",
            name="section",
            field=models.CharField(blank=True, default="", max_length=10),
        ),
        migrations.AddField(
            model_name="exam",
            name="academic_year",
            field=models.CharField(blank=True, max_length=9),
        ),
        migrations.AddField(
            model_name="exam",
            name="term",
            field=models.CharField(choices=[("TERM_1", "Term 1"), ("TERM_2", "Term 2"), ("TERM_3", "Term 3"), ("MIDTERM", "Midterm"), ("FINAL", "Final"), ("OTHER", "Other")], default="TERM_1", max_length=10),
        ),
        migrations.AddField(model_name="exam", name="total_marks", field=models.PositiveSmallIntegerField(default=100)),
        migrations.AddField(model_name="exam", name="passing_marks", field=models.PositiveSmallIntegerField(default=35)),
        migrations.AddField(
            model_name="exam",
            name="status",
            field=models.CharField(choices=[("DRAFT", "Draft"), ("SCHEDULED", "Scheduled"), ("PUBLISHED", "Published")], default="DRAFT", max_length=12),
        ),
        migrations.AddField(model_name="exam", name="notes", field=models.CharField(blank=True, max_length=300)),
        migrations.AddField(
            model_name="result",
            name="school",
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.CASCADE, related_name="results", to="accounts.school"),
        ),
        migrations.AddField(model_name="result", name="remarks", field=models.CharField(blank=True, max_length=200)),
        migrations.RunPython(assign_exam_tenants, migrations.RunPython.noop),
        migrations.AlterField(
            model_name="exam",
            name="school",
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="exams", to="accounts.school"),
        ),
        migrations.AlterField(
            model_name="result",
            name="school",
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="results", to="accounts.school"),
        ),
        migrations.AddConstraint(
            model_name="exam",
            constraint=models.UniqueConstraint(fields=("school", "name", "exam_date", "grade", "section"), name="unique_exam_per_school"),
        ),
        migrations.AddConstraint(
            model_name="exam",
            constraint=models.CheckConstraint(condition=Q(total_marks__gt=0), name="exam_total_marks_must_be_positive"),
        ),
        migrations.AddConstraint(
            model_name="exam",
            constraint=models.CheckConstraint(condition=Q(passing_marks__lte=F("total_marks")), name="exam_pass_marks_cannot_exceed_total"),
        ),
        migrations.AddConstraint(
            model_name="result",
            constraint=models.UniqueConstraint(fields=("school", "student", "exam", "subject"), name="unique_student_result_per_subject"),
        ),
        migrations.AddConstraint(
            model_name="result",
            constraint=models.CheckConstraint(condition=Q(marks__gte=0), name="result_marks_nonnegative"),
        ),
        migrations.AlterModelOptions(name="exam", options={"ordering": ("-exam_date", "name")}),
    ]
