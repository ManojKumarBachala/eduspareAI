from django.db import transaction
from rest_framework import serializers
from rest_framework_simplejwt.exceptions import AuthenticationFailed
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import School, User


class SchoolSerializer(serializers.ModelSerializer):
    class Meta:
        model = School
        fields = (
            "id",
            "name",
            "slug",
            "email",
            "phone",
            "address",
            "city",
            "website",
            "logo_url",
            "primary_color",
            "about",
            "plan",
            "is_active",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")


class SchoolPublicSerializer(serializers.ModelSerializer):
    class Meta:
        model = School
        fields = (
            "name",
            "slug",
            "email",
            "phone",
            "address",
            "city",
            "website",
            "logo_url",
            "primary_color",
            "about",
        )


class UserSerializer(serializers.ModelSerializer):
    school = SchoolPublicSerializer(read_only=True)
    password = serializers.CharField(write_only=True, required=False, min_length=8)

    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "first_name",
            "last_name",
            "email",
            "phone",
            "role",
            "school",
            "is_active",
            "password",
        )
        read_only_fields = ("id", "school")

    def validate_role(self, value):
        request = self.context.get("request")
        if (
            request
            and request.user.is_authenticated
            and not request.user.is_platform_admin
            and value in {User.Role.PLATFORM_ADMIN, User.Role.SCHOOL_ADMIN}
        ):
            raise serializers.ValidationError(
                "Only a platform administrator can assign an administrator role."
            )
        return value

    def create(self, validated_data):
        password = validated_data.pop("password", None)
        user = User(**validated_data)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop("password", None)
        for attribute, value in validated_data.items():
            setattr(instance, attribute, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance


class SchoolOnboardingSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=160)
    slug = serializers.SlugField(max_length=80)
    email = serializers.EmailField(required=False, allow_blank=True)
    phone = serializers.CharField(max_length=20, required=False, allow_blank=True)
    city = serializers.CharField(max_length=100, required=False, allow_blank=True)
    plan = serializers.ChoiceField(choices=School.Plan.choices, default=School.Plan.STARTER)
    admin_username = serializers.CharField(max_length=150)
    admin_first_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    admin_last_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    admin_email = serializers.EmailField(required=False, allow_blank=True)
    admin_password = serializers.CharField(write_only=True, min_length=8)

    def validate_slug(self, value):
        if School.objects.filter(slug=value).exists():
            raise serializers.ValidationError("A school with this slug already exists.")
        return value

    def validate_admin_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("This username is already in use.")
        return value

    @transaction.atomic
    def create(self, validated_data):
        admin_fields = {
            key.removeprefix("admin_"): validated_data.pop(key)
            for key in tuple(validated_data.keys())
            if key.startswith("admin_")
        }
        school = School.objects.create(**validated_data)
        User.objects.create_user(
            school=school,
            role=User.Role.SCHOOL_ADMIN,
            username=admin_fields["username"],
            first_name=admin_fields.get("first_name", ""),
            last_name=admin_fields.get("last_name", ""),
            email=admin_fields.get("email", ""),
            password=admin_fields["password"],
        )
        return school


class SchoolTokenObtainPairSerializer(TokenObtainPairSerializer):
    """JWT login that carries tenant context and rejects inactive tenants."""

    school_slug = serializers.SlugField(write_only=True, required=False)

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["role"] = user.role
        if user.school_id:
            token["school_id"] = user.school_id
            token["school_slug"] = user.school.slug
        return token

    def validate(self, attrs):
        requested_school_slug = attrs.get("school_slug")
        data = super().validate(attrs)
        user = self.user

        if user.school_id:
            if not user.school.is_active:
                raise AuthenticationFailed("This school's account is inactive.")
            if requested_school_slug and requested_school_slug != user.school.slug:
                raise AuthenticationFailed("These credentials do not belong to that school.")
        elif not user.is_platform_admin:
            raise AuthenticationFailed("This account is not assigned to a school.")

        data["user"] = UserSerializer(user, context=self.context).data
        return data
