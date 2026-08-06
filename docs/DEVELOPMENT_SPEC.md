# ANCHOR_CARE — Development Specification

**Version:** 1.4  
**Updated:** August 5, 2026  
**Status:** Build source of truth  
**Related:** [PRD.md](./PRD.md) | [USER_JOURNEYS.md](./USER_JOURNEYS.md) | [STRATEGY.md](./STRATEGY.md)

Use this document during development to know **what to build** per role, page, flow, toast, notification, edge case, and UI/UX requirement.

**Roles:** Parent · Business (admin) · Coach · Admin  
**Coach = same app as Business with `role=coach` RBAC** — do not build separate codebase.  
**Marking:** `[MVP]` ship first · `[P1.5]` phase 1.5 · `[P2]` phase 2

**Global design system**
1. Colors: navy `#1B2B4B` (primary), seafoam `#4ECDC4` (accent), sand `#F5F0E8` (background), coral `#E85D4C` (incidents/alerts only)
2. Typography: serif display for parent headlines; sans-serif body (readable 16px+ on mobile)
3. No generic AI aesthetic: no purple gradients, no stock illustration overload
4. Emergency/safety screens: high contrast, black on white, 18px+ body, works in sunlight
5. Touch targets: minimum 44×44px
6. PHI rule: never show symptoms/diagnoses in push, SMS, or toast preview text

---

# PART A — PARENT ROLE

**App shell:** 4 bottom tabs — **Today** · **Timeline** · **Care** · **Profile**

---

## P-01 · Auth — Login `[MVP]`

**Route:** `/login`

### User flows
1. Enter email + password → submit → redirect to Today (or pending verify)
2. Tap Google / Apple → OAuth → redirect
3. Tap Forgot password → P-02
4. Tap Sign up → P-03

### User journey
Returning parent opens app → logs in → lands on Today with last session restored.

### Toasts
1. Success: "Welcome back."
2. Error: "Email or password incorrect."
3. Error: "Please verify your email first." + link action

### Notifications
None on this page.

### Edge cases
1. Unverified email → block PHI pages, show verify banner
2. Account suspended → show support contact, no login
3. OAuth email matches existing account → merge or prompt link
4. Session expired → silent redirect here with return URL

### UI/UX
1. Logo + one-line value prop above form
2. Social login buttons above email form
3. Minimal fields; sticky CTA "Log in"
4. Link to business signup: "Are you a program? Sign up here"

---

## P-02 · Auth — Forgot / Reset Password `[MVP]`

**Route:** `/forgot-password` · `/reset-password`

### User flows
1. Enter email → send reset link → confirmation screen
2. Click email link → set new password → auto-login → Today

### User journey
Parent forgot password → resets via email → back in app under 2 minutes.

### Toasts
1. Success: "Reset link sent. Check your email."
2. Error: "No account found for this email."
3. Success (reset): "Password updated."

### Notifications
1. Email: password reset link (transactional)

### Edge cases
1. Expired reset token → prompt request new link
2. Rate limit reset requests → "Try again in 15 minutes"

### UI/UX
1. Single email field, large CTA
2. Clear back navigation to login

---

## P-03 · Auth — Sign Up (Direct) `[MVP]`

**Route:** `/signup`

### User flows
1. Email + password + confirm → create account → email verify screen
2. OAuth signup → skip password → verify if needed → P-04 onboarding

### User journey
Secondary path: parent finds app organically → signs up → must connect to business later.

### Toasts
1. Error: "Password must be at least 8 characters."
2. Error: "Email already registered." + login link
3. Success: "Account created."

### Notifications
1. Email: verification link

### Edge cases
1. Weak password rejected with specific rule hints
2. Signup without invite → limited Profile until business linked

### UI/UX
1. Show invite code field (optional): "Have a code from your child's program?"
2. Terms + privacy checkbox required

---

## P-04 · Invite Activation & Onboarding `[MVP]`

**Route:** `/invite/[token]` · `/onboarding`

### User flows
1. Open SMS/link token → prefill business + child name
2. Sign up or log in (60-second path)
3. Verify phone (SMS OTP) and email
4. Confirm country + state/province
5. Confirm child match or select from invite
6. **Progressive profile:** minimum = allergies (or "none"), one emergency contact, phone
7. "Complete later" skips optional fields → waivers
8. Sign digital waivers (scroll + checkbox + signature)
9. Set consents per business: photos, medical share, emergency card visibility
10. Land on Today — no paywall

### User journey
**Primary GTM path:** SMS → activate → waiver → see child on Today → first report within 48h.

### Toasts
1. Success: "You're connected to [Business]."
2. Error: "Invite expired. Ask [Business] for a new link."
3. Info: "Complete your child's profile anytime in Profile."

### Notifications
None during onboarding (in-app only).

### Edge cases
1. Invalid/expired token → error page + contact business CTA
2. Parent already has account → login merge flow, link child
3. Child name mismatch → parent confirms or requests business correction
4. Duplicate child on account → merge prompt
5. Waiver required before viewing reports → block Today content until signed
6. Under-18 parent account not allowed (COPPA — parent must be adult)

### UI/UX
1. Step indicator (max 4 visible steps; bundle verify + profile)
2. One question per screen on mobile
3. Large signature pad for waivers
4. Child photo optional at onboarding
5. End screen: "You're all set" + preview empty Today state

---

## P-05 · SMS Web Report Viewer `[MVP]`

**Route:** `/v/[token]` (public, tokenized, no full app)

### User flows
1. Tap SMS link → lightweight web page loads
2. View today's report text + photos for one child
3. CTA: "Get the full app" / "Activate account" if not registered
4. If registered → deep link to app report detail

### User journey
Parent without app taps text at 6pm → reads report in browser → installs app for timeline.

### Toasts
None (use inline banners on web).

### Notifications
1. SMS: "[Child]'s day is ready — View: [short URL]" (no PHI in SMS)

### Edge cases
1. Expired token → "Link expired. Open the app or request a new link."
2. Token reuse logged; rate limit abuse
3. Report not yet published → "Report coming soon"
4. Unauthenticated view: today only, no history, no download

### UI/UX
1. Load < 2s on 4G; no heavy JS bundle
2. Business logo + child first name + date header
3. Readable 18px body; photos swipeable
4. Sticky bottom CTA to install/open app
5. No navigation chrome — single purpose page

---

## P-06 · Today (Home Tab) `[MVP]`

**Route:** `/today` (default after login)

### User flows
1. View child cards: photo, name, status chip, report snippet
2. Tap card → P-07 Child Day Detail
3. Tap alert banner (incident, waiver pending, clearance needed) → relevant page
4. Pull to refresh
5. Quick actions per child: Emergency card, Message, Care, Running late `[P1.5]`
6. Empty state: waiting for first report / complete onboarding tasks

### User journey
Daily habit: open app → answer "How is my child right now?" in under 3 seconds.

### Toasts
1. Pull refresh success: silent or subtle "Updated"
2. Error: "Couldn't refresh. Pull to try again."

### Notifications
Inbound only (drive to this page):
1. Daily report ready
2. Photos uploaded
3. Incident reported
4. Clearance update
5. Waiver pending
6. Clinician reply

### Edge cases
1. Multiple children → vertical scroll cards, sorted by most recent activity
2. No children linked → CTA connect business or add child
3. Business subscription lapsed → show historical read-only badge on card
4. Free tier: no blocking on Today for current day

### UI/UX
1. Status chips: `At program` (neutral), `Report ready` (seafoam), `Incident` (coral), `Action needed` (amber)
2. Max 2 lines report preview per card
3. Coral top banner only for active incidents (dismissible after ack)
4. Tab bar: Today active by default
5. Time-of-day greeting: "Good afternoon, [Parent first name]"

---

## P-07 · Child Day Detail `[MVP]`

**Route:** `/today/[childId]`

### User flows
1. View today's daily report (full text)
2. View today's photos grid → tap → full screen
3. View activity tags (nap, lunch, outdoor)
4. Navigate to Message business → P-25
5. Navigate to Care → P-15
6. View emergency card → P-20

### User journey
Parent taps child on Today → reads full report and photos from today.

### Toasts
1. Photo download success: "Saved to device."

### Notifications
None (already on page from inbound).

### Edge cases
1. No report yet today → "No report yet. [Business] usually posts by [time]."
2. Report updated after publish → show "Updated [time]" label
3. Photos without report → show photos section only

### UI/UX
1. Report in card with sand background
2. Photos horizontal scroll below report
3. Staff name + timestamp footer
4. Sticky action row: Message · Care · Emergency card

---

## P-08 · Daily Report Detail (Historical) `[MVP]`

**Route:** `/reports/[reportId]`

### User flows
1. Open from Timeline → view full report + linked photos
2. Free user: if > 7 days → upgrade modal → P-28
3. Family: view all, download PDF of single report `[P2]`

### User journey
Parent browses history → hits paywall on old report → upgrades.

### Toasts
None.

### Notifications
None.

### Edge cases
1. Report amended by business → show amendment notice + diff or "Corrected [date]"
2. Deleted report (rare admin) → "This report is no longer available"

### UI/UX
1. Date + business name in header
2. Identical layout to P-07 for consistency
3. Upgrade modal: benefits list, not feature dump

---

## P-09 · Timeline Tab `[MVP]`

**Route:** `/timeline` · `/timeline/[childId]`

### User flows
1. Select child (picker if multiple)
2. Scroll chronological feed: reports, photos, incidents, visits, clearances, registrations
3. Filter by type and business `[P2]`
4. Tap item → detail page
5. Free: items older than 7 days blurred + upgrade CTA
6. Family: Export full timeline PDF

### User journey
Parent reviews child's story across all programs → emotional retention → pays for full history.

### Toasts
1. Export started: "Preparing your PDF…"
2. Export ready: "Download ready."

### Notifications
None.

### Edge cases
1. Empty timeline → "Activity will appear when [Business] posts"
2. Large timeline → virtualized scroll, paginate by month
3. Multi-business events interleaved by timestamp UTC, display local

### UI/UX
1. Month section headers
2. Icon per event type (report, photo, incident, stethoscope, checkmark)
3. Blurred cards for locked content with lock icon
4. Child picker sticky at top

---

## P-10 · Incident Detail `[MVP]`

**Route:** `/incidents/[incidentId]`

### User flows
1. View: time, location, description, photos, action taken, reporter, witnesses
2. Action: **Talk to our team** (Family) → P-18
3. Action: **Book a doctor** → P-17
4. Action: **I'm handling it** → ack, logs response, dismisses urgent UI
5. Action: **Call 911** → dialer + log escalation
6. After consult/visit: **Share clearance** → P-19

### User journey
Parent gets incident alert → opens calm, structured screen → chooses next step without panic.

### Toasts
1. Ack recorded: "Response saved."
2. Clearance shared: "Shared with [Business]."

### Notifications
Inbound:
1. Push + SMS: "Incident at [Business] — tap to view"
2. Severe: repeat SMS if unopened 5 min

### Edge cases
1. Incident amended → banner "Updated by [Business]"
2. Free plan consult attempt → upgrade modal
3. Already acknowledged → show ack time
4. 911 tap → confirm dialog (prevent pocket dial)

### UI/UX
1. Coral accent header — not full red screen (reduce panic)
2. Child health sidebar collapsible: allergies, meds
3. Large action buttons; 911 outlined separately at bottom
4. Map/location if provided (optional static pin)

---

## P-11 · Care Tab — Doctor Directory `[MVP]`

**Route:** `/care`

### User flows
1. Browse doctor cards: photo, name, specialty, country badge
2. Filter by specialty
3. Tap doctor → P-12 Doctor Detail
4. View visit history section → P-13
5. Free plan tap → upgrade modal for booking

### User journey
Parent explores care options → books external appointment → report returns to vault.

### Toasts
None.

### Notifications
1. Visit report uploaded → push to open P-14

### Edge cases
1. No doctors in parent's region → show disclaimer + contact support
2. US parent, CA-only doctor → hide or show "Not available in your region"

### UI/UX
1. Calm medical aesthetic — navy + white, not clinical sterile
2. Doctor cards with clear country flag/badge
3. Visit history below directory on same tab

---

## P-12 · Doctor Detail `[MVP]`

**Route:** `/care/doctors/[doctorId]`

### User flows
1. Read bio, specialties, languages
2. Tap **Book appointment** → external browser (JANE or US link)
3. Log `booking_click` analytics event

### User journey
Parent selects trusted pediatrician → completes booking off-platform.

### Toasts
None.

### Notifications
None.

### Edge cases
1. Broken booking URL → error + "Contact support"
2. Return from external booking → no state change until admin uploads report

### UI/UX
1. Prominent Book CTA (seafoam)
2. Note below CTA: "You'll complete booking on our partner site"

---

## P-13 · Visit History `[MVP]`

**Route:** `/care/visits`

### User flows
1. List visits: date, doctor name, summary line
2. Tap → P-14 Visit Report Detail

### User journey
Parent reviews past care in one place.

### Toasts
None.

### Notifications
Inbound: new visit report uploaded

### Edge cases
1. Empty → "Visit summaries appear here after appointments"

### UI/UX
1. Simple list, newest first

---

## P-14 · Visit Report Detail `[MVP]`

**Route:** `/care/visits/[visitId]`

### User flows
1. View PDF or structured summary
2. Download PDF
3. Share clearance summary to linked business → picker → confirm

### User journey
After JANE visit → parent reads summary → shares clearance to daycare.

### Toasts
1. Share success: "Clearance sent to [Business]."

### Notifications
None.

### Edge cases
1. Share to business without consent → confirm dialog explaining what business sees
2. Revoke share `[P2]` → audit log

### UI/UX
1. PDF embedded viewer or native render
2. Share button: plain language "Share return-to-care status with program"

---

## P-15 · Incident Consult Chat `[MVP]`

**Route:** `/care/consult/[consultId]`

### User flows
1. Open from incident or Care → select child if new
2. Type message, attach photo
3. Receive clinician replies (realtime)
4. View care plan summary when closed
5. Clinician may attach clearance → parent reviews → share to business

### User journey
Family plan parent gets guided care without ER for minor concerns.

### Toasts
1. Message failed: "Couldn't send. Retry."
2. Consult closed: "This conversation is closed. Summary saved."

### Notifications
1. Push: "Our care team replied — tap to view"
2. Severe queue: SMS if unopened 10 min

### Edge cases
1. Free plan → upgrade gate before thread create
2. Clinician handoff mid-chat → system message "A colleague is continuing your care"
3. After hours → auto-reply with expected response time
4. Upload inappropriate image → moderation flag

### UI/UX
1. Chat bubbles; clinician messages left, parent right
2. Context card pinned top: incident summary (if linked) collapsible
3. Input sticky bottom; photo attach icon
4. No read receipts on clinician side shown to parent (reduce anxiety)

---

## P-16 · Clearance Share `[MVP]`

**Route:** modal from P-10, P-14, P-15

### User flows
1. Preview what business will see (status + conditions + expiry only)
2. Select which linked businesses to share
3. Confirm → send

### User journey
One tap to tell coach/daycare child is cleared.

### Toasts
1. Success: "Clearance shared with [Business]."

### Notifications
1. Push to business: "Clearance update for [Child]"

### Edge cases
1. No linked businesses → "Connect a program to share"
2. Expired clearance → warn before share

### UI/UX
1. Modal with preview card exactly as business sees it
2. Multi-select businesses if Family multi-link

---

## P-17 · Profile Tab — Hub `[MVP]`

**Route:** `/profile`

### User flows
1. Navigate to: Children, Businesses, Subscription, Consents, Notifications, Account, Forms `[P1.5]`, Co-parent `[P1.5]`
2. Log out

### User journey
Settings and account management entry point.

### Toasts
1. Log out: none (redirect)

### Notifications
None.

### Edge cases
None significant.

### UI/UX
1. List layout with chevrons
2. Subscription badge: Free / Family
3. Profile photo optional

---

## P-18 · Children List & Child Profile Edit `[MVP]`

**Route:** `/profile/children` · `/profile/children/[childId]/edit`

### User flows
1. List children → add child (Family) or locked on Free if already 1
2. Edit: name, DOB, photo, allergies, meds, conditions, emergency contacts
3. Delete child → confirm + audit (soft delete)

### User journey
Parent maintains health data once, reused across businesses.

### Toasts
1. Save success: "Profile updated."
2. Add child blocked Free: show upgrade modal

### Notifications
None.

### Edge cases
1. Free + second child attempt → upgrade
2. Remove child with active roster → warn "Still enrolled at [Business]"

### UI/UX
1. Allergy fields with prominent styling
2. "None" quick toggle for allergies/meds
3. Save sticky footer

---

## P-19 · Emergency Card `[MVP]`

**Route:** `/profile/children/[childId]/emergency-card`

### User flows
1. Parent views/edits card fields
2. Per-business toggles: what staff can see
3. Add to wallet `[P2]` QR print

### User journey
Parent sets card once; staff access at field/pickup.

### Toasts
1. Save: "Emergency card updated."

### Notifications
None.

### Edge cases
1. No allergies → show "No known allergies" explicitly (important for staff)

### UI/UX
1. **Parent edit mode:** form layout
2. **Staff view (see B-06):** fullscreen read-only, 20px+ type, high contrast
3. Allergy section always top, red left border if present

---

## P-20 · Authorized Pickups `[MVP]`

**Route:** `/profile/children/[childId]/pickups`

### User flows
1. Add standing authorized persons: name, phone, relationship, optional photo
2. Add **today-only** override: person + date + optional note
3. Remove or expire override at midnight local

### User journey
Grandma picks up today → parent adds override → front desk sees it on roster.

### Toasts
1. Added: "Pickup person saved."
2. Today override: "Override active until midnight."

### Notifications
1. Optional push to business: "Pickup change for [Child]" `[P1.5]`

### Edge cases
1. Conflicting co-parent pickup adds → primary guardian wins, notify other
2. Override expired → auto-archive, roster updates

### UI/UX
1. Separate sections: Standing · Today only
2. Today section: prominent "+ Add for today" button
3. Photo optional for front desk ID match

---

## P-21 · Linked Businesses `[MVP]`

**Route:** `/profile/businesses`

### User flows
1. View connected programs with status
2. Enter invite code / open link → P-22 Register flow
3. Free: second link blocked → upgrade

### User journey
Parent connects second program (soccer + daycare) on Family plan.

### Toasts
1. Linked: "Connected to [Business]."

### Notifications
None.

### Edge cases
1. Business removes child from roster → show "Enrollment ended" inactive state

### UI/UX
1. Cards with business logo, group name, enrollment dates

---

## P-22 · Register / Waiver Signing `[MVP]`

**Route:** `/register/[businessToken]`

### User flows
1. Select child
2. **Copy health profile** from existing child record if enrolling at second program (pre-fill allergies, meds, contacts)
3. Complete program-specific form fields
4. Sign waiver(s) — e-signature
5. Submit → pending or active enrollment

### User journey
Parent joins soccer season → signs liability waiver digitally.

### Toasts
1. Success: "Registration submitted."
2. Active: "You're enrolled at [Business]."

### Notifications
1. Push: registration approved

### Edge cases
1. Waiver already signed for same org different season → new season waiver only
2. Duplicate enrollment → warn

### UI/UX
1. Reuse waiver component from P-04
2. Progress: Form → Waiver → Done

---

## P-23 · Parent ↔ Business Messages `[MVP]`

**Route:** `/messages` · `/messages/[threadId]`

### User flows
1. List threads (one per child per business)
2. Open thread → send/receive text
3. Parent always present; cannot be removed
4. Attach photo (no video MVP)

### User journey
Parent asks "Was Emma's lunch eaten?" without texting teacher's personal phone.

### Toasts
1. Send fail: retry toast

### Notifications
1. Push: "New message from [Business] about [Child]"

### Edge cases
1. Business subscription lapsed → read-only thread
2. Reported message → moderation

### UI/UX
1. Thread title: "[Child] · [Business]"
2. System label: "For child safety, this conversation includes all guardians"
3. No typing indicator for business `[optional]`

---

## P-24 · Morning Health Tap `[P1.5]`

**Route:** `/today/health-check` (push deep link)

### User flows
1. Morning push: "How is [Child] today?"
2. Tap: Healthy / Mild symptoms / Staying home
3. Optional note
4. Business sees flag on roster

### User journey
Parent marks sick child before bus → daycare expects absence.

### Toasts
1. Submitted: "Thanks — [Business] has been notified."

### Notifications
1. Push 7am local (configurable): health check prompt
2. Business digest: roster health flags

### Edge cases
1. Tap after drop-off → still logs with timestamp
2. No response → no nag more than 1 follow-up

### UI/UX
1. Three large buttons, icon + label
2. Complete in one screen, < 5 seconds

---

## P-25 · Forms Vault `[P1.5]`

**Route:** `/profile/forms`

### User flows
1. Upload PDF/image: immunization, physical, custom
2. Set expiry date
3. Share to selected business
4. Receive expiry reminders

### User journey
Upload vaccine record once → share to camp and daycare with one tap.

### Toasts
1. Upload success · Share success
2. Reminder acknowledged

### Notifications
1. Push/email: form expiring in 30/14/7 days

### Edge cases
1. Expired form share attempt → warn parent

### UI/UX
1. Document list with expiry badges (green/amber/red)
2. Share sheet with business multi-select

---

## P-26 · Co-Parent Invite `[P1.5]`

**Route:** `/profile/children/[childId]/coparent`

### User flows
1. Enter email → permission level (view / full)
2. Co-parent accepts invite → shared access

### User journey
Divorced parents both see timeline and incidents.

### Toasts
1. Invite sent

### Notifications
1. Email: co-parent invite

### Edge cases
1. Co-parent cannot change billing or delete primary
2. Conflicting pickup → primary wins

### UI/UX
1. Clear permission explanation per level

---

## P-27 · Subscription & Upgrade `[MVP]`

**Route:** `/profile/subscription` · upgrade modals global

### User flows
1. View plan, renewal date
2. Upgrade Free → Family via Stripe Checkout
3. Manage via Stripe Customer Portal
4. Upgrade triggers from: history, second child, second business, Care, consult, export

### User journey
Week 2 parent wants full timeline → converts.

### Toasts
1. Upgrade success: "Welcome to ANCHOR Family."
2. Cancel: handled in Stripe portal

### Notifications
1. Email: receipt, renewal reminder

### Edge cases
1. Payment fail → grace period 3 days then downgrade
2. Downgrade → retain 7-day window, lock older content

### UI/UX
1. Upgrade modal: 3 bullets max (full timeline, all children, care access)
2. Price anchor: monthly vs annual savings
3. No dark patterns — clear "Stay on Free"

---

## P-28 · Consents & Notification Settings `[MVP]`

**Route:** `/profile/consents` · `/profile/notifications`

### User flows
1. Per child per business: photo, medical, emergency card sharing toggles
2. Notification: push on/off, SMS on/off (incidents always SMS on), email digest
3. Quiet hours 9pm–7am (suppress report/photo pushes only) `[P1.5]`

### User journey
Parent controls privacy and alert fatigue.

### Toasts
1. Consent updated

### Notifications
Configured here.

### Edge cases
1. Revoke medical consent → business emergency card hides medical fields immediately
2. Quiet hours → incidents still push + SMS

### UI/UX
1. Plain language consent descriptions
2. Quiet hours time picker

---

## P-29 · Running Late for Pickup `[P1.5]`

**Route:** `/today/running-late` · modal from P-06 / P-07

### User flows
1. Select child (if multiple)
2. Choose ETA preset: 15 / 30 / 45 min or custom time
3. Optional short note ("Stuck in traffic")
4. Submit → business roster + child detail show pickup banner
5. Cancel or update ETA before pickup occurs

### User journey
Parent avoids calling front desk during afternoon rush.

### Toasts
1. Success: "[Business] notified — pickup ~6:45pm."

### Notifications
1. Push to business admin (optional per org setting)
2. In-app banner on B-03 / B-04 always (no PHI in push)

### Edge cases
1. ETA in the past → validate forward-only times
2. Multiple updates → latest wins; audit log kept
3. After actual pickup logged `[P2]` → auto-clear banner

### UI/UX
1. Large preset chips + time picker
2. One-screen flow < 10 seconds
3. Accessible from Today child card quick actions

---

## P-30 · SMS Reply to Report `[P2]`

**Route:** Twilio webhook (no UI page); surfaces in P-23 thread

### User flows
1. Parent replies to report SMS (plain text, rate-limited)
2. System maps token → parent + child + business thread
3. Message appended to parent↔business thread
4. Business notified in app

### User journey
Parent without app can ask a quick question via text reply.

### Toasts
N/A (SMS path).

### Notifications
1. Push to business: new message from parent

### Edge cases
1. Unknown sender → auto-reply with activate link
2. Message > 160 chars → truncate with "continue in app" link
3. Abuse rate limit → block with support message
4. Never echo PHI in auto-replies

### UI/UX
1. SMS auto-reply: "Message received. [Business] will reply in ANCHOR."
2. Thread shows badge "via SMS"

---

# PART B — BUSINESS ROLE

**App shell:** 4 tabs — **Roster** · **Report** · **Incidents** · **Settings**

---

## B-01 · Auth — Login / Sign Up `[MVP]`

**Route:** `/business/login` · `/business/signup`

### User flows
1. Business signup → email verify → B-02 Onboarding
2. Login → Roster tab (or onboarding if incomplete)

### User journey
Director creates org account → completes setup → invites families.

### Toasts
Same patterns as P-01.

### Notifications
1. Email verify

### Edge cases
1. Parent account email used → prompt "Use parent app" link

### UI/UX
1. Separate business branding entry: "For programs & schools"
2. Desktop-friendly layout (business uses tablet/desktop often)

---

## B-02 · Onboarding Wizard `[MVP]`

**Route:** `/business/onboarding`

### User flows
1. **About you:** name, role title
2. **Your program:** org name, logo optional, type, address, jurisdiction (country + state/province)
3. **First win:** create program stub (name + start date) or skip → dashboard checklist
4. Start 14-day Pro trial on complete
5. Checklist on dashboard: set program **price**, Connect Stripe, publish public page, first booking

### User journey
Reduce time-to-first-value; business can publish a paid program same day as signup.

### Toasts
1. "Trial started — 14 days free."
2. "Almost there — add a price to accept bookings."

### Notifications
1. Email: onboarding checklist day 1, 3, 7

### Edge cases
1. Incomplete onboarding → banner on all tabs until org name + type + jurisdiction done
2. Skip program stub → dashboard checklist guides to P7 programs + pricing

### UI/UX
1. 3-step wizard with skip on step 3 only
2. Suggested public slug preview on step 2
3. Checklist widget on dashboard until first paid booking or first report

---

## B-03 · Roster Tab `[MVP]`

**Route:** `/business/roster`

### User flows
1. View children list: name, photo, activation status, waiver status, clearance badge, allergy strip, **running-late banner** `[P1.5]`
2. Toggle **Substitute / Field mode** `[P1.5]` — simplified columns only
3. Parent adoption header: "14/20 families activated" + send reminder SMS
4. Search/filter by group
5. Tap child → B-04 Child Detail
6. Add child manually / approve pending registration
7. Archive child

### User journey
Director sees program health at a glance; nudges inactive parents.

### Toasts
1. Reminder sent: "Reminders sent to 6 families."
2. Archive confirm: "Removed from active roster."

### Notifications
1. Push to admin: new registration pending

### Edge cases
1. Allergy strip: red if severe allergy flagged, amber if mild
2. Inactive activation > 7 days → highlight row
3. Trial expired → read-only roster, banner to subscribe

### UI/UX
1. Allergy strip: colored left border on row (red/amber/green)
2. Clearance badge: icon + short text
3. Adoption progress bar at top
4. Dense table on desktop; cards on mobile
5. **Field mode:** toggle in header; 22px+ name text; hide non-safety columns
6. Running-late row chip: clock icon + ETA time (amber)

---

## B-03b · Substitute / Field Mode `[P1.5]`

**Route:** `/business/roster?mode=field` (view state on B-03)

### User flows
1. Staff toggles Field mode on roster
2. See only: photo, name, allergy strip, clearance badge, today's pickup override, running-late ETA
3. Tap child → emergency card fullscreen (B-05) or clearance detail
4. First-time toggle shows 10-second coach tip tooltip

### User journey
Substitute teacher or volunteer coach sees safety info in 5 seconds.

### Toasts
1. "Field mode on — showing safety essentials only."

### Notifications
None.

### Edge cases
1. Persists per device session; default off for directors
2. No medical fields beyond allergy strip unless card opened

### UI/UX
1. High contrast; minimal chrome
2. Persistent mode indicator banner
3. Default **on** for staff role login optional org setting

---

## B-04 · Child Detail (Roster) `[MVP]`

**Route:** `/business/roster/[childId]`

### User flows
1. View emergency card (authorized fields only) → B-05 fullscreen
2. View clearance status
3. View **running-late banner** if parent set ETA `[P1.5]`
4. View incident history list
5. Message parent → B-15
6. View parent contact (tap to call/email)

### User journey
Coach checks allergy before snack; opens card in 2 taps from roster.

### Toasts
None.

### Notifications
None.

### Edge cases
1. Parent revoked medical consent → card shows "Contact parent for medical info"
2. Today-only pickup override → banner at top of detail
3. Running-late ETA active → amber banner with time; clears after midnight or manual dismiss by admin

### UI/UX
1. Emergency card preview with "Open fullscreen" CTA
2. Pickup section: standing + today's override highlighted
3. Running-late banner above fold — clock icon + "Pickup ~6:45pm"

---

## B-05 · Emergency Card (Staff View) `[MVP]`

**Route:** `/business/roster/[childId]/emergency` (fullscreen)

### User flows
1. Open from B-04 → read-only fullscreen card
2. Tap call on emergency contact
3. Offline cache from last sync `[P1.5]`

### User journey
Soccer coach in sunlight opens allergies in 2 taps.

### Toasts
None.

### Notifications
None.

### Edge cases
1. No network → show cached version + "Last updated [time]"
2. Empty allergy → show "No known allergies" in bold

### UI/UX
1. **Black on white, 20px+ body, no chrome**
2. Allergies top, red banner if any
3. Meds, conditions, contacts, emergency numbers as large tappable rows
4. Close button top-right only

---

## B-06 · Parent Invites & Adoption `[MVP]`

**Route:** `/business/settings/invites`

### User flows
1. Copy link, show QR, send SMS to phone list
2. Bulk SMS to non-activated parents
3. View per-parent status: invited / activated / waiver pending

### User journey
Director drives 80%+ activation before trial ends.

### Toasts
1. Link copied
2. SMS batch: "6 messages sent."

### Notifications
1. SMS to parents (invite template)

### Edge cases
1. SMS rate limit per org per day
2. Invalid phone numbers skipped with report

### UI/UX
1. QR + link prominent
2. Table of families with status chips
3. One-tap "Remind inactive"

---

## B-07 · Report Tab — Hub `[MVP]`

**Route:** `/business/report`

### User flows
1. Two primary actions: **Record daily report** → B-08 · **Upload photos** → B-10
2. Show draft in progress if exists
3. Trial ended: voice AI locked, show manual text entry fallback

### User journey
Staff lands here at end of day; one obvious action.

### Toasts
None (sub-pages handle).

### Notifications
None.

### Edge cases
1. Unpublished draft > 24h → prompt resume or discard

### UI/UX
1. Two large cards: microphone icon · camera icon
2. Recent publish summary: "Last published 4:32pm · 18 families notified"

---

## B-08 · Voice Record `[MVP]`

**Route:** `/business/report/record`

### User flows
1. Select group
2. Record audio (60s–5min); pause/resume; timer visible
3. Submit → processing screen → B-09 Review Drafts
4. Cancel → confirm discard

### User journey
Teacher talks for 2 minutes about all kids → AI splits reports.

### Toasts
1. Processing: "Creating reports…"
2. Error: "Recording failed. Try again."
3. Too short: "Record at least 30 seconds."

### Notifications
None.

### Edge cases
1. Mic permission denied → instruct enable in settings
2. Background noise extreme → still process, staff edits in review
3. AI timeout → offer manual text entry per child
4. Trial expired → block with upgrade CTA

### UI/UX
1. Large record button, pulsing red while recording
2. Waveform visual feedback
3. Group picker at top
4. Max 5 min auto-stop with warning at 4:30

---

## B-09 · Review AI Drafts `[MVP]`

**Route:** `/business/report/review/[batchId]`

### User flows
1. See list of drafted per-child reports
2. Tap each → edit text, skip child, merge two drafts
3. Publish all or publish selected
4. Confirm publish → parents notified

### User journey
Human always reviews before parents see content — trust + accuracy.

### Toasts
1. Published: "18 reports sent."
2. Skipped: "2 children skipped."

### Notifications
1. Push + SMS to parents (batched one SMS per parent per publish)

### Edge cases
1. Child name mentioned but not in group → draft flagged for review
2. Empty draft for child → require manual text or skip
3. Publish partial failure → retry failed sends, show report

### UI/UX
1. Side-by-side: child name | draft text editable
2. Skip swipe or button per row
3. Sticky "Publish all" with count
4. Diff highlight if staff edited `[optional]`

---

## B-10 · Photo Upload `[MVP]`

**Route:** `/business/report/photos`

### User flows
1. Select photos/videos from device
2. Multi-select children tags from roster
3. Optional activity tag
4. Publish → notify tagged parents

### User journey
Quick photos from playground → tag 3 kids → parents notified.

### Toasts
1. Upload progress · Published: "Photos sent to 3 families."

### Notifications
1. Push to tagged parents (SMS optional per parent setting)

### Edge cases
1. Large video → compress or limit 30s MVP
2. Tag no child → block publish
3. Group photo → staff must tag all visible enrolled children

### UI/UX
1. Grid preview before publish
2. Child tag chips multi-select
3. Activity tag optional dropdown

---

## B-11 · Incidents Tab — List `[MVP]`

**Route:** `/business/incidents`

### User flows
1. View incident history list
2. Tap **Report incident** → B-12
3. Filter by date, child, severity

### User journey
Admin reviews season incidents for insurance.

### Toasts
None.

### Notifications
None.

### Edge cases
None.

### UI/UX
1. FAB or prominent "Report incident" button (coral)
2. Severity icon on list rows

---

## B-12 · Report Incident Form `[MVP]`

**Route:** `/business/incidents/new`

### User flows
1. Select child (allergy strip shown on select)
2. Fill: datetime, location, mechanism, body area (body map tap), symptoms, pain 1–10, photos, action taken, witnesses
3. Submit → parent alert + log
4. RED-flag fields auto-escalate

### User journey
Coach documents injury in 60 seconds at field side.

### Toasts
1. Submitted: "Incident reported. Parent notified."
2. RED-flag: "Priority alert sent."

### Notifications
1. Parent push + SMS immediately
2. Business admin copy push
3. Admin consult queue if Family parent

### Edge cases
1. Offline submit → queue locally, send when online `[P1.5]`
2. Amend within 24h → B-13 amend flow, parent notified
3. Wrong child → amend with audit

### UI/UX
1. Step form or single scroll — prefer single scroll for speed
2. Body map simple front/back outline
3. Photo attach from camera direct
4. Large submit button
5. Template varies by `org.jurisdiction` for sports concussion fields `[P2]`

---

## B-13 · Incident Detail & Amend `[MVP]`

**Route:** `/business/incidents/[incidentId]`

### User flows
1. View full incident record
2. **Export insurance PDF** `[P1.5]` — one-tap download/email
3. Amend (within 24h) → edit fields → reason for amendment → parent notify
4. View parent response (ack, handling it, etc.)

### User journey
Club admin sends incident packet to insurer after weekend injury.

### Toasts
1. Amended: "Update sent to parent."
2. PDF generating: "Preparing export…" · Ready: "Download ready."

### Notifications
1. Push to parent: "Incident report updated"

### Edge cases
1. Amend after 24h → blocked; contact support
2. Parent already escalated to consult → link visible
3. PDF includes notification delivery log timestamps

### UI/UX
1. Amendment banner on parent view
2. Audit trail visible to business admin only
3. **Export for insurance** secondary button — professional PDF layout, org logo header

---

## B-14 · Broadcast Message `[MVP]`

**Route:** `/business/messages/broadcast`

### User flows
1. Select group(s)
2. Type message
3. Send → all parents in group receive push

### User journey
"Practice cancelled due to weather" in 10 seconds.

### Toasts
1. Sent: "Message sent to 22 parents."

### Notifications
1. Push to all parents in group

### Edge cases
1. Character limit 500
2. Rate limit: max 5 broadcasts per hour

### UI/UX
1. Simple compose screen
2. Recipient count preview before send

---

## B-15 · Parent Thread `[MVP]`

**Route:** `/business/messages/[threadId]`

### User flows
1. Open thread from child detail or messages list
2. Reply to parent (parent always in thread)
3. Cannot remove parent from thread

### User journey
Staff answers parent question with liability-safe documented thread.

### Toasts
Send fail retry.

### Notifications
1. Push to parent on reply

### Edge cases
1. Multiple guardians → both see thread

### UI/UX
1. Banner: "This conversation includes all guardians for [Child]"

---

## B-16 · Settings Tab — Hub `[MVP]`

**Route:** `/business/settings`

### User flows
Navigate to: Org profile, Groups, Staff, Billing, Invites, Compliance export `[P2]`, Log out

### User journey
Admin configuration entry.

### Toasts
None.

### Notifications
Trial ending reminders from here + email.

### Edge cases
None.

### UI/UX
List layout; trial days remaining badge at top.

---

## B-17 · Org Profile Edit `[MVP]`

**Route:** `/business/settings/profile`

### User flows
1. **Internal tab:** Edit name, logo, type, address, website, description, jurisdiction
2. **Public page tab:** Edit slug, headline, tagline, about, cover image, gallery (≤6), public phone/email, hours, accreditations, social links, SEO title/description, accent color
3. Toggle **Publish public page** (`public_page_enabled`)
4. **Share kit:** copy link, download QR PNG, open preview in new tab
5. Live preview panel (desktop) showing `/p/[slug]` while editing

### User journey
Director finishes onboarding → fills public page copy → publishes → posts link on Instagram bio same day → parent registers without a separate website.

### Toasts
1. Saved.
2. Slug taken → "That URL is already in use."
3. Published → "Your public page is live."

### Notifications
None.

### Edge cases
1. Jurisdiction change → warn may affect incident templates
2. Unpublished page → preview works for director; public URL shows "Page not available"
3. Slug change → old slug 301 redirect to new slug for 90 days `[P1.5]`
4. Missing cover → fallback to sand gradient + logo (still premium, not broken)
5. Invalid accent hex → reject save

### UI/UX
1. Logo upload with crop; cover 16:9 crop; gallery drag reorder
2. Two-tab form: **Internal** | **Public page** — avoid overwhelming single form
3. Character counters on headline (80) and tagline (160)
4. Hours editor: Mon–Sun rows with open/closed toggle
5. Accreditations as chip list + add field
6. Preview uses same components as PUB-01 (WYSIWYG)
7. Premium restraint: no purple gradients; serif headline in preview only

---

## B-25 · Programs Management `[MVP]`

**Routes:** `/business/programs` · `/business/programs/new` · `/business/programs/[id]`

### User flows
1. List programs: active, draft, archived
2. Create/edit: internal fields (name, type, dates, capacity, assigned coaches)
3. **Pricing section (required):** price_amount_cents, currency, billing_interval (one_time/monthly/season/weekly), deposit optional, price_display, price_note, require_payment_before_approval
4. **Stripe Connect:** inline onboarding when price &gt; 0; block public listing until connected
5. **Public listing section:** enable listing, program slug, public headline/description, hero image, age range label, schedule summary, registration window, waitlist toggle, featured pin, cta_label (default "Book & pay")
4. Archive program → hidden from public page and coach assignment pickers

### User journey
Director creates "Summer Soccer U10" → fills public card copy → enables listing → page shows program with Register CTA.

### Toasts
Created / updated / archived confirmations.

### Notifications
None on save.

### Edge cases
1. Program full + waitlist off → public CTA disabled with "Contact us"
2. Program full + waitlist on → CTA "Join waitlist"
3. Registration window closed → CTA "Registration closed"
4. Duplicate program slug within org → block save
5. Coach read-only: list assigned programs only (403 on mutate)

### UI/UX
1. Program list cards with public listing badge (Live / Hidden)
2. Split form: **Operations** | **Public listing**
3. Spots remaining computed live from roster (read-only on form)
4. Empty state CTA ties to onboarding checklist

---

## B-18 · Groups Management `[MVP]`

**Route:** `/business/settings/groups`

### User flows
1. CRUD groups (classroom, team)
2. Assign children to groups

### Toasts
Created / deleted confirmations.

### Notifications
None.

### Edge cases
Delete group with children → reassign prompt

### UI/UX
Simple list + add form.

---

## B-19 · Staff Management `[MVP]`

**Route:** `/business/settings/staff`

### User flows
1. Invite staff email
2. Assign role: admin / staff (staff cannot billing or delete org)
3. Remove staff

### Toasts
Invite sent.

### Notifications
Email invite to staff.

### Edge cases
Last admin cannot be removed.

### UI/UX
Role labels plain language: "Can manage billing" vs "Can post reports only"

---

## B-20 · Billing & Subscription `[MVP]`

**Route:** `/business/settings/billing`

### User flows
1. View trial days / plan status
2. Subscribe Pro via Stripe
3. Manage payment method (Stripe portal)
4. View invoices

### User journey
Day 10 trial reminder → converts to paid.

### Toasts
Payment success / fail.

### Notifications
1. Email: trial ending day 10, 13, expired
2. Push: trial ending

### Edge cases
1. Lapsed → voice AI locked, read-only mode banner app-wide
2. Parents retain read access to past content

### UI/UX
1. Trial countdown prominent
2. ROI copy: "You saved ~X hours this month" `[P2]` based on report count

---

## B-21 · Compliance Export `[P2]`

**Route:** `/business/settings/exports`

### User flows
1. Select date range
2. Generate PDF/CSV
3. Download

### Toasts
Export ready.

### Notifications
Email link when large export ready.

### Edge cases
Export max 1 year per request.

### UI/UX
Simple date picker + format select.

---

## B-22 · Shift Handoff Note `[P1.5]`

**Route:** `/business/roster/handoff`

### User flows
1. Morning staff leaves note for afternoon staff per group or child
2. Afternoon staff sees on roster

### User journey
"Emma had rough morning" visible to pickup staff.

### Toasts
Note saved.

### Notifications
Optional push to afternoon staff login.

### Edge cases
Note auto-expires end of day.

### UI/UX
Quick text field on roster group header.

---

## B-23 · Weekly Digest Email `[P1.5]`

**Route:** `/business/settings/digest` (config) · email cron (system)

### User flows
1. Admin enables/disables weekly digest (default on)
2. Select delivery day (default Monday) and recipient emails
3. System sends: activation %, report open rate, incident count, voice report days, trial days left
4. CTA links to roster adoption dashboard

### User journey
Director sees ROI email Monday morning → renews before trial ends.

### Toasts
1. "Digest settings saved."

### Notifications
1. Email every Monday 8am local (org timezone)

### Edge cases
1. Zero activity week → still send with encouragement copy
2. Trial ended → include conversion CTA

### UI/UX
1. Settings toggle + email list
2. Preview sample digest button

---

## B-24 · Season Rollover `[P2]`

**Route:** `/business/settings/seasons`

### User flows
1. Mark group/season as complete → archive
2. Roster entries move to historical (read-only for business; parents keep timeline)
3. Create new season → clone group structure + waiver templates
4. Send re-enrollment invites to prior families
5. Parents confirm child; health profile pre-filled; sign new waivers only

### User journey
Soccer club ends spring → starts fall without rebuilding from scratch.

### Toasts
1. "Spring 2026 archived." · "Fall 2026 season created."

### Notifications
1. Email/push to parents: re-enroll for new season

### Edge cases
1. Child aged out → not auto-invited
2. Archived season incidents still in compliance export

### UI/UX
1. Season timeline UI: Active · Archived
2. Wizard: Archive → Create new → Invite

---

# PART C — PUBLIC SURFACES `[MVP]`

No auth required to view. Registration CTAs hand off to parent auth + Phase 11 enrollment.

---

## PUB-01 · Public Business Landing Page `[MVP]`

**Routes:** `/p/[slug]` · `/p/[slug]/programs/[programSlug]`

### User flows
1. Visitor opens share link (social, QR, email signature)
2. Scrolls hero → programs → about → gallery → location/hours
3. Taps **Book & pay** on program card or program detail page → PUB-02
4. Deep link `/programs/[programSlug]` scrolls to program + highlights card

### User journey
Affluent parent sees club Instagram link → lands on cinematic mobile page → trusts accreditations + photos → registers child in under 3 minutes.

### Toasts
None (public read-only page).

### Notifications
None on view.

### Edge cases
1. `public_page_enabled=false` → branded "Page not available" + support email if set
2. Org not found / bad slug → 404 with ANCHOR marketing footer
3. Zero public programs → hero CTA "Contact [business]" instead of scroll
4. Program slug invalid → redirect to org page with anchor toast on client `[optional]`
5. Rate limit aggressive scraping of `/p/*`
6. XSS: sanitize all rich text server-side; no raw HTML from users in SSR

### UI/UX — 2026 premium conversion (affluent parents)

**Design intent:** Feels like a bespoke club website — not a SaaS template. Restrained luxury: confident typography, generous whitespace, photography-forward.

1. **Hero:** Full-bleed cover (or sand fallback), centered logo, serif `public_headline`, sans tagline, verified badge if platform flag set, primary CTA "View programs" (smooth scroll)
2. **Programs:** 1-col mobile / 2-col tablet+ cards — hero image, age label, schedule line, **price (required)**, spots left pill, **Book & pay** CTA with price on button
3. **About:** Two-column desktop — copy left, pull quote or stat right (years operating, capacity)
4. **Gallery:** Horizontal scroll mobile; masonry grid desktop; lightbox tap
5. **Trust:** Accreditation chips + optional single testimonial (quote + attribution) `[P1.5 multi]`
6. **Location:** Static map image or embed; hours table; click-to-call / mailto
7. **Sticky mobile bar:** Business name + "Register" when programs section passed
8. **Footer:** Minimal — Privacy · Terms · subtle "Enrollment & daily updates by ANCHOR"
9. **States:** Skeleton shimmer on load; empty programs; error retry; offline banner
10. **A11y:** WCAG 2.1 AA contrast; focus rings; 44px CTAs; reduced motion respect
11. **SEO:** `generateMetadata` per org; OG image = cover or logo; JSON-LD `LocalBusiness` + `Offer` per listed program
12. **Performance:** RSC-first; next/image; no client JS required to read content; ISR revalidate on profile/program save

**Avoid:** Purple gradients, generic dashboard cards, stock illustration heroes, chatbot widgets, pop-up modals on entry.

---

## PUB-02 · Book & Pay from Public / Program Page `[MVP]`

**Entry:** Program card on PUB-01 or program detail page `/p/[slug]/programs/[programSlug]`  
**Handoff routes:** `/sign-up?role=parent&returnTo=...` · `/login?returnTo=...` · checkout resume URL

### User flows
1. Tap **Book & pay** (shows price on button, e.g. "Book & pay · $450/season")
2. If logged out: sign up or login with return URL preserved
3. If logged in, no children → add child flow (P-18)
4. Select child → copy health profile → waiver scroll-to-sign
5. **Stripe Checkout** (Connect destination charge) — stay on public-branded success page
6. Confirmation: receipt email + "View in app" · registration active if auto-approve on pay
7. Free programs (price 0): skip step 5, waiver only → pending or auto-approve per business setting

### Toasts
1. Payment successful — you're enrolled!
2. Already registered in program → "You're already enrolled."
3. Payment failed → retry Checkout

### Notifications
1. Business admin: new **paid** registration (push + email + amount)
2. Parent: receipt + enrollment confirmation

### Edge cases
1. Registration closed → inline message, no checkout
2. Program full + no waitlist → disable CTA
3. Business Connect not configured → paid program hidden from public (director sees warning in admin)
4. Checkout abandoned → resume link in email `[P1.5]`
5. CSRF + rate limit on checkout session creation
6. Attribution: `source=public`, `org_id`, `program_id`

### UI/UX
1. Stepper max 4 steps: Child → Waiver → Pay → Done
2. Price summary sticky on pay step (line items, deposit if applicable)
3. Mobile-first; public page chrome until success
4. Program detail page: large price typography, trust row, single primary CTA

---

# PART B2 — COACH ROLE `[MVP]`

Coach uses **same routes as Business** with permission gates. Page IDs reference Business pages unless noted.

### Coach permissions matrix
1. **Can access:** B-07 Report, B-08–B-10 media/voice, B-03 Roster (assigned programs), B-03b Field mode, B-04 Child detail, B-05 Emergency view, B-11–B-13 Incidents, B-15 Threads, B-14 Broadcast (assigned programs only)
2. **Cannot access:** B-16 Settings billing, B-17–B-19 org/groups/staff admin, B-25 program admin (read assigned only), B-23 Digest config, B-24 Seasons, B-06 bulk invites (view only), marketplace, revenue analytics, public page publish

### C-01 · Coach Login `[MVP]`
**Route:** `/coach/login` → same auth as B-01; redirect to Coach shell if `role=coach`

### C-02 · My Programs `[MVP]`
**Route:** `/coach/programs`  
**Maps to:** filtered B-03 + program list from USER_JOURNEYS §7.1  
**Flows:** select program → Report or Roster or Incidents for that program only

### C-03 · Coach Daily Workflow `[MVP]`
**Maps to:** B-07, B-08, B-09, B-10 + new **per-child note** action on B-04  
**Note flow:**
1. Roster → child → Add note (text)
2. Publish → timeline event `coach_note`
3. Parent push: "New note from [Program]"

### C-04 · Coach Restrictions (global)
1. API returns 403 on `/business/settings/*`, billing, coach management
2. UI hides Settings tab; show Profile (logout, name only)
3. Attempt to access hidden route → toast: "Contact your director for admin tasks"

### Coach toasts & notifications
1. Same as Business for publish/send flows
2. Coach weekly digest email `[P1.5]` — optional performance summary

### Coach edge cases
1. Removed from program mid-day → read-only; banner on login
2. Assigned to 0 programs → empty state + "Contact director"
3. Publishes report with 0 children tagged → block with error

---

# PART C — ADMIN ROLE

**Shell:** Web admin portal (desktop-first)

---

## A-01 · Admin Login `[MVP]`

**Route:** `/admin/login`

### User flows
Email + password + MFA `[P1.5]` → dashboard

### User journey
Internal staff secure access.

### Toasts
Login errors.

### Notifications
None.

### Edge cases
IP allowlist optional `[P2]`

### UI/UX
Minimal branded login; no public signup.

---

## A-02 · Dashboard `[MVP]`

**Route:** `/admin`

### User flows
1. View KPIs: active businesses, parents, WAPOR, open consults, MRR snapshot
2. Quick links to queue, support

### User journey
Ops morning check.

### Toasts
None.

### Notifications
None.

### Edge cases
None.

### UI/UX
Card KPI layout; navy sidebar nav.

---

## A-03 · Doctor Directory List `[MVP]`

**Route:** `/admin/doctors`

### User flows
List, search, add, edit, deactivate doctors

### User journey
Clinical ops maintains care directory.

### Toasts
CRUD confirmations.

### Notifications
None.

### Edge cases
Deactivate hides from parent app immediately.

### UI/UX
Table with country, specialty, active toggle.

---

## A-04 · Doctor Edit `[MVP]`

**Route:** `/admin/doctors/[id]`

### User flows
Edit name, photo, bio, specialties, country, booking URL (JANE or US), sort order

### Toasts
Saved.

### Notifications
None.

### Edge cases
Invalid URL validation.

### UI/UX
Form + live preview card as parent sees it.

---

## A-05 · Visit Report Upload `[MVP]`

**Route:** `/admin/visits/upload`

### User flows
1. Search child by name + parent email
2. Select appointment date, doctor
3. Upload PDF or enter structured summary
4. Submit → parent notified

### User journey
After JANE appointment, admin closes loop with vault upload.

### Toasts
Uploaded; parent notified.

### Notifications
1. Push to parent: visit summary available

### Edge cases
Wrong child selected → confirm dialog with parent name
Duplicate upload same date → warn

### UI/UX
Child search autocomplete; drag-drop PDF.

---

## A-06 · Consult Queue `[MVP]`

**Route:** `/admin/consults`

### User flows
1. View queue: RED-flag first, then FIFO
2. Assign to self
3. Open → A-07

### User journey
Clinician triages incident consults.

### Toasts
Assigned.

### Notifications
1. Push to on-call: new RED-flag consult

### Edge cases
SLA breach > 15 min → escalate notification to backup

### UI/UX
Queue list with wait time and severity badges.

---

## A-07 · Consult Detail / Chat `[MVP]`

**Route:** `/admin/consults/[id]`

### User flows
1. View child profile, incident context, recent reports, prior visits
2. Chat with parent
3. Attach care plan summary
4. Set clearance status + conditions + expiry
5. Close consult

### User journey
Clinician resolves parent concern with full context.

### Toasts
Consult closed.

### Notifications
1. Push to parent on each reply

### Edge cases
Handoff at shift end → reassign with system message
Parent abusive → flag account

### UI/UX
Split pane: context left, chat right; clearance form bottom sheet.

---

## A-08 · Users & Businesses Lookup `[MVP]`

**Route:** `/admin/users` · `/admin/businesses`

### User flows
Search, view detail, suspend, impersonate read-only `[P2]`

### User journey
Support resolves tickets.

### Toasts
Action confirmations.

### Notifications
Email to user on suspend with reason.

### Edge cases
Impersonate audit logged.

### UI/UX
Search by email, phone, child name.

---

## A-09 · Support & Moderation `[MVP]`

**Route:** `/admin/moderation`

### User flows
Review reported messages/media; take action

### Toasts
Action taken.

### Notifications
None.

### Edge cases
False report threshold.

### UI/UX
Queue of reports with context screenshots.

---

## A-10 · Analytics `[MVP]`

**Route:** `/admin/analytics`

### User flows
View charts: activations, report open rates, conversions, consult volume

### User journey
Weekly business review.

### Toasts
None.

### Notifications
None.

### Edge cases
None.

### UI/UX
Export CSV; date range filter.

---

# PART D — GLOBAL REFERENCE

## D-01 · Notification Catalog (All Roles)

1. **Daily report published** — Parent: push + SMS (one batched SMS per parent per publish) · Quiet hours: defer to 7am `[P1.5]`
2. **Photos uploaded** — Parent: push only (SMS if parent opted in)
3. **Incident reported** — Parent: push + SMS · Business admin: push · Admin: queue if Family · Never quiet-hour suppressed
4. **Incident updated** — Parent: push
5. **Visit report uploaded** — Parent: push
6. **Clearance shared** — Business: push
7. **Registration approved** — Parent: push
8. **Clinician reply** — Parent: push
9. **New message** — Parent or Business: push
10. **Group broadcast** — Parents: push
11. **Trial ending** — Business: email day 10, 13 + push day 13
12. **Form expiring** — Parent: push + email `[P1.5]`
13. **Health check prompt** — Parent: push 7am `[P1.5]`
14. **Co-parent invite** — Email `[P1.5]`
15. **Running late set** — Business: in-app banner + optional push `[P1.5]`
16. **Weekly digest** — Business admin: email Mondays `[P1.5]`
17. **Season re-enrollment invite** — Parent: email + push `[P2]`
18. **Password / verify** — Email transactional

**SMS copy rules:** No symptoms, no diagnoses, no child PHI — use "[Child]'s update from [Business] — View: [url]"

---

## D-02 · Toast Catalog (Patterns)

1. **Save success** — short past tense, 3s auto-dismiss
2. **Send success** — include count when batch
3. **Error** — plain language + retry action if applicable
4. **Network error** — "Check connection and try again"
5. **Upgrade required** — never toast alone; always modal with CTA
6. **Permission denied** — mic, camera, notifications with Settings deep link
7. **Processing** — persistent until done (voice AI); show spinner

---

## D-03 · Global Edge Cases

1. Tokenized links expire (SMS web: 72h default; invite: 30 days)
2. All times stored UTC, displayed local
3. Primary guardian flag resolves pickup conflicts
4. Soft delete children with 30-day retention
5. Business churn: parents read-only access to historical data
6. Rate limits: SMS per org, broadcasts per hour, consults per parent per day
7. AI failure: always offer manual text fallback for reports
8. Push failure: incident path falls back to SMS always
9. Running-late ETA auto-expires at midnight local or on pickup check-in `[P2]`
10. Season archive: parents retain timeline; business loses edit on archived roster
11. SMS reply rate limit: max 5 replies per parent per day `[P2]`
12. Coexistence tools selected at onboarding stored for analytics only (no integration MVP)

---

## D-04 · Build Phase Map

### MVP (build all pages marked `[MVP]`)
P-01 through P-23, P-27, P-28 · B-01 through B-20 · A-01 through A-10 · P-05 SMS web

### Phase 1.5
P-24, P-25, P-26, P-29 · P-28 quiet hours · B-03b, B-13 insurance PDF, B-22, B-23 · pickup override notifications

### Phase 2
P-30 SMS reply · B-21 bulk compliance export · B-24 season rollover · filters, wallet QR, offline incident queue, ROI dashboard

---

## D-05 · Page Index (Quick Lookup)

**Parent (30 pages):** P-01–P-30  
**Business (24 pages):** B-01–B-24 (+ B-03b field mode)  
**Coach (4 logical areas):** C-01–C-04 (reuses B pages with RBAC)  
**Admin (10 pages):** A-01–A-10  

**Strategy & PMF:** [STRATEGY.md](./STRATEGY.md)

**Total MVP screens: ~55 parent/business/admin + coach permission layer**

---

## D-06 · Gap-to-Feature Map (2026 Pain Points)

1. **30–45 min typing daily reports** → Voice → AI daily report (B-08, B-09)
2. **Parents won't install another app** → SMS web viewer (P-05)
3. **Re-enter allergies every season** → Health profile copy (P-22) + forms vault (P-25) + season rollover (B-24)
4. **Vague injury texts** → Incident flow (B-12, P-10) + insurance PDF (B-13)
5. **Coach doesn't know allergies** → Allergy strip + emergency card (B-03, B-05)
6. **Grandma pickup phone tag** → Authorized pickups + today override (P-20) + running late (P-29)
7. **Brightwheel/TeamSnap import** → CSV roster import (B onboarding/settings P2) — optional coexistence messaging in marketing, not onboarding wizard
8. **Director can't prove parent engagement** → Adoption dashboard (B-03) + weekly digest (B-23)
9. **GroupMe liability** → Parent-always-in-thread messaging (P-23, B-15)
10. **Verbal clearance** → Clearance share (P-16, B-07)

---

*Update this document when any page, flow, or notification changes. Engineering tickets should reference page IDs (e.g., P-06, B-09).*
