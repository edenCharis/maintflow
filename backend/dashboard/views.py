from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from core.permissions import IsCompanyMember
from dashboard.services import compute_kpis


class DashboardView(APIView):
    permission_classes = [IsAuthenticated, IsCompanyMember]

    def get(self, request):
        period_days = int(request.query_params.get("period_days", 30))
        return Response(compute_kpis(request.user.company, period_days=period_days))
