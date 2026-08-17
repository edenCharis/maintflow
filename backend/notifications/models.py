from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.db import models

from core.models import TenantModel


class Notification(TenantModel):
    class Event(models.TextChoices):
        NEW_REQUEST = "new_request", "Nouvelle demande"
        WO_ASSIGNED = "wo_assigned", "OT assigné"
        WO_OVERDUE = "wo_overdue", "OT en retard"
        WO_DONE = "wo_done", "OT terminé"
        WO_VALIDATED = "wo_validated", "OT validé"
        PM_UPCOMING = "pm_upcoming", "Maintenance préventive à venir"
        PM_OVERDUE = "pm_overdue", "Maintenance en retard"
        CRITICAL_FAILURE = "critical_failure", "Panne critique"

    recipient = models.ForeignKey(
        "accounts.User", on_delete=models.CASCADE, related_name="notifications"
    )
    event = models.CharField(max_length=30, choices=Event.choices)
    title = models.CharField(max_length=255)
    message = models.TextField(blank=True)
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)

    # Generic link to the object this notification is about (WorkOrder, Failure, ...)
    content_type = models.ForeignKey(
        ContentType, on_delete=models.CASCADE, null=True, blank=True
    )
    object_id = models.UUIDField(null=True, blank=True)
    related_object = GenericForeignKey("content_type", "object_id")

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.get_event_display()} -> {self.recipient}"
