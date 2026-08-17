from django.contrib import admin

from failures.models import Failure


@admin.register(Failure)
class FailureAdmin(admin.ModelAdmin):
    list_display = ["asset", "company", "status", "priority", "started_at"]
    list_filter = ["company", "status", "priority"]
