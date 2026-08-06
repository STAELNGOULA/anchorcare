# ANCHOR — Page & Phase Inventory

**Version:** 1.1 | **Updated:** August 5, 2026  
**Sources:** [USER_JOURNEYS.md](./USER_JOURNEYS.md) §3, §11 · [DEVELOPMENT_SPEC.md](./DEVELOPMENT_SPEC.md) · [NAVIGATION.md](./NAVIGATION.md)

Legend: **Sidebar** = primary shell nav · **Hub** = sub-nav under a tab · **Surface** = nested route (phase placeholder until feature ships)

---

## Parent (`parent`)

### Sidebar — 5 tabs `[MVP]`

| Tab | Route | Phase |
|-----|-------|-------|
| Today | `/parent/today` | MVP |
| Timeline | `/parent/timeline` | MVP |
| Programs | `/parent/programs` → enrolled | MVP |
| Care | `/parent/care` → doctors | MVP |
| Profile | `/parent/profile` | MVP |

### Programs hub

| Surface | Route | Phase | Spec |
|---------|-------|-------|------|
| Enrolled | `/parent/programs/enrolled` | MVP | P-21 |
| Discover | `/parent/programs/discover` | P2 | §5.3 |

### Care hub

| Surface | Route | Phase | Spec |
|---------|-------|-------|------|
| Doctors | `/parent/care/doctors` | MVP | P-11 |
| Visits | `/parent/care/visits` | MVP | P-13 |
| Consults | `/parent/care/consults` | MVP | P-15 |

### Profile hub

| Surface | Route | Phase | Spec |
|---------|-------|-------|------|
| Children | `/parent/profile/children` | MVP | P-18 |
| Emergency cards | `/parent/profile/emergency` | MVP | P-19 |
| Pickups | `/parent/profile/pickups` | MVP | P-20 |
| Subscription | `/parent/profile/subscription` | MVP | P-27 |
| Consents | `/parent/profile/consents` | MVP | P-28 |
| Forms vault | `/parent/profile/forms` | P1.5 | P-25 |
| Co-parent | `/parent/profile/coparent` | P1.5 | P-26 |
| Marketplace | `/parent/profile/marketplace` | P2 | §5.11 |

### Nested (not yet routed)

| Surface | Route | Phase | Spec |
|---------|-------|-------|------|
| Child day detail | `/parent/today/[childId]` | MVP | P-07 |
| Timeline event | `/parent/timeline/[eventId]` | MVP | P-08 |
| Incident detail | `/parent/incidents/[id]` | MVP | P-10 |
| Messages | `/parent/messages` | MVP | P-23 |
| Running late | `/parent/pickup/late` | P1.5 | P-29 |
| Morning health | `/parent/health` | P1.5 | P-24 |

### Out of shell

`/connect` · `/invite/[token]` · `/r/[token]` · `/p/[slug]` · `/p/[slug]/programs/[programSlug]` · auth routes

### Public business page `[MVP]`

| Surface | Route | Phase | Spec |
|---------|-------|-------|------|
| Business landing | `/p/[slug]` | MVP (Phase 8) | PUB-01 |
| Program deep link | `/p/[slug]/programs/[programSlug]` | MVP (Phase 8) | PUB-01 |
| Register from public page | enroll handoff → auth → waiver | MVP (Phase 11) | PUB-02 |

---

## Business (`business_admin`)

### Sidebar — 5 tabs `[MVP]`

| Tab | Route | Phase |
|-----|-------|-------|
| Dashboard | `/business/dashboard` | MVP |
| Programs | `/business/programs` | MVP |
| Families | `/business/people` | MVP |
| Reports | `/business/reports` | MVP |
| Settings | `/business/settings` | MVP |

### People hub

| Surface | Route | Phase |
|---------|-------|-------|
| Children | `/business/people/children` | MVP |
| Parents | `/business/people/parents` | MVP |
| Coaches | `/business/people/coaches` | MVP |

### Settings hub

| Surface | Route | Phase | Spec |
|---------|-------|-------|------|
| Org profile | `/business/settings/profile` | MVP | B-17 (+ public page tab) |
| Billing | `/business/settings/billing` | MVP | B-20 |
| Invites | `/business/settings/invites` | MVP | B-06 |
| Staff | `/business/settings/staff` | MVP | B-19 |
| Analytics | `/business/dashboard` | MVP | §6.5 |
| Weekly digest | `/business/settings/digest` | P1.5 | B-23 |
| Marketplace | `/business/settings/marketplace` | P2 | §6.6 |
| Compliance export | `/business/settings/compliance` | P2 | B-21 |

### Programs surfaces

| Surface | Route | Phase |
|---------|-------|-------|
| Create program | `/business/programs/new` | MVP | B-25 |
| Program detail | `/business/programs/[programId]` | MVP | B-25 |
| Season rollover | `/business/programs/[id]/rollover` | P2 |

### Out of shell

`/business/onboarding` `[MVP]`

---

## Coach (`coach`)

### Sidebar — 4 tabs

| Tab | Route | Phase |
|-----|-------|-------|
| My Programs | `/coach/programs` | MVP |
| Report | `/coach/report` | MVP |
| Roster | `/coach/roster` | MVP |
| Incidents | `/coach/incidents` | MVP |

### Roster hub

| Surface | Route | Phase | Spec |
|---------|-------|-------|------|
| Standard | `/coach/roster` | MVP | B-03 |
| Field mode | `/coach/roster/field` | P1.5 | B-03b |

### Nested (not yet routed)

| Surface | Route | Phase |
|---------|-------|-------|
| Report by program | `/coach/report/[programId]` | MVP |
| Voice record | `/coach/report/[programId]/voice` | MVP |
| AI review | `/coach/report/[programId]/review` | MVP |
| Incident form | `/coach/incidents/new` | MVP |

---

## Admin (`admin`)

### Sidebar — 7 items

| Tab | Route | Phase |
|-----|-------|-------|
| Dashboard | `/admin/dashboard` | MVP |
| Doctors | `/admin/doctors` | MVP |
| Consults | `/admin/consults` | MVP |
| Users | `/admin/users` | MVP |
| Businesses | `/admin/businesses` | MVP |
| Marketplace | `/admin/marketplace` | P2 |
| Analytics | `/admin/analytics` | MVP |

### Nested (not yet routed)

| Surface | Route | Phase |
|---------|-------|-------|
| Consult detail | `/admin/consults/[consultId]` | MVP |
| Doctor edit | `/admin/doctors/[id]` | MVP |
| Visit upload | `/admin/visits/upload` | MVP |

---

## Build phases (USER_JOURNEYS §11)

| Phase | Weeks | Sidebar impact | Page impact |
|-------|-------|----------------|-------------|
| **MVP** | 1–12 | All 4 role shells | Core tabs + hub surfaces above |
| **P1.5** | 13–16 | No new tabs | Digest, field mode, forms, co-parent, running late |
| **P2** | 17–24 | Admin Marketplace | Discover, marketplaces, compliance, payments |
| **P3** | Scale | TBD | Quebec FR, camp templates, expense tracking |

---

*Phase placeholders use `SurfacePlaceholder` with phase badges until feature implementation. Sidebar IA stays stable across phases — new capability nests under existing tabs.*
