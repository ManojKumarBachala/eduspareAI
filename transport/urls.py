from rest_framework.routers import DefaultRouter
from .views import (
	RouteViewSet,
	StudentTransportAssignmentViewSet,
	VehicleMaintenanceViewSet,
	VehicleViewSet,
)

router = DefaultRouter()

router.register(r"vehicles", VehicleViewSet)
router.register(r"routes", RouteViewSet)
router.register(r"student-assignments", StudentTransportAssignmentViewSet)
router.register(r"maintenance", VehicleMaintenanceViewSet)

urlpatterns = router.urls