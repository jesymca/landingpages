import { ExternalApiScope } from "@/db/schema";

export const ALL_API_SCOPES: ExternalApiScope[] = [
  "profiles:create",
  "profiles:bulk",
  "profiles:read",
  "profiles:update",
  "profiles:delete",
];

export const SCOPE_DESCRIPTIONS: Record<ExternalApiScope, string> = {
  "profiles:create": "Crear perfiles individuales y auto-registrar usuarios",
  "profiles:bulk": "Creación masiva automatizada por lotes (/profiles/bulk)",
  "profiles:read": "Consultar y listar perfiles existentes",
  "profiles:update": "Actualizar diseño, datos y enlaces de perfiles por slug",
  "profiles:delete": "Eliminar perfiles permanentemente vía API",
};

export function buildAiIntegrationPrompt(baseUrl: string): string {
  const cleanBase = (baseUrl || "https://TU-DOMINIO.com").replace(/\/+$/, "");
  return `Actúa como un Ingeniero Backend/Integraciones experto. Necesito conectar mi plataforma externa con el generador de Landing Pages "LinkBio VE" para crear y masificar perfiles automáticamente mediante su API REST v1.

=== CONFIGURACIÓN BASE ===
- Base URL: ${cleanBase}
- Autenticación obligatoria (usa cualquiera de estos dos headers):
  Authorization: Bearer <TU_API_KEY>
  o
  X-API-Key: <TU_API_KEY>
- Content-Type: application/json
- NOTA DE SEGURIDAD: Guarda la API Key en una variable de entorno (ej. LINKBIO_API_KEY) y nunca la expongas en código cliente público.

=== ENDPOINTS DISPONIBLES ===

1) Verificar conexión y descubrir catálogo de diseño (gradientes, botones, fuentes, efectos):
   GET ${cleanBase}/api/v1/health

2) Crear un perfil individual (crea el usuario automáticamente si no existe y retorna credenciales + URL pública):
   POST ${cleanBase}/api/v1/profiles
   Body JSON:
   {
     "email": "cliente@dominio.com",
     "name": "Nombre del Cliente",
     "password": "opcional_min_6_chars",
     "slug": "mi-negocio-ve",
     "title": "Mi Negocio Oficial",
     "bio": "Catálogo, WhatsApp y redes oficiales",
     "avatar_url": "https://...",
     "background_type": "gradient",
     "background_url": "from-slate-900 via-indigo-950 to-slate-900",
     "theme_config": {
       "button_style": "rounded",
       "button_bg": "#4f46e5",
       "button_text_color": "#ffffff",
       "text_color": "#ffffff",
       "font_family": "Inter",
       "text_style": "normal",
       "text_effect": "none",
       "card_glass": true,
       "social_links": {
         "instagram": "https://instagram.com/tunegocio",
         "whatsapp": "https://wa.me/584120000000"
       }
     },
     "links": [
       { "block_type": "title", "title": "Canales Oficiales" },
       { "block_type": "link", "title": "Escríbenos por WhatsApp", "url": "https://wa.me/584120000000", "icon": "whatsapp", "is_adult": false },
       { "block_type": "text", "title": "Horario", "content": "Lunes a Sábado 8am - 6pm" }
     ],
     "reuse_existing_user": true,
     "auto_deduplicate_slug": true,
     "dry_run": false
   }

3) CREACIÓN MASIVA / AUTOMATIZADA POR LOTES (hasta 100 perfiles por petición):
   POST ${cleanBase}/api/v1/profiles/bulk
   Body JSON:
   {
     "dry_run": false,
     "reuse_existing_user": true,
     "auto_deduplicate_slug": true,
     "defaults": {
       "background_type": "gradient",
       "background_url": "from-slate-900 via-indigo-950 to-slate-900",
       "theme_config": { "button_style": "glass", "font_family": "Poppins" }
     },
     "profiles": [
       {
         "email": "usuario1@ejemplo.com",
         "name": "Tienda Uno",
         "slug": "tienda-uno",
         "title": "Tienda Uno",
         "bio": "Envíos a toda Venezuela",
         "links": [
           { "title": "Catálogo", "url": "https://tiendauno.com", "icon": "shopping-bag" }
         ]
       },
       {
         "email": "usuario2@ejemplo.com",
         "name": "Tienda Dos",
         "title": "Tienda Dos",
         "links": [
           { "title": "Instagram", "url": "https://instagram.com/tiendados", "icon": "instagram" }
         ]
       }
     ]
   }

   Respuesta esperada:
   {
     "ok": true,
     "dry_run": false,
     "summary": { "requested": 2, "created": 2, "updated": 0, "failed": 0 },
     "results": [
       {
         "index": 0,
         "status": "created",
         "user_id": "usr_...",
         "user_created": true,
         "email": "usuario1@ejemplo.com",
         "generated_password": "Lbv!...",
         "landing_id": "land_...",
         "slug": "tienda-uno",
         "public_url": "${cleanBase}/tienda-uno",
         "dashboard_url": "${cleanBase}/dashboard",
         "login_url": "${cleanBase}/auth/login",
         "plan_id": "GRATIS",
         "links_created": 1
       }
     ],
     "errors": []
   }

4) Consultar perfiles existentes:
   GET ${cleanBase}/api/v1/profiles?email=usuario1@ejemplo.com&limit=50&offset=0

5) Leer o actualizar un perfil específico por slug:
   GET ${cleanBase}/api/v1/profiles/<slug>
   PUT ${cleanBase}/api/v1/profiles/<slug>
   (acepta title, bio, avatar_url, background_type, background_url, theme_config, replace_links o append_links)

=== REQUISITOS DE IMPLEMENTACIÓN QUE DEBES GENERAR ===
1. Crea un cliente HTTP reutilizable (en el lenguaje de mi proyecto) con reintentos exponenciales ante HTTP 429/5xx.
2. Si tengo más de 100 usuarios, divide automáticamente el arreglo en lotes (chunks) de 50-100 registros hacia POST /api/v1/profiles/bulk.
3. Implementa primero una prueba con "dry_run": true antes de ejecutar la carga real.
4. Almacena o envía a cada usuario nuevo su 'public_url', 'login_url', 'email' y 'generated_password' (solo se retorna cuando 'user_created' es true).
5. Maneja respuestas parciales revisando tanto 'results' como 'errors' sin abortar todo el proceso.`;
}
