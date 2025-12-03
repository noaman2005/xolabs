# XO Labs Backend (AWS SAM)

This directory contains the AWS SAM backend for XO Labs. It exposes a REST API for authentication, workspaces, channels, and messages using Lambda, API Gateway, DynamoDB, and Cognito.

## Tech Stack

- Node.js 20 (TypeScript)
- AWS SAM (Serverless Application Model)
- DynamoDB (single-table design)
- Amazon Cognito (user pools)

## Structure

- `src/`
  - `handlers/http/`
    - `auth-*.ts` – login, signup, confirm signup
    - `workspaces-*.ts` – CRUD and invites for workspaces
    - `channels-*.ts` – CRUD for channels (text, voice, tasks, board metadata)
    - `messages-*.ts` – CRUD for text channel messages
  - `lib/`
    - `auth/requireUser.ts` – verifies Cognito ID token from `Authorization: Bearer` header
- `tsconfig.json` – TypeScript config
- `package.json` – build scripts and dependencies

Tasks and Board features currently use **Next.js API routes + DynamoDB** directly from the frontend app and are not defined as separate Lambdas here.

## Build

From `backend/`:

```bash
npm install
npm run build
```

This compiles TypeScript into `dist/` using `tsc`.

## Deploy (via SAM)

From the repo root:

```bash
make deploy-dev
```

This runs:

1. `cd backend && npm install && npm run build`
2. `cd infra && sam build`
3. `cd infra && sam deploy --stack-name xolabs-dev ...`

The SAM template lives under `infra/template.yaml` and defines:

- Lambda functions and handlers
- API Gateway routes
- DynamoDB table (`TABLE_NAME`)
- Cognito user pool and client

## Environment

Handlers expect the following environment variables (wired by SAM):

- `TABLE_NAME` – DynamoDB table name
- `USER_POOL_ID` – Cognito user pool ID
- `USER_POOL_CLIENT_ID` – Cognito app client ID

## Notes

- Workspace and channel access control is enforced via `requireUser` + workspace owner/members checks.
- Any new backend features should follow the existing patterns in `src/handlers/http/*`:
  - Parse path/query/body
  - Validate input
  - Call DynamoDB via `@aws-sdk/lib-dynamodb`
  - Return proper status codes and JSON bodies.
