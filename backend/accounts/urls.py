from django.urls import path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from accounts.views import (
    ChangePasswordView,
    MaintFlowTokenObtainPairView,
    MeView,
    PasswordResetConfirmView,
    PasswordResetRequestView,
    SkillViewSet,
    TechnicianSkillViewSet,
    UserViewSet,
)

router = DefaultRouter()
router.register("users", UserViewSet, basename="user")
router.register("skills", SkillViewSet, basename="skill")
router.register("technician-skills", TechnicianSkillViewSet, basename="technician-skill")

urlpatterns = [
    path("auth/login/", MaintFlowTokenObtainPairView.as_view(), name="login"),
    path("auth/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("auth/change-password/", ChangePasswordView.as_view(), name="change_password"),
    path("auth/password-reset/", PasswordResetRequestView.as_view(), name="password_reset"),
    path(
        "auth/password-reset/confirm/",
        PasswordResetConfirmView.as_view(),
        name="password_reset_confirm",
    ),
    path("me/", MeView.as_view(), name="me"),
    *router.urls,
]
