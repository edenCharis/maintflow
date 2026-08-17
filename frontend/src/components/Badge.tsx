type Tone = "muted" | "info" | "warning" | "danger" | "success" | "primary";

const TONE_MAP: Record<string, Tone> = {
  // asset / lifecycle status
  in_service: "success",
  in_maintenance: "warning",
  down: "danger",
  out_of_service: "muted",
  retired: "muted",
  // criticality / priority
  low: "muted",
  normal: "info",
  medium: "warning",
  high: "warning",
  urgent: "danger",
  critical: "danger",
  // work order status
  draft: "muted",
  planned: "info",
  assigned: "primary",
  in_progress: "warning",
  on_hold: "warning",
  done: "info",
  validated: "success",
  closed: "muted",
  // request status
  new: "info",
  in_analysis: "warning",
  accepted: "success",
  converted: "primary",
  rejected: "danger",
  // failure status
  open: "danger",
  resolved: "success",
};

const TONE_CLASSES: Record<Tone, string> = {
  muted: "bg-muted text-muted-foreground",
  info: "bg-info-soft text-info-soft-foreground",
  warning: "bg-warning-soft text-warning-soft-foreground",
  danger: "bg-danger-soft text-danger-soft-foreground",
  success: "bg-success-soft text-success-soft-foreground",
  primary: "bg-primary-soft text-primary-soft-foreground",
};

const DOT_CLASSES: Record<Tone, string> = {
  muted: "bg-muted-foreground",
  info: "bg-info",
  warning: "bg-warning",
  danger: "bg-danger",
  success: "bg-success",
  primary: "bg-primary",
};

export function Badge({ value, label }: { value: string; label?: string }) {
  const tone = TONE_MAP[value] ?? "muted";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${TONE_CLASSES[tone]}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${DOT_CLASSES[tone]}`} />
      {label ?? value}
    </span>
  );
}
