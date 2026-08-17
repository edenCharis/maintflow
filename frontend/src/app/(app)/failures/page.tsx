"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiJson, Paginated } from "@/lib/api";
import { Failure } from "@/lib/types";
import { Badge } from "@/components/Badge";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { AlertTriangle } from "lucide-react";

export default function FailuresPage() {
  const [failures, setFailures] = useState<Failure[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiJson<Paginated<Failure>>("/failures/")
      .then((data) => setFailures(data.results))
      .catch(() => setError("Impossible de charger les pannes."));
  }, []);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="Pannes"
        description="Ouverte → En cours → Résolue → Clôturée."
        action={
          <Link
            href="/failures/new"
            className="inline-flex items-center gap-2 rounded-lg bg-danger px-4 py-2.5 text-sm font-semibold text-white shadow-[var(--shadow-soft)] transition-colors hover:opacity-90"
          >
            <AlertTriangle size={16} />
            Signaler une panne
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
                <th className="px-5 py-3">Description</th>
                <th className="px-5 py-3">Priorité</th>
                <th className="px-5 py-3">Statut</th>
                <th className="px-5 py-3">Début</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {failures?.map((f) => (
                <tr key={f.id} className="transition-colors hover:bg-surface-hover">
                  <td className="max-w-md truncate px-5 py-3.5 text-foreground">
                    {f.description}
                  </td>
                  <td className="px-5 py-3.5">
                    <Badge value={f.priority} />
                  </td>
                  <td className="px-5 py-3.5">
                    <Badge value={f.status} />
                  </td>
                  <td className="px-5 py-3.5 text-muted-foreground">
                    {new Date(f.started_at).toLocaleString("fr-FR")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {failures && failures.length === 0 && (
          <EmptyState icon={AlertTriangle} message="Aucune panne enregistrée." />
        )}
      </div>
    </div>
  );
}
