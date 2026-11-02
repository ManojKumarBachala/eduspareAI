from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from accounts.models import School
from students.models import Student
from teachers.models import Teacher
from .models import Timetable


class TimetableApiTests(TestCase):
	def setUp(self):
		self.client = APIClient()
		self.school = School.objects.create(name="North School", slug="north")
		self.other_school = School.objects.create(name="South School", slug="south")
		user_model = get_user_model()
		self.admin = user_model.objects.create_user(
			username="admin",
			password="test-password",
			role="SCHOOL_ADMIN",
			school=self.school,
		)
		self.teacher_user = user_model.objects.create_user(
			username="teacher-user",
			password="test-password",
			role="TEACHER",
			school=self.school,
		)
		self.teacher = Teacher.objects.create(
			school=self.school,
			user=self.teacher_user,
			name="Morgan Lee",
			subject="Mathematics",
			email="morgan@example.com",
		)
		self.student_user = user_model.objects.create_user(
			username="student-user",
			password="test-password",
			role="STUDENT",
			school=self.school,
		)
		Student.objects.create(
			school=self.school,
			user=self.student_user,
			admission_no="N-101",
			grade="8",
			section="A",
			date_of_birth="2012-04-03",
		)
		self.authenticate(self.admin)

	def authenticate(self, user):
		token = RefreshToken.for_user(user).access_token
		self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")

	def payload(self, **updates):
		payload = {
			"day": "Monday",
			"period": 1,
			"subject": "Mathematics",
			"teacher": self.teacher.pk,
			"grade": "8",
			"section": "A",
			"start_time": "08:30",
			"end_time": "09:15",
			"room": "A-12",
			"notes": "Bring workbook",
		}
		payload.update(updates)
		return payload

	def test_timetable_requires_authentication(self):
		self.client.credentials()

		response = self.client.get("/api/timetable/")

		self.assertEqual(response.status_code, 401)

	def test_admin_can_create_complete_class_slot(self):
		response = self.client.post("/api/timetable/", self.payload(), format="json")

		self.assertEqual(response.status_code, 201, response.data)
		self.assertEqual(response.data["teacher_name"], "Morgan Lee")
		self.assertEqual(response.data["room"], "A-12")
		self.assertEqual(response.data["start_time"], "08:30:00")
		self.assertEqual(Timetable.objects.get().school, self.school)

	def test_timetable_is_school_scoped_and_teachers_can_read(self):
		Timetable.objects.create(
			school=self.other_school,
			day="Monday",
			period=1,
			subject="History",
			teacher=Teacher.objects.create(
				school=self.other_school,
				name="Other Teacher",
				subject="History",
				email="other@example.com",
			),
			grade="8",
			section="A",
		)
		self.authenticate(self.teacher_user)

		response = self.client.get("/api/timetable/")

		self.assertEqual(response.status_code, 200)
		self.assertEqual(response.json(), [])

	def test_teacher_can_read_but_cannot_edit_timetable(self):
		self.authenticate(self.teacher_user)

		response = self.client.post("/api/timetable/", self.payload(), format="json")

		self.assertEqual(response.status_code, 403)

	def test_teacher_from_another_school_is_rejected(self):
		other_teacher = Teacher.objects.create(
			school=self.other_school,
			name="Other Teacher",
			subject="History",
			email="other@example.com",
		)

		response = self.client.post(
			"/api/timetable/",
			self.payload(teacher=other_teacher.pk),
			format="json",
		)

		self.assertEqual(response.status_code, 400)
		self.assertEqual(Timetable.objects.count(), 0)

	def test_teacher_time_overlap_is_rejected_across_classes(self):
		first = self.client.post("/api/timetable/", self.payload(), format="json")
		self.assertEqual(first.status_code, 201, first.data)

		response = self.client.post(
			"/api/timetable/",
			self.payload(period=2, grade="9", section="B", start_time="09:00", end_time="09:45", room="B-01"),
			format="json",
		)

		self.assertEqual(response.status_code, 400)
		self.assertIn("teacher", response.data)

	def test_class_options_are_school_scoped(self):
		response = self.client.get("/api/timetable/class-options/")

		self.assertEqual(response.status_code, 200)
		self.assertEqual(response.data["classes"], [{"grade": "8", "section": "A"}])
		self.assertEqual(response.data["teachers"][0]["name"], "Morgan Lee")
