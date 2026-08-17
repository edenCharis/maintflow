import uuid

from django.db import models


class TimeStampedModel(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class TenantModel(TimeStampedModel):
    """Base model for any record that belongs to a single company (tenant).

    All business data must be scoped to a company so that tenants never see
    each other's data. Views must filter querysets by request.user.company.
    """

    company = models.ForeignKey(
        "companies.Company", on_delete=models.CASCADE, related_name="+"
    )

    class Meta:
        abstract = True
