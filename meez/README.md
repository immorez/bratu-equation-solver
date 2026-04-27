# MeetAI

AI-powered meeting management platform with real-time transcription, intelligent insights, and seamless collaboration.

## Architecture

- **Backend**: Express.js, Prisma (PostgreSQL), Socket.io, BullMQ, Redis
- **Dashboard**: React 18, Vite, Tailwind CSS, Zustand, React Router
- **Mobile**: React Native (Expo), React Navigation, Zustand
- **Shared**: TypeScript types, Zod schemas, constants
- **AI**: Deepgram (transcription), OpenAI (insights/summary)
- **Infrastructure**: Docker, pnpm workspaces, Turborepo

## Project Structure

```
meetai/
├── packages/shared/      # Shared types, schemas, constants
├── apps/
│   ├── backend/          # Express API + Socket.io + BullMQ
│   ├── dashboard/        # React web dashboard
│   └── mobile/           # React Native mobile app
├── docker/               # Docker configs
└── .github/workflows/    # CI/CD
```

## Prerequisites

- Node.js >= 20
- pnpm >= 9
- Docker & Docker Compose
- PostgreSQL 16 (or use Docker)
- Redis 7 (or use Docker)

## Getting Started

### 1. Clone and install

```bash
git clone <repo-url> meetai
cd meetai
pnpm install
```

### 2. Setup environment

```bash
cp .env.example .env
# Edit .env with your values
```

### 3. Start infrastructure

```bash
pnpm docker:up
# Starts PostgreSQL, Redis, MinIO
```

### 4. Run database migrations

```bash
pnpm db:migrate
pnpm db:seed
```

### 5. Start development

```bash
pnpm dev
```

This starts:
- Backend API on http://localhost:3000
- Dashboard on http://localhost:5173
- API docs at http://localhost:3000/health

### Seed Credentials

| Role  | Email              | Password     |
|-------|--------------------|--------------|
| Admin | admin@meetai.dev   | Password123! |
| User  | alex@meetai.dev    | Password123! |
| User  | jordan@meetai.dev  | Password123! |

## Scripts

| Command              | Description                     |
|---------------------|---------------------------------|
| `pnpm dev`          | Start all apps in dev mode      |
| `pnpm build`        | Build all packages              |
| `pnpm test`         | Run all tests                   |
| `pnpm lint`         | Lint all packages               |
| `pnpm typecheck`    | Type-check all packages         |
| `pnpm db:migrate`   | Run Prisma migrations           |
| `pnpm db:seed`      | Seed the database               |
| `pnpm docker:up`    | Start Docker services           |
| `pnpm docker:down`  | Stop Docker services            |

## API Endpoints

### Auth
- `POST /api/v1/auth/register` - Register
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/refresh` - Refresh token
- `GET /api/v1/auth/me` - Current user

### Meetings
- `GET /api/v1/meetings` - List meetings
- `POST /api/v1/meetings` - Create meeting
- `GET /api/v1/meetings/:id` - Get meeting
- `PUT /api/v1/meetings/:id` - Update meeting
- `DELETE /api/v1/meetings/:id` - Delete meeting

### Documents
- `POST /api/v1/documents/:meetingId` - Upload document
- `GET /api/v1/documents/:meetingId` - List documents

### Invitations
- `POST /api/v1/invitations/:meetingId/send` - Send invitations
- `POST /api/v1/invitations/:token/rsvp` - RSVP

### Rooms
- `GET /api/v1/rooms/availability` - Check availability
- `POST /api/v1/rooms/reserve` - Reserve room

### Insights
- `GET /api/v1/insights/:meetingId` - Get AI insights

### WebSocket Events
- `join-meeting` / `leave-meeting` - Room management
- `start-transcription` / `stop-transcription` - Recording
- `audio-chunk` - Send audio data
- `transcript-chunk` (server) - Receive transcription
- `transcription-stopped` (server) - Receive insights

## Tech Stack

| Layer      | Technology                    |
|------------|-------------------------------|
| Runtime    | Node.js 20, TypeScript 5      |
| Backend    | Express, Prisma, Socket.io    |
| Database   | PostgreSQL 16, Redis 7        |
| Queue      | BullMQ                        |
| Dashboard  | React 18, Vite, Tailwind      |
| Mobile     | React Native, Expo            |
| AI         | Deepgram, OpenAI              |
| Storage    | S3 / MinIO                    |
| CI/CD      | GitHub Actions, Docker        |
| Monorepo   | pnpm workspaces, Turborepo    |

## License

MIT
