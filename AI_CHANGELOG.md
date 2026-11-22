# AI_CHANGELOG.md — Registro Cronológico de Ediciones (Últimas Intervenciones)

> **Regla para IAs:** Lee las primeras entradas para conocer los cambios más recientes sin releer todo el repositorio. Al terminar **cada** intervención, agrega una nueva entrada inmediatamente debajo del marcador `<!-- NUEVAS INTERVENCIONES AQUÍ -->` siguiendo la plantilla (o ejecuta `npm run ai:log`).

## Plantilla Obligatoria de Registro
```markdown
### [YYYY-MM-DD] — <Título corto de la intervención>
- **Solicitud**: <Resumen breve en 1 línea>
- **Archivos modificados/creados**:
  - `ruta/archivo.tsx`: <qué cambió / símbolos clave>
- **DB / API**: <columnas agregadas en ensurePaymentColumns / endpoints nuevos o actualizados>
- **Validación**: `<comando ejecutado> -> <resultado>`
```

<!-- NUEVAS INTERVENCIONES AQUÍ -->

### [2026-11-22] — Herramientas Memoria IA, Super Admin Multi-Ruta, API Externa Masiva v1 y Optimización de Navegación
- **Solicitud**: Crear `agent.md`/`recursos.md`/`vitacora.md` y CLI `ai:*`, separar `/super-admin` en rutas dedicadas, habilitar zona API Externa masiva + prompt IA, y eliminar retardos de navegación.
- **Archivos modificados/creados**:
  - `agent.md`, `recursos.md`, `vitacora.md`, `API_INTEGRATION_PROMPT.md`, `.ai-state.json`, `scripts/ai-memory.mjs`, `package.json`, `AGENTS.md`, `GEMINI.md`, `CLAUDE.md`, `README.md`, `AI_CONTEXT.md`: Sistema de memoria por fases y herramientas CLI (`npm run ai:status`, `ai:snapshot`, `ai:phase`, `ai:log`).
  - `src/lib/cache.ts`, `src/lib/auth.ts`, `src/types/next-auth.d.ts`, `src/app/providers.tsx`, `src/db/index.ts`, `src/app/api/bcv/route.ts`, `src/app/api/landing/route.ts`, `src/app/[slug]/page.tsx`, `src/app/page.tsx`, `src/app/dashboard/page.tsx`, `src/app/api/banks/route.ts`, `src/app/api/super-admin/{plans,discounts,payment-methods}/route.ts`: Eliminación de consulta DB por petición en `callbacks.session`, caché TTL en memoria, timeout 2.5s en BCV, queries paralelas, deduplicación SSR con `React.cache()` y carga diferida de catálogos de pago en dashboard.
  - `src/db/schema.ts`, `src/lib/external-api.ts`, `src/lib/external-api-prompt.ts`, `src/app/api/super-admin/api-keys/route.ts`, `src/app/api/v1/{health,profiles,profiles/bulk,profiles/[slug]}/route.ts`: Motor completo de API Externa v1 con API Keys SHA-256, scopes, rate-limit, CORS, logs, creación individual y masiva automatizada (`dry_run`, auto-creación de usuarios y contraseñas, deduplicación de slugs).
  - `src/app/api/super-admin/summary/route.ts`, `src/components/super-admin/SuperAdminShell.tsx`, `src/app/super-admin/{layout,loading,page}.tsx`, `src/app/super-admin/{pagos,usuarios,perfiles,metodos_pagos,matriz_planes,bancos,tickets,api_externa}/page.tsx`: Navegación multi-ruta independiente en `/super-admin/*` con sidebar persistente, KPIs compartidos y Zona API Externa con Playground y generador de Prompt IA.
- **DB / API**: Tablas `api_keys` y `api_logs` + índices SQLite en `ensurePaymentColumns()`; nuevos endpoints `/api/super-admin/summary`, `/api/super-admin/api-keys`, `/api/v1/health`, `/api/v1/profiles`, `/api/v1/profiles/bulk`, `/api/v1/profiles/[slug]`.
- **Validación**: `npx tsc --noEmit` -> exit 0; `npm run build` -> exit 0 (22/22 routes).

### [2026-11-16] — Reordenamiento Drag & Drop, Bloques Título/Texto, Enlaces +18, Memoria AI `.md` y Catálogo Visual PRO Ampliado
- **Solicitud**: Drag-and-drop para reordenar enlaces en dashboard; crear bloques `Añadir Título` y `Añadir Texto` reordenables; toggle de contenido `+18` con advertencia al visitante; documentación `.md` con instrucción de memoria post-intervención; +20 gradientes móviles PRO con muestra en botón; +20 botones PRO animados/iluminados con muestra en botón + verificación de existentes; 20 estilos tipográficos PRO; vista previa real en selector Google Fonts; +10 efectos visuales de texto PRO animados/iluminados con vista previa en vivo.
- **Archivos modificados/creados**:
  - `src/db/schema.ts`, `src/db/index.ts`: Añadido `LinkBlockType` (`'link' | 'title' | 'text'`), `block_type`, `content`, `is_adult` en `LinkItem`, `CREATE_TABLES_SQL` y migración idempotente cacheada en `ensurePaymentColumns()`.
  - `src/app/api/links/route.ts`, `src/app/api/landing/route.ts`: Soporte de `block_type`, `content`, `is_adult` en `POST`/`PUT`/`GET`, cálculo seguro `MAX(position)+1`, conteo de `max_links` solo sobre enlaces, y nuevo `PATCH /api/links` para persistir orden Drag & Drop con `dbClient.batch()`.
  - `src/lib/design-catalog.ts` (nuevo): Fuente única de verdad con 20 gradientes móviles PRO adicionales (31 PRO totales), corrección de bug `replace('_', '-')` en botones `moving_light_*` + verificación de 15 clásicos PRO + 20 nuevos botones animados/iluminados PRO, 20 estilos PRO en `Estilos de Texto & Tipografía`, 17 fuentes en `GOOGLE_FONTS_CATALOG`, y 10 nuevos efectos visuales de texto PRO animados e iluminados (`TEXT_EFFECTS_CATALOG`).
  - `src/app/globals.css`: Añadidos `@keyframes` y clases `.bg-anim-*`, `.btn-moving-light-*` (corregida geometría `aspect-ratio: 1/1` centrada para que no recorte esquinas en botones anchos), `.btn-anim-*`, `.btn-fx-*`, `.text-fx-*`, `.typo-pro-*`.
  - `src/app/layout.tsx`: Cargadas todas las Google Fonts del catálogo (`Bebas Neue`, `Dancing Script`, `Fira Code`, `Orbitron`, `Pacifico`, `Permanent Marker`, etc.).
  - `src/components/AdultWarningModal.tsx` (nuevo) & `src/components/LandingBlocksRenderer.tsx` (nuevo): Renderizado unificado de `link` / `title` / `text` + modal de advertencia `+18` compartido entre `PhonePreview.tsx` y `[slug]/page.tsx`.
  - `src/components/PhonePreview.tsx` & `src/app/[slug]/page.tsx`: Migrados a `design-catalog.ts` y `LandingBlocksRenderer`, corregida prioridad de `custom:` gradient sobre gradientes preestablecidos.
  - `src/app/dashboard/page.tsx`: Selector `Enlace | Añadir Título | Añadir Texto`, switch `+18` y toggle rápido por enlace, tarjetas reordenables por Drag-and-Drop (`draggable`) + flechas subir/bajar, edición inline, y previsualizaciones en vivo en todos los selectores de Gradientes, Botones, Estilos Tipográficos PRO, Google Fonts y Efectos Visuales de Texto.
  - `src/app/page.tsx`: Actualizadas descripciones comerciales de funcionalidades PRO.
  - `AGENTS.md`, `GEMINI.md`, `CLAUDE.md`, `AI_CONTEXT.md`, `AI_CHANGELOG.md`, `README.md`: Sistema de documentación y protocolo obligatorio post-intervención.
- **Validación**:
  - `npx tsc --noEmit` -> Exitoso (exit 0).
  - `npm run build` (`BypassSandbox: true`) -> Exitoso (exit 0, 14/14 static/dynamic routes compiled cleanly).

---

### Historial Previo Resumido (Git Log)
- `d7bba06f`: Efectos visuales de texto PRO iniciales, 6 gradientes móviles (`anim_*`) y botones con borde de luz giratorio (`moving_light_*`).
- `a15113fa` / `266a276e`: Corrección de membresías PRO ilimitadas (`subscription_expires_at = NULL`) y badge `PRO ILIMITADO` en `/super-admin`.
- `321eea94`: Personalización visual & fondo multimedia (gradiente personalizado gratis, imágenes prediseñadas gratis vs upload R2/filtros/gradientes/botones/fuentes PRO).
- `7f1590fa` / `b7b3623d`: Soporte multi-landing por usuario según `max_landing_pages`, eliminación de perfiles secundarios y deshabilitación con motivo desde `/super-admin`.
- `f7f72d92`: Membresías multi-mes personalizadas y sistema de tickets canjeables.
