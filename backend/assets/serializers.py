from rest_framework import serializers

from assets.models import Asset, AssetCategory, AssetDocument, AssetQRCode


class AssetCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = AssetCategory
        fields = ["id", "company", "name", "description"]
        read_only_fields = ["id", "company"]


class AssetSerializer(serializers.ModelSerializer):
    class Meta:
        model = Asset
        fields = [
            "id",
            "company",
            "name",
            "code",
            "serial_number",
            "manufacturer",
            "model",
            "category",
            "site",
            "location",
            "parent",
            "criticality",
            "status",
            "installed_at",
            "commissioned_at",
            "warranty_end_at",
            "description",
            "photo",
        ]
        read_only_fields = ["id", "company"]


class AssetDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = AssetDocument
        fields = ["id", "company", "asset", "doc_type", "file", "name", "uploaded_by"]
        read_only_fields = ["id", "company", "uploaded_by"]


class AssetQRCodeSerializer(serializers.ModelSerializer):
    class Meta:
        model = AssetQRCode
        fields = ["id", "asset", "token", "generated_at", "last_scanned_at"]
        read_only_fields = fields


class AssetScanSerializer(serializers.ModelSerializer):
    """Payload shown after a QR code scan: everything the spec's mobile screen needs."""

    next_maintenance_at = serializers.SerializerMethodField()
    last_intervention_at = serializers.SerializerMethodField()

    class Meta:
        model = Asset
        fields = [
            "id",
            "name",
            "code",
            "status",
            "criticality",
            "next_maintenance_at",
            "last_intervention_at",
        ]

    def get_next_maintenance_at(self, obj):
        plan = obj.maintenance_plans.filter(is_active=True).order_by("next_due_at").first()
        return plan.next_due_at if plan else None

    def get_last_intervention_at(self, obj):
        wo = obj.work_orders.filter(finished_at__isnull=False).order_by("-finished_at").first()
        return wo.finished_at if wo else None
