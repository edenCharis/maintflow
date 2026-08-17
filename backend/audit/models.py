from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.db import models

from core.models import TenantModel


class AuditLog(TenantModel):
    class Action(models.TextChoices):
        LOGIN = "login", "Connexion"
        CREATE = "create", "Création"
        UPDATE = "update", "Modification"
        DELETE = "delete", "Suppression"
        STATUS_CHANGE = "status_change", "Changement de statut"
        ASSIGNMENT = "assignment", "Affectation"
        VALIDATION = "validation", "Validation"
        CLOSURE = "closure", "Clôture"

    user = models.ForeignKey(
        "accounts.User", on_delete=models.SET_NULL, null=True, blank=True, related_name="audit_logs"
    )
    user_email = models.EmailField(blank=True)
    action = models.CharField(max_length=20, choices=Action.choices)

    content_type = models.ForeignKey(
        ContentType, on_delete=models.CASCADE, null=True, blank=True
    )
    object_id = models.UUIDField(null=True, blank=True)
    target = GenericForeignKey("content_type", "object_id")
    object_repr = models.CharField(max_length=255, blank=True)

    old_value = models.JSONField(null=True, blank=True)
    new_value = models.JSONField(null=True, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.get_action_display()} - {self.object_repr}"
