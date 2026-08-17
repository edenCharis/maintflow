"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { apiJson, Paginated } from "@/lib/api";
import { InterventionRequest } from "@/lib/types";
import { Badge } from "@/components/Badge";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { useAuth } from "@/lib/auth";
import { ClipboardList, Plus } from "lucide-react";

const REVIEWER_ROLES = ["admin", "maintenance_manager", "planner"];

export default function RequestsPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<InterventionRequest[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const canReview = user ? REVIEWER_ROLES.includes(user.role) : false;

  const load = useCallback(() => {
    apiJson<Paginated<InterventionRequest>>("/requests/")
      .then((data) => setRequests(data.results))
      .catch(() => setError("Impossible de charger les demandes."));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function act(id: string, action: "accept" | "reject" | "convert") {
    try {
      await apiJson(`/requests/${id}/${action}/`, { method: "POST", body: JSON.stringify({}) });
      load();
    } catch {
      setError("Action impossible.");
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="Demandes d'intervention"
        description="Nouvelle → En analyse → Acceptée → Convertie en OT → Clôturée."
        action={
          <Link
            href="/requests/new"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-soft)] transition-colors hover:bg-primary-hover"
          >
            <Plus size={16} />
            Nouvelle demande
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
                <th className="px-5 py-3">Description</th>
                <th className="px-5 py-3">Urgence</th>
                <th className="px-5 py-3">Statut</th>
                {canReview && <th className="px-5 py-3">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {requests?.map((req) => (
                <tr key={req.id} className="transition-colors hover:bg-surface-hover">
                  <td className="max-w-md truncate px-5 py-3.5 text-foreground">
                    {req.description}
                  </td>
                  <td className="px-5 py-3.5">
                    <Badge value={req.urgency} />
                  </td>
                  <td className="px-5 py-3.5">
                    <Badge value={req.status} />
                  </td>
                  {canReview && (
                    <td className="space-x-3 px-5 py-3.5">
                      {req.status === "new" && (
                        <>
                          <button
                            onClick={() => act(req.id, "accept")}
                            className="text-xs font-semibold text-success hover:underline"
                          >
                            Accepter
                          </button>
                          <button
                            onClick={() => act(req.id, "reject")}
                            className="text-xs font-semibold text-danger hover:underline"
                          >
                            Rejeter
                          </button>
                        </>
                      )}
                      {req.status === "accepted" && (
                        <button
                          onClick={() => act(req.id, "convert")}
                          className="text-xs font-semibold text-primary hover:underline"
                        >
                          Convertir en OT
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {requests && requests.length === 0 && (
          <EmptyState icon={ClipboardList} message="Aucune demande pour le moment." />
        )}
      </div>
    </div>
  );
}
