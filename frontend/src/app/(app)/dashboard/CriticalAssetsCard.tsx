import Link from "next/link";
import { Asset } from "@/lib/types";
import { Badge } from "@/components/Badge";

export function CriticalAssetsCard({
  assets,
  title = "Équipements critiques",
}: {
  assets: Asset[] | null;
  title?: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-soft)]">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        <Link href="/assets" className="text-xs font-medium text-primary hover:underline">
          Voir tout
        </Link>
      </div>
      {assets && assets.length === 0 && (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Aucun équipement de criticité critique.
        </p>
      )}
      {assets && assets.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="py-2 pr-4">Équipement</th>
                <th className="py-2 pr-4">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {assets.map((a) => (
                <tr key={a.id}>
                  <td className="py-2.5 pr-4">
                    <Link href={`/assets/${a.id}`} className="text-primary hover:underline">
                      {a.code} — {a.name}
                    </Link>
                  </td>
                  <td className="py-2.5 pr-4">
                    <Badge value={a.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
