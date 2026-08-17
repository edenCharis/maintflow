from datetime import timedelta

from django.db.models import Avg, Count, Sum
from django.db.models.functions import TruncDate
from django.utils import timezone

from assets.models import Asset
from failures.models import Failure
from maintenance.models import MaintenancePlan
from workorders.models import WorkOrder

CLOSED_STATUSES = {WorkOrder.Status.DONE, WorkOrder.Status.VALIDATED, WorkOrder.Status.CLOSED}
PLANNED_STATUSES = {WorkOrder.Status.DRAFT, WorkOrder.Status.PLANNED}


def compute_kpis(company, period_days=30):
    """Compute the V1 dashboard KPIs (spec sections 24-27) for one company.

    MTBF and availability are simplified V1 approximations over a rolling
    window rather than full asset-by-asset uptime accounting - accurate
    enough to guide a maintenance manager, cheap enough to compute on request.
    """
    now = timezone.now()
    period_start = now - timedelta(days=period_days)

    assets = Asset.objects.filter(company=company)
    total_assets = assets.count()

    open_failures = Failure.objects.filter(company=company).exclude(
        status=Failure.Status.CLOSED
    )
    critical_failures = open_failures.filter(priority=Failure.Priority.CRITICAL).count()

    work_orders = WorkOrder.objects.filter(company=company)
    open_work_orders = work_orders.exclude(status=WorkOrder.Status.CLOSED)
    overdue_work_orders = open_work_orders.filter(
        scheduled_at__lt=now,
        status__in=[
            WorkOrder.Status.PLANNED,
            WorkOrder.Status.ASSIGNED,
            WorkOrder.Status.IN_PROGRESS,
            WorkOrder.Status.ON_HOLD,
        ],
    ).count()

    preventive_plans = MaintenancePlan.objects.filter(company=company, is_active=True)
    preventive_upcoming = preventive_plans.filter(
        next_due_at__range=(now, now + timedelta(days=14))
    ).count()
    preventive_overdue = preventive_plans.filter(next_due_at__lt=now).count()

    preventive_wos_period = work_orders.filter(
        wo_type=WorkOrder.WOType.PREVENTIVE, created_at__gte=period_start
    )
    preventive_planned = preventive_wos_period.count()
    preventive_realized = preventive_wos_period.filter(
        status__in=[WorkOrder.Status.DONE, WorkOrder.Status.VALIDATED, WorkOrder.Status.CLOSED]
    ).count()
    preventive_completion_rate = (
        round(preventive_realized / preventive_planned * 100, 1) if preventive_planned else None
    )

    period_failures = Failure.objects.filter(company=company, started_at__gte=period_start)
    nb_failures = period_failures.count()
    total_downtime_minutes = period_failures.aggregate(total=Sum("downtime_minutes"))["total"] or 0

    mttr_minutes = work_orders.filter(
        finished_at__isnull=False, created_at__gte=period_start
    ).aggregate(avg=Avg("time_spent_minutes"))["avg"]

    period_hours = period_days * 24
    mtbf_hours = round(period_hours / nb_failures, 1) if nb_failures else None

    fleet_hours = period_hours * total_assets if total_assets else 0
    availability_pct = (
        round((fleet_hours - total_downtime_minutes / 60) / fleet_hours * 100, 1)
        if fleet_hours
        else None
    )

    return {
        "period_days": period_days,
        "assets_total": total_assets,
        "failures_open": open_failures.count(),
        "failures_critical": critical_failures,
        "work_orders_open": open_work_orders.count(),
        "work_orders_overdue": overdue_work_orders,
        "preventive_upcoming": preventive_upcoming,
        "preventive_overdue": preventive_overdue,
        "preventive_completion_rate": preventive_completion_rate,
        "backlog": open_work_orders.count(),
        "mttr_minutes": round(mttr_minutes, 1) if mttr_minutes else None,
        "mtbf_hours": mtbf_hours,
        "availability_pct": availability_pct,
        "status_breakdown": _status_breakdown(work_orders, now),
        "daily_series": _daily_series(work_orders, period_start, now),
    }


def _status_breakdown(work_orders, now):
    """Partition every work order into four mutually exclusive buckets for the
    status donut: closed, overdue (scheduled in the past and not yet closed),
    planned (draft/planned) and in_progress (assigned/in_progress/on_hold).
    """
    counts = {"planned": 0, "in_progress": 0, "overdue": 0, "closed": 0}
    for status, scheduled_at in work_orders.values_list("status", "scheduled_at"):
        if status in CLOSED_STATUSES:
            counts["closed"] += 1
        elif scheduled_at and scheduled_at < now:
            counts["overdue"] += 1
        elif status in PLANNED_STATUSES:
            counts["planned"] += 1
        else:
            counts["in_progress"] += 1
    return counts


def _daily_series(work_orders, period_start, now):
    """Work orders created vs. closed per day over the period, for the
    'évolution des ordres de travail' chart. Zero-filled for days with no activity.
    """
    created_by_day = {
        row["day"]: row["count"]
        for row in work_orders.filter(created_at__gte=period_start)
        .annotate(day=TruncDate("created_at"))
        .values("day")
        .annotate(count=Count("id"))
    }
    closed_by_day = {
        row["day"]: row["count"]
        for row in work_orders.filter(closed_at__gte=period_start)
        .annotate(day=TruncDate("closed_at"))
        .values("day")
        .annotate(count=Count("id"))
    }

    series = []
    day = period_start.date()
    while day <= now.date():
        series.append(
            {
                "date": day.isoformat(),
                "created": created_by_day.get(day, 0),
                "closed": closed_by_day.get(day, 0),
            }
        )
        day += timedelta(days=1)
    return series
