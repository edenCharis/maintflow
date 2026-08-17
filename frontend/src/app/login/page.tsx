"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { ApiError } from "@/lib/api";
import { ThemeToggle } from "@/components/ThemeToggle";
import { CheckCircle2, Lock, Mail, Wrench } from "lucide-react";

const FEATURES = [
  "Équipements, OT et techniciens centralisés",
  "QR code sur chaque équipement",
  "Historique complet et indicateurs en temps réel",
];

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      router.push("/dashboard");
    } catch (err) {
      if (err instanceof ApiError) {
        setError("Email ou mot de passe incorrect.");
      } else {
        setError("Impossible de se connecter. Vérifiez votre connexion.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid min-h-screen flex-1 lg:grid-cols-2">
      {/* Brand panel — deliberately dark regardless of site theme */}
      <div className="relative hidden overflow-hidden bg-[oklch(0.14_0.02_270)] p-12 lg:flex lg:flex-col lg:justify-between">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(circle at 15% 20%, oklch(0.4 0.14 280 / 0.55), transparent 55%), radial-gradient(circle at 85% 75%, oklch(0.45 0.16 300 / 0.4), transparent 50%), radial-gradient(circle at 50% 100%, oklch(0.3 0.1 250 / 0.5), transparent 60%)",
          }}
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(oklch(1 0 0) 1px, transparent 1px), linear-gradient(90deg, oklch(1 0 0) 1px, transparent 1px)",
            backgroundSize: "44px 44px",
          }}
        />

        <div className="relative flex items-center gap-2 text-white">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 backdrop-blur">
            <Wrench size={18} />
          </span>
          <span className="text-lg font-semibold tracking-tight">MaintFlow</span>
        </div>

        <div className="relative max-w-md space-y-8">
          <h1 className="text-4xl font-semibold leading-tight text-white">
            Digitalisez votre maintenance, réduisez les arrêts.
          </h1>
          <ul className="space-y-3">
            {FEATURES.map((feature) => (
              <li key={feature} className="flex items-start gap-3 text-sm text-white/75">
                <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-white/90" />
                {feature}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-white/40">MaintFlow by DigiTech</p>
      </div>

      {/* Form panel */}
      <div className="relative flex flex-1 items-center justify-center px-4 py-16">
        <div className="absolute right-6 top-6">
          <ThemeToggle />
        </div>

        <div className="w-full max-w-sm space-y-8">
          <div className="space-y-1 lg:hidden">
            <div className="mb-4 flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-soft text-primary-soft-foreground">
                <Wrench size={18} />
              </span>
              <span className="text-lg font-semibold tracking-tight">MaintFlow</span>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">Bon retour</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Connectez-vous pour accéder à votre espace de maintenance.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-sm font-medium text-foreground">
                Email
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-border bg-surface py-2.5 pl-10 pr-3 text-sm text-foreground outline-none transition-shadow placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-[var(--ring)]"
                  placeholder="vous@entreprise.cg"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="text-sm font-medium text-foreground">
                Mot de passe
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-border bg-surface py-2.5 pl-10 pr-3 text-sm text-foreground outline-none transition-shadow placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-[var(--ring)]"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger-soft-foreground">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-soft)] transition-colors hover:bg-primary-hover disabled:opacity-60"
            >
              {submitting ? "Connexion..." : "Se connecter"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
