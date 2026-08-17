from django.db import models

from core.models import TenantModel


class WorkOrder(TenantModel):
    class WOType(models.TextChoices):
        CORRECTIVE = "corrective", "Corrective"
        PREVENTIVE = "preventive", "Préventive"
        INSPECTION = "inspection", "Inspection"

    class Priority(models.TextChoices):
        LOW = "low", "Faible"
        NORMAL = "normal", "Normale"
        HIGH = "high", "Haute"
        URGENT = "urgent", "Urgente"
        CRITICAL = "critical", "Critique"

    class Status(models.TextChoices):
        DRAFT = "draft", "Brouillon"
        PLANNED = "planned", "Planifié"
        ASSIGNED = "assigned", "Assigné"
        IN_PROGRESS = "in_progress", "En cours"
        ON_HOLD = "on_hold", "En attente"
        DONE = "done", "Terminé"
        VALIDATED = "validated", "Validé"
        CLOSED = "closed", "Clôturé"

    class Result(models.TextChoices):
        REPAIRED = "repaired", "Réparé"
        PARTIALLY_REPAIRED = "partially_repaired", "Partiellement réparé"
        NOT_REPAIRED = "not_repaired", "Non réparé"
        NEEDS_FOLLOWUP = "needs_followup", "Nécessite une nouvelle intervention"

    number = models.CharField(max_length=50)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    wo_type = models.CharField(max_length=20, choices=WOType.choices)
    asset = models.ForeignKey(
        "assets.Asset", on_delete=models.CASCADE, related_name="work_orders"
    )
    site = models.ForeignKey(
        "companies.Site", on_delete=models.CASCADE, related_name="work_orders"
    )
    priority = models.CharField(max_length=20, choices=Priority.choices, default=Priority.NORMAL)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)
    requested_by = models.ForeignKey(
        "accounts.User", on_delete=models.SET_NULL, null=True, blank=True, related_name="+"
    )
    technician = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_work_orders",
    )
    maintenance_plan = models.ForeignKey(
        "maintenance.MaintenancePlan",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="generated_work_orders",
    )
    scheduled_at = models.DateTimeField(null=True, blank=True)
    estimated_duration_minutes = models.PositiveIntegerField(null=True, blank=True)

    # Execution
    started_at = models.DateTimeField(null=True, blank=True)
    finished_at = models.DateTimeField(null=True, blank=True)
    time_spent_minutes = models.PositiveIntegerField(null=True, blank=True)
    work_performed = models.TextField(blank=True)
    identified_cause = models.TextField(blank=True)
    solution_applied = models.TextField(blank=True)
    technician_comment = models.TextField(blank=True)
    result = models.CharField(max_length=30, choices=Result.choices, blank=True)

    # Validation
    submitted_at = models.DateTimeField(null=True, blank=True)
    submitted_by = models.ForeignKey(
        "accounts.User", on_delete=models.SET_NULL, null=True, blank=True, related_name="+"
    )
    validated_at = models.DateTimeField(null=True, blank=True)
    validated_by = models.ForeignKey(
        "accounts.User", on_delete=models.SET_NULL, null=True, blank=True, related_name="+"
    )
    validation_note = models.TextField(blank=True)
    closed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["company", "number"], name="unique_wo_number_per_company"
            )
        ]
        ordering = ["-created_at"]

    def __str__(self):
        return f"OT {self.number} - {self.title}"


class WorkOrderTask(TenantModel):
    """A checklist line executed as part of a work order (see maintenance checklists)."""

    class Result(models.TextChoices):
        CONFORME = "conforme", "Conforme"
        NON_CONFORME = "non_conforme", "Non conforme"
        NOT_APPLICABLE = "not_applicable", "Non applicable"

    work_order = models.ForeignKey(WorkOrder, on_delete=models.CASCADE, related_name="tasks")
    label = models.CharField(max_length=255)
    order = models.PositiveIntegerField(default=0)
    result = models.CharField(max_length=20, choices=Result.choices, blank=True)
    comment = models.TextField(blank=True)
    photo = models.ImageField(upload_to="work_orders/tasks/", blank=True, null=True)

    class Meta:
        ordering = ["order"]

    def __str__(self):
        return self.label


class WorkOrderPhoto(TenantModel):
    class Kind(models.TextChoices):
        BEFORE = "before", "Avant"
        AFTER = "after", "Après"

    work_order = models.ForeignKey(WorkOrder, on_delete=models.CASCADE, related_name="photos")
    kind = models.CharField(max_length=10, choices=Kind.choices)
    image = models.ImageField(upload_to="work_orders/photos/")
    uploaded_by = models.ForeignKey(
        "accounts.User", on_delete=models.SET_NULL, null=True, related_name="+"
    )

    def __str__(self):
        return f"{self.work_order.number} - {self.kind}"
