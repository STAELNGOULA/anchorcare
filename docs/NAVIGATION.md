# ANCHOR — Navigation & IA Audit

**Version:** 2.0 | **Audited:** August 5, 2026  
**Source of truth:** [USER_JOURNEYS.md](./USER_JOURNEYS.md) §3 · [PHASES.md](./PHASES.md) · [DEVELOPMENT_SPEC.md](./DEVELOPMENT_SPEC.md)

---

## Coverage summary

| Role | Sidebar | Hub sub-routes | Phase surfaces | Status |
|------|---------|----------------|----------------|--------|
| Parent | 5 tabs | Care (3), Programs (2), Profile (8) | MVP + P1.5 + P2 | ✅ Scaffolded |
| Business | 5 tabs | People (3), Settings (8) | MVP + P1.5 + P2 | ✅ Scaffolded |
| Coach | 4 tabs | Roster (2) | MVP + P1.5 field mode | ✅ Scaffolded |
| Admin | 7 tabs | — | MVP + P2 Marketplace | ✅ Scaffolded |

**Full phase inventory:** see [PHASES.md](./PHASES.md).

---

## Program (Director) — `business_admin`

Maps USER_JOURNEYS §3 Business (5 tabs).

| Nav label | Route | Journey | Page structure |
|-----------|-------|---------|----------------|
| Dashboard | `/business/dashboard` | Dashboard | KPIs, onboarding checklist, actions |
| Programs | `/business/programs` | Programs | List/create (empty state MVP) |
| Families | `/business/people` | People | Redirect → sub-tabs below |
| Reports | `/business/reports` | Reports | Incident log (empty state MVP) |
| Settings | `/business/settings` | Settings | Hub: profile, billing, invites, staff, analytics→dashboard, digest P1.5, marketplace P2 |

### People sub-routes (§6.4)

| Tab | Route |
|-----|-------|
| Children | `/business/people/children` |
| Parents | `/business/people/parents` |
| Coaches | `/business/people/coaches` |

### Global org bar

- Organization name · Trial badge · Coach mode → `/coach/programs` · Theme · User menu

### Out of shell

| Route | Purpose |
|-------|---------|
| `/business` | Redirect → `/business/dashboard` |
| `/business/onboarding` | Onboarding wizard (pre-`active` status) |

---

## Coach — `coach` (+ `business_admin` via Coach mode)

Maps USER_JOURNEYS §3 Coach (4 tabs).

| Nav label | Route | Journey |
|-----------|-------|---------|
| My Programs | `/coach/programs` | My Programs (home) |
| Report | `/coach/report` | Report |
| Roster | `/coach/roster` | Roster |
| Incidents | `/coach/incidents` | Incidents |

| Route | Purpose |
|-------|---------|
| `/coach` | Redirect → `/coach/programs` |

Director mode link in top bar → `/business/dashboard`.

---

## Parent — `parent`

Maps USER_JOURNEYS §3 Parent (5 tabs).

| Nav label | Route | Journey |
|-----------|-------|---------|
| Today | `/parent/today` | Today |
| Timeline | `/parent/timeline` | Timeline |
| Programs | `/parent/programs` | Programs |
| Care | `/parent/care` | Care |
| Profile | `/parent/profile` | Profile |

### Profile hub (§5.7, §5.13, P-17)

Hub at `/parent/profile` with linked surfaces: Children · Emergency · Pickups · Subscription · Consents · Forms `[P1.5]` · Co-parent `[P1.5]` · Marketplace `[P2]`

### Care hub (§5.9)

Sub-nav: Doctors · Visits · Consults — `/parent/care/*`

### Programs hub (§5.2, §5.3)

Sub-nav: Enrolled `[MVP]` · Discover `[P2]` — `/parent/programs/*`

| Route | Purpose |
|-------|---------|
| `/parent` | Redirect → `/parent/today` |
| `/connect` | Invite code entry (`pending_link`) |
| `/invite/[token]` | Invite activation |
| `/r/[token]` | SMS web report viewer (no shell) |

---

## Admin — `admin`

Maps USER_JOURNEYS §3 Admin + §8.

| Nav label | Route | Journey |
|-----------|-------|---------|
| Dashboard | `/admin/dashboard` | Dashboard + consult queue preview |
| Doctors | `/admin/doctors` | Doctor directory |
| Consults | `/admin/consults` | Incident consult queue |
| Users | `/admin/users` | User lookup / support |
| Businesses | `/admin/businesses` | Program operators |
| Analytics | `/admin/analytics` | MRR, activations, WAPOR |
| Marketplace | `/admin/marketplace` | Curation `[P2]` |

| Route | Purpose |
|-------|---------|
| `/admin` | Redirect → `/admin/dashboard` |

**Marketplace** is in the sidebar with a Phase 2 surface placeholder until curation ships.

---

## Nested routes (MVP backlog — not sidebar)

These are specified in DEVELOPMENT_SPEC and will nest under existing tabs:

| Area | Future routes |
|------|----------------|
| Parent | `/parent/today/[childId]`, `/parent/timeline/[eventId]`, `/parent/care/doctors/[id]` |
| Business | `/business/programs/[programId]`, `/business/reports/[incidentId]` |
| Coach | `/coach/report/[programId]`, `/coach/roster/[programId]` |
| Admin | `/admin/consults/[consultId]`, `/admin/doctors/[id]/edit` |

---

## DEVELOPMENT_SPEC mapping (Director)

| Spec ID | Hub |
|---------|-----|
| B-02 Onboarding | `/business/onboarding` |
| B-03 Roster | `/business/people/*` |
| B-06 Invites | Settings → invites |
| B-07–B-10 Report | Coach shell |
| B-11–B-13 Incidents | `/business/reports` + Coach incidents |
| B-16–B-20 Settings | `/business/settings` |

---

## Auth & role homes

| Role | Home path |
|------|-----------|
| `parent` | `/parent/today` |
| `business_admin` | `/business/dashboard` |
| `coach` | `/coach/programs` |
| `admin` | `/admin/dashboard` |

---

*Last audit: all MVP sidebar destinations exist with premium empty states and hub scaffolding where USER_JOURNEYS defines sub-sections.*
