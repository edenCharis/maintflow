from django.contrib import admin

from notifications.models import Notification


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ["event", "recipient", "company", "is_read", "created_at"]
    list_filter = ["company", "event", "is_read"]
