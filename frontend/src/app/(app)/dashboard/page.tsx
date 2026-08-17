"use client";

import { useEffect, useState } from "react";
import { apiJson, Paginated } from "@/lib/api";
import { AuditLog, Asset, DashboardKpis } from "@/lib/types";
import { useAuth } from "@/lib/auth";
import { formatDateLong } from "@/lib/format";
import { CalendarClock } from "lucide-react";
import { OpsDashboard } from "./OpsDashboard";
import { DirectionDashboard } from "./DirectionDashboard";
import { TechnicianDashboard } from "./TechnicianDashboard";

export default function DashboardPage() {
  const { user } = useAuth();
  const [kpis, setKpis] = useState<DashboardKpis | null>(null);
  const [activity, setActivity] = useState<AuditLog[] | null>(null);
  const [criticalAssets, setCriticalAssets] = useState<Asset[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const needsKpis = user?.role !== "technician";

  useEffect(() => {
    if (!needsKpis) return;
    apiJson<DashboardKpis>("/dashboard/")
      .then(setKpis)
      .catch(() => setError("Impossible de charger les indicateurs."));
    apiJson<Paginated<Asset>>("/assets/?criticality=critical&page_size=5")
      .then((data) => setCriticalAssets(data.results))
      .catch(() => setCriticalAssets([]));
    if (user?.role === "admin") {
      apiJson<Paginated<AuditLog>>("/audit-logs/?page_size=5")
        .then((data) => setActivity(data.results))
        .catch(() => setActivity(null));
    }
  }, [needsKpis, user?.role]);

  if (user?.role === "technician") {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Bonjour {user?.first_name} 👋
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Voici vos interventions du jour.</p>
        </div>
        <TechnicianDashboard />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Bonjour {user?.first_name} 👋
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Voici l&apos;état de la maintenance sur les {kpis?.period_days ?? 30} derniers jours.
          </p>
        </div>
        <span className="inline-flex items-center gap-2 self-start rounded-lg border border-border bg-surface px-3 py-2 text-sm text-muted-foreground">
          <CalendarClock size={15} />
          {formatDateLong(new Date())}
        </span>
      </div>

      {error && (
        <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger-soft-foreground">{error}</p>
      )}

      {kpis && user?.role === "direction" && (
        <DirectionDashboard kpis={kpis} criticalAssets={criticalAssets} />
      )}
      {kpis && user?.role !== "direction" && (
        <OpsDashboard kpis={kpis} activity={activity} criticalAssets={criticalAssets} />
      )}
    </div>
  );
}
