export function relativeTime(isoDate: string): string {
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const diffMin = Math.round(diffMs / 60000);
  if (diffMin < 1) return "à l'instant";
  if (diffMin < 60) return `il y a ${diffMin} min`;
  const diffH = Math.round(diffMin / 60);
  if (diffH < 24) return `il y a ${diffH}h`;
  const diffDays = Math.round(diffH / 24);
  if (diffDays < 30) return `il y a ${diffDays}j`;
  const diffMonths = Math.round(diffDays / 30);
  return `il y a ${diffMonths} mois`;
}

export function formatDateLong(date: Date): string {
  return date
    .toLocaleDateString("fr-FR", { weekday: "short", day: "2-digit", month: "short", year: "numeric" })
    .replace(/^\w/, (c) => c.toUpperCase());
}
