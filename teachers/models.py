from django.core.exceptions import ValidationError
from django.db import models

from accounts.models import School, User


class Teacher(models.Model):
    school = models.ForeignKey(
        School,
        on_delete=models.CASCADE,
        related_name="teachers",
    )
    user = models.OneToOneField(
        User,
        on_delete=models.SET_NULL,
        related_name="teacher_profile",
        null=True,
        blank=True,
    )
    name = models.CharField(max_length=100)
    subject = models.CharField(max_length=100)
    email = models.EmailField()

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=("school", "email"),
                name="unique_teacher_email_per_school",
            ),
        ]
        ordering = ("name",)

    def clean(self):
        if self.user_id and self.user.school_id and self.user.school_id != self.school_id:
            raise ValidationError({"user": "The user belongs to a different school."})

    def __str__(self):
        return self.name
