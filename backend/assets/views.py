import io

import qrcode
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from assets.models import Asset, AssetCategory, AssetDocument, AssetQRCode
from assets.serializers import (
    AssetCategorySerializer,
    AssetDocumentSerializer,
    AssetQRCodeSerializer,
    AssetScanSerializer,
    AssetSerializer,
)
from core.permissions import IsCompanyMember
from core.viewsets import TenantModelViewSet


class AssetCategoryViewSet(TenantModelViewSet):
    queryset = AssetCategory.objects.all()
    serializer_class = AssetCategorySerializer
    search_fields = ["name"]


class AssetViewSet(TenantModelViewSet):
    queryset = Asset.objects.all()
    serializer_class = AssetSerializer
    filterset_fields = ["site", "category", "status", "criticality", "parent"]
    search_fields = ["name", "code", "serial_number"]

    @action(detail=True, methods=["get", "post"], url_path="qrcode")
    def qrcode_detail(self, request, pk=None):
        asset = self.get_object()
        qr, _ = AssetQRCode.objects.get_or_create(asset=asset, defaults={"company": asset.company})
        return Response(AssetQRCodeSerializer(qr).data)

    @action(detail=True, methods=["get"], url_path="qrcode/image")
    def qrcode_image(self, request, pk=None):
        asset = self.get_object()
        qr_record, _ = AssetQRCode.objects.get_or_create(
            asset=asset, defaults={"company": asset.company}
        )
        scan_url = request.build_absolute_uri(f"/api/assets/scan/{qr_record.token}/")
        img = qrcode.make(scan_url)
        buffer = io.BytesIO()
        img.save(buffer, format="PNG")
        return HttpResponse(buffer.getvalue(), content_type="image/png")

    @action(detail=True, methods=["get"])
    def history(self, request, pk=None):
        """A merged, chronological timeline of everything that happened to
        this asset - failures, requests, and each work order's key
        milestones (created / validated / closed) - per spec section 30.
        """
        asset = self.get_object()
        events = []

        for r in asset.requests.all():
            events.append(
                {
                    "date": r.created_at,
                    "type": "request",
                    "title": f"Demande créée : {r.description[:80]}",
                    "status": r.status,
                }
            )

        for f in asset.failures.all():
            events.append(
                {
                    "date": f.started_at,
                    "type": "failure",
                    "title": f"Panne signalée : {f.description[:80]}",
                    "status": f.status,
                }
            )

        for wo in asset.work_orders.all():
            events.append(
                {
                    "date": wo.created_at,
                    "type": "work_order",
                    "title": f"OT {wo.number} créé — {wo.title}",
                    "status": wo.status,
                }
            )
            if wo.validated_at:
                events.append(
                    {
                        "date": wo.validated_at,
                        "type": "work_order",
                        "title": f"OT {wo.number} validé",
                        "status": wo.status,
                    }
                )
            if wo.closed_at:
                events.append(
                    {
                        "date": wo.closed_at,
                        "type": "work_order",
                        "title": f"OT {wo.number} clôturé",
                        "status": wo.status,
                    }
                )

        events.sort(key=lambda e: e["date"], reverse=True)
        return Response(events)


class AssetDocumentViewSet(TenantModelViewSet):
    queryset = AssetDocument.objects.all()
    serializer_class = AssetDocumentSerializer
    filterset_fields = ["asset", "doc_type"]

    def perform_create(self, serializer):
        serializer.save(company=self.request.user.company, uploaded_by=self.request.user)


class AssetScanView(APIView):
    """Resolves a scanned QR token to an asset's summary card, tenant-checked."""

    permission_classes = [IsAuthenticated, IsCompanyMember]

    def get(self, request, token):
        qr_record = get_object_or_404(AssetQRCode, token=token)
        if not request.user.is_superuser and qr_record.company_id != request.user.company_id:
            return Response(status=404)
        qr_record.last_scanned_at = timezone.now()
        qr_record.save(update_fields=["last_scanned_at"])
        return Response(AssetScanSerializer(qr_record.asset).data)
