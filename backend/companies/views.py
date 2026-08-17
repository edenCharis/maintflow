from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import User
from companies.models import Location, Site
from companies.serializers import CompanySerializer, LocationSerializer, SiteSerializer
from core.permissions import IsCompanyMember, role_required
from core.viewsets import TenantModelViewSet


class MyCompanyView(APIView):
    """Retrieve or update the current user's own company.

    Tenant provisioning (creating new companies) is handled outside the
    public API in V1 - by DigiTech staff via the Django admin - so no
    company list/create endpoint is exposed here.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(CompanySerializer(request.user.company).data)

    def patch(self, request):
        serializer = CompanySerializer(request.user.company, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def get_permissions(self):
        if self.request.method == "PATCH":
            return [IsAuthenticated(), role_required(User.Role.ADMIN)()]
        return super().get_permissions()


class SiteViewSet(TenantModelViewSet):
    queryset = Site.objects.all()
    serializer_class = SiteSerializer
    filterset_fields = ["status"]
    search_fields = ["name", "code"]


class LocationViewSet(TenantModelViewSet):
    queryset = Location.objects.all()
    serializer_class = LocationSerializer
    filterset_fields = ["site", "parent"]
    search_fields = ["name", "code"]
