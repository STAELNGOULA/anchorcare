# ANCHOR — Visual system

## World

**Soft Structuralism × Editorial Luxury** — warm cream grounds, deep navy-teal typography, Instrument Serif display, DM Sans body. Airy whitespace, diffused ambient shadows, machined double-bezel cards.

## Tokens (incumbent)

| Token | Light | Role |
|-------|-------|------|
| Background | `#F5F0E8` (sand) | Page ground |
| Foreground | Navy-teal `hsl(205 62% 15%)` | Body text |
| Primary | Teal `hsl(180 61% 26%)` | CTAs, brand mark |
| Accent | Coral `hsl(12 48% 55%)` | Warm emphasis |
| Display | Instrument Serif | Headlines |
| Body | DM Sans | UI and prose |

## Layout archetypes

- **Hero:** Editorial split — headline left, live report preview right (double-bezel).
- **Features:** Asymmetrical bento — varied spans, not uniform icon grids.
- **Nav:** Floating island pill, detached from viewport edge (not full-width sticky bar).

## Motion

- Easing: `cubic-bezier(0.32, 0.72, 0, 1)`
- Enter: opacity + translateY, 600–800ms, ease-out
- Buttons: `active:scale-[0.98]`; nested icon circle shifts on hover
- Respect `prefers-reduced-motion`

## Bans

- Inter, Roboto, gradient text, gray-on-color secondary text
- Edge-glued sticky header with hairline border
- Eyebrow kickers above headings
- Hero metric stat rows (big number + small label grids)
