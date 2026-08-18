"use client";

import { use, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { apiJson, ApiError, Paginated } from "@/lib/api";
import { UserSummary, WorkOrder, WorkOrderPhoto, WorkOrderResult } from "@/lib/types";
import { Badge } from "@/components/Badge";
import { useAuth } from "@/lib/auth";
import {
  Camera,
  CheckCircle2,
  ChevronLeft,
  Pause,
  Play,
  Send,
  ThumbsDown,
  ThumbsUp,
  UserPlus,
  XCircle,
} from "lucide-react";

const PLANNER_ROLES = ["admin", "maintenance_manager", "planner"];
const VALIDATOR_ROLES = ["admin", "maintenance_manager"];

const RESULT_LABELS: Record<string, string> = {
  repaired: "Réparé",
  partially_repaired: "Partiellement réparé",
  not_repaired: "Non réparé",
  needs_followup: "Nécessite une nouvelle intervention",
};

type Panel = "assign" | "submit" | "validate" | "reject" | null;

export default function WorkOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useAuth();
  const [wo, setWo] = useState<WorkOrder | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [panel, setPanel] = useState<Panel>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = useCallback(() => {
    apiJson<WorkOrder>(`/work-orders/${id}/`)
      .then(setWo)
      .catch(() => setError("Ordre de travail introuvable."));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function runAction(action: string, body: Record<string, unknown> = {}) {
    setBusy(true);
    setActionError(null);
    try {
      const updated = await apiJson<WorkOrder>(`/work-orders/${id}/${action}/`, {
        method: "POST",
        body: JSON.stringify(body),
      });
      setWo(updated);
      setPanel(null);
    } catch (err) {
      setActionError(
        err instanceof ApiError ? "Action refusée ou données invalides." : "Erreur réseau."
      );
    } finally {
      setBusy(false);
    }
  }

  async function uploadPhoto(kind: "before" | "after", file: File) {
    setActionError(null);
    try {
      const form = new FormData();
      form.set("work_order", id);
      form.set("kind", kind);
      form.set("image", file);
      await apiJson("/work-orders/photos/", { method: "POST", body: form });
      load();
    } catch {
      setActionError("Échec de l'envoi de la photo.");
    }
  }

  if (error)
    return (
      <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger-soft-foreground">
        {error}
      </p>
    );
  if (!wo) return <p className="text-sm text-muted-foreground">Chargement...</p>;

  const canPlan = user ? PLANNER_ROLES.includes(user.role) : false;
  const canValidate = user ? VALIDATOR_ROLES.includes(user.role) : false;
  const isAssignedTechnician = user ? wo.technician === user.id : false;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Link
          href="/work-orders"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft size={15} />
          Ordres de travail
        </Link>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">{wo.number}</h1>
            <Badge value={wo.status} />
            <Badge value={wo.priority} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{wo.title}</p>
        </div>
      </div>

      {actionError && (
        <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger-soft-foreground">
          {actionError}
        </p>
      )}

      {/* Lifecycle actions */}
      <div className="flex flex-wrap items-center gap-2">
        {canPlan && ["draft", "planned", "assigned"].includes(wo.status) && (
          <ActionButton
            icon={UserPlus}
            label={wo.technician ? "Réassigner" : "Assigner"}
            onClick={() => setPanel(panel === "assign" ? null : "assign")}
            variant="outline"
          />
        )}
        {isAssignedTechnician && wo.status === "assigned" && (
          <ActionButton
            icon={Play}
            label="Démarrer"
            onClick={() => runAction("start")}
            disabled={busy}
          />
        )}
        {isAssignedTechnician && wo.status === "in_progress" && (
          <>
            <ActionButton
              icon={Pause}
              label="Mettre en attente"
              onClick={() => runAction("hold")}
              disabled={busy}
              variant="outline"
            />
            <ActionButton
              icon={Send}
              label="Soumettre"
              onClick={() => setPanel(panel === "submit" ? null : "submit")}
            />
          </>
        )}
        {isAssignedTechnician && wo.status === "on_hold" && (
          <ActionButton icon={Play} label="Reprendre" onClick={() => runAction("resume")} disabled={busy} />
        )}
        {canValidate && wo.status === "done" && (
          <>
            <ActionButton
              icon={ThumbsUp}
              label="Valider"
              onClick={() => setPanel(panel === "validate" ? null : "validate")}
            />
            <ActionButton
              icon={ThumbsDown}
              label="Rejeter"
              onClick={() => setPanel(panel === "reject" ? null : "reject")}
              variant="outline"
            />
          </>
        )}
        {canValidate && wo.status === "validated" && (
          <ActionButton
            icon={CheckCircle2}
            label="Clôturer"
            onClick={() => runAction("close")}
            disabled={busy}
          />
        )}
      </div>

      {panel === "assign" && (
        <AssignPanel busy={busy} onCancel={() => setPanel(null)} onSubmit={(technician) => runAction("assign", { technician })} />
      )}
      {panel === "submit" && (
        <SubmitPanel busy={busy} onCancel={() => setPanel(null)} onSubmit={(data) => runAction("submit", data)} />
      )}
      {panel === "validate" && (
        <NotePanel
          busy={busy}
          title="Valider l'OT"
          confirmLabel="Valider"
          onCancel={() => setPanel(null)}
          onSubmit={(note) => runAction("validate", { note })}
        />
      )}
      {panel === "reject" && (
        <NotePanel
          busy={busy}
          title="Rejeter l'OT"
          confirmLabel="Rejeter"
          onCancel={() => setPanel(null)}
          onSubmit={(note) => runAction("reject", { note })}
        />
      )}

      <div className="grid gap-6 sm:grid-cols-3">
        <div className="space-y-5 rounded-2xl border border-border bg-surface p-6 shadow-[var(--shadow-soft)] sm:col-span-2">
          <dl className="grid grid-cols-2 gap-5 text-sm">
            <Field label="Équipement">
              <Link href={`/assets/${wo.asset}`} className="text-primary hover:underline">
                {wo.asset_code} — {wo.asset_name}
              </Link>
            </Field>
            <Field label="Site">{wo.site_name}</Field>
            <Field label="Type">
              <span className="capitalize">{wo.wo_type}</span>
            </Field>
            <Field label="Technicien">{wo.technician_name || "Non assigné"}</Field>
            <Field label="Demandeur">{wo.requested_by_name || "—"}</Field>
            <Field label="Planifié">
              {wo.scheduled_at ? new Date(wo.scheduled_at).toLocaleString("fr-FR") : "—"}
            </Field>
          </dl>
          {wo.description && (
            <p className="border-t border-border pt-4 text-sm text-muted-foreground">
              {wo.description}
            </p>
          )}
        </div>

        <div className="space-y-3 rounded-2xl border border-border bg-surface p-6 shadow-[var(--shadow-soft)] text-sm">
          <p className="text-sm font-semibold text-foreground">Historique</p>
          <TimelineRow label="Créé" value={new Date(wo.created_at).toLocaleString("fr-FR")} />
          {wo.started_at && (
            <TimelineRow label="Démarré" value={new Date(wo.started_at).toLocaleString("fr-FR")} />
          )}
          {wo.submitted_at && (
            <TimelineRow label="Soumis" value={new Date(wo.submitted_at).toLocaleString("fr-FR")} />
          )}
          {wo.validated_at && (
            <TimelineRow label="Validé" value={new Date(wo.validated_at).toLocaleString("fr-FR")} />
          )}
          {wo.closed_at && (
            <TimelineRow label="Clôturé" value={new Date(wo.closed_at).toLocaleString("fr-FR")} />
          )}
        </div>
      </div>

      {(wo.work_performed || wo.result) && (
        <div className="space-y-4 rounded-2xl border border-border bg-surface p-6 shadow-[var(--shadow-soft)]">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground">Exécution</p>
            {wo.result && <Badge value={wo.result} label={RESULT_LABELS[wo.result]} />}
          </div>
          <dl className="space-y-3 text-sm">
            {wo.work_performed && <Field label="Travail effectué">{wo.work_performed}</Field>}
            {wo.identified_cause && <Field label="Cause identifiée">{wo.identified_cause}</Field>}
            {wo.solution_applied && <Field label="Solution appliquée">{wo.solution_applied}</Field>}
            {wo.technician_comment && <Field label="Commentaire">{wo.technician_comment}</Field>}
            {wo.time_spent_minutes != null && (
              <Field label="Temps passé">{wo.time_spent_minutes} min</Field>
            )}
          </dl>
        </div>
      )}

      {wo.tasks.length > 0 && (
        <div className="space-y-3 rounded-2xl border border-border bg-surface p-6 shadow-[var(--shadow-soft)]">
          <p className="text-sm font-semibold text-foreground">Checklist</p>
          <ul className="divide-y divide-border">
            {wo.tasks.map((t) => (
              <li key={t.id} className="flex items-center justify-between py-2.5 text-sm">
                <span className="text-foreground">{t.label}</span>
                {t.result && <Badge value={t.result} />}
              </li>
            ))}
          </ul>
        </div>
      )}

      {(isAssignedTechnician || wo.photos.length > 0) && (
        <PhotosSection
          photos={wo.photos}
          canUpload={isAssignedTechnician && !["closed"].includes(wo.status)}
          onUpload={uploadPhoto}
        />
      )}

      {wo.validation_note && (
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-[var(--shadow-soft)]">
          <p className="text-sm font-semibold text-foreground">Note de validation</p>
          <p className="mt-2 text-sm text-muted-foreground">{wo.validation_note}</p>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 font-medium text-foreground">{children}</dd>
    </div>
  );
}

function TimelineRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-t border-border pt-2 first:border-0 first:pt-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}

function ActionButton({
  icon: Icon,
  label,
  onClick,
  disabled,
  variant = "solid",
}: {
  icon: typeof Play;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: "solid" | "outline";
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors disabled:opacity-60 ${
        variant === "solid"
          ? "bg-primary text-primary-foreground hover:bg-primary-hover"
          : "border border-border bg-surface text-foreground hover:bg-surface-hover"
      }`}
    >
      <Icon size={15} />
      {label}
    </button>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4 rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-soft)]">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      {children}
    </div>
  );
}

function AssignPanel({
  busy,
  onCancel,
  onSubmit,
}: {
  busy: boolean;
  onCancel: () => void;
  onSubmit: (technicianId: number) => void;
}) {
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [selected, setSelected] = useState<string>("");

  useEffect(() => {
    apiJson<Paginated<UserSummary>>("/users/?page_size=200")
      .then((data) => setUsers(data.results))
      .catch(() => {});
  }, []);

  return (
    <Panel title="Assigner un technicien">
      <select
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
        className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-[var(--ring)]"
      >
        <option value="" disabled>
          Sélectionner un utilisateur
        </option>
        {users.map((u) => (
          <option key={u.id} value={u.id}>
            {u.first_name} {u.last_name} ({u.email})
          </option>
        ))}
      </select>
      <PanelActions
        busy={busy}
        onCancel={onCancel}
        confirmLabel="Assigner"
        disabled={!selected}
        onConfirm={() => onSubmit(Number(selected))}
      />
    </Panel>
  );
}

function SubmitPanel({
  busy,
  onCancel,
  onSubmit,
}: {
  busy: boolean;
  onCancel: () => void;
  onSubmit: (data: {
    work_performed: string;
    identified_cause: string;
    solution_applied: string;
    technician_comment: string;
    time_spent_minutes?: number;
    result: WorkOrderResult;
  }) => void;
}) {
  const [workPerformed, setWorkPerformed] = useState("");
  const [cause, setCause] = useState("");
  const [solution, setSolution] = useState("");
  const [comment, setComment] = useState("");
  const [timeSpent, setTimeSpent] = useState("");
  const [result, setResult] = useState<WorkOrderResult>("repaired");

  return (
    <Panel title="Soumettre l'intervention">
      <div className="space-y-3">
        <textarea
          required
          rows={3}
          value={workPerformed}
          onChange={(e) => setWorkPerformed(e.target.value)}
          placeholder="Travail effectué"
          className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-[var(--ring)]"
        />
        <textarea
          rows={2}
          value={cause}
          onChange={(e) => setCause(e.target.value)}
          placeholder="Cause identifiée (optionnel)"
          className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-[var(--ring)]"
        />
        <textarea
          rows={2}
          value={solution}
          onChange={(e) => setSolution(e.target.value)}
          placeholder="Solution appliquée (optionnel)"
          className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-[var(--ring)]"
        />
        <textarea
          rows={2}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Commentaire (optionnel)"
          className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-[var(--ring)]"
        />
        <div className="grid grid-cols-2 gap-3">
          <input
            type="number"
            min={0}
            value={timeSpent}
            onChange={(e) => setTimeSpent(e.target.value)}
            placeholder="Temps passé (min)"
            className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-[var(--ring)]"
          />
          <select
            value={result}
            onChange={(e) => setResult(e.target.value as WorkOrderResult)}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-[var(--ring)]"
          >
            <option value="repaired">Réparé</option>
            <option value="partially_repaired">Partiellement réparé</option>
            <option value="not_repaired">Non réparé</option>
            <option value="needs_followup">Nécessite une nouvelle intervention</option>
          </select>
        </div>
      </div>
      <PanelActions
        busy={busy}
        onCancel={onCancel}
        confirmLabel="Soumettre"
        disabled={!workPerformed.trim()}
        onConfirm={() =>
          onSubmit({
            work_performed: workPerformed,
            identified_cause: cause,
            solution_applied: solution,
            technician_comment: comment,
            time_spent_minutes: timeSpent ? Number(timeSpent) : undefined,
            result,
          })
        }
      />
    </Panel>
  );
}

function NotePanel({
  busy,
  title,
  confirmLabel,
  onCancel,
  onSubmit,
}: {
  busy: boolean;
  title: string;
  confirmLabel: string;
  onCancel: () => void;
  onSubmit: (note: string) => void;
}) {
  const [note, setNote] = useState("");
  return (
    <Panel title={title}>
      <textarea
        rows={2}
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Note (optionnel)"
        className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-[var(--ring)]"
      />
      <PanelActions busy={busy} onCancel={onCancel} confirmLabel={confirmLabel} onConfirm={() => onSubmit(note)} />
    </Panel>
  );
}

function PhotosSection({
  photos,
  canUpload,
  onUpload,
}: {
  photos: WorkOrderPhoto[];
  canUpload: boolean;
  onUpload: (kind: "before" | "after", file: File) => void;
}) {
  const beforeInputRef = useRef<HTMLInputElement>(null);
  const afterInputRef = useRef<HTMLInputElement>(null);
  const before = photos.filter((p) => p.kind === "before");
  const after = photos.filter((p) => p.kind === "after");

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-surface p-6 shadow-[var(--shadow-soft)]">
      <p className="text-sm font-semibold text-foreground">Photos</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <PhotoGroup
          label="Avant"
          photos={before}
          canUpload={canUpload}
          inputRef={beforeInputRef}
          onPick={(file) => onUpload("before", file)}
        />
        <PhotoGroup
          label="Après"
          photos={after}
          canUpload={canUpload}
          inputRef={afterInputRef}
          onPick={(file) => onUpload("after", file)}
        />
      </div>
    </div>
  );
}

function PhotoGroup({
  label,
  photos,
  canUpload,
  inputRef,
  onPick,
}: {
  label: string;
  photos: WorkOrderPhoto[];
  canUpload: boolean;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onPick: (file: File) => void;
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <div className="flex flex-wrap gap-2">
        {photos.map((p) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={p.id}
            src={p.image}
            alt={label}
            className="h-20 w-20 rounded-lg border border-border object-cover"
          />
        ))}
        {canUpload && (
          <>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border text-muted-foreground hover:bg-surface-hover"
            >
              <Camera size={16} />
              <span className="text-[10px]">Ajouter</span>
            </button>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onPick(file);
                e.target.value = "";
              }}
            />
          </>
        )}
        {photos.length === 0 && !canUpload && <p className="text-xs text-muted-foreground">—</p>}
      </div>
    </div>
  );
}

function PanelActions({
  busy,
  disabled,
  confirmLabel,
  onCancel,
  onConfirm,
}: {
  busy: boolean;
  disabled?: boolean;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="flex justify-end gap-2">
      <button
        onClick={onCancel}
        className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3.5 py-2 text-sm font-medium text-muted-foreground hover:bg-surface-hover"
      >
        <XCircle size={15} />
        Annuler
      </button>
      <button
        onClick={onConfirm}
        disabled={busy || disabled}
        className="rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary-hover disabled:opacity-60"
      >
        {busy ? "..." : confirmLabel}
      </button>
    </div>
  );
}
