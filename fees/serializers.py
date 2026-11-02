from decimal import Decimal

from rest_framework import serializers

from .models import Fee, FeePayment


class FeePaymentSerializer(serializers.ModelSerializer):
    received_by_name = serializers.CharField(source="received_by.get_full_name", read_only=True, default="")

    class Meta:
        model = FeePayment
        fields = (
            "id",
            "amount",
            "method",
            "reference",
            "notes",
            "receipt_no",
            "paid_at",
            "received_by_name",
        )
        read_only_fields = fields


class FeePaymentInputSerializer(serializers.Serializer):
    amount = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=Decimal("0.01"))
    method = serializers.ChoiceField(choices=FeePayment.Method.choices)
    reference = serializers.CharField(max_length=100, required=False, allow_blank=True)
    notes = serializers.CharField(max_length=300, required=False, allow_blank=True)


class FeeSerializer(serializers.ModelSerializer):
    balance = serializers.ReadOnlyField()
    status = serializers.SerializerMethodField()
    student_name = serializers.CharField(source="student.name", read_only=True)
    admission_no = serializers.CharField(source="student.admission_no", read_only=True)
    grade = serializers.CharField(source="student.grade", read_only=True)
    section = serializers.CharField(source="student.section", read_only=True)
    payments = FeePaymentSerializer(many=True, read_only=True)

    class Meta:
        model = Fee
        fields = (
            "id",
            "student",
            "student_name",
            "admission_no",
            "grade",
            "section",
            "title",
            "category",
            "academic_year",
            "amount",
            "paid_amount",
            "balance",
            "status",
            "due_date",
            "created_at",
            "payments",
        )
        read_only_fields = (
            "id", "paid_amount", "created_at", "student_name", "admission_no",
            "grade", "section", "balance", "status", "payments",
        )

    def get_status(self, fee):
        return fee.status

    def validate_amount(self, value):
        if self.instance and value < self.instance.paid_amount:
            raise serializers.ValidationError("The charge cannot be less than payments already recorded.")
        return value