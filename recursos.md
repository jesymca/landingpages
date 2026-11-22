# recursos.md — Inventario Maestro de Recursos del Proyecto (`LinkBio VE`)

> Archivo diseñado para **ahorrar tokens**: consulta aquí todo el stack, servicios, variables de entorno, scripts, librerías compartidas, tablas y rutas antes de buscar archivos en el disco.

---

## 1. Stack y Dependencias Principales
- **Framework**: Next.js `16.3.5` (App Router + Turbopack), React `19.3.0`, TypeScript `7.0.2`.
- **UI & Estilos**: Tailwind CSS v4 (`src/app/globals.css`), `lucide-react`, `framer-motion`.
- **Base de Datos**: Turso libSQL (`@libsql/client`), cliente lazy singleton + migración paralela idempotente en `src/db/index.ts`.
- **Autenticación**: `next-auth` v4 (JWT sin queries DB en `callbacks.session`, Google OAuth + Credentials con `bcryptjs`).
- **Storage Multimedia**: Cloudflare R2 S3-compatible (`@aws-sdk/client-s3` en `src/app/api/upload/route.ts`).
- **Tasa BCV**: DolarApi VE (`https://ve.dolarapi.com/v1/dolares/`) con caché RAM 30 min, timeout 2.5s y respaldo en Turso (`src/app/api/bcv/route.ts`).

---

## 2. Variables de Entorno Requeridas (`.env.local` / Vercel)
*(Solo nombres de referencia — nunca guardar secretos en este archivo)*
- **Turso DB**: `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`
- **NextAuth / OAuth**: `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- **Cloudflare R2**: `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL`
- **Tasa BCV (opcional)**: `BCV_API_URL`

---

## 3. Comandos y Herramientas CLI (`package.json`)
| Comando | Propósito |
| :--- | :--- |
| `npm run dev` | Servidor de desarrollo Next.js |
| `npm run build` | Compilación de producción (requiere red para `next/font/google` sin caché) |
| `npx tsc --noEmit` | Validación rápida de tipos TypeScript (funciona 100% offline) |
| `npm run seed` | Seed inicial de base de datos (`src/db/seed.ts`) |
| `npm run ai:status` | Muestra resumen ultracompacto (~15 líneas) de fase, último cambio e inventario |
| `npm run ai:snapshot` | Escanea páginas, APIs y tablas Turso; actualiza `.ai-state.json` y `recursos.md` |
| `npm run ai:phase` | Actualiza la fase actual del proyecto en `vitacora.md` y `.ai-state.json` |
| `npm run ai:log` | Registra la última intervención simultáneamente en `vitacora.md` y `AI_CHANGELOG.md` |

---

## 4. Módulos y Fuentes Únicas de Verdad
- `src/db/index.ts` & `src/db/schema.ts`: Conexión Turso, tipos TS, `CREATE_TABLES_SQL` y auto-migración `ensurePaymentColumns()`.
- `src/lib/auth.ts`: Configuración NextAuth (JWT con `id`, `role`, `plan_id`, `slug`).
- `src/lib/cache.ts`: Caché en memoria TTL del servidor (`cacheGet`, `cacheSet`, `cacheGetOrSet`, `cacheInvalidate`).
- `src/lib/design-catalog.ts`: Catálogo maestro de gradientes, botones, estilos tipográficos, fuentes Google y efectos de texto.
- `src/lib/external-api.ts`: Motor de API Externa v1 (API Keys SHA-256, rate limit, CORS, logs, `provisionSingleProfile` para carga individual y masiva).
- `src/lib/external-api-prompt.ts` & `API_INTEGRATION_PROMPT.md`: Prompt maestro listo para entregar a cualquier IA externa para conectar plataformas con esta API.
- `src/components/super-admin/SuperAdminShell.tsx`: Layout persistente multi-ruta de `/super-admin/*` (sidebar, breadcrumbs, KPIs compartidos y toasts).
- `src/components/LandingBlocksRenderer.tsx` & `AdultWarningModal.tsx`: Renderizado unificado de bloques (`link`, `title`, `text`) y advertencia `+18`.
- `src/components/PhonePreview.tsx`: Simulador móvil en vivo del dashboard.
- `src/components/IconCatalog.tsx` & `SocialIcons.tsx`: Catálogo de +60 iconos y barra social.

---

## 5. Inventario Auto-Mantenido (Rutas UI, APIs y Tablas DB)
<!-- AUTO:ROUTES:START -->
- **Páginas UI (13)**: `/[slug]`, `/auth/login`, `/dashboard`, `/`, `/super-admin/api_externa`, `/super-admin/bancos`, `/super-admin/matriz_planes`, `/super-admin/metodos_pagos`, `/super-admin`, `/super-admin/pagos`, `/super-admin/perfiles`, `/super-admin/tickets`, `/super-admin/usuarios`
- **API Routes (23)**: `/api/auth/[...nextauth]`, `/api/banks`, `/api/bcv`, `/api/debug-users`, `/api/debug`, `/api/landing`, `/api/links`, `/api/payments`, `/api/super-admin/api-keys`, `/api/super-admin/discounts`, `/api/super-admin/landings`, `/api/super-admin/payment-methods`, `/api/super-admin/payments`, `/api/super-admin/plans`, `/api/super-admin/summary`, `/api/super-admin/tickets`, `/api/super-admin/users`, `/api/tickets/redeem`, `/api/upload`, `/api/v1/health`, `/api/v1/profiles/[slug]`, `/api/v1/profiles/bulk`, `/api/v1/profiles`
- **Tablas Turso DB (11)**: `plans`, `users`, `landing_pages`, `links`, `system_settings`, `banks`, `payment_methods`, `payments`, `tickets`, `api_keys`, `api_logs`
- **Librerías compartidas (`src/lib/`)**: `src/lib/auth.ts`, `src/lib/cache.ts`, `src/lib/design-catalog.ts`, `src/lib/external-api-prompt.ts`, `src/lib/external-api.ts`
- **Componentes (`src/components/`)**: `src/components/AdultWarningModal.tsx`, `src/components/IconCatalog.tsx`, `src/components/LandingBlocksRenderer.tsx`, `src/components/PhonePreview.tsx`, `src/components/SocialIcons.tsx`, `src/components/super-admin/SuperAdminShell.tsx`
- _Actualizado automáticamente por `npm run ai:snapshot` el 2026-11-22_
<!-- AUTO:ROUTES:END -->

---

## 6. Documentos de Memoria del Repositorio
- `agent.md` / `AGENTS.md` / `GEMINI.md` / `CLAUDE.md` — Protocolo de inicio y cierre para IAs.
- `vitacora.md` — Fase actual, roadmap por fases, decisiones técnicas y bitácora de avances.
- `recursos.md` — Este mapa de recursos, servicios, comandos e inventario auto-mantenido.
- `AI_CONTEXT.md` — Mapa detallado de arquitectura, flags `PlanFeatures` y comportamiento de rutas.
- `AI_CHANGELOG.md` — Registro cronológico detallado de intervenciones técnicas.
- `API_INTEGRATION_PROMPT.md` — Instrucción lista para copiar a otra IA y conectar sistemas masivos a `/api/v1/*`.
- `.ai-state.json` — Estado estructurado JSON consumido por `scripts/ai-memory.mjs`.
