"use client";

import { Fragment, useState } from "react";

import { formatCurrency } from "@/lib/currency";
import { cn } from "@/lib/utils";

type Cell = {
  dow: number;
  hour: number;
  orderCount: number;
  revenueCents: number;
};

const DAY_LABELS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const DAY_LONG = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];
const HOURS = Array.from({ length: 13 }, (_, i) => i + 10); // 10 to 22

export function HourlyHeatmap({
  cells,
  maxCount,
  totalOrders,
  rangeDays,
}: {
  cells: Cell[];
  maxCount: number;
  totalOrders: number;
  rangeDays: number;
}) {
  const [hovered, setHovered] = useState<Cell | null>(null);

  const cellMap = new Map<string, Cell>();
  for (const c of cells) cellMap.set(`${c.dow}-${c.hour}`, c);

  const cap = Math.max(1, maxCount);

  return (
    <div className="rounded-2xl bg-white p-6 ring-1 ring-zinc-200/70">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-zinc-500">
            Horas pico · últimos {rangeDays} días
          </p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight text-zinc-900">
            Cuándo te piden
          </h2>
          <p className="mt-0.5 text-xs text-zinc-500 tabular-nums">
            {totalOrders.toLocaleString("es-AR")} pedidos analizados
          </p>
        </div>
        <div className="flex items-center gap-2 text-[0.65rem] font-medium text-zinc-500">
          <span>Menos</span>
          <div className="flex gap-0.5">
            {[0.05, 0.2, 0.4, 0.6, 0.85].map((opacity) => (
              <span
                key={opacity}
                className="size-3 rounded-sm"
                style={{
                  background: `rgba(16, 185, 129, ${opacity})`,
                }}
              />
            ))}
          </div>
          <span>Más</span>
        </div>
      </div>

      <div className="mt-6 overflow-x-auto">
        <div className="min-w-[480px]">
          <div className="grid grid-cols-[36px_repeat(7,minmax(0,1fr))] gap-1">
            <div />
            {DAY_LABELS.map((label, i) => (
              <div
                key={i}
                className="text-center text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-zinc-500"
              >
                {label}
              </div>
            ))}

            {HOURS.map((hour) => (
              <Fragment key={`row-${hour}`}>
                <div className="flex items-center justify-end pr-1 text-[0.65rem] font-medium tabular-nums text-zinc-400">
                  {hour.toString().padStart(2, "0")}h
                </div>
                {DAY_LABELS.map((_, dow) => {
                  const cell =
                    cellMap.get(`${dow}-${hour}`) ?? {
                      dow,
                      hour,
                      orderCount: 0,
                      revenueCents: 0,
                    };
                  const intensity =
                    cell.orderCount === 0 ? 0 : 0.1 + (cell.orderCount / cap) * 0.85;
                  const isHovered =
                    hovered?.dow === dow && hovered?.hour === hour;
                  return (
                    <button
                      key={`${dow}-${hour}`}
                      type="button"
                      onMouseEnter={() => setHovered(cell)}
                      onMouseLeave={() => setHovered(null)}
                      onFocus={() => setHovered(cell)}
                      onBlur={() => setHovered(null)}
                      className={cn(
                        "h-7 rounded-md transition",
                        isHovered && "ring-2 ring-zinc-900",
                        cell.orderCount === 0 && "bg-zinc-100",
                      )}
                      style={
                        cell.orderCount === 0
                          ? undefined
                          : {
                              background: `rgba(16, 185, 129, ${intensity})`,
                            }
                      }
                      aria-label={`${DAY_LONG[dow]} ${hour}:00 — ${cell.orderCount} pedidos`}
                    />
                  );
                })}
              </Fragment>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 flex min-h-[44px] items-center justify-between rounded-xl bg-zinc-50 px-4 py-2.5 text-xs">
        {hovered ? (
          <>
            <div className="font-medium text-zinc-900">
              {DAY_LONG[hovered.dow]} ·{" "}
              <span className="tabular-nums">
                {hovered.hour.toString().padStart(2, "0")}:00
              </span>
            </div>
            <div className="flex items-center gap-3 text-zinc-600">
              <span className="tabular-nums">
                <span className="font-semibold text-zinc-900">
                  {hovered.orderCount}
                </span>{" "}
                {hovered.orderCount === 1 ? "pedido" : "pedidos"}
              </span>
              <span className="text-zinc-300">·</span>
              <span className="tabular-nums font-semibold text-zinc-900">
                {formatCurrency(hovered.revenueCents)}
              </span>
            </div>
          </>
        ) : (
          <span className="text-zinc-500">
            Pasá el mouse sobre una celda para ver el detalle.
          </span>
        )}
      </div>
    </div>
  );
}
