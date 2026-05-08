"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ExternalLink, RefreshCw } from "lucide-react";

import type { ActiveTurnoView, TurnoLiveStats } from "@/lib/caja/types";
import { formatCurrency } from "@/lib/currency";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Props = {
  slug: string;
  initialTurnos: ActiveTurnoView[];
};

export function CajaAdminBoard({ slug, initialTurnos }: Props) {
  const [turnos] = useState(initialTurnos);
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-base">Turnos abiertos ({turnos.length})</h3>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setRefreshKey((k) => k + 1)}
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Refrescar
          </Button>
          <Link href={`/${slug}/caja`}>
            <Button size="sm">
              <ExternalLink className="h-3.5 w-3.5 mr-1.5" /> Operar caja
            </Button>
          </Link>
        </div>
      </div>

      {turnos.length === 0 ? (
        <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
          No hay turnos abiertos. Se abren desde{" "}
          <Link href={`/${slug}/caja`} className="underline">/caja</Link>.
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {turnos.map((t) => (
            <TurnoStatsCard key={t.id} turno={t} refreshKey={refreshKey} />
          ))}
        </div>
      )}
    </div>
  );
}

function TurnoStatsCard({
  turno,
  refreshKey,
}: {
  turno: ActiveTurnoView;
  refreshKey: number;
}) {
  const [stats, setStats] = useState<TurnoLiveStats | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch(`/api/caja/stats?turno=${turno.id}`);
        const data = await res.json();
        if (!cancelled) setStats(data?.stats ?? null);
      } catch {
        // Silenciar errores de polling — no es crítico.
      }
    };
    load();
    const i = setInterval(load, 30_000);
    return () => {
      cancelled = true;
      clearInterval(i);
    };
  }, [turno.id, refreshKey]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-base">
          <span>{turno.caja_name}</span>
          <span className="text-xs font-normal text-muted-foreground">
            {turno.encargado_name ?? "—"}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <Stat label="Apertura" value={formatCurrency(turno.opening_cash_cents)} />
          <Stat label="Cobros" value={String(stats?.cobros_count ?? 0)} />
          <Stat
            label="Ventas"
            value={formatCurrency(stats?.total_ventas_cents ?? 0)}
          />
          <Stat
            label="Propinas"
            value={formatCurrency(stats?.total_propinas_cents ?? 0)}
          />
          <div className="col-span-2 pt-2 border-t">
            <Stat
              label="Efectivo esperado"
              value={formatCurrency(stats?.expected_cash_cents ?? turno.opening_cash_cents)}
              big
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Stat({ label, value, big }: { label: string; value: string; big?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={big ? "font-semibold" : "font-medium"}>{value}</span>
    </div>
  );
}
