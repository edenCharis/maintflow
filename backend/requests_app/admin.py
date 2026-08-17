from django.contrib import admin

from requests_app.models import InterventionRequest


@admin.register(InterventionRequest)
class InterventionRequestAdmin(admin.ModelAdmin):
    list_display = ["id", "asset", "company", "status", "urgency", "requested_by"]
    list_filter = ["company", "status", "urgency"]
