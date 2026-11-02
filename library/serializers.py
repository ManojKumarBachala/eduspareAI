from rest_framework import serializers

from .models import (
    Book,
    BookIssue
)

class BookSerializer(serializers.ModelSerializer):
    class Meta:
        model = Book
        fields = "__all__"
        read_only_fields = ("id", "school")


class BookIssueSerializer(
    serializers.ModelSerializer
):
    class Meta:
        model = BookIssue
        fields = "__all__"
        read_only_fields = ("id", "school")