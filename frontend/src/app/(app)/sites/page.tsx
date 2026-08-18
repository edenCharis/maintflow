"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiJson, Paginated } from "@/lib/api";
import { Site } from "@/lib/types";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { Building2, Plus } from "lucide-react";

export default function SitesPage() {
  const [sites, setSites] = useState<Site[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiJson<Paginated<Site>>("/sites/")
      .then((data) => setSites(data.results))
      .catch(() => setError("Impossible de charger les sites."));
  }, []);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        title="Sites"
        description="Emplacements physiques de votre entreprise."
        action={
          <Link
            href="/sites/new"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-soft)] transition-colors hover:bg-primary-hover"
          >
            <Plus size={16} />
            Nouveau site
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
                <th className="px-5 py-3">Code</th>
                <th className="px-5 py-3">Nom</th>
                <th className="px-5 py-3">Adresse</th>
                <th className="px-5 py-3">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sites?.map((s) => (
                <tr key={s.id} className="transition-colors hover:bg-surface-hover">
                  <td className="px-5 py-3.5 font-medium text-foreground">{s.code}</td>
                  <td className="px-5 py-3.5 text-foreground">{s.name}</td>
                  <td className="px-5 py-3.5 text-muted-foreground">{s.address || "—"}</td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                        s.status === "active"
                          ? "bg-success-soft text-success-soft-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${s.status === "active" ? "bg-success" : "bg-muted-foreground"}`}
                      />
                      {s.status === "active" ? "Actif" : "Inactif"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {sites && sites.length === 0 && (
          <EmptyState icon={Building2} message="Aucun site pour le moment." />
        )}
      </div>
    </div>
  );
}
