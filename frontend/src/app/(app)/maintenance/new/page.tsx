"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiJson, ApiError, Paginated } from "@/lib/api";
import { Asset, MaintenancePlan, UserSummary } from "@/lib/types";
import { CalendarClock, Plus, X } from "lucide-react";

const inputClass =
  "w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-[var(--ring)]";

const FREQUENCY_OPTIONS: { value: MaintenancePlan["frequency"]; label: string }[] = [
  { value: "daily", label: "Quotidienne" },
  { value: "weekly", label: "Hebdomadaire" },
  { value: "monthly", label: "Mensuelle" },
  { value: "quarterly", label: "Trimestrielle" },
  { value: "semi_annual", label: "Semestrielle" },
  { value: "annual", label: "Annuelle" },
];

export default function NewMaintenancePlanPage() {
  const router = useRouter();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [users, setUsers] = useState<UserSummary[]>([]);

  const [name, setName] = useState("");
  const [asset, setAsset] = useState("");
  const [description, setDescription] = useState("");
  const [planType, setPlanType] = useState<MaintenancePlan["plan_type"]>("preventive");
  const [frequency, setFrequency] = useState<MaintenancePlan["frequency"]>("monthly");
  const [duration, setDuration] = useState("");
  const [responsible, setResponsible] = useState("");
  const [instructions, setInstructions] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [nextDueAt, setNextDueAt] = useState("");
  const [checklist, setChecklist] = useState<string[]>([""]);

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    apiJson<Paginated<Asset>>("/assets/?page_size=200").then((d) => setAssets(d.results)).catch(() => {});
    apiJson<Paginated<UserSummary>>("/users/?page_size=200").then((d) => setUsers(d.results)).catch(() => {});
  }, []);

  function updateChecklistItem(index: number, value: string) {
    setChecklist((items) => items.map((item, i) => (i === index ? value : item)));
  }

  function addChecklistItem() {
    setChecklist((items) => [...items, ""]);
  }

  function removeChecklistItem(index: number) {
    setChecklist((items) => items.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const plan = await apiJson<MaintenancePlan>("/maintenance-plans/", {
        method: "POST",
        body: JSON.stringify({
          name,
          asset,
          description,
          plan_type: planType,
          frequency,
          estimated_duration_minutes: duration ? Number(duration) : null,
          responsible: responsible ? Number(responsible) : null,
          instructions,
          is_active: isActive,
          next_due_at: nextDueAt ? new Date(nextDueAt).toISOString() : null,
        }),
      });

      const items = checklist.map((label) => label.trim()).filter(Boolean);
      await Promise.all(
        items.map((label, order) =>
          apiJson("/maintenance-plans/checklist-items/", {
            method: "POST",
            body: JSON.stringify({ plan: plan.id, label, order }),
          })
        )
      );

      router.push("/maintenance");
    } catch (err) {
      setError(err instanceof ApiError ? "Vérifiez les informations saisies." : "Erreur réseau.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-primary-soft-foreground">
          <CalendarClock size={18} />
        </span>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Nouveau plan de maintenance
          </h1>
          <p className="text-sm text-muted-foreground">
            Les OT seront générés automatiquement à l&apos;échéance choisie.
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-5 rounded-2xl border border-border bg-surface p-6 shadow-[var(--shadow-soft)]"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-1.5 sm:col-span-2">
            <span className="text-sm font-medium text-foreground">
              Nom du plan <span className="text-danger">*</span>
            </span>
            <input required value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
          </label>

          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-foreground">
              Équipement <span className="text-danger">*</span>
            </span>
            <select required value={asset} onChange={(e) => setAsset(e.target.value)} className={inputClass}>
              <option value="" disabled>
                Sélectionner un équipement
              </option>
              {assets.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.code} — {a.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-foreground">Type</span>
            <select
              value={planType}
              onChange={(e) => setPlanType(e.target.value as MaintenancePlan["plan_type"])}
              className={inputClass}
            >
              <option value="preventive">Préventive</option>
              <option value="inspection">Inspection</option>
            </select>
          </label>

          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-foreground">
              Fréquence <span className="text-danger">*</span>
            </span>
            <select
              required
              value={frequency}
              onChange={(e) => setFrequency(e.target.value as MaintenancePlan["frequency"])}
              className={inputClass}
            >
              {FREQUENCY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-foreground">
              Première échéance <span className="text-danger">*</span>
            </span>
            <input
              required
              type="datetime-local"
              value={nextDueAt}
              onChange={(e) => setNextDueAt(e.target.value)}
              className={inputClass}
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-foreground">Durée estimée (min)</span>
            <input
              type="number"
              min={0}
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className={inputClass}
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-foreground">Responsable</span>
            <select value={responsible} onChange={(e) => setResponsible(e.target.value)} className={inputClass}>
              <option value="">Non assigné</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.first_name} {u.last_name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-foreground">Description</span>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={inputClass}
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-foreground">Instructions</span>
          <textarea
            rows={3}
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            className={inputClass}
            placeholder="Étapes à suivre pour le technicien..."
          />
        </label>

        <div className="space-y-2">
          <span className="text-sm font-medium text-foreground">Checklist</span>
          <div className="space-y-2">
            {checklist.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  value={item}
                  onChange={(e) => updateChecklistItem(index, e.target.value)}
                  placeholder={`Élément ${index + 1}`}
                  className={inputClass}
                />
                {checklist.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeChecklistItem(index)}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-surface-hover"
                    aria-label="Supprimer"
                  >
                    <X size={15} />
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addChecklistItem}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            <Plus size={14} />
            Ajouter un élément
          </button>
        </div>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="h-4 w-4 rounded border-border text-primary focus:ring-[var(--ring)]"
          />
          <span className="text-sm font-medium text-foreground">Plan actif</span>
        </label>

        {error && (
          <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger-soft-foreground">{error}</p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-soft)] transition-colors hover:bg-primary-hover disabled:opacity-60 sm:w-auto"
        >
          {submitting ? "Création..." : "Créer le plan"}
        </button>
      </form>
    </div>
  );
}
