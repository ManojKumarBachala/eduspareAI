import django.db.models.deletion
from django.db import migrations, models
from django.db.models import F, Q


def assign_fee_school(apps, schema_editor):
    Fee = apps.get_model("fees", "Fee")
    Student = apps.get_model("students", "Student")
    for fee_id, student_id in list(
        Fee.objects.filter(school__isnull=True).values_list("pk", "student_id")
    ):
        school_id = Student.objects.values_list("school_id", flat=True).get(pk=student_id)
        Fee.objects.filter(pk=fee_id).update(school_id=school_id)


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0002_school_tenancy"),
        ("students", "0002_student_school_and_admission_scope"),
        ("fees", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="fee",
            name="school",
            field=models.ForeignKey(
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="fees",
                to="accounts.school",
            ),
        ),
        migrations.AddField(
            model_name="fee",
            name="title",
            field=models.CharField(default="Tuition fee", max_length=120),
        ),
        migrations.AddField(
            model_name="fee",
            name="category",
            field=models.CharField(
                choices=[
                    ("TUITION", "Tuition"),
                    ("ADMISSION", "Admission"),
                    ("TRANSPORT", "Transport"),
                    ("EXAM", "Examination"),
                    ("BOOKS", "Books and supplies"),
                    ("OTHER", "Other"),
                ],
                default="TUITION",
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name="fee",
            name="academic_year",
            field=models.CharField(blank=True, max_length=9),
        ),
        migrations.RunPython(assign_fee_school, migrations.RunPython.noop),
        migrations.AlterField(
            model_name="fee",
            name="school",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name="fees",
                to="accounts.school",
            ),
        ),
        migrations.CreateModel(
            name="FeePayment",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("amount", models.DecimalField(decimal_places=2, max_digits=10)),
                ("method", models.CharField(choices=[("CASH", "Cash"), ("BANK", "Bank transfer"), ("CARD", "Card"), ("UPI", "UPI"), ("CHEQUE", "Cheque"), ("OTHER", "Other")], max_length=10)),
                ("reference", models.CharField(blank=True, max_length=100)),
                ("notes", models.CharField(blank=True, max_length=300)),
                ("receipt_no", models.CharField(blank=True, max_length=32, unique=True)),
                ("paid_at", models.DateTimeField(auto_now_add=True)),
                ("fee", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="payments", to="fees.fee")),
                ("received_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="received_fee_payments", to="accounts.user")),
                ("school", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="fee_payments", to="accounts.school")),
            ],
            options={"ordering": ("-paid_at", "-pk")},
        ),
        migrations.AddConstraint(
            model_name="fee",
            constraint=models.CheckConstraint(condition=Q(amount__gt=0), name="fee_amount_must_be_positive"),
        ),
        migrations.AddConstraint(
            model_name="fee",
            constraint=models.CheckConstraint(condition=Q(paid_amount__gte=0), name="fee_paid_amount_nonnegative"),
        ),
        migrations.AddConstraint(
            model_name="fee",
            constraint=models.CheckConstraint(condition=Q(paid_amount__lte=F("amount")), name="fee_payment_cannot_exceed_amount"),
        ),
        migrations.AddConstraint(
            model_name="feepayment",
            constraint=models.CheckConstraint(condition=Q(amount__gt=0), name="fee_payment_amount_must_be_positive"),
        ),
        migrations.AlterModelOptions(
            name="fee",
            options={"ordering": ("due_date", "student__admission_no")},
        ),
    ]
