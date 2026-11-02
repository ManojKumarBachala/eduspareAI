from rest_framework import viewsets
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.permissions import IsAuthenticated

from .models import School
from .permissions import IsSchoolMember


def get_request_school(request):
    """Resolve the tenant without trusting a school ID supplied in request data."""
    user = request.user
    if user.school_id:
        if not user.school.is_active:
            raise PermissionDenied("This school's account is inactive.")
        return user.school

    # Platform admins may support a specific school without exposing every
    # tenant's records in a single response.
    school_slug = request.headers.get("X-School-Slug")
    if user.is_platform_admin and school_slug:
        try:
            return School.objects.get(slug=school_slug, is_active=True)
        except School.DoesNotExist as exc:
            raise PermissionDenied("The requested school is unavailable.") from exc

    raise PermissionDenied("Choose a school context to access this resource.")


class SchoolScopedModelViewSet(viewsets.ModelViewSet):
    """Scopes a model with a ``school`` field to the authenticated tenant."""

    permission_classes = (IsAuthenticated, IsSchoolMember)
    tenant_related_fields = ()

    def get_school(self):
        return get_request_school(self.request)

    def get_queryset(self):
        return super().get_queryset().filter(school=self.get_school())

    def _validate_related_tenants(self, serializer, school):
        for field_name in self.tenant_related_fields:
            related_object = serializer.validated_data.get(field_name)
            if related_object is None:
                continue
            if getattr(related_object, "school_id", None) != school.id:
                raise ValidationError(
                    {field_name: "This record belongs to a different school."}
                )

    def perform_create(self, serializer):
        school = self.get_school()
        self._validate_related_tenants(serializer, school)
        serializer.save(school=school)

    def perform_update(self, serializer):
        self._validate_related_tenants(serializer, self.get_school())
        serializer.save()
