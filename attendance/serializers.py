from rest_framework import serializers

from .models import Attendance

class AttendanceSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source="student.name", read_only=True)
    admission_no = serializers.CharField(source="student.admission_no", read_only=True)
    grade = serializers.CharField(source="student.grade", read_only=True)
    section = serializers.CharField(source="student.section", read_only=True)

    class Meta:
        model = Attendance
        fields = (
            "id",
            "student",
            "student_name",
            "admission_no",
            "grade",
            "section",
            "date",
            "status",
            "note",
            "note",
        )
        read_only_fields = ("id", "student_name", "admission_no", "grade", "section")


class AttendanceBulkEntrySerializer(serializers.Serializer):
    student_id = serializers.IntegerField()
    status = serializers.ChoiceField(choices=Attendance.Status.choices, allow_null=True)
    note = serializers.CharField(max_length=300, allow_blank=True, required=False)


class AttendanceBulkSerializer(serializers.Serializer):
    date = serializers.DateField()
    records = AttendanceBulkEntrySerializer(many=True, allow_empty=False)

    def validate_records(self, records):
        student_ids = [record["student_id"] for record in records]
        if len(student_ids) != len(set(student_ids)):
            raise serializers.ValidationError("A student can only appear once in this submission.")
        return records