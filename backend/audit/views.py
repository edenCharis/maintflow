from rest_framework import mixins, viewsets

from accounts.models import User
from audit.models import AuditLog
from audit.serializers import AuditLogSerializer
from core.permissions import IsCompanyMember, role_required


class AuditLogViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    serializer_class = AuditLogSerializer
    permission_classes = [IsCompanyMember, role_required(User.Role.ADMIN)]
    filterset_fields = ["action", "user"]

    def get_queryset(self):
        user = self.request.user
        qs = AuditLog.objects.all()
        if user.is_superuser:
            return qs
        return qs.filter(company=user.company)
