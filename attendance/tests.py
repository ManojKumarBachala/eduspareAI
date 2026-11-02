from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from accounts.models import School
from attendance.models import Attendance
from students.models import Student


class AttendanceApiTests(TestCase):
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
		student_user = user_model.objects.create_user(
			username="student",
			password="test-password",
			role="STUDENT",
			school=self.school,
		)
		self.student = Student.objects.create(
			school=self.school,
			user=student_user,
			admission_no="N-101",
			grade="8",
			section="A",
			date_of_birth="2012-04-03",
		)
		self.authenticate(self.admin)

	def authenticate(self, user):
		token = RefreshToken.for_user(user).access_token
		self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")

	def test_attendance_requires_authentication(self):
		self.client.credentials()

		response = self.client.get("/api/attendance/")

		self.assertEqual(response.status_code, 401)

	def test_teacher_can_load_school_roster(self):
		teacher = get_user_model().objects.create_user(
			username="teacher",
			password="test-password",
			role="TEACHER",
			school=self.school,
		)
		self.authenticate(teacher)

		response = self.client.get("/api/attendance/roster/?date=2026-10-14")

		self.assertEqual(response.status_code, 200)
		self.assertEqual(response.data, [{
			"student_id": self.student.pk,
			"name": self.student.name,
			"admission_no": "N-101",
			"grade": "8",
			"section": "A",
			"status": None,
			"note": "",
		}])

	def test_bulk_attendance_is_idempotent_and_updates_status(self):
		payload = {
			"date": "2026-10-14",
			"records": [{"student_id": self.student.pk, "status": "Absent"}],
		}
		response = self.client.put("/api/attendance/bulk/", payload, format="json")
		self.assertEqual(response.status_code, 200, response.data)
		self.assertEqual(response.data[0]["status"], "Absent")

		payload["records"][0]["status"] = "Present"
		response = self.client.put("/api/attendance/bulk/", payload, format="json")

		self.assertEqual(response.status_code, 200, response.data)
		self.assertEqual(response.data[0]["status"], "Present")
		self.assertEqual(self.school.attendance_records.count(), 1)

	def test_bulk_attendance_rejects_students_from_other_schools(self):
		other_user = get_user_model().objects.create_user(
			username="other-student",
			password="test-password",
			role="STUDENT",
			school=self.other_school,
		)
		other_student = Student.objects.create(
			school=self.other_school,
			user=other_user,
			admission_no="S-101",
			grade="8",
			section="A",
			date_of_birth="2012-04-03",
		)

		response = self.client.put("/api/attendance/bulk/", {
			"date": "2026-10-14",
			"records": [{"student_id": other_student.pk, "status": "Absent"}],
		}, format="json")

		self.assertEqual(response.status_code, 400)
		self.assertEqual(self.school.attendance_records.count(), 0)

	def test_student_cannot_mark_attendance(self):
		self.authenticate(self.student.user)

		response = self.client.get("/api/attendance/roster/")

		self.assertEqual(response.status_code, 403)

	def test_bulk_attendance_accepts_late_and_excused_statuses(self):
		for date, status in (("2026-10-14", "Late"), ("2026-10-15", "Excused")):
			response = self.client.put("/api/attendance/bulk/", {
				"date": date,
				"records": [{"student_id": self.student.pk, "status": status}],
			}, format="json")

			self.assertEqual(response.status_code, 200, response.data)
			self.assertEqual(response.data[0]["status"], status)

	def test_report_summarizes_period_and_excludes_excused_days_from_rate(self):
		for date, status in (
			("2026-10-11", Attendance.Status.PRESENT),
			("2026-10-12", Attendance.Status.LATE),
			("2026-10-13", Attendance.Status.ABSENT),
			("2026-10-14", Attendance.Status.EXCUSED),
		):
			Attendance.objects.create(
				school=self.school,
				student=self.student,
				date=date,
				status=status,
			)

		response = self.client.get(
			"/api/attendance/report/?start_date=2026-10-11&end_date=2026-10-14"
		)

		self.assertEqual(response.status_code, 200)
		self.assertEqual(response.data["summary"]["present"], 1)
		self.assertEqual(response.data["summary"]["late"], 1)
		self.assertEqual(response.data["summary"]["absent"], 1)
		self.assertEqual(response.data["summary"]["excused"], 1)
		self.assertEqual(response.data["summary"]["attendance_rate"], 66.7)
		self.assertEqual(response.data["students"][0]["attendance_rate"], 66.7)
		self.assertEqual(len(response.data["daily_trend"]), 4)

	def test_report_rejects_reversed_date_range(self):
		response = self.client.get(
			"/api/attendance/report/?start_date=2026-10-15&end_date=2026-10-14"
		)

		self.assertEqual(response.status_code, 400)

	def test_bulk_attendance_saves_half_day_note_and_section_filter(self):
		response = self.client.put("/api/attendance/bulk/", {
			"date": "2026-10-14",
			"records": [{
				"student_id": self.student.pk,
				"status": "Half Day",
				"note": "Left after lunch",
			}],
		}, format="json")

		self.assertEqual(response.status_code, 200, response.data)
		self.assertEqual(response.data[0]["note"], "Left after lunch")
		roster = self.client.get("/api/attendance/roster/?date=2026-10-14&grade=8&section=A")
		self.assertEqual(roster.data[0]["status"], "Half Day")
		self.assertEqual(roster.data[0]["note"], "Left after lunch")

		response = self.client.put("/api/attendance/bulk/", {
			"date": "2026-10-14",
			"records": [{"student_id": self.student.pk, "status": None, "note": ""}],
		}, format="json")
		self.assertEqual(response.status_code, 200, response.data)
		self.assertEqual(self.school.attendance_records.count(), 0)

	def test_report_flags_at_risk_students_and_absence_streaks(self):
		for date, status in (
			("2026-10-12", Attendance.Status.PRESENT),
			("2026-10-13", Attendance.Status.ABSENT),
			("2026-10-14", Attendance.Status.ABSENT),
		):
			Attendance.objects.create(
				school=self.school,
				student=self.student,
				date=date,
				status=status,
			)

		response = self.client.get(
			"/api/attendance/report/?start_date=2026-10-12&end_date=2026-10-14&risk_threshold=75"
		)

		self.assertEqual(response.status_code, 200)
		self.assertEqual(response.data["summary"]["at_risk_students"], 1)
		self.assertTrue(response.data["students"][0]["at_risk"])
		self.assertEqual(response.data["students"][0]["absence_streak"], 2)
