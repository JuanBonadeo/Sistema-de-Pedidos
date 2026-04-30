"use client";

import { memo } from "react";

import { cn } from "@/lib/utils";

import type { EditorTable } from "./use-floor-plan-store";

type Props = {
  table: EditorTable;
  selected: boolean;
  disabled?: boolean;
  onPointerDown?: (e: React.PointerEvent<SVGGElement>) => void;
};

/**
 * Renders a single table on the SVG plan. The shape primitive is centered at
 * (width/2, height/2) and rotated around that center, so dragging only moves
 * (x,y) — the rotation handle works the same regardless of orientation.
 */
function TableShapeImpl({ table, selected, disabled, onPointerDown }: Props) {
  const cx = table.width / 2;
  const cy = table.height / 2;
  const transform = `translate(${table.x} ${table.y}) rotate(${table.rotation} ${cx} ${cy})`;
  const isInactive = table.status === "disabled";

  return (
    <g
      transform={transform}
      onPointerDown={onPointerDown}
      style={{ cursor: disabled ? "default" : "move", touchAction: "none" }}
      data-selected={selected ? "" : undefined}
    >
      {table.shape === "circle" ? (
        <ellipse
          cx={cx}
          cy={cy}
          rx={table.width / 2}
          ry={table.height / 2}
          className={cn(
            "fill-card stroke-2",
            selected ? "stroke-primary" : "stroke-border",
            isInactive && "fill-muted opacity-60",
          )}
        />
      ) : (
        <rect
          x={0}
          y={0}
          width={table.width}
          height={table.height}
          rx={table.shape === "rect" ? 8 : 4}
          className={cn(
            "fill-card stroke-2",
            selected ? "stroke-primary" : "stroke-border",
            isInactive && "fill-muted opacity-60",
          )}
        />
      )}
      <text
        x={cx}
        y={cy - 4}
        textAnchor="middle"
        className="pointer-events-none fill-foreground text-[14px] font-medium"
        style={{ userSelect: "none" }}
      >
        {table.label}
      </text>
      <text
        x={cx}
        y={cy + 12}
        textAnchor="middle"
        className="pointer-events-none fill-muted-foreground text-[11px]"
        style={{ userSelect: "none" }}
      >
        {table.seats}p
      </text>
    </g>
  );
}

export const TableShape = memo(TableShapeImpl);
