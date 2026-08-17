from django.contrib import admin

from workorders.models import WorkOrder, WorkOrderPhoto, WorkOrderTask


@admin.register(WorkOrder)
class WorkOrderAdmin(admin.ModelAdmin):
    list_display = ["number", "title", "company", "status", "priority", "technician"]
    list_filter = ["company", "status", "priority", "wo_type"]
    search_fields = ["number", "title"]


admin.site.register(WorkOrderTask)
admin.site.register(WorkOrderPhoto)
