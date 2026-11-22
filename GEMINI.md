# GEMINI.md — Reglas del Repositorio

Sigue estrictamente todas las reglas definidas en [`AGENTS.md`](./AGENTS.md) y [`agent.md`](./agent.md):

1. **Inicio de sesión (ahorro de tokens)**: Ejecuta `npm run ai:status` o lee [`vitacora.md`](./vitacora.md), [`recursos.md`](./recursos.md) y [`AI_CONTEXT.md`](./AI_CONTEXT.md) antes de escanear el proyecto.
2. **Cierre obligatorio de cada intervención**: Ejecuta `npm run ai:snapshot`, registra tus últimos cambios en [`vitacora.md`](./vitacora.md) y [`AI_CHANGELOG.md`](./AI_CHANGELOG.md), y actualiza [`AI_CONTEXT.md`](./AI_CONTEXT.md) si modificaste el esquema de base de datos, endpoints o módulos clave.
