"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiJson, Paginated } from "@/lib/api";
import { WorkOrder } from "@/lib/types";
import { Badge } from "@/components/Badge";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { useAuth } from "@/lib/auth";
import { Hammer } from "lucide-react";

export default function WorkOrdersPage() {
  const { user } = useAuth();
  const [workOrders, setWorkOrders] = useState<WorkOrder[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isTechnician = user?.role === "technician";

  useEffect(() => {
    if (!user) return;
    const query = isTechnician ? `?technician=${user.id}` : "";
    apiJson<Paginated<WorkOrder>>(`/work-orders/${query}`)
      .then((data) => setWorkOrders(data.results))
      .catch(() => setError("Impossible de charger les ordres de travail."));
  }, [user, isTechnician]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title={isTechnician ? "Mes ordres de travail" : "Ordres de travail"}
        description="Brouillon → Planifié → Assigné → En cours → Terminé → Validé → Clôturé."
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
                <th className="px-5 py-3">N° OT</th>
                <th className="px-5 py-3">Titre</th>
                <th className="px-5 py-3">Équipement</th>
                <th className="px-5 py-3">Technicien</th>
                <th className="px-5 py-3">Priorité</th>
                <th className="px-5 py-3">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {workOrders?.map((wo) => (
                <tr key={wo.id} className="transition-colors hover:bg-surface-hover">
                  <td className="px-5 py-3.5 font-medium">
                    <Link href={`/work-orders/${wo.id}`} className="text-primary hover:underline">
                      {wo.number}
                    </Link>
                  </td>
                  <td className="px-5 py-3.5 text-foreground">{wo.title}</td>
                  <td className="px-5 py-3.5 text-muted-foreground">{wo.asset_name}</td>
                  <td className="px-5 py-3.5 text-muted-foreground">
                    {wo.technician_name || "—"}
                  </td>
                  <td className="px-5 py-3.5">
                    <Badge value={wo.priority} />
                  </td>
                  <td className="px-5 py-3.5">
                    <Badge value={wo.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {workOrders && workOrders.length === 0 && (
          <EmptyState icon={Hammer} message="Aucun ordre de travail pour le moment." />
        )}
      </div>
    </div>
  );
}
