from django.contrib import admin

from assets.models import Asset, AssetCategory, AssetDocument, AssetQRCode


@admin.register(AssetCategory)
class AssetCategoryAdmin(admin.ModelAdmin):
    list_display = ["name", "company"]
    list_filter = ["company"]


@admin.register(Asset)
class AssetAdmin(admin.ModelAdmin):
    list_display = ["code", "name", "company", "site", "status", "criticality"]
    list_filter = ["company", "site", "status", "criticality"]
    search_fields = ["code", "name", "serial_number"]


admin.site.register(AssetDocument)
admin.site.register(AssetQRCode)
