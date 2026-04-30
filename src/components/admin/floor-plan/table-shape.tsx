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
 * Renders a single table on the SVG plan with chairs distributed around it.
 *
 * The shape primitive is centered at (width/2, height/2) and rotated around
 * that center, so dragging only moves (x,y) — the rotation handle works the
 * same regardless of orientation. Chairs are drawn as small rounded rects
 * hugging each side of the table; the count per side is derived from `seats`
 * to look natural for circular vs rectangular tables.
 */
function TableShapeImpl({ table, selected, disabled, onPointerDown }: Props) {
  const cx = table.width / 2;
  const cy = table.height / 2;
  const transform = `translate(${table.x} ${table.y}) rotate(${table.rotation} ${cx} ${cy})`;
  const isInactive = table.status === "disabled";

  const chairs = computeChairs(table.shape, table.width, table.height, table.seats);

  return (
    <g
      transform={transform}
      onPointerDown={onPointerDown}
      style={{ cursor: disabled ? "default" : "move", touchAction: "none" }}
      data-selected={selected ? "" : undefined}
    >
      {/* chairs go behind the table top */}
      {chairs.map((c, i) => (
        <Chair
          key={i}
          chair={c}
          inactive={isInactive}
          selected={selected}
        />
      ))}

      {/* table top */}
      {table.shape === "circle" ? (
        <>
          <ellipse
            cx={cx}
            cy={cy}
            rx={table.width / 2}
            ry={table.height / 2}
            className={cn(
              "stroke-[1.5]",
              selected ? "stroke-primary" : "stroke-foreground/30",
              isInactive ? "fill-muted opacity-60" : "fill-card",
            )}
            style={{ filter: "drop-shadow(0 2px 3px rgb(0 0 0 / 0.08))" }}
          />
          {/* inner subtle ring for depth */}
          <ellipse
            cx={cx}
            cy={cy}
            rx={table.width / 2 - 4}
            ry={table.height / 2 - 4}
            className="pointer-events-none fill-none stroke-foreground/8"
            strokeWidth={1}
          />
        </>
      ) : (
        <>
          <rect
            x={0}
            y={0}
            width={table.width}
            height={table.height}
            rx={table.shape === "rect" ? 10 : 6}
            className={cn(
              "stroke-[1.5]",
              selected ? "stroke-primary" : "stroke-foreground/30",
              isInactive ? "fill-muted opacity-60" : "fill-card",
            )}
            style={{ filter: "drop-shadow(0 2px 3px rgb(0 0 0 / 0.08))" }}
          />
          <rect
            x={4}
            y={4}
            width={Math.max(0, table.width - 8)}
            height={Math.max(0, table.height - 8)}
            rx={table.shape === "rect" ? 7 : 4}
            className="pointer-events-none fill-none stroke-foreground/8"
            strokeWidth={1}
          />
        </>
      )}

      {/* labels */}
      <text
        x={cx}
        y={cy - 3}
        textAnchor="middle"
        className="pointer-events-none fill-foreground text-[14px] font-semibold"
        style={{ userSelect: "none" }}
      >
        {table.label}
      </text>
      <g transform={`translate(${cx} ${cy + 12})`}>
        <SeatBadge seats={table.seats} />
      </g>
    </g>
  );
}

export const TableShape = memo(TableShapeImpl);

// ─────────────────────────────────────────────────────────────────────────────

type ChairSpec = {
  cx: number;
  cy: number;
  angleDeg: number; // direction the chair "faces" (toward the table center)
};

const CHAIR_SIZE = 14; // width of the chair seat (perpendicular to facing)
const CHAIR_DEPTH = 12; // how far the chair sticks out from the table edge
const CHAIR_GAP = 4; // gap between table edge and chair back

/**
 * Distribute chairs around a table. For rectangles we put chairs on the long
 * sides first, then the short sides; for circles/squares we space them around
 * the perimeter.
 */
function computeChairs(
  shape: "circle" | "square" | "rect",
  w: number,
  h: number,
  seats: number,
): ChairSpec[] {
  if (seats <= 0) return [];

  if (shape === "circle") {
    const chairs: ChairSpec[] = [];
    const rx = w / 2;
    const ry = h / 2;
    const cx = w / 2;
    const cy = h / 2;
    for (let i = 0; i < seats; i++) {
      // start at the top (-pi/2) and go clockwise so seat 1 is "head of table"
      const t = -Math.PI / 2 + (i * 2 * Math.PI) / seats;
      const dist = CHAIR_GAP + CHAIR_DEPTH / 2;
      const x = cx + (rx + dist) * Math.cos(t);
      const y = cy + (ry + dist) * Math.sin(t);
      chairs.push({
        cx: x,
        cy: y,
        angleDeg: (t * 180) / Math.PI + 90, // chair faces table center
      });
    }
    return chairs;
  }

  // Rectangle / square: distribute along the four sides.
  // Compute how many chairs per side based on side lengths and seat budget.
  const isSquare = shape === "square";
  const longSide = Math.max(w, h);
  const shortSide = Math.min(w, h);
  const hIsLong = w >= h;

  // Capacity per side based on min spacing.
  const minSpacing = CHAIR_SIZE + 6;
  const capLong = Math.max(1, Math.floor(longSide / minSpacing));
  const capShort = Math.max(1, Math.floor(shortSide / minSpacing));

  let topCount: number;
  let bottomCount: number;
  let leftCount: number;
  let rightCount: number;

  if (isSquare) {
    // distribute as evenly as possible
    const per = Math.floor(seats / 4);
    const rem = seats - per * 4;
    topCount = per + (rem > 0 ? 1 : 0);
    rightCount = per + (rem > 1 ? 1 : 0);
    bottomCount = per + (rem > 2 ? 1 : 0);
    leftCount = per;
    topCount = Math.min(topCount, capLong);
    bottomCount = Math.min(bottomCount, capLong);
    leftCount = Math.min(leftCount, capShort);
    rightCount = Math.min(rightCount, capShort);
  } else {
    // Rectangle: prefer long sides
    let remaining = seats;
    const longCap = capLong * 2;
    const shortCap = capShort * 2;

    let longTotal = Math.min(remaining, longCap);
    // ensure short sides get some seats only when long sides are reasonably full
    const idealLongMin = Math.min(longCap, Math.max(2, Math.ceil(seats * 0.7)));
    longTotal = Math.max(longTotal, Math.min(longCap, Math.min(remaining, idealLongMin)));
    longTotal = Math.min(longTotal, longCap, remaining);

    const long1 = Math.ceil(longTotal / 2);
    const long2 = longTotal - long1;
    remaining -= longTotal;

    const shortTotal = Math.min(remaining, shortCap);
    const short1 = Math.ceil(shortTotal / 2);
    const short2 = shortTotal - short1;

    if (hIsLong) {
      topCount = long1;
      bottomCount = long2;
      leftCount = short1;
      rightCount = short2;
    } else {
      leftCount = long1;
      rightCount = long2;
      topCount = short1;
      bottomCount = short2;
    }
  }

  const chairs: ChairSpec[] = [];
  // Top side: chairs face down (angle 90), arranged left-to-right
  for (let i = 0; i < topCount; i++) {
    const x = ((i + 1) * w) / (topCount + 1);
    chairs.push({ cx: x, cy: -(CHAIR_GAP + CHAIR_DEPTH / 2), angleDeg: 90 });
  }
  // Bottom side: chairs face up (angle -90 / 270)
  for (let i = 0; i < bottomCount; i++) {
    const x = ((i + 1) * w) / (bottomCount + 1);
    chairs.push({ cx: x, cy: h + CHAIR_GAP + CHAIR_DEPTH / 2, angleDeg: 270 });
  }
  // Left side: chairs face right (angle 0)
  for (let i = 0; i < leftCount; i++) {
    const y = ((i + 1) * h) / (leftCount + 1);
    chairs.push({ cx: -(CHAIR_GAP + CHAIR_DEPTH / 2), cy: y, angleDeg: 0 });
  }
  // Right side: chairs face left (angle 180)
  for (let i = 0; i < rightCount; i++) {
    const y = ((i + 1) * h) / (rightCount + 1);
    chairs.push({ cx: w + CHAIR_GAP + CHAIR_DEPTH / 2, cy: y, angleDeg: 180 });
  }

  return chairs;
}

function Chair({
  chair,
  inactive,
  selected,
}: {
  chair: ChairSpec;
  inactive: boolean;
  selected: boolean;
}) {
  // Draw the chair centered at origin, then translate+rotate.
  // Chair = small rounded rect (seat) with a thin "back" strip on the far side
  // from the table. The chair "faces" +x (so its back is on -x). We rotate so
  // that +x points toward the table center via angleDeg.
  const w = CHAIR_DEPTH; // along facing axis
  const h = CHAIR_SIZE; // perpendicular

  const transform = `translate(${chair.cx} ${chair.cy}) rotate(${chair.angleDeg})`;

  return (
    <g transform={transform} className="pointer-events-none">
      {/* seat */}
      <rect
        x={-w / 2}
        y={-h / 2}
        width={w}
        height={h}
        rx={3}
        className={cn(
          "stroke-[1]",
          selected ? "stroke-primary/70" : "stroke-foreground/25",
          inactive ? "fill-muted opacity-60" : "fill-card",
        )}
      />
      {/* back rest (on the side away from the table) */}
      <rect
        x={-w / 2}
        y={-h / 2 - 1}
        width={3}
        height={h + 2}
        rx={1.5}
        className={cn(
          selected ? "fill-primary/70" : "fill-foreground/30",
          inactive && "opacity-50",
        )}
      />
    </g>
  );
}

function SeatBadge({ seats }: { seats: number }) {
  // Tiny pill: person glyph + seat count
  const text = `${seats}`;
  const padX = 5;
  const charW = 6.5;
  const iconW = 8;
  const w = padX * 2 + iconW + 3 + text.length * charW;
  const h = 14;
  return (
    <g transform={`translate(${-w / 2} ${-h / 2})`}>
      <rect
        x={0}
        y={0}
        width={w}
        height={h}
        rx={h / 2}
        className="fill-foreground/8 stroke-foreground/15"
        strokeWidth={0.5}
      />
      {/* person icon */}
      <g transform={`translate(${padX} ${h / 2}) scale(0.5)`}>
        <circle cx={0} cy={-6} r={3} className="fill-foreground/70" />
        <path
          d="M -5 8 a 5 5 0 0 1 10 0 z"
          className="fill-foreground/70"
        />
      </g>
      <text
        x={padX + iconW + 2}
        y={h / 2 + 3}
        className="fill-foreground text-[10px] font-medium"
        style={{ userSelect: "none" }}
      >
        {text}
      </text>
    </g>
  );
}
