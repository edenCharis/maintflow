import { LucideIcon } from "lucide-react";

export type KpiAccent = "primary" | "info" | "warning" | "danger" | "success" | "cyan" | "pink";

const ICON_WRAP: Record<KpiAccent, string> = {
  primary: "bg-primary-soft text-primary-soft-foreground",
  info: "bg-info-soft text-info-soft-foreground",
  warning: "bg-warning-soft text-warning-soft-foreground",
  danger: "bg-danger-soft text-danger-soft-foreground",
  success: "bg-success-soft text-success-soft-foreground",
  cyan: "bg-cyan-soft text-cyan-soft-foreground",
  pink: "bg-pink-soft text-pink-soft-foreground",
};

const BAR_FILL: Record<KpiAccent, string> = {
  primary: "bg-primary",
  info: "bg-info",
  warning: "bg-warning",
  danger: "bg-danger",
  success: "bg-success",
  cyan: "bg-cyan",
  pink: "bg-pink",
};

export function KpiTile({
  label,
  subtitle,
  value,
  icon: Icon,
  accent = "primary",
  progressPct,
}: {
  label: string;
  subtitle?: string;
  value: string | number;
  icon?: LucideIcon;
  accent?: KpiAccent;
  /** 0-100. When set, renders a progress bar under the value instead of nothing. */
  progressPct?: number | null;
}) {
  return (
    <div className="group rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-soft)] transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-elevated)]">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold text-foreground">{label}</p>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        {Icon && (
          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${ICON_WRAP[accent]}`}>
            <Icon size={16} />
          </span>
        )}
      </div>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-foreground">{value}</p>
      {progressPct != null && (
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={`h-full rounded-full ${BAR_FILL[accent]}`}
            style={{ width: `${Math.min(100, Math.max(0, progressPct))}%` }}
          />
        </div>
      )}
    </div>
  );
}
