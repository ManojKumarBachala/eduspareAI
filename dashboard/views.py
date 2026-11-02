from rest_framework.decorators import api_view
from rest_framework.response import Response

from students.models import Student
from teachers.models import Teacher
from library.models import Book
from transport.models import Vehicle


@api_view(["GET"])
def dashboard_stats(request):
    return Response({
        "total_students": Student.objects.count(),
        "total_teachers": Teacher.objects.count(),
        "total_books": Book.objects.count(),
        "total_vehicles": Vehicle.objects.count(),
    })