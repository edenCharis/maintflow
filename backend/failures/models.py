from django.db import models

from core.models import TenantModel


class Failure(TenantModel):
    class Priority(models.TextChoices):
        LOW = "low", "Faible"
        NORMAL = "normal", "Normale"
        HIGH = "high", "Haute"
        URGENT = "urgent", "Urgente"
        CRITICAL = "critical", "Critique"

    class Status(models.TextChoices):
        OPEN = "open", "Ouverte"
        IN_PROGRESS = "in_progress", "En cours"
        RESOLVED = "resolved", "Résolue"
        CLOSED = "closed", "Clôturée"

    asset = models.ForeignKey(
        "assets.Asset", on_delete=models.CASCADE, related_name="failures"
    )
    source_request = models.ForeignKey(
        "requests_app.InterventionRequest",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="failures",
    )
    work_order = models.ForeignKey(
        "workorders.WorkOrder",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="failures",
    )
    started_at = models.DateTimeField()
    description = models.TextField()
    priority = models.CharField(max_length=20, choices=Priority.choices, default=Priority.NORMAL)
    cause = models.TextField(blank=True)
    symptoms = models.TextField(blank=True)
    photo = models.ImageField(upload_to="failures/photos/", blank=True, null=True)
    comment = models.TextField(blank=True)
    downtime_minutes = models.PositiveIntegerField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.OPEN)
    reported_by = models.ForeignKey(
        "accounts.User", on_delete=models.SET_NULL, null=True, related_name="reported_failures"
    )

    class Meta:
        ordering = ["-started_at"]

    def __str__(self):
        return f"Panne {self.asset.name} - {self.started_at:%Y-%m-%d}"
