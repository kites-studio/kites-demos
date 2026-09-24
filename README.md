# kites-demos — prospect demo kit

Static, no build step. Three templates with genuinely different layouts + one JSON "skin" per prospect = a full concept site whose form ends in a real WhatsApp message with a reference. Bespoke one-offs sit alongside in `bespoke/` and share the same `demo/<slug>/` links.

```
kites-demos/            ← the folder here; publishes to the PUBLIC repo `kites-studio/preview`
├─ index.html         neutral landing page — deliberately lists nothing (a prospect who trims
│                     the URL must not see the other prospects you are pitching)
├─ all/index.html     your own gallery of every preview (noindex) — kites-studio.github.io/preview/all/
├─ <slug>/index.html  ONE PER PROSPECT, at the top level: the link you send.
│                     e.g. kites-studio.github.io/preview/jibuild/ → t1-quote/index.html?skin=jibuild
├─ shared/            assets every template uses (fonts, CSS, JS) — edit once, every preview updates
│  ├─ tokens.css       colour/spacing tokens; skins override the colours at runtime
│  ├─ style.css        the T1 design system, colours replaced with tokens
│  ├─ kinetic.css      rotating headline word
│  ├─ extra.css        concept ribbon, WhatsApp buttons, text wordmark, .brand fit variant, estimate line
│  ├─ skin.js          loads ?skin=<slug>, fills data-skin slots, applies colours, keeps the skin in links
│  ├─ site.js          nav, quote brief module, contact form, WhatsApp/email handoff
│  ├─ enquiry.js       reference numbers, estimates, message text, date helpers, wa.me / mailto links
│  ├─ book.js          T2 booking module (service → units → price → slot → WhatsApp)
│  ├─ register.js      T3 registration module (programme → level → subjects → branch → days → WhatsApp)
│  └─ motion.js        reveal-on-scroll (with reveal-at-rest fallback), motion toggle, magnetic buttons
├─ t1-quote/           Template 1 — "get a quote" (print, cabinets, signage, renovation). Dark editorial, full-bleed hero
│  ├─ index.html · services.html · about.html · contact.html          (uses shared/style.css)
├─ t2-book/            Template 2 — "book a slot" (aircond, auto, pest, cleaning). Light utility, booking module in the hero
│  ├─ index.html · services.html · contact.html · book.css           (engine: shared/book.js)
├─ t3-register/        Template 3 — "register / trial" (tuition, music, studios). Warm paper prospectus, serif headlines
│  ├─ index.html · programmes.html · register.html · register.css    (engine: shared/register.js)
├─ skins/
│  ├─ _schema.md       every key explained + the 15-minute checklist
│  ├─ index.json       list shown on your gallery
│  ├─ printngo.json    Print & Go Fast Print (print shop, KL) — T1 reference skin
│  ├─ jibuild.json     Ji Build Sdn Bhd (custom cabinets, Puchong) — T1, carries their real logo
│  ├─ aircond.json     Air-cond.my (Klang) — T2 reference skin
│  ├─ ituition.json    i-Tuition (Cheras) — T3 reference skin
│  ├─ auto.json        Kites Auto Care — INDUSTRY demo (any workshop), T2 + vehicle/branch/add-ons, `bold` type
│  ├─ catering.json    Dapur Kites Catering — INDUSTRY demo (any caterer), T1 + per-head add-ons/deposit, `warm` type
│  └─ <slug>/          each skin's web-size images (originals live in madebykites/assets/<slug>/)
└─ bespoke/<slug>/     one-off builds with their own HTML/CSS/JS (anyara-hills)
```

## Run it locally

Browsers block `fetch()` from `file://`, so the folder has to be served, not double-clicked.

- **Finder:** double-click `Open Kites Demos.command` — starts the server and opens the gallery
  in your browser. Close its Terminal window to stop it.
- **Terminal:** `node serve.mjs` (or `python3 -m http.server 8765`) inside `kites-demos`, then
  open http://localhost:8765/ (gallery) or http://localhost:8765/demo/printngo/.

## Publish

Live at **https://kites-studio.github.io/preview/** (GitHub Pages, repo `kites-studio/preview`).
Prospect links: `https://kites-studio.github.io/preview/<slug>/` — e.g. `demo/printngo/`,
`demo/jibuild/`, `demo/anyara-hills/`. Pages takes ~1 minute after a push.

The source of truth is the `kites-demos/` folder inside the private `madebykites` repo; the public
repo is a subtree of it. To publish, from the `madebykites` root:

```bash
git subtree push --prefix=kites-demos demos main
```

(`demos` = https://github.com/kites-studio/preview.git; HTTP/1.1 is pinned in this repo's git
config because HTTP/2 pushes were being dropped.) Never commit directly in the public repo.
`.nojekyll` is required so `skins/_schema.md` is served. `kites-studio/printngo-demo` (the link
already with the client) is redirect-only and forwards here.
