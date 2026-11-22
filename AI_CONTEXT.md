# AI_CONTEXT.md — Mapa Técnico del Proyecto (`LinkBio VE`)

Plataforma SaaS Linktree multi-perfil con editor split-screen en tiempo real, personalización visual avanzada (Gratis vs. PRO), pagos flexibles en USD/VES a tasa BCV, tickets promocionales, subida multimedia a Cloudflare R2, panel Super Admin multi-ruta y API Externa v1 para creación masiva automatizada de perfiles.

---

## 1. Stack Tecnológico
- **Framework**: Next.js `16.3.5` (App Router + Turbopack), React `19.3.0`, TypeScript.
- **Estilos**: Tailwind CSS v4 (`@import "tailwindcss";` en `src/app/globals.css`) + animaciones CSS personalizadas (`@keyframes`).
- **Base de Datos**: Turso libSQL (`@libsql/client`) vía singleton lazy en `src/db/index.ts`.
- **Auth**: `next-auth` v4 (`src/lib/auth.ts`, `src/app/api/auth/[...nextauth]/route.ts`), roles `ADMIN` y `SUPER_ADMIN`. JWT almacena `id`, `role`, `plan_id` y `slug` (cero consultas DB en `callbacks.session`).
- **Caché Servidor**: `src/lib/cache.ts` (TTL in-memory con invalidación inmediata en mutaciones para `bcv`, `plans`, `banks`, `discounts`, `payment_methods`, `external_api_config`).
- **Storage Media**: Cloudflare R2 S3-compatible (`@aws-sdk/client-s3` en `src/app/api/upload/route.ts`).
- **Iconos**: `lucide-react` + catálogo maestro en `src/components/IconCatalog.tsx`.

---

## 2. Esquema de Base de Datos y Auto-Migración (`src/db/schema.ts`, `src/db/index.ts`)

`ensurePaymentColumns()` usa promesa compartida (`__linkbioSchemaPromise`) y `Promise.allSettled()` para ejecutar DDL/índices en paralelo una sola vez por instancia:

- **`plans`**: `id` (`GRATIS` | `PAGO`), `name`, `price_usd`, `features_json`, `is_active`, `updated_at`.
  - Flags de `PlanFeatures`: `video_background`, `remove_watermark`, `unlimited_links`, `premium_themes`, `custom_fonts`, `social_icons`, `max_links`, `all_icons`, `max_landing_pages`, `custom_image_upload`, `image_effects`, `extended_gradients`, `extended_buttons`.
- **`users`**: `id`, `email`, `name`, `password_hash`, `role`, `google_id`, `plan_id`, `subscription_started_at`, `subscription_expires_at` (`NULL` con `plan_id='PAGO'` = PRO Ilimitado), `created_at`.
- **`landing_pages`**: `id`, `user_id`, `slug` (UNIQUE), `title`, `bio`, `avatar_url`, `background_type` (`color|gradient|image|video`), `background_url`, `theme_config_json`, `is_disabled`, `disabled_reason`, `created_at`, `updated_at`.
- **`links`**: `id`, `landing_id`, `title`, `url`, `icon`, `position`, `is_active`, `block_type` (`'link' | 'title' | 'text'`), `content`, `is_adult` (`0 | 1`, advertencia +18), `created_at`.
- **`payments`**, **`payment_methods`**, **`banks`**, **`tickets`**, **`system_settings`**: Gestión de pagos BCV/USD, multimeses, tickets canjeables, descuentos y `external_api_config`.
- **`api_keys`**: `id`, `name`, `description`, `key_prefix`, `key_hash` (SHA-256), `scopes_json`, `default_plan_id`, `allow_plan_override`, `max_bulk_size`, `rate_limit_per_min`, `is_active`, `requests_count`, `profiles_created_count`, `last_used_at`, `created_by`, `created_at`.
- **`api_logs`**: `id`, `api_key_id`, `api_key_name`, `endpoint`, `method`, `status_code`, `items_requested`, `items_succeeded`, `items_failed`, `duration_ms`, `ip_address`, `error_summary`, `created_at`.

---

## 3. Mapa de Rutas UI (`src/app/`)

- `src/app/page.tsx`: Landing comercial + matriz comparativa dinámica (fetches independientes no bloqueantes a `/api/super-admin/plans` y `/api/bcv`).
- `src/app/auth/login/page.tsx`: Inicio de sesión / registro.
- `src/app/dashboard/page.tsx`: Panel del usuario (carga crítica solo `/api/landing`; catálogos de pagos/bancos/BCV diferidos en segundo plano; botón directo a `/super-admin` si `role === 'SUPER_ADMIN'`):
  - Selector multi-perfil (crear/cambiar/eliminar perfiles secundarios con modal).
  - **Tab 1 (`profile`)**, **Tab 2 (`links`)** (Drag & Drop + `link`/`title`/`text` + `+18`), **Tab 3 (`design`)** (catálogo visual completo), **Tab 4 (`plan`)** (pagos BCV/USD + tickets).
- `src/app/[slug]/page.tsx`: Página pública SSR deduplicada con `React.cache()`, `LEFT JOIN users`, queries en paralelo (`plans` + `links`), bloqueo `is_disabled` y `LandingBlocksRenderer`.
- **Panel Super Admin Multi-Ruta (`src/app/super-admin/layout.tsx` + `SuperAdminShell.tsx`)**:
  - `/super-admin`: Resumen General / Centro de Control con accesos directos y alertas.
  - `/super-admin/pagos`: Aprobación/rechazo de declaraciones + filtros + modal de comprobante.
  - `/super-admin/usuarios`: Gestión de usuarios, barra de progreso 30 días, PRO Ilimitado y búsqueda.
  - `/super-admin/perfiles`: Control de landings, búsqueda, enlace directo, deshabilitación con motivo y borrado.
  - `/super-admin/metodos_pagos`: CRUD y edición modal de cuentas receptoras VES/USD.
  - `/super-admin/matriz_planes`: Permisos dinámicos GRATIS/PRO y descuentos multimes.
  - `/super-admin/bancos`: Catálogo de bancos venezolanos (CRUD + modal).
  - `/super-admin/tickets`: Generación masiva, copia y gestión de cupones canjeables.
  - `/super-admin/api_externa`: Interruptor global API, políticas CORS/plan/lotes, gestión de API Keys, Playground interactivo (`/v1/health` y `/v1/profiles/bulk`), Prompt Maestro copiable para otra IA y logs de actividad.

---

## 4. Componentes y Librerías Compartidas Clave

- **`src/lib/design-catalog.ts`** & **`src/app/globals.css`**: Única fuente de verdad visual (gradientes, botones, estilos tipográficos, Google Fonts, efectos de texto, filtros de imagen).
- **`src/lib/cache.ts`**: Caché TTL en memoria con invalidación por clave/prefijo.
- **`src/lib/external-api.ts`** & **`src/lib/external-api-prompt.ts`**: Autenticación API Key SHA-256, rate limit, CORS, logs, motor `provisionSingleProfile()` y generador de prompt IA.
- **`src/components/super-admin/SuperAdminShell.tsx`**: Layout persistente de `/super-admin/*` con contexto `useSuperAdmin()`, sidebar, breadcrumbs, KPIs y toasts.
- **`src/components/LandingBlocksRenderer.tsx`**, **`src/components/AdultWarningModal.tsx`**, **`src/components/PhonePreview.tsx`**.

---

## 5. Mapa de API Endpoints (`src/app/api/`)

- **Internos / Usuario**:
  - `/api/landing` (`GET` paralelo, `POST`, `PUT`, `DELETE`)
  - `/api/links` (`POST`, `PUT`, `PATCH` drag-and-drop batch, `DELETE`)
  - `/api/upload` (`POST` R2), `/api/payments` (`GET`, `POST`), `/api/tickets/redeem` (`POST`)
  - `/api/bcv` (`GET` con caché RAM 30 min + timeout 2.5s), `/api/banks` (`GET` cacheado, `POST`, `PUT`, `DELETE`)
- **Super Admin (`/api/super-admin/*`)**:
  - `summary` (`GET` único batch paralelo de KPIs para `SuperAdminShell`)
  - `api-keys` (`GET`, `POST`, `PUT`, `DELETE` — config global + API Keys + logs)
  - `plans` (`GET` cacheado, `PUT`), `users` (`GET`, `PUT`), `payments` (`GET`, `PUT`), `payment-methods` (`GET` cacheado, `POST`, `PUT`, `DELETE`), `discounts` (`GET` cacheado, `PUT`), `tickets` (`GET`, `POST`, `DELETE`), `landings` (`GET`, `PUT`, `DELETE`)
- **API Externa Versionada v1 (`/api/v1/*`, CORS + `Bearer`/`X-API-Key`)**:
  - `/api/v1/health` (`GET`, `OPTIONS`): Test de conexión, scopes, límites y catálogo visual.
  - `/api/v1/profiles` (`GET`, `POST`, `OPTIONS`): Listar/filtrar perfiles o crear un perfil + usuario automáticamente.
  - `/api/v1/profiles/bulk` (`POST`, `OPTIONS`): Creación masiva automatizada por lotes (hasta `max_bulk_size`, `dry_run`, `auto_deduplicate_slug`, reporte parcial `results` + `errors`).
  - `/api/v1/profiles/[slug]` (`GET`, `PUT`, `DELETE`, `OPTIONS`): Leer, actualizar (campos/diseño/`replace_links`/`append_links`) o eliminar perfil por slug.
