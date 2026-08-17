from django.contrib.contenttypes.models import ContentType

from audit.models import AuditLog


def get_client_ip(request):
    forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR")


def log_action(*, user, action, instance=None, old_value=None, new_value=None, request=None, company=None):
    """Record a sensitive action in the audit log.

    `instance` (if given) supplies the target object, its string
    representation, and the company the entry is scoped to.
    """
    if instance is not None and company is None:
        company = getattr(instance, "company", None)
    if company is None and user is not None:
        company = user.company

    AuditLog.objects.create(
        company=company,
        user=user,
        user_email=getattr(user, "email", ""),
        action=action,
        content_type=None if instance is None else ContentType.objects.get_for_model(instance),
        object_id=getattr(instance, "id", None),
        object_repr=str(instance) if instance is not None else "",
        old_value=old_value,
        new_value=new_value,
        ip_address=get_client_ip(request) if request is not None else None,
    )
