from rest_framework import viewsets
from django.db import transaction
from django.db.models import Avg, Count, F, Max, Q, Sum
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated, SAFE_METHODS
from rest_framework.response import Response
from rest_framework_simplejwt.authentication import JWTAuthentication

from accounts.permissions import IsSchoolAdministrator, IsSchoolStaff
from accounts.tenancy import SchoolScopedModelViewSet
from students.models import Student

from .models import Exam, Result
from .serializers import (
    BulkResultSerializer,
    ExamSerializer,
    ResultSerializer,
    grade_for_marks,
)


class SchoolExamViewSet(SchoolScopedModelViewSet):
    authentication_classes = (JWTAuthentication,)

    def get_permissions(self):
        permission = IsSchoolStaff if self.request.method in SAFE_METHODS else IsSchoolAdministrator
        return [IsAuthenticated(), permission()]


class ExamViewSet(SchoolExamViewSet):
    queryset = Exam.objects.all()
    serializer_class = ExamSerializer

    def get_permissions(self):
        if self.action == "marks":
            return [IsAuthenticated(), IsSchoolStaff()]
        return super().get_permissions()

    def get_queryset(self):
        queryset = super().get_queryset()
        params = self.request.query_params
        for field in ("grade", "section", "academic_year", "status", "term"):
            value = params.get(field)
            if value:
                queryset = queryset.filter(**{field: value})
        query = params.get("q", "").strip()
        if query:
            queryset = queryset.filter(Q(name__icontains=query) | Q(grade__icontains=query) | Q(section__icontains=query))
        return queryset.order_by("-exam_date", "name")

    @action(detail=False, methods=("get",), url_path="class-options")
    def class_options(self, request):
        school = self.get_school()
        classes = Student.objects.filter(school=school).values("grade", "section").distinct().order_by("grade", "section")
        years = Exam.objects.filter(school=school).exclude(academic_year="").values_list("academic_year", flat=True).distinct().order_by("-academic_year")
        return Response({"classes": list(classes), "academic_years": list(years)})

    @action(detail=False, methods=("get",), url_path="summary")
    def summary(self, request):
        exams = self.filter_queryset(self.get_queryset())
        return Response({
            "exam_count": exams.count(),
            "draft_count": exams.filter(status=Exam.Status.DRAFT).count(),
            "scheduled_count": exams.filter(status=Exam.Status.SCHEDULED).count(),
            "published_count": exams.filter(status=Exam.Status.PUBLISHED).count(),
            "result_count": Result.objects.filter(school=self.get_school(), exam__in=exams).count(),
        })

    @action(detail=True, methods=("get",), url_path="roster")
    def roster(self, request, pk=None):
        exam = self.get_object()
        students = Student.objects.filter(
            school=exam.school,
            grade=exam.grade,
            section=exam.section,
        ).select_related("user").order_by("admission_no")
        results = {
            (result.student_id, result.subject.casefold()): result
            for result in Result.objects.filter(exam=exam).select_related("student", "student__user")
        }
        subjects = request.query_params.getlist("subject")
        roster = []
        for student in students:
            student_results = [
                ResultSerializer(result).data
                for (student_id, _), result in results.items()
                if student_id == student.pk and (not subjects or result.subject in subjects)
            ]
            roster.append({
                "student": student.pk,
                "student_name": student.name,
                "admission_no": student.admission_no,
                "grade": student.grade,
                "section": student.section,
                "results": student_results,
            })
        return Response({"exam": ExamSerializer(exam).data, "students": roster})

    @action(detail=True, methods=("post",), url_path="marks")
    def marks(self, request, pk=None):
        exam = self.get_object()
        if exam.status == Exam.Status.PUBLISHED:
            raise ValidationError("Published exam marks are locked.")
        payload = BulkResultSerializer(data=request.data)
        payload.is_valid(raise_exception=True)
        school = self.get_school()
        records = payload.validated_data["records"]
        student_ids = {record["student"] for record in records}
        students = {
            student.pk: student
            for student in Student.objects.filter(
                school=school,
                grade=exam.grade,
                section=exam.section,
                pk__in=student_ids,
            )
        }
        if len(students) != len(student_ids):
            raise ValidationError({"records": "One or more students are outside this exam class."})
        for record in records:
            if record["marks"] > exam.total_marks:
                raise ValidationError({"marks": f"Marks cannot exceed {exam.total_marks}."})

        with transaction.atomic():
            for record in records:
                student = students[record["student"]]
                Result.objects.update_or_create(
                    school=school,
                    exam=exam,
                    student=student,
                    subject=record["subject"].strip(),
                    defaults={
                        "marks": record["marks"],
                        "grade": grade_for_marks(record["marks"], exam.total_marks, exam.passing_marks),
                        "remarks": record.get("remarks", ""),
                    },
                )
        saved = Result.objects.filter(school=school, exam=exam, student_id__in=student_ids).select_related("student__user", "exam")
        return Response(ResultSerializer(saved, many=True).data, status=status.HTTP_200_OK)

    @action(detail=True, methods=("post",), url_path="publish")
    def publish(self, request, pk=None):
        exam = self.get_object()
        count = Result.objects.filter(exam=exam).count()
        if count == 0:
            raise ValidationError("Enter at least one result before publishing this exam.")
        exam.status = Exam.Status.PUBLISHED
        exam.save(update_fields=("status",))
        return Response({"exam": ExamSerializer(exam).data, "result_count": count})


class ResultViewSet(SchoolExamViewSet):
    queryset = Result.objects.select_related("student__user", "exam").all()
    serializer_class = ResultSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        params = self.request.query_params
        for field in ("exam", "subject", "student__grade", "student__section"):
            value = params.get(field)
            if value:
                queryset = queryset.filter(**{field: value})
        query = params.get("q", "").strip()
        if query:
            queryset = queryset.filter(
                Q(student__user__first_name__icontains=query)
                | Q(student__user__last_name__icontains=query)
                | Q(student__admission_no__icontains=query)
                | Q(subject__icontains=query)
            )
        return queryset.order_by("exam__exam_date", "student__admission_no", "subject")

    @action(detail=False, methods=("get",), url_path="report")
    def report(self, request):
        exam_id = request.query_params.get("exam")
        if not exam_id:
            raise ValidationError({"exam": "Select an exam to build its report."})
        try:
            exam = Exam.objects.get(pk=exam_id, school=self.get_school())
        except Exam.DoesNotExist as exc:
            raise ValidationError({"exam": "The selected exam was not found in this school."}) from exc

        results = Result.objects.filter(school=self.get_school(), exam=exam).select_related("student", "student__user")
        grade_filter = request.query_params.get("grade")
        if grade_filter:
            results = results.filter(student__grade=grade_filter)
        subject_summary = list(results.values("subject").annotate(
            entries=Count("id"),
            average=Avg("marks"),
            highest=Max("marks"),
            passed=Count("id", filter=Q(marks__gte=exam.passing_marks)),
        ).order_by("subject"))
        student_rows = {}
        for result in results:
            row = student_rows.setdefault(result.student_id, {
                "student": result.student_id,
                "student_name": result.student.name,
                "admission_no": result.student.admission_no,
                "grade": result.student.grade,
                "section": result.student.section,
                "total_marks": 0,
                "maximum_marks": 0,
                "subjects": 0,
                "passed_subjects": 0,
            })
            row["total_marks"] += result.marks
            row["maximum_marks"] += exam.total_marks
            row["subjects"] += 1
            row["passed_subjects"] += result.marks >= exam.passing_marks
        ranked = sorted(
            student_rows.values(),
            key=lambda row: (-row["total_marks"] / row["maximum_marks"] if row["maximum_marks"] else 0, row["admission_no"]),
        )
        for rank, row in enumerate(ranked, start=1):
            row["rank"] = rank
            row["percentage"] = round(row["total_marks"] * 100 / row["maximum_marks"], 1) if row["maximum_marks"] else 0
            row["overall_grade"] = grade_for_marks(
                round(row["total_marks"] * exam.total_marks / row["maximum_marks"]) if row["maximum_marks"] else 0,
                exam.total_marks,
                exam.passing_marks,
            )
        totals = results.aggregate(
            entries=Count("id"),
            average=Avg("marks"),
            passed=Count("id", filter=Q(marks__gte=exam.passing_marks)),
        )
        return Response({
            "exam": ExamSerializer(exam).data,
            "summary": {
                "students_assessed": len(ranked),
                "results_entered": totals["entries"],
                "average_marks": round(totals["average"] or 0, 1),
                "pass_rate": round(totals["passed"] * 100 / totals["entries"], 1) if totals["entries"] else 0,
                "pass_mark": exam.passing_marks,
            },
            "subjects": subject_summary,
            "students": ranked,
        })
