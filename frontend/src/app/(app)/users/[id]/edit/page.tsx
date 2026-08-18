"use client";

import { FormEvent, use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiJson, ApiError } from "@/lib/api";
import { AppUser, ROLE_LABELS, Role } from "@/lib/types";
import { UserCog } from "lucide-react";

const inputClass =
  "w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-[var(--ring)]";

const ROLES = Object.keys(ROLE_LABELS) as Role[];

export default function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [user, setUser] = useState<AppUser | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [role, setRole] = useState<Role>("technician");
  const [phone, setPhone] = useState("");
  const [functionTitle, setFunctionTitle] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    apiJson<AppUser>(`/users/${id}/`)
      .then((u) => {
        setUser(u);
        setFirstName(u.first_name);
        setLastName(u.last_name);
        setRole(u.role);
        setPhone(u.phone);
        setFunctionTitle(u.function);
        setIsActive(u.is_active);
      })
      .catch(() => setError("Utilisateur introuvable."));
  }, [id]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await apiJson(`/users/${id}/`, {
        method: "PATCH",
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          role,
          phone,
          function: functionTitle,
          is_active: isActive,
        }),
      });
      router.push("/users");
    } catch (err) {
      setError(err instanceof ApiError ? "Vérifiez les informations saisies." : "Erreur réseau.");
    } finally {
      setSubmitting(false);
    }
  }

  if (error && !user)
    return (
      <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger-soft-foreground">{error}</p>
    );
  if (!user) return <p className="text-sm text-muted-foreground">Chargement...</p>;

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-primary-soft-foreground">
          <UserCog size={18} />
        </span>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Modifier {user.first_name} {user.last_name}
          </h1>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-2xl border border-border bg-surface p-6 shadow-[var(--shadow-soft)]"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-foreground">Prénom</span>
            <input required value={firstName} onChange={(e) => setFirstName(e.target.value)} className={inputClass} />
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-foreground">Nom</span>
            <input required value={lastName} onChange={(e) => setLastName(e.target.value)} className={inputClass} />
          </label>
        </div>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-foreground">Rôle</span>
          <select value={role} onChange={(e) => setRole(e.target.value as Role)} className={inputClass}>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </select>
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-foreground">Téléphone</span>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} />
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-foreground">Fonction</span>
            <input
              value={functionTitle}
              onChange={(e) => setFunctionTitle(e.target.value)}
              className={inputClass}
            />
          </label>
        </div>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="h-4 w-4 rounded border-border text-primary focus:ring-[var(--ring)]"
          />
          <span className="text-sm font-medium text-foreground">Compte actif</span>
        </label>

        {error && (
          <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger-soft-foreground">{error}</p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-soft)] transition-colors hover:bg-primary-hover disabled:opacity-60 sm:w-auto"
        >
          {submitting ? "Enregistrement..." : "Enregistrer les modifications"}
        </button>
      </form>
    </div>
  );
}
