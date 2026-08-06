# ANCHOR_CARE — Strategy & Market Playbook

**Version:** 1.1 | **Updated:** August 5, 2026  
**Related:** [PRD.md](./PRD.md) | [USER_JOURNEYS.md](./USER_JOURNEYS.md) | [DEVELOPMENT_SPEC.md](./DEVELOPMENT_SPEC.md)

Business strategy, PMF validation, revenue model, GTM, and long-term scale path.

---

## 1. What ANCHOR_CARE Is

**Category:** Child away-from-home platform — daily story, safety, care, enrollment.

**Not:** Daycare billing (Brightwheel), sports scheduling (TeamSnap), generic telehealth (Blueberry).

**Moat:** Cross-program child timeline + coach voice AI reports + incident → care → clearance loop.

**One-line pitch:** *Where your child's day away from home lives — and where care starts when something goes wrong.*

---

## 2. Why Users Need It (Jobs to Be Done)

### Parents
1. **"Is my child OK today?"** — Daily report + Today tab replace silence or random texts.
2. **"I'm missing their childhood."** — Timeline keeps photos, videos, transcripts, notes in one place.
3. **"Something happened — what do I do?"** — Structured incident + care path replaces panic Googling.
4. **"I keep re-filling the same forms."** — Health profile copy + forms vault (P1.5).
5. **"Does the coach know the allergy?"** — Emergency card visible in 2 taps.

**Emotional driver:** Anxiety, guilt, love. Parents pay to feel **present** and **safe**.

### Business (Owner / Director)
1. **"Staff spends 45 minutes typing reports."** — Voice AI cuts to ~5–10 minutes.
2. **"Parents won't download another app."** — SMS web viewer + invite activation.
3. **"We have no injury paper trail."** — Incident log + insurance PDF (P1.5).
4. **"Coaches text kids on personal phones."** — SafeSport-safe threads (parent always included).
5. **"How do we prove value to parents?"** — Adoption analytics + weekly digest.

**Economic driver:** Staff labor cost + liability + parent retention.

### Coaches
1. **"I'm not a writer."** — Record 2 minutes; AI drafts per-child reports.
2. **"I need allergies on the field."** — Field mode roster + emergency card.
3. **"Parents blow up my personal phone."** — In-app messaging with parent in thread.

---

## 3. Product–Market Fit

### Current stage
**Pre-PMF** — product spec complete; no paying users or live app yet. Strong **problem–solution fit on paper**.

### PMF signals (measure in pilot)

1. Business 90-day retention ≥ 85%
2. Parent activation from invite ≥ 60% within 7 days
3. Weekly parent report open rate (WAPOR) ≥ 70%
4. Coach voice report usage ≥ 80% of active program days
5. Free → Family conversion ≥ 15% within 30 days
6. Unprompted director referrals ≥ 20% of new businesses by month 6

### 90-day validation playbook

**Days 1–30 — Discovery**
1. Interview 5 daycare directors + 5 sports club admins.
2. Document: daily report time, last injury handling, tools used today.
3. Kill assumption if directors say reports take &lt;10 min and parents are fully happy.

**Days 31–60 — Concierge pilot**
1. Sign 2 paid pilots ($49/mo minimum) — 1 daycare, 1 sports club.
2. Run voice memo → AI → parent email/SMS manually if needed.
3. Track open rates and parent replies.

**Days 61–90 — MVP beta**
1. Ship Coach report + Timeline + SMS viewer + incidents.
2. Target: 10 businesses, 200+ activated parents.
3. Go/no-go: if open rate &lt;40%, fix distribution before new features.

### Ideal customer profile (ICP)

**Primary:** Licensed daycare/preschool, 30–80 children, director feels daily report pain.

**Secondary:** Youth sports club, 4–10 teams, volunteer coaches, insurance concern.

**Avoid year 1:** K–12 school districts, overnight-only camps, enterprise franchises.

---

## 4. Revenue Model & MRR Projections

### Revenue streams

1. **Business Pro** — $99/mo per organization (14-day trial)
2. **Parent ANCHOR Family** — $14.99/mo or $149/yr
3. **P2 — Program registration fees** — Stripe Connect; 2–5% platform fee
4. **P2 — Marketplace** — 10–15% on equipment/photo packages sold through app

### Unit economics (targets)

1. Business CAC (outbound) — target &lt;$300; LTV 24 mo × $99 = $2,376 → LTV:CAC &gt; 5:1
2. Parent CAC — ~$0 in year 1 (business-invited); organic/referral later
3. Parent ARPU — ~$13/mo blended (annual mix)
4. Gross margin — 75%+ (SaaS + SMS/AI COGS)

### MRR scenarios

**Year 1 (focused execution)**
1. 150 paying businesses × $99 = $14,850/mo
2. 4,000 activated parents × 12% Family × $14.99 = ~$7,200/mo
3. **Total MRR ≈ $22K · ARR ≈ $264K**

**Year 3 (PMF proven, US+CA expansion)**
1. 2,000 businesses = $198K/mo
2. 25,000 Family parents = $375K/mo
3. Connect + marketplace = $50K/mo
4. **Total MRR ≈ $620K · ARR ≈ $7.4M**

**Year 5–7 (category leader path)**
1. 15,000 businesses + 200,000 Family parents + payments volume
2. **MRR $4–6M · ARR $50–70M**
3. At 8–12× ARR → **$400M–800M** valuation range (large company, not guaranteed unicorn)

### Path to $1B+ valuation

Requires **$80–100M+ ARR** or hyper-growth with network effects. Needs at least one of:

1. **Payments rail** — registration/tuition volume through platform (Brightwheel model)
2. **Parent discovery network** — parents find all local programs on ANCHOR; businesses must list
3. **Compliance system-of-record** — mandated incident/concussion reporting in multiple states
4. **Clinical subscriptions at scale** — owned care layer across millions of families
5. **Enterprise/franchise** — single contracts for multi-location operators

**MVP alone caps ~$10–30M ARR** without payments + network expansion.

---

## 5. Go-to-Market Strategy

### Principle
**Business brings parents. Do not market to parents cold in year 1.**

### Phase 1 — First 200 businesses (months 1–12)

**Outbound (highest conversion)**
1. List daycares + sports clubs in 1–2 launch cities.
2. Pitch: *"Your public page + daily parent updates + incident docs — no separate website needed."*
3. 14-day trial + help publish public page and record first voice report in week 1.

**Community**
1. Daycare director Facebook groups, NAEYC local chapters, youth sports admin forums.
2. Case study posts: before/after report time.

**Micro-influencers**
1. Daycare teachers on TikTok/Instagram — authentic demo of voice report.

**Partnerships**
1. Pediatric clinics — Care tab co-branding.
2. Youth sports insurance brokers — incident PDF hook.

### Phase 2 — Parent pull (after 50 businesses)

1. Parent referral: 1 month free Family per referral.
2. Timeline share cards (privacy-safe).
3. Local SEO: public pages indexed as `[Business name] + [city] + enrollment`.
4. Businesses promote `/p/[slug]` on social — zero cold parent ads required.

### Phase 3 — Network (500+ businesses)

1. B2B paid ads (LinkedIn, Facebook) to directors only.
2. In-app program discovery (parents search → deep link to public pages).
3. City aggregator pages linking to verified public pages `[P2]`.

### Conversion copy

**Business:** *"One link for enrollment and daily updates — skip the $3k website."*

**Parent:** *"See programs, register, and get your child's day — from one trusted page."*

**Coach:** *"Talk for 2 minutes instead of typing for 30."*

---

## 6. Competitive Position

1. **Brightwheel / HiMama** — Coexist; we own cross-org story + voice AI + care bridge.
2. **TeamSnap** — Coexist; we own incidents, clearance, emergency card, coach reports.
3. **Blueberry / Summer Health** — We win on activity context, not generic telehealth price.
4. **GroupMe / WhatsApp** — We replace for program comms (compliance + parent in thread).

### Unique combination (defend this)

1. Cross-program child timeline
2. Voice AI per-child daily reports with transcript
3. SMS-first parent activation
4. Incident → contextual care → clearance
5. Dedicated Coach role (field-ready UX)
6. **Shareable public business page** — enrollment + brand without separate website

---

## 7. What Is Complete vs. Missing

### Complete in current doc set (build-ready)

1. Four roles: Parent, Business, Coach, Admin
2. Programs entity + registrations + **public business landing page**
3. Shared engines architecture
4. MVP / P1.5 / P2 / P3 phasing
5. Development spec per page (Parent, Business, Public, Admin)
6. PMF metrics + GTM in this doc

### Missing for "complete product" (roadmap)

1. In-app program payments (Stripe Connect) — **MVP on public/program pages; P2 enhancements (promos, refunds)**
2. In-app program discovery index (links to public pages) — P2
3. Public page analytics dashboard — P2
4. Marketplace checkout for business products — P2
5. Business revenue snapshot (not full accounting) — P2
6. Brightwheel / TeamSnap integrations — P2
7. Parent weekly child digest email — P1.5
8. French (Quebec) — P3
9. Offline coach mode — P2

### Missing for billion-dollar scale

1. Payments volume as primary revenue
2. Network effects (discovery → must-list)
3. State compliance integrations (concussion, licensing)
4. Enterprise/franchise sales motion
5. National brand ("ANCHOR certified program")
6. Longitudinal data moat (10+ years retention — handle ethically)
7. Clinical network at national scale

### Do not build (distraction)

1. Full QuickBooks replacement
2. Game scheduling
3. AI face recognition on minors
4. Parent social feed
5. Everything before 10 paying pilots prove open rates

---

## 8. North Star Metrics

1. **WAPOR** — Weekly Active Parents Opening Reports (% of activated parents who open ≥1 report per week)
2. **Coach report days per week** — % of program days with published voice or text report
3. **Business logo retention** — % of paying businesses month-over-month
4. **Incident time-to-parent-view** — median seconds from coach submit to parent open

---

## 9. Risk Register

1. **Low parent activation** — Mitigation: SMS web viewer, director SMS reminders
2. **Coaches won't adopt** — Mitigation: director mandate + faster than typing
3. **"Another app" objection** — Mitigation: coexistence messaging + integrations P2
4. **Clinical liability** — Mitigation: jurisdiction gating, incident-only consult, licensed map
5. **AI misattributes child in report** — Mitigation: mandatory human review before publish
6. **Feature creep delays launch** — Mitigation: MVP scope lock in USER_JOURNEYS §11

---

## 10. Document Index

1. [PRD.md](./PRD.md) — Requirements, subscriptions, functional scope
2. [USER_JOURNEYS.md](./USER_JOURNEYS.md) — Roles, flows, build phases
3. [DEVELOPMENT_SPEC.md](./DEVELOPMENT_SPEC.md) — Pages, toasts, notifications, UI per screen
4. [STRATEGY.md](./STRATEGY.md) — This file: PMF, MRR, GTM, scale path

---

## 11. One-Sentence Strategy

**Win one city of daycares on voice reports → add sports for incidents → add payments → become the record of every child's life away from home.**

---

*Review quarterly. Update MRR actuals vs. scenarios after first 10 paying businesses.*
