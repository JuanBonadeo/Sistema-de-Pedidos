import { toZonedTime } from "date-fns-tz";

/**
 * Día de la semana (0=domingo, 6=sábado) en el timezone del negocio.
 *
 * Ojo: `date-fns-tz` v3 devuelve un `Date` cuyos **métodos UTC**
 * (`getUTCDay`, `getUTCHours`, ...) expresan la hora local del TZ pedido.
 * Los métodos locales (`getDay`, `getHours`) leen el TZ del runtime, así que
 * darían lectura incorrecta en cualquier máquina que no esté en UTC.
 *
 * Ver también: el comentario en
 * `src/lib/chatbot/agent.ts` (tool `check_business_status`) donde tuvimos el
 * mismo tropezón en Windows (UTC-3 local).
 */
export function currentDayOfWeek(timezone: string, now: Date = new Date()): number {
  return toZonedTime(now, timezone).getUTCDay();
}

/**
 * Nombre largo del día de la semana en español, con primera mayúscula.
 * Útil para mostrar "Hoy — Lunes" en el header del menú del día.
 */
const DAY_NAMES_ES = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

export function dayOfWeekName(dow: number): string {
  return DAY_NAMES_ES[dow] ?? "";
}
