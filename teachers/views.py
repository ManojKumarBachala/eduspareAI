from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication

from accounts.permissions import IsSchoolAdministrator
from accounts.tenancy import SchoolScopedModelViewSet

from .models import Teacher
from .serializers import TeacherSerializer


class TeacherViewSet(SchoolScopedModelViewSet):
    queryset = Teacher.objects.select_related("user").all()
    serializer_class = TeacherSerializer
    authentication_classes = (JWTAuthentication,)
    permission_classes = (IsAuthenticated, IsSchoolAdministrator)