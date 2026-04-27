# Chatbot AI

> **Última actualización:** 2026-04-27
> **Fuentes:** src/lib/chatbot/, src/app/api/chatbot/, src/components/admin/chatbot-tester.tsx

## Propósito

Agente conversacional para **tomar pedidos por WhatsApp** (y web). El cliente puede hablar en lenguaje natural, el bot muestra el menú, agrega items al carrito, y genera un link de checkout al final.

## Stack técnico

- **LangChain Core** — orquestación del agente y tools
- **LangChain OpenAI** — integración con modelos de OpenAI
- **OpenAI** — LLM subyacente (modelo configurable)
- **Tool-calling pattern** — el LLM decide qué tool llamar según el contexto

## Arquitectura del agente

```
Cliente (WhatsApp / Web)
        │
        ▼
  API Route /api/chatbot
        │
        ▼
  LangChain Agent
        │
   ┌────┴────────────────────┐
   │    Tools disponibles    │
   ├─────────────────────────┤
   │ search_products         │
   │ get_product_details     │
   │ check_business_status   │
   │ get_delivery_info       │
   │ add_to_cart             │
   │ get_cart                │
   │ generate_checkout_link  │
   └─────────────────────────┘
        │
        ▼
  Supabase (DB + mensajes)
```

## Tools del agente

| Tool | Descripción |
|---|---|
| `search_products` | Busca productos por texto en el catálogo del negocio |
| `get_product_details` | Obtiene detalles completos de un producto (precio, modificadores disponibles) |
| `check_business_status` | Verifica si el negocio está abierto en este momento (según horarios) |
| `get_delivery_info` | Obtiene información de zonas de delivery, costos mínimos |
| `add_to_cart` | Agrega un item al carrito de la conversación con modificadores |
| `get_cart` | Obtiene el resumen del carrito actual |
| `generate_checkout_link` | Genera un link único de checkout para que el cliente complete el pago |

## System prompt

El system prompt está en `src/lib/chatbot/agent.ts`. Es sofisticado y define:

- **Personalidad:** amable, eficiente, en español Argentina
- **Flujo recomendado:** saludo → verificar si está abierto → mostrar menú → agregar items → mostrar carrito → generar link
- **Restricciones:**
  - No inventar precios (usar `get_product_details`)
  - No saltear pasos (ej: generar checkout sin carrito)
  - No confirmar pedidos — solo generar el link de pago
  - Derivar al humano si el cliente pregunta algo fuera del dominio

El admin puede **customizar el system prompt** desde `/[slug]/admin/chatbot`.

## Configuración por negocio

Tabla `chatbot_configs` permite por negocio:
- **`system_prompt`**: reemplaza el prompt por defecto
- **`enabled_tools`**: array de tools habilitadas (un negocio sin delivery puede deshabilitar `get_delivery_info`)
- **`tool_overrides`**: JSON con descripciones customizadas de tools (para ajustar comportamiento sin cambiar código)

## API Routes

**`POST /api/chatbot`** — endpoint principal
- Recibe `{ message, conversation_id, business_slug }`
- Ejecuta el agente con el historial de la conversación
- Retorna la respuesta del asistente

**`GET /api/chatbot/config`** — obtiene config del chatbot del negocio
**`PUT /api/chatbot/config`** — actualiza config del chatbot

**`POST /api/chatbot/test`** — para el tester del admin (envía un mensaje de prueba)

## Tester del admin

`/[slug]/admin/chatbot` tiene una interfaz de chat en el admin para probar el bot sin necesitar WhatsApp. El componente `chatbot-tester.tsx` muestra la conversación, y `chatbot-prompt-editor.tsx` permite editar el system prompt en tiempo real.

## Persistencia de conversaciones

Las conversaciones y mensajes se guardan en:
- `chatbot_contacts` — quién está hablando
- `chatbot_conversations` — hilo de conversación
- `chatbot_messages` — cada mensaje (usuario, asistente, tool calls/results)

Esto permite retomar conversaciones y tener contexto histórico.

## Estado actual y gaps

**Funcionando:**
- Agente completo con todas las tools
- Tester en web del admin
- Config personalizable por negocio
- Persistencia de conversaciones

**Pendiente:**
- Integración real con WhatsApp (canal de mensajería — framework existe, conexión no)
- No hay canal SMS o Telegram
- La IA no maneja imágenes todavía (solo texto)

## Ver también

- [Catálogo](catalogo.md)
- [Flujo de Pedidos](pedidos.md)
- [Base de Datos — Chatbot](../arquitectura/base-de-datos.md)
- [Negocio](../dominio/negocio.md)
