# Skin schema — `skins/<slug>.json`

A skin is one JSON file that turns a template into a prospect's demo. Copy `printngo.json`, rename, change the words, drop in 3–4 photos. No build step.

Open it with `<template>/index.html?skin=<slug>` (or `demo/<slug>/`). Links between pages carry the skin automatically.

## Top level

| key | type | notes |
|---|---|---|
| `slug` | string | must equal the file name |
| `template` | string | `t1-quote` (quote brief), `t2-book` (book a slot), `t3-register` (register / trial). Each template reads the shared blocks below plus its own section at the end of this file |
| `concept` | bool | `true` shows the "Concept preview · Made by Kites · not live" ribbon. Set `false` once the client has paid and the site goes live. |
| `currency` | string | prefix for estimates, e.g. `RM` |
| `refPrefix` | string | enquiry reference prefix, e.g. `PNG` → `PNG-20260922-3E41` |
| `colors` | object | camelCase keys become CSS variables (`accentDeep` → `--accent-deep`). T1: `navy navyDeep blue blueBright accentSoft ink muted paper line`. T2: `accent accentDeep accentSoft wash ink muted line`. T3: `deep deepSoft accent accentSoft paper card ink muted line`. Omit to keep the template default. |

## `business`

`name`, `short` (nav/wordmark), `initials` (text wordmark badge), `tagline` (footer bottom), `since` (year; omit to hide the EST. block), `description` (meta description), `logo` (path under `skins/`, e.g. `printngo/brand-header.jpg`, or a full URL; omit for a text wordmark), `favicon` (optional).

## `contact`

`whatsapp` — digits with country code (`60167003007`); a local `016-700 3007` also works. Drives every WhatsApp handoff; omit and the site falls back to email.
  **Unconfirmed prospect? Use the Kites demo number `60102156826` (010-215 6826) and the studio email**, never a made-up
  number — the brief must land in a real WhatsApp when the prospect tries it. Swap to the client's own number
  (one line) the day they confirm. Only Print & Go carries its real number, because that build was agreed with them.
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

---

## T2 — Book a Slot (`t2-book`) — aircond, auto, pest, cleaning

Loop: service → how many → price → date + time window → name/phone/address → WhatsApp. Three pages: `index.html` (booking in the hero), `services.html`, `contact.html`. Reference skin: `aircond.json`.

- `contact.hours[]{day,time}` — shown on the contact page.
- `nav` — `services`, `contact`, `faq`, `headerCta`.
- `hero` — `eyebrow`, `title` *html*, `description` *html*, `bullets[]`, `waText`, `image` (16:10), `imageAlt`, `badge{big,small}`.
- `booking` — the module: `title`, `pill`, `serviceLabel`, `sizingLabel` (question), `sizingField` (label in the message, e.g. "Units"), `sizingUnit`, `sizingDefault/Min/Max`, `sizingHint`, `estimateNote`, `dateLabel`, `daysAhead` (14), `closedDays[]` (0 = Sunday), `windows[]{id,label,sub}`, `contactLabel`, `nameLabel`, `phoneLabel`, `addressLabel`, `addressPlaceholder`, `notesLabel`, `notesPlaceholder`, `summaryNote`, `submit`, `formNote` *html*, `readyLabel`, `readyTitle`, `whatsappCta`, `emailCta`, `readyNote`, `opener`, `closer`, `stickyLabel`, `stickyFallback`.
- `trust[]{big,small}` (4) · `how{label,title html,steps[]{title,text}}` · `servicesHome{label,title html,text,tileCta}` · `servicesPage{label,title html,text}` · `pricingNotes{label,title,items[]}` · `areas{label,title html,text,list[],note,image,imageAlt}` · `faq` · `contactPage{label,title html,text,formTitle,formText,serviceLabel,messageLabel,messagePlaceholder,note,submit,directTitle,whatsappLine,hoursTitle,directions}` · `footer{title html,blurb html,cta,contactTitle,whatsappLink,visitTitle,directionsLink}`.
- `services[]` — `id`, `name`, `popular` (bool → "Most booked" tag), `blurb`, `fromPrice`, `perUnit` (`false` = flat), `unit` ("unit", "car", "room"), `duration`, `includes[]`, `note`, `image` (4:3), `imageAlt`. Estimate = `fromPrice × quantity` unless `perUnit:false`.

Auto-workshop variant: `unit:"car"`, `sizingLabel:"How many cars?"` (usually max 1 — set `sizingMax:"1"` and `sizingHint` to the car-model question, put the model in `notesPlaceholder`). Per-branch numbers: not in T2 yet — use T3's `branches[].whatsapp` pattern if needed.

## T3 — Register / Trial (`t3-register`) — tuition, music, enrichment, studios

Loop: programme → level → subjects (multi) → branch → mode → preferred days → student + parent WhatsApp → WhatsApp with the intake date. Three pages: `index.html`, `programmes.html`, `register.html`. Reference skin: `ituition.json`.

- `branches[]` — `id`, `name`, `area` (small line under the chip), `addressHtml`, `hours`, `phone`, `tel`, `mapUrl`, optional `whatsapp` (**per-branch handoff**: the registration goes to that branch's number; falls back to `contact.whatsapp`).
- `nav` — `programmes`, `why`, `branches`, `headerCta`.
- `hero` — `eyebrow`, `title` *html*, `description` *html*, `cta`, `waText`, `image` (4:5 portrait, arched), `imageAlt`, `tags[]`.
- `intake{label,title,text,detail}` — the date card on the hero photo and the register page. Omit to hide.
- `results[]{big html,small}` (4, dark band; omit to hide) · `programmesHome{label,title html,text,cardCta}` · `programmesPage{label,title html,text}` · `feesNotes{label,title,items[]}` · `why{label,title html,text,image,imageAlt,points[]{title,text}}` · `testimonials{label,title html,items[]{quote,who,detail}}` (allowed for tuition/studios — never for clinics) · `teachers{label,title html,items[]{name,role,image}}` · `branchesHome{label,title html,mapLink}` · `faq` · `footer{title html,blurb html,cta,contactTitle,whatsappLink,branchesTitle}`.
- `programmes[]` — `id`, `name`, `blurb`, `levels[]` (chips), `subjects[]` (multi-select chips; omit for single-subject programmes like a music instrument — the step hides), `fromPrice`, `feeUnit` ("per subject / month"), `feePerSubject` (`true` = fee × subjects picked), `note`.
- `register` — page copy (`pageLabel`, `pageTitle` *html*, `pageText`), module copy (`title`, `pill`, `programmeLabel`, `levelLabel`, `subjectsLabel`, `subjectsHint`, `branchLabel`, `modeLabel`, `modes[]{id,label,sub}`, `daysLabel`, `daysHint`, `days[]`, `contactLabel`, `studentLabel`, `parentLabel`, `phoneLabel`, `notesLabel`, `notesPlaceholder`, `summaryNote`, `submit`, `formNote` *html*, ready state as in T2), message labels (`opener`, `closer`, `studentField`, `parentField`, `intakeField`, `intakeLine`), side cards (`nextLabel`, `nextTitle`, `nextSteps[]`, `askLabel`, `askText`, `askWhatsapp`).

Music-school variant: one programme per instrument, `levels` = Beginner / Grade 1–8, no `subjects`, `feePerSubject:false`, `feeUnit:"per month, 4 lessons"`.

## Honesty rules for every skin

Prices, ratings, review counts, results percentages, testimonials and teacher names in a prospect demo are **illustrative unless the client supplied them**. Label them (`· illustrative`) or keep them in the `_note`, and replace before launch. The concept ribbon covers the site as a whole, not a fabricated "92% got an A".
