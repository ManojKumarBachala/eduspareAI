from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView

from .models import School, User
from .permissions import IsPlatformAdministrator, IsSchoolAdministrator
from .serializers import (
    SchoolOnboardingSerializer,
    SchoolPublicSerializer,
    SchoolSerializer,
    SchoolTokenObtainPairSerializer,
    UserSerializer,
)
from .tenancy import SchoolScopedModelViewSet


class SchoolTokenObtainPairView(TokenObtainPairView):
    serializer_class = SchoolTokenObtainPairSerializer


class SchoolViewSet(viewsets.ModelViewSet):
    queryset = School.objects.all()
    serializer_class = SchoolSerializer
    permission_classes = (IsPlatformAdministrator,)

    @action(detail=False, methods=("post",), url_path="onboard")
    def onboard(self, request):
        serializer = SchoolOnboardingSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        school = serializer.save()
        return Response(SchoolSerializer(school).data, status=status.HTTP_201_CREATED)


class SchoolPublicView(APIView):
    permission_classes = (AllowAny,)

    def get(self, request, slug):
        school = School.objects.filter(slug=slug, is_active=True).first()
        if not school:
            return Response({"detail": "School not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(SchoolPublicSerializer(school).data)


class CurrentSchoolView(APIView):
    permission_classes = (IsAuthenticated,)

    def get(self, request):
        if not request.user.school_id:
            return Response(
                {"detail": "This account has no school workspace."},
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response(SchoolSerializer(request.user.school).data)


class CurrentUserView(APIView):
    permission_classes = (IsAuthenticated,)

    def get(self, request):
        return Response(UserSerializer(request.user, context={"request": request}).data)


class SchoolUserViewSet(SchoolScopedModelViewSet):
    queryset = User.objects.select_related("school").all()
    serializer_class = UserSerializer
    permission_classes = (IsAuthenticated, IsSchoolAdministrator)
