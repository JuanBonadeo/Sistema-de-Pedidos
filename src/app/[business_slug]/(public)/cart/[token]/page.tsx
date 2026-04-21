import { notFound } from "next/navigation";

import { CartHandoff } from "./cart-handoff";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { getBusiness } from "@/lib/tenant";

type CartModifier = {
  modifier_id: string;
  group_id: string;
  name: string;
  price_delta_cents: number;
};

type CartItem = {
  id: string;
  product_id: string;
  product_name: string;
  unit_price_cents: number;
  quantity: number;
  notes?: string;
  image_url?: string | null;
  modifiers: CartModifier[];
};

export default async function BotCartPage({
  params,
}: {
  params: Promise<{ business_slug: string; token: string }>;
}) {
  const { business_slug, token } = await params;

  const business = await getBusiness(business_slug);
  if (!business) notFound();

  const service = createSupabaseServiceClient();
  const { data: conv } = await service
    .from("chatbot_conversations")
    .select("id, cart_state, closed_at, business_id")
    .eq("cart_token", token)
    .maybeSingle();

  if (!conv || conv.business_id !== business.id || conv.closed_at) {
    notFound();
  }

  const raw = conv.cart_state as { items?: unknown } | null;
  const items = Array.isArray(raw?.items) ? (raw!.items as CartItem[]) : [];
  if (items.length === 0) notFound();

  return <CartHandoff slug={business_slug} items={items} />;
}
