import uuid

from django.db import models

from core.models import TenantModel


class AssetCategory(TenantModel):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)

    class Meta:
        verbose_name_plural = "asset categories"
        constraints = [
            models.UniqueConstraint(
                fields=["company", "name"], name="unique_asset_category_per_company"
            )
        ]

    def __str__(self):
        return self.name


class Asset(TenantModel):
    class Status(models.TextChoices):
        IN_SERVICE = "in_service", "En service"
        IN_MAINTENANCE = "in_maintenance", "En maintenance"
        DOWN = "down", "En panne"
        OUT_OF_SERVICE = "out_of_service", "Hors service"
        RETIRED = "retired", "Retiré"

    class Criticality(models.TextChoices):
        LOW = "low", "Faible"
        MEDIUM = "medium", "Moyenne"
        HIGH = "high", "Élevée"
        CRITICAL = "critical", "Critique"

    name = models.CharField(max_length=255)
    code = models.CharField(max_length=100)
    serial_number = models.CharField(max_length=255, blank=True)
    manufacturer = models.CharField(max_length=255, blank=True)
    model = models.CharField(max_length=255, blank=True)
    category = models.ForeignKey(
        AssetCategory, on_delete=models.SET_NULL, null=True, blank=True, related_name="assets"
    )
    site = models.ForeignKey(
        "companies.Site", on_delete=models.CASCADE, related_name="assets"
    )
    location = models.ForeignKey(
        "companies.Location",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assets",
    )
    parent = models.ForeignKey(
        "self", on_delete=models.CASCADE, null=True, blank=True, related_name="children"
    )
    criticality = models.CharField(
        max_length=20, choices=Criticality.choices, default=Criticality.MEDIUM
    )
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.IN_SERVICE)
    installed_at = models.DateField(null=True, blank=True)
    commissioned_at = models.DateField(null=True, blank=True)
    warranty_end_at = models.DateField(null=True, blank=True)
    description = models.TextField(blank=True)
    photo = models.ImageField(upload_to="assets/photos/", blank=True, null=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["company", "code"], name="unique_asset_code_per_company"
            )
        ]
        ordering = ["name"]

    def __str__(self):
        return f"{self.code} - {self.name}"


class AssetDocument(TenantModel):
    class DocType(models.TextChoices):
        MANUAL = "manual", "Manuel"
        PLAN = "plan", "Plan"
        PROCEDURE = "procedure", "Procédure"
        CERTIFICATE = "certificate", "Certificat"
        PHOTO = "photo", "Photo"
        TECHNICAL_DOC = "technical_doc", "Documentation technique"

    asset = models.ForeignKey(Asset, on_delete=models.CASCADE, related_name="documents")
    doc_type = models.CharField(max_length=20, choices=DocType.choices)
    file = models.FileField(upload_to="assets/documents/")
    name = models.CharField(max_length=255, blank=True)
    uploaded_by = models.ForeignKey(
        "accounts.User", on_delete=models.SET_NULL, null=True, related_name="+"
    )

    def __str__(self):
        return self.name or self.file.name


class AssetQRCode(TenantModel):
    asset = models.OneToOneField(Asset, on_delete=models.CASCADE, related_name="qr_code")
    token = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    generated_at = models.DateTimeField(auto_now_add=True)
    last_scanned_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"QR({self.asset.code})"
