from django.contrib.contenttypes.models import ContentType

from notifications.models import Notification


def notify(*, recipient, event, title, message="", instance=None, company=None):
    if company is None:
        company = getattr(instance, "company", None) or recipient.company
    Notification.objects.create(
        company=company,
        recipient=recipient,
        event=event,
        title=title,
        message=message,
        content_type=None if instance is None else ContentType.objects.get_for_model(instance),
        object_id=getattr(instance, "id", None),
    )


def notify_many(*, recipients, event, title, message="", instance=None, company=None):
    for recipient in recipients:
        notify(
            recipient=recipient,
            event=event,
            title=title,
            message=message,
            instance=instance,
            company=company,
        )
