from accounts.models import User
from core.viewsets import TenantModelViewSet
from failures.models import Failure
from failures.serializers import FailureSerializer
from notifications.models import Notification
from notifications.utils import notify_many

ALERT_ROLES = (User.Role.ADMIN, User.Role.MAINTENANCE_MANAGER)


class FailureViewSet(TenantModelViewSet):
    queryset = Failure.objects.all()
    serializer_class = FailureSerializer
    filterset_fields = ["status", "priority", "asset"]
    search_fields = ["description", "cause"]

    def perform_create(self, serializer):
        failure = serializer.save(company=self.request.user.company, reported_by=self.request.user)
        if failure.priority == Failure.Priority.CRITICAL:
            managers = User.objects.filter(company=failure.company, role__in=ALERT_ROLES)
            notify_many(
                recipients=managers,
                event=Notification.Event.CRITICAL_FAILURE,
                title="Panne critique",
                message=f"{failure.asset.name}: {failure.description[:200]}",
                instance=failure,
            )
