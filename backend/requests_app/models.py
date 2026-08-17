from django.db import models

from core.models import TenantModel


class InterventionRequest(TenantModel):
    class Urgency(models.TextChoices):
        LOW = "low", "Faible"
        NORMAL = "normal", "Normale"
        HIGH = "high", "Haute"
        CRITICAL = "critical", "Critique"

    class Status(models.TextChoices):
        NEW = "new", "Nouvelle"
        IN_ANALYSIS = "in_analysis", "En analyse"
        ACCEPTED = "accepted", "Acceptée"
        CONVERTED = "converted", "Convertie en OT"
        CLOSED = "closed", "Clôturée"
        REJECTED = "rejected", "Rejetée"

    asset = models.ForeignKey(
        "assets.Asset", on_delete=models.CASCADE, related_name="requests"
    )
    location = models.ForeignKey(
        "companies.Location", on_delete=models.SET_NULL, null=True, blank=True, related_name="+"
    )
    description = models.TextField()
    urgency = models.CharField(max_length=20, choices=Urgency.choices, default=Urgency.NORMAL)
    photo = models.ImageField(upload_to="requests/photos/", blank=True, null=True)
    video = models.FileField(upload_to="requests/videos/", blank=True, null=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.NEW)
    requested_by = models.ForeignKey(
        "accounts.User", on_delete=models.SET_NULL, null=True, related_name="requests"
    )
    reviewed_by = models.ForeignKey(
        "accounts.User", on_delete=models.SET_NULL, null=True, blank=True, related_name="+"
    )
    review_note = models.TextField(blank=True)
    work_order = models.OneToOneField(
        "workorders.WorkOrder",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="source_request",
    )

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Demande #{str(self.id)[:8]} - {self.asset.name}"
