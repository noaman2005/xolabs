# XO Labs Frontend (Next.js)

This is the Next.js app for XO Labs. It provides the dashboard UI, workspace and channel views, and feature-specific UIs for voice, tasks, and boards.

## Tech Stack

- Next.js (App Router)
- React 18 + TypeScript
- @tanstack/react-query for data fetching and caching
- TailwindCSS for styling
- aws-jwt-verify for verifying Cognito ID tokens in API routes

## Project Structure

- `app/`
  - `dashboard/`
    - `[workspaceId]/page.tsx` – main workspace view (channels sidebar and main panel)
  - `api/`
    - `voice/signal/route.ts` – HTTP-based signaling and presence for voice channels
    - `tasks/*` – Tasks CRUD and events (`create`, `list`, `update`, `delete`, `events`)
    - `board/*` – Board (Kanban) CRUD and events (`columns`, `cards`, `events`)
- `lib/`
  - `hooks/`
    - `useAuth.ts` – auth tokens from Cognito-based backend
    - `useApi.ts` – helper to call the AWS backend REST API
  - `features/`
    - `voice/` – WebRTC signaling + UI components
    - `tasks/` – Tasks feature (types, Dynamo helpers, hook, panel)
    - `board/` – Board/Kanban feature (types, Dynamo helpers, hook, panel)

## Environment Setup

Copy `.env.local.example` to `.env.local` and fill in values:

```bash
cp .env.local.example .env.local
```

Important variables:

```env
NEXT_PUBLIC_API_URL= # Your AWS API Gateway base URL
NEXT_PUBLIC_COGNITO_USER_POOL= # Cognito user pool ID
NEXT_PUBLIC_COGNITO_CLIENT_ID= # Cognito client ID
NEXT_PUBLIC_AWS_REGION=us-east-1
```

For features that talk directly to DynamoDB from Next.js (Tasks, Board), you may also need:

```env
TABLE_NAME= # DynamoDB table name used by backend
AWS_REGION=us-east-1
```

## Running Locally

```bash
npm install
npm run dev
```

Visit `http://localhost:3000` and log in using credentials provisioned via the backend auth endpoints.

## Features Overview

### Voice Channels

- Signaling endpoint: `app/api/voice/signal/route.ts`
- Hook: `lib/features/voice/useWebRTC.ts`
- UI: `VoiceChannelPanel`

Supports:
- Join / leave voice channel
- Mute / unmute local audio
- Display participants with mute state

### Tasks Channels

- API routes under `app/api/tasks/*`
- Dynamo helpers in `lib/features/tasks/dynamodb.ts`
- Hook: `lib/features/tasks/useTasks.ts`
- UI: `TasksPanel`

Supports:
- Create/list/update/delete tasks per channel
- Status (`todo`, `in-progress`, `done`)
- Description
- Realtime refresh via `GET /api/tasks/events` + React Query invalidation

### Board Channels (Kanban)

- API routes under `app/api/board/*`
- Dynamo helpers in `lib/features/board/dynamodb.ts`
- Hook: `lib/features/board/useBoard.ts`
- UI: `BoardPanel`

Supports:
- Columns per board channel
- Cards under each column
- Inline create column & card
- Realtime refresh via `GET /api/board/events`

## Code Style

- ESLint & Prettier are configured at the repo root.
- Prefer feature folders under `lib/features` for new capabilities (e.g., `calendar/`, `notifications/`).
