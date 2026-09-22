# Prototype 001 — Anyara Hills (speculative)

A client-facing one-pager, built to demonstrate what Made by Kites does. Speculative:
**not commissioned by and not affiliated with the developer.** `noindex, nofollow` is set.

Subject chosen because it is a real product with real, checkable facts — which always
demos better than invented content — and because it doubles as a warm approach to KHK Land
with `docs/audits/AUDIT-anyarahills.md` attached.

## Run it

```bash
cd prototypes/001-anyara-hills
python3 -m http.server 4321
# → http://localhost:4321
```

Any static server works. There is no build step, no package manager, no dependencies to
install.

## Presenting it

- **Press `A`** (or click *Annotations*) to overlay callouts explaining each fix and what
  the live site does instead. This is the pitch — walk the client down the page with
  annotations on.
- Append UTMs to show attribution capture working end to end:
  `http://localhost:4321/?utm_source=meta&utm_campaign=phase1`
  The enquiry form's step 2 prints what it captured, and the WhatsApp button's pre-filled
  message carries the source.
- The live page weight and load time print in the footer, measured from the Performance
  API. That number is the argument — quote it against the audit's 5,183 KB / 4,997 ms.
- Resize to phone width. The hero keeps two CTAs above the fold; pinch-zoom works.

## What it demonstrates

| Fix | Where to point |
|---|---|
| Two CTAs in the mobile hero | hero, annotated |
| WhatsApp as a first-class path, UTM-tagged | floating button, annotated |
| Specifics instead of superlatives | fact strip — every figure is from the client's own site |
| Affordance labelling | "Drag to explore" on the masterplan |
| The missing trust layer | §05 approvals, construction status, live site camera |
| Two-step form, qualify second | §06 — step 1 captures a contactable lead, step 2 asks budget, with an honest "Just exploring" |
| Attribution on every lead | six hidden UTM fields, readout printed under the submit |
| CTA as an offer | "Request a private viewing", not "Submit" |
| Pinch-zoom allowed | viewport meta has no `user-scalable=0` |
| Motion with a budget | three durations, three curves, tokenised |
| No pinning | all depth is scrubbed parallax — smooth on a phone |

## Architecture

```
001-anyara-hills/
├── index.html
├── assets/css/tokens.css   ← the reusable layer
├── assets/css/main.css     ← components; no raw colour or size values
└── assets/js/main.js       ← 11 labelled modules
```

**`tokens.css` is the thing to extract into `madebykites-starter v1`.** Two base colours
with opacity ramps, one restrained accent (one more held in reserve, deliberately unused),
a `clamp()` type scale, one spacing ladder, and three durations × three easing curves. A
section retheming to the light ground is five variable reassignments (`.theme-mist`) —
no component CSS changes.

**Identity is original.** Palette is rainforest ink `#0d1411` and canopy mist `#e7eae3`
with a muted brass accent; type is Cormorant Garamond against Archivo, with accent words
set in the display italic. None of this is the reference site's bone-and-navy Didone —
the *system* was studied, the look was not copied. See
`docs/audits/ANYARA-REBUILD-SPEC.md` §0.

**Imagery is procedural.** The ridgelines, contour band and masterplan are hand-authored
SVG — a few KB, and honest about being art direction rather than fake renders of the
client's actual land. Photography drops into the hero and band slots in the next pass.

**Motion stack:** Lenis 1.1.18 (smooth scroll), GSAP 3.12.5 + ScrollTrigger (scrubbed
parallax, graded smoothing 0.25–0.5), hand-rolled line splitting instead of SplitText (no
plugin licence question, no extra request), designed preloader that locks scroll and hands
off to the hero.

**It degrades.** Reveals are opt-in via `.r-on` added by JS, so with JS off or a CDN
failure every word still renders, readable, at rest. The preloader has a 4.2 s hard
ceiling. `prefers-reduced-motion` is honoured throughout. The masterplan pans by keyboard
as well as pointer.

## Before this goes anywhere public

1. **Verify every figure.** The 584 acres, 1-acre minimum, freehold, 25 minutes, 12-ft
   wall, 200+ cameras, developer name and registration number are all from the client's
   own site. **The lot count (26), the phase structure and dates, the approvals line, and
   the infrastructure status are illustrative** — the approvals item carries a visible
   "verify before publishing" pill for exactly this reason. Do not show a prospect a
   figure we cannot source.
2. **Self-host** Lenis and GSAP; drop the CDN dependency.
3. Swap the Google Fonts link for self-hosted subsets.
4. Add real photography, `<picture>` with AVIF + WebP, and poster frames on any video.
5. Add `og:image`, `og:video` and schema before any indexable deployment. Keep `noindex`
   until then.
6. Point the form at a real endpoint and lead router; keep the UTM fields.

## Next passes

- Photography and a hero video loop (poster set, `playsInline`, `preload="metadata"`)
- Barba page transitions once there is more than one page
- The `/masterplan`, `/security`, `/location` pages from the rebuild spec §3
- Extract `tokens.css` plus the parallax and line-split recipes into the starter
- A `zh-Hans` version at content parity
