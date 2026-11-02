from rest_framework.routers import DefaultRouter
from .views import ExamViewSet, ResultViewSet

router = DefaultRouter()

router.register(
    r'exams',
    ExamViewSet
)

router.register(
    r'results',
    ResultViewSet
)

urlpatterns = router.urls