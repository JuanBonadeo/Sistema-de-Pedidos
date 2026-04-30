"use client";

import { create } from "zustand";

import type { FloorTable, TableShape, TableStatus } from "@/lib/reservations/types";

/**
 * Editor-side table — same fields as the DB row but with optional id (new
 * tables don't have one yet) and a transient `_localId` so React keys stay
 * stable across re-renders before the server assigns the real uuid.
 */
export type EditorTable = {
  id?: string;
  _localId: string;
  label: string;
  seats: number;
  shape: TableShape;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  status: TableStatus;
};

type Tool = "select" | "add-circle" | "add-square" | "add-rect";

type State = {
  width: number;
  height: number;
  name: string;
  tables: EditorTable[];
  selectedLocalId: string | null;
  tool: Tool;
  dirty: boolean;
};

type Actions = {
  init: (params: { width: number; height: number; name: string; tables: FloorTable[] }) => void;
  setName: (name: string) => void;
  setCanvasSize: (w: number, h: number) => void;
  setTool: (tool: Tool) => void;
  addTable: (shape: TableShape) => void;
  select: (localId: string | null) => void;
  updateSelected: (patch: Partial<EditorTable>) => void;
  moveSelected: (dx: number, dy: number) => void;
  resizeSelected: (w: number, h: number) => void;
  rotateSelected: (deg: number) => void;
  deleteSelected: () => void;
  markClean: () => void;
};

let counter = 0;
function makeLocalId(): string {
  counter += 1;
  return `t_${Date.now().toString(36)}_${counter}`;
}

const DEFAULTS: Record<TableShape, { width: number; height: number; seats: number }> = {
  circle: { width: 90, height: 90, seats: 2 },
  square: { width: 100, height: 100, seats: 4 },
  rect: { width: 160, height: 90, seats: 6 },
};

export const useFloorPlanStore = create<State & Actions>((set, get) => ({
  width: 1000,
  height: 700,
  name: "Salón",
  tables: [],
  selectedLocalId: null,
  tool: "select",
  dirty: false,

  init: ({ width, height, name, tables }) =>
    set({
      width,
      height,
      name,
      tables: tables.map((t) => ({
        id: t.id,
        _localId: makeLocalId(),
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
      selectedLocalId: null,
      dirty: false,
    }),

  setName: (name) => set({ name, dirty: true }),

  setCanvasSize: (w, h) => set({ width: w, height: h, dirty: true }),

  setTool: (tool) => set({ tool }),

  addTable: (shape) => {
    const { width: cw, height: ch, tables } = get();
    const def = DEFAULTS[shape];
    const localId = makeLocalId();
    const next: EditorTable = {
      _localId: localId,
      label: `Mesa ${tables.length + 1}`,
      seats: def.seats,
      shape,
      x: Math.round((cw - def.width) / 2),
      y: Math.round((ch - def.height) / 2),
      width: def.width,
      height: def.height,
      rotation: 0,
      status: "active",
    };
    set({ tables: [...tables, next], selectedLocalId: localId, dirty: true, tool: "select" });
  },

  select: (localId) => set({ selectedLocalId: localId }),

  updateSelected: (patch) => {
    const { selectedLocalId, tables } = get();
    if (!selectedLocalId) return;
    set({
      tables: tables.map((t) => (t._localId === selectedLocalId ? { ...t, ...patch } : t)),
      dirty: true,
    });
  },

  moveSelected: (dx, dy) => {
    const { selectedLocalId, tables, width, height } = get();
    if (!selectedLocalId) return;
    set({
      tables: tables.map((t) => {
        if (t._localId !== selectedLocalId) return t;
        const nx = Math.max(0, Math.min(width - t.width, t.x + dx));
        const ny = Math.max(0, Math.min(height - t.height, t.y + dy));
        return { ...t, x: nx, y: ny };
      }),
      dirty: true,
    });
  },

  resizeSelected: (w, h) => {
    const { selectedLocalId, tables } = get();
    if (!selectedLocalId) return;
    set({
      tables: tables.map((t) =>
        t._localId === selectedLocalId
          ? { ...t, width: Math.max(20, Math.round(w)), height: Math.max(20, Math.round(h)) }
          : t,
      ),
      dirty: true,
    });
  },

  rotateSelected: (deg) => {
    const { selectedLocalId, tables } = get();
    if (!selectedLocalId) return;
    const norm = ((Math.round(deg) % 360) + 360) % 360;
    set({
      tables: tables.map((t) => (t._localId === selectedLocalId ? { ...t, rotation: norm } : t)),
      dirty: true,
    });
  },

  deleteSelected: () => {
    const { selectedLocalId, tables } = get();
    if (!selectedLocalId) return;
    set({
      tables: tables.filter((t) => t._localId !== selectedLocalId),
      selectedLocalId: null,
      dirty: true,
    });
  },

  markClean: () => set({ dirty: false }),
}));
