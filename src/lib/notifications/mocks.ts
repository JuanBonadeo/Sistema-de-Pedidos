import type { Notification } from "@/lib/notifications/queries";

/**
 * Mocks para demo / desarrollo cuando todavía no hay notifications reales
 * en la DB. Usados como fallback en `useNotificationsRealtime` cuando el
 * snapshot del server viene vacío. En cuanto entra una real (vía realtime
 * o un refresh con data), los mocks desaparecen — el hook resetea al
 * snapshot del server.
 *
 * IDs con prefijo `mock-` para distinguir y evitar tocar la DB con ellos
 * (los handlers de click los skipean del markRead server-side).
 */

function isoMinutesAgo(minutes: number): string {
  return new Date(Date.now() - minutes * 60_000).toISOString();
}

const FAKE_BUSINESS = "00000000-0000-0000-0000-000000000000";

export const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: "mock-1",
    business_id: FAKE_BUSINESS,
    user_id: null,
    target_role: null,
    type: "order.pending",
    payload: {
      orderNumber: 1284,
      customerName: "Andrea G.",
      deliveryType: "delivery",
    },
    read_at: null,
    created_at: isoMinutesAgo(2),
  },
  {
    id: "mock-2",
    business_id: FAKE_BUSINESS,
    user_id: null,
    target_role: null,
    type: "mesa.transferred",
    payload: {
      tableLabel: "7",
      fromName: "Lucas",
      toName: "Camila",
    },
    read_at: null,
    created_at: isoMinutesAgo(4),
  },
  {
    id: "mock-3",
    business_id: FAKE_BUSINESS,
    user_id: null,
    target_role: null,
    type: "order.pending",
    payload: {
      orderNumber: 1283,
      customerName: "Familia Pérez",
      deliveryType: "take_away",
    },
    read_at: null,
    created_at: isoMinutesAgo(6),
  },
  {
    id: "mock-4",
    business_id: FAKE_BUSINESS,
    user_id: null,
    target_role: null,
    type: "mesa.cancelled",
    payload: { tableLabel: "12", reason: "Cliente se fue" },
    read_at: isoMinutesAgo(11),
    created_at: isoMinutesAgo(12),
  },
  {
    id: "mock-5",
    business_id: FAKE_BUSINESS,
    user_id: null,
    target_role: null,
    type: "mesa.transferred",
    payload: { tableLabel: "3", fromName: "Lucas", toName: "Tomás" },
    read_at: isoMinutesAgo(17),
    created_at: isoMinutesAgo(18),
  },
];

export function isMockNotificationId(id: string): boolean {
  return id.startsWith("mock-");
}
