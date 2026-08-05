# ANCHOR_CARE — User Journeys

**Version:** 3.1 | **Updated:** August 3, 2026  
**Related:** [PRD.md](./PRD.md) | [DEVELOPMENT_SPEC.md](./DEVELOPMENT_SPEC.md) | [STRATEGY.md](./STRATEGY.md)

Where your child's day away from home lives — and where care starts when something goes wrong.

---

## How to Read This Doc

1. **Build order:** Follow sections 2 → 11 (MVP first). Coach uses the same screens as Business with fewer permissions — build once.
2. **Phases:** `[MVP]` ship first · `[P1.5]` after pilot · `[P2]` scale · `[P3]` later
3. **Growth loop:** Business creates program → invites parents → Coach posts daily → Parent timeline grows → Parent upgrades → Business renews ANCHOR Pro

**Positioning:** Works alongside Brightwheel, TeamSnap, etc. We own **daily story, safety, care, and enrollment** — not full accounting or game scheduling.

---

## 1. Four Roles (Who Does What)

### Parent
1. Sign up (email + password, Google, Apple)
2. Add and manage children
3. Discover programs `[P2]` or join via invite `[MVP]`
4. Register child in program; pay `[P2 in-app / MVP external link]`
5. View child timeline: photos, videos, voice reports, notes, transcripts
6. Emergency card and authorized pickups
7. Incident alerts and response; care and clearance
8. Doctor directory and book appointments (external)
9. Marketplace browse and buy `[P2]`
10. Weekly digest email per child `[P1.5]`
11. ANCHOR Family subscription (timeline, care, multi-child)

### Business (Owner / Director)
1. Sign up and manage org profile + ANCHOR Pro subscription
2. Create and manage **programs** (teams, classrooms, camps)
3. Manage roster: children, parents, registrations per program
4. Invite and manage **Coaches** (employees)
5. Approve registrations and waivers
6. Analytics: parent adoption, report opens, incidents `[MVP]` · program revenue snapshot `[P2]`
7. Finances: ANCHOR subscription + registration payments `[P2]` — not full business accounting
8. Marketplace: list equipment/products for parents `[P2]`
9. Broadcast messaging; compliance export `[P2]`
10. Weekly digest email (business performance) `[P1.5]`

### Coach (Staff)
1. Log in to **Coach app** (same codebase, restricted role)
2. View only **programs assigned** to them
3. View children and parents in assigned programs
4. Upload photos/videos; tag children
5. Record daily activity (voice → AI report); add notes per child
6. Publish daily report per child / per group
7. View emergency card and authorized pickups (read-only)
8. Report incidents
9. Broadcast to assigned program parents
10. **Cannot:** billing, org settings, add programs, manage employees, marketplace admin

### Admin (ANCHOR internal)
1. Doctor directory and booking links
2. Visit report uploads
3. Incident consult queue
4. Marketplace curation `[P2]`
5. Platform support, moderation, analytics

**Child-safety rule:** Parent is always in any child-related thread. Coach cannot message a child without parent in thread.

---

## 2. Fast-Build Architecture (One Codebase)

Build **shared engines** once; expose by role permissions.

1. **Auth engine** — email/password, OAuth, role: parent | business_admin | coach | admin
2. **Program engine** — org → programs → roster entries → children
3. **Timeline engine** — all events write to `timeline_events` (reports, media, incidents, notes, registrations)
4. **Media engine** — upload, tag children, notify parents
5. **Voice AI engine** — record → transcribe → draft per child → coach review → publish
6. **Incident engine** — form, alert, audit log, PDF export `[P1.5]`
7. **Notification engine** — push, SMS, email, quiet hours `[P1.5]`
8. **Care engine** — doctors, JANE links, visit vault, consult queue
9. **Payment engine** — Stripe: parent Family + business Pro `[MVP]` · Connect for program fees + marketplace `[P2]`

**Coach app = Business app with `role=coach` filter.** Do not build a separate codebase.

---

## 3. App Structure (Tabs per Role)

### Parent — 5 tabs
1. **Today** — child status, latest report, alerts
2. **Timeline** — photos, videos, reports, notes, transcripts
3. **Programs** — enrolled programs; discover/browse `[P2]`
4. **Care** — doctors, visits, incident consult
5. **Profile** — children, emergency card, pickups, subscription, marketplace `[P2]`

### Business — 5 tabs
1. **Dashboard** — adoption %, today's activity, trial status
2. **Programs** — list, create, registrations per program
3. **People** — children, parents, coaches
4. **Reports** — org-wide incident log, compliance `[P2]`
5. **Settings** — billing, marketplace `[P2]`, analytics, digest

### Coach — 4 tabs (mobile-first)
1. **My Programs** — assigned programs only
2. **Report** — voice record, photos, notes (same screen)
3. **Roster** — children, emergency cards, field mode `[P1.5]`
4. **Incidents** — report + history for assigned programs

### Admin — web portal
1. Dashboard · Doctors · Consults · Users · Businesses · Marketplace `[P2]` · Analytics

---

## 4. Subscriptions

### Parent
1. **Free** — Today + 7-day timeline; 1 child; 1 program; incident alerts; SMS web viewer; basic emergency card
2. **ANCHOR Family** ($14.99/mo or $149/yr) — All children and programs; full timeline; care; visit vault; forms vault `[P1.5]`; co-parent `[P1.5]`; weekly child digest `[P1.5]`; PDF export

### Business
1. **Pro** ($99/mo, 14-day trial) — Unlimited programs; coaches; voice AI; photos; notes; incidents; registrations; messaging; adoption analytics; weekly business digest `[P1.5]`; verified badge

### Coach
1. **Free** — included via Business Pro; no separate subscription

### Paywall (Parent Free → Family)
1. Timeline beyond 7 days
2. Second child or second program
3. Care booking or incident consult
4. Timeline PDF export
5. Full weekly digest (Free gets 7-day summary only)

---

## 5. Parent Journeys

### 5.1 Sign Up & Add Children `[MVP]`
1. Email + password (or Google / Apple)
2. Verify email and phone (SMS for incidents)
3. Country + state/province
4. Add child: name, DOB, photo, allergies, meds, emergency contacts
5. Land on Today (empty until linked to a program)

### 5.2 Join a Program `[MVP]` — Primary path
1. Receive SMS/link: "[Business] invited you to [Program]"
2. Activate in under 60 seconds; confirm child
3. **Copy health profile** if child already on account (allergies, meds, contacts pre-filled)
4. Sign waivers; set consents
5. **Pay:** MVP = external link or admin marks paid · P2 = in-app Stripe checkout
6. Registration pending → Business approves → child appears under **Programs** tab

### 5.3 Discover Programs `[P2]` — Secondary path
1. Browse **Programs** tab: businesses near you, by type (sports, daycare, camp)
2. View program details, price, dates
3. Register child → same waiver + payment flow

### 5.4 Today & Daily Report `[MVP]`
1. Push/SMS: "[Child]'s day is ready"
2. Open Today → child card with report snippet, photo count, alerts
3. Tap → full daily report: AI text, coach notes, voice transcript, tagged media
4. SMS web link works without app install

### 5.5 Timeline `[MVP]`
1. **Timeline** tab → select child
2. Chronological feed across all programs:
   - Daily reports and transcripts
   - Photos and videos
   - Coach notes
   - Incidents and clearances
   - Doctor visits
   - Registrations
3. Free: 7 days · Family: full history + export PDF

### 5.6 Weekly Digest Email (Per Child) `[P1.5]`
1. Every Sunday evening: email per child (or one email, all children)
2. Summary: reports received, photo count, incidents (if any), upcoming form expiries
3. CTA: open app Timeline
4. Family plan feature; Free gets last 7 days summary only

### 5.7 Emergency Card & Pickups `[MVP]`
1. **Profile** → child → Emergency card
2. Allergies, meds, conditions, contacts; per-program visibility toggles
3. Authorized pickups + today-only override `[P1.5]`
4. Running late for pickup `[P1.5]`

### 5.8 Incident Response `[MVP]`
1. Push + SMS: "Incident at [Program] — tap to view"
2. View details; choose: Book doctor / Talk to our team (Family) / I'm handling it / 911
3. Share clearance to program when ready

### 5.9 Care & Doctors `[MVP]`
1. **Care** tab → doctor and practitioner directory
2. Book via JANE (CA) or US provider link
3. Visit report appears in vault after appointment
4. Share clearance summary to program

### 5.10 Incident Consult (Family Plan) `[MVP]`
1. From incident alert or Care tab → Talk to our team
2. Async chat; clinician sees child profile + incident context + recent timeline
3. Care plan saved to vault; clinician may set clearance
4. Free plan → upgrade modal before starting consult

### 5.11 Marketplace `[P2]`
1. **Profile** → Marketplace or tab badge
2. Browse products from enrolled businesses (equipment, uniforms, photos packages)
3. Tap → external checkout or Stripe checkout `[P2]`
4. MVP: Admin-curated featured links only if needed before P2

### 5.12 Upgrade Triggers `[MVP]`
1. Timeline beyond 7 days
2. Second child or second program on Free
3. Care booking or incident consult
4. Full weekly digest

### 5.13 Account & Consents `[MVP]`
1. **Profile** → subscription (Stripe portal)
2. Consents per child per program (photos, medical, emergency card)
3. Notification preferences; quiet hours 9pm–7am `[P1.5]` (incidents always break through)
4. Co-parent invite `[P1.5]`

### 5.14 SMS Reply Without App `[P2]`
1. Reply to report SMS → routes to parent↔business thread
2. Rate-limited; no PHI in SMS body

---

## 6. Business Journeys

### 6.1 Sign Up & Onboarding `[MVP]`
1. Email + password; verify
2. Org profile: name, logo, type, address, jurisdiction
3. Coexistence: "Use Brightwheel/TeamSnap?" — we work alongside
4. Start 14-day Pro trial
5. Create first **program** (name, dates, capacity, price display)
6. Invite coaches; generate parent invite link/QR
7. Goal: first coach report within 48 hours

### 6.2 Programs `[MVP]`
1. **Programs** tab → create/edit/archive program
2. Fields: name, type, age range, start/end dates, capacity, description, price (display; payment P2)
3. Per program: roster, registrations, assigned coaches
4. Season rollover: archive program, clone for new season `[P2]`

### 6.3 Registrations `[MVP]`
1. View all registrations: pending, active, waitlist `[P2]`
2. Approve/reject; see digital waiver status
3. Export roster CSV
4. Parent adoption: "18/25 families activated"

### 6.4 People Management `[MVP]`
1. **People** tab → Children | Parents | Coaches
2. Children: roster across programs; link to parent
3. Parents: contact, activation status, message thread
4. Coaches: invite email, assign to program(s), deactivate

### 6.5 Analytics `[MVP]` / Finances `[P2]`
**MVP analytics (no resistance — proves value):**
1. Parent activation %
2. Daily report open rate
3. Incident count
4. Voice report days used
5. Weekly digest email `[P1.5]`

**P2 finances (realistic scope — not QuickBooks):**
1. Registration revenue collected via ANCHOR (Stripe Connect)
2. ANCHOR subscription cost
3. Simple profit snapshot per program (registration $ in − fees)
4. Expense log manual entry `[P3]` — do not build full accounting in v1

### 6.6 Marketplace Admin `[P2]`
1. Add product: name, image, price, description, URL or in-app checkout
2. Visible to parents enrolled in their programs (or public `[P3]`)
3. Order notifications to business admin

### 6.7 Broadcast & Messaging `[MVP]`
1. Broadcast to program or all parents
2. Parent↔business threads (parent always included)

### 6.8 Weekly Digest Email (Business) `[P1.5]`
1. Monday email to director: activation %, open rates, incidents, coach report consistency, trial days left

### 6.9 Billing `[MVP]`
1. ANCHOR Pro trial → Stripe subscription
2. Lapsed → coaches cannot publish new reports; parents keep read access

### 6.10 Incident Insurance PDF `[P1.5]`
1. From incident detail → Export for insurance
2. PDF: incident record, photos, parent notification log, amendments
3. Download or email for insurer / club board

### 6.11 Substitute / Field Mode `[P1.5]`
1. Roster toggle: simplified view (photo, name, allergies, clearance, pickup ETA)
2. Coach default on sideline; director uses full roster
3. Emergency card still 2 taps (fullscreen)

### 6.12 Compliance Export (Bulk) `[P2]`
1. Date range → PDF/CSV: incidents, notifications, waivers, staff actions

---

## 7. Coach Journeys

### 7.1 Coach Onboarding `[MVP]`
1. Receives invite from Business admin
2. Creates account (email + password)
3. Sees only assigned programs
4. Optional: 2-minute in-app tour (Report → Roster → Incidents)

### 7.2 Daily Workflow `[MVP]`
**Morning**
1. Open **My Programs** → select program
2. **Roster** → field mode: allergies, clearances, pickup overrides `[P1.5]`
3. Check parent health flags `[P1.5]`

**During day**
4. **Report** → upload photos/videos → tag children
5. Add quick **note** per child (text, optional)

**End of day**
6. **Report** → Record voice memo for group
7. AI drafts per-child daily report + transcript
8. Review, edit, publish → each parent notified
9. Parents see: report text + transcript + photos + notes in Timeline

### 7.3 Per-Child Daily Report `[MVP]`
1. From roster → tap child → **Add report** (voice or text)
2. Publish single-child update without full group recording
3. Appears on parent Timeline as daily report event

### 7.4 Emergency & Incidents `[MVP]`
1. **Roster** → child → Emergency card (fullscreen, read-only)
2. **Incidents** → Report incident → parent alerted immediately (push + SMS)
3. RED-flag cases (head injury, breathing) → priority parent alert + admin queue if Family parent
4. Cannot edit emergency card or parent pickups
5. Business admin can export insurance PDF `[P1.5]`; coach submits only

### 7.5 Broadcast `[MVP]`
1. Send message to all parents in assigned program only
2. Parent always in thread

### 7.6 Coach Weekly Digest `[P1.5]`
1. Optional email to coach: "You published 4/5 report days this week; 92% parents opened"

### 7.7 What Coaches Cannot Do
1. Create programs or edit org settings
2. View business finances or ANCHOR billing
3. Add/remove children without admin approval
4. Manage marketplace listings
5. Message child without parent in thread

---

## 8. Admin Journeys

### 8.1 Platform Management `[MVP]`
1. Doctor/practitioner directory (CA/US booking links)
2. Upload visit reports to child vaults
3. Incident consult queue (Family plan parents)
4. User/business lookup, suspend, support

### 8.2 Marketplace Curation `[P2]`
1. Approve business listings; feature products; remove violations

### 8.3 Analytics `[MVP]`
1. MRR, activations, WAPOR (weekly active parents opening reports), consult volume

---

## 9. Child Timeline (Shared Event Types)

Every role action writes to the same timeline (parent view):

1. Daily report (+ voice transcript)
2. Coach note
3. Photo / video
4. Incident
5. Clearance shared
6. Doctor visit report
7. Registration / waiver signed
8. Form uploaded `[P1.5]`
9. Running late / pickup update `[P1.5]`
10. Marketplace order confirmation `[P2]`

---

## 10. Notifications

**Rule:** No symptoms or diagnoses in push/SMS body.

1. Daily report published → Parent (push + SMS)
2. Coach note added → Parent (push)
3. Photos uploaded → Parent (push)
4. Incident → Parent (push + SMS), Business admin (push), Admin consult queue if Family
5. Visit report uploaded → Parent (push)
6. Clearance shared → Business (push)
7. Clinician reply → Parent (push)
8. Registration / waiver pending → Parent (push)
9. Running late → Business roster banner `[P1.5]`
10. Weekly digest → Parent (email Sun) `[P1.5]` · Business (email Mon) `[P1.5]` · Coach optional `[P1.5]`
11. Broadcast → Parents in program (push)
12. Marketplace order → Business admin `[P2]`
13. Trial ending → Business (email + push)
14. Quiet hours: suppress reports/photos only; incidents always notify `[P1.5]`

---

## 11. Build Phases (Fastest Path to Revenue)

### MVP — Weeks 1–12 (sell to first 10 businesses)
1. Auth: Parent, Business admin, Coach, Admin (RBAC)
2. Programs + roster + registrations + digital waivers (approve flow; pay = external link)
3. Parent invite SMS + web report viewer
4. Coach: voice AI report, photos, notes, tag children, publish
5. Parent: Today, Timeline (7-day free), Programs enrolled view
6. Emergency card + authorized pickups + health profile copy
7. Incidents + parent alerts + clearance share
8. Care: doctor directory + JANE links + visit upload + incident consult (Family)
9. Parent↔business messaging + broadcast
10. Business: dashboard adoption metrics, coach invites, program CRUD
11. Stripe: Parent Family + Business Pro

### Phase 1.5 — Weeks 13–16 (retention + less resistance)
1. Parent weekly child digest email
2. Business weekly digest email
3. Running late + today pickup override
4. Substitute / field mode roster
5. Insurance incident PDF
6. Forms vault
7. Morning health tap
8. Co-parent access
9. Quiet hours notifications
10. Coach weekly digest email
11. Shift handoff notes (daycare)

### Phase 2 — Weeks 17–24 (growth + monetization)
1. In-app program payment (Stripe Connect)
2. Program discovery / browse for parents
3. Marketplace (listings + checkout)
4. Business revenue snapshot per program
5. Season rollover
6. SMS reply to report texts
7. Bulk compliance export
8. Referral program (parent + business)
9. Brightwheel / TeamSnap roster import integrations

### Phase 3 — Scale
1. Camp/school templates, French (Quebec), Agora video, full expense tracking

---

## 12. Edge Cases

1. Coach removed mid-season → read-only access to past reports; no new publishes
2. Parent in multiple programs → one timeline per child, filtered by program
3. Coach assigned to multiple programs → program picker on Report tab
4. Business on Brightwheel → ANCHOR for story + safety only; copy says coexist
5. Payment external (MVP) → parent uploads receipt or admin marks paid `[MVP]`
6. AI wrong child in voice draft → coach must review before publish
7. Incident amended within 24h → parent notified
8. Coach tries to access billing → 403 + "Contact your director"
9. Marketplace order dispute → business handles; ANCHOR not merchant of record until P2 Connect
10. Weekly digest unsubscribed → incident SMS still sent

---

## 13. What We Improved vs. Raw Feature List

**Kept and sharpened**
1. Four roles — Coach split from Business for clarity and SafeSport compliance
2. Programs as first-class entity (not just "groups")
3. Timeline includes transcript + notes + media + reports (your daily story)
4. Weekly digest for **parent and business** (emotional retention + B2B ROI)
5. Marketplace and in-app pay — valued but **P2** so MVP ships in 12 weeks

**Deferred to avoid build death (still on roadmap)**
1. Full business accounting (profit/expenses) → P2 snapshot only; not QuickBooks
2. Marketplace checkout → P2; MVP = external links if urgent
3. Parent browse all businesses → P2; MVP = invite-led (higher activation)
4. AI face tagging → never; manual tag only

**Why this wins in market**
1. Coaches get one **Report** screen (voice + photos + notes) — faster than Brightwheel typing
2. Parents get **one Timeline** across all programs — nobody else does this
3. Businesses get **adoption analytics + incident PDF** — sells to insurance-conscious sports clubs
4. **Coach role** reduces director overwhelm — scalable staffing model

---

## 14. Out of Scope

1. Full accounting / payroll / tax filing
2. Game scheduling and live scores (TeamSnap)
3. Daycare billing and check-in replacement (Brightwheel)
4. AI face recognition on photos
5. Private coach-to-child messaging
6. Child social feeds
7. Ads and behavioral tracking of minors

---

## 15. Documentation Index (Complete Set)

1. **[USER_JOURNEYS.md](./USER_JOURNEYS.md)** (this file) — Roles, flows, build phases, edge cases
2. **[PRD.md](./PRD.md)** — Requirements, subscriptions, functional specs, MVP scope
3. **[DEVELOPMENT_SPEC.md](./DEVELOPMENT_SPEC.md)** — Per-page flows, toasts, notifications, UI/UX for engineering
4. **[STRATEGY.md](./STRATEGY.md)** — PMF validation, MRR model, GTM, competitive moat, billion-dollar path, risks

### Build order for engineering
1. Read STRATEGY §3 (validate before over-building)
2. Implement shared engines (section 2 above)
3. Follow DEVELOPMENT_SPEC MVP pages: Coach Report → Parent Timeline → Business Dashboard
4. Ship when PMF signals in STRATEGY §3 are measurable

---

*Engineering: implement shared engines (section 2) first, then Parent Today/Timeline, then Coach Report flow, then Business dashboard — in that order.*
