from django.contrib.auth import get_user_model
from django.db import transaction
from rest_framework import serializers

from .models import Student

User = get_user_model()


class StudentSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()
    username = serializers.CharField(source="user.username", max_length=150)
    first_name = serializers.CharField(source="user.first_name", max_length=150, required=False, allow_blank=True)
    last_name = serializers.CharField(source="user.last_name", max_length=150, required=False, allow_blank=True)
    email = serializers.EmailField(source="user.email", required=False, allow_blank=True)
    phone = serializers.CharField(source="user.phone", max_length=20, required=False, allow_blank=True)
    password = serializers.CharField(write_only=True, min_length=8, required=False)

    class Meta:
        model = Student
        fields = (
            "id",
            "admission_no",
            "name",
            "username",
            "first_name",
            "last_name",
            "email",
            "phone",
            "password",
            "grade",
            "section",
            "date_of_birth",
        )
        read_only_fields = ("id", "name")

    def get_name(self, student):
        return student.name

    def validate_username(self, value):
        users = User.objects.filter(username=value)
        if self.instance:
            users = users.exclude(pk=self.instance.user_id)
        if users.exists():
            raise serializers.ValidationError("This username is already in use.")
        return value

    def validate_admission_no(self, value):
        request = self.context.get("request")
        view = self.context.get("view")
        school_id = view.get_school().pk if view and hasattr(view, "get_school") else (
            getattr(request.user, "school_id", None) if request else None
        )
        if school_id:
            students = Student.objects.filter(school_id=school_id, admission_no=value)
            if self.instance:
                students = students.exclude(pk=self.instance.pk)
            if students.exists():
                raise serializers.ValidationError("This admission number is already in use.")
        return value

    def validate(self, attrs):
        if self.instance is None and not attrs.get("password"):
            raise serializers.ValidationError({"password": "A password is required for a new student account."})
        return attrs

    @transaction.atomic
    def create(self, validated_data):
        school = validated_data.pop("school")
        password = validated_data.pop("password")
        user_fields = validated_data.pop("user")
        user = User.objects.create_user(
            **user_fields,
            school=school,
            role=User.Role.STUDENT,
            password=password,
        )
        return Student.objects.create(user=user, school=school, **validated_data)

    @transaction.atomic
    def update(self, instance, validated_data):
        password = validated_data.pop("password", None)
        user_fields = validated_data.pop("user", {})
        for field, value in user_fields.items():
            setattr(instance.user, field, value)
        if password:
            instance.user.set_password(password)
        if user_fields or password:
            instance.user.save()
        return super().update(instance, validated_data)
