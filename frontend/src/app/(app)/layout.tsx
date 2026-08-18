"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Role } from "@/lib/types";
import { apiJson, Paginated } from "@/lib/api";
import { ThemeToggle } from "@/components/ThemeToggle";
import { GlobalSearch } from "@/components/GlobalSearch";
import { UserMenu } from "@/components/UserMenu";
import {
  AlertTriangle,
  Bell,
  Building2,
  CalendarClock,
  ClipboardList,
  Hammer,
  LayoutDashboard,
  Maximize,
  Menu,
  Minimize,
  Users,
  Wrench,
  X,
} from "lucide-react";

const NAV_ITEMS: { href: string; label: string; icon: typeof Bell; roles: Role[] }[] = [
  {
    href: "/dashboard",
    label: "Tableau de bord",
    icon: LayoutDashboard,
    roles: ["admin", "maintenance_manager", "planner", "direction"],
  },
  {
    href: "/assets",
    label: "Équipements",
    icon: Wrench,
    roles: ["admin", "maintenance_manager"],
  },
  {
    href: "/maintenance",
    label: "Préventif",
    icon: CalendarClock,
    roles: ["admin", "maintenance_manager"],
  },
  {
    href: "/sites",
    label: "Sites",
    icon: Building2,
    roles: ["admin"],
  },
  {
    href: "/users",
    label: "Utilisateurs",
    icon: Users,
    roles: ["admin"],
  },
  {
    href: "/requests",
    label: "Demandes",
    icon: ClipboardList,
    roles: ["admin", "maintenance_manager", "planner"],
  },
  {
    href: "/failures",
    label: "Pannes",
    icon: AlertTriangle,
    roles: ["admin", "maintenance_manager", "technician"],
  },
  {
    href: "/work-orders",
    label: "Ordres de travail",
    icon: Hammer,
    roles: ["admin", "maintenance_manager", "planner", "technician"],
  },
  {
    href: "/notifications",
    label: "Notifications",
    icon: Bell,
    roles: ["admin", "maintenance_manager", "planner", "technician", "direction"],
  },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  // Closes the mobile drawer when the router navigates to a new route.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!user) return;
    apiJson<Paginated<unknown>>("/notifications/?is_read=false&page_size=1")
      .then((data) => setUnreadCount(data.count))
      .catch(() => {});
  }, [user, pathname]);

  useEffect(() => {
    function onFullscreenChange() {
      setFullscreen(Boolean(document.fullscreenElement));
    }
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        Chargement...
      </div>
    );
  }

  if (!user) {
    return null;
  }

  function handleLogout() {
    logout();
    router.push("/login");
  }

  function toggleFullscreen() {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      document.documentElement.requestFullscreen().catch(() => {});
    }
  }

  const visibleNavItems = NAV_ITEMS.filter((item) => item.roles.includes(user.role));
  const currentPage = visibleNavItems.find((item) => pathname?.startsWith(item.href));

  const nav = (
    <>
      <div className="mb-8 flex items-center gap-2.5 px-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-[oklch(0.5_0.22_300)] text-base font-bold text-primary-foreground shadow-[var(--shadow-soft)]">
          M
        </span>
        <div>
          <p className="text-base font-semibold leading-tight tracking-tight text-foreground">
            MaintFlow
          </p>
          <p className="text-[11px] leading-tight text-muted-foreground">GMAO</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1">
        {visibleNavItems.map((item) => {
          const active = pathname?.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? "bg-primary text-primary-foreground shadow-[var(--shadow-soft)]"
                  : "text-muted-foreground hover:bg-surface-hover hover:text-foreground"
              }`}
            >
              <Icon size={17} strokeWidth={2} />
              {item.label}
              {item.href === "/notifications" && unreadCount > 0 && (
                <span
                  className={`ml-auto flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[11px] font-semibold ${
                    active ? "bg-white/20 text-white" : "bg-danger text-white"
                  }`}
                >
                  {unreadCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="mt-6 border-t border-border pt-4">
        <UserMenu
          firstName={user.first_name}
          lastName={user.last_name}
          role={user.role}
          onLogout={handleLogout}
        />
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-surface p-4 sm:flex">
        {nav}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 sm:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 flex h-full w-72 flex-col border-r border-border bg-surface p-4 shadow-[var(--shadow-elevated)]">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-surface-hover"
              aria-label="Fermer le menu"
            >
              <X size={18} />
            </button>
            {nav}
          </aside>
        </div>
      )}

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-border bg-surface px-4 py-3 sm:px-8">
          <div className="flex items-center gap-2 sm:hidden">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
              M
            </span>
          </div>

          <div className="hidden flex-1 sm:block">
            <GlobalSearch />
          </div>
          <p className="flex-1 text-sm font-medium text-muted-foreground sm:hidden">
            {currentPage?.label ?? ""}
          </p>

          <div className="flex items-center gap-2">
            <Link
              href="/notifications"
              className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground"
              aria-label="Notifications"
            >
              <Bell size={16} />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-semibold text-white">
                  {unreadCount}
                </span>
              )}
            </Link>
            <ThemeToggle />
            <button
              onClick={toggleFullscreen}
              className="hidden h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground sm:flex"
              aria-label="Plein écran"
            >
              {fullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
            </button>
            <button
              onClick={() => setMobileOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-surface-hover sm:hidden"
              aria-label="Ouvrir le menu"
            >
              <Menu size={18} />
            </button>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-8">{children}</main>
      </div>
    </div>
  );
}
