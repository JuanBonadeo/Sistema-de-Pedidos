/**
 * Channel abstraction — how a campaign message is delivered.
 *
 * Today: only "manual" (the owner clicks wa.me links from the campaign detail
 * and sends each message from their personal WhatsApp).
 *
 * Future: "waba" — the dispatcher iterates campaign_messages and sends each
 * via Meta WhatsApp Cloud API. The interface stays identical.
 */

import type { CampaignChannel, CampaignMessage } from "./types";

export type DispatchResult =
  | { ok: true; sent_at: string }
  | { ok: false; error: string };

export type Channel = {
  /** Human label for UI */
  label: string;
  /** Whether this channel can actually send (false = stub / coming-soon) */
  available: boolean;
  /**
   * For "manual" this is a no-op (returns ok immediately) since the owner
   * sends from their phone and marks each message as sent manually via the UI.
   * For "waba" this would call Meta API + parse the response.
   */
  dispatch(message: CampaignMessage): Promise<DispatchResult>;
};

export const manualChannel: Channel = {
  label: "Mi WhatsApp (manual)",
  available: true,
  async dispatch() {
    // The "manual" channel doesn't actually deliver — it just marks ready.
    // The owner does the actual sending via wa.me deep links and clicks
    // "Marcar enviado" in the UI which updates campaign_messages.status.
    return { ok: true, sent_at: new Date().toISOString() };
  },
};

/**
 * WABA stub — refuses to send until the Meta integration is wired up. This
 * exists so the rest of the system (admin UI selection, dispatcher loop,
 * channel-aware messaging) can be built and tested before the cuenta de Meta
 * está activa. When that happens, replace `dispatch` with a real fetch to
 * Meta's `/{phone-id}/messages` endpoint.
 */
export const wabaChannel: Channel = {
  label: "WhatsApp Business API",
  available: false,
  async dispatch() {
    return {
      ok: false,
      error: "WABA todavía no está conectado. Conectá tu cuenta de Meta Business primero.",
    };
  },
};

export function getChannel(name: CampaignChannel): Channel {
  return name === "manual" ? manualChannel : wabaChannel;
}
