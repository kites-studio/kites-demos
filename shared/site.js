import { initMotion } from "./motion.js";
import { createReference, estimate, formatBrief, money, whatsappLink, emailLink, validate } from "./enquiry.js";

/* ---------- navigation ---------- */
const toggle = document.querySelector(".menu-toggle"), nav = document.querySelector("#main-nav");
function closeMenu(focus = false) {
  toggle?.setAttribute("aria-expanded", "false");
  toggle?.setAttribute("aria-label", "Open navigation");
  nav?.classList.remove("open");
  if (focus) toggle?.focus();
}
toggle?.addEventListener("click", () => {
  const open = toggle.getAttribute("aria-expanded") !== "true";
  toggle.setAttribute("aria-expanded", String(open));
  toggle.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
  nav.classList.toggle("open", open);
});
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && toggle?.getAttribute("aria-expanded") === "true") closeMenu(true); });
nav?.addEventListener("click", (e) => { if (e.target.closest("a")) closeMenu(); });
matchMedia("(min-width:761px)").addEventListener("change", () => closeMenu());
document.querySelectorAll("#main-nav a").forEach((a) => {
  if (a.getAttribute("href")?.split("?")[0] === location.pathname.split("/").pop()) a.setAttribute("aria-current", "page");
});

/* ---------- everything below needs the skin ---------- */
function onSkin(skin) {
  initMotion();
  /* size the rotating headline word to its longest entry (skin.hero.kinWidth overrides, e.g. "4.4em") */
  document.querySelectorAll(".kin-cycle").forEach((em) => {
    if (skin.hero && skin.hero.kinWidth) { em.style.setProperty("--kin-width", skin.hero.kinWidth); return; }
    const probe = document.createElement("span");
    probe.style.cssText = "position:absolute;visibility:hidden;white-space:nowrap;font:inherit";
    em.parentElement.appendChild(probe);
    let max = 0;
    em.querySelectorAll("span").forEach((w) => { probe.textContent = w.textContent; max = Math.max(max, probe.getBoundingClientRect().width); });
    probe.remove();
    if (max) em.style.setProperty("--kin-width", Math.ceil(max + 2) + "px");
  });

  /* T1 brief module: product → qty → deadline → details → estimate → WhatsApp / email */
  for (const module of document.querySelectorAll("[data-brief]")) {
    const form = module.querySelector("form"), ready = module.querySelector(".brief-ready"), state = module.querySelector(".draft-state");
    const select = form.elements.product, products = skin.products || [];
    select.replaceChildren(...products.map((p) => { const o = document.createElement("option"); o.value = p.id; o.textContent = p.name; return o; }));
    let draft = null, ref = "";
    const product = () => products.find((p) => p.id === select.value) || products[0];
    const read = () => {
      const d = new FormData(form), p = product(), est = estimate(p, d.get("quantity"));
      return {
        productLabel: p ? p.name : "", quantity: d.get("quantity") ? `${d.get("quantity")}${p && p.unit ? " " + p.unit : ""}` : "", deadline: d.get("deadline"), message: d.get("details"),
        estimate: est ? `from ${money(est.total, skin.currency)}` : "",
        line: p && p.unit && p.unit !== "pcs" ? `${p.name} · ${d.get("quantity") || "—"} ${p.unit}` : `${d.get("quantity") || "—"} × ${p ? p.name : ""}`,
      };
    };
    const summarise = () => {
      const d = read(), p = product();
      module.querySelector("[data-summary]").textContent = d.line;
      const estEl = module.querySelector("[data-estimate]");
      if (estEl) {
        if (d.estimate) { estEl.textContent = "Estimate " + d.estimate; estEl.hidden = false; }
        else { estEl.hidden = true; }
      }
      const noteEl = module.querySelector("[data-estimate-note]");
      if (noteEl) noteEl.textContent = p && p.note ? p.note : (skin.brief && skin.brief.note) || "Final price and timing confirmed by the team.";
    };
    form.addEventListener("input", summarise);
    select.addEventListener("change", summarise);
    summarise();
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!form.reportValidity()) return;
      draft = read();
      ref = createReference(skin.refPrefix || "KQ");
      const text = formatBrief(skin, draft, ref);
      module.querySelector("[data-ready-summary]").textContent = `${draft.line}\n${draft.deadline ? "Needed by " + draft.deadline : "Timing to discuss"}${draft.estimate ? "\nEstimate " + draft.estimate : ""}`;
      module.querySelector("[data-reference]").textContent = ref;
      const wa = module.querySelector("[data-whatsapp]"), mail = module.querySelector("[data-email]");
      const waHref = whatsappLink(skin.contact && skin.contact.whatsapp, text);
      if (wa) { if (waHref) { wa.href = waHref; wa.hidden = false; } else wa.hidden = true; }
      const mailHref = emailLink(skin.contact && skin.contact.email, `Enquiry ${ref} — ${draft.productLabel}`, text);
      if (mail) { if (mailHref) { mail.href = mailHref; mail.hidden = false; } else mail.hidden = true; }
      form.hidden = true; ready.hidden = false; state.textContent = "Prepared"; ready.focus();
    });
    module.querySelector("[data-edit]")?.addEventListener("click", () => { ready.hidden = true; form.hidden = false; state.textContent = "Draft"; select.focus(); });
    module.querySelector("[data-copy]")?.addEventListener("click", async (e) => {
      if (!draft) return;
      try { await navigator.clipboard.writeText(formatBrief(skin, draft, ref)); e.target.textContent = "Copied ✓"; } catch { e.target.textContent = "Copy not available"; }
    });
  }

  /* Contact page form: name, phone/email, what, message → WhatsApp / email */
  const form = document.querySelector("#contact-form");
  if (form) {
    const what = form.elements.service, items = skin.products || skin.services || skin.programmes || [];
    if (what && items.length) {
      what.replaceChildren(...items.map((p) => { const o = document.createElement("option"); o.value = p.id; o.textContent = p.name; return o; }));
      const pre = new URLSearchParams(location.search).get("service");
      if (pre && items.some((p) => p.id === pre)) what.value = pre;
    }
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const raw = Object.fromEntries(new FormData(form));
      const parsed = validate(raw);
      form.querySelectorAll("[data-error]").forEach((el) => (el.textContent = ""));
      form.querySelectorAll("[aria-invalid]").forEach((el) => el.removeAttribute("aria-invalid"));
      const feedback = document.querySelector("#form-feedback");
      feedback.hidden = true;
      if (!parsed.ok) {
        for (const [key, msg] of Object.entries(parsed.errors)) {
          const el = form.elements[key]; if (!el) continue;
          el.setAttribute("aria-invalid", "true");
          let err = form.querySelector(`[data-error="${key}"]`);
          if (!err) { err = document.createElement("small"); err.className = "field-error"; err.dataset.error = key; el.after(err); }
          err.textContent = msg;
        }
        const first = Object.keys(parsed.errors)[0];
        if (first === "companyFax") { feedback.textContent = "We could not verify this enquiry. Please contact us directly."; feedback.hidden = false; }
        else form.elements[first]?.focus();
        return;
      }
      const p = items.find((x) => x.id === (what && what.value));
      const ref = createReference(skin.refPrefix || "KQ");
      const text = formatBrief(skin, { ...parsed.data, productLabel: p ? p.name : "", quantity: raw.quantity, deadline: raw.deadline }, ref);
      feedback.replaceChildren();
      const intro = document.createElement("p");
      intro.textContent = `Your enquiry is ready (reference ${ref}). Send it on WhatsApp — it opens with everything filled in — or by email.`;
      feedback.append(intro);
      const waHref = whatsappLink(skin.contact && skin.contact.whatsapp, text);
      if (waHref) { const a = document.createElement("a"); a.className = "button whatsapp-button"; a.href = waHref; a.target = "_blank"; a.rel = "noopener"; a.innerHTML = 'Send on WhatsApp <span class="arrow">↗</span>'; feedback.append(a); }
      const mailHref = emailLink(skin.contact && skin.contact.email, `Enquiry ${ref}`, text);
      if (mailHref) { const a = document.createElement("a"); a.href = mailHref; a.textContent = "Or open an email ↗"; feedback.append(a); }
      feedback.hidden = false; feedback.focus();
    });
  }

  /* Any [data-wa] link: prefilled "hello" WhatsApp with the page context */
  document.querySelectorAll("[data-wa]").forEach((a) => {
    const text = a.dataset.wa || `Hello ${skin.business.name}, I found your website and I'd like to ask about ${document.title.split("|")[0].trim()}.`;
    const href = whatsappLink(skin.contact && skin.contact.whatsapp, text);
    if (href) { a.href = href; a.target = "_blank"; a.rel = "noopener"; } else a.hidden = true;
  });
}

/* skin.js may finish before this module runs (cached JSON), so handle both orders */
if (window.SKIN) onSkin(window.SKIN);
else document.addEventListener("skin:ready", (ev) => onSkin(ev.detail), { once: true });
