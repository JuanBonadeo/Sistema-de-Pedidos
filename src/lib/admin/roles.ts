export const BUSINESS_ROLES = ["admin", "staff", "mozo", "cocina"] as const;
export type BusinessRoleInput = (typeof BUSINESS_ROLES)[number];

export const ROLE_META: Record<
  BusinessRoleInput,
  { label: string; description: string }
> = {
  admin: {
    label: "Admin",
    description: "Manage total: catálogo, equipo, configuración y pagos.",
  },
  staff: {
    label: "Staff",
    description: "Operativo general: pedidos en vivo, reservas y clientes.",
  },
  mozo: {
    label: "Mozo",
    description: "Solo /mozo: plano de mesas, reservas y alta en mesa.",
  },
  cocina: {
    label: "Cocina",
    description: "Solo /cocina: kanban de comandas y avance de items.",
  },
};
