# vitacora.md — Estado, Fases del Proyecto y Bitácora de Avances

> **Lectura rápida para cualquier IA**: Este archivo te dice exactamente en qué fase está el proyecto, qué ya se construyó, qué fue lo último realizado y qué errores evitar. Mantener actualizado usando `npm run ai:phase` y `npm run ai:log`.

---

## 1. Estado Actual del Proyecto
<!-- AUTO:PHASE:START -->
- **Fase Activa**: Fase 4 — Memoria IA, Super Admin Multi-Ruta, API Externa Masiva v1 y Optimización de Velocidad
- **Estado**: Completada (100%)
- **Última Actualización**: 2026-11-22
- **Próximo Paso Sugerido**: Fase 5 — Analítica de clics por enlace, Webhooks salientes API y Dominios Personalizados
<!-- AUTO:PHASE:END -->

---

## 2. Mapa de Fases del Proyecto (Roadmap)

| Fase | Nombre | Estado | Hitos Clave Entregados |
| :--- | :--- | :--- | :--- |
| **Fase 1** | **MVP SaaS LinkBio VE** | ✅ Completada | Auth Google/Credenciales, Turso DB, editor split-screen + `PhonePreview`, Cloudflare R2, pagos VES/USD con tasa BCV y roles `ADMIN`/`SUPER_ADMIN`. |
| **Fase 2** | **Escalamiento Comercial y Control Admin** | ✅ Completada | Multi-perfil según `max_landing_pages`, eliminación de perfiles secundarios, suscripciones multimes con descuentos, tickets canjeables, PRO Ilimitado y deshabilitación de perfiles con motivo. |
| **Fase 3** | **Estudio Visual PRO y Bloques Avanzados** | ✅ Completada | Catálogo central `design-catalog.ts` (+31 gradientes móviles PRO, +35 estilos de botones animados/iluminados, 20 estilos tipográficos PRO, 17 fuentes Google con preview, 14 efectos de texto), Drag & Drop de enlaces, bloques `Título`/`Texto` y enlaces `+18`. |
| **Fase 4** | **Memoria IA, Super Admin Multi-Vista, API Masiva v1 y Velocidad** | ✅ Completada | Toolkit `agent.md`/`recursos.md`/`vitacora.md`/`scripts/ai-memory.mjs`; `/super-admin/*` dividido en 9 rutas independientes con layout persistente; Zona API Externa (`/super-admin/api_externa`) + `/api/v1/*` masivo + prompt maestro para otra IA; eliminación de cuellos de botella de navegación (JWT sin DB query, caché RAM TTL, queries paralelas y carga diferida). |
| **Fase 5** | **Analítica, Webhooks y Crecimiento** | ⏳ Pendiente (Propuesta) | Métricas de visitas y clics por botón, webhooks salientes cuando un perfil es creado/editado, dominios personalizados y exportación CSV masiva. |

---

## 3. Decisiones Arquitectónicas y Trampas ya Resueltas (NO REINTRODUCIR)
1. **Cero queries DB en `callbacks.session` (`src/lib/auth.ts`)**: Antes cada navegación y cada API route hacía un `SELECT slug` remoto en Turso dentro de `getServerSession()`. Ahora `slug` viaja dentro del JWT.
2. **Sin cascadas secuenciales de `fetch()`**: `/super-admin` hacía 9 `await fetch(...)` en serie. Ahora cada ruta (`/super-admin/pagos`, `/usuarios`, `/perfiles`, etc.) solo pide sus propios datos y comparte un único `GET /api/super-admin/summary` persistente.
3. **BCV protegido con caché + timeout**: `/api/bcv` usa caché RAM de 30 min, `AbortSignal.timeout(2500)` y escritura a Turso no bloqueante para que la red externa nunca trabe la navegación.
4. **Dashboard con ruta crítica limpia**: `/dashboard` renderiza apenas termina `/api/landing` y carga pagos/bancos/BCV/descuentos en segundo plano sin bloquear el editor.
5. **Auto-migración paralela e idempotente**: `ensurePaymentColumns()` usa promesa compartida (`__linkbioSchemaPromise`) y `Promise.allSettled()` + índices SQLite.

---

## 4. Bitácora Cronológica de Intervenciones
<!-- NUEVAS ENTRADAS VITACORA AQUÍ -->

### [2026-11-22] — Herramientas Memoria IA, Super Admin Multi-Ruta, API Externa Masiva v1 y Optimización de Navegación
- **Solicitud**: Crear agent.md/recursos.md/vitacora.md y CLI ai:*, separar /super-admin en rutas dedicadas, habilitar zona API Externa masiva + prompt IA, y eliminar retardos de navegación
- **Archivos modificados/creados**:
  - `agent.md`
  - `recursos.md`
  - `vitacora.md`
  - `API_INTEGRATION_PROMPT.md`
  - `scripts/ai-memory.mjs`
  - `src/lib/cache.ts`
  - `src/lib/auth.ts`
  - `src/lib/external-api.ts`
  - `src/lib/external-api-prompt.ts`
  - `src/db/schema.ts`
  - `src/db/index.ts`
  - `src/app/providers.tsx`
  - `src/app/page.tsx`
  - `src/app/dashboard/page.tsx`
  - `src/app/[slug]/page.tsx`
  - `src/app/api/bcv/route.ts`
  - `src/app/api/landing/route.ts`
  - `src/app/api/super-admin/summary/route.ts`
  - `src/app/api/super-admin/api-keys/route.ts`
  - `src/app/api/v1/*`
  - `src/components/super-admin/SuperAdminShell.tsx`
  - `src/app/super-admin/**`
- **DB / API**: Tablas api_keys y api_logs + índices SQLite en ensurePaymentColumns(); nuevos endpoints /api/super-admin/summary, /api/super-admin/api-keys, /api/v1/health, /api/v1/profiles, /api/v1/profiles/bulk, /api/v1/profiles/[slug]
- **Validación**: npx tsc --noEmit -> exit 0; npm run build -> exit 0 (22/22 routes)


### [2026-11-16] — Catálogo Visual PRO Ampliado, Drag & Drop, Bloques Título/Texto y +18
- **Resumen**: Drag-and-drop en enlaces, bloques `title`/`text`, advertencia `+18`, catálogo unificado `design-catalog.ts` con +20 gradientes móviles, +20 botones animados, 20 estilos tipográficos PRO, vista previa real de Google Fonts y +10 efectos visuales de texto.
- **Validación**: `npx tsc --noEmit` OK · `npm run build` OK.
