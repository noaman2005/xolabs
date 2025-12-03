# XO Labs

XO Labs is a collaborative workspace app inspired by Discord, Notion, and Trello.

It uses:
- **Backend**: AWS SAM + Lambda + API Gateway + DynamoDB + Cognito
- **Frontend**: Next.js App Router, React Query, TailwindCSS
- **Realtime**: HTTP polling + in-memory stores in the Next.js app for voice, tasks, and board

## Monorepo Structure

- `backend/` – AWS SAM backend (Lambdas, REST API, Cognito auth, DynamoDB)
- `frontend/` – Next.js app (dashboard, workspaces, channels, voice, tasks, board)
- `infra/` – SAM/CloudFormation template and infra tooling
- Root config: ESLint, Prettier, Docker, Makefile

---

## Backend (AWS SAM)

Located in `backend/`.

### Tech
- Node.js 20 (TypeScript)
- AWS SAM (Serverless Application Model)
- DynamoDB single table design
- Cognito for authentication

### Main Features
- **Auth** – signup, login, confirm signup via Cognito
- **Workspaces** – CRUD for workspaces, membership via invites
- **Channels** – workspace channels with types:
  - `text` – standard chat
  - `voice` – voice channel metadata
  - `tasks` – task channels (Tasks feature lives in Next.js + Dynamo)
  - `board` – board channels (Boards feature lives in Next.js + Dynamo)
- **Messages** – CRUD for channel messages (text channels)

### Build & Deploy

From repo root:

```bash
make deploy-dev
```

This runs:
- `cd backend && npm install && npm run build`
- `cd infra && sam build && sam deploy ...`

The `infra/template.yaml` defines all Lambda functions, API Gateway routes, DynamoDB table, and Cognito resources.

---

## Frontend (Next.js)

Located in `frontend/`.

### Tech
- Next.js App Router (React 18)
- TypeScript
- React Query (`@tanstack/react-query`)
- TailwindCSS
- `aws-jwt-verify` for frontend-side Cognito token verification in API routes

### Major Features

- **Auth & Routing**
  - Custom `useAuth` hook storing tokens in `localStorage`
  - Protected dashboard routes via `RequireAuth` wrapper

- **Workspaces & Channels**
  - Discord-style layout (workspace sidebar, channels, main panel)
  - Channel types: `text`, `voice`, `tasks`, `board`

- **Text Channels**
  - Messages fetched from the AWS backend via REST
  - Simple polling for updates

- **Voice Channels**
  - `/api/voice/signal` for HTTP-based signaling and presence
  - `useWebRTC` hook for peer connections and media
  - `VoiceChannelPanel` shows participants, join/leave, and mute state

- **Tasks Channels**
  - Tasks stored in DynamoDB via Next.js API routes under `/api/tasks/*`
  - `useTasks` hook:
    - `list`, `create`, `update`, `delete` tasks
    - Polls `/api/tasks/events` for near-realtime snapshots
  - `TasksPanel` shows a list view (title, description, status) with inline create and status updates

- **Board Channels**
  - Kanban-style board per `board` channel
  - Data stored in DynamoDB via `/api/board/*`
  - `useBoard` hook:
    - Loads `{ columns, cards }` via `/api/board`
    - Provides CRUD for columns and cards
    - Polls `/api/board/events` for near-realtime snapshots
  - `BoardPanel` renders columns horizontally with cards and inline create forms

### Running Locally

From `frontend/`:

```bash
npm install
npm run dev
```

Make sure `.env.local` is configured (see `frontend/README.md`).

---

## Environment Variables

Backend and frontend share several important env vars:

- **Backend (via SAM)**
  - `TABLE_NAME` – DynamoDB table name
  - `USER_POOL_ID`, `USER_POOL_CLIENT_ID` – Cognito resources

- **Frontend (`frontend/.env.local`)**
  - `NEXT_PUBLIC_API_URL` – base URL of the AWS backend (API Gateway)
  - `NEXT_PUBLIC_WS_URL` – (legacy) WebSocket URL, no longer needed for voice
  - `NEXT_PUBLIC_COGNITO_USER_POOL` – Cognito user pool ID
  - `NEXT_PUBLIC_COGNITO_CLIENT_ID` – Cognito client ID
  - `NEXT_PUBLIC_AWS_REGION` – AWS region (e.g. `us-east-1`)

Some frontend API routes also rely on `TABLE_NAME`/`AWS_REGION` if you choose to expose them there.

---

## Development Workflow

- **Backend changes**
  - Edit handlers in `backend/src/handlers/http/...`
  - Run `npm run build` inside `backend/`
  - Deploy with `make deploy-dev` from repo root

- **Frontend changes**
  - Edit components/pages/hooks in `frontend/app` and `frontend/lib`
  - Run `npm run dev` inside `frontend/` for hot reload

---

## Notes

- Voice, Tasks, and Board realtime features currently use **HTTP polling**+in-memory stores on the Next.js side. In production you may want to replace this with a dedicated WebSocket service (or Redis-backed presence) for scalability.
- The repo is structured to keep backend (SAM) and frontend (Next.js) concerns separate but coordinated via shared environment and DynamoDB schema.
