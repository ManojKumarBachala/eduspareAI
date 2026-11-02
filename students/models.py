from django.core.exceptions import ValidationError
from django.db import models

from accounts.models import School, User


class Student(models.Model):
    """Student profile owned by one school workspace."""

    school = models.ForeignKey(
        School,
        on_delete=models.CASCADE,
        related_name="students",
    )
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="student_profile",
    )
    admission_no = models.CharField(max_length=50)
    grade = models.CharField(max_length=20)
    section = models.CharField(max_length=10)
    date_of_birth = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=("school", "admission_no"),
                name="unique_student_admission_no_per_school",
            ),
        ]
        ordering = ("admission_no",)

    def clean(self):
        if self.user_id and self.user.school_id and self.user.school_id != self.school_id:
            raise ValidationError({"user": "The user belongs to a different school."})

    @property
    def name(self):
        return self.user.get_full_name() or self.user.username

    def __str__(self):
        return f"{self.admission_no} — {self.name}"
