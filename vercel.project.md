# Vercel Project Setup

## 1) API project (NestJS)

- Create Vercel project name: `api` (or similar)
- Repository: this repository
- Root Directory: `.` (repo root)
- Build command: default (or `npm run build`)
- Start command: default for your backend deploy strategy

Set env vars in API project:

- `DATABASE_URL=<neon-connection-string>`
- `PORT=3000`
- `NODE_ENV=production`
- other backend-required vars (JWT, etc.)

## 2) Web project (React + Vite)

- Create Vercel project name: `web` (or similar)
- Repository: same repository
- Root Directory: `apps/web`
- Framework Preset: `Vite`
- Build Command: `npm run build`
- Output Directory: `dist`

Set env vars in Web project:

- `VITE_API_BASE_URL=https://<api-project-domain>.vercel.app`

## 3) Neon integration

- Provision Neon Postgres from Vercel Marketplace (or existing Neon account)
- Copy Neon connection string into API project as `DATABASE_URL`
- Frontend never connects directly to DB; it only calls backend API
