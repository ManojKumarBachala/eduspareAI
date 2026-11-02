from django.shortcuts import render

# Create your views here.
from rest_framework import viewsets

from .models import (
    Book,
    BookIssue
)

from .serializers import (
    BookSerializer,
    BookIssueSerializer
)

class BookViewSet(
    viewsets.ModelViewSet
):
    queryset = Book.objects.all()
    serializer_class = BookSerializer


class BookIssueViewSet(
    viewsets.ModelViewSet
):
    queryset = BookIssue.objects.all()
    serializer_class = BookIssueSerializer