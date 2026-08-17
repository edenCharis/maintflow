from django.db import models

from core.models import TenantModel, TimeStampedModel


class Company(TimeStampedModel):
    """A tenant. Every business record in the system belongs to exactly one Company."""

    name = models.CharField(max_length=255)
    logo = models.ImageField(upload_to="companies/logos/", blank=True, null=True)
    address = models.CharField(max_length=255, blank=True)
    phone = models.CharField(max_length=50, blank=True)
    email = models.EmailField(blank=True)
    country = models.CharField(max_length=100, blank=True, default="Congo")
    currency = models.CharField(max_length=10, blank=True, default="XAF")
    timezone = models.CharField(max_length=64, blank=True, default="Africa/Brazzaville")
    is_active = models.BooleanField(default=True)

    # Free-form tenant configuration: OT numbering scheme, priorities,
    # criticality levels, equipment categories, maintenance types, statuses,
    # units of measure. Kept as JSON in V1 to stay extensible without schema churn.
    settings = models.JSONField(default=dict, blank=True)

    class Meta:
        verbose_name_plural = "companies"
        ordering = ["name"]

    def __str__(self):
        return self.name


class Site(TenantModel):
    STATUS_CHOICES = [
        ("active", "Active"),
        ("inactive", "Inactive"),
    ]

    name = models.CharField(max_length=255)
    code = models.CharField(max_length=50)
    address = models.CharField(max_length=255, blank=True)
    description = models.TextField(blank=True)
    manager = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="managed_sites",
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="active")

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["company", "code"], name="unique_site_code_per_company"
            )
        ]
        ordering = ["name"]

    def __str__(self):
        return f"{self.name} ({self.company.name})"


class Location(TenantModel):
    """A node in a site's physical asset tree: Zone / Atelier / etc.

    Machine / Sous-ensemble / Composant levels are represented by Asset's own
    self-referencing parent field (see assets.Asset), not by Location.
    """

    site = models.ForeignKey(Site, on_delete=models.CASCADE, related_name="locations")
    parent = models.ForeignKey(
        "self", on_delete=models.CASCADE, null=True, blank=True, related_name="children"
    )
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=50, blank=True)
    description = models.TextField(blank=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name
