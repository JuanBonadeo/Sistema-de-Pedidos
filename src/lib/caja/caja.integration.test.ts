// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const dbAvailable = Boolean(supabaseUrl && serviceKey);

const TEST_TAG = `test-caja-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;

let CURRENT_USER_ID = "";

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: async () => ({
    auth: {
      getUser: async () => ({
        data: { user: { id: CURRENT_USER_ID } },
        error: null,
      }),
    },
  }),
}));

vi.mock("react", async () => {
  const actual = await vi.importActual<typeof import("react")>("react");
  return { ...actual, cache: <T>(fn: T) => fn };
});

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

const {
  abrirTurno,
  cerrarTurno,
  registrarSangria,
  registrarIngreso,
  distribuirSalon,
} = await import("./actions");
const { getTurnoLiveStats } = await import("./queries");

describe.skipIf(!dbAvailable)("caja (integration)", () => {
  const supabase = createClient(supabaseUrl!, serviceKey!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  let businessId: string;
  let businessSlug: string;
  let cajaA: string;
  let cajaB: string;
  let encargadoId: string;
  let mozoAId: string;
  let adminId: string;
  let table1: string;
  let table2: string;

  const seedUser = async (label: string) => {
    const email = `${TEST_TAG}-${label}@example.test`;
    const { data: created } = await supabase.auth.admin.createUser({
      email,
      password: "test-pass-12345",
      email_confirm: true,
    });
    const id = created!.user!.id;
    await supabase.from("users").upsert({ id, email, full_name: label });
    return id;
  };

  beforeAll(async () => {
    encargadoId = await seedUser("Encargado");
    mozoAId = await seedUser("MozoA");
    adminId = await seedUser("Admin");

    const { data: biz } = await supabase
      .from("businesses")
      .insert({ slug: TEST_TAG, name: "Caja Test", is_active: true })
      .select("id, slug")
      .single();
    businessId = biz!.id;
    businessSlug = biz!.slug;

    await supabase.from("business_users").insert([
      { business_id: businessId, user_id: encargadoId, role: "encargado", full_name: "Encargado" },
      { business_id: businessId, user_id: mozoAId, role: "mozo", full_name: "MozoA" },
      { business_id: businessId, user_id: adminId, role: "admin", full_name: "Admin" },
    ]);

    const { data: cA } = await supabase
      .from("cajas")
      .insert({ business_id: businessId, name: "Salón" })
      .select("id")
      .single();
    cajaA = cA!.id;
    const { data: cB } = await supabase
      .from("cajas")
      .insert({ business_id: businessId, name: "Barra" })
      .select("id")
      .single();
    cajaB = cB!.id;

    const { data: fp } = await supabase
      .from("floor_plans")
      .insert({ business_id: businessId, name: "S1" })
      .select("id")
      .single();
    const { data: t1 } = await supabase
      .from("tables")
      .insert({
        floor_plan_id: fp!.id,
        label: "1",
        seats: 2,
        shape: "circle",
        x: 0, y: 0, width: 80, height: 80,
      })
      .select("id")
      .single();
    table1 = t1!.id;
    const { data: t2 } = await supabase
      .from("tables")
      .insert({
        floor_plan_id: fp!.id,
        label: "2",
        seats: 4,
        shape: "circle",
        x: 0, y: 0, width: 80, height: 80,
      })
      .select("id")
      .single();
    table2 = t2!.id;
  });

  afterAll(async () => {
    if (businessId) {
      await supabase.from("businesses").delete().eq("id", businessId);
    }
    for (const id of [encargadoId, mozoAId, adminId].filter(Boolean)) {
      await supabase.from("users").delete().eq("id", id);
      await supabase.auth.admin.deleteUser(id);
    }
  });

  it("encargado abre turno → fila open + movimiento apertura", async () => {
    CURRENT_USER_ID = encargadoId;
    const r = await abrirTurno(cajaA, 100_000, businessSlug);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.turno.status).toBe("open");

    const { data: mov } = await supabase
      .from("caja_movimientos")
      .select("kind, amount_cents")
      .eq("caja_turno_id", r.data.turno.id);
    expect(mov).toHaveLength(1);
    expect(mov![0].kind).toBe("apertura");
    expect(mov![0].amount_cents).toBe(100_000);
  });

  it("2do turno en misma caja con uno open → falla", async () => {
    CURRENT_USER_ID = encargadoId;
    const r = await abrirTurno(cajaA, 50_000, businessSlug);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/turno abierto/i);
  });

  it("encargado abre 2do turno en otra caja en paralelo → ok", async () => {
    CURRENT_USER_ID = encargadoId;
    const r = await abrirTurno(cajaB, 50_000, businessSlug);
    expect(r.ok).toBe(true);
  });

  it("sangría requiere motivo", async () => {
    CURRENT_USER_ID = encargadoId;
    const { data: turnoA } = await supabase
      .from("caja_turnos")
      .select("id")
      .eq("caja_id", cajaA)
      .eq("status", "open")
      .single();
    const empty = await registrarSangria(turnoA!.id, 5_000, "", businessSlug);
    expect(empty.ok).toBe(false);
    const ok = await registrarSangria(turnoA!.id, 5_000, "depósito en banco", businessSlug);
    expect(ok.ok).toBe(true);
  });

  it("mozo no puede abrir turno", async () => {
    CURRENT_USER_ID = mozoAId;
    const r = await abrirTurno(cajaA, 100_000, businessSlug);
    expect(r.ok).toBe(false);
  });

  it("ingreso suma a expected_cash; sangría resta", async () => {
    CURRENT_USER_ID = encargadoId;
    const { data: turnoA } = await supabase
      .from("caja_turnos")
      .select("id, opening_cash_cents")
      .eq("caja_id", cajaA)
      .eq("status", "open")
      .single();

    await registrarIngreso(turnoA!.id, 20_000, "fondo extra", businessSlug);

    const stats = await getTurnoLiveStats(turnoA!.id, businessId);
    expect(stats).not.toBeNull();
    // opening 100_000 + ingreso 20_000 − sangría 5_000 (de test anterior) = 115_000.
    expect(stats!.expected_cash_cents).toBe(100_000 + 20_000 - 5_000);
  });

  it("cerrar con diferencia sin notes → falla; con notes → ok", async () => {
    CURRENT_USER_ID = encargadoId;
    const { data: turnoB } = await supabase
      .from("caja_turnos")
      .select("id")
      .eq("caja_id", cajaB)
      .eq("status", "open")
      .single();

    const noNotes = await cerrarTurno(turnoB!.id, 60_000, null, businessSlug);
    expect(noNotes.ok).toBe(false);
    if (!noNotes.ok) expect(noNotes.error).toMatch(/diferencia/i);

    const withNotes = await cerrarTurno(
      turnoB!.id,
      60_000,
      "sobrante por vuelto",
      businessSlug,
    );
    expect(withNotes.ok).toBe(true);
    if (!withNotes.ok) return;
    expect(withNotes.data.turno.status).toBe("closed");
    expect(withNotes.data.turno.difference_cents).toBe(60_000 - 50_000);
  });

  it("cerrar con diferencia $10000 como encargado → falla por permiso", async () => {
    CURRENT_USER_ID = encargadoId;
    const { data: cC } = await supabase
      .from("cajas")
      .insert({ business_id: businessId, name: "Caja3" })
      .select("id")
      .single();

    const open = await abrirTurno(cC!.id, 100_000, businessSlug);
    expect(open.ok).toBe(true);
    if (!open.ok) return;

    // Diferencia de 1.000.000 cents = $10.000 supera el límite del encargado.
    const r = await cerrarTurno(
      open.data.turno.id,
      100_000 + 1_000_000,
      "sobrante grande",
      businessSlug,
    );
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/excede/i);

    // Como admin sí puede.
    CURRENT_USER_ID = adminId;
    const r2 = await cerrarTurno(
      open.data.turno.id,
      100_000 + 1_000_000,
      "sobrante grande",
      businessSlug,
    );
    expect(r2.ok).toBe(true);
  });

  it("distribuirSalon: aplica múltiples assignments en una llamada", async () => {
    CURRENT_USER_ID = encargadoId;
    const r = await distribuirSalon({
      assignments: [
        { tableId: table1, mozoId: mozoAId },
        { tableId: table2, mozoId: mozoAId },
      ],
      slug: businessSlug,
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.count).toBe(2);

    const { data: rows } = await supabase
      .from("tables")
      .select("id, mozo_id")
      .in("id", [table1, table2]);
    for (const row of rows!) {
      expect(row.mozo_id).toBe(mozoAId);
    }
  });
});
