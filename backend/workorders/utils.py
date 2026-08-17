from workorders.models import WorkOrder


def next_wo_number(company_id):
    count = WorkOrder.objects.filter(company_id=company_id).count()
    return f"OT-{count + 1:06d}"
