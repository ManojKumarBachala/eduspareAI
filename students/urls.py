from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import StudentViewSet
from .dashboard import StudentStats

router = DefaultRouter()
router.register(r'students', StudentViewSet)

urlpatterns = router.urls + [
    path('students/dashboard/', StudentStats.as_view(), name='student-dashboard'),
]
