from rest_framework import serializers

from .models import Timetable


class TimetableSerializer(serializers.ModelSerializer):
    teacher_name = serializers.CharField(source="teacher.name", read_only=True)
    teacher_subject = serializers.CharField(source="teacher.subject", read_only=True)

    class Meta:
        model = Timetable
        fields = (
            "id",
            "day",
            "period",
            "subject",
            "teacher",
            "teacher_name",
            "teacher_subject",
            "grade",
            "section",
            "start_time",
            "end_time",
            "room",
            "notes",
        )
        read_only_fields = ("id", "teacher_name", "teacher_subject")

    def validate(self, attrs):
        view = self.context.get("view")
        school = view.get_school() if view and hasattr(view, "get_school") else None
        instance = self.instance
        day = attrs.get("day", instance.day if instance else None)
        period = attrs.get("period", instance.period if instance else None)
        grade = attrs.get("grade", instance.grade if instance else None)
        section = attrs.get("section", instance.section if instance else None)
        teacher = attrs.get("teacher", instance.teacher if instance else None)
        start_time = attrs.get("start_time", instance.start_time if instance else None)
        end_time = attrs.get("end_time", instance.end_time if instance else None)
        room = attrs.get("room", instance.room if instance else "")

        if teacher and school and teacher.school_id != school.pk:
            raise serializers.ValidationError({"teacher": "Choose a teacher from this school."})
        if period is not None and period < 1:
            raise serializers.ValidationError({"period": "Period numbers start at 1."})
        if (start_time is None) != (end_time is None):
            raise serializers.ValidationError("Set both a start and end time, or leave both blank.")
        if start_time and end_time and end_time <= start_time:
            raise serializers.ValidationError({"end_time": "End time must be after start time."})
        if not school or not day:
            return attrs

        slots = Timetable.objects.filter(school=school, day=day)
        if instance:
            slots = slots.exclude(pk=instance.pk)
        for slot in slots.select_related("teacher"):
            same_class = slot.grade == grade and slot.section == section
            same_period = slot.period == period
            overlap = bool(
                start_time and end_time and slot.start_time and slot.end_time
                and start_time < slot.end_time and end_time > slot.start_time
            )
            if same_class and (same_period or overlap):
                raise serializers.ValidationError({
                    "period": f"This class already has a timetable entry during period {slot.period}."
                })
            if teacher and slot.teacher_id == teacher.pk and (same_period or overlap):
                raise serializers.ValidationError({
                    "teacher": f"{teacher.name} is already scheduled during period {slot.period}."
                })
            if room and slot.room.casefold() == room.casefold() and (same_period or overlap):
                raise serializers.ValidationError({
                    "room": f"Room {room} is already booked during period {slot.period}."
                })
        return attrs
