# CLAUDE.md — Schema del Wiki: Sistema de Pedidos

Este archivo define cómo funciona el wiki de conocimiento de este proyecto. Léelo al inicio de cada sesión para orientarte.

---

## Qué es este wiki

Un wiki persistente y acumulativo que funciona como el **cerebro del proyecto**. No es RAG (no recupera fragmentos en cada query). Es un conjunto de páginas Markdown mantenidas por el LLM que compilan, sintetizan y conectan el conocimiento del proyecto. Cuanto más se usa, más rico se vuelve.

Estructura de directorios:
- `wiki/` → páginas del wiki (este es el artefacto central)
- `raw/` → fuentes originales inmutables (docs, transcripciones, specs, notas)
- `CLAUDE.md` → este archivo (el schema)

---

## Reglas fundamentales

1. **`raw/`** es de solo lectura. El LLM lee fuentes, nunca las modifica.
2. **`wiki/`** es territorio del LLM. Crea, actualiza, enlaza páginas según sea necesario.
3. Toda sesión debe terminar actualizando `wiki/log.md` con una entrada `## [YYYY-MM-DD] tipo | descripción`.
4. Toda sesión debe terminar actualizando `wiki/index.md` si se crearon o modificaron páginas.
5. Los enlaces entre páginas wiki usan rutas relativas: `[Órdenes](../dominio/orden.md)`.

---

## Estructura del wiki

```
wiki/
├── index.md              ← índice de todas las páginas (actualizar siempre)
├── log.md                ← registro cronológico append-only
├── overview.md           ← resumen ejecutivo del proyecto
├── roadmap.md            ← estado actual, gaps, próximos pasos
├── arquitectura/
│   ├── stack-tecnico.md  ← stack completo con versiones y decisiones
│   ├── base-de-datos.md  ← esquema DB, tablas, relaciones, RLS
│   ├── autenticacion.md  ← auth flows, roles, middleware
│   └── multi-tenancy.md  ← cómo funciona el multi-tenant (slug, RLS)
├── features/
│   ├── chatbot.md        ← agente AI LangChain, tools, prompt
│   ├── pedidos.md        ← flujo de pedidos end-to-end
│   ├── catalogo.md       ← productos, categorías, modificadores
│   ├── pagos.md          ← integración Mercado Pago, webhooks
│   ├── menus-del-dia.md  ← combos diarios, disponibilidad
│   └── dashboard-admin.md← dashboard, board realtime, reportes
├── dominio/
│   ├── negocio.md        ← entidad Business, configuración, tenant
│   ├── orden.md          ← ciclo de vida de una orden
│   ├── cliente.md        ← entidad Customer, auth, perfil
│   └── producto.md       ← productos, modificadores, precios
```

---

## Operaciones

### Ingest (agregar fuente nueva)
Cuando el usuario agregue un archivo a `raw/`:
1. Leer el archivo fuente
2. Discutir con el usuario los puntos clave
3. Crear página de resumen en `wiki/` (categoría apropiada)
4. Actualizar páginas existentes afectadas (hasta 15 páginas)
5. Actualizar `wiki/index.md`
6. Agregar entrada al `wiki/log.md`: `## [fecha] ingest | nombre-fuente`

### Query (pregunta sobre el proyecto)
1. Leer `wiki/index.md` para identificar páginas relevantes
2. Leer las páginas relevantes
3. Sintetizar respuesta con referencias a páginas (`[ver stack](wiki/arquitectura/stack-tecnico.md)`)
4. Si la respuesta es valiosa, crear una nueva página en `wiki/` y agregar al índice
5. Agregar entrada al log: `## [fecha] query | tema-consultado`

### Lint (auditoría del wiki)
Revisar periódicamente:
- Contradicciones entre páginas
- Claims desactualizados
- Páginas huérfanas sin inbound links
- Conceptos mencionados sin página propia
- Cross-references faltantes
- Gaps de información que requieren investigación

### Decisión de arquitectura
Cuando se toma una decisión técnica importante:
1. Documentar en la página de arquitectura relevante
2. Agregar nota con fecha: `> **[fecha]** Decisión: ...`
3. Actualizar log: `## [fecha] decision | descripción`

---

## Convenciones de páginas

Cada página wiki sigue este formato:

```markdown
# Título

> **Última actualización:** YYYY-MM-DD
> **Fuentes:** lista de raw/ o páginas que alimentaron esto

Contenido en párrafos concisos, con ##secciones, tablas, listas.

## Ver también
- [Página relacionada](../ruta/pagina.md)
```

---

## Cómo usar este wiki en la práctica

- Para entender cómo funciona algo: "¿cómo funciona el chatbot?" → el LLM lee `wiki/features/chatbot.md` y responde
- Para planear una feature: "quiero agregar notificaciones push" → el LLM lee páginas relevantes y propone diseño
- Para agregar conocimiento: "acá está el documento de diseño de la app móvil" → ingest en `raw/`
- Para auditar: "revisá el estado del wiki" → lint pass completo

---

## Contexto del proyecto

**Sistema de Pedidos** es una plataforma SaaS multi-tenant de pedidos online para negocios de gastronomía en Argentina/LATAM. Permite a restaurantes y locales de comida tener su propio portal de pedidos online con:
- Menú digital configurable
- Chatbot AI para tomar pedidos por WhatsApp
- Dashboard admin con board de pedidos en tiempo real
- Integración con Mercado Pago
- Soporte para combos/menús del día

**Stack principal:** Next.js 15, React 19, TypeScript, Supabase (PostgreSQL), LangChain, OpenAI, Mercado Pago, Tailwind CSS, Zustand.

**Estado:** v0.1.0, en desarrollo activo.
