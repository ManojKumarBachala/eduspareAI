from django.shortcuts import render

# Create your views here.
from rest_framework.permissions import IsAuthenticated, SAFE_METHODS
from rest_framework_simplejwt.authentication import JWTAuthentication

from accounts.permissions import IsSchoolAdministrator, IsSchoolStaff
from accounts.tenancy import SchoolScopedModelViewSet

from .models import Book, BookIssue
from .serializers import BookIssueSerializer, BookSerializer


class SchoolLibraryViewSet(SchoolScopedModelViewSet):
    authentication_classes = (JWTAuthentication,)

    def get_permissions(self):
        permission = (
            IsSchoolStaff
            if self.request.method in SAFE_METHODS
            else IsSchoolAdministrator
        )
        return [IsAuthenticated(), permission()]


class BookViewSet(SchoolLibraryViewSet):
    queryset = Book.objects.select_related("school").all()
    serializer_class = BookSerializer


class BookIssueViewSet(SchoolLibraryViewSet):
    queryset = BookIssue.objects.select_related("school", "book", "student").all()
    serializer_class = BookIssueSerializer
    tenant_related_fields = ("student", "book")