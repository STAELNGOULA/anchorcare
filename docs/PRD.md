# ANCHOR_CARE — Product Requirements Document (PRD)

**Version:** 2.1  
**Status:** Draft  
**Last updated:** August 5, 2026  
**Owner:** Product  
**Related:** [USER_JOURNEYS.md](./USER_JOURNEYS.md) | [DEVELOPMENT_SPEC.md](./DEVELOPMENT_SPEC.md) | [STRATEGY.md](./STRATEGY.md)

---

## 1. Executive Summary

ANCHOR_CARE is the parent command center for everything that happens to a child away from home — daily updates, safety, care access, and one timeline per child across all programs.

**One-line pitch:** *Where your child's day away from home lives — and where care starts when something goes wrong.*

**Launch markets:** Canada and United States (jurisdiction-aware from day one).

**Launch wedge:** Daycare and preschool first, youth sports second.

**Primary growth loop:** Business shares public page → parent registers for a program → first daily report within 48 hours → timeline grows → parent upgrades → business renews Pro.

**Secondary loop:** Business invites parent directly → same path after activation.

---

## 2. Problem Statement

### Parents
1. Children attend multiple programs (daycare, sports, camps) with fragmented communication.
2. Parents miss daily moments and lack one place for their child's history away from home.
3. When something happens, parents get vague texts with no clinical path forward.
4. Health forms, allergies, and emergency info are re-shared to every program every season.

### Businesses
1. Staff spend 30+ minutes daily typing parent updates.
2. Incident documentation is paper-based or lost in personal texts — liability exposure.
3. Parents call constantly for updates; no scalable communication channel.
4. No simple way to see which families are activated on a trusted platform.
5. Small programs pay $500–$5,000+ for a basic website that still does not handle enrollment or daily parent updates.

### Care gap
1. Telehealth apps (Blueberry, Summer Health) lack activity context.
2. Activity apps (TeamSnap, Brightwheel) lack a care bridge when incidents occur.
3. No product owns the full loop: daily story → incident → care → clearance → timeline.

### How they operate today (2026 reality)
1. **Parents** juggle Brightwheel or HiMama (daycare), TeamSnap or GroupMe (sports), email/PDF for camp forms, and personal texts to coaches — no unified child view.
2. **Daycare staff** spend 30–45 minutes typing end-of-day reports into existing ops apps; photos require per-child tagging.
3. **Sports volunteers** document injuries via personal texts with no insurance-grade record; clearance is verbal ("he's fine").
4. **Front desks** field daily calls: "How was lunch?", "Grandma's picking up", "I'm running late."
5. **Substitute teachers/coaches** miss allergy info on whiteboards or buried profile screens.

We do **not** replace Brightwheel billing or TeamSnap scheduling. We are the **care + story layer** that works alongside them.

---

## 3. Goals & Success Metrics

### Business goals (12 months)
1. 200 paying businesses
2. 5,000 activated parent accounts (invited and completed signup)
3. 40% parent Free → Family conversion within 30 days of first report
4. 85% business 90-day retention
5. $30K MRR split 60% business / 40% parent

### Product metrics (pilot)
1. Parent daily report open rate (WAPOR) > 70%
2. Business voice report usage > 80% of active days
3. Incident → parent view median < 5 minutes
4. Parent activation from invite > 60% within 7 days
5. NPS (parents) > 50

See [STRATEGY.md](./STRATEGY.md) for PMF validation playbook, MRR scenarios, and GTM.

### Non-goals (MVP)
1. Marketplace commerce
2. Full scheduling/billing platform
3. AI face recognition on photos
4. Video consults (Agora) — Phase 3
5. Replacing primary care physicians

---

## 4. Target Users

### Primary ICP — Business (buyer)
1. Licensed daycare / preschool (20–80 children)
2. Youth sports club (1–10 teams, 50–200 athletes)
3. Decision maker: director, owner, club administrator

### Primary ICP — Parent (user + subscriber)
1. Ages 28–45, 1–3 children in organized activities
2. Invited by a business (not cold acquisition in year 1)
3. Motivated by: child's daily visibility, safety, reducing admin burden

### Admin (internal)
1. Clinical ops: doctors, visit reports, incident consult queue
2. Platform ops: support, moderation, analytics

---

## 5. Product Pillars (3 Heroes)

### Hero 1 — Voice Daily Report (Business value)
Staff records one voice memo → AI drafts per-child reports → parents receive personalized daily updates. Saves staff time; drives daily parent habit.

### Hero 2 — Child Timeline + Emergency Card (Parent value)
One chronological feed across all linked businesses. Digital emergency card (allergies, meds, contacts) visible to authorized staff in 2 taps.

### Hero 3 — Incident → Care → Clearance (Both sides)
Structured incident report → instant parent alert → one-tap care path (book doctor / incident consult) → clearance shared back to business.

### Hero 4 — Public Business Page (Business acquisition + parent conversion) `[MVP]`
Every paying business gets a **shareable public landing page** at `/p/[slug]` — a premium, conversion-optimized storefront that replaces the need for a separate website. Shows org story, photos, trust signals, **program prices**, and **book & pay** in one flow. Dedicated **program pages** at `/p/[slug]/programs/[programSlug]` for deep links.

**Business value:** One link for Instagram bio, Google Business Profile, flyers, and front-desk QR — enrollment + daily updates in one platform.

**Parent value:** Trustworthy, mobile-first page with clear pricing, ages, dates, and instant register CTA.

---

## 6. User Roles

1. **Parent** — manages children, programs, timeline, care subscription, consents
2. **Business** — org owner/director: programs, registrations, coaches, analytics, ANCHOR billing, marketplace admin `[P2]`
3. **Coach** — assigned programs only: daily reports, photos, notes, incidents, roster (read), broadcast; no billing or org settings
4. **Admin** — ANCHOR internal: doctors, visit reports, consult queue, platform moderation

**Implementation:** Coach uses same app as Business with `role=coach` RBAC — one codebase.

**Child-safety rule:** Parent is always included in any child-related communication thread. No private coach-to-minor messaging.

---

## 7. Subscription Model

### Parent
1. **Free** — today + 7-day timeline; 1 child; 1 program; incident alerts; SMS web viewer; basic emergency card
2. **ANCHOR Family** — $14.99/mo or $149/yr — all children and programs; full timeline; care; visit vault; weekly child digest `[P1.5]`; forms vault `[P1.5]`; PDF export; co-parent `[P1.5]`

### Business
1. **Pro** — $99/mo — 14-day trial; unlimited programs; unlimited coaches; voice AI; photos; notes; incidents; registrations; messaging; adoption analytics; weekly business digest `[P1.5]`; verified badge

### Coach
1. Included with Business Pro — no separate fee

### Paywall logic
1. Free parent hits upgrade when viewing history beyond 7 days, adding second child/business, accessing Care tab booking, or exporting timeline
2. Business trial ends → voice AI and new reports locked until paid

---

## 8. Functional Requirements

### 8.1 Authentication & Onboarding
1. Email + password, Google, Apple sign-in
2. Email verification required before PHI access
3. Capture parent state/province and country (US/CA) at signup
4. Business captures jurisdiction for compliance templates
5. SMS verification for incident alerts (optional but recommended)

### 8.2 Child Profile
1. Legal name, preferred name, DOB, photo
2. Allergies, medications, conditions, emergency contacts
3. Authorized pickup persons (name, relationship, phone, optional photo)
4. Per-business consent: photo sharing, medical info sharing, emergency card visibility

### 8.3 Emergency Card
1. Single-screen view optimized for staff (large text, offline cache on mobile)
2. Business sees only fields parent authorized for that org
3. Accessible from roster child detail in 2 taps

### 8.4 Programs & Roster
1. Org profile (internal + **public page fields** — see §8.28)
2. **Programs** (first-class): name, type, dates, capacity, **structured price** (amount, currency, billing interval), description, assigned coaches, **public listing fields** (see §8.28)
3. Roster per program: manual add, CSV import, parent self-register via invite or **public book & pay**
4. Registration workflow: child → waiver → **Stripe Checkout (Connect)** on public page, program page, or invite; pending → approved → active; **auto-approve on successful payment** (configurable)
5. Parent adoption metric: "X/Y families activated"
6. Digital waivers with e-signature and timestamp
7. Season rollover: archive program, carry forward profiles `[P2]`

### 8.5 Coach Daily Content
1. Voice → AI daily report per program (see 8.6)
2. Per-child text notes attached to timeline
3. Photos/videos with manual child tagging
4. Coach sees only assigned programs and their rosters
5. Coach weekly digest email (report consistency) `[P1.5]`

### 8.6 Voice → AI Daily Report
1. Record 60 sec – 5 min memo per group
2. Async pipeline: upload → transcribe → draft per-child reports from roster names
3. Staff review screen: edit, skip, merge before publish
4. Never auto-publish without human review
5. Audio retained 30 days; transcript retained per policy
6. Phase 2: offline record + sync

### 8.7 Photos & Videos
1. Upload from device; tag one or more children manually
2. Optional activity tag (meal, nap, outdoor, sports)
3. Push + SMS link to parents of tagged children
4. No AI face matching in MVP

### 8.8 Incidents
1. Structured form: time, location, mechanism, body area, symptoms, photos, action taken, witnesses
2. Sports template at launch; daycare illness template Phase 2
3. RED-flag auto-escalation (head injury + confusion, breathing difficulty)
4. Parent notified via push + SMS within 3 seconds of submit
5. Business can amend within 24 hours with parent notification

### 8.9 Care
1. Doctor directory with bio, specialties, country
2. Booking deep link: JANE (Canada primary), US provider link per doctor (SimplePractice, Calendly, etc.)
3. Admin uploads post-visit report PDF to child vault
4. Incident-triggered async consult (Family plan): chat with incident context pre-loaded
5. Clinician can set clearance: Cleared / Restricted / Cleared with conditions + expiry
6. Parent one-tap share clearance summary to business (not full clinical note)

### 8.10 Child Timeline
1. Unified chronological feed per child across all programs
2. Event types: daily report, transcript, coach note, media, incident, consult, visit report, clearance, registration, form uploaded
3. Free: 7-day rolling window
4. Family: full history + PDF export

### 8.11 Forms Vault `[P1.5]`
1. Upload immunization, physical, camp forms once
2. Expiry reminders at 30/14/7 days
3. Share to linked business with one tap

### 8.12 Messaging
1. Business broadcasts to group (e.g. "Practice cancelled")
2. Thread with child always includes parent
3. No PHI in notification preview text

### 8.13 Subscriptions & Billing
1. Stripe Checkout for parent Family and business Pro
2. Stripe Customer Portal for self-serve manage/cancel
3. Business 14-day trial without voice AI cap or with limited reports (TBD in implementation)

### 8.14 Referrals `[P2]`
1. Parent refers parent → 1 month free
2. Business refers business → account credit

### 8.15 Running Late
1. Parent one-tap: "Running 15 min late" (or custom ETA) per child per active program
2. Business front desk / roster shows pickup alert banner
3. Reduces phone calls to front desk

### 8.16 Substitute / Field Mode
1. Simplified roster view: child photo, name, allergy strip, today's pickup override, clearance badge only
2. Large typography; optimized for substitutes and sideline coaches
3. Full emergency card still 2 taps away

### 8.17 Insurance-Ready Incident PDF
1. One-tap export per incident: full record, photos, parent notification timestamps, amendments
2. Formatted for insurance and club board review (sports primary use case)
3. Included in compliance export bundle

### 8.18 Business Weekly Digest Email `[P1.5]`
1. Automated Monday email to business admin: parent activation %, report open rate, incidents count, voice report days used
2. Drives retention and proves ROI before trial ends

### 8.19 Parent Weekly Child Digest Email `[P1.5]`
1. Sunday email per child (or combined): reports count, photos, incidents summary, form reminders
2. Family plan full digest; Free gets 7-day summary teaser
3. CTA opens Timeline tab

### 8.20 Season Rollover `[P2]`
1. Archive completed season/group; roster moves to historical
2. Carry forward child health profiles and waiver templates to new season
3. Parents re-confirm or update emergency card once — not full re-onboarding

### 8.21 Health Profile Copy to New Program `[MVP]`
1. When parent links a second business, offer to copy emergency card + forms from existing profile
2. Program-specific waiver still required; health data pre-filled

### 8.22 SMS Two-Way Reply `[P2]`
1. Parent replies to report SMS with short message → routes to parent↔business thread
2. Rate-limited; no PHI in SMS body; full thread in app

### 8.23 Coexistence Onboarding `[MVP]`
1. Business onboarding asks: "Do you use Brightwheel, TeamSnap, or other tools?"
2. Show positioning copy: "ANCHOR works alongside your existing tools — we handle daily story, safety, and care."
3. No integration required at launch; export/share bridges later

### 8.24 Program Discovery (Parent)
**MVP — via public business pages (§8.28)**
1. Parent lands on `/p/[slug]` from business share link (social, QR, email)
2. Browses programs on that page; taps Register → account + waiver flow

**P2 — in-app discovery**
1. Browse/search programs by location, type, age inside ANCHOR app
2. City SEO index pages aggregating verified programs
3. Deep links still resolve to public business page for conversion

### 8.25 Marketplace `[P2]`
1. Businesses list products (equipment, uniforms, photo packages)
2. Parents browse from enrolled programs or public catalog
3. Stripe checkout or external link; platform take rate 10–15%
4. Admin moderation queue

### 8.26 Business Revenue Snapshot `[P2]`
1. Registration payments collected via ANCHOR Connect per program
2. ANCHOR subscription cost display
3. Simple net per program (not full accounting — no payroll/tax)

### 8.27 Integrations `[P2]`
1. Brightwheel / HiMama — export or embed link (TBD technical)
2. TeamSnap — roster import CSV template
3. JANE webhook for visit report prompts

### 8.28 Public Business Page `[MVP]`

**Route:** `/p/[slug]` (public, no auth required to view)  
**Optional deep link:** `/p/[slug]/programs/[programSlug]` (scrolls to / opens register for one program)

#### Business requirements
1. Unique URL slug per organization (e.g. `/p/staelcamp`) — editable, uniqueness enforced
2. Toggle `public_page_enabled` — unpublished shows friendly "page not available"
3. **Preview mode** for directors while editing (signed token query or role-gated)
4. Share kit in dashboard: copy link, QR download, embed snippet for "Register" button
5. Analytics: page views, program CTA clicks, registrations attributed to public page `[P1.5]`

#### Org public profile fields (extends §8.4 settings)
| Field | Purpose |
|-------|---------|
| `public_slug` | URL identifier |
| `public_headline` | Hero H1 (e.g. "STAELCAMP's program") |
| `public_tagline` | Subhead under logo (≤160 chars) |
| `public_description` | About section (rich text / markdown) |
| `cover_image_url` | Hero background or banner |
| `gallery_images[]` | Up to 6 photos (classroom, field, team) |
| `public_phone`, `public_email` | Contact strip |
| `address`, `city`, `region`, `country` | Map + local SEO |
| `hours_json` | Structured hours (Mon–Sun) |
| `accreditations[]` | Trust badges (license #, NAEYC, etc.) |
| `social_links` | Instagram, Facebook, TikTok (optional) |
| `seo_title`, `seo_description` | Meta + Open Graph |
| `brand_accent_color` | Subtle accent (validated hex; default ANCHOR teal) |
| `verified_badge` | Platform-controlled display |

#### Program pricing fields (required on program CRUD)
| Field | Purpose |
|-------|---------|
| `price_amount_cents` | Registration fee (0 = free enrollment, waiver only) |
| `currency` | USD or CAD |
| `billing_interval` | one_time · monthly · season · weekly |
| `deposit_amount_cents` | Optional partial payment upfront |
| `price_display` | Marketing line (auto from amount or manual override) |
| `price_note` | e.g. "Sibling discount at checkout" |
| `require_payment_before_approval` | If true, successful Checkout → auto-approve registration |
| `stripe_price_id` | Synced when Stripe Connect active |

Business must complete **Stripe Connect Express** before paid programs appear on public page.

#### Program public listing fields (extends program CRUD)
| Field | Purpose |
|-------|---------|
| `public_listing_enabled` | Show on public page (default on for active programs) |
| `program_slug` | Deep link segment (unique per org) |
| `public_headline` | Card title (can differ from internal name) |
| `public_description` | Program story for parents |
| `hero_image_url` | Program card hero |
| `age_range_label` | e.g. "Ages 3–5" or "U10 Soccer" |
| `schedule_summary` | e.g. "Mon–Fri · 7:30am–5:30pm" |
| `spots_available` | Computed from capacity − active registrations |
| `registration_opens_at`, `registration_closes_at` | Optional window |
| `waitlist_enabled` | CTA switches to waitlist when full |
| `featured_on_page` | Pin to top of program grid |
| `cta_label` | Default **"Book & pay"** / "Join waitlist" / "Enroll free" |

#### Public page UX (conversion)
1. **Premium landing layout** — serif headline, generous whitespace, no generic SaaS template look
2. Hero: logo, headline, tagline, verified badge, primary CTA scroll to programs
3. Programs section: card grid with photo, age, schedule, **price**, spots left, **Book & pay** CTA
4. **Program detail page** `/p/[slug]/programs/[programSlug]`: full description, price hero, sticky Book & pay
5. About + gallery + accreditations (trust)
6. Location map embed + hours + contact
7. Sticky mobile **Book & pay** bar (scrolls to programs if multiple)
8. Footer: subtle "Powered by ANCHOR" + privacy/terms links
9. **Book & pay flow:** tap CTA → sign-up/login if needed → select child → waiver → **Stripe Checkout** → confirmation (+ auto-approve if paid)
10. SEO: server-rendered metadata, JSON-LD `LocalBusiness` + `Offer` with `price` and `priceCurrency`
11. Performance: LCP &lt; 2.5s mobile; optimized images; no auth cookies required to browse

#### Security & privacy
1. Public page exposes **only** fields marked public — never roster names, child data, or internal notes
2. Unpublished programs hidden even if URL guessed
3. Rate limit registration POSTs from public page
4. COPPA-safe copy; no child photos on public page without business-uploaded marketing assets only

---

## 9. App Structure

### Parent app — 5 tabs
1. **Today** — child status, latest report, alerts, running late `[P1.5]`
2. **Timeline** — reports, transcripts, notes, photos, videos
3. **Programs** — enrolled programs; discover `[P2]`
4. **Care** — doctors, visits, incident consult
5. **Profile** — children, emergency card, subscription, marketplace `[P2]`

### Business app — 5 tabs
1. **Dashboard** — adoption %, trial status, today's activity
2. **Programs** — CRUD, registrations per program
3. **People** — children, parents, coaches
4. **Reports** — incidents, compliance `[P2]`
5. **Settings** — billing, analytics, marketplace `[P2]`, digest

### Coach app — 4 tabs (same codebase, `role=coach`)
1. **My Programs** — assigned programs only
2. **Report** — voice, photos, notes
3. **Roster** — emergency cards, field mode `[P1.5]`
4. **Incidents** — report + history

### Admin portal — web
1. Doctor directory
2. Visit report upload
3. Consult queue
4. Users, businesses, support, analytics

---

## 10. Non-Functional Requirements

### Security & compliance
1. Dedicated Supabase project (isolated from SGSuperFans)
2. HIPAA-ready architecture (BAA with Supabase Pro); PIPEDA for Canada
3. COPPA: no child accounts; parental consent for child data
4. Row-level security on all child data; org-scoped access
5. Encrypt health fields at rest
6. Immutable audit log: incidents, clearances, consent changes, report shares
7. No PHI in push/SMS body

### Performance
1. Parent Today feed < 200ms p95
2. Incident → parent notification < 3 seconds
3. Voice upload → draft ready < 60 seconds for 3-minute memo
4. Support 10K businesses / 500K parents at architecture level (horizontal scale via Supabase + edge)

### Availability
1. 99.9% uptime target for notification and incident paths
2. Graceful degradation: if AI fails, staff can type report manually

### Localization (Phase 2)
1. English launch
2. French for Quebec planned

---

## 11. Technical Stack (Reference)

Greenfield build. Reuse patterns from SGSuperFans where applicable — **not** shared infrastructure.

1. **Frontend:** Next.js, TypeScript, React, Tailwind
2. **Backend:** Next.js API routes, Supabase (Auth, Postgres, Storage, Realtime)
3. **Payments:** Stripe
4. **Notifications:** Push (FCM/APNs) + Twilio SMS (US + CA numbers)
5. **Voice AI:** Whisper or equivalent + LLM for per-child draft
6. **Booking:** JANE (CA) + per-doctor US links (no custom scheduler)
7. **Video (Phase 3):** Agora RTC — server-side tokens only
8. **Monitoring:** Sentry

---

## 12. MVP Scope

### In MVP
1. Auth (4 roles: parent, business_admin, coach, admin) + jurisdiction
2. Programs + registrations with **Stripe Connect book & pay** on public + program pages
3. Business onboarding (3-step wizard, no stack survey)
4. Coach invites + program assignment
5. Parent invite SMS + web report viewer
6. Child profile + emergency card + health profile copy
7. Coach: voice AI report, photos, per-child notes, publish to timeline
8. Incidents + parent alerts + clearance share
9. Parent: Today, Timeline (7-day free), Programs (enrolled)
10. Care: doctor directory + JANE links + visit upload
11. Incident consult (Family plan)
12. Parent↔business messaging + broadcast
13. Stripe: Parent Family + Business Pro

### Phase 1.5
1. Running late + pickup override
2. Substitute / field mode
3. Insurance incident PDF
4. Business + parent weekly digest emails
5. Morning health tap
6. Forms vault
7. Co-parent + quiet hours

### Phase 2
1. Registration payment enhancements (promo codes, refunds, installments) — P2
2. Program discovery for parents
3. Marketplace + checkout
4. Business revenue snapshot per program
5. Season rollover
6. Bulk compliance export
7. SMS two-way reply
8. Integrations (Brightwheel/TeamSnap import)
9. Referrals, offline voice, shift handoff

### Phase 3
1. Camp/school templates
2. Agora video consults
3. French (Quebec)
4. Full expense tracking
5. Enterprise/franchise tier

---

## 13. Out of Scope

1. Game scheduling and live scores
2. Payroll and tuition billing
3. AI face recognition
4. In-app marketplace checkout
5. Custom doctor scheduling
6. Private staff-to-child messaging
7. Social feed between families
8. Ads and child behavioral tracking

---

## 14. Risks & Mitigations

1. **Parent won't pay** — Free tier hooks with daily report; paywall on history, multi-child, care
2. **Business won't pay** — 14-day trial; voice AI ROI pitch; parent adoption score pressure
3. **AI misattributes child** — mandatory human review before publish
4. **Clinician overload** — incident-only consult at MVP; no general chat queue
5. **US/CA regulatory** — jurisdiction at signup; doctor licensing map; care disclaimers where not licensed
6. **JANE US gap** — per-doctor US booking links; don't assume JANE for all markets
7. **Low parent activation** — SMS-first invite; business onboarding playbook

---

## 15. Competitive Positioning & Coexistence

**Positioning line:** *We don't replace your daycare or team app. We're the layer that connects your child's story, safety, and care across all of them.*

1. **Brightwheel / HiMama** — Keep for billing/check-in; add ANCHOR for voice reports, cross-org timeline, incident-to-care
2. **TeamSnap / SportsEngine** — Keep for schedule/RSVP; add ANCHOR for incidents, emergency cards, clearance, SafeSport messaging
3. **Blueberry / Summer Health** — We win on activity context + daily story, not generic telehealth price
4. **SafePlay+ / Second47** — We win on daily parent habit + lower price + care loop, not compliance-only niche
5. **GroupMe / WhatsApp** — We replace for program communication because parent is always in thread and incidents are structured

### GTM by scenario
1. **Daycare on Brightwheel** — Sell time saved on typing + better parent story
2. **Sports club on TeamSnap** — Sell incident PDF for insurance + clearance on roster
3. **Small camp with no digital tools** — ANCHOR is first parent comms platform

---

## 16. Open Questions

1. Exact business trial limits (report count vs. feature lock)?
2. Which US states/provinces are clinicians licensed in at launch?
3. Stripe Connect timing for in-app registration payments?
4. Brand name final: ANCHOR_CARE vs. consumer-facing shorter name?

---

## 17. Document History

1. **v2.0** (August 3, 2026) — Four roles (Coach), Programs entity, STRATEGY.md, parent digest, marketplace/discovery P2, revenue snapshot
2. **v1.1** (July 25, 2026) — Coexistence, gap features, P1.5 items
3. **v1.0** (July 25, 2026) — Initial PRD
