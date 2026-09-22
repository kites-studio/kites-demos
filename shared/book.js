/** T2 Book a Slot — booking module.
 * service (cards) → sizing (stepper) → package price → date strip + time window → contact → WhatsApp.
 * Reads skin.services[] and skin.booking; writes nothing anywhere except the wa.me / mailto links.
 * Markup contract: one [data-book] element containing a <form> and a .book-ready block (see t2-book/index.html).
 */
import { createReference, money, whatsappLink, emailLink, formatLines, upcomingDays } from "./enquiry.js";

function init(skin) {
  const module = document.querySelector("[data-book]");
  if (!module) return;
  const form = module.querySelector("form"), ready = module.querySelector(".book-ready");
  const services = skin.services || [], cfg = skin.booking || {};
  const currency = skin.currency || "RM";
  const q = (sel) => module.querySelector(sel);

  /* preselect from ?service= or #hash */
  const params = new URLSearchParams(location.search);
  const pre = params.get("service") || (location.hash || "").replace("#", "");

  /* 1 · service cards */
  const list = q("[data-service-list]");
  list.replaceChildren(...services.map((s, i) => {
    const l = document.createElement("label");
    l.className = "svc-card";
    l.innerHTML = `<input type="radio" name="service" value="${s.id}" ${s.id === pre || (!services.some((x) => x.id === pre) && i === 0) ? "checked" : ""}>
      <span class="svc-body"><span class="svc-name">${s.name}${s.popular ? ' <em class="svc-tag">Most booked</em>' : ""}</span>
      <span class="svc-blurb">${s.blurb || ""}</span>
      <span class="svc-price">${s.fromPrice != null ? "from " + money(s.fromPrice, currency) + (s.perUnit === false ? "" : " / " + (s.unit || "unit")) : "price on site"}</span></span>
      <span class="svc-check" aria-hidden="true">✓</span>`;
    return l;
  }));
  const service = () => services.find((s) => s.id === form.elements.service.value) || services[0];

  /* 2 · sizing stepper */
  const sizing = form.elements.sizing, minus = q("[data-step='-1']"), plus = q("[data-step='1']");
  const clamp = (n) => Math.min(Math.max(n, Number(sizing.min) || 1), Number(sizing.max) || 99);
  minus.addEventListener("click", () => { sizing.value = clamp(Number(sizing.value) - 1); update(); });
  plus.addEventListener("click", () => { sizing.value = clamp(Number(sizing.value) + 1); update(); });

  /* 3 · date strip + time windows */
  const strip = q("[data-date-strip]");
  const days = upcomingDays(cfg.daysAhead || 14, cfg.closedDays || []);
  strip.replaceChildren(...days.map((d, i) => {
    const l = document.createElement("label");
    l.className = "day" + (d.weekend ? " weekend" : "");
    l.innerHTML = `<input type="radio" name="date" value="${d.value}" data-label="${d.label}" ${i === 0 ? "checked" : ""}><span class="day-name">${d.day}</span><strong>${d.date}</strong><span class="day-month">${d.month}</span>`;
    return l;
  }));
  const windows = q("[data-window-list]");
  windows.replaceChildren(...(cfg.windows || [{ id: "am", label: "Morning", sub: "9am – 12pm" }, { id: "pm", label: "Afternoon", sub: "1pm – 5pm" }]).map((w, i) => {
    const l = document.createElement("label");
    l.className = "win";
    l.innerHTML = `<input type="radio" name="window" value="${w.id}" data-label="${w.label}${w.sub ? " (" + w.sub + ")" : ""}" ${i === 0 ? "checked" : ""}><span><strong>${w.label}</strong>${w.sub ? `<small>${w.sub}</small>` : ""}</span>`;
    return l;
  }));

  /* live price + summary */
  const priceEl = q("[data-price]"), priceNote = q("[data-price-note]"), sumEl = q("[data-summary]"), unitEl = q("[data-unit-label]");
  function calc() {
    const s = service(), n = clamp(Number(sizing.value) || 1);
    if (s.fromPrice == null) return { text: "", n };
    const total = s.perUnit === false ? s.fromPrice : s.fromPrice * n;
    return { text: "from " + money(total, currency), n, total };
  }
  function update() {
    const s = service(), c = calc();
    list.querySelectorAll(".svc-card").forEach((el) => el.classList.toggle("is-on", el.querySelector("input").checked));
    strip.querySelectorAll(".day").forEach((el) => el.classList.toggle("is-on", el.querySelector("input").checked));
    windows.querySelectorAll(".win").forEach((el) => el.classList.toggle("is-on", el.querySelector("input").checked));
    if (unitEl) unitEl.textContent = (s.unit || cfg.sizingUnit || "unit") + (c.n === 1 ? "" : "s");
    if (priceEl) { priceEl.textContent = c.text ? "Estimate " + c.text : ""; priceEl.hidden = !c.text; }
    if (priceNote) priceNote.textContent = s.note || cfg.estimateNote || "";
    const date = form.querySelector("input[name=date]:checked"), win = form.querySelector("input[name=window]:checked");
    if (sumEl) sumEl.textContent = `${s.name} · ${c.n} ${(s.unit || "unit") + (c.n === 1 ? "" : "s")} · ${date ? date.dataset.label : "—"}, ${win ? win.dataset.label.split(" (")[0].toLowerCase() : ""}`;
    const dur = q("[data-duration]"); if (dur) dur.textContent = s.duration ? s.duration : "";
    const inc = q("[data-includes]"); if (inc) inc.replaceChildren(...(s.includes || []).map((t) => { const li = document.createElement("li"); li.textContent = t; return li; }));
  }
  form.addEventListener("input", update);
  form.addEventListener("change", update);
  update();

  /* submit → reference → WhatsApp / email */
  let text = "", ref = "";
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!form.reportValidity()) return;
    const s = service(), c = calc(), d = new FormData(form);
    const date = form.querySelector("input[name=date]:checked"), win = form.querySelector("input[name=window]:checked");
    ref = createReference(skin.refPrefix || "BK");
    text = formatLines(skin, {
      opener: cfg.opener, closer: cfg.closer,
      fields: [
        ["Service", s.name],
        [cfg.sizingField || "Units", `${c.n} ${(s.unit || "unit") + (c.n === 1 ? "" : "s")}`],
        ["Preferred date", date ? date.dataset.label : ""],
        ["Time", win ? win.dataset.label : ""],
        ["Name", d.get("name")],
        ["Phone", d.get("phone")],
        [cfg.addressLabel || "Address / area", d.get("address")],
        ["Estimate shown", c.text],
      ],
      message: d.get("notes"),
    }, ref);
    q("[data-ready-summary]").textContent = `${s.name} · ${c.n} ${(s.unit || "unit") + (c.n === 1 ? "" : "s")}\n${date ? date.dataset.label : ""}, ${win ? win.dataset.label : ""}${c.text ? "\nEstimate " + c.text : ""}`;
    q("[data-reference]").textContent = ref;
    const wa = q("[data-whatsapp]"), mail = q("[data-email]");
    const waHref = whatsappLink(skin.contact && skin.contact.whatsapp, text);
    if (wa) { if (waHref) { wa.href = waHref; wa.hidden = false; } else wa.hidden = true; }
    const mailHref = emailLink(skin.contact && skin.contact.email, `Booking ${ref} — ${s.name}`, text);
    if (mail) { if (mailHref) { mail.href = mailHref; mail.hidden = false; } else mail.hidden = true; }
    form.hidden = true; ready.hidden = false; ready.focus();
    ready.scrollIntoView({ block: "start", behavior: "smooth" });
  });
  q("[data-edit]")?.addEventListener("click", () => { ready.hidden = true; form.hidden = false; form.elements.service[0].focus(); });
  q("[data-copy]")?.addEventListener("click", async (e) => {
    try { await navigator.clipboard.writeText(text); e.target.textContent = "Copied ✓"; } catch { e.target.textContent = "Copy not available"; }
  });

  /* sticky phone bar: mirrors the live estimate */
  const bar = document.querySelector("[data-sticky-price]");
  if (bar) { const sync = () => { const c = calc(); bar.textContent = c.text || service().name; }; form.addEventListener("input", sync); form.addEventListener("change", sync); sync(); }
}

if (window.SKIN) init(window.SKIN);
else document.addEventListener("skin:ready", (ev) => init(ev.detail), { once: true });
