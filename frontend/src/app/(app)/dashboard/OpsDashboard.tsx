import Link from "next/link";
import { AuditLog, Asset, DashboardKpis } from "@/lib/types";
import { KpiTile } from "@/components/KpiTile";
import { relativeTime } from "@/lib/format";
import { WorkOrdersAreaChart, StatusDonutChart } from "./charts";
import { CriticalAssetsCard } from "./CriticalAssetsCard";
import {
  AlarmClockCheck,
  AlertOctagon,
  AlertTriangle,
  CalendarClock,
  CalendarX2,
  ClipboardPlus,
  Eye,
  Gauge,
  Layers,
  ListTodo,
  Plus,
  Timer,
  TrendingUp,
  Wrench,
} from "lucide-react";

const ACTION_ICON: Record<string, typeof ClipboardPlus> = {
  create: ClipboardPlus,
  status_change: Wrench,
  validation: Eye,
  closure: Wrench,
  assignment: Wrench,
  update: Wrench,
  delete: AlertTriangle,
  login: Wrench,
};

export function OpsDashboard({
  kpis,
  activity,
  criticalAssets,
}: {
  kpis: DashboardKpis;
  activity: AuditLog[] | null;
  criticalAssets: Asset[] | null;
}) {
  return (
    <>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <KpiTile label="Équipements" subtitle="Total enregistré" value={kpis.assets_total} icon={Layers} accent="primary" />
        <KpiTile
          label="OT ouverts"
          subtitle="En cours de traitement"
          value={kpis.work_orders_open}
          icon={ListTodo}
          accent="info"
        />
        <KpiTile
          label="OT en retard"
          subtitle="Hors délai"
          value={kpis.work_orders_overdue}
          icon={CalendarX2}
          accent="warning"
        />
        <KpiTile
          label="Pannes critiques"
          subtitle="À traiter en priorité"
          value={kpis.failures_critical}
          icon={AlertOctagon}
          accent="danger"
        />
        <KpiTile
          label="Préventif à venir"
          subtitle="Prochains 14 jours"
          value={kpis.preventive_upcoming}
          icon={CalendarClock}
          accent="cyan"
        />
        <KpiTile
          label="Préventif en retard"
          subtitle="Non réalisés"
          value={kpis.preventive_overdue}
          icon={AlarmClockCheck}
          accent="pink"
        />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <KpiTile label="Backlog" subtitle="OT en attente" value={kpis.backlog} icon={Wrench} accent="primary" />
        <KpiTile
          label="MTTR (min)"
          subtitle="Temps moyen de réparation"
          value={kpis.mttr_minutes ?? "—"}
          icon={Timer}
          accent="info"
        />
        <KpiTile
          label="MTBF (h)"
          subtitle="Temps moyen entre pannes"
          value={kpis.mtbf_hours ?? "—"}
          icon={Gauge}
          accent="cyan"
        />
        <KpiTile
          label="Disponibilité"
          subtitle="Taux de disponibilité"
          value={kpis.availability_pct != null ? `${kpis.availability_pct}%` : "—"}
          icon={TrendingUp}
          accent="success"
          progressPct={kpis.availability_pct ?? 0}
        />
        <KpiTile
          label="Taux préventif"
          subtitle="Plans de maintenance"
          value={kpis.preventive_completion_rate != null ? `${kpis.preventive_completion_rate}%` : "—"}
          icon={TrendingUp}
          accent="pink"
          progressPct={kpis.preventive_completion_rate}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <WorkOrdersAreaChart dailySeries={kpis.daily_series} />
        </div>
        <StatusDonutChart statusBreakdown={kpis.status_breakdown} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <CriticalAssetsCard assets={criticalAssets} />
        </div>

        <div className="rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-soft)]">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Actions rapides</h2>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Link
              href="/requests/new"
              className="col-span-2 flex items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover"
            >
              <Plus size={15} />
              Nouvelle demande
            </Link>
            <Link
              href="/failures/new"
              className="flex items-center justify-center gap-2 rounded-lg border border-border px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-surface-hover"
            >
              <AlertTriangle size={15} />
              Panne
            </Link>
            <Link
              href="/work-orders"
              className="flex items-center justify-center gap-2 rounded-lg border border-border px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-surface-hover"
            >
              <Wrench size={15} />
              Les OT
            </Link>
          </div>
        </div>
      </div>

      {activity && (
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-soft)]">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Activité récente</h2>
          </div>
          {activity.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">Aucune activité récente.</p>
          )}
          {activity.length > 0 && (
            <ul className="divide-y divide-border">
              {activity.map((a) => {
                const Icon = ACTION_ICON[a.action] ?? Wrench;
                return (
                  <li key={a.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary-soft-foreground">
                      <Icon size={14} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-foreground">{a.object_repr}</p>
                      <p className="text-xs text-muted-foreground">
                        {a.user_email || "Système"} · {relativeTime(a.created_at)}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </>
  );
}
