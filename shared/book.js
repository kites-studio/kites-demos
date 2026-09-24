/** T2 Book a Slot — booking module.
 * service (cards) → sizing (stepper) → package price → date strip + time window → contact → WhatsApp.
 * Reads skin.services[] and skin.booking; writes nothing anywhere except the wa.me / mailto links.
 * Optional, all off unless the skin sets them:
 *   booking.vehicle  → make / model / year / plate step; each model's size class (s|m|l) picks service.sizePrices
 *   booking.hideSizing → drop the quantity stepper (one car per booking)
 *   booking.extras[] → add-on chips {id,label,sub,price} added to the estimate
 *   skin.branches[]  → branch chips; the booking goes to that branch's whatsapp (falls back to contact.whatsapp)
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
  const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

  /* optional · vehicle: make → model → year → plate */
  const veh = cfg.vehicle, vStep = q("[data-vehicle-step]");
  let vehicle = () => null;
  if (veh && vStep) {
    vStep.hidden = false;
    const makes = veh.makes || {}, sizes = veh.sizes || {};
    const years = [];
    for (let y = new Date().getFullYear(); y >= (veh.oldestYear || 2005); y--) years.push(y);
    q("[data-vehicle-fields]").innerHTML = `
      <label><span>${esc(veh.makeLabel || "Make")}</span><select name="make" required><option value="">Choose…</option>${Object.keys(makes).map((m) => `<option>${esc(m)}</option>`).join("")}<option>Other</option></select></label>
      <label><span>${esc(veh.modelLabel || "Model")}</span><select name="model" required disabled><option value="">Pick the make first</option></select></label>
      <label><span>${esc(veh.yearLabel || "Year")}</span><select name="year"><option value="">Not sure</option>${years.map((y) => `<option>${y}</option>`).join("")}</select></label>
      <label><span>${esc(veh.plateLabel || "Plate no. (optional)")}</span><input name="plate" autocomplete="off" autocapitalize="characters" placeholder="${esc(veh.platePlaceholder || "e.g. WXY 1234")}"></label>
      <p class="size-note" data-size-note></p>`;
    const make = form.elements.make, model = form.elements.model;
    make.addEventListener("change", () => {
      const groups = makes[make.value];
      const opts = groups
        ? Object.entries(groups).flatMap(([size, names]) => names.map((n) => `<option data-size="${size}">${esc(n)}</option>`)).sort((a, b) => a.localeCompare(b))
        : make.value ? [`<option data-size="${veh.defaultSize || "m"}">${esc(veh.otherModel || "Other — I'll type it in the notes")}</option>`] : [];
      model.innerHTML = `<option value="">${make.value ? "Choose…" : "Pick the make first"}</option>` + opts.join("");
      model.disabled = !make.value;
      if (!groups && make.value) model.selectedIndex = 1;
    });
    vehicle = () => {
      const o = model.selectedOptions[0];
      if (!model.value || !o) return null;
      const size = o.dataset.size;
      return { make: make.value, model: model.value, year: form.elements.year.value, plate: form.elements.plate.value.trim().toUpperCase(), size, sizeLabel: sizes[size] || "" };
    };
  }
  if (cfg.hideSizing) { const sz = q("[data-sizing]"); if (sz) sz.hidden = true; }

  /* optional · branches */
  const branches = skin.branches || [], bList = q("[data-branch-list]");
  if (branches.length && bList) {
    bList.hidden = false;
    bList.replaceChildren(...branches.map((b, i) => {
      const l = document.createElement("label");
      l.className = "win";
      l.innerHTML = `<input type="radio" name="branch" value="${esc(b.id)}" ${i === 0 ? "checked" : ""}><span><strong>${esc(b.name)}</strong>${b.area ? `<small>${esc(b.area)}</small>` : ""}</span>`;
      return l;
    }));
  }
  const branch = () => branches.find((b) => form.elements.branch && b.id === form.elements.branch.value) || null;

  /* optional · add-ons */
  const extras = cfg.extras || [], xList = q("[data-extra-list]");
  if (extras.length && xList) {
    xList.hidden = false;
    xList.replaceChildren(...extras.map((x) => {
      const l = document.createElement("label");
      l.className = "win";
      l.innerHTML = `<input type="checkbox" name="extra" value="${esc(x.id)}"><span><strong>${esc(x.label)}</strong><small>${x.price ? "+" + money(x.price, currency) : esc(x.sub || "Free")}${x.price && x.sub ? " · " + esc(x.sub) : ""}</small></span>`;
      return l;
    }));
  }
  const chosenExtras = () => extras.filter((x) => [...form.querySelectorAll("input[name=extra]:checked")].some((i) => i.value === x.id));

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

  /* "Myvi" when a vehicle is picked, otherwise "2 units" */
  const units = (s, n) => `${n} ${(s.unit || "unit") + (n === 1 ? "" : "s")}`;
  const what = (s, c) => { const v = vehicle(); return v ? v.model : units(s, c.n); };

  /* live price + summary */
  const priceEl = q("[data-price]"), priceNote = q("[data-price-note]"), sumEl = q("[data-summary]"), unitEl = q("[data-unit-label]");
  function calc() {
    const s = service(), n = clamp(Number(sizing.value) || 1), v = vehicle();
    const base = s.sizePrices && v && s.sizePrices[v.size] != null ? s.sizePrices[v.size] : s.fromPrice;
    if (base == null) return { text: "", n };
    const add = chosenExtras().reduce((t, x) => t + (Number(x.price) || 0), 0);
    const total = (s.perUnit === false ? base : base * n) + add;
    return { text: "from " + money(total, currency), n, total };
  }
  function update() {
    const s = service(), c = calc();
    list.querySelectorAll(".svc-card").forEach((el) => el.classList.toggle("is-on", el.querySelector("input").checked));
    strip.querySelectorAll(".day").forEach((el) => el.classList.toggle("is-on", el.querySelector("input").checked));
    module.querySelectorAll(".win").forEach((el) => el.classList.toggle("is-on", el.querySelector("input").checked));
    const v = vehicle(), sn = q("[data-size-note]");
    if (sn) sn.innerHTML = v ? `${esc(v.model)}${v.sizeLabel ? ` · priced as <strong>${esc(v.sizeLabel)}</strong>` : ""}` : esc((veh && veh.hint) || "");
    if (unitEl) unitEl.textContent = (s.unit || cfg.sizingUnit || "unit") + (c.n === 1 ? "" : "s");
    if (priceEl) { priceEl.textContent = c.text ? "Estimate " + c.text : ""; priceEl.hidden = !c.text; }
    if (priceNote) priceNote.textContent = s.note || cfg.estimateNote || "";
    const date = form.querySelector("input[name=date]:checked"), win = form.querySelector("input[name=window]:checked");
    if (sumEl) sumEl.textContent = `${s.name} · ${what(s, c)} · ${date ? date.dataset.label : "—"}, ${win ? win.dataset.label.split(" (")[0].toLowerCase() : ""}`;
    const dur = q("[data-duration]"); if (dur) dur.textContent = s.duration ? s.duration : "";
    const inc = q("[data-includes]"); if (inc) inc.replaceChildren(...(s.includes || []).map((t) => { const li = document.createElement("li"); li.textContent = t; return li; }));
  }
  form.addEventListener("input", update);
  form.addEventListener("change", update);
  update();
  /* number whichever steps this skin shows */
  module.querySelectorAll(".step:not([hidden]) .step-title .n").forEach((el, i) => (el.textContent = i + 1));

  /* submit → reference → WhatsApp / email */
  let text = "", ref = "";
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!form.reportValidity()) return;
    const s = service(), c = calc(), d = new FormData(form), v = vehicle(), br = branch();
    const date = form.querySelector("input[name=date]:checked"), win = form.querySelector("input[name=window]:checked");
    ref = createReference(skin.refPrefix || "BK");
    text = formatLines(skin, {
      opener: cfg.opener, closer: cfg.closer,
      fields: [
        ["Service", s.name],
        ...(v ? [["Car", [v.make, v.model, v.year].filter(Boolean).join(" ")], ["Plate", v.plate]] : [[cfg.sizingField || "Units", units(s, c.n)]]),
        ["Add-ons", chosenExtras().map((x) => x.label).join(", ")],
        ["Branch", br ? br.name : ""],
        ["Preferred date", date ? date.dataset.label : ""],
        ["Time", win ? win.dataset.label : ""],
        ["Name", d.get("name")],
        ["Phone", d.get("phone")],
        [cfg.addressLabel || "Address / area", d.get("address")],
        ["Estimate shown", c.text],
      ],
      message: d.get("notes"),
    }, ref);
    q("[data-ready-summary]").textContent = `${s.name} · ${what(s, c)}${br ? " · " + br.name : ""}\n${date ? date.dataset.label : ""}, ${win ? win.dataset.label : ""}${c.text ? "\nEstimate " + c.text : ""}`;
    q("[data-reference]").textContent = ref;
    const wa = q("[data-whatsapp]"), mail = q("[data-email]");
    const waHref = whatsappLink((br && br.whatsapp) || (skin.contact && skin.contact.whatsapp), text);
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
