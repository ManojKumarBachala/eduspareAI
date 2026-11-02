from django.db import models
from django.db.models import F, Q

from accounts.models import School
from students.models import Student


class Exam(models.Model):
    class Term(models.TextChoices):
        TERM_1 = "TERM_1", "Term 1"
        TERM_2 = "TERM_2", "Term 2"
        TERM_3 = "TERM_3", "Term 3"
        MIDTERM = "MIDTERM", "Midterm"
        FINAL = "FINAL", "Final"
        OTHER = "OTHER", "Other"

    class Status(models.TextChoices):
        DRAFT = "DRAFT", "Draft"
        SCHEDULED = "SCHEDULED", "Scheduled"
        PUBLISHED = "PUBLISHED", "Published"

    school = models.ForeignKey(
        School,
        on_delete=models.CASCADE,
        related_name="exams",
    )
    name = models.CharField(max_length=100)
    exam_date = models.DateField()
    grade = models.CharField(max_length=20, blank=True, default="")
    section = models.CharField(max_length=10, blank=True, default="")
    academic_year = models.CharField(max_length=9, blank=True)
    term = models.CharField(max_length=10, choices=Term.choices, default=Term.TERM_1)
    total_marks = models.PositiveSmallIntegerField(default=100)
    passing_marks = models.PositiveSmallIntegerField(default=35)
    status = models.CharField(max_length=12, choices=Status.choices, default=Status.DRAFT)
    notes = models.CharField(max_length=300, blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=("school", "name", "exam_date", "grade", "section"),
                name="unique_exam_per_school",
            ),
            models.CheckConstraint(condition=Q(total_marks__gt=0), name="exam_total_marks_must_be_positive"),
            models.CheckConstraint(condition=Q(passing_marks__lte=F("total_marks")), name="exam_pass_marks_cannot_exceed_total"),
        ]
        ordering = ("-exam_date", "name")

    def __str__(self):
        return self.name


class Result(models.Model):
    school = models.ForeignKey(
        School,
        on_delete=models.CASCADE,
        related_name="results",
    )
    student = models.ForeignKey(Student, on_delete=models.CASCADE)
    exam = models.ForeignKey(Exam, on_delete=models.CASCADE)
    subject = models.CharField(max_length=100)
    marks = models.IntegerField()
    grade = models.CharField(max_length=5)
    remarks = models.CharField(max_length=200, blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=("school", "student", "exam", "subject"),
                name="unique_student_result_per_subject",
            ),
            models.CheckConstraint(condition=Q(marks__gte=0), name="result_marks_nonnegative"),
        ]

    @property
    def percentage(self):
        return round(self.marks * 100 / self.exam.total_marks, 1) if self.exam.total_marks else 0

    def __str__(self):
        return f"{self.student} - {self.subject}"
