from core.viewsets import TenantModelViewSet
from maintenance.models import MaintenanceChecklistItem, MaintenancePlan
from maintenance.serializers import MaintenanceChecklistItemSerializer, MaintenancePlanSerializer


class MaintenancePlanViewSet(TenantModelViewSet):
    queryset = MaintenancePlan.objects.all()
    serializer_class = MaintenancePlanSerializer
    filterset_fields = ["asset", "plan_type", "frequency", "is_active"]
    search_fields = ["name"]


class MaintenanceChecklistItemViewSet(TenantModelViewSet):
    queryset = MaintenanceChecklistItem.objects.all()
    serializer_class = MaintenanceChecklistItemSerializer
    filterset_fields = ["plan"]
