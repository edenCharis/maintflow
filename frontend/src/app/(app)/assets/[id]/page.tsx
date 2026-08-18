"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { apiJson, API_BASE, getTokens } from "@/lib/api";
import { Asset, AssetHistoryEvent } from "@/lib/types";
import { Badge } from "@/components/Badge";
import { useAuth } from "@/lib/auth";
import { AlertTriangle, ClipboardList, Pencil, QrCode, Wrench } from "lucide-react";

const MANAGE_ROLES = ["admin", "maintenance_manager"];

const EVENT_ICON: Record<AssetHistoryEvent["type"], typeof Wrench> = {
  request: ClipboardList,
  failure: AlertTriangle,
  work_order: Wrench,
};

export default function AssetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { user } = useAuth();
  const [asset, setAsset] = useState<Asset | null>(null);
  const [qrImageUrl, setQrImageUrl] = useState<string | null>(null);
  const [history, setHistory] = useState<AssetHistoryEvent[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const canManage = user ? MANAGE_ROLES.includes(user.role) : false;

  useEffect(() => {
    apiJson<Asset>(`/assets/${id}/`)
      .then(setAsset)
      .catch(() => setError("Équipement introuvable."));
    apiJson<AssetHistoryEvent[]>(`/assets/${id}/history/`)
      .then(setHistory)
      .catch(() => setHistory([]));
  }, [id]);

  useEffect(() => {
    const tokens = getTokens();
    if (!tokens) return;
    // The QR image endpoint returns a PNG directly, so it's fetched with the
    // auth header and turned into an object URL rather than used as a plain <img src>.
    fetch(`${API_BASE}/assets/${id}/qrcode/image/`, {
      headers: { Authorization: `Bearer ${tokens.access}` },
    })
      .then((res) => (res.ok ? res.blob() : Promise.reject()))
      .then((blob) => setQrImageUrl(URL.createObjectURL(blob)))
      .catch(() => {});
  }, [id]);

  if (error)
    return (
      <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger-soft-foreground">
        {error}
      </p>
    );
  if (!asset) return <p className="text-sm text-muted-foreground">Chargement...</p>;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{asset.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{asset.code}</p>
        </div>
        <div className="flex gap-2 self-start">
          {canManage && (
            <Link
              href={`/assets/${asset.id}/edit`}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-surface-hover"
            >
              <Pencil size={16} />
              Modifier
            </Link>
          )}
          <Link
            href={`/failures/new?asset=${asset.id}`}
            className="inline-flex items-center gap-2 rounded-lg bg-danger px-4 py-2.5 text-sm font-semibold text-white shadow-[var(--shadow-soft)] transition-colors hover:opacity-90"
          >
            <AlertTriangle size={16} />
            Signaler une panne
          </Link>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-3">
        <div className="space-y-5 rounded-2xl border border-border bg-surface p-6 shadow-[var(--shadow-soft)] sm:col-span-2">
          <div className="flex items-start gap-4">
            {asset.photo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={asset.photo}
                alt={asset.name}
                className="h-16 w-16 shrink-0 rounded-lg border border-border object-cover"
              />
            )}
            <div className="flex gap-2 pt-1">
              <Badge value={asset.status} />
              <Badge value={asset.criticality} />
            </div>
          </div>
          <dl className="grid grid-cols-2 gap-5 text-sm">
            <div>
              <dt className="text-muted-foreground">Fabricant</dt>
              <dd className="mt-0.5 font-medium text-foreground">{asset.manufacturer || "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Modèle</dt>
              <dd className="mt-0.5 font-medium text-foreground">{asset.model || "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Numéro de série</dt>
              <dd className="mt-0.5 font-medium text-foreground">{asset.serial_number || "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Mise en service</dt>
              <dd className="mt-0.5 font-medium text-foreground">{asset.commissioned_at || "—"}</dd>
            </div>
          </dl>
          {asset.description && (
            <p className="border-t border-border pt-4 text-sm text-muted-foreground">
              {asset.description}
            </p>
          )}
        </div>

        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-surface p-6 text-center shadow-[var(--shadow-soft)]">
          <p className="text-sm font-medium text-muted-foreground">QR Code</p>
          {qrImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={qrImageUrl}
              alt={`QR code de ${asset.name}`}
              className="h-40 w-40 rounded-lg border border-border bg-white p-2"
            />
          ) : (
            <div className="flex h-40 w-40 items-center justify-center rounded-lg border border-dashed border-border text-muted-foreground">
              <QrCode size={28} className="animate-pulse" />
            </div>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-6 shadow-[var(--shadow-soft)]">
        <p className="mb-4 text-sm font-semibold text-foreground">Historique</p>
        {history && history.length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Aucun événement enregistré pour cet équipement.
          </p>
        )}
        {history && history.length > 0 && (
          <ul className="space-y-4">
            {history.map((event, i) => {
              const Icon = EVENT_ICON[event.type];
              return (
                <li key={i} className="flex gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary-soft-foreground">
                    <Icon size={14} />
                  </span>
                  <div className="min-w-0 flex-1 border-b border-border pb-4 last:border-0 last:pb-0">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm text-foreground">{event.title}</p>
                      <Badge value={event.status} />
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {new Date(event.date).toLocaleString("fr-FR")}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
