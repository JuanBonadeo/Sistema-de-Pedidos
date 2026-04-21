import { NextResponse } from "next/server";

import { ensureAdminAccess } from "@/lib/admin/context";
import { DEFAULT_SYSTEM_PROMPT } from "@/lib/chatbot/agent";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { getBusiness } from "@/lib/tenant";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const businessSlug = url.searchParams.get("businessSlug");
  if (!businessSlug) {
    return NextResponse.json(
      { error: "businessSlug required" },
      { status: 400 },
    );
  }
  const business = await getBusiness(businessSlug);
  if (!business) {
    return NextResponse.json({ error: "business not found" }, { status: 404 });
  }
  await ensureAdminAccess(business.id, businessSlug);

  const service = createSupabaseServiceClient();
  const { data } = await service
    .from("chatbot_configs")
    .select("system_prompt")
    .eq("business_id", business.id)
    .maybeSingle();

  return NextResponse.json({
    systemPrompt: data?.system_prompt ?? "",
    defaultPrompt: DEFAULT_SYSTEM_PROMPT,
  });
}

export async function PUT(req: Request) {
  let body: { businessSlug?: string; systemPrompt?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  const { businessSlug, systemPrompt } = body;
  if (!businessSlug || typeof systemPrompt !== "string") {
    return NextResponse.json(
      { error: "businessSlug and systemPrompt required" },
      { status: 400 },
    );
  }
  const business = await getBusiness(businessSlug);
  if (!business) {
    return NextResponse.json({ error: "business not found" }, { status: 404 });
  }
  await ensureAdminAccess(business.id, businessSlug);

  const service = createSupabaseServiceClient();
  const { error } = await service.from("chatbot_configs").upsert({
    business_id: business.id,
    system_prompt: systemPrompt,
    updated_at: new Date().toISOString(),
  });
  if (error) {
    console.error("chatbot config upsert failed", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
