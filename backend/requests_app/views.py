from django.utils import timezone
from rest_framework.decorators import action
from rest_framework.response import Response

from accounts.models import User
from audit.models import AuditLog
from audit.utils import log_action
from core.permissions import role_required
from core.viewsets import TenantModelViewSet
from notifications.models import Notification
from notifications.utils import notify_many
from requests_app.models import InterventionRequest
from requests_app.serializers import (
    ConvertToWorkOrderSerializer,
    InterventionRequestSerializer,
    ReviewNoteSerializer,
)
from workorders.models import WorkOrder
from workorders.utils import next_wo_number

REVIEWER_ROLES = (User.Role.ADMIN, User.Role.MAINTENANCE_MANAGER, User.Role.PLANNER)


class InterventionRequestViewSet(TenantModelViewSet):
    queryset = InterventionRequest.objects.all()
    serializer_class = InterventionRequestSerializer
    filterset_fields = ["status", "urgency", "asset"]
    search_fields = ["description"]

    def perform_create(self, serializer):
        req = serializer.save(company=self.request.user.company, requested_by=self.request.user)
        reviewers = User.objects.filter(company=req.company, role__in=REVIEWER_ROLES)
        notify_many(
            recipients=reviewers,
            event=Notification.Event.NEW_REQUEST,
            title="Nouvelle demande",
            message=req.description[:255],
            instance=req,
        )

    def get_permissions(self):
        if self.action in ("accept", "reject", "request_info", "convert"):
            return [role_required(*REVIEWER_ROLES)()]
        return super().get_permissions()

    def _transition(self, request, new_status, note_field="review_note"):
        req = self.get_object()
        old_status = req.status
        serializer = ReviewNoteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        req.status = new_status
        req.reviewed_by = request.user
        if serializer.validated_data.get("note"):
            setattr(req, note_field, serializer.validated_data["note"])
        req.save()
        log_action(
            user=request.user,
            action=AuditLog.Action.STATUS_CHANGE,
            instance=req,
            old_value={"status": old_status},
            new_value={"status": new_status},
            request=request,
        )
        return Response(InterventionRequestSerializer(req).data)

    @action(detail=True, methods=["post"])
    def accept(self, request, pk=None):
        return self._transition(request, InterventionRequest.Status.ACCEPTED)

    @action(detail=True, methods=["post"])
    def reject(self, request, pk=None):
        return self._transition(request, InterventionRequest.Status.REJECTED)

    @action(detail=True, methods=["post"], url_path="request-info")
    def request_info(self, request, pk=None):
        return self._transition(request, InterventionRequest.Status.IN_ANALYSIS)

    @action(detail=True, methods=["post"])
    def convert(self, request, pk=None):
        req = self.get_object()
        payload = ConvertToWorkOrderSerializer(data=request.data)
        payload.is_valid(raise_exception=True)
        data = payload.validated_data

        wo = WorkOrder.objects.create(
            company=req.company,
            number=next_wo_number(req.company_id),
            title=data.get("title") or req.description[:255],
            description=req.description,
            wo_type=WorkOrder.WOType.CORRECTIVE,
            asset=req.asset,
            site=req.asset.site,
            priority=data.get("priority", WorkOrder.Priority.NORMAL),
            status=WorkOrder.Status.PLANNED,
            requested_by=req.requested_by,
            technician=data.get("technician"),
            scheduled_at=data.get("scheduled_at"),
        )
        req.status = InterventionRequest.Status.CONVERTED
        req.reviewed_by = request.user
        req.work_order = wo
        req.save()

        log_action(
            user=request.user,
            action=AuditLog.Action.STATUS_CHANGE,
            instance=req,
            old_value={"status": InterventionRequest.Status.ACCEPTED},
            new_value={"status": InterventionRequest.Status.CONVERTED, "work_order": str(wo.id)},
            request=request,
        )
        return Response(InterventionRequestSerializer(req).data)
