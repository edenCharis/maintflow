from rest_framework import viewsets

from core.permissions import IsCompanyMember


class TenantModelViewSet(viewsets.ModelViewSet):
    """Base viewset for tenant-scoped resources.

    Automatically filters querysets to the requesting user's company and
    stamps new records with that company, so a view never has to remember
    to enforce isolation manually.
    """

    permission_classes = [IsCompanyMember]

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if user.is_superuser:
            return qs
        return qs.filter(company=user.company)

    def perform_create(self, serializer):
        serializer.save(company=self.request.user.company)
