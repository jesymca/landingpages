# AGENTS.md — Instrucciones Globales y Protocolo de Memoria para Cualquier IA

Este repositorio cuenta con un sistema de memoria persistente en archivos `.md` diseñado para **ahorrar tokens**, evitar exploraciones repetitivas del codebase y garantizar continuidad exacta entre distintas IAs o sesiones.

---

## ⚡ 1. Regla de Lectura Rápida (Ahorro Máximo de Tokens)

Antes de ejecutar búsquedas globales (`find`, `grep` amplio o leer archivos largos de UI como `src/app/dashboard/page.tsx` o `src/app/super-admin/page.tsx`), **toda IA DEBE leer en este orden**:

1. `AI_CONTEXT.md` — Mapa compacto de arquitectura, base de datos Turso, migraciones automáticas, API routes, flags de planes y catálogo de diseño.
2. `AI_CHANGELOG.md` (primeras ~120 líneas) — Últimas ediciones realizadas, archivos tocados y estado actual del build.
3. Leer únicamente las líneas específicas de los archivos relacionados con la tarea.

---

## 📝 2. Regla Obligatoria Post-Intervención (Actualizar Últimas Ediciones)

**INSTRUCCIÓN PERMANENTE PARA CUALQUIER IA:**
Al finalizar **CADA intervención** (feature, bugfix, refactor o cambio de esquema), antes de entregar la respuesta final al usuario, la IA **DEBE**:

1. **Insertar una entrada nueva al principio de `AI_CHANGELOG.md`** (debajo de `<!-- NUEVAS INTERVENCIONES AQUÍ -->`) siguiendo exactamente la plantilla compacta (fecha, objetivo, archivos modificados, símbolos/endpoints/columnas afectadas y resultado real de `npx tsc --noEmit` / `npm run build`).
2. **Actualizar `AI_CONTEXT.md`** únicamente si cambiaron tablas/columnas de DB, endpoints API, flags de `PlanFeatures`, rutas nuevas o catálogos compartidos.
3. **No duplicar explicaciones extensas**: usar viñetas técnicas concretas con rutas y nombres exactos para mantener el archivo liviano en tokens.

---

## 🛠️ Convenciones Críticas del Proyecto

- **Idioma UI y mensajes**: Español (`es`).
- **Base de datos**: Turso (`@libsql/client`) inicializada en `src/db/index.ts`. Cualquier columna nueva en tablas existentes debe agregarse de forma idempotente en `ensurePaymentColumns()` (`ALTER TABLE ... .catch(() => {})`).
- **Build y Validación**: `next/font/google` descarga `Inter` durante `npm run build` (requiere red si no hay caché). Usar `npx tsc --noEmit` para chequeo de tipos rápido offline y `npm run build` para validación final de producción.
- **Fuente única de estilos visuales**: Toda nueva fuente, gradiente, estilo de botón o efecto de texto debe vivir en `src/lib/design-catalog.ts` y `src/app/globals.css` (nunca duplicar lógica entre `dashboard/page.tsx`, `PhonePreview.tsx` y `[slug]/page.tsx`).

---

## 📋 Instrucción Lista para Copiar (Si necesitas recordárselo a otro chat)

> "Antes de tocar código, lee `AGENTS.md`, `AI_CONTEXT.md` y el inicio de `AI_CHANGELOG.md` para ahorrar tokens. Al terminar tu intervención, actualiza obligatoriamente `AI_CHANGELOG.md` (y `AI_CONTEXT.md` si cambia arquitectura/DB/APIs) con las últimas ediciones realizadas."
