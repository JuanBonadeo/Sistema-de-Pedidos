"use client";

import { useEffect, useRef, useTransition } from "react";
import { Circle, RectangleHorizontal, Save, Square, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveFloorPlan } from "@/lib/admin/floor-plan/actions";
import type { FloorPlan, FloorTable, TableShape as TableShapeType } from "@/lib/reservations/types";

import { TableShape } from "./table-shape";
import { useFloorPlanStore } from "./use-floor-plan-store";

type Props = {
  businessSlug: string;
  plan: FloorPlan;
  tables: FloorTable[];
};

const GRID = 10;

function snap(v: number, free: boolean): number {
  if (free) return Math.round(v);
  return Math.round(v / GRID) * GRID;
}

export function FloorPlanEditor({ businessSlug, plan, tables }: Props) {
  const init = useFloorPlanStore((s) => s.init);
  const setName = useFloorPlanStore((s) => s.setName);
  const addTable = useFloorPlanStore((s) => s.addTable);
  const select = useFloorPlanStore((s) => s.select);
  const updateSelected = useFloorPlanStore((s) => s.updateSelected);
  const moveSelected = useFloorPlanStore((s) => s.moveSelected);
  const resizeSelected = useFloorPlanStore((s) => s.resizeSelected);
  const rotateSelected = useFloorPlanStore((s) => s.rotateSelected);
  const deleteSelected = useFloorPlanStore((s) => s.deleteSelected);
  const markClean = useFloorPlanStore((s) => s.markClean);

  const width = useFloorPlanStore((s) => s.width);
  const height = useFloorPlanStore((s) => s.height);
  const name = useFloorPlanStore((s) => s.name);
  const allTables = useFloorPlanStore((s) => s.tables);
  const selectedLocalId = useFloorPlanStore((s) => s.selectedLocalId);
  const dirty = useFloorPlanStore((s) => s.dirty);

  const [pending, startTransition] = useTransition();
  const svgRef = useRef<SVGSVGElement>(null);
  const dragRef = useRef<{
    mode: "move" | "resize" | "rotate";
    startX: number;
    startY: number;
    snapshot: { x: number; y: number; width: number; height: number; rotation: number };
  } | null>(null);

  useEffect(() => {
    init({ width: plan.width, height: plan.height, name: plan.name, tables });
  }, [init, plan.height, plan.name, plan.width, tables]);

  const selected = allTables.find((t) => t._localId === selectedLocalId) ?? null;

  function svgPointFromEvent(e: React.PointerEvent | PointerEvent): { x: number; y: number } {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    const sx = (e.clientX - rect.left) * (width / rect.width);
    const sy = (e.clientY - rect.top) * (height / rect.height);
    return { x: sx, y: sy };
  }

  function onTablePointerDown(localId: string) {
    return (e: React.PointerEvent<SVGGElement>) => {
      e.stopPropagation();
      select(localId);
      const t = useFloorPlanStore.getState().tables.find((x) => x._localId === localId);
      if (!t) return;
      const p = svgPointFromEvent(e);
      dragRef.current = {
        mode: "move",
        startX: p.x,
        startY: p.y,
        snapshot: { x: t.x, y: t.y, width: t.width, height: t.height, rotation: t.rotation },
      };
      (e.target as Element).setPointerCapture?.(e.pointerId);
    };
  }

  function onResizeHandlePointerDown(e: React.PointerEvent<SVGRectElement>) {
    e.stopPropagation();
    if (!selected) return;
    const p = svgPointFromEvent(e);
    dragRef.current = {
      mode: "resize",
      startX: p.x,
      startY: p.y,
      snapshot: {
        x: selected.x,
        y: selected.y,
        width: selected.width,
        height: selected.height,
        rotation: selected.rotation,
      },
    };
    (e.target as Element).setPointerCapture?.(e.pointerId);
  }

  function onRotateHandlePointerDown(e: React.PointerEvent<SVGCircleElement>) {
    e.stopPropagation();
    if (!selected) return;
    const p = svgPointFromEvent(e);
    dragRef.current = {
      mode: "rotate",
      startX: p.x,
      startY: p.y,
      snapshot: {
        x: selected.x,
        y: selected.y,
        width: selected.width,
        height: selected.height,
        rotation: selected.rotation,
      },
    };
    (e.target as Element).setPointerCapture?.(e.pointerId);
  }

  function onSvgPointerMove(e: React.PointerEvent<SVGSVGElement>) {
    if (!dragRef.current || !selected) return;
    const p = svgPointFromEvent(e);
    const dx = p.x - dragRef.current.startX;
    const dy = p.y - dragRef.current.startY;
    const free = e.shiftKey;

    if (dragRef.current.mode === "move") {
      const snap0 = dragRef.current.snapshot;
      const targetX = snap(snap0.x + dx, free);
      const targetY = snap(snap0.y + dy, free);
      moveSelected(targetX - selected.x, targetY - selected.y);
    } else if (dragRef.current.mode === "resize") {
      const snap0 = dragRef.current.snapshot;
      const newW = snap(Math.max(20, snap0.width + dx), free);
      const newH = snap(Math.max(20, snap0.height + dy), free);
      resizeSelected(newW, newH);
    } else {
      const snap0 = dragRef.current.snapshot;
      const cx = snap0.x + snap0.width / 2;
      const cy = snap0.y + snap0.height / 2;
      const angle = (Math.atan2(p.y - cy, p.x - cx) * 180) / Math.PI;
      // Handle is at "top" of the table; default angle for top is -90deg.
      const deg = angle + 90;
      rotateSelected(free ? deg : Math.round(deg / 15) * 15);
    }
  }

  function onSvgPointerUp() {
    dragRef.current = null;
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Delete" || e.key === "Backspace") {
        const target = e.target as HTMLElement | null;
        if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT")) return;
        if (selectedLocalId) {
          e.preventDefault();
          deleteSelected();
        }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedLocalId, deleteSelected]);

  function onSave() {
    startTransition(async () => {
      const result = await saveFloorPlan({
        business_slug: businessSlug,
        name,
        width,
        height,
        tables: allTables.map((t) => ({
          id: t.id,
          label: t.label,
          seats: t.seats,
          shape: t.shape,
          x: t.x,
          y: t.y,
          width: t.width,
          height: t.height,
          rotation: t.rotation,
          status: t.status,
        })),
      });
      if (result.ok) {
        toast.success("Plano guardado");
        markClean();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_300px]">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => addTable("circle")}
          >
            <Circle className="size-4" /> Mesa redonda
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => addTable("square")}
          >
            <Square className="size-4" /> Mesa cuadrada
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => addTable("rect")}
          >
            <RectangleHorizontal className="size-4" /> Mesa rectangular
          </Button>
          <div className="ms-auto flex items-center gap-2">
            {dirty ? <span className="text-xs text-muted-foreground">Cambios sin guardar</span> : null}
            <Button type="button" size="sm" onClick={onSave} disabled={pending || !dirty}>
              <Save className="size-4" /> Guardar
            </Button>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border bg-card">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${width} ${height}`}
            className="block aspect-[10/7] w-full bg-muted/20"
            onPointerMove={onSvgPointerMove}
            onPointerUp={onSvgPointerUp}
            onPointerLeave={onSvgPointerUp}
            onClick={(e) => {
              if (e.target === svgRef.current) select(null);
            }}
          >
            {/* grid */}
            <defs>
              <pattern id="fp-grid" width={GRID * 5} height={GRID * 5} patternUnits="userSpaceOnUse">
                <path
                  d={`M ${GRID * 5} 0 L 0 0 0 ${GRID * 5}`}
                  className="fill-none stroke-border/40"
                  strokeWidth={1}
                />
              </pattern>
            </defs>
            <rect width={width} height={height} fill="url(#fp-grid)" />

            {allTables.map((t) => (
              <TableShape
                key={t._localId}
                table={t}
                selected={t._localId === selectedLocalId}
                onPointerDown={onTablePointerDown(t._localId)}
              />
            ))}

            {selected ? <SelectionHandles
              table={selected}
              onResize={onResizeHandlePointerDown}
              onRotate={onRotateHandlePointerDown}
            /> : null}
          </svg>
        </div>
        <p className="text-xs text-muted-foreground">
          Tip: Shift mientras arrastrás desactiva el snap a grilla. Suprimir borra la mesa seleccionada.
        </p>
      </div>

      <aside className="space-y-3 rounded-lg border bg-card p-4">
        <div className="space-y-1.5">
          <Label htmlFor="fp-name">Nombre del plano</Label>
          <Input
            id="fp-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={60}
          />
        </div>

        {selected ? (
          <div className="space-y-3 border-t pt-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Mesa seleccionada</h3>
              <Button
                type="button"
                size="icon-xs"
                variant="ghost"
                onClick={() => deleteSelected()}
                aria-label="Eliminar mesa"
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fp-label">Nombre</Label>
              <Input
                id="fp-label"
                value={selected.label}
                onChange={(e) => updateSelected({ label: e.target.value })}
                maxLength={40}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label htmlFor="fp-seats">Comensales</Label>
                <Input
                  id="fp-seats"
                  type="number"
                  min={1}
                  max={50}
                  value={selected.seats}
                  onChange={(e) => updateSelected({ seats: Math.max(1, Number(e.target.value) || 1) })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="fp-shape">Forma</Label>
                <select
                  id="fp-shape"
                  className="h-8 w-full rounded-lg border bg-transparent px-2 text-sm"
                  value={selected.shape}
                  onChange={(e) => updateSelected({ shape: e.target.value as TableShapeType })}
                >
                  <option value="circle">Redonda</option>
                  <option value="square">Cuadrada</option>
                  <option value="rect">Rectangular</option>
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fp-status">Estado</Label>
              <select
                id="fp-status"
                className="h-8 w-full rounded-lg border bg-transparent px-2 text-sm"
                value={selected.status}
                onChange={(e) => updateSelected({ status: e.target.value as "active" | "disabled" })}
              >
                <option value="active">Activa</option>
                <option value="disabled">Deshabilitada</option>
              </select>
            </div>
            <p className="text-xs text-muted-foreground">
              Las mesas deshabilitadas no se ofrecen en el motor de reservas pero
              conservan el historial.
            </p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Seleccioná una mesa para editarla, o agregá una nueva con la barra superior.
          </p>
        )}
      </aside>
    </div>
  );
}

function SelectionHandles({
  table,
  onResize,
  onRotate,
}: {
  table: { x: number; y: number; width: number; height: number; rotation: number };
  onResize: (e: React.PointerEvent<SVGRectElement>) => void;
  onRotate: (e: React.PointerEvent<SVGCircleElement>) => void;
}) {
  const cx = table.width / 2;
  const cy = table.height / 2;
  const transform = `translate(${table.x} ${table.y}) rotate(${table.rotation} ${cx} ${cy})`;
  const handleSize = 12;
  return (
    <g transform={transform} style={{ touchAction: "none" }}>
      {/* resize bottom-right */}
      <rect
        x={table.width - handleSize / 2}
        y={table.height - handleSize / 2}
        width={handleSize}
        height={handleSize}
        className="fill-primary stroke-primary-foreground"
        strokeWidth={1.5}
        style={{ cursor: "nwse-resize" }}
        onPointerDown={onResize}
      />
      {/* rotation arm + handle */}
      <line
        x1={cx}
        y1={0}
        x2={cx}
        y2={-24}
        className="stroke-primary"
        strokeWidth={2}
      />
      <circle
        cx={cx}
        cy={-28}
        r={7}
        className="fill-primary stroke-primary-foreground"
        strokeWidth={1.5}
        style={{ cursor: "grab" }}
        onPointerDown={onRotate}
      />
    </g>
  );
}
