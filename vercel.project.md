# Vercel + Neon Setup (with GitHub Actions)

## 1) Create 2 Vercel projects

### API project

- Repository: this repository
- Root Directory: `.` (repo root)
- Framework preset: `Other`
- Runtime entrypoint: `api/index.ts` (configured in `vercel.json`)

Set environment variables in Vercel API project:

- `DATABASE_URL` (production Neon URL)
- `DATABASE_SSL=require`
- `JWT_SECRET`
- any other backend runtime variables

### Web project

- Repository: same repository
- Root Directory: `apps/web`
- Framework preset: `Vite`

Production env in Vercel Web project:

- `VITE_API_BASE_URL=https://<your-api-prod-domain>.vercel.app`

## 2) Configure GitHub Secrets

Repository Secrets required by workflows:

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID_API`
- `VERCEL_PROJECT_ID_WEB`
- `DATABASE_URL` (production Neon URL used by migrations in CI)
- `WEB_PROD_API_BASE_URL` (API base URL injected in web prod build)
- `NEON_API_KEY`
- `NEON_PROJECT_ID`
- `NEON_PARENT_BRANCH_ID`
- optional: `NEON_DATABASE_NAME` (default `neondb`)
- optional: `NEON_ROLE_NAME` (default `neondb_owner`)

## 3) Workflows included

- `ci.yml`
  - Runs on PR and push to `main`
  - API: lint/check, test, build
  - Web: lint, typecheck, test, build

- `deploy-preview.yml`
  - Runs on PR opened/reopened/synchronize
  - Creates/reuses Neon branch `preview-pr-<number>`
  - Runs migrations against preview DB
  - Deploys API preview with PR DB URL
  - Deploys Web preview with `VITE_API_BASE_URL=<api-preview-url>`
  - Comments preview URLs in PR
  - On PR close: deletes Neon preview branch

- `deploy-production.yml`
  - Runs on push to `main`
  - Runs production migrations first
  - Deploys API with `--prod`
  - Deploys Web with `--prod` and `WEB_PROD_API_BASE_URL`

## 4) Migration strategy used by pipeline

- Source of truth: TypeORM migrations in `src/database/migration/history`
- Preview DBs: one Neon branch per PR
- Production deploy is blocked if migration step fails
