from rest_framework import serializers

from notifications.models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = [
            "id",
            "recipient",
            "event",
            "title",
            "message",
            "is_read",
            "read_at",
            "content_type",
            "object_id",
            "created_at",
        ]
        read_only_fields = fields
