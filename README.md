# kites-demos — prospect demo kit

Static, no build step. One shared template + one JSON "skin" per prospect = a full four-page concept site with a working quote brief that hands off to WhatsApp. Bespoke one-offs sit alongside in `bespoke/` and share the same `demo/<slug>/` links.

```
kites-demos/
├─ index.html          gallery of all demos (reads skins/index.json)
├─ shared/             assets every template uses (fonts, CSS, JS) — edit once, every demo updates
│  ├─ tokens.css       colour/spacing tokens; skins override the colours at runtime
│  ├─ style.css        the Print & Go design system, colours replaced with tokens
│  ├─ kinetic.css      rotating headline word
│  ├─ extra.css        concept ribbon, WhatsApp buttons, text wordmark, estimate line
│  ├─ skin.js          loads ?skin=<slug>, fills data-skin slots, applies colours, keeps the skin in links
│  ├─ site.js          nav, quote brief module, contact form, WhatsApp/email handoff
│  ├─ enquiry.js       reference numbers, estimates, brief text, wa.me / mailto links
│  └─ motion.js        reveal-on-scroll (with reveal-at-rest fallback), motion toggle, magnetic buttons
├─ t1-quote/           Template 1 — "get a quote" businesses (print, cabinets, signage, aircond, renovation…)
│  ├─ index.html · services.html · about.html · contact.html
├─ skins/
│  ├─ _schema.md       every key explained + the 15-minute checklist
│  ├─ index.json       list shown on the gallery page
│  ├─ printngo.json    Print & Go Fast Print (print shop, KL) — reference skin, copy this one
│  ├─ printngo/        its images
│  └─ jibuild.json     Ji Build (custom cabinets, Klang Valley) — proves the 15-minute skin
├─ bespoke/<slug>/     one-off builds with their own HTML/CSS/JS (anyara-hills) — listed on the gallery via `href`
└─ demo/<slug>/        short-link redirect per prospect: demo/printngo/ → t1-quote/index.html?skin=printngo
```

## Run it locally

Browsers block `fetch()` from `file://`, so the folder has to be served, not double-clicked.

- **Finder:** double-click `Open Kites Demos.command` — starts the server and opens the gallery
  in your browser. Close its Terminal window to stop it.
- **Terminal:** `node serve.mjs` (or `python3 -m http.server 8765`) inside `kites-demos`, then
  open http://localhost:8765/ (gallery) or http://localhost:8765/demo/printngo/.

## Publish

Push this folder to a GitHub repo with Pages enabled (root). Prospect links become
`https://<org>.github.io/kites-demos/demo/<slug>/`. The existing `kites-studio/printngo-demo` repo can stay as-is or be replaced by the redirect.

## Make a new demo (target ≤ 15 min)

1. `cp skins/printngo.json skins/<slug>.json` — set `slug`, `refPrefix`, `colors`.
2. Fill `business` and `contact` (WhatsApp number with country code — this drives every handoff).
3. Rewrite the copy blocks (`hero`, `intro`, `services`, `process`, `brief`, 3–5 `products`, `faq`, `about`).
4. Drop 3–4 photos into `skins/<slug>/` or paste public image URLs.
5. `cp -r demo/printngo demo/<slug>` and change the slug inside; add the slug to `skins/index.json`.
6. Open `t1-quote/index.html?skin=<slug>`, click all four pages and send yourself a test brief.

Full key reference: `skins/_schema.md`.

## What the template does that a brochure site doesn't

- **Quote brief → WhatsApp** — product, quantity, deadline, notes become a filled-in `wa.me` message with a reference number (`PNG-20260922-3E41`). Email fallback and copy-to-clipboard included.
- **Live estimate** — any product with `fromPrice` shows "Estimate from RM …" as the customer types (Ji Build kitchen: from RM19,888).
- **Contact form** with validation and honeypot, same handoff.
- **Concept ribbon** — "Concept preview · Made by Kites · not live" so a prospect never mistakes it for a live site. Set `"concept": false` when it goes live.
- **Reveal-at-rest fix** — sections are visible even if scripts stall; motion is layered on top.
- **Per-skin colours** — a cabinet maker gets warm oak, a print shop stays blue, same CSS.

## Conventions

- Skins: `skins/<kebab-slug>.json`, images in `skins/<slug>/`, WhatsApp numbers as digits with country code.
- Templates: `t1-quote`, `t2-booking`, `t3-catalogue`. A template never contains business words — everything comes from the skin.
- Stable IDs from `docs/FEATURE-LIBRARY.md` apply (L-xx look, W-xx work). The brief module is W-04 + W-07; the kinetic headline is L-09.
