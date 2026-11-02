from django.db.models import F
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, SAFE_METHODS
from rest_framework.response import Response
from rest_framework_simplejwt.authentication import JWTAuthentication

from accounts.permissions import IsSchoolAdministrator, IsSchoolStaff
from accounts.tenancy import SchoolScopedModelViewSet
from students.models import Student
from teachers.models import Teacher

from .models import Timetable
from .serializers import TimetableSerializer


class TimetableViewSet(SchoolScopedModelViewSet):
	queryset = Timetable.objects.select_related("teacher").all()
	serializer_class = TimetableSerializer
	authentication_classes = (JWTAuthentication,)
	tenant_related_fields = ("teacher",)

	def get_permissions(self):
		permission = IsSchoolStaff if self.request.method in SAFE_METHODS else IsSchoolAdministrator
		return [IsAuthenticated(), permission()]

	def get_queryset(self):
		queryset = super().get_queryset()
		for field in ("grade", "section", "day"):
			value = self.request.query_params.get(field)
			if value:
				queryset = queryset.filter(**{field: value})
		return queryset.order_by("period", "day", "grade", "section")

	@action(detail=False, methods=("get",), url_path="class-options")
	def class_options(self, request):
		school = self.get_school()
		classes = Student.objects.filter(school=school).values("grade", "section").distinct().order_by(
			"grade", "section",
		)
		teachers = Teacher.objects.filter(school=school).values("id", "name", "subject")
		return Response({
			"classes": list(classes),
			"teachers": list(teachers),
			"can_manage": request.user.is_school_admin,
		})
