from django.test import TestCase
from datetime import date, timedelta

from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from accounts.models import School
from students.models import Student
from .models import Exam, Result


class ExamApiTests(TestCase):
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
		self.teacher = user_model.objects.create_user(
			username="teacher",
			password="test-password",
			role="TEACHER",
			school=self.school,
		)
		self.student = self.create_student(self.school, "N-101", "student-one", "Ava")
		self.second_student = self.create_student(self.school, "N-102", "student-two", "Noah")
		self.other_student = self.create_student(self.other_school, "S-101", "other-student", "Other")
		self.authenticate(self.admin)

	def create_student(self, school, admission_no, username, first_name):
		user = get_user_model().objects.create_user(
			username=username,
			password="test-password",
			role="STUDENT",
			school=school,
			first_name=first_name,
		)
		return Student.objects.create(
			school=school,
			user=user,
			admission_no=admission_no,
			grade="8",
			section="A",
			date_of_birth="2012-04-03",
		)

	def authenticate(self, user):
		token = RefreshToken.for_user(user).access_token
		self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")

	def create_exam(self, **updates):
		data = {
			"name": "Term 1 Examination",
			"exam_date": (date.today() + timedelta(days=5)).isoformat(),
			"grade": "8",
			"section": "A",
			"academic_year": "2026-2027",
			"term": "TERM_1",
			"total_marks": 100,
			"passing_marks": 35,
			"status": "DRAFT",
		}
		data.update(updates)
		return self.client.post("/api/exams/", data, format="json")

	def test_exams_require_authentication(self):
		self.client.credentials()

		response = self.client.get("/api/exams/")

		self.assertEqual(response.status_code, 401)

	def test_exam_is_created_with_school_and_class_scope(self):
		response = self.create_exam()

		self.assertEqual(response.status_code, 201, response.data)
		self.assertEqual(Exam.objects.get().school, self.school)
		self.assertEqual(response.data["result_count"], 0)

	def test_teacher_can_enter_marks_and_grade_is_calculated(self):
		exam = self.create_exam().data
		self.authenticate(self.teacher)

		response = self.client.post(f"/api/exams/{exam['id']}/marks/", {
			"records": [
				{"student": self.student.pk, "subject": "Mathematics", "marks": 92},
				{"student": self.second_student.pk, "subject": "Mathematics", "marks": 78},
			],
		}, format="json")

		self.assertEqual(response.status_code, 200, response.data)
		ava = next(row for row in response.data if row["student"] == self.student.pk)
		self.assertEqual(ava["grade"], "A+")
		self.assertEqual(ava["percentage"], 92.0)
		self.assertEqual(Result.objects.count(), 2)

	def test_marks_reject_students_outside_exam_class_or_school(self):
		exam = self.create_exam().data

		response = self.client.post(f"/api/exams/{exam['id']}/marks/", {
			"records": [{"student": self.other_student.pk, "subject": "Mathematics", "marks": 80}],
		}, format="json")

		self.assertEqual(response.status_code, 400)
		self.assertEqual(Result.objects.count(), 0)

	def test_marks_cannot_exceed_exam_total(self):
		exam = self.create_exam(total_marks=50, passing_marks=20).data

		response = self.client.post(f"/api/exams/{exam['id']}/marks/", {
			"records": [{"student": self.student.pk, "subject": "Mathematics", "marks": 51}],
		}, format="json")

		self.assertEqual(response.status_code, 400)
		self.assertEqual(Result.objects.count(), 0)

	def test_report_ranks_students_and_summarizes_subjects(self):
		exam = self.create_exam().data
		self.client.post(f"/api/exams/{exam['id']}/marks/", {
			"records": [
				{"student": self.student.pk, "subject": "Mathematics", "marks": 95},
				{"student": self.student.pk, "subject": "Science", "marks": 85},
				{"student": self.second_student.pk, "subject": "Mathematics", "marks": 75},
				{"student": self.second_student.pk, "subject": "Science", "marks": 65},
			],
		}, format="json")

		response = self.client.get(f"/api/results/report/?exam={exam['id']}")

		self.assertEqual(response.status_code, 200)
		self.assertEqual(response.data["summary"]["students_assessed"], 2)
		self.assertEqual(response.data["students"][0]["student"], self.student.pk)
		self.assertEqual(response.data["students"][0]["rank"], 1)
		self.assertEqual(len(response.data["subjects"]), 2)

	def test_publishing_locks_marks(self):
		exam = self.create_exam().data
		self.client.post(f"/api/exams/{exam['id']}/marks/", {
			"records": [{"student": self.student.pk, "subject": "Mathematics", "marks": 80}],
		}, format="json")

		published = self.client.post(f"/api/exams/{exam['id']}/publish/")
		locked = self.client.post(f"/api/exams/{exam['id']}/marks/", {
			"records": [{"student": self.student.pk, "subject": "Mathematics", "marks": 90}],
		}, format="json")

		self.assertEqual(published.status_code, 200)
		self.assertEqual(published.data["exam"]["status"], "PUBLISHED")
		self.assertEqual(locked.status_code, 400)
		self.assertEqual(Result.objects.get().marks, 80)
