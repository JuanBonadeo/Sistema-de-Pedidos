# Log del Wiki

Registro cronológico append-only. Cada entrada sigue el formato:
`## [YYYY-MM-DD] tipo | descripción`

Tipos: `ingest` | `query` | `decision` | `lint` | `init`

---

## [2026-04-27] init | Creación inicial del wiki

**Acción:** Setup completo del wiki siguiendo el patrón LLM Wiki.

**Archivos creados:**
- `CLAUDE.md` — schema del wiki y convenciones
- `wiki/index.md` — índice de todas las páginas
- `wiki/log.md` — este archivo
- `wiki/overview.md` — resumen ejecutivo del proyecto
- `wiki/roadmap.md` — estado actual y gaps
- `wiki/arquitectura/stack-tecnico.md`
- `wiki/arquitectura/base-de-datos.md`
- `wiki/arquitectura/autenticacion.md`
- `wiki/arquitectura/multi-tenancy.md`
- `wiki/features/chatbot.md`
- `wiki/features/pedidos.md`
- `wiki/features/catalogo.md`
- `wiki/features/pagos.md`
- `wiki/features/menus-del-dia.md`
- `wiki/features/dashboard-admin.md`
- `wiki/dominio/negocio.md`
- `wiki/dominio/orden.md`
- `wiki/dominio/cliente.md`
- `wiki/dominio/producto.md`

**Fuente:** Exploración completa del codebase en `/home/user/Sistema-de-Pedidos` — estructura de directorios, código fuente, migraciones de DB, package.json.

**Cobertura:** Stack técnico completo, esquema de DB con todas las tablas, arquitectura multi-tenant, sistema de auth, todos los features principales, entidades del dominio, roadmap con gaps identificados.

**Gaps en el wiki al inicio:**
- Sin fuentes en `raw/` aún
- Chatbot: detalles de implementación de tools individuales (pendiente exploración más profunda)
- Tests: no se documentaron los tests existentes
- Deployment/CI: no explorado

---

_Las entradas futuras van aquí, de más reciente a más antigua (insert at top after this line)._
