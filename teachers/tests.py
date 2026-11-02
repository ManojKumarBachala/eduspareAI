from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from accounts.models import School


class TeacherApiTests(TestCase):
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
		token = RefreshToken.for_user(user).access_token
		self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")

	def test_teacher_list_requires_authentication(self):
		self.client.credentials()

		response = self.client.get("/api/teachers/")

		self.assertEqual(response.status_code, 401)

	def test_school_admin_can_create_teacher_profile(self):
		response = self.client.post("/api/teachers/", {
			"name": "Avery Morgan",
			"subject": "Science",
			"email": "avery@example.com",
		}, format="json")

		self.assertEqual(response.status_code, 201, response.data)
		self.assertFalse(response.data["has_account"])
		teacher = self.school.teachers.get(email="avery@example.com")
		self.assertEqual(teacher.name, "Avery Morgan")

	def test_teacher_list_is_limited_to_current_school(self):
		other_school = School.objects.create(name="South School", slug="south")
		other_school.teachers.create(
			name="Taylor Reed",
			subject="Math",
			email="taylor@example.com",
		)

		response = self.client.get("/api/teachers/")

		self.assertEqual(response.status_code, 200)
		self.assertEqual(response.json(), [])

	def test_non_admin_cannot_manage_teacher_records(self):
		teacher_user = get_user_model().objects.create_user(
			username="teacher",
			password="test-password",
			role="TEACHER",
			school=self.school,
		)
		self.authenticate(teacher_user)

		response = self.client.get("/api/teachers/")

		self.assertEqual(response.status_code, 403)
