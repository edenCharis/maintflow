"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiJson, Paginated } from "@/lib/api";
import { WorkOrder } from "@/lib/types";
import { useAuth } from "@/lib/auth";
import { KpiTile } from "@/components/KpiTile";
import { AlertTriangle, CalendarX2, ListTodo, Wrench } from "lucide-react";

const OPEN_STATUSES = ["assigned", "in_progress", "on_hold"];
const TERMINAL_STATUSES = ["done", "validated", "closed"];

export function TechnicianDashboard() {
  const { user } = useAuth();
  const [workOrders, setWorkOrders] = useState<WorkOrder[] | null>(null);

  useEffect(() => {
    if (!user) return;
    apiJson<Paginated<WorkOrder>>(`/work-orders/?technician=${user.id}&page_size=200`)
      .then((data) => setWorkOrders(data.results))
      .catch(() => setWorkOrders([]));
  }, [user]);

  // Snapshotting "now" once per render is fine here: this is a client-only
  // component with no SSR concerns, just an "is this overdue" comparison.
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();
  const total = workOrders?.length ?? 0;
  const enCours = workOrders?.filter((wo) => OPEN_STATUSES.includes(wo.status)).length ?? 0;
  const enRetard =
    workOrders?.filter(
      (wo) => !TERMINAL_STATUSES.includes(wo.status) && wo.scheduled_at && new Date(wo.scheduled_at).getTime() < now
    ).length ?? 0;

  return (
    <>
      <div className="grid grid-cols-3 gap-4">
        <KpiTile label="Mes OT" subtitle="Total assignés" value={total} icon={ListTodo} accent="primary" />
        <KpiTile label="En cours" subtitle="À traiter" value={enCours} icon={Wrench} accent="info" />
        <KpiTile label="En retard" subtitle="Hors délai" value={enRetard} icon={CalendarX2} accent="warning" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Link
          href="/failures/new"
          className="flex items-center justify-center gap-2 rounded-lg bg-danger px-4 py-3.5 text-sm font-semibold text-white shadow-[var(--shadow-soft)] transition-colors hover:opacity-90"
        >
          <AlertTriangle size={16} />
          Signaler une panne
        </Link>
        <Link
          href="/work-orders"
          className="flex items-center justify-center gap-2 rounded-lg border border-border bg-surface px-4 py-3.5 text-sm font-semibold text-foreground transition-colors hover:bg-surface-hover"
        >
          <ListTodo size={16} />
          Voir mes OT
        </Link>
      </div>
    </>
  );
}
