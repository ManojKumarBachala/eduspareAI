from django.contrib.auth.models import AbstractUser
from django.db import models


class School(models.Model):
    """A tenant using the EduSphere platform."""

    class Plan(models.TextChoices):
        STARTER = "STARTER", "Starter"
        PROFESSIONAL = "PROFESSIONAL", "Professional"
        ENTERPRISE = "ENTERPRISE", "Enterprise"

    name = models.CharField(max_length=160)
    slug = models.SlugField(max_length=80, unique=True)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=20, blank=True)
    address = models.TextField(blank=True)
    city = models.CharField(max_length=100, blank=True)
    website = models.URLField(blank=True)
    logo_url = models.URLField(blank=True)
    primary_color = models.CharField(max_length=7, default="#2563EB")
    about = models.TextField(blank=True)
    plan = models.CharField(
        max_length=20,
        choices=Plan.choices,
        default=Plan.STARTER,
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("name",)

    def __str__(self):
        return self.name


class User(AbstractUser):
    class Role(models.TextChoices):
        PLATFORM_ADMIN = "PLATFORM_ADMIN", "Platform Admin"
        SCHOOL_ADMIN = "SCHOOL_ADMIN", "School Admin"
        TEACHER = "TEACHER", "Teacher"
        STUDENT = "STUDENT", "Student"
        PARENT = "PARENT", "Parent"
        # Retained so existing installations can be migrated without losing roles.
        LEGACY_ADMIN = "ADMIN", "School Admin (legacy)"

    school = models.ForeignKey(
        School,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="users",
    )
    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.STUDENT,
    )
    phone = models.CharField(max_length=20, blank=True)

    @property
    def is_platform_admin(self):
        return self.is_superuser or self.role == self.Role.PLATFORM_ADMIN

    @property
    def is_school_admin(self):
        return self.is_platform_admin or self.role in {
            self.Role.SCHOOL_ADMIN,
            self.Role.LEGACY_ADMIN,
        }

    def __str__(self):
        if self.school_id:
            return f"{self.username} ({self.school})"
        return self.username
