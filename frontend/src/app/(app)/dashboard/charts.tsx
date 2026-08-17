"use client";

import { useTheme } from "next-themes";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { DashboardKpis } from "@/lib/types";

const CHART_COLORS = {
  light: { created: "#6366f1", closed: "#10b981" },
  dark: { created: "#818cf8", closed: "#34d399" },
};

const STATUS_COLORS = {
  light: { planned: "#3b82f6", in_progress: "#f59e0b", overdue: "#ef4444", closed: "#9ca3af" },
  dark: { planned: "#60a5fa", in_progress: "#fbbf24", overdue: "#f87171", closed: "#71717a" },
};

const STATUS_LABELS: Record<string, string> = {
  planned: "Planifiés",
  in_progress: "En cours",
  overdue: "En retard",
  closed: "Clôturés",
};

export function WorkOrdersAreaChart({ dailySeries }: { dailySeries: DashboardKpis["daily_series"] }) {
  const { resolvedTheme } = useTheme();
  const palette = resolvedTheme === "dark" ? CHART_COLORS.dark : CHART_COLORS.light;
  const gridColor = resolvedTheme === "dark" ? "#2a2a2e" : "#e5e7eb";
  const axisColor = resolvedTheme === "dark" ? "#8a8a92" : "#6b7280";

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-soft)]">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">Évolution des ordres de travail</h2>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ background: palette.created }} />
            OT créés
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ background: palette.closed }} />
            OT clôturés
          </span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={dailySeries} margin={{ left: -20, right: 8 }}>
          <defs>
            <linearGradient id="createdFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={palette.created} stopOpacity={0.25} />
              <stop offset="100%" stopColor={palette.created} stopOpacity={0} />
            </linearGradient>
            <linearGradient id="closedFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={palette.closed} stopOpacity={0.25} />
              <stop offset="100%" stopColor={palette.closed} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={(d) => new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}
            tick={{ fontSize: 11, fill: axisColor }}
            axisLine={{ stroke: gridColor }}
            tickLine={false}
            minTickGap={30}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 11, fill: axisColor }}
            axisLine={false}
            tickLine={false}
            width={28}
          />
          <Tooltip
            contentStyle={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              fontSize: 12,
            }}
            labelFormatter={(d) =>
              new Date(d as string).toLocaleDateString("fr-FR", { day: "2-digit", month: "long" })
            }
          />
          <Area
            type="monotone"
            dataKey="created"
            name="OT créés"
            stroke={palette.created}
            strokeWidth={2}
            fill="url(#createdFill)"
          />
          <Area
            type="monotone"
            dataKey="closed"
            name="OT clôturés"
            stroke={palette.closed}
            strokeWidth={2}
            fill="url(#closedFill)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function StatusDonutChart({ statusBreakdown }: { statusBreakdown: DashboardKpis["status_breakdown"] }) {
  const { resolvedTheme } = useTheme();
  const statusPalette = resolvedTheme === "dark" ? STATUS_COLORS.dark : STATUS_COLORS.light;

  const donutData = (["planned", "in_progress", "overdue", "closed"] as const).map((key) => ({
    key,
    label: STATUS_LABELS[key],
    value: statusBreakdown[key],
    color: statusPalette[key],
  }));
  const donutTotal = donutData.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-soft)]">
      <h2 className="mb-4 text-sm font-semibold text-foreground">Répartition des OT</h2>
      <div className="relative">
        <ResponsiveContainer width="100%" height={180}>
          <PieChart>
            <Pie
              data={donutData}
              dataKey="value"
              nameKey="label"
              innerRadius={55}
              outerRadius={80}
              paddingAngle={donutTotal > 0 ? 2 : 0}
              stroke="var(--surface)"
              strokeWidth={2}
            >
              {donutData.map((d) => (
                <Cell key={d.key} fill={d.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                fontSize: 12,
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-2xl font-semibold text-foreground">{donutTotal}</p>
          <p className="text-xs text-muted-foreground">Total</p>
        </div>
      </div>
      <ul className="mt-3 space-y-1.5">
        {donutData.map((d) => (
          <li key={d.key} className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-2 text-muted-foreground">
              <span className="h-2 w-2 rounded-full" style={{ background: d.color }} />
              {d.label}
            </span>
            <span className="font-medium text-foreground">
              {d.value} ({donutTotal ? Math.round((d.value / donutTotal) * 100) : 0}%)
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
