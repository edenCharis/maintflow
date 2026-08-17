from django.contrib import admin

from companies.models import Company, Location, Site


@admin.register(Company)
class CompanyAdmin(admin.ModelAdmin):
    list_display = ["name", "country", "currency", "is_active"]
    search_fields = ["name"]


@admin.register(Site)
class SiteAdmin(admin.ModelAdmin):
    list_display = ["name", "code", "company", "status"]
    list_filter = ["company", "status"]
    search_fields = ["name", "code"]


@admin.register(Location)
class LocationAdmin(admin.ModelAdmin):
    list_display = ["name", "site", "parent", "company"]
    list_filter = ["company", "site"]
