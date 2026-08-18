"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiJson, Paginated } from "@/lib/api";
import { AppUser, ROLE_LABELS } from "@/lib/types";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { Plus, Users } from "lucide-react";

export default function UsersPage() {
  const [users, setUsers] = useState<AppUser[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiJson<Paginated<AppUser>>("/users/")
      .then((data) => setUsers(data.results))
      .catch(() => setError("Impossible de charger les utilisateurs."));
  }, []);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        title="Utilisateurs"
        description="Comptes, rôles et accès de votre entreprise."
        action={
          <Link
            href="/users/new"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-soft)] transition-colors hover:bg-primary-hover"
          >
            <Plus size={16} />
            Nouvel utilisateur
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
                <th className="px-5 py-3">Nom</th>
                <th className="px-5 py-3">Email</th>
                <th className="px-5 py-3">Rôle</th>
                <th className="px-5 py-3">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users?.map((u) => (
                <tr key={u.id} className="transition-colors hover:bg-surface-hover">
                  <td className="px-5 py-3.5 font-medium">
                    <Link href={`/users/${u.id}/edit`} className="text-primary hover:underline">
                      {u.first_name} {u.last_name}
                    </Link>
                  </td>
                  <td className="px-5 py-3.5 text-muted-foreground">{u.email}</td>
                  <td className="px-5 py-3.5 text-muted-foreground">{ROLE_LABELS[u.role]}</td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                        u.is_active
                          ? "bg-success-soft text-success-soft-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${u.is_active ? "bg-success" : "bg-muted-foreground"}`}
                      />
                      {u.is_active ? "Actif" : "Désactivé"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {users && users.length === 0 && (
          <EmptyState icon={Users} message="Aucun utilisateur pour le moment." />
        )}
      </div>
    </div>
  );
}
