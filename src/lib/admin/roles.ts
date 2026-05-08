// Roles operativos del MVP. Tras decisión 2026-05-07:
//   - `staff` se removió (relic del Pilar 1 canal digital, no mapea a una
//     posición real del local). La función "operativa no-mozo" la cumple
//     `encargado`, que es el rol explícito que pidió el cliente
//     ("encargado de cajas" en los requerimientos — lo acortamos a
//     `encargado` porque también opera salón y reservas, no solo caja).
//   - `cocina` se removió: los cocineros reciben ticket impreso, no usan
//     el sistema. La pantalla `/cocina` queda accesible para admin y
//     encargado como monitoreo, pero ningún user se asigna ese rol.
// Ver `wiki/decisiones/roles-mvp.md` y `wiki/casos-de-uso/CU-11-matriz-permisos.md`.
export const BUSINESS_ROLES = ["admin", "encargado", "mozo"] as const;
export type BusinessRoleInput = (typeof BUSINESS_ROLES)[number];

export const ROLE_META: Record<
  BusinessRoleInput,
  { label: string; description: string }
> = {
  admin: {
    label: "Admin",
    description: "Manage total: catálogo, equipo, configuración y pagos.",
  },
  encargado: {
    label: "Encargado",
    description:
      "Salón, reservas, apertura y cierre de caja, cobros, descuentos hasta 25%, anulaciones, sangrías.",
  },
  mozo: {
    label: "Mozo",
    description:
      "Plano de mesas, toma de pedido, cobros, descuentos hasta 10%.",
  },
};
