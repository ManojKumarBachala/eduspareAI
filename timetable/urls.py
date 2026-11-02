from rest_framework.routers import DefaultRouter

from .views import TimetableViewSet

router = DefaultRouter()
router.register("timetable", TimetableViewSet)

urlpatterns = router.urls
