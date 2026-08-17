"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiJson, ApiError, Paginated } from "@/lib/api";
import { Asset, AssetCategory, Location, Site } from "@/lib/types";

const CRITICALITY_OPTIONS: { value: Asset["criticality"]; label: string }[] = [
  { value: "low", label: "Faible" },
  { value: "medium", label: "Moyenne" },
  { value: "high", label: "Élevée" },
  { value: "critical", label: "Critique" },
];

const STATUS_OPTIONS: { value: Asset["status"]; label: string }[] = [
  { value: "in_service", label: "En service" },
  { value: "in_maintenance", label: "En maintenance" },
  { value: "down", label: "En panne" },
  { value: "out_of_service", label: "Hors service" },
  { value: "retired", label: "Retiré" },
];

const inputClass =
  "w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-[var(--ring)]";

export function AssetForm({ asset }: { asset?: Asset }) {
  const router = useRouter();
  const isEdit = Boolean(asset);

  const [sites, setSites] = useState<Site[]>([]);
  const [categories, setCategories] = useState<AssetCategory[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);

  const [name, setName] = useState(asset?.name ?? "");
  const [code, setCode] = useState(asset?.code ?? "");
  const [serialNumber, setSerialNumber] = useState(asset?.serial_number ?? "");
  const [manufacturer, setManufacturer] = useState(asset?.manufacturer ?? "");
  const [model, setModel] = useState(asset?.model ?? "");
  const [category, setCategory] = useState(asset?.category ?? "");
  const [site, setSite] = useState(asset?.site ?? "");
  const [location, setLocation] = useState(asset?.location ?? "");
  const [parent, setParent] = useState(asset?.parent ?? "");
  const [criticality, setCriticality] = useState<Asset["criticality"]>(asset?.criticality ?? "medium");
  const [status, setStatus] = useState<Asset["status"]>(asset?.status ?? "in_service");
  const [installedAt, setInstalledAt] = useState(asset?.installed_at ?? "");
  const [commissionedAt, setCommissionedAt] = useState(asset?.commissioned_at ?? "");
  const [warrantyEndAt, setWarrantyEndAt] = useState(asset?.warranty_end_at ?? "");
  const [description, setDescription] = useState(asset?.description ?? "");
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    apiJson<Paginated<Site>>("/sites/?page_size=200").then((d) => setSites(d.results)).catch(() => {});
    apiJson<Paginated<AssetCategory>>("/assets/categories/?page_size=200")
      .then((d) => setCategories(d.results))
      .catch(() => {});
    apiJson<Paginated<Location>>("/locations/?page_size=200")
      .then((d) => setLocations(d.results))
      .catch(() => {});
    apiJson<Paginated<Asset>>("/assets/?page_size=200")
      .then((d) => setAssets(d.results.filter((a) => a.id !== asset?.id)))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const form = new FormData();
    form.set("name", name);
    form.set("code", code);
    form.set("serial_number", serialNumber);
    form.set("manufacturer", manufacturer);
    form.set("model", model);
    form.set("site", site);
    form.set("criticality", criticality);
    form.set("status", status);
    form.set("description", description);
    if (category) form.set("category", category);
    if (location) form.set("location", location);
    if (parent) form.set("parent", parent);
    if (installedAt) form.set("installed_at", installedAt);
    if (commissionedAt) form.set("commissioned_at", commissionedAt);
    if (warrantyEndAt) form.set("warranty_end_at", warrantyEndAt);
    if (photoFile) form.set("photo", photoFile);

    try {
      const saved = await apiJson<Asset>(isEdit ? `/assets/${asset!.id}/` : "/assets/", {
        method: isEdit ? "PATCH" : "POST",
        body: form,
      });
      router.push(`/assets/${saved.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? "Vérifiez les informations saisies." : "Erreur réseau.");
    } finally {
      setSubmitting(false);
    }
  }

  const locationsForSite = locations.filter((l) => !site || l.site === site);

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-2xl border border-border bg-surface p-6 shadow-[var(--shadow-soft)]"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nom" required>
          <input required value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
        </Field>
        <Field label="Code" required>
          <input required value={code} onChange={(e) => setCode(e.target.value)} className={inputClass} />
        </Field>
        <Field label="Fabricant">
          <input value={manufacturer} onChange={(e) => setManufacturer(e.target.value)} className={inputClass} />
        </Field>
        <Field label="Modèle">
          <input value={model} onChange={(e) => setModel(e.target.value)} className={inputClass} />
        </Field>
        <Field label="Numéro de série">
          <input value={serialNumber} onChange={(e) => setSerialNumber(e.target.value)} className={inputClass} />
        </Field>
        <Field label="Catégorie">
          <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass}>
            <option value="">Aucune</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Site" required>
          <select
            required
            value={site}
            onChange={(e) => {
              setSite(e.target.value);
              setLocation("");
            }}
            className={inputClass}
          >
            <option value="" disabled>
              Sélectionner un site
            </option>
            {sites.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Localisation">
          <select value={location} onChange={(e) => setLocation(e.target.value)} className={inputClass}>
            <option value="">Aucune</option>
            {locationsForSite.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Équipement parent">
          <select value={parent} onChange={(e) => setParent(e.target.value)} className={inputClass}>
            <option value="">Aucun</option>
            {assets.map((a) => (
              <option key={a.id} value={a.id}>
                {a.code} — {a.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Criticité" required>
          <select
            required
            value={criticality}
            onChange={(e) => setCriticality(e.target.value as Asset["criticality"])}
            className={inputClass}
          >
            {CRITICALITY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Statut" required>
          <select
            required
            value={status}
            onChange={(e) => setStatus(e.target.value as Asset["status"])}
            className={inputClass}
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Date d'installation">
          <input
            type="date"
            value={installedAt ?? ""}
            onChange={(e) => setInstalledAt(e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Mise en service">
          <input
            type="date"
            value={commissionedAt ?? ""}
            onChange={(e) => setCommissionedAt(e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Fin de garantie">
          <input
            type="date"
            value={warrantyEndAt ?? ""}
            onChange={(e) => setWarrantyEndAt(e.target.value)}
            className={inputClass}
          />
        </Field>
      </div>

      <Field label="Description">
        <textarea
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={inputClass}
        />
      </Field>

      <Field label="Photo">
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
          className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-primary-soft file:px-3 file:py-2 file:text-sm file:font-medium file:text-primary-soft-foreground"
        />
        {asset?.photo && !photoFile && (
          <p className="mt-1 text-xs text-muted-foreground">Une photo est déjà associée à cet équipement.</p>
        )}
      </Field>

      {error && (
        <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger-soft-foreground">{error}</p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-soft)] transition-colors hover:bg-primary-hover disabled:opacity-60 sm:w-auto"
      >
        {submitting ? "Enregistrement..." : isEdit ? "Enregistrer les modifications" : "Créer l'équipement"}
      </button>
    </form>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-foreground">
        {label}
        {required && <span className="text-danger"> *</span>}
      </span>
      {children}
    </label>
  );
}
