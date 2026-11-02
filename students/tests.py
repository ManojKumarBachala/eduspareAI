from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from accounts.models import School
from .models import Student


class StudentApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.school = School.objects.create(name="North School", slug="north")
        self.admin = get_user_model().objects.create_user(
            username="admin",
            password="test-password",
            role="SCHOOL_ADMIN",
            school=self.school,
        )
        self.authenticate(self.admin)

    def authenticate(self, user):
        access_token = RefreshToken.for_user(user).access_token
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {access_token}")

    def test_student_list_requires_authentication(self):
        self.client.credentials()
        response = self.client.get("/api/students/")

        self.assertEqual(response.status_code, 401)

    def test_school_admin_can_create_student_account(self):
        response = self.client.post("/api/students/", {
            "admission_no": "A-101",
            "username": "student101",
            "first_name": "Sam",
            "last_name": "Lee",
            "email": "sam@example.com",
            "password": "student-password",
            "grade": "8",
            "section": "B",
            "date_of_birth": "2012-04-03",
        }, format="json")

        self.assertEqual(response.status_code, 201, response.data)
        self.assertEqual(response.data["name"], "Sam Lee")
        student = get_user_model().objects.get(username="student101").student_profile
        self.assertEqual(student.school, self.school)
        self.assertEqual(student.user.role, "STUDENT")
        self.assertTrue(student.user.check_password("student-password"))

    def test_school_admin_can_update_student_and_account(self):
        create_response = self.client.post("/api/students/", {
            "admission_no": "A-102",
            "username": "student102",
            "first_name": "Taylor",
            "password": "student-password",
            "grade": "8",
            "section": "B",
            "date_of_birth": "2012-04-03",
        }, format="json")
        student_id = create_response.data["id"]

        response = self.client.patch(f"/api/students/{student_id}/", {
            "first_name": "Jordan",
            "grade": "9",
        }, format="json")

        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(response.data["name"], "Jordan")
        self.assertEqual(response.data["grade"], "9")
        self.assertEqual(
            get_user_model().objects.get(username="student102").first_name,
            "Jordan",
        )

    def test_school_admin_only_sees_own_school_students(self):
        other_school = School.objects.create(name="South School", slug="south")
        other_user = get_user_model().objects.create_user(
            username="south-student",
            password="test-password",
            role="STUDENT",
            school=other_school,
        )
        Student.objects.create(
            school=other_school,
            user=other_user,
            admission_no="S-1",
            grade="7",
            section="A",
            date_of_birth="2013-01-01",
        )

        response = self.client.get("/api/students/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), [])

    def test_student_cannot_manage_student_records(self):
        student = get_user_model().objects.create_user(
            username="learner",
            password="test-password",
            role="STUDENT",
            school=self.school,
        )
        self.authenticate(student)

        response = self.client.get("/api/students/")

        self.assertEqual(response.status_code, 403)
