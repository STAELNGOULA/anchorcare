# ANCHOR_CARE — Tech Stack

**Version:** 1.1 | **Updated:** August 5, 2026

Production Next.js stack for ANCHOR_CARE. Isolated from SGSuperFans — separate Supabase project required.

---

## Core

| Layer | Choice | Notes |
|-------|--------|-------|
| Framework | **Next.js 16** (App Router) | Turbopack dev, RSC-first |
| Language | **TypeScript** (strict) | Path alias `@/*` |
| UI | **React 19** | Server + client components |
| Styling | **Tailwind CSS 3** + CSS variables | Premium tokens in `globals.css` |
| Components | **shadcn/ui** (new-york) | `components.json` configured |
| Icons | **lucide-react** | Tree-shaken via `optimizePackageImports` |
| Fonts | **DM Sans** + **Instrument Serif** | Affluent, non-generic pairing |
| Themes | **next-themes** | System / light / dark |

## Data & Auth

| Layer | Choice | Notes |
|-------|--------|-------|
| Database | **Supabase Postgres** | Dedicated ANCHOR_CARE project |
| Auth | **Supabase Auth** | Email, Google, Apple (MVP) |
| Client | **@supabase/ssr** | Browser, server, middleware clients |
| ORM | **Drizzle** | Schemas in `src/schemas/` |
| Types | **supabase gen types** | `src/types/supabase.ts` |

## State & API

| Layer | Choice | Notes |
|-------|--------|-------|
| Server state | **TanStack Query v5** | `AppProviders` |
| UI state | **Zustand** | Local UI only |
| Validation | **Zod** | API + forms |
| API | **Next.js Route Handlers** | `/src/app/api/*` |

## i18n

| Layer | Choice | Notes |
|-------|--------|-------|
| Library | **next-intl** | EN + FR (US/CA launch) |
| Messages | `messages/en.json`, `messages/fr.json` | |

## Payments & Comms (wired in MVP phases)

| Service | Package | Use |
|---------|---------|-----|
| Stripe | `stripe` | Business Pro + Family subscriptions |
| Resend | `resend` | Email digests |
| Twilio | `twilio` | SMS reports + incident alerts |

## Background jobs

- Table: `background_jobs` (see migration)
- Queue helper: `src/lib/jobs/queue.ts`
- Retry policy: 5 / 15 / 60 minutes (3 attempts)
- Cron processor: add Vercel cron or Supabase Edge Function (next task)

## Security (day one)

- CSRF check on mutating API routes (middleware)
- CSP + security headers (`next.config.ts`)
- RBAC middleware: parent / business_admin / coach / admin
- RLS on all tables
- No tokens in localStorage

## Route map (skeleton)

```
/                     Landing
/login, /sign-up      Auth
/p/[slug]             Public business landing page (SSR/ISR)
/p/[slug]/programs/[programSlug]  Deep link to program + register CTA
/parent/*             Parent portal
/business/*           Business admin
/coach/*              Coach (RBAC subset)
/admin/*              Platform admin
/r/[token]            SMS web report viewer (public)
/api/health           Health check
```

**Public page notes:** No auth cookies required to view. `generateMetadata` + JSON-LD for SEO. Revalidate on org/program public field updates. Rate limit `/api/public/*` registration endpoints.

## Local development

```bash
cp .env.example .env.local
# Fill Supabase + Stripe keys

npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Turbopack dev server |
| `npm run build` | Production build |
| `npm run typecheck` | TypeScript |
| `npm run db:generate` | Drizzle migrations |
| `npm run gen:types` | Supabase TypeScript types |

---

*Patterns aligned with SGSF agency standards (`NOTES.md`); brand and domain are ANCHOR-specific.*
