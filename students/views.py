from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.authentication import JWTAuthentication

from accounts.permissions import IsSchoolAdministrator
from accounts.tenancy import SchoolScopedModelViewSet, get_request_school

from .models import Student
from .student_serializers import StudentSerializer


class StudentViewSet(SchoolScopedModelViewSet):
    queryset = Student.objects.select_related("user").all()
    serializer_class = StudentSerializer
    authentication_classes = (JWTAuthentication,)
    permission_classes = (IsAuthenticated, IsSchoolAdministrator)


class StudentStats(APIView):
    authentication_classes = (JWTAuthentication,)
    permission_classes = (IsAuthenticated, IsSchoolAdministrator)

    def get(self, request):
        school = get_request_school(request)
        students = Student.objects.filter(school=school)
        return Response({
            "total_students": students.count(),
            "grades": students.values("grade").distinct().count(),
            "sections": students.values("grade", "section").distinct().count(),
        })