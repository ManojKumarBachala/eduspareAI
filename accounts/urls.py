from django.urls import path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    CurrentSchoolView,
    CurrentUserView,
    SchoolPublicView,
    SchoolTokenObtainPairView,
    SchoolUserViewSet,
    SchoolViewSet,
)

router = DefaultRouter()
router.register("schools", SchoolViewSet, basename="school")
router.register("users", SchoolUserViewSet, basename="school-user")

urlpatterns = router.urls + [
    path("login/", SchoolTokenObtainPairView.as_view(), name="school-login"),
    path("refresh/", TokenRefreshView.as_view(), name="token-refresh"),
    path("schools/me/", CurrentSchoolView.as_view(), name="current-school"),
    path("schools/<slug:slug>/public/", SchoolPublicView.as_view(), name="school-public"),
    path("me/", CurrentUserView.as_view(), name="current-user"),
]
