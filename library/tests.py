from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from accounts.models import School
from library.models import Book, BookIssue
from students.models import Student


class LibraryApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.school = School.objects.create(name="North School", slug="north")
        self.other_school = School.objects.create(name="South School", slug="south")
        user_model = get_user_model()
        self.admin = user_model.objects.create_user(
            username="north-admin",
            password="test-password",
            role="SCHOOL_ADMIN",
            school=self.school,
        )
        self.staff = user_model.objects.create_user(
            username="north-teacher",
            password="test-password",
            role="TEACHER",
            school=self.school,
        )
        self.student = self.create_student(self.school, "north-student")
        self.other_student = self.create_student(self.other_school, "south-student")
        self.book = self.create_book(self.school, "North Book")
        self.other_book = self.create_book(self.other_school, "South Book")
        self.authenticate(self.admin)

    def create_student(self, school, username):
        user = get_user_model().objects.create_user(
            username=username,
            password="test-password",
            role="STUDENT",
            school=school,
        )
        return Student.objects.create(
            school=school,
            user=user,
            admission_no=f"{username}-admission",
            grade="8",
            section="A",
            date_of_birth="2012-04-03",
        )

    def create_book(self, school, title):
        return Book.objects.create(
            school=school,
            title=title,
            author="School Author",
            isbn=f"isbn-{title.lower().replace(' ', '-')}",
            quantity=1,
        )

    def authenticate(self, user):
        token = RefreshToken.for_user(user).access_token
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")

    def test_library_requires_authentication(self):
        self.client.credentials()

        response = self.client.get("/api/books/")

        self.assertEqual(response.status_code, 401)

    def test_books_are_scoped_to_the_current_school(self):
        response = self.client.get("/api/books/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual([book["title"] for book in response.data], ["North Book"])

    def test_school_admin_can_create_a_book_for_their_school(self):
        response = self.client.post("/api/books/", {
            "title": "New Book",
            "author": "Local Author",
            "isbn": "new-book-001",
            "quantity": 3,
        }, format="json")

        self.assertEqual(response.status_code, 201, response.data)
        self.assertEqual(Book.objects.get(pk=response.data["id"]).school, self.school)

    def test_staff_can_read_but_cannot_change_library_books(self):
        self.authenticate(self.staff)

        self.assertEqual(self.client.get("/api/books/").status_code, 200)
        response = self.client.post("/api/books/", {
            "title": "Unauthorized Book",
            "author": "Local Author",
            "isbn": "unauthorized-001",
            "quantity": 1,
        }, format="json")

        self.assertEqual(response.status_code, 403)

    def test_book_issue_cannot_reference_records_from_another_school(self):
        response = self.client.post("/api/book-issues/", {
            "student": self.other_student.pk,
            "book": self.book.pk,
            "issue_date": "2026-10-14",
        }, format="json")

        self.assertEqual(response.status_code, 400)
        self.assertEqual(BookIssue.objects.count(), 0)

    def test_book_issues_are_scoped_to_the_current_school(self):
        BookIssue.objects.create(
            school=self.school,
            student=self.student,
            book=self.book,
            issue_date="2026-10-14",
        )
        BookIssue.objects.create(
            school=self.other_school,
            student=self.other_student,
            book=self.other_book,
            issue_date="2026-10-14",
        )

        response = self.client.get("/api/book-issues/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["book"], self.book.pk)
