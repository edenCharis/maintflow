"use client";

import { AssetForm } from "@/components/AssetForm";
import { Wrench } from "lucide-react";

export default function NewAssetPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-primary-soft-foreground">
          <Wrench size={18} />
        </span>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Nouvel équipement</h1>
          <p className="text-sm text-muted-foreground">Renseignez les informations de l&apos;équipement.</p>
        </div>
      </div>
      <AssetForm />
    </div>
  );
}
