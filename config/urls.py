from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
def home(request):
    return JsonResponse({
        "message": "EduSphere AI Running"
    })

urlpatterns = [
    path('', home),
    path('admin/', admin.site.urls),
    path('api/accounts/', include('accounts.urls')),
    path('api/', include('students.urls')),
    path("api/", include("attendance.urls")),
    path("api/", include("teachers.urls")),
    path("api/", include("timetable.urls")),
    path("api/", include("exams.urls")),
    path("api/", include("fees.urls")),
    path(
        "api/token/",
        TokenObtainPairView.as_view(),
        name="token_obtain_pair"
    ),

    path(
        "api/token/refresh/",
        TokenRefreshView.as_view(),
        name="token_refresh"
    ),
    path(
    "api/",
    include("library.urls")
),
path("api/", include("transport.urls")),
path("api/", include("dashboard.urls")),
]
