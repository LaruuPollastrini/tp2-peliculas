# Películas — TP2

Aplicación full stack para gestionar un **catálogo de películas**, con autenticación (email/contraseña, GitHub y Google), roles `user` / `admin`, registros propios por usuario y un asistente con IA (LangChain + Groq).

Hecha a partir del repositorio de la materia ([T-Arias/mdw-2026](https://github.com/T-Arias/mdw-2026)), con la misma estructura `backend/` + `frontend/`.

## Links

| | URL |
|---|---|
| **Frontend** (Render Static Site) | https://tp2-peliculas-a2h2.onrender.com |
| **Backend** (Render Web Service) | https://tp2-peliculas-api-8x4h.onrender.com |
| Repositorio | https://github.com/LaruuPollastrini/tp2-peliculas |

> Render plan free: si nadie usa la app por 15 minutos, el backend se duerme y el primer pedido tarda unos 50 segundos.

## Usuarios de prueba

| Rol | Email | Contraseña |
|---|---|---|
| admin | `admin@peliculas.com` | `Admin12345` |
| user | `user@peliculas.com` | `User12345` |

También se puede crear una cuenta nueva (queda con rol `user`) o entrar con GitHub o Google: el login con Google está publicado, así que funciona con cualquier cuenta.

## La entidad: Película (`Movie`)

| Campo | Tipo | Detalle |
|---|---|---|
| `title` | texto | obligatorio, máx. 120 caracteres |
| `director` | texto | obligatorio, máx. 80 caracteres |
| `genre` | texto (enum) | acción, aventura, animación, comedia, drama, terror, ciencia ficción, suspenso, romance o documental |
| `synopsis` | texto | opcional, máx. 1000 caracteres |
| `durationMin` | número | entero de 1 a 600 |
| `rating` | número | de 0 a 10 |
| `releaseDate` | fecha | fecha de estreno |
| `watched` | booleano | si ya fue vista |
| `owner` / `ownerName` | texto | usuario que la cargó (lo completa el backend) |

## Roles y permisos

- **user** (rol por defecto de todo usuario que se registra): **lee** el catálogo (`/api/movies`). Además, en "Mis películas" (`/api/my-movies`) puede cargar películas que quedan a su nombre y editar o eliminar **solo las suyas**.
- **admin**: crea, edita y elimina **cualquier** película (`/api/movies`), crea usuarios y cambia roles.

Las rutas de escritura de `/api/movies` están protegidas con `authMiddleware` + `requireRole("admin")`. El opcional de registros propios está en un recurso aparte (`/api/my-movies`), así el CRUD principal queda tal como pide la consigna.

## Endpoints de la API

### Películas — CRUD de la consigna

| Método | Ruta | Rol requerido | Respuestas |
|---|---|---|---|
| GET | `/api/movies` | público | 200, 400 (query inválida) |
| GET | `/api/movies/:id` | público | 200, 400 (id inválido), 404 |
| POST | `/api/movies` | admin | 201, 400 (Zod), 401, 403 |
| PUT | `/api/movies/:id` | admin | 200, 400 (Zod), 401, 403, 404 |
| PATCH | `/api/movies/:id` | admin | 200, 400 (Zod), 401, 403, 404 |
| DELETE | `/api/movies/:id` | admin | 204, 400, 401, 403, 404 |

`GET /api/movies` acepta paginación, búsqueda, filtros y orden:
`?page=1&limit=12&search=nolan&genre=drama&watched=true&sortBy=rating&sortOrder=desc`
(`sortBy`: `createdAt`, `title`, `releaseDate`, `rating` o `durationMin`).

### Mis películas — opcional "registros propios"

| Método | Ruta | Rol requerido | Detalle |
|---|---|---|---|
| GET | `/api/my-movies` | user o admin | solo las del usuario logueado (mismos filtros que `/api/movies`) |
| GET | `/api/my-movies/:id` | user o admin (dueño) | 403 si no es suya |
| POST | `/api/my-movies` | user o admin | queda a su nombre (201) |
| PUT / PATCH | `/api/my-movies/:id` | user o admin (dueño) | 403 si no es suya |
| DELETE | `/api/my-movies/:id` | user o admin (dueño) | 403 si no es suya |

### Asistente — extra con LangChain (clases 14 y 15)

| Método | Ruta | Rol requerido | Detalle |
|---|---|---|---|
| POST | `/api/agent/chat` | user o admin | `{ message, history }` → respuesta por SSE (`tool`, `token`, `done`, `error`) |

### Autenticación — Better Auth

| Método | Ruta | Rol requerido | Detalle |
|---|---|---|---|
| POST | `/api/auth/sign-up/email` | público | registro (rol `user`) |
| POST | `/api/auth/sign-in/email` | público | login con email y contraseña |
| POST | `/api/auth/sign-in/social` | público | login con GitHub o Google |
| GET | `/api/auth/callback/:provider` | público | callback de OAuth |
| GET | `/api/auth/get-session` | público | sesión actual (`useSession`) |
| POST | `/api/auth/sign-out` | logueado | logout |
| GET | `/api/auth/admin/list-users` | admin | listar usuarios |
| POST | `/api/auth/admin/create-user` | admin | crear usuario |
| POST | `/api/auth/admin/set-role` | admin | cambiar rol (`authClient.admin.setRole`) |
| GET | `/health` | público | estado del servidor |

## Funcionalidades

**Requisitos mínimos**
- Backend: Express + TypeScript + MongoDB (Mongoose), validación con Zod (errores 400 por campo) y códigos 201 / 400 / 401 / 403 / 404.
- Better Auth con email/contraseña y GitHub; usuarios y sesiones guardados en MongoDB.
- Frontend: React + Vite + TypeScript, listado y detalle, login (email y GitHub), registro y logout.
- Panel admin (`/admin`) con el ABM, protegido por rol: un usuario común es redirigido a "Sin permisos".
- Formularios con React Hook Form + Zod, mostrando los errores de validación.
- Sesión con `useSession()`: se mantiene al recargar (F5).

**Opcionales**
- Paginación, búsqueda y filtros (género, vista/sin ver, orden) en el catálogo, el panel admin y "Mis películas".
- Registros propios: cada usuario gestiona solo sus películas en "Mis películas".
- Login con Google, publicado para cualquier cuenta.
- Página de usuarios (`/admin/usuarios`): el admin crea usuarios y cambia roles con `authClient.admin.setRole`.

**Extra: asistente con LangChain** (`/asistente`)
- Agente con Groq que consulta el catálogo con *tools* que usan el mismo service que la API REST.
- Las tools de escritura (cargar y eliminar) verifican el rol **adentro de la tool**: un `user` recibe "Permiso denegado" aunque se lo pida al modelo.
- La respuesta se ve a medida que se genera (SSE), recuerda los últimos mensajes de la conversación y avisa si se alcanza el límite gratuito de Groq.

## Correr en local

Requisitos: Node 22, una base en MongoDB Atlas y las claves de OAuth de GitHub y Google (apps de desarrollo).

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env   # completar las variables (ver tabla abajo)
npm run dev            # http://localhost:3000
```

Crear los usuarios de prueba (el primer admin no se puede crear desde la app):

```bash
npm run create-user -- admin@peliculas.com Admin12345 "Admin" admin
npm run create-user -- user@peliculas.com User12345 "Usuario" user
```

Verificar las tools y los permisos del agente sin gastar Groq:

```bash
npm run agent:check
```

### 2. Frontend (en otra terminal)

```bash
cd frontend
npm install
npm run dev            # http://localhost:5173
```

Vite redirige `/api` al backend (proxy en `vite.config.ts`), así que el front y la API comparten origen y la cookie de sesión funciona sin CORS.

### Variables de entorno (`backend/.env`)

| Variable | Descripción |
|---|---|
| `PORT` | puerto del backend (local: `3000`; en Render no se define) |
| `NODE_ENV` | `development` o `production` |
| `MONGODB_URI` | URI de MongoDB Atlas, con el nombre de la base (`/peliculas`) |
| `BETTER_AUTH_SECRET` | secreto de Better Auth (generar uno distinto por entorno) |
| `BETTER_AUTH_URL` | URL pública del **frontend** (local: `http://localhost:5173`) |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | OAuth App de GitHub |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | cliente OAuth de Google |
| `GROQ_API_KEY` | API key de Groq para el asistente |
| `GROQ_MODEL` | modelo de Groq con tool calling (por defecto `openai/gpt-oss-20b`) |

Generar el secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Callbacks de OAuth (apuntan al **frontend**, que reenvía `/api` al backend):

| Proveedor | Local | Producción |
|---|---|---|
| GitHub | `http://localhost:5173/api/auth/callback/github` | `https://tp2-peliculas-a2h2.onrender.com/api/auth/callback/github` |
| Google | `http://localhost:5173/api/auth/callback/google` | `https://tp2-peliculas-a2h2.onrender.com/api/auth/callback/google` |

## Deploy en Render

**Backend — Web Service**

| Campo | Valor |
|---|---|
| Root Directory | `backend` |
| Build Command | `npm install --include=dev && npm run build` |
| Start Command | `npm start` |
| Variables | las de la tabla anterior, con `NODE_ENV=production`, `NODE_VERSION=22`, `BETTER_AUTH_URL=https://tp2-peliculas-a2h2.onrender.com` y las claves de las apps OAuth **de producción** |

**Frontend — Static Site**

| Campo | Valor |
|---|---|
| Root Directory | `frontend` |
| Build Command | `npm install && npm run build` |
| Publish Directory | `dist` |
| Variables | `NODE_VERSION=22` |

Redirects/Rewrites, en este orden:

| Source | Destination | Action |
|---|---|---|
| `/api/*` | `https://tp2-peliculas-api-8x4h.onrender.com/api/*` | Rewrite |
| `/*` | `/index.html` | Rewrite |

La primera regla hace que el front llame a la API por `/api` (no directo a la URL del backend). La segunda hace que F5 funcione en cualquier ruta de React Router.

## Estructura

```
tp2-peliculas/
├── backend/
│   ├── scripts/            create-user, agent-check
│   └── src/
│       ├── agent/          LangChain: modelo, prompt, agente y tools
│       ├── config/         conexión a MongoDB
│       ├── controllers/    capa HTTP
│       ├── lib/            Better Auth
│       ├── middlewares/    authMiddleware, requireRole, requireMovieOwner, validate
│       ├── models/         Movie (Mongoose)
│       ├── routes/         /movies, /my-movies, /agent
│       ├── schemas/        Zod
│       └── services/       lógica de negocio y acceso a datos
└── frontend/
    └── src/
        ├── components/     tarjetas, filtros, paginación, formularios
        ├── layouts/        encabezado y navegación según rol
        ├── lib/            axios, auth-client, SSE
        ├── pages/          catálogo, detalle, login, registro, mis películas, admin, asistente
        ├── router/         rutas públicas, privadas y por rol
        ├── schemas/        Zod de los formularios
        └── store/          Redux Toolkit + RTK Query
```
