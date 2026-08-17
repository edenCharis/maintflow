from django.db import models

from core.models import TenantModel


class MaintenancePlan(TenantModel):
    class Frequency(models.TextChoices):
        DAILY = "daily", "Quotidienne"
        WEEKLY = "weekly", "Hebdomadaire"
        MONTHLY = "monthly", "Mensuelle"
        QUARTERLY = "quarterly", "Trimestrielle"
        SEMI_ANNUAL = "semi_annual", "Semestrielle"
        ANNUAL = "annual", "Annuelle"

    class PlanType(models.TextChoices):
        PREVENTIVE = "preventive", "Préventive"
        INSPECTION = "inspection", "Inspection"

    name = models.CharField(max_length=255)
    asset = models.ForeignKey(
        "assets.Asset", on_delete=models.CASCADE, related_name="maintenance_plans"
    )
    description = models.TextField(blank=True)
    plan_type = models.CharField(
        max_length=20, choices=PlanType.choices, default=PlanType.PREVENTIVE
    )
    frequency = models.CharField(max_length=20, choices=Frequency.choices)
    estimated_duration_minutes = models.PositiveIntegerField(null=True, blank=True)
    responsible = models.ForeignKey(
        "accounts.User", on_delete=models.SET_NULL, null=True, blank=True, related_name="+"
    )
    instructions = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    next_due_at = models.DateTimeField(null=True, blank=True)
    last_generated_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class MaintenanceChecklistItem(TenantModel):
    plan = models.ForeignKey(
        MaintenancePlan, on_delete=models.CASCADE, related_name="checklist_items"
    )
    label = models.CharField(max_length=255)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order"]

    def __str__(self):
        return self.label
