from rest_framework import serializers

from audit.models import AuditLog


class AuditLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = AuditLog
        fields = [
            "id",
            "user",
            "user_email",
            "action",
            "content_type",
            "object_id",
            "object_repr",
            "old_value",
            "new_value",
            "ip_address",
            "created_at",
        ]
        read_only_fields = fields
