from rest_framework import serializers

from failures.models import Failure


class FailureSerializer(serializers.ModelSerializer):
    class Meta:
        model = Failure
        fields = [
            "id",
            "company",
            "asset",
            "source_request",
            "work_order",
            "started_at",
            "description",
            "priority",
            "cause",
            "symptoms",
            "photo",
            "comment",
            "downtime_minutes",
            "status",
            "reported_by",
            "created_at",
        ]
        read_only_fields = ["id", "company", "reported_by", "created_at"]
