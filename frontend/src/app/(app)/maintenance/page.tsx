"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiJson, Paginated } from "@/lib/api";
import { Asset, MaintenancePlan } from "@/lib/types";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { CalendarClock, Plus } from "lucide-react";

const FREQUENCY_LABELS: Record<MaintenancePlan["frequency"], string> = {
  daily: "Quotidienne",
  weekly: "Hebdomadaire",
  monthly: "Mensuelle",
  quarterly: "Trimestrielle",
  semi_annual: "Semestrielle",
  annual: "Annuelle",
};

export default function MaintenancePlansPage() {
  const [plans, setPlans] = useState<MaintenancePlan[] | null>(null);
  const [assets, setAssets] = useState<Record<string, Asset>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiJson<Paginated<MaintenancePlan>>("/maintenance-plans/")
      .then((data) => setPlans(data.results))
      .catch(() => setError("Impossible de charger les plans de maintenance."));
    apiJson<Paginated<Asset>>("/assets/?page_size=200")
      .then((data) => setAssets(Object.fromEntries(data.results.map((a) => [a.id, a]))))
      .catch(() => {});
  }, []);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="Maintenance préventive"
        description="Plans, fréquences et génération automatique des ordres de travail."
        action={
          <Link
            href="/maintenance/new"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-soft)] transition-colors hover:bg-primary-hover"
          >
            <Plus size={16} />
            Nouveau plan
          </Link>
        }
      />

      {error && (
        <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger-soft-foreground">
          {error}
        </p>
      )}

      <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-[var(--shadow-soft)]">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border text-sm">
            <thead className="bg-muted/50 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-5 py-3">Plan</th>
                <th className="px-5 py-3">Équipement</th>
                <th className="px-5 py-3">Fréquence</th>
                <th className="px-5 py-3">Prochaine échéance</th>
                <th className="px-5 py-3">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {plans?.map((plan) => (
                <tr key={plan.id} className="transition-colors hover:bg-surface-hover">
                  <td className="px-5 py-3.5 font-medium text-foreground">{plan.name}</td>
                  <td className="px-5 py-3.5 text-muted-foreground">
                    {assets[plan.asset] ? `${assets[plan.asset].code} — ${assets[plan.asset].name}` : "—"}
                  </td>
                  <td className="px-5 py-3.5 text-muted-foreground">{FREQUENCY_LABELS[plan.frequency]}</td>
                  <td className="px-5 py-3.5 text-muted-foreground">
                    {plan.next_due_at ? new Date(plan.next_due_at).toLocaleDateString("fr-FR") : "—"}
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                        plan.is_active
                          ? "bg-success-soft text-success-soft-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${plan.is_active ? "bg-success" : "bg-muted-foreground"}`} />
                      {plan.is_active ? "Actif" : "Inactif"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {plans && plans.length === 0 && (
          <EmptyState icon={CalendarClock} message="Aucun plan de maintenance préventive." />
        )}
      </div>
    </div>
  );
}
