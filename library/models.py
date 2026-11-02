from django.db import models

from accounts.models import School
from students.models import Student


class Book(models.Model):
    school = models.ForeignKey(
        School,
        on_delete=models.CASCADE,
        related_name="books",
    )
    title = models.CharField(max_length=200)
    author = models.CharField(max_length=200)
    isbn = models.CharField(max_length=50)
    quantity = models.IntegerField(default=1)

    class Meta:
        ordering = ("title",)

    def __str__(self):
        return self.title


class BookIssue(models.Model):
    school = models.ForeignKey(
        School,
        on_delete=models.CASCADE,
        related_name="book_issues",
    )
    student = models.ForeignKey(Student, on_delete=models.CASCADE)
    book = models.ForeignKey(Book, on_delete=models.CASCADE)
    issue_date = models.DateField()
    return_date = models.DateField(null=True, blank=True)
    fine = models.DecimalField(max_digits=8, decimal_places=2, default=0)

    def __str__(self):
        return f"{self.student} - {self.book}"
