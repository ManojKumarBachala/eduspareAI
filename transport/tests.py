from django.test import TestCase
from datetime import date

from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from accounts.models import School
from students.models import Student
from .models import Route, StudentTransportAssignment, Vehicle


class TransportApiTests(TestCase):
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
		self.staff = user_model.objects.create_user(
			username="teacher",
			password="test-password",
			role="TEACHER",
			school=self.school,
		)
		self.student = self.create_student("N-101", "student")
		self.authenticate(self.admin)

	def create_student(self, admission_no, username):
		user = get_user_model().objects.create_user(
			username=username,
			password="test-password",
			role="STUDENT",
			school=self.school,
			first_name="Student",
		)
		return Student.objects.create(
			school=self.school,
			user=user,
			admission_no=admission_no,
			grade="8",
			section="A",
			date_of_birth="2012-04-03",
		)

	def authenticate(self, user):
		token = RefreshToken.for_user(user).access_token
		self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")

	def create_vehicle(self, **overrides):
		data = {
			"vehicle_no": "BUS-101",
			"driver_name": "Alex Driver",
			"driver_phone": "555-0101",
			"vehicle_type": "BUS",
			"status": "ACTIVE",
			"fuel_type": "DIESEL",
			"capacity": 1,
			"odometer_km": 12000,
			"insurance_expiry": "2027-06-30",
			"fitness_expiry": "2027-06-30",
			"permit_expiry": "2027-06-30",
			"next_service_due": "2027-01-30",
		}
		data.update(overrides)
		return self.client.post("/api/vehicles/", data, format="json")

	def test_transport_requires_authentication(self):
		self.client.credentials()

		response = self.client.get("/api/vehicles/")

		self.assertEqual(response.status_code, 401)

	def test_school_admin_can_create_vehicle_and_route(self):
		vehicle_response = self.create_vehicle()
		self.assertEqual(vehicle_response.status_code, 201, vehicle_response.data)
		vehicle_id = vehicle_response.data["id"]

		route_response = self.client.post("/api/routes/", {
			"route_name": "North Loop",
			"start_point": "School",
			"end_point": "North Estate",
			"stops": ["Oak Street", "Library", "North Estate"],
			"distance_km": "14.50",
			"estimated_minutes": 45,
			"pickup_time": "07:15",
			"dropoff_time": "08:00",
			"assigned_vehicle": vehicle_id,
			"is_active": True,
		}, format="json")

		self.assertEqual(route_response.status_code, 201, route_response.data)
		self.assertEqual(route_response.data["vehicle_no"], "BUS-101")
		self.assertEqual(route_response.data["assigned_students"], 0)

	def test_duplicate_vehicle_number_is_rejected(self):
		self.create_vehicle()

		response = self.create_vehicle()

		self.assertEqual(response.status_code, 400)
		self.assertIn("vehicle_no", response.data)

	def test_staff_can_read_but_cannot_change_fleet(self):
		self.authenticate(self.staff)

		self.assertEqual(self.client.get("/api/vehicles/").status_code, 200)
		response = self.create_vehicle(vehicle_no="BUS-202")

		self.assertEqual(response.status_code, 403)

	def test_vehicle_and_route_lists_are_school_scoped(self):
		self.create_vehicle()
		Vehicle.objects.create(
			school=self.other_school,
			vehicle_no="SOUTH-1",
			driver_name="Other Driver",
			capacity=20,
		)

		response = self.client.get("/api/vehicles/")

		self.assertEqual(response.status_code, 200)
		self.assertEqual([item["vehicle_no"] for item in response.data], ["BUS-101"])

	def test_assignment_rejects_capacity_overflow(self):
		vehicle_id = self.create_vehicle().data["id"]
		route = Route.objects.create(
			school=self.school,
			route_name="North Loop",
			start_point="School",
			end_point="North Estate",
			assigned_vehicle_id=vehicle_id,
		)
		first = self.client.post("/api/student-assignments/", {
			"student": self.student.pk,
			"route": route.pk,
			"pickup_stop": "Oak Street",
			"dropoff_stop": "North Estate",
			"start_date": date.today().isoformat(),
		}, format="json")
		self.assertEqual(first.status_code, 201, first.data)

		another_student = self.create_student("N-102", "student-two")
		response = self.client.post("/api/student-assignments/", {
			"student": another_student.pk,
			"route": route.pk,
			"pickup_stop": "Library",
			"dropoff_stop": "North Estate",
			"start_date": date.today().isoformat(),
		}, format="json")

		self.assertEqual(response.status_code, 400)
		self.assertEqual(StudentTransportAssignment.objects.filter(is_active=True).count(), 1)

	def test_maintenance_updates_vehicle_odometer_and_service_due(self):
		vehicle_id = self.create_vehicle().data["id"]

		response = self.client.post("/api/maintenance/", {
			"vehicle": vehicle_id,
			"kind": "SERVICE",
			"description": "Quarterly service",
			"service_date": date.today().isoformat(),
			"odometer_km": 12500,
			"cost": "180.00",
			"vendor": "North Garage",
			"next_service_due": "2027-01-30",
		}, format="json")

		self.assertEqual(response.status_code, 201, response.data)
		vehicle = Vehicle.objects.get(pk=vehicle_id)
		self.assertEqual(vehicle.odometer_km, 12500)
		self.assertEqual(vehicle.next_service_due.isoformat(), "2027-01-30")
