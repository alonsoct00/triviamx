# Trivia MX

Web App **Mobile First** en español (México) para administrar concursos de preguntas y respuestas al estilo Preguntados, Jeopardy!, Pasapalabra y ¿Quién quiere ser millonario?

La app está pensada para el **moderador** (árbitro/conductor) que lee las preguntas y controla la partida — no para los participantes — con una modalidad extra tipo **Kahoot** ("Jugar en grupo") donde los invitados sí participan desde su celular con un código y un nickname.

---

## Características principales

- **Banco de preguntas compartido** (~350+) con categorías, niveles, opciones múltiples y explicaciones.
- **Generación con IA** vía Lovable AI Gateway (Gemini / GPT) para crear preguntas nuevas por categoría y nivel.
- **Importador desde la web**: pegas una URL (Wikipedia, enciclopedias, sitios de trivia) y la IA extrae preguntas automáticamente. Incluye presets.
- **Partida clásica de moderador**: multi-selección de categorías/niveles, cronómetro con fases (leer → corriendo → tiempo fuera → revelada), modo presentador a pantalla completa, sonidos y vibración.
- **Persistencia**: historial de partidas por usuario, respuestas registradas, tiempos y estadísticas.
- **Jugar en grupo (Kahoot-like)**: el anfitrión crea una sala con código de 6 caracteres, los invitados entran por link sin registro con solo un nickname, gana el más rápido en responder correctamente.
- **Cuentas y roles**:
  - `admin` (primer registro): gestiona el banco de preguntas.
  - `moderator`: juega y ve solo su propio historial.
- **Autenticación**: email/contraseña con confirmación obligatoria + Google OAuth. HIBP activado (bloquea contraseñas filtradas). Recuperación de contraseña por email.
- **Administración de cuenta**: cambiar email, cambiar contraseña, cerrar sesión.
- **PWA**: manifest, robots.txt, sitemap.

---

## Stack técnico

- **Frontend**: React 19 + TanStack Start v1 (SSR/SSG) + Vite 7
- **Estilos**: Tailwind CSS v4 con tokens semánticos (dirección de diseño _Neon Console_: dark mode, acentos neón cian/magenta/lima, tipografía Space Grotesk)
- **Ruteo**: file-based routing en `src/routes/`
- **Backend**: Lovable Cloud (Supabase) — Postgres + Auth + RLS
- **Runtime servidor**: Cloudflare Workers (edge) vía `createServerFn` de TanStack
- **IA**: Lovable AI Gateway (sin API key propia)

---

## Estructura de rutas

```
/                          → Dashboard (autenticado)
/auth                      → Login / registro / olvidé contraseña
/reset-password            → Restablecer contraseña desde email
/cuenta                    → Administrar cuenta
/banco                     → Banco de preguntas (admin edita)
/ia                        → Generar preguntas con IA
/importar                  → Importar desde URLs de la web
/partida/nueva             → Configurar partida de moderador
/partida/jugar             → Ejecutar partida
/historial                 → Historial personal
/estadisticas              → Estadísticas por categoría
/ajustes                   → Sonido, vibración, etc.
/sala/nueva                → Crear sala grupal (anfitrión)
/sala/host/:codigo         → Panel del anfitrión
/sala/:codigo              → Unirse como invitado (público)
/sala/:codigo/jugar        → Jugar como invitado (público)
```

---

## Arquitectura de datos

Tablas en `public`:

- `preguntas` — banco compartido (lectura para todos los autenticados, escritura solo admin).
- `partidas` / `partida_preguntas` — historial privado por `user_id`.
- `salas` / `sala_jugadores` / `sala_respuestas` — modo grupal en tiempo real (polling ~1.2s).
- `user_roles` — enum `app_role` (`admin` | `moderator`) + función `has_role` con `SECURITY INVOKER`.

Todas con **RLS activado**. Las mutaciones sensibles pasan por server functions con `supabaseAdmin` (service role) que nunca sale del backend.

---

## Desarrollo local

Este proyecto está conectado a **Lovable + GitHub** (sync bidireccional). Puedes clonarlo y trabajar en tu máquina.

### 1. Clonar

```bash
git clone <tu-repo>
cd <tu-repo>
bun install
```

### 2. Variables de entorno

El `.env` con las llaves **publicables** de Supabase (URL, project_id, publishable/anon key) está en `.gitignore` y **no se sube al repo**. Estas llaves son públicas por diseño (van al navegador) y están protegidas por RLS, pero mantenerlas fuera del repo evita ruido de escáneres como GitGuardian.

Crea un `.env` local con:

```
SUPABASE_URL="https://<project-id>.supabase.co"
SUPABASE_PROJECT_ID="<project-id>"
SUPABASE_PUBLISHABLE_KEY="<publishable-key>"
VITE_SUPABASE_URL="https://<project-id>.supabase.co"
VITE_SUPABASE_PROJECT_ID="<project-id>"
VITE_SUPABASE_PUBLISHABLE_KEY="<publishable-key>"
```

Los valores exactos los ves en Lovable → Backend. Nunca hardcodees el `service_role` en el código cliente; se inyecta automáticamente en las server functions.

### 3. Correr

```bash
bun run dev
```

Abre `http://localhost:8080`.

### 4. Sync con Lovable

- Cambios locales → `git push` → aparecen en Lovable.
- Cambios en Lovable → aparecen en tu repo automáticamente.
- Migraciones de DB desde local: usa la Supabase CLI apuntando al proyecto.

---

## Seguridad

- Contraseñas: bcrypt + salt (Supabase Auth), nunca en texto plano.
- HIBP (Have I Been Pwned) activado — bloquea contraseñas filtradas.
- Confirmación de email obligatoria.
- Todo el tráfico por HTTPS/TLS.
- RLS en todas las tablas de `public`.
- Server functions verifican rol antes de operar con `supabaseAdmin`.
- Rate limiting nativo contra brute-force.

---

## Scripts

```bash
bun run dev      # dev server
bun run build    # build producción
bun run start    # servir build
```

---

## Licencia

Uso privado del proyecto.
