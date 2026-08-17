"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronRight, LogOut } from "lucide-react";
import { ROLE_LABELS, Role } from "@/lib/types";

function initials(firstName: string, lastName: string) {
  return `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase() || "?";
}

export function UserMenu({
  firstName,
  lastName,
  role,
  onLogout,
}: {
  firstName: string;
  lastName: string;
  role: Role;
  onLogout: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      {open && (
        <div className="absolute bottom-full left-0 right-0 mb-2 overflow-hidden rounded-xl border border-border bg-surface shadow-[var(--shadow-elevated)]">
          <button
            onClick={onLogout}
            className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm font-medium text-danger hover:bg-surface-hover"
          >
            <LogOut size={15} />
            Déconnexion
          </button>
        </div>
      )}
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 rounded-lg px-1 py-1.5 text-left transition-colors hover:bg-surface-hover"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
          {initials(firstName, lastName)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">
            {firstName} {lastName}
          </p>
          <p className="truncate text-xs text-muted-foreground">{ROLE_LABELS[role]}</p>
        </div>
        <ChevronRight
          size={15}
          className={`shrink-0 text-muted-foreground transition-transform ${open ? "rotate-90" : ""}`}
        />
      </button>
    </div>
  );
}
