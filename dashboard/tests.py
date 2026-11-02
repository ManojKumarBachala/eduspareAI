from django.test import TestCase
from rest_framework.test import APIClient


class DashboardStatsTests(TestCase):
    def test_dashboard_stats_endpoint_is_public_and_returns_school_totals(self):
        response = APIClient().get("/api/dashboard/", HTTP_HOST="localhost")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data, {
            "total_students": 0,
            "total_teachers": 0,
            "total_books": 0,
            "total_vehicles": 0,
        })
