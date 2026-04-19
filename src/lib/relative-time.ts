/**
 * Human-friendly relative date in Spanish. Used in customer-facing lists.
 *
 *   < 1 min    → "Ahora"
 *   < 1 hora   → "Hace 15 min"
 *   mismo día  → "Hace 3 h"
 *   ayer       → "Ayer"
 *   < 7 días   → "Hace 3 días"
 *   resto      → "12 de marzo" / "12 mar 2024" si cambia de año
 */
export function formatRelativeEs(iso: string, now = new Date()): string {
  const d = new Date(iso);
  const diffMs = now.getTime() - d.getTime();
  const mins = Math.floor(diffMs / 60_000);
  const hours = Math.floor(diffMs / 3_600_000);

  if (mins < 1) return "Ahora";
  if (mins < 60) return `Hace ${mins} min`;

  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  if (sameDay) return `Hace ${hours} h`;

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    d.getFullYear() === yesterday.getFullYear() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getDate() === yesterday.getDate();
  if (isYesterday) return "Ayer";

  const days = Math.floor(diffMs / 86_400_000);
  if (days < 7) return `Hace ${days} días`;

  const sameYear = d.getFullYear() === now.getFullYear();
  return sameYear
    ? new Intl.DateTimeFormat("es-AR", {
        day: "numeric",
        month: "long",
      }).format(d)
    : new Intl.DateTimeFormat("es-AR", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(d);
}
