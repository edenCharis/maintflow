"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { apiJson, Paginated } from "@/lib/api";
import { Asset, Failure, InterventionRequest, WorkOrder } from "@/lib/types";
import { AlertTriangle, ClipboardList, Loader2, Search, Wrench, X } from "lucide-react";

interface Results {
  assets: Asset[];
  workOrders: WorkOrder[];
  requests: InterventionRequest[];
  failures: Failure[];
}

const EMPTY: Results = { assets: [], workOrders: [], requests: [], failures: [] };

export function GlobalSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Results>(EMPTY);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      // Resets results as soon as the query shrinks back below the search threshold.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setResults(EMPTY);
      return;
    }
    setLoading(true);
    const timer = setTimeout(() => {
      Promise.all([
        apiJson<Paginated<Asset>>(`/assets/?search=${encodeURIComponent(q)}&page_size=5`),
        apiJson<Paginated<WorkOrder>>(`/work-orders/?search=${encodeURIComponent(q)}&page_size=5`),
        apiJson<Paginated<InterventionRequest>>(
          `/requests/?search=${encodeURIComponent(q)}&page_size=5`
        ),
        apiJson<Paginated<Failure>>(`/failures/?search=${encodeURIComponent(q)}&page_size=5`),
      ])
        .then(([assets, workOrders, requests, failures]) => {
          setResults({
            assets: assets.results,
            workOrders: workOrders.results,
            requests: requests.results,
            failures: failures.results,
          });
        })
        .catch(() => setResults(EMPTY))
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const hasResults =
    results.assets.length + results.workOrders.length + results.requests.length + results.failures.length >
    0;

  function go(path: string) {
    setOpen(false);
    setQuery("");
    router.push(path);
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Rechercher un équipement, une OT, une panne..."
          className="w-full rounded-lg border border-border bg-muted/50 py-2 pl-9 pr-8 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:bg-surface focus:ring-2 focus:ring-[var(--ring)]"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label="Effacer"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {open && query.trim().length >= 2 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-96 overflow-y-auto rounded-xl border border-border bg-surface p-2 shadow-[var(--shadow-elevated)]">
          {loading && (
            <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
              <Loader2 size={14} className="animate-spin" />
              Recherche...
            </div>
          )}

          {!loading && !hasResults && (
            <p className="px-3 py-4 text-center text-sm text-muted-foreground">Aucun résultat.</p>
          )}

          {!loading && results.assets.length > 0 && (
            <SearchGroup label="Équipements">
              {results.assets.map((a) => (
                <SearchRow
                  key={a.id}
                  icon={Wrench}
                  title={`${a.code} — ${a.name}`}
                  onClick={() => go(`/assets/${a.id}`)}
                />
              ))}
            </SearchGroup>
          )}

          {!loading && results.workOrders.length > 0 && (
            <SearchGroup label="Ordres de travail">
              {results.workOrders.map((wo) => (
                <SearchRow
                  key={wo.id}
                  icon={Wrench}
                  title={`${wo.number} — ${wo.title}`}
                  onClick={() => go(`/work-orders/${wo.id}`)}
                />
              ))}
            </SearchGroup>
          )}

          {!loading && results.requests.length > 0 && (
            <SearchGroup label="Demandes">
              {results.requests.map((r) => (
                <SearchRow
                  key={r.id}
                  icon={ClipboardList}
                  title={r.description}
                  onClick={() => go("/requests")}
                />
              ))}
            </SearchGroup>
          )}

          {!loading && results.failures.length > 0 && (
            <SearchGroup label="Pannes">
              {results.failures.map((f) => (
                <SearchRow
                  key={f.id}
                  icon={AlertTriangle}
                  title={f.description}
                  onClick={() => go("/failures")}
                />
              ))}
            </SearchGroup>
          )}
        </div>
      )}
    </div>
  );
}

function SearchGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-1 last:mb-0">
      <p className="px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      {children}
    </div>
  );
}

function SearchRow({
  icon: Icon,
  title,
  onClick,
}: {
  icon: typeof Wrench;
  title: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-surface-hover"
    >
      <Icon size={14} className="shrink-0 text-muted-foreground" />
      <span className="truncate">{title}</span>
    </button>
  );
}
