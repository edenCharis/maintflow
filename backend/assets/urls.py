from django.urls import path
from rest_framework.routers import DefaultRouter

from assets.views import (
    AssetCategoryViewSet,
    AssetDocumentViewSet,
    AssetScanView,
    AssetViewSet,
)

router = DefaultRouter()
router.register("categories", AssetCategoryViewSet, basename="asset-category")
router.register("documents", AssetDocumentViewSet, basename="asset-document")
router.register("", AssetViewSet, basename="asset")

urlpatterns = [
    path("scan/<uuid:token>/", AssetScanView.as_view(), name="asset-scan"),
    *router.urls,
]
