from rest_framework import serializers

from accounts.models import User
from requests_app.models import InterventionRequest


class InterventionRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = InterventionRequest
        fields = [
            "id",
            "company",
            "asset",
            "location",
            "description",
            "urgency",
            "photo",
            "video",
            "status",
            "requested_by",
            "reviewed_by",
            "review_note",
            "work_order",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "company",
            "status",
            "requested_by",
            "reviewed_by",
            "review_note",
            "work_order",
            "created_at",
        ]


class ConvertToWorkOrderSerializer(serializers.Serializer):
    title = serializers.CharField(required=False)
    priority = serializers.CharField(required=False)
    technician = serializers.PrimaryKeyRelatedField(queryset=User.objects.all(), required=False)
    scheduled_at = serializers.DateTimeField(required=False)


class ReviewNoteSerializer(serializers.Serializer):
    note = serializers.CharField(required=False, allow_blank=True)
