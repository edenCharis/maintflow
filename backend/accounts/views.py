from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from rest_framework import status, viewsets
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView

from accounts.models import Skill, TechnicianSkill, User
from accounts.serializers import (
    ChangePasswordSerializer,
    MaintFlowTokenObtainPairSerializer,
    PasswordResetConfirmSerializer,
    PasswordResetRequestSerializer,
    SkillSerializer,
    TechnicianSkillSerializer,
    UserCreateSerializer,
    UserSerializer,
)
from audit.models import AuditLog
from audit.utils import get_client_ip, log_action
from core.permissions import IsCompanyMember, role_required
from core.viewsets import TenantModelViewSet


class MaintFlowTokenObtainPairView(TokenObtainPairView):
    serializer_class = MaintFlowTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == 200:
            email = request.data.get("email") or request.data.get(User.USERNAME_FIELD)
            user = User.objects.filter(email=email).first()
            if user is not None:
                log_action(
                    user=user,
                    action=AuditLog.Action.LOGIN,
                    instance=user,
                    request=request,
                    company=user.company,
                )
        return response


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)

    def patch(self, request):
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = request.user
        if not user.check_password(serializer.validated_data["old_password"]):
            return Response({"old_password": "Incorrect."}, status=status.HTTP_400_BAD_REQUEST)
        user.set_password(serializer.validated_data["new_password"])
        user.save(update_fields=["password"])
        return Response(status=status.HTTP_204_NO_CONTENT)


class PasswordResetRequestView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = User.objects.filter(email=serializer.validated_data["email"]).first()
        if user is not None:
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            token = default_token_generator.make_token(user)
            send_mail(
                subject="MaintFlow - Réinitialisation du mot de passe",
                message=f"uid={uid}&token={token}",
                from_email=None,
                recipient_list=[user.email],
                fail_silently=True,
            )
        # Always 204: don't reveal whether the email exists.
        return Response(status=status.HTTP_204_NO_CONTENT)


class PasswordResetConfirmView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        try:
            uid = force_str(urlsafe_base64_decode(data["uid"]))
            user = User.objects.get(pk=uid)
        except (User.DoesNotExist, ValueError, TypeError, OverflowError):
            return Response({"detail": "Lien invalide."}, status=status.HTTP_400_BAD_REQUEST)

        if not default_token_generator.check_token(user, data["token"]):
            return Response({"detail": "Lien invalide ou expiré."}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(data["new_password"])
        user.save(update_fields=["password"])
        return Response(status=status.HTTP_204_NO_CONTENT)


class UserViewSet(TenantModelViewSet):
    queryset = User.objects.all()
    filterset_fields = ["role", "is_active"]
    search_fields = ["email", "first_name", "last_name"]

    def get_permissions(self):
        if self.action in ("create", "update", "partial_update", "destroy"):
            return [IsCompanyMember(), role_required(User.Role.ADMIN)()]
        return [IsCompanyMember()]

    def get_serializer_class(self):
        if self.action == "create":
            return UserCreateSerializer
        return UserSerializer

    def perform_update(self, serializer):
        old_is_active = serializer.instance.is_active
        instance = serializer.save()
        if old_is_active != instance.is_active:
            log_action(
                user=self.request.user,
                action=AuditLog.Action.STATUS_CHANGE,
                instance=instance,
                old_value={"is_active": old_is_active},
                new_value={"is_active": instance.is_active},
                request=self.request,
            )


class SkillViewSet(TenantModelViewSet):
    queryset = Skill.objects.all()
    serializer_class = SkillSerializer


class TechnicianSkillViewSet(TenantModelViewSet):
    queryset = TechnicianSkill.objects.all()
    serializer_class = TechnicianSkillSerializer
    filterset_fields = ["technician", "skill"]
