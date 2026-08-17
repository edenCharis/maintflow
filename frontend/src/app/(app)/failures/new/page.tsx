"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiJson, ApiError, Paginated } from "@/lib/api";
import { Asset } from "@/lib/types";
import { AlertTriangle } from "lucide-react";

function ReportFailureForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const presetAssetId = searchParams.get("asset") ?? "";

  const [assets, setAssets] = useState<Asset[]>([]);
  const [assetId, setAssetId] = useState(presetAssetId);
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("normal");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    apiJson<Paginated<Asset>>("/assets/?page_size=200")
      .then((data) => setAssets(data.results))
      .catch(() => {});
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await apiJson("/failures/", {
        method: "POST",
        body: JSON.stringify({
          asset: assetId,
          description,
          priority,
          started_at: new Date().toISOString(),
        }),
      });
      router.push("/failures");
    } catch (err) {
      setError(err instanceof ApiError ? "Vérifiez les informations saisies." : "Erreur réseau.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-danger-soft text-danger-soft-foreground">
          <AlertTriangle size={18} />
        </span>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Signaler une panne
          </h1>
          <p className="text-sm text-muted-foreground">
            Quelques champs suffisent pour créer l&apos;alerte.
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-2xl border border-border bg-surface p-6 shadow-[var(--shadow-soft)]"
      >
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">Équipement</label>
          <select
            required
            value={assetId}
            onChange={(e) => setAssetId(e.target.value)}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-[var(--ring)]"
          >
            <option value="" disabled>
              Sélectionner un équipement
            </option>
            {assets.map((a) => (
              <option key={a.id} value={a.id}>
                {a.code} — {a.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">Description</label>
          <textarea
            required
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-[var(--ring)]"
            placeholder="Que se passe-t-il ?"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">Priorité</label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-[var(--ring)]"
          >
            <option value="low">Faible</option>
            <option value="normal">Normale</option>
            <option value="high">Haute</option>
            <option value="urgent">Urgente</option>
            <option value="critical">Critique</option>
          </select>
        </div>

        {error && (
          <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger-soft-foreground">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-danger px-4 py-2.5 text-sm font-semibold text-white shadow-[var(--shadow-soft)] transition-colors hover:opacity-90 disabled:opacity-60"
        >
          {submitting ? "Envoi..." : "Signaler la panne"}
        </button>
      </form>
    </div>
  );
}

export default function NewFailurePage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Chargement...</p>}>
      <ReportFailureForm />
    </Suspense>
  );
}
