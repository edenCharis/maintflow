from rest_framework.routers import DefaultRouter

from maintenance.views import MaintenanceChecklistItemViewSet, MaintenancePlanViewSet

router = DefaultRouter()
router.register("checklist-items", MaintenanceChecklistItemViewSet, basename="checklist-item")
router.register("", MaintenancePlanViewSet, basename="maintenance-plan")

urlpatterns = router.urls
