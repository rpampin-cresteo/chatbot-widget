# Chatbot Widget

Embeddable Next.js + Vercel AI SDK chat widget that proxies the monorepo `/chat` backend, streams Azure OpenAI answers with Azure Search citations, captures feedback, and keeps anonymous sessions with local plus optional Redis memory.

## Features
- Streaming proxy with rate limiting and source passthrough (`src/app/api/chat/route.ts`).
- Signed HTTP-only session cookie and editable display name (`src/lib/auth/session.ts` and `/api/session`).
- Local storage history (20 turns) with optional Upstash Redis summaries (`src/lib/memory/*`).
- Floating launcher and embedded panel (`src/components/ChatWidget/ChatWidget.tsx`) with accessible focus, markdown rendering, and feedback buttons.

## Submodule Workflow
```bash
git submodule add https://github.com/rpampin-cresteo/chatbot-widget.git packages/07-widget
cd packages/07-widget && pnpm install
git commit -m "Implement chatbot widget (Step 8)" && git push origin main
cd .. && git add packages/07-widget .gitmodules
git commit -m "Update submodule pointer: packages/07-widget"
git push
```

## Environment
Copy `.env.example` to `.env` (auto-created on `pnpm dev` if missing) and set:
- `CHAT_API_URL` (default `http://localhost:3002/api/chat`)
- `WIDGET_BASE_URL` (default `http://localhost:3003`)
- `ALLOWED_ORIGINS` (e.g. `http://localhost:3001,http://localhost:3002,http://localhost:3003`)
- `SESSION_COOKIE_NAME`, `SESSION_COOKIE_SECRET`, `SESSION_COOKIE_MAX_AGE_DAYS`
- Optional `REDIS_URL`, `REDIS_TOKEN`, `SERVER_MEMORY_ENABLED=true` for shared summaries
- Azure OpenAI variables kept in sync with the `/chat` submodule

## Local Development
```bash
pnpm install
pnpm dev          # widget only on http://localhost:3003
pnpm lint
pnpm typecheck
pnpm build && pnpm start
```
Run `pnpm dev:all` from the monorepo root to launch `/search`, `/chat`, and `/07-widget` together.

## Validation
- Confirm streaming tokens, citation rendering, and feedback posts while `pnpm dev:all` is running.
- Refresh to ensure the last 20 turns persist and “Clear history” wipes cookies + local storage.
- Toggle `SERVER_MEMORY_ENABLED=true` with Redis credentials to observe server summaries in logs.

## Deployment
`pnpm install && pnpm build` produces a standalone Next.js build for Azure App Service. Mirror `.env.example` into App Settings, provision Redis if server memory is needed, and keep CORS origins aligned with the hosting domain.

## Embedding
```tsx
import { ChatWidget } from '@/components/ChatWidget/ChatWidget';

export default function Page() {
  return (
    <main>
      <h1>Documentation</h1>
      <ChatWidget mode="embedded" />
      <ChatWidget mode="floating" />
    </main>
  );
}
```
