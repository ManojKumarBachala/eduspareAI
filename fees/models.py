from django.conf import settings
from django.db import models
from django.db.models import F, Q
from django.utils import timezone

from accounts.models import School
from students.models import Student


class Fee(models.Model):
    class Category(models.TextChoices):
        TUITION = "TUITION", "Tuition"
        ADMISSION = "ADMISSION", "Admission"
        TRANSPORT = "TRANSPORT", "Transport"
        EXAM = "EXAM", "Examination"
        BOOKS = "BOOKS", "Books and supplies"
        OTHER = "OTHER", "Other"

    school = models.ForeignKey(
        School,
        on_delete=models.CASCADE,
        related_name="fees",
    )
    student = models.ForeignKey(Student, on_delete=models.CASCADE)
    title = models.CharField(max_length=120, default="Tuition fee")
    category = models.CharField(max_length=20, choices=Category.choices, default=Category.TUITION)
    academic_year = models.CharField(max_length=9, blank=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    paid_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    due_date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("due_date", "student__admission_no")
        constraints = [
            models.CheckConstraint(condition=Q(amount__gt=0), name="fee_amount_must_be_positive"),
            models.CheckConstraint(condition=Q(paid_amount__gte=0), name="fee_paid_amount_nonnegative"),
            models.CheckConstraint(condition=Q(paid_amount__lte=F("amount")), name="fee_payment_cannot_exceed_amount"),
        ]

    @property
    def balance(self):
        return self.amount - self.paid_amount

    @property
    def status(self):
        if self.balance <= 0:
            return "paid"
        if self.due_date < timezone.localdate():
            return "overdue"
        if self.paid_amount > 0:
            return "partial"
        return "pending"

    def __str__(self):
        return f"{self.title} - {self.student}"


class FeePayment(models.Model):
    class Method(models.TextChoices):
        CASH = "CASH", "Cash"
        BANK = "BANK", "Bank transfer"
        CARD = "CARD", "Card"
        UPI = "UPI", "UPI"
        CHEQUE = "CHEQUE", "Cheque"
        OTHER = "OTHER", "Other"

    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name="fee_payments")
    fee = models.ForeignKey(Fee, on_delete=models.CASCADE, related_name="payments")
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    method = models.CharField(max_length=10, choices=Method.choices)
    reference = models.CharField(max_length=100, blank=True)
    notes = models.CharField(max_length=300, blank=True)
    receipt_no = models.CharField(max_length=32, unique=True, blank=True)
    paid_at = models.DateTimeField(auto_now_add=True)
    received_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="received_fee_payments",
    )

    class Meta:
        ordering = ("-paid_at", "-pk")
        constraints = [
            models.CheckConstraint(condition=Q(amount__gt=0), name="fee_payment_amount_must_be_positive"),
        ]

    def save(self, *args, **kwargs):
        is_new = self.pk is None
        super().save(*args, **kwargs)
        if is_new and not self.receipt_no:
            self.receipt_no = f"RCP-{self.school_id:04d}-{self.pk:08d}"
            super().save(update_fields=("receipt_no",))

    def __str__(self):
        return self.receipt_no or f"Payment {self.pk}"
