"use client";

import { useCallback, useEffect, useState } from "react";
import { apiJson, Paginated } from "@/lib/api";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { Bell } from "lucide-react";

interface Notification {
  id: string;
  event: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export default function NotificationsPage() {
  const [items, setItems] = useState<Notification[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    apiJson<Paginated<Notification>>("/notifications/")
      .then((data) => setItems(data.results))
      .catch(() => setError("Impossible de charger les notifications."));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function markRead(id: string) {
    await apiJson(`/notifications/${id}/mark-read/`, { method: "POST", body: JSON.stringify({}) });
    load();
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title="Notifications" />

      {error && (
        <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger-soft-foreground">
          {error}
        </p>
      )}

      <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-[var(--shadow-soft)]">
        <div className="divide-y divide-border">
          {items?.map((n) => (
            <button
              key={n.id}
              onClick={() => !n.is_read && markRead(n.id)}
              className="flex w-full items-start gap-3 px-5 py-4 text-left text-sm transition-colors hover:bg-surface-hover"
            >
              {!n.is_read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />}
              <div className={`min-w-0 flex-1 ${n.is_read ? "pl-5 text-muted-foreground" : ""}`}>
                <div className="flex items-center justify-between gap-3">
                  <span className={n.is_read ? "" : "font-medium text-foreground"}>{n.title}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {new Date(n.created_at).toLocaleString("fr-FR")}
                  </span>
                </div>
                {n.message && <p className="mt-0.5 text-xs text-muted-foreground">{n.message}</p>}
              </div>
            </button>
          ))}
        </div>
        {items && items.length === 0 && <EmptyState icon={Bell} message="Aucune notification." />}
      </div>
    </div>
  );
}
