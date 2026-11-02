from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import School, User


@admin.register(School)
class SchoolAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "plan", "is_active", "created_at")
    list_filter = ("plan", "is_active")
    search_fields = ("name", "slug", "email")
    prepopulated_fields = {"slug": ("name",)}


@admin.register(User)
class EduSphereUserAdmin(UserAdmin):
    list_display = ("username", "email", "school", "role", "is_active", "is_staff")
    list_filter = ("role", "school", "is_active", "is_staff")
    fieldsets = UserAdmin.fieldsets + (("EduSphere", {"fields": ("school", "role", "phone")} ),)
    add_fieldsets = UserAdmin.add_fieldsets + (("EduSphere", {"fields": ("school", "role", "phone")} ),)
