from rest_framework import serializers

from .models import Exam, Result


class ExamSerializer(serializers.ModelSerializer):
    result_count = serializers.SerializerMethodField()

    class Meta:
        model = Exam
        fields = (
            "id", "name", "exam_date", "grade", "section", "academic_year", "term",
            "total_marks", "passing_marks", "status", "notes", "result_count",
        )
        read_only_fields = ("id", "result_count")

    def get_result_count(self, exam):
        return Result.objects.filter(exam=exam).count()

    def validate(self, attrs):
        total = attrs.get("total_marks", self.instance.total_marks if self.instance else 100)
        passing = attrs.get("passing_marks", self.instance.passing_marks if self.instance else 35)
        if passing > total:
            raise serializers.ValidationError({"passing_marks": "Passing marks cannot exceed total marks."})
        return attrs


def grade_for_marks(marks, total_marks, passing_marks):
    if marks < passing_marks:
        return "F"
    percentage = marks * 100 / total_marks
    if percentage >= 90:
        return "A+"
    if percentage >= 80:
        return "A"
    if percentage >= 70:
        return "B"
    if percentage >= 60:
        return "C"
    if percentage >= 50:
        return "D"
    return "E"


class ResultSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source="student.name", read_only=True)
    student_admission_no = serializers.CharField(source="student.admission_no", read_only=True)
    grade = serializers.CharField(read_only=True)
    exam_name = serializers.CharField(source="exam.name", read_only=True)
    total_marks = serializers.IntegerField(source="exam.total_marks", read_only=True)
    percentage = serializers.ReadOnlyField()

    class Meta:
        model = Result
        fields = (
            "id", "student", "student_name", "student_admission_no", "exam", "exam_name",
            "subject", "marks", "total_marks", "percentage", "grade", "remarks",
        )
        read_only_fields = ("id", "student_name", "student_admission_no", "exam_name", "total_marks", "percentage", "grade")

    def validate(self, attrs):
        request = self.context.get("request")
        view = self.context.get("view")
        school = view.get_school() if view and hasattr(view, "get_school") else getattr(request.user, "school", None)
        student = attrs.get("student", self.instance.student if self.instance else None)
        exam = attrs.get("exam", self.instance.exam if self.instance else None)
        marks = attrs.get("marks", self.instance.marks if self.instance else None)
        if school and student and student.school_id != school.pk:
            raise serializers.ValidationError({"student": "Choose a student from this school."})
        if school and exam and exam.school_id != school.pk:
            raise serializers.ValidationError({"exam": "Choose an exam from this school."})
        if student and exam and (student.grade != exam.grade or student.section != exam.section):
            raise serializers.ValidationError({"student": "Student is not in the class scheduled for this exam."})
        if exam and exam.status == Exam.Status.PUBLISHED:
            raise serializers.ValidationError("Published exam results cannot be changed.")
        if marks is not None and exam and marks > exam.total_marks:
            raise serializers.ValidationError({"marks": f"Marks cannot exceed {exam.total_marks}."})
        if marks is not None and exam and marks >= 0:
            attrs["grade"] = grade_for_marks(marks, exam.total_marks, exam.passing_marks)
        return attrs


class BulkResultEntrySerializer(serializers.Serializer):
    student = serializers.IntegerField()
    subject = serializers.CharField(max_length=100)
    marks = serializers.IntegerField(min_value=0)
    remarks = serializers.CharField(max_length=200, required=False, allow_blank=True)


class BulkResultSerializer(serializers.Serializer):
    records = BulkResultEntrySerializer(many=True, allow_empty=False)

    def validate_records(self, records):
        keys = [(record["student"], record["subject"].strip().casefold()) for record in records]
        if len(keys) != len(set(keys)):
            raise serializers.ValidationError("Each student and subject can only appear once in a marks submission.")
        return records
