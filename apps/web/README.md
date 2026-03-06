# Web App (`apps/web`)

Frontend React + Vite + TypeScript para demostrar el challenge e-commerce end-to-end:

- auth (register/login),
- sesión con JWT,
- UI role-aware,
- catálogo de productos,
- create/details/activate/deactivate,
- timeline de eventos por producto,
- health check de backend.

## Requisitos

- Node 18+ (recomendado Node 20)
- npm

## Variables de entorno

```bash
cp .env.example .env
```

Variables:

- `VITE_API_BASE_URL`: URL base del backend. Ejemplo local `http://localhost:3000`.

Si no se define, la app usa fallback `/api` y depende del proxy de Vite.

## Desarrollo local

Desde la raíz del repo:

```bash
npm run dev
```

Solo frontend:

```bash
npm run dev:web
```

## Scripts (`apps/web`)

```bash
npm run dev
npm run build
npm run preview
npm run lint
npm run typecheck
npm run test
```

## Deploy en Vercel

Proyecto exclusivo para frontend:

- Framework: `Vite`
- Root Directory: `apps/web`
- Build Command: `npm run build`
- Output Directory: `dist`

Env vars frontend:

- `VITE_API_BASE_URL=https://<tu-backend-vercel>.vercel.app`
