from rest_framework import serializers
from .models import Teacher


class TeacherSerializer(serializers.ModelSerializer):
    has_account = serializers.SerializerMethodField()

    class Meta:
        model = Teacher
        fields = ("id", "name", "subject", "email", "has_account")
        read_only_fields = ("id", "has_account")

    def get_has_account(self, teacher):
        return teacher.user_id is not None

    def validate_email(self, value):
        request = self.context.get("request")
        view = self.context.get("view")
        if view and hasattr(view, "get_school"):
            school = view.get_school()
        else:
            school = getattr(request.user, "school", None) if request else None
        if school:
            teachers = Teacher.objects.filter(school=school, email__iexact=value)
            if self.instance:
                teachers = teachers.exclude(pk=self.instance.pk)
            if teachers.exists():
                raise serializers.ValidationError("A teacher with this email already exists in this school.")
        return value