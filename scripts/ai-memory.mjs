#!/usr/bin/env node
/**
 * scripts/ai-memory.mjs
 * Herramienta CLI liviana (cero dependencias externas) para mantener sincronizado
 * el estado, la fase del proyecto, los recursos y la bitácora entre cualquier IA y sesión.
 *
 * Uso:
 *   npm run ai:status
 *   npm run ai:snapshot
 *   npm run ai:phase -- --name "Fase 4" --status "Completada" --progress "100%" --next "Analítica de clics"
 *   npm run ai:log -- --title "Título" --request "Resumen" --files "a.ts,b.ts" --db "Sin cambios" --validation "tsc OK"
 */

import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const ROOT = process.cwd();
const STATE_PATH = path.join(ROOT, ".ai-state.json");
const VITACORA_PATH = path.join(ROOT, "vitacora.md");
const RECURSOS_PATH = path.join(ROOT, "recursos.md");
const CHANGELOG_PATH = path.join(ROOT, "AI_CHANGELOG.md");

function readJson(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n", "utf8");
}

function getTodayIso() {
  return new Date().toISOString().slice(0, 10);
}

function getGitInfo() {
  try {
    const branch = execSync("git rev-parse --abbrev-ref HEAD", { cwd: ROOT, stdio: ["ignore", "pipe", "ignore"] })
      .toString()
      .trim();
    const commit = execSync("git rev-parse --short HEAD", { cwd: ROOT, stdio: ["ignore", "pipe", "ignore"] })
      .toString()
      .trim();
    const dirty = execSync("git status --porcelain", { cwd: ROOT, stdio: ["ignore", "pipe", "ignore"] })
      .toString()
      .trim().length > 0;
    return { branch, commit, dirty };
  } catch {
    return { branch: "unknown", commit: "unknown", dirty: false };
  }
}

function walkFiles(dir, predicate, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (["node_modules", ".next", ".git"].includes(entry.name)) continue;
      walkFiles(full, predicate, out);
    } else if (predicate(full)) {
      out.push(path.relative(ROOT, full).replace(/\\/g, "/"));
    }
  }
  return out.sort();
}

function scanProjectInventory() {
  const uiPages = walkFiles(path.join(ROOT, "src/app"), (f) => f.endsWith("/page.tsx") || f.endsWith("\\page.tsx"));
  const apiRoutes = walkFiles(path.join(ROOT, "src/app/api"), (f) => f.endsWith("/route.ts") || f.endsWith("\\route.ts"));
  const libFiles = walkFiles(path.join(ROOT, "src/lib"), (f) => f.endsWith(".ts") || f.endsWith(".tsx"));
  const components = walkFiles(path.join(ROOT, "src/components"), (f) => f.endsWith(".ts") || f.endsWith(".tsx"));

  let tables = [];
  const schemaPath = path.join(ROOT, "src/db/schema.ts");
  if (fs.existsSync(schemaPath)) {
    const schemaText = fs.readFileSync(schemaPath, "utf8");
    const matches = [...schemaText.matchAll(/CREATE TABLE IF NOT EXISTS\s+([a-zA-Z0-9_]+)/g)];
    tables = [...new Set(matches.map((m) => m[1]))];
  }

  const pagePaths = uiPages.map((p) => {
    const route = p.replace(/^src\/app/, "").replace(/\/page\.tsx$/, "") || "/";
    return { route, file: p };
  });

  const apiPaths = apiRoutes.map((p) => {
    const route = p.replace(/^src\/app/, "").replace(/\/route\.ts$/, "");
    return { route, file: p };
  });

  return {
    ui_pages: pagePaths,
    api_routes: apiPaths,
    lib_files: libFiles,
    components,
    db_tables: tables,
    scanned_at: new Date().toISOString(),
  };
}

function replaceMarkedSection(filePath, startMarker, endMarker, replacementBody) {
  if (!fs.existsSync(filePath)) return false;
  const content = fs.readFileSync(filePath, "utf8");
  const startIdx = content.indexOf(startMarker);
  const endIdx = content.indexOf(endMarker);
  if (startIdx === -1 || endIdx === -1 || endIdx < startIdx) return false;
  const updated =
    content.slice(0, startIdx + startMarker.length) +
    "\n" +
    replacementBody.trim() +
    "\n" +
    content.slice(endIdx);
  fs.writeFileSync(filePath, updated, "utf8");
  return true;
}

function parseFlags(argv) {
  const flags = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith("--")) {
      const key = arg.slice(2);
      const next = argv[i + 1];
      if (next && !next.startsWith("--")) {
        flags[key] = next;
        i++;
      } else {
        flags[key] = "true";
      }
    }
  }
  return flags;
}

function runStatus() {
  const state = readJson(STATE_PATH, null);
  const git = getGitInfo();
  if (!state) {
    console.log("No existe .ai-state.json. Ejecuta: npm run ai:snapshot");
    return;
  }

  console.log("=== LINKBIO VE — RESUMEN COMPACTO PARA IA (AHORRO DE TOKENS) ===");
  console.log(`Fase Actual : ${state.current_phase?.name || "N/A"} [${state.current_phase?.status || "N/A"} - ${state.current_phase?.progress || "N/A"}]`);
  console.log(`Git         : rama=${git.branch} commit=${git.commit} cambios_locales=${git.dirty ? "SI" : "NO"}`);
  console.log(`Último Log  : [${state.last_intervention?.date || "N/A"}] ${state.last_intervention?.title || "N/A"}`);
  console.log(`Resumen     : ${state.last_intervention?.summary || "N/A"}`);
  console.log(`Validación  : ${state.last_intervention?.validation || "N/A"}`);
  console.log(`Siguiente   : ${state.current_phase?.next_step || "Definir con usuario"}`);
  if (state.inventory) {
    console.log(
      `Inventario  : ${state.inventory.ui_pages?.length || 0} páginas UI | ${state.inventory.api_routes?.length || 0} endpoints API | ${state.inventory.db_tables?.length || 0} tablas Turso`
    );
  }
  console.log("Archivos clave de lectura rápida: agent.md -> vitacora.md -> recursos.md -> AI_CONTEXT.md");
}

function runSnapshot() {
  const existing = readJson(STATE_PATH, {
    project: "LinkBio VE (landingpages)",
    current_phase: {
      name: "Fase 4 — Super Admin Multi-Ruta, API Externa Masiva y Optimización de Velocidad",
      status: "Completada",
      progress: "100%",
      next_step: "Definir Fase 5 (Analítica de clics, Webhooks o Dominios personalizados)",
    },
    last_intervention: {
      date: getTodayIso(),
      title: "Snapshot inicial",
      summary: "Sincronización de inventario de recursos",
      validation: "Pendiente",
    },
  });

  const inventory = scanProjectInventory();
  existing.inventory = inventory;
  existing.updated_at = new Date().toISOString();
  writeJson(STATE_PATH, existing);

  // Sync auto-maintained block in recursos.md
  const routeLines = [
    `- **Páginas UI (${inventory.ui_pages.length})**: ${inventory.ui_pages.map((p) => `\`${p.route}\``).join(", ")}`,
    `- **API Routes (${inventory.api_routes.length})**: ${inventory.api_routes.map((a) => `\`${a.route}\``).join(", ")}`,
    `- **Tablas Turso DB (${inventory.db_tables.length})**: ${inventory.db_tables.map((t) => `\`${t}\``).join(", ")}`,
    `- **Librerías compartidas (\`src/lib/\`)**: ${inventory.lib_files.map((f) => `\`${f}\``).join(", ")}`,
    `- **Componentes (\`src/components/\`)**: ${inventory.components.map((f) => `\`${f}\``).join(", ")}`,
    `- _Actualizado automáticamente por \`npm run ai:snapshot\` el ${getTodayIso()}_`,
  ].join("\n");

  const updatedRecursos = replaceMarkedSection(
    RECURSOS_PATH,
    "<!-- AUTO:ROUTES:START -->",
    "<!-- AUTO:ROUTES:END -->",
    routeLines
  );

  console.log(
    `✅ Snapshot guardado en .ai-state.json (${inventory.ui_pages.length} páginas, ${inventory.api_routes.length} APIs, ${inventory.db_tables.length} tablas).`
  );
  if (updatedRecursos) {
    console.log("✅ Bloque auto-mantenido de recursos.md actualizado.");
  }
}

function runPhase(flags) {
  const state = readJson(STATE_PATH, { project: "LinkBio VE (landingpages)", current_phase: {} });
  const prev = state.current_phase || {};

  state.current_phase = {
    name: flags.name || prev.name || "Fase en curso",
    status: flags.status || prev.status || "En progreso",
    progress: flags.progress || prev.progress || "0%",
    next_step: flags.next || prev.next_step || "Pendiente",
    updated_at: getTodayIso(),
  };
  state.updated_at = new Date().toISOString();
  writeJson(STATE_PATH, state);

  const phaseMarkdown = [
    `- **Fase Activa**: ${state.current_phase.name}`,
    `- **Estado**: ${state.current_phase.status} (${state.current_phase.progress})`,
    `- **Última Actualización**: ${state.current_phase.updated_at}`,
    `- **Próximo Paso Sugerido**: ${state.current_phase.next_step}`,
  ].join("\n");

  replaceMarkedSection(
    VITACORA_PATH,
    "<!-- AUTO:PHASE:START -->",
    "<!-- AUTO:PHASE:END -->",
    phaseMarkdown
  );

  console.log(`✅ Fase actualizada: ${state.current_phase.name} (${state.current_phase.status} - ${state.current_phase.progress})`);
}

function runLog(flags) {
  const title = flags.title;
  if (!title) {
    console.error("Error: --title es obligatorio. Ejemplo: npm run ai:log -- --title \"Fix login\" --request \"...\" --files \"a.ts\" --validation \"tsc OK\"");
    process.exit(1);
  }

  const date = flags.date || getTodayIso();
  const request = flags.request || title;
  const files = (flags.files || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const db = flags.db || "Sin cambios en esquema DB";
  const validation = flags.validation || "npx tsc --noEmit -> OK";

  const state = readJson(STATE_PATH, { project: "LinkBio VE (landingpages)" });
  state.last_intervention = {
    date,
    title,
    summary: request,
    files,
    db,
    validation,
  };
  state.updated_at = new Date().toISOString();
  writeJson(STATE_PATH, state);

  const filesBullets =
    files.length > 0
      ? files.map((f) => `  - \`${f}\``).join("\n")
      : "  - (ver git diff)";

  const entryBlock = `\n### [${date}] — ${title}\n- **Solicitud**: ${request}\n- **Archivos modificados/creados**:\n${filesBullets}\n- **DB / API**: ${db}\n- **Validación**: ${validation}\n`;

  const prependAfterMarker = (filePath, marker) => {
    if (!fs.existsSync(filePath)) return false;
    const raw = fs.readFileSync(filePath, "utf8");
    // Match standalone line marker so inline backtick mentions in prose are ignored
    const lineRegex = new RegExp(`^${marker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\r?$`, "m");
    const match = lineRegex.exec(raw);
    if (!match) return false;
    const insertPos = match.index + match[0].length;
    const next =
      raw.slice(0, insertPos) +
      "\n" +
      entryBlock +
      raw.slice(insertPos);
    fs.writeFileSync(filePath, next, "utf8");
    return true;
  };

  const okLog = prependAfterMarker(CHANGELOG_PATH, "<!-- NUEVAS INTERVENCIONES AQUÍ -->");
  const okVit = prependAfterMarker(VITACORA_PATH, "<!-- NUEVAS ENTRADAS VITACORA AQUÍ -->");

  console.log(`✅ Intervención registrada: [${date}] ${title} (AI_CHANGELOG=${okLog ? "OK" : "SKIP"}, vitacora=${okVit ? "OK" : "SKIP"})`);
}

const [, , command = "status", ...rest] = process.argv;
const flags = parseFlags(rest);

switch (command) {
  case "status":
    runStatus();
    break;
  case "snapshot":
    runSnapshot();
    break;
  case "phase":
    runPhase(flags);
    break;
  case "log":
    runLog(flags);
    break;
  default:
    console.log("Comandos disponibles: status | snapshot | phase | log");
    process.exit(1);
}
