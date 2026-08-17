export type Role =
  | "admin"
  | "maintenance_manager"
  | "planner"
  | "technician"
  | "direction";

export const ROLE_LABELS: Record<Role, string> = {
  admin: "Administrateur",
  maintenance_manager: "Responsable Maintenance",
  planner: "Planificateur",
  technician: "Technicien",
  direction: "Direction",
};

export interface MeUser {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: Role;
  company: string;
  is_active: boolean;
}

export interface Site {
  id: string;
  company: string;
  name: string;
  code: string;
  address: string;
  description: string;
  manager: number | null;
  status: "active" | "inactive";
}

export interface Location {
  id: string;
  company: string;
  site: string;
  parent: string | null;
  name: string;
  code: string;
  description: string;
}

export interface AssetCategory {
  id: string;
  company: string;
  name: string;
  description: string;
}

export interface Asset {
  id: string;
  company: string;
  name: string;
  code: string;
  serial_number: string;
  manufacturer: string;
  model: string;
  category: string | null;
  site: string;
  location: string | null;
  parent: string | null;
  criticality: "low" | "medium" | "high" | "critical";
  status: "in_service" | "in_maintenance" | "down" | "out_of_service" | "retired";
  installed_at: string | null;
  commissioned_at: string | null;
  warranty_end_at: string | null;
  description: string;
  photo: string | null;
}

export interface AssetScan {
  id: string;
  name: string;
  code: string;
  status: Asset["status"];
  criticality: Asset["criticality"];
  next_maintenance_at: string | null;
  last_intervention_at: string | null;
}

export type WorkOrderStatus =
  | "draft"
  | "planned"
  | "assigned"
  | "in_progress"
  | "on_hold"
  | "done"
  | "validated"
  | "closed";

export type WorkOrderResult =
  | ""
  | "repaired"
  | "partially_repaired"
  | "not_repaired"
  | "needs_followup";

export interface WorkOrderTask {
  id: string;
  work_order: string;
  label: string;
  order: number;
  result: "" | "conforme" | "non_conforme" | "not_applicable";
  comment: string;
  photo: string | null;
}

export interface WorkOrderPhoto {
  id: string;
  work_order: string;
  kind: "before" | "after";
  image: string;
  uploaded_by: number | null;
}

export interface WorkOrder {
  id: string;
  company: string;
  number: string;
  title: string;
  description: string;
  wo_type: "corrective" | "preventive" | "inspection";
  asset: string;
  asset_name: string;
  asset_code: string;
  site: string;
  site_name: string;
  priority: "low" | "normal" | "high" | "urgent" | "critical";
  status: WorkOrderStatus;
  requested_by: number | null;
  requested_by_name: string | null;
  technician: number | null;
  technician_name: string | null;
  maintenance_plan: string | null;
  scheduled_at: string | null;
  estimated_duration_minutes: number | null;
  started_at: string | null;
  finished_at: string | null;
  time_spent_minutes: number | null;
  work_performed: string;
  identified_cause: string;
  solution_applied: string;
  technician_comment: string;
  result: WorkOrderResult;
  submitted_at: string | null;
  submitted_by: number | null;
  validated_at: string | null;
  validated_by: number | null;
  validation_note: string;
  closed_at: string | null;
  tasks: WorkOrderTask[];
  photos: WorkOrderPhoto[];
  created_at: string;
}

export interface AuditLog {
  id: string;
  user: number | null;
  user_email: string;
  action:
    | "login"
    | "create"
    | "update"
    | "delete"
    | "status_change"
    | "assignment"
    | "validation"
    | "closure";
  object_repr: string;
  old_value: unknown;
  new_value: unknown;
  created_at: string;
}

export interface UserSummary {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: Role;
}

export type RequestStatus =
  | "new"
  | "in_analysis"
  | "accepted"
  | "converted"
  | "closed"
  | "rejected";

export interface InterventionRequest {
  id: string;
  company: string;
  asset: string;
  location: string | null;
  description: string;
  urgency: "low" | "normal" | "high" | "critical";
  status: RequestStatus;
  requested_by: number | null;
  reviewed_by: number | null;
  review_note: string;
  work_order: string | null;
  created_at: string;
}

export interface Failure {
  id: string;
  company: string;
  asset: string;
  source_request: string | null;
  work_order: string | null;
  started_at: string;
  description: string;
  priority: "low" | "normal" | "high" | "urgent" | "critical";
  cause: string;
  symptoms: string;
  comment: string;
  downtime_minutes: number | null;
  status: "open" | "in_progress" | "resolved" | "closed";
  reported_by: number | null;
  created_at: string;
}

export interface MaintenanceChecklistItem {
  id: string;
  plan: string;
  label: string;
  order: number;
}

export interface MaintenancePlan {
  id: string;
  company: string;
  name: string;
  asset: string;
  description: string;
  plan_type: "preventive" | "inspection";
  frequency: "daily" | "weekly" | "monthly" | "quarterly" | "semi_annual" | "annual";
  estimated_duration_minutes: number | null;
  responsible: number | null;
  instructions: string;
  is_active: boolean;
  next_due_at: string | null;
  last_generated_at: string | null;
  checklist_items: MaintenanceChecklistItem[];
}

export interface DashboardKpis {
  period_days: number;
  assets_total: number;
  failures_open: number;
  failures_critical: number;
  work_orders_open: number;
  work_orders_overdue: number;
  preventive_upcoming: number;
  preventive_overdue: number;
  preventive_completion_rate: number | null;
  backlog: number;
  mttr_minutes: number | null;
  mtbf_hours: number | null;
  availability_pct: number | null;
  status_breakdown: {
    planned: number;
    in_progress: number;
    overdue: number;
    closed: number;
  };
  daily_series: { date: string; created: number; closed: number }[];
}
