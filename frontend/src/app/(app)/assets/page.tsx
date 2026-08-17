"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiJson, Paginated } from "@/lib/api";
import { Asset } from "@/lib/types";
import { Badge } from "@/components/Badge";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { useAuth } from "@/lib/auth";
import { Layers, Plus } from "lucide-react";

const MANAGE_ROLES = ["admin", "maintenance_manager"];

export default function AssetsPage() {
  const { user } = useAuth();
  const [assets, setAssets] = useState<Asset[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const canManage = user ? MANAGE_ROLES.includes(user.role) : false;

  useEffect(() => {
    apiJson<Paginated<Asset>>("/assets/")
      .then((data) => setAssets(data.results))
      .catch(() => setError("Impossible de charger les équipements."));
  }, []);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="Équipements"
        description="Arborescence, statut et criticité de votre parc."
        action={
          canManage && (
            <Link
              href="/assets/new"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-soft)] transition-colors hover:bg-primary-hover"
            >
              <Plus size={16} />
              Nouvel équipement
            </Link>
          )
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
                <th className="px-5 py-3">Statut</th>
                <th className="px-5 py-3">Criticité</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {assets?.map((asset) => (
                <tr key={asset.id} className="transition-colors hover:bg-surface-hover">
                  <td className="px-5 py-3.5 font-medium">
                    <Link href={`/assets/${asset.id}`} className="text-primary hover:underline">
                      {asset.code}
                    </Link>
                  </td>
                  <td className="px-5 py-3.5 text-foreground">{asset.name}</td>
                  <td className="px-5 py-3.5">
                    <Badge value={asset.status} />
                  </td>
                  <td className="px-5 py-3.5">
                    <Badge value={asset.criticality} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {assets && assets.length === 0 && (
          <EmptyState icon={Layers} message="Aucun équipement pour le moment." />
        )}
      </div>
    </div>
  );
}
