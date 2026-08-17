from datetime import timedelta

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from maintenance.models import MaintenancePlan
from workorders.models import WorkOrder, WorkOrderTask
from workorders.utils import next_wo_number

FREQUENCY_TIMEDELTA = {
    MaintenancePlan.Frequency.DAILY: timedelta(days=1),
    MaintenancePlan.Frequency.WEEKLY: timedelta(weeks=1),
    MaintenancePlan.Frequency.MONTHLY: timedelta(days=30),
    MaintenancePlan.Frequency.QUARTERLY: timedelta(days=91),
    MaintenancePlan.Frequency.SEMI_ANNUAL: timedelta(days=182),
    MaintenancePlan.Frequency.ANNUAL: timedelta(days=365),
}


class Command(BaseCommand):
    """Create the next preventive work order for every due, active maintenance plan.

    Intended to run on a schedule (cron / Celery beat). Each run only creates
    work orders for plans whose next_due_at has passed, then advances
    next_due_at by one frequency interval.
    """

    help = "Generate preventive work orders from active maintenance plans that are due."

    def handle(self, *args, **options):
        now = timezone.now()
        due_plans = MaintenancePlan.objects.filter(
            is_active=True, next_due_at__lte=now
        ).select_related("asset", "asset__site", "company")

        created = 0
        for plan in due_plans:
            with transaction.atomic():
                number = next_wo_number(plan.company_id)
                wo = WorkOrder.objects.create(
                    company=plan.company,
                    number=number,
                    title=plan.name,
                    description=plan.instructions,
                    wo_type=WorkOrder.WOType.PREVENTIVE,
                    asset=plan.asset,
                    site=plan.asset.site,
                    priority=WorkOrder.Priority.NORMAL,
                    status=WorkOrder.Status.PLANNED,
                    technician=plan.responsible,
                    maintenance_plan=plan,
                    scheduled_at=plan.next_due_at,
                    estimated_duration_minutes=plan.estimated_duration_minutes,
                )
                WorkOrderTask.objects.bulk_create(
                    [
                        WorkOrderTask(
                            company=plan.company,
                            work_order=wo,
                            label=item.label,
                            order=item.order,
                        )
                        for item in plan.checklist_items.all()
                    ]
                )
                plan.last_generated_at = now
                plan.next_due_at = plan.next_due_at + FREQUENCY_TIMEDELTA[plan.frequency]
                plan.save(update_fields=["last_generated_at", "next_due_at"])
                created += 1

        self.stdout.write(self.style.SUCCESS(f"Generated {created} preventive work order(s)."))
