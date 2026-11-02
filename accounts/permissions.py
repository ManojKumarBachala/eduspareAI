from rest_framework.permissions import BasePermission


class IsSchoolMember(BasePermission):
    message = "A school account is required to access this resource."

    def has_permission(self, request, view):
        user = request.user
        return bool(
            user
            and user.is_authenticated
            and (user.school_id or user.is_platform_admin)
        )


class IsSchoolAdministrator(IsSchoolMember):
    message = "A school administrator account is required for this action."

    def has_permission(self, request, view):
        return super().has_permission(request, view) and request.user.is_school_admin


class IsSchoolStaff(IsSchoolMember):
    message = "A school administrator or teacher account is required for this action."

    def has_permission(self, request, view):
        return super().has_permission(request, view) and (
            request.user.is_school_admin or request.user.role == "TEACHER"
        )


class IsPlatformAdministrator(BasePermission):
    message = "A platform administrator account is required for this action."

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.is_platform_admin
        )
