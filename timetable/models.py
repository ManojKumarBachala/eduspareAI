from django.db import models
from django.db.models import Q

from accounts.models import School
from teachers.models import Teacher


class Timetable(models.Model):
    class Day(models.TextChoices):
        MONDAY = "Monday", "Monday"
        TUESDAY = "Tuesday", "Tuesday"
        WEDNESDAY = "Wednesday", "Wednesday"
        THURSDAY = "Thursday", "Thursday"
        FRIDAY = "Friday", "Friday"
        SATURDAY = "Saturday", "Saturday"
        SUNDAY = "Sunday", "Sunday"

    school = models.ForeignKey(
        School,
        on_delete=models.CASCADE,
        related_name="timetable_entries",
    )
    day = models.CharField(max_length=20, choices=Day.choices)
    period = models.PositiveSmallIntegerField()
    subject = models.CharField(max_length=100)
    teacher = models.ForeignKey(Teacher, on_delete=models.PROTECT)
    grade = models.CharField(max_length=20)
    section = models.CharField(max_length=10)
    start_time = models.TimeField(null=True, blank=True)
    end_time = models.TimeField(null=True, blank=True)
    room = models.CharField(max_length=60, blank=True)
    notes = models.CharField(max_length=300, blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=("school", "day", "period", "grade", "section"),
                name="unique_timetable_slot_per_school",
            ),
            models.UniqueConstraint(
                fields=("school", "day", "period", "teacher"),
                name="unique_teacher_timetable_slot_per_school",
            ),
            models.UniqueConstraint(
                fields=("school", "day", "period", "room"),
                condition=~Q(room=""),
                name="unique_room_timetable_slot_per_school",
            ),
        ]
        ordering = ("day", "grade", "section", "period")

    def __str__(self):
        return f"{self.day} - {self.subject}"
