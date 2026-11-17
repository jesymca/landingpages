# AI_CONTEXT.md — Mapa Técnico del Proyecto (`LinkBio VE`)

Plataforma SaaS Linktree multi-perfil con editor split-screen en tiempo real, personalización visual avanzada (Gratis vs. PRO), pagos flexibles en USD/VES a tasa BCV, tickets promocionales, subida multimedia a Cloudflare R2 y panel Super Admin dinámico.

---

## 1. Stack Tecnológico
- **Framework**: Next.js `16.3.5` (App Router + Turbopack), React `19.3.0`, TypeScript.
- **Estilos**: Tailwind CSS v4 (`@import "tailwindcss";` en `src/app/globals.css`) + animaciones CSS personalizadas (`@keyframes`).
- **Base de Datos**: Turso libSQL (`@libsql/client`) vía proxy lazy en `src/db/index.ts`.
- **Auth**: `next-auth` v4 (`src/lib/auth.ts`, `src/app/api/auth/[...nextauth]/route.ts`), roles `ADMIN` y `SUPER_ADMIN`.
- **Storage Media**: Cloudflare R2 S3-compatible (`@aws-sdk/client-s3` en `src/app/api/upload/route.ts`).
- **Iconos**: `lucide-react` + catálogo maestro en `src/components/IconCatalog.tsx`.

---

## 2. Esquema de Base de Datos y Auto-Migración (`src/db/schema.ts`, `src/db/index.ts`)

La función idempotente `ensurePaymentColumns()` (cacheada por instancia mediante `_schemaEnsured`) aplica automáticamente `ALTER TABLE` faltantes y sincroniza los flags PRO en la tabla `plans`:

- **`plans`**: `id` (`GRATIS` | `PAGO`), `name`, `price_usd`, `features_json`, `is_active`, `updated_at`.
  - Flags de `PlanFeatures`: `video_background`, `remove_watermark`, `unlimited_links`, `premium_themes`, `custom_fonts`, `social_icons`, `max_links`, `all_icons`, `max_landing_pages`, `custom_image_upload`, `image_effects`, `extended_gradients`, `extended_buttons`.
- **`users`**: `id`, `email`, `name`, `password_hash`, `role`, `google_id`, `plan_id`, `subscription_started_at`, `subscription_expires_at` (`NULL` con `plan_id='PAGO'` = PRO Ilimitado), `created_at`.
- **`landing_pages`**: `id`, `user_id`, `slug` (UNIQUE), `title`, `bio`, `avatar_url`, `background_type` (`color|gradient|image|video`), `background_url`, `theme_config_json`, `is_disabled`, `disabled_reason`, `created_at`, `updated_at`.
- **`links`**: `id`, `landing_id`, `title`, `url`, `icon`, `position`, `is_active`, `block_type` (`'link' | 'title' | 'text'`), `content`, `is_adult` (`0 | 1`, advertencia +18), `created_at`.
- **`payments`**, **`payment_methods`**, **`banks`**, **`tickets`**, **`system_settings`**: Gestión de pagos BCV/USD, multimeses, tickets canjeables y descuentos.

---

## 3. Mapa de Rutas UI (`src/app/`)

- `src/app/page.tsx`: Landing comercial + matriz comparativa dinámica conectada a `/api/super-admin/plans` y `/api/bcv`.
- `src/app/auth/login/page.tsx`: Inicio de sesión / registro.
- `src/app/dashboard/page.tsx`: Panel del usuario:
  - Selector multi-perfil (crear/cambiar/eliminar perfiles secundarios con modal).
  - **Tab 1 (`profile`)**: Avatar R2, slug, título, bio.
  - **Tab 2 (`links`)**: Creador de `Enlace` (con switch `+18`), `Añadir Título` y `Añadir Texto`; lista **"Tus Enlaces Configurados"** con **Drag-and-Drop** (HTML5 + botones subir/bajar), edición inline, toggle `+18`, activar/desactivar y eliminar. El límite `max_links` solo restringe bloques `block_type === 'link'`.
  - **Tab 3 (`design`)**: Gradientes personalizados gratis, gradientes con vista previa en botón (5 Gratis + 31 PRO incluyendo 26 móviles `anim_*`), imágenes prediseñadas/R2/filtros, videos R2, estilos de botones con vista previa animada en botón (4 Gratis + 35 PRO incluyendo 25 animados/iluminados), 20 estilos tipográficos PRO, fuentes Google Fonts con vista previa real antes de seleccionar, y 14 efectos visuales de texto PRO animados/iluminados con vista previa en vivo.
  - **Tab 4 (`plan`)**: Progreso suscripción, canje de tickets, declaración de pagos BCV/USD e historial.
- `src/app/[slug]/page.tsx`: Página pública SSR + pantalla de bloqueo si `is_disabled = 1` con `disabled_reason` + carga dinámica de bloques mediante `LandingBlocksRenderer`.
- `src/app/super-admin/page.tsx`: Aprobación de pagos, gestión usuarios/suscripciones (incluyendo PRO Ilimitado), control/deshabilitación de perfiles con motivo, métodos de pago, matriz de planes, bancos y tickets.

---

## 4. Componentes y Librerías Compartidas Clave

- **`src/lib/design-catalog.ts`**: Única fuente de verdad para:
  - `FREE_GRADIENTS`, `PRO_GRADIENTS`, `getGradientClass()`
  - `FREE_BUTTON_STYLES`, `PRO_BUTTON_STYLES`, `resolveButtonPresentation()`
  - `FREE_TEXT_STYLES`, `PRO_TEXT_STYLES`, `resolveTextTypography()`
  - `GOOGLE_FONTS_CATALOG`, `resolveFontFamilyCss()` (sincronizado con Google Fonts `<link>` en `src/app/layout.tsx`)
  - `TEXT_EFFECTS_CATALOG`, `resolveTextEffect()`
  - `resolveImageFilterStyle()`
- **`src/app/globals.css`**: Todos los `@keyframes` y clases `.bg-anim-*`, `.btn-moving-light-*`, `.btn-anim-*`, `.btn-fx-*`, `.text-fx-*`, `.typo-pro-*`.
- **`src/components/LandingBlocksRenderer.tsx`**: Renderizado unificado de `link` / `title` / `text` + intercepción de enlaces `+18` para `PhonePreview.tsx` y `[slug]/page.tsx`.
- **`src/components/AdultWarningModal.tsx`**: Modal de advertencia de contenido para mayores de 18 años (+18).
- **`src/components/PhonePreview.tsx`**: Simulador móvil en vivo del dashboard.

---

## 5. Mapa de API Endpoints (`src/app/api/`)

- `/api/landing`: `GET` (usuario, plan efectivo, landings, links), `POST` (crear perfil según `max_landing_pages`), `PUT` (guardar perfil/diseño), `DELETE` (eliminar perfil no principal).
- `/api/links`: `POST` (crear `link`/`title`/`text` + `is_adult`), `PUT` (editar item / toggles), `PATCH` (reordenamiento batch `ordered_ids` en `position`), `DELETE`.
- `/api/upload`: `POST` (subida a Cloudflare R2).
- `/api/payments`: `GET`, `POST` (declarar pago).
- `/api/tickets/redeem`: `POST` (canjear ticket PRO).
- `/api/bcv`: `GET`.
- `/api/banks`: `GET`, `POST`, `PUT`, `DELETE`.
- `/api/super-admin/*`:
  - `plans` (`GET`, `PUT`)
  - `users` (`GET`, `PUT`)
  - `payments` (`GET`, `PUT`)
  - `payment-methods` (`GET`, `POST`, `PUT`, `DELETE`)
  - `discounts` (`GET`, `PUT`)
  - `tickets` (`GET`, `POST`, `DELETE`)
  - `landings` (`GET`, `PUT`, `DELETE`)
