# Skin schema — `skins/<slug>.json`

A skin is one JSON file that turns a template into a prospect's demo. Copy `printngo.json`, rename, change the words, drop in 3–4 photos. No build step.

Open it with `t1-quote/index.html?skin=<slug>` (or `demo/<slug>/`). Links between pages carry the skin automatically.

## Top level

| key | type | notes |
|---|---|---|
| `slug` | string | must equal the file name |
| `template` | string | `t1-quote` today; `t2-booking`, `t3-catalogue` later |
| `concept` | bool | `true` shows the "Concept preview · Made by Kites · not live" ribbon. Set `false` once the client has paid and the site goes live. |
| `currency` | string | prefix for estimates, e.g. `RM` |
| `refPrefix` | string | enquiry reference prefix, e.g. `PNG` → `PNG-20260922-3E41` |
| `colors` | object | any of `navy navyDeep blue blueBright accentSoft ink muted paper line`. Become `--navy`, `--navy-deep`, … at runtime. Omit to keep the default blue. |

## `business`

`name`, `short` (nav/wordmark), `initials` (text wordmark badge), `tagline` (footer bottom), `since` (year; omit to hide the EST. block), `description` (meta description), `logo` (path under `skins/`, e.g. `printngo/brand-header.jpg`, or a full URL; omit for a text wordmark), `favicon` (optional).

## `contact`

`whatsapp` — digits with country code (`60167003007`); a local `016-700 3007` also works. Drives every WhatsApp handoff; omit and the site falls back to email.
`phones[]` — `{label, tel}`. `email`. `addressHtml` (may use `<br>`). `mapUrl` (Google Maps link). `hoursNote`.

## Copy blocks (all plain strings unless marked *html*)

- `nav` — `services`, `about`, `contact`, `headerCta`
- `hero` — `eyebrow`, `line1`, `line2`, `cycle[]` (3 words that rotate after `line2`), `description` *html*, `cta` (scrolls to the brief), `waText`, `image`, `imageAlt`, `scrollCue`, `caption` *html*, `glass{label,title html,href,linkLabel,tags}` (omit `glass` to hide the card)
- `intro` — `label`, `title` *html*, `navy{label,title html,text,link}`, `image`, `imageAlt`, `imageLabel`, `paper{label,title html,text,link}`, `facts[]{big,small}` (4 works best)
- `services` — `label`, `title` *html*, `text`, `cta`, `feature{href,image,imageAlt,label,title html}`, `side{href,image,imageAlt,label,title,text,link,linkHref}`
- `servicesPage` — `label`, `title`, `title2`, `text` (top of services.html)
- `process` — `label`, `title` *html*, `steps[]{title,text}` (3)
- `brief` — the quote module: `label`, `title` *html*, `text`, `checklist[]`, `moduleTitle`, `productLabel`, `quantityLabel`, `quantityDefault`, `deadlineLabel`, `detailsLabel`, `detailsPlaceholder`, `summaryLabel`, `note`, `submit`, `formNote`, `readyLabel`, `readyTitle`, `whatsappCta`, `emailCta`, `readyNote`, `opener`, `closer` (first/last line of the WhatsApp message)
- `products[]` — one per service/offer: `id` (kebab, used in `#anchors` and `?service=`), `name`, `group` (floating label), `image`, `imageAlt`, `specs`, `headline`, `description`, `cta`, optional `priceLine` (shown on services.html), and the estimate fields below
- `faq` — `label`, `title` *html*, `items[]{q,a}` (omit `items` to hide the section)
- `about` — `label`, `title`, `title2`, `text`, `image`, `imageAlt`, `imageLabel`, `storyLabel`, `storyTitle` *html*, `paragraphs[]`, `cta`, `valuesLabel`, `values[]{title,text}`
- `contactPage` — `label`, `title`, `title2`, `text`, `formLabel`, `channel`, `serviceLabel`, `messageLabel`, `messagePlaceholder`, `note`, `submit`, `cardLabel`, `cardTitle` *html*, `directions`, `directTitle`, `whatsappLine`
- `footer` — `label`, `title` *html*, `cta`, `blurb` *html*, `exploreTitle`, `briefLink`, `visitTitle`, `directionsLink`, `contactTitle`, `whatsappLink`

## Estimates (optional, per product)

| field | meaning |
|---|---|
| `fromPrice` | number. When present the brief shows "Estimate from RM …" live as the quantity changes |
| `perUnit` | `false` = flat price regardless of quantity (a kitchen, a package) |
| `unit` | `pcs`, `pages`, `ft`, `kitchen`… shown after the quantity |
| `minQty` | estimate never goes below this quantity |
| `note` | one line under the estimate, e.g. "Site measurement before final quote" |

## Images

Paths are relative to `skins/` (`jibuild/hero.jpg` → `skins/jibuild/hero.jpg`) or full `https://` URLs. Hero 1600×900, panels 800×600. Keep each under 300 KB (`cwebp -q 80`).

## Checklist for a new skin (target: under 15 minutes)

1. `cp skins/printngo.json skins/<slug>.json`, set `slug`, `refPrefix`, `colors`.
2. Fill `business` + `contact` from Google Maps / their Facebook page.
3. Rewrite `hero`, `intro`, `services`, `process`, `brief.opener`; 3–5 `products`; 3–4 `faq.items`; `about.paragraphs`.
4. Add 3–4 photos to `skins/<slug>/` (or paste their public photo URLs).
5. `mkdir demo/<slug>` and copy `demo/printngo/index.html`, changing the slug.
6. Add the slug to `skins/index.json` so it appears in the gallery.
7. Open `t1-quote/index.html?skin=<slug>` and click through all four pages + the brief.
