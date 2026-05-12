/**
 * Color HSL determinístico por user_id. Distribuye los hues con el golden
 * ratio así dos mozos consecutivos quedan visualmente distantes.
 * Compartido entre el overlay de distribución y la vista de salón.
 */
export function mozoColor(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash * 31 + userId.charCodeAt(i)) | 0;
  }
  const golden = 0.618033988749895;
  const hue = Math.floor((((hash >>> 0) * golden) % 1) * 360);
  return `hsl(${hue}, 65%, 50%)`;
}

export function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0 || parts[0] === "") return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}
