from django.test import TestCase
from datetime import date, timedelta
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from accounts.models import School
from students.models import Student
from .models import Fee, FeePayment


class FeeApiTests(TestCase):
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
			first_name="Sam",
			last_name="Lee",
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

	def create_fee(self, **updates):
		data = {
			"student": self.student.pk,
			"title": "Term 1 tuition",
			"category": "TUITION",
			"academic_year": "2026-2027",
			"amount": "1200.00",
			"due_date": (date.today() + timedelta(days=10)).isoformat(),
		}
		data.update(updates)
		return self.client.post("/api/fees/", data, format="json")

	def test_fee_records_require_authentication(self):
		self.client.credentials()

		response = self.client.get("/api/fees/")

		self.assertEqual(response.status_code, 401)

	def test_admin_can_create_fee_for_school_student(self):
		response = self.create_fee()

		self.assertEqual(response.status_code, 201, response.data)
		self.assertEqual(response.data["student_name"], "Sam Lee")
		self.assertEqual(response.data["balance"], Decimal("1200.00"))
		self.assertEqual(Fee.objects.get().school, self.school)

	def test_payment_creates_receipt_and_updates_outstanding_balance(self):
		fee_response = self.create_fee()
		fee_id = fee_response.data["id"]

		payment = self.client.post(f"/api/fees/{fee_id}/payments/", {
			"amount": "450.00",
			"method": "UPI",
			"reference": "UPI-8842",
			"notes": "First installment",
		}, format="json")

		self.assertEqual(payment.status_code, 201, payment.data)
		self.assertTrue(payment.data["receipt_no"].startswith("RCP-"))
		fee = Fee.objects.get(pk=fee_id)
		self.assertEqual(fee.paid_amount, Decimal("450.00"))
		self.assertEqual(fee.balance, Decimal("750.00"))
		self.assertEqual(FeePayment.objects.count(), 1)

	def test_overpayment_is_rejected_without_creating_payment(self):
		fee = self.create_fee().data

		response = self.client.post(f"/api/fees/{fee['id']}/payments/", {
			"amount": "1200.01",
			"method": "CASH",
		}, format="json")

		self.assertEqual(response.status_code, 400)
		self.assertEqual(FeePayment.objects.count(), 0)
		self.assertEqual(Fee.objects.get(pk=fee["id"]).paid_amount, Decimal("0.00"))

	def test_charges_and_summary_are_school_scoped(self):
		self.create_fee()
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
		Fee.objects.create(
			school=self.other_school,
			student=other_student,
			title="Other tuition",
			amount=Decimal("900.00"),
			due_date=date.today(),
		)

		response = self.client.get("/api/fees/summary/")

		self.assertEqual(response.status_code, 200)
		self.assertEqual(response.data["fee_count"], 1)
		self.assertEqual(response.data["total_charges"], Decimal("1200.00"))

	def test_partially_paid_past_due_fee_is_classified_as_overdue(self):
		fee = Fee.objects.create(
			school=self.school,
			student=self.student,
			title="Past due tuition",
			amount=Decimal("1200.00"),
			paid_amount=Decimal("200.00"),
			due_date=date.today() - timedelta(days=1),
		)

		overdue = self.client.get("/api/fees/?status=overdue")
		partial = self.client.get("/api/fees/?status=partial")

		self.assertEqual(overdue.status_code, 200)
		self.assertEqual([item["id"] for item in overdue.data], [fee.pk])
		self.assertEqual(overdue.data[0]["status"], "overdue")
		self.assertEqual(partial.data, [])

	def test_student_cannot_access_fee_records(self):
		self.authenticate(self.student.user)

		response = self.client.get("/api/fees/")

		self.assertEqual(response.status_code, 403)
