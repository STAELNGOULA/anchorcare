# ANCHOR — Program (Director) Navigation

Canonical IA for `business_admin` role. Maps USER_JOURNEYS §3 and Option C (Command Center) from executive committee review.

## Director shell

| Nav label | Route | Purpose |
|-----------|-------|---------|
| Home | `/business/dashboard` | Adoption KPIs, onboarding checklist, next actions |
| Programs | `/business/programs` | List, create, archive programs; per-program hub |
| Families | `/business/people` | Parents, children, coaches; activation status |
| Reports | `/business/reports` | Org incident log, compliance exports |
| Settings | `/business/settings` | Org profile, billing, invites, staff |

## Global org bar

- Organization name
- Program switcher (hidden when single program; wired in Phase P3)
- Trial / subscription badge
- User menu: Settings, Support, Sign out
- Coach mode → `/coach/programs` (directors who also publish reports)

## Coach shell (separate)

| Nav | Route |
|-----|-------|
| My Programs | `/coach/programs` |
| Report | `/coach/report` (future) |
| Roster | `/coach/roster` (future) |
| Incidents | `/coach/incidents` (future) |

## DEVELOPMENT_SPEC mapping

| Spec ID | Director hub |
|---------|----------------|
| B-02 Onboarding | `/business/onboarding` (outside shell) |
| B-03 Roster | Programs detail → Families |
| B-06 Invites | Settings → invites |
| B-07–B-10 Report publish | Coach shell or Coach mode |
| B-11–B-13 Incidents | Reports |
| B-16–B-19 Settings | Settings |

## Out of shell

- `/business/onboarding` — wizard before `active` onboarding status
- Marketing and auth routes — public
