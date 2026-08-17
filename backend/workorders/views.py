from django.utils import timezone
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response

from accounts.models import User
from audit.models import AuditLog
from audit.utils import log_action
from core.permissions import role_required
from core.viewsets import TenantModelViewSet
from notifications.models import Notification
from notifications.utils import notify, notify_many
from workorders.models import WorkOrder, WorkOrderPhoto, WorkOrderTask
from workorders.serializers import (
    AssignSerializer,
    ExecutionSubmitSerializer,
    ValidationSerializer,
    WorkOrderPhotoSerializer,
    WorkOrderSerializer,
    WorkOrderTaskSerializer,
)
from workorders.utils import next_wo_number

PLANNER_ROLES = (User.Role.ADMIN, User.Role.MAINTENANCE_MANAGER, User.Role.PLANNER)
VALIDATOR_ROLES = (User.Role.ADMIN, User.Role.MAINTENANCE_MANAGER)


class WorkOrderViewSet(TenantModelViewSet):
    queryset = WorkOrder.objects.select_related("asset", "site", "technician", "requested_by")
    serializer_class = WorkOrderSerializer
    filterset_fields = ["status", "priority", "wo_type", "asset", "site", "technician"]
    search_fields = ["number", "title"]

    def perform_create(self, serializer):
        serializer.save(
            company=self.request.user.company, number=next_wo_number(self.request.user.company_id)
        )

    def get_permissions(self):
        if self.action in ("assign", "validate", "reject", "close"):
            roles = VALIDATOR_ROLES if self.action in ("validate", "reject", "close") else PLANNER_ROLES
            return [role_required(*roles)()]
        return super().get_permissions()

    def _log_status(self, wo, old_status, request):
        log_action(
            user=request.user,
            action=AuditLog.Action.STATUS_CHANGE,
            instance=wo,
            old_value={"status": old_status},
            new_value={"status": wo.status},
            request=request,
        )

    @action(detail=True, methods=["post"])
    def assign(self, request, pk=None):
        wo = self.get_object()
        serializer = AssignSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        old_status = wo.status
        wo.technician = serializer.validated_data["technician"]
        if serializer.validated_data.get("scheduled_at"):
            wo.scheduled_at = serializer.validated_data["scheduled_at"]
        wo.status = WorkOrder.Status.ASSIGNED
        wo.save()
        log_action(
            user=request.user,
            action=AuditLog.Action.ASSIGNMENT,
            instance=wo,
            old_value={"status": old_status},
            new_value={"status": wo.status, "technician": str(wo.technician_id)},
            request=request,
        )
        if wo.technician_id:
            notify(
                recipient=wo.technician,
                event=Notification.Event.WO_ASSIGNED,
                title=f"OT {wo.number} assigné",
                message=wo.title,
                instance=wo,
            )
        return Response(WorkOrderSerializer(wo).data)

    @action(detail=True, methods=["post"])
    def start(self, request, pk=None):
        wo = self.get_object()
        if wo.technician_id != request.user.id and not request.user.is_superuser:
            raise PermissionDenied("Seul le technicien affecté peut démarrer cet OT.")
        old_status = wo.status
        wo.status = WorkOrder.Status.IN_PROGRESS
        wo.started_at = timezone.now()
        wo.save()
        self._log_status(wo, old_status, request)
        return Response(WorkOrderSerializer(wo).data)

    @action(detail=True, methods=["post"])
    def hold(self, request, pk=None):
        wo = self.get_object()
        old_status = wo.status
        wo.status = WorkOrder.Status.ON_HOLD
        wo.save()
        self._log_status(wo, old_status, request)
        return Response(WorkOrderSerializer(wo).data)

    @action(detail=True, methods=["post"])
    def resume(self, request, pk=None):
        wo = self.get_object()
        old_status = wo.status
        wo.status = WorkOrder.Status.IN_PROGRESS
        wo.save()
        self._log_status(wo, old_status, request)
        return Response(WorkOrderSerializer(wo).data)

    @action(detail=True, methods=["post"])
    def submit(self, request, pk=None):
        wo = self.get_object()
        if wo.technician_id != request.user.id and not request.user.is_superuser:
            raise PermissionDenied("Seul le technicien affecté peut soumettre cet OT.")
        serializer = ExecutionSubmitSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        old_status = wo.status

        wo.work_performed = data["work_performed"]
        wo.identified_cause = data.get("identified_cause", "")
        wo.solution_applied = data.get("solution_applied", "")
        wo.technician_comment = data.get("technician_comment", "")
        wo.result = data["result"]
        wo.finished_at = timezone.now()
        if "time_spent_minutes" in data:
            wo.time_spent_minutes = data["time_spent_minutes"]
        wo.status = WorkOrder.Status.DONE
        wo.submitted_at = timezone.now()
        wo.submitted_by = request.user
        wo.save()
        self._log_status(wo, old_status, request)
        managers = User.objects.filter(company=wo.company, role__in=VALIDATOR_ROLES)
        notify_many(
            recipients=managers,
            event=Notification.Event.WO_DONE,
            title=f"OT {wo.number} terminé",
            message=wo.title,
            instance=wo,
        )
        return Response(WorkOrderSerializer(wo).data)

    @action(detail=True, methods=["post"])
    def validate(self, request, pk=None):
        wo = self.get_object()
        serializer = ValidationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        old_status = wo.status
        wo.status = WorkOrder.Status.VALIDATED
        wo.validated_at = timezone.now()
        wo.validated_by = request.user
        wo.validation_note = serializer.validated_data.get("note", "")
        wo.save()
        log_action(
            user=request.user,
            action=AuditLog.Action.VALIDATION,
            instance=wo,
            old_value={"status": old_status},
            new_value={"status": wo.status},
            request=request,
        )
        if wo.technician_id:
            notify(
                recipient=wo.technician,
                event=Notification.Event.WO_VALIDATED,
                title=f"OT {wo.number} validé",
                message=wo.title,
                instance=wo,
            )
        return Response(WorkOrderSerializer(wo).data)

    @action(detail=True, methods=["post"])
    def reject(self, request, pk=None):
        wo = self.get_object()
        serializer = ValidationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        old_status = wo.status
        wo.status = WorkOrder.Status.IN_PROGRESS
        wo.validation_note = serializer.validated_data.get("note", "")
        wo.save()
        log_action(
            user=request.user,
            action=AuditLog.Action.VALIDATION,
            instance=wo,
            old_value={"status": old_status},
            new_value={"status": wo.status, "rejected": True},
            request=request,
        )
        return Response(WorkOrderSerializer(wo).data)

    @action(detail=True, methods=["post"])
    def close(self, request, pk=None):
        wo = self.get_object()
        old_status = wo.status
        wo.status = WorkOrder.Status.CLOSED
        wo.closed_at = timezone.now()
        wo.save()
        log_action(
            user=request.user,
            action=AuditLog.Action.CLOSURE,
            instance=wo,
            old_value={"status": old_status},
            new_value={"status": wo.status},
            request=request,
        )
        return Response(WorkOrderSerializer(wo).data)


class WorkOrderTaskViewSet(TenantModelViewSet):
    queryset = WorkOrderTask.objects.all()
    serializer_class = WorkOrderTaskSerializer
    filterset_fields = ["work_order"]

    def perform_create(self, serializer):
        serializer.save(company=self.request.user.company)


class WorkOrderPhotoViewSet(TenantModelViewSet):
    queryset = WorkOrderPhoto.objects.all()
    serializer_class = WorkOrderPhotoSerializer
    filterset_fields = ["work_order", "kind"]

    def perform_create(self, serializer):
        serializer.save(company=self.request.user.company, uploaded_by=self.request.user)
