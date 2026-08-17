from rest_framework.permissions import BasePermission


class IsCompanyMember(BasePermission):
    """Blocks access for authenticated users who aren't attached to a tenant."""

    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and (user.is_superuser or user.company_id))

    def has_object_permission(self, request, view, obj):
        if request.user.is_superuser:
            return True
        return getattr(obj, "company_id", None) == request.user.company_id


def role_required(*roles):
    """Build a DRF permission class restricting access to the given User.Role values."""

    class _RoleRequired(BasePermission):
        def has_permission(self, request, view):
            user = request.user
            return bool(
                user
                and user.is_authenticated
                and (user.is_superuser or user.role in roles)
            )

    return _RoleRequired
