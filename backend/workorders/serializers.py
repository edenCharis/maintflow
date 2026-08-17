from rest_framework import serializers

from accounts.models import User
from workorders.models import WorkOrder, WorkOrderPhoto, WorkOrderTask


class WorkOrderTaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkOrderTask
        fields = ["id", "work_order", "label", "order", "result", "comment", "photo"]
        read_only_fields = ["id"]


class WorkOrderPhotoSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkOrderPhoto
        fields = ["id", "work_order", "kind", "image", "uploaded_by"]
        read_only_fields = ["id", "uploaded_by"]


class WorkOrderSerializer(serializers.ModelSerializer):
    tasks = WorkOrderTaskSerializer(many=True, read_only=True)
    photos = WorkOrderPhotoSerializer(many=True, read_only=True)
    asset_name = serializers.CharField(source="asset.name", read_only=True)
    asset_code = serializers.CharField(source="asset.code", read_only=True)
    site_name = serializers.CharField(source="site.name", read_only=True)
    technician_name = serializers.SerializerMethodField()
    requested_by_name = serializers.SerializerMethodField()

    class Meta:
        model = WorkOrder
        fields = [
            "id",
            "company",
            "number",
            "title",
            "description",
            "wo_type",
            "asset",
            "asset_name",
            "asset_code",
            "site",
            "site_name",
            "priority",
            "status",
            "requested_by",
            "requested_by_name",
            "technician",
            "technician_name",
            "maintenance_plan",
            "scheduled_at",
            "estimated_duration_minutes",
            "started_at",
            "finished_at",
            "time_spent_minutes",
            "work_performed",
            "identified_cause",
            "solution_applied",
            "technician_comment",
            "result",
            "submitted_at",
            "submitted_by",
            "validated_at",
            "validated_by",
            "validation_note",
            "closed_at",
            "tasks",
            "photos",
            "created_at",
        ]

    def get_technician_name(self, obj):
        return f"{obj.technician.first_name} {obj.technician.last_name}".strip() if obj.technician else None

    def get_requested_by_name(self, obj):
        return (
            f"{obj.requested_by.first_name} {obj.requested_by.last_name}".strip()
            if obj.requested_by
            else None
        )
        read_only_fields = [
            "id",
            "company",
            "number",
            "status",
            "started_at",
            "finished_at",
            "submitted_at",
            "submitted_by",
            "validated_at",
            "validated_by",
            "closed_at",
            "created_at",
        ]


class AssignSerializer(serializers.Serializer):
    technician = serializers.PrimaryKeyRelatedField(queryset=User.objects.all())
    scheduled_at = serializers.DateTimeField(required=False)


class ExecutionSubmitSerializer(serializers.Serializer):
    work_performed = serializers.CharField()
    identified_cause = serializers.CharField(required=False, allow_blank=True)
    solution_applied = serializers.CharField(required=False, allow_blank=True)
    technician_comment = serializers.CharField(required=False, allow_blank=True)
    time_spent_minutes = serializers.IntegerField(required=False)
    result = serializers.ChoiceField(choices=WorkOrder.Result.choices)


class ValidationSerializer(serializers.Serializer):
    note = serializers.CharField(required=False, allow_blank=True)
