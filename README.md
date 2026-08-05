# ANCHOR_CARE

Child care & activity platform — daily updates, safety, and care for children away from home.

## Setup

```bash
cp .env.example .env.local
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Docs

See [`docs/README.md`](./docs/README.md) for product docs and [`docs/STACK.md`](./docs/STACK.md) for the technology stack.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server (Turbopack) |
| `npm run build` | Production build |
| `npm run test:unit` | Vitest unit tests |
| `npm run test:e2e` | Playwright E2E tests |

## Supabase

Create a **dedicated** ANCHOR_CARE Supabase project (not SGSuperFans). Apply migration:

`supabase/migrations/20260804140000_initial_schema.sql`
