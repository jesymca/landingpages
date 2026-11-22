# AGENTS.md — Instrucciones Globales y Protocolo de Memoria para Cualquier IA

Este repositorio cuenta con un sistema de memoria persistente en archivos `.md` y herramientas CLI (`scripts/ai-memory.mjs`) diseñado para **ahorrar tokens**, evitar exploraciones repetitivas del codebase y garantizar continuidad exacta entre distintas IAs o sesiones.

---

## ⚡ 1. Regla de Lectura Rápida (Ahorro Máximo de Tokens)

Antes de ejecutar búsquedas globales (`find`, `grep` amplio o leer archivos largos de UI como `src/app/dashboard/page.tsx`), **toda IA DEBE leer en este orden**:

1. **`npm run ai:status`** (o encabezado de [`vitacora.md`](./vitacora.md)) — Fase actual del proyecto, progreso, último cambio y estado git en ~15 líneas.
2. [`recursos.md`](./recursos.md) — Inventario auto-mantenido de páginas UI, endpoints API, tablas DB, librerías, variables de entorno y comandos CLI.
3. [`AI_CONTEXT.md`](./AI_CONTEXT.md) — Mapa compacto de arquitectura, flags `PlanFeatures` y comportamiento de módulos.
4. [`AI_CHANGELOG.md`](./AI_CHANGELOG.md) (primeras ~100 líneas) — Últimas ediciones detalladas y resultados de build.
5. Leer únicamente las líneas específicas de los archivos relacionados con la tarea.

> Nota: [`agent.md`](./agent.md) contiene la versión ultracompacta de este protocolo para cualquier herramienta que busque el nombre en minúsculas.

---

## 📝 2. Regla Obligatoria Post-Intervención (Actualizar Fase, Recursos y Bitácora)

**INSTRUCCIÓN PERMANENTE PARA CUALQUIER IA:**
Al finalizar **CADA intervención** (feature, bugfix, refactor o cambio de esquema), antes de entregar la respuesta final al usuario, la IA **DEBE**:

1. Ejecutar `npm run ai:snapshot` para regenerar `.ai-state.json` y el inventario de rutas/APIs/tablas en [`recursos.md`](./recursos.md).
2. Ejecutar `npm run ai:log -- --title "..." --request "..." --files "..." --db "..." --validation "..."` (o insertar manualmente bajo los marcadores en [`vitacora.md`](./vitacora.md) y [`AI_CHANGELOG.md`](./AI_CHANGELOG.md)).
3. Si cambió la fase o hito del proyecto, ejecutar `npm run ai:phase -- --name "..." --status "..." --progress "..." --next "..."`.
4. **Actualizar [`AI_CONTEXT.md`](./AI_CONTEXT.md)** si cambiaron tablas/columnas de DB, endpoints API, flags de `PlanFeatures`, rutas nuevas o catálogos compartidos.
5. **No duplicar explicaciones extensas**: usar viñetas técnicas concretas con rutas y nombres exactos para mantener los archivos livianos en tokens.

---

## 🛠️ Convenciones Críticas del Proyecto

- **Idioma UI y mensajes**: Español (`es`).
- **Base de datos**: Turso (`@libsql/client`) inicializada en `src/db/index.ts`. Cualquier tabla o columna nueva debe agregarse de forma idempotente y paralela en `ensurePaymentColumns()` (`Promise.allSettled([...])`).
- **Rendimiento y Navegación Rápida**:
  - **Cero DB queries en `callbacks.session`** (`src/lib/auth.ts`): toda identidad de sesión (`id`, `role`, `plan_id`, `slug`) vive en el JWT.
  - **Caché TTL servidor**: usar `src/lib/cache.ts` para catálogos semi-estáticos (`plans`, `banks`, `bcv`, `discounts`, `payment_methods`, `external_api_config`) e invalidar inmediatamente en mutaciones.
  - **Cero cascadas secuenciales de `fetch()`**: cada vista de `/super-admin/*` solo pide los datos de su propia sección; el layout persistente carga un único `/api/super-admin/summary`.
- **Build y Validación**: `next/font/google` descarga `Inter` durante `npm run build` (requiere red si no hay caché). Usar `npx tsc --noEmit` para chequeo de tipos rápido offline y `npm run build` para validación final de producción.
- **Fuente única de estilos visuales**: Toda nueva fuente, gradiente, estilo de botón o efecto de texto debe vivir en `src/lib/design-catalog.ts` y `src/app/globals.css`.
- **API Externa Masiva v1**: Motor central en `src/lib/external-api.ts`, prompt de conectividad en `src/lib/external-api-prompt.ts` / [`API_INTEGRATION_PROMPT.md`](./API_INTEGRATION_PROMPT.md) y gestión UI en `/super-admin/api_externa`.

---

## 📋 Instrucción Lista para Copiar (Para iniciar cualquier chat nuevo ahorrando tokens)

> "Antes de tocar código, ejecuta `npm run ai:status` y lee `agent.md`, `vitacora.md`, `recursos.md` y `AI_CONTEXT.md` para ahorrar tokens. Al terminar tu intervención, ejecuta obligatoriamente `npm run ai:snapshot` y actualiza `vitacora.md`, `AI_CHANGELOG.md` (y `AI_CONTEXT.md` si cambia arquitectura/DB/APIs)."
