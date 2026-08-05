# ANCHOR_CARE — Documentation README

Start here. Product docs live in `docs/`. Application code is in the repo root.

---

## Quick start (engineering)

```bash
cp .env.example .env.local
npm install
npm run dev
```

See [STACK.md](./STACK.md) for full technology choices and route map.

---

## Document set

| Doc | Purpose | Audience |
|-----|---------|----------|
| [STACK.md](./STACK.md) | Next.js, Supabase, dependencies, routes | Engineering |
| [STRATEGY.md](./STRATEGY.md) | PMF, MRR, GTM, moat, scale path, risks | Founders, investors, product |
| [PRD.md](./PRD.md) | Requirements, roles, subscriptions, features by phase | Product, engineering |
| [USER_JOURNEYS.md](./USER_JOURNEYS.md) | Role capabilities, journeys, build order | Product, design, engineering |
| [DEVELOPMENT_SPEC.md](./DEVELOPMENT_SPEC.md) | Per-screen flows, toasts, notifications, UI | Engineering, QA |

---

## Read order

**Founders / before build**
1. STRATEGY.md — validate market before coding
2. USER_JOURNEYS.md §11 — MVP scope lock

**Product / design**
1. USER_JOURNEYS.md — full flows
2. PRD.md §8 — functional requirements

**Engineering**
1. USER_JOURNEYS.md §2 — shared engines
2. DEVELOPMENT_SPEC.md — page-by-page build
3. PRD.md §12 — phase gates

---

## Four roles

1. **Parent** — timeline, care, programs
2. **Business** — org admin, programs, coaches, billing
3. **Coach** — daily reports, media, incidents (subset of Business app)
4. **Admin** — ANCHOR platform internal

---

## Current version

- STACK v1.0
- USER_JOURNEYS v3.1
- PRD v2.0
- DEVELOPMENT_SPEC v1.2
- STRATEGY v1.0

---

*Last updated: August 4, 2026*
