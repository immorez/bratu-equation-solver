# سامد - SAMED

A Persian (RTL) internal approval system for financial document/request management. Employees submit requests, managers review and act on them.

Managed as a **Turborepo monorepo** with npm workspaces.

## Repository Layout

```
.
├── apps/
│   ├── backend/     # Node.js + Express + Prisma API (@approval-system/backend)
│   └── frontend/    # React 19 + Vite SPA           (@approval-system/frontend)
├── docker/          # Production compose & nginx config
├── docker-compose.yml
├── turbo.json       # Turborepo pipeline
└── package.json     # npm workspaces + turbo scripts
```

> Add shared code under `packages/*` (e.g. `packages/types`, `packages/eslint-config`) — the workspace glob already picks them up.

## Quick Start

### Prerequisites

- Node.js 20 LTS
- npm 10+
- PostgreSQL 15 (or Docker)

### Install

From the repo root — a single install hydrates every workspace:

```bash
npm install
```

### Database (Docker only)

```bash
docker-compose up -d db
npm run db:migrate
npm run db:seed
```

### Full stack (Docker Compose)

Runs Postgres + backend + frontend with one command:

```bash
docker compose up -d --build
# frontend: http://localhost:5173
# backend:  http://localhost:3002
```

Optional first-time seed:

```bash
docker compose exec backend pnpm --filter @approval-system/backend db:seed
```

### Development

Turbo runs both apps in parallel with live reload:

```bash
npm run dev
# → backend  http://localhost:3002
# → frontend http://localhost:5173
```

Run a single app:

```bash
npm run dev -w @approval-system/backend
npm run dev -w @approval-system/frontend
```

### Build / Lint / Start

```bash
npm run build    # turbo run build (incremental + cached)
npm run lint     # turbo run lint
npm run start    # turbo run start (after build)
```

### Database Scripts

All proxy to the backend workspace:

```bash
npm run db:migrate    # prisma migrate deploy
npm run db:seed       # seed users & sample data
npm run db:studio     # open Prisma Studio
npm run db:generate   # regenerate Prisma client
```

### Default Seed Users

| Role     | Email                | Password     |
| -------- | -------------------- | ------------ |
| Manager  | manager@hooshpod.ai  | Manager@123  |
| Employee | employee@hooshpod.ai | Employee@123 |

## Docker Compose (full stack)

The root `docker-compose.yml` runs the full stack and builds from the **repo root** so workspace lockfiles are available.

For production, use `docker/docker-compose.prod.yml` (nginx + TLS).

## Tech Stack

| Layer            | Technology                              |
| ---------------- | --------------------------------------- |
| Monorepo         | Turborepo + npm workspaces              |
| Backend          | Node.js 20, Express, TypeScript         |
| ORM              | Prisma                                  |
| Database         | PostgreSQL 15                           |
| Auth             | JWT (HS256) + bcrypt (cost 12)          |
| File upload      | Multer + AES-256-GCM encryption at rest |
| Frontend         | React 19, Vite, TypeScript              |
| UI               | Tailwind CSS, Vazirmatn font            |
| HTTP client      | Axios                                   |
| State            | TanStack Query + React Context          |
| AI               | OpenRouter (OpenAI-compatible)          |
| Containerization | Docker + Docker Compose                 |

## Security

- **Transport**: TLS 1.2+ via reverse proxy in production (see `docker/docker-compose.prod.yml`).
- **Files**: All attachments are **AES-256-GCM encrypted** before writing to disk. The key (`FILE_ENCRYPTION_KEY`) is 32-byte hex, loaded from env only — **never committed**.
- **Auth**: JWT with HS256, 8-hour sliding expiry. Login rate-limited (5 attempts / 15 min per IP). Generic error messages prevent user enumeration.
- **CORS**: Single origin from `FRONTEND_URL`.
- **Helmet**: HTTP security headers enabled.
- **Docker**: Backend runs as non-root user.

### Key Rotation

- **JWT_SECRET**: Change in env, restart. Existing sessions will be invalidated (users must re-login).
- **FILE_ENCRYPTION_KEY**: Changing this key **breaks all existing encrypted files**. You must re-encrypt them with a migration script, or accept data loss.

## AI Features

Powered by [OpenRouter](https://openrouter.ai/) (OpenAI-compatible API). Set these env vars to enable:

```
AI_ENABLED=true
OPENROUTER_API_KEY=sk-or-...
OPENROUTER_MODEL=qwen/qwen3-235b-a22b
```

### Privacy Notice

When AI features are used, the following data is sent to OpenRouter/model providers:

- Request title, description, amount, status
- Comment thread (author names + body text)
- Attachment filenames and types (NOT file contents)
- User's question (for Ask AI)

**Raw attachment bytes are never sent to the AI.** See [OpenRouter Terms](https://openrouter.ai/terms) for data handling policies.

## UI & Localization

- **Language**: Persian (فارسی) — all UI labels, errors, notifications
- **Direction**: RTL-first layout (`dir="rtl"`, `lang="fa"`)
- **Font**: Vazirmatn (Google Fonts)
- **Dates**: Displayed via `fa-IR` locale (Jalali-style formatting)
- **Design**: Minimal, non-technical user-friendly (large cards, one primary action per screen, few filters)

## Environment Variables

See `apps/backend/.env.example` for the full list.

## Production Deployment

1. Set strong secrets for `JWT_SECRET`, `FILE_ENCRYPTION_KEY`, and database password.
2. Enable TLS via the production compose file (`docker/docker-compose.prod.yml`) with nginx.
3. Set `FRONTEND_URL` and `VITE_API_URL` to your `https://` domain.
4. Set `AI_ENABLED=true` and provide `OPENROUTER_API_KEY` if AI features are desired.
5. Run `docker compose -f docker/docker-compose.prod.yml up -d --build`.
