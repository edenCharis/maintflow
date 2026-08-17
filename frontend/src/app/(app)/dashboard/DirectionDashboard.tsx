import { Asset, DashboardKpis } from "@/lib/types";
import { KpiTile } from "@/components/KpiTile";
import { WorkOrdersAreaChart, StatusDonutChart } from "./charts";
import { CriticalAssetsCard } from "./CriticalAssetsCard";
import { AlertOctagon, Gauge, ListTodo, Timer, TrendingUp } from "lucide-react";

export function DirectionDashboard({
  kpis,
  criticalAssets,
}: {
  kpis: DashboardKpis;
  criticalAssets: Asset[] | null;
}) {
  return (
    <>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <KpiTile
          label="Disponibilité"
          subtitle="Taux de disponibilité"
          value={kpis.availability_pct != null ? `${kpis.availability_pct}%` : "—"}
          icon={TrendingUp}
          accent="success"
          progressPct={kpis.availability_pct ?? 0}
        />
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
          label="Pannes critiques"
          subtitle="À traiter en priorité"
          value={kpis.failures_critical}
          icon={AlertOctagon}
          accent="danger"
        />
        <KpiTile label="Backlog" subtitle="OT non clôturés" value={kpis.backlog} icon={ListTodo} accent="primary" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <WorkOrdersAreaChart dailySeries={kpis.daily_series} />
        </div>
        <StatusDonutChart statusBreakdown={kpis.status_breakdown} />
      </div>

      <CriticalAssetsCard assets={criticalAssets} title="Top équipements à problèmes" />
    </>
  );
}
