# agent.md — Puerta de Entrada Rápida para Cualquier IA (Ahorro Máximo de Tokens)

> Este archivo es el resumen operativo ultracompacto sincronizado con [`AGENTS.md`](./AGENTS.md). Cualquier IA (Gemini, Claude, ChatGPT, Codex, Cursor, Windsurf, etc.) debe seguir este protocolo de 3 pasos.

---

## 1. Inicio de Sesión (Menos de 500 tokens de contexto)

**NO escanees todo el proyecto ni leas archivos largos de UI primero.** Haz esto en orden:

1. Ejecuta `npm run ai:status` (devuelve en ~15 líneas la fase actual, último cambio y estado git) **o** lee el encabezado de [`vitacora.md`](./vitacora.md).
2. Lee [`recursos.md`](./recursos.md) para ver todas las rutas UI, endpoints API, tablas Turso, variables de entorno y librerías compartidas.
3. Si necesitas detalles finos de esquema/catálogo visual, lee [`AI_CONTEXT.md`](./AI_CONTEXT.md) y las primeras ~80 líneas de [`AI_CHANGELOG.md`](./AI_CHANGELOG.md).
4. Solo entonces lee las líneas específicas del archivo que vas a editar.

---

## 2. Reglas Técnicas Inquebrantables

- **Idioma UI / Mensajes**: Español (`es`).
- **Base de Datos**: Turso (`@libsql/client`) con auto-migración idempotente y paralela en `src/db/index.ts` (`ensurePaymentColumns()`).
- **Rendimiento**:
  - NUNCA hagas consultas a DB dentro de `callbacks.session` en `src/lib/auth.ts` (usa el JWT).
  - NUNCA encadenes múltiples `await fetch(...)` secuenciales en UI (usa `Promise.all` o carga diferida).
  - Usa `src/lib/cache.ts` para catálogos semi-estáticos e invalida en `POST`/`PUT`/`DELETE`.
- **Fuente Única Visual**: Toda fuente, gradiente, botón o efecto vive en `src/lib/design-catalog.ts` y `src/app/globals.css`.
- **API Externa v1**: Toda lógica de aprovisionamiento masivo vive en `src/lib/external-api.ts` y el prompt de integración en `src/lib/external-api-prompt.ts` / `API_INTEGRATION_PROMPT.md`.

---

## 3. Cierre Obligatorio Post-Intervención

Antes de entregar tu respuesta final al usuario, actualiza la memoria del proyecto:

```bash
# 1. Validar tipos (y build de producción)
npx tsc --noEmit

# 2. Actualizar inventario automático de rutas/APIs/tablas (recursos.md + .ai-state.json)
npm run ai:snapshot

# 3. Registrar lo último realizado en vitacora.md + AI_CHANGELOG.md + .ai-state.json
npm run ai:log -- --title "<Título>" --request "<Resumen>" --files "<archivos separados por coma>" --db "<cambios DB/API>" --validation "<resultado tsc/build>"

# 4. Si avanzó la fase del proyecto, actualizarla:
npm run ai:phase -- --name "Fase X — ..." --status "En progreso|Completada" --progress "XX%" --next "<próximo paso>"
```

Si cambiaste arquitectura, tablas nuevas o endpoints nuevos, actualiza también [`AI_CONTEXT.md`](./AI_CONTEXT.md).
