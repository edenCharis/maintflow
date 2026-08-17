"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { apiJson } from "@/lib/api";
import { AssetScan } from "@/lib/types";
import { Badge } from "@/components/Badge";
import { AlertTriangle, CalendarClock, History } from "lucide-react";

const STATUS_DOT: Record<string, string> = {
  in_service: "🟢",
  in_maintenance: "🟠",
  down: "🔴",
  out_of_service: "⚫",
  retired: "⚫",
};

export default function ScanPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [asset, setAsset] = useState<AssetScan | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiJson<AssetScan>(`/assets/scan/${token}/`)
      .then(setAsset)
      .catch(() => setError("QR code invalide ou équipement introuvable."));
  }, [token]);

  if (error)
    return (
      <p className="mx-auto max-w-sm rounded-lg bg-danger-soft px-3 py-2 text-center text-sm text-danger-soft-foreground">
        {error}
      </p>
    );
  if (!asset) return <p className="text-center text-sm text-muted-foreground">Chargement...</p>;

  return (
    <div className="mx-auto max-w-sm space-y-6">
      <div className="space-y-1 text-center">
        <h1 className="text-xl font-semibold uppercase tracking-tight text-foreground">
          {asset.name}
        </h1>
        <p className="text-sm text-muted-foreground">{asset.code}</p>
      </div>

      <div className="flex items-center justify-center gap-2">
        <span>{STATUS_DOT[asset.status] ?? "⚪"}</span>
        <Badge value={asset.status} />
      </div>

      <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-soft)]">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-info-soft text-info-soft-foreground">
          <CalendarClock size={16} />
        </span>
        <div className="text-left text-sm">
          <p className="text-muted-foreground">Prochaine maintenance</p>
          <p className="font-medium text-foreground">
            {asset.next_maintenance_at
              ? new Date(asset.next_maintenance_at).toLocaleDateString("fr-FR")
              : "Non planifiée"}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <Link
          href={`/failures/new?asset=${asset.id}`}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-danger px-4 py-3 text-sm font-semibold text-white shadow-[var(--shadow-soft)] transition-colors hover:opacity-90"
        >
          <AlertTriangle size={16} />
          Signaler une panne
        </Link>
        <Link
          href={`/assets/${asset.id}`}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-surface px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-surface-hover"
        >
          <History size={16} />
          Voir historique
        </Link>
      </div>
    </div>
  );
}
