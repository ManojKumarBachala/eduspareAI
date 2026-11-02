from django.db import models

from accounts.models import School
from students.models import Student


class Attendance(models.Model):
    class Status(models.TextChoices):
        PRESENT = "Present", "Present"
        ABSENT = "Absent", "Absent"
        LATE = "Late", "Late"
        EXCUSED = "Excused", "Excused"
        HALF_DAY = "Half Day", "Half Day"

    school = models.ForeignKey(
        School,
        on_delete=models.CASCADE,
        related_name="attendance_records",
    )
    student = models.ForeignKey(Student, on_delete=models.CASCADE)
    date = models.DateField()
    status = models.CharField(
        max_length=10,
        choices=Status.choices,
    )
    note = models.CharField(max_length=300, blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=("school", "student", "date"),
                name="unique_student_attendance_per_day",
            ),
        ]
        ordering = ("-date",)

    def __str__(self):
        return f"{self.student} - {self.date}"
