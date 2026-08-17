from rest_framework import serializers

from maintenance.models import MaintenanceChecklistItem, MaintenancePlan


class MaintenanceChecklistItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = MaintenanceChecklistItem
        fields = ["id", "plan", "label", "order"]
        read_only_fields = ["id"]


class MaintenancePlanSerializer(serializers.ModelSerializer):
    checklist_items = MaintenanceChecklistItemSerializer(many=True, read_only=True)

    class Meta:
        model = MaintenancePlan
        fields = [
            "id",
            "company",
            "name",
            "asset",
            "description",
            "plan_type",
            "frequency",
            "estimated_duration_minutes",
            "responsible",
            "instructions",
            "is_active",
            "next_due_at",
            "last_generated_at",
            "checklist_items",
        ]
        read_only_fields = ["id", "company", "last_generated_at"]
