from django.contrib import admin

from maintenance.models import MaintenanceChecklistItem, MaintenancePlan


class MaintenanceChecklistItemInline(admin.TabularInline):
    model = MaintenanceChecklistItem
    extra = 1


@admin.register(MaintenancePlan)
class MaintenancePlanAdmin(admin.ModelAdmin):
    list_display = ["name", "asset", "company", "frequency", "is_active", "next_due_at"]
    list_filter = ["company", "frequency", "is_active"]
    inlines = [MaintenanceChecklistItemInline]
