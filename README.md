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

Live at **https://kites-studio.github.io/kites-demos/** (GitHub Pages, repo `kites-studio/kites-demos`).
Prospect links: `https://kites-studio.github.io/kites-demos/demo/<slug>/` — e.g. `demo/printngo/`,
`demo/jibuild/`, `demo/anyara-hills/`. Pages takes ~1 minute after a push.

The source of truth is the `kites-demos/` folder inside the private `madebykites` repo; the public
repo is a subtree of it. To publish, from the `madebykites` root:

```bash
git subtree push --prefix=kites-demos demos main
```

(`demos` = https://github.com/kites-studio/kites-demos.git; HTTP/1.1 is pinned in this repo's git
config because HTTP/2 pushes were being dropped.) Never commit directly in the public repo.
`.nojekyll` is required so `skins/_schema.md` is served. The existing `kites-studio/printngo-demo`
repo can now be replaced by a redirect to `demo/printngo/`.
