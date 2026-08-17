"use client";

import { use, useEffect, useState } from "react";
import { apiJson } from "@/lib/api";
import { Asset } from "@/lib/types";
import { AssetForm } from "@/components/AssetForm";
import { Wrench } from "lucide-react";

export default function EditAssetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [asset, setAsset] = useState<Asset | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiJson<Asset>(`/assets/${id}/`)
      .then(setAsset)
      .catch(() => setError("Équipement introuvable."));
  }, [id]);

  if (error)
    return (
      <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger-soft-foreground">{error}</p>
    );
  if (!asset) return <p className="text-sm text-muted-foreground">Chargement...</p>;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-primary-soft-foreground">
          <Wrench size={18} />
        </span>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Modifier {asset.name}
          </h1>
          <p className="text-sm text-muted-foreground">{asset.code}</p>
        </div>
      </div>
      <AssetForm asset={asset} />
    </div>
  );
}
