/** T3 Register / Trial — registration module.
 * programme (cards) → level (chips) → subjects (multi) → branch → mode + preferred days → student + parent → WhatsApp.
 * Reads skin.programmes[], skin.branches[], skin.register; nothing here is business-specific.
 * Markup contract: one [data-register] with a <form> and a .reg-ready block (see t3-register/register.html).
 */
import { createReference, money, whatsappLink, emailLink, formatLines } from "./enquiry.js";

const chip = (name, value, label, type = "radio", checked = false, sub = "") =>
  `<label class="chip"><input type="${type}" name="${name}" value="${value}" ${checked ? "checked" : ""}><span>${label}${sub ? `<small>${sub}</small>` : ""}</span></label>`;

function init(skin) {
  const module = document.querySelector("[data-register]");
  if (!module) return;
  const form = module.querySelector("form"), ready = module.querySelector(".reg-ready");
  const programmes = skin.programmes || [], branches = skin.branches || [], cfg = skin.register || {};
  const currency = skin.currency || "RM";
  const q = (sel) => module.querySelector(sel);
  const pre = new URLSearchParams(location.search).get("programme") || (location.hash || "").replace("#", "");

  /* 1 · programme cards */
  const plist = q("[data-programme-list]");
  plist.replaceChildren(...programmes.map((p, i) => {
    const l = document.createElement("label");
    l.className = "prog-card";
    l.innerHTML = `<input type="radio" name="programme" value="${p.id}" ${p.id === pre || (!programmes.some((x) => x.id === pre) && i === 0) ? "checked" : ""}>
      <span class="prog-body"><span class="prog-name">${p.name}</span><span class="prog-blurb">${p.blurb || ""}</span>
      <span class="prog-fee">${p.fromPrice != null ? "from " + money(p.fromPrice, currency) + (p.feeUnit ? " " + p.feeUnit : "") : ""}</span></span><span class="prog-check">✓</span>`;
    return l;
  }));
  const programme = () => programmes.find((p) => p.id === form.elements.programme.value) || programmes[0];

  /* 2 · level + subjects depend on programme */
  const levels = q("[data-level-list]"), subjects = q("[data-subject-list]"), subjectStep = q("[data-subject-step]");
  function renderDependents() {
    const p = programme();
    levels.innerHTML = (p.levels || []).map((lv, i) => chip("level", lv, lv, "radio", i === 0)).join("");
    if (subjects) {
      const subs = p.subjects || [];
      subjects.innerHTML = subs.map((s) => chip("subjects", s, s, "checkbox")).join("");
      if (subjectStep) subjectStep.hidden = !subs.length;
    }
  }
  renderDependents();

  /* 3 · branch, mode, days */
  const blist = q("[data-branch-list]");
  if (blist) blist.innerHTML = branches.map((b, i) => chip("branch", b.id, b.name, "radio", i === 0, b.area || "")).join("");
  const modes = q("[data-mode-list]");
  if (modes) modes.innerHTML = (cfg.modes || [{ id: "centre", label: "At the centre" }, { id: "online", label: "Online" }]).map((m, i) => chip("mode", m.id, m.label, "radio", i === 0, m.sub || "")).join("");
  const days = q("[data-day-list]");
  if (days) days.innerHTML = (cfg.days || ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]).map((d) => chip("days", d, d, "checkbox")).join("");

  /* live summary */
  const sumEl = q("[data-summary]"), feeEl = q("[data-fee]");
  const picked = (name) => [...form.querySelectorAll(`input[name=${name}]:checked`)].map((i) => i.value);
  function update() {
    module.querySelectorAll(".prog-card").forEach((el) => el.classList.toggle("is-on", el.querySelector("input").checked));
    module.querySelectorAll(".chip").forEach((el) => el.classList.toggle("is-on", el.querySelector("input").checked));
    const p = programme(), subs = picked("subjects"), lv = picked("level")[0] || "";
    if (sumEl) sumEl.textContent = [p.name, lv, subs.length ? subs.length + (subs.length === 1 ? " subject" : " subjects") : ""].filter(Boolean).join(" · ");
    if (feeEl) {
      const n = Math.max(subs.length, 1);
      const perSubject = p.feePerSubject !== false;
      feeEl.textContent = p.fromPrice != null ? `from ${money(perSubject ? p.fromPrice * n : p.fromPrice, currency)}${p.feeUnit ? " " + p.feeUnit.replace(/^per subject\s*/i, "") : ""}` : "";
      feeEl.hidden = !feeEl.textContent;
    }
  }
  form.addEventListener("change", (e) => { if (e.target.name === "programme") renderDependents(); update(); });
  form.addEventListener("input", update);
  update();

  /* submit */
  let text = "", ref = "";
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!form.reportValidity()) return;
    const p = programme(), d = new FormData(form);
    const branch = branches.find((b) => b.id === d.get("branch"));
    const mode = (cfg.modes || []).find((m) => m.id === d.get("mode"));
    ref = createReference(skin.refPrefix || "RG");
    text = formatLines(skin, {
      opener: cfg.opener, closer: cfg.closer,
      fields: [
        ["Programme", p.name],
        ["Level", d.get("level")],
        ["Subjects", picked("subjects").join(", ")],
        ["Branch", branch ? branch.name : d.get("branch")],
        ["Mode", mode ? mode.label : d.get("mode")],
        ["Preferred days", picked("days").join(", ")],
        [cfg.studentField || "Student", d.get("student")],
        [cfg.parentField || "Parent / guardian", d.get("parent")],
        ["WhatsApp", d.get("phone")],
        ["Fee shown", feeEl && !feeEl.hidden ? feeEl.textContent : ""],
        [cfg.intakeField || "Intake", cfg.intakeLine || ""],
      ],
      message: d.get("notes"),
    }, ref);
    q("[data-ready-summary]").textContent = `${p.name} · ${d.get("level") || ""}\n${branch ? branch.name : ""}${mode ? " · " + mode.label : ""}${picked("days").length ? "\n" + picked("days").join(", ") : ""}`;
    q("[data-reference]").textContent = ref;
    const wa = q("[data-whatsapp]"), mail = q("[data-email]");
    const waTo = (branch && branch.whatsapp) || (skin.contact && skin.contact.whatsapp);
    const waHref = whatsappLink(waTo, text);
    if (wa) { if (waHref) { wa.href = waHref; wa.hidden = false; } else wa.hidden = true; }
    const mailHref = emailLink(skin.contact && skin.contact.email, `Registration ${ref} — ${p.name}`, text);
    if (mail) { if (mailHref) { mail.href = mailHref; mail.hidden = false; } else mail.hidden = true; }
    form.hidden = true; ready.hidden = false; ready.focus();
    ready.scrollIntoView({ block: "start", behavior: "smooth" });
  });
  q("[data-edit]")?.addEventListener("click", () => { ready.hidden = true; form.hidden = false; form.elements.programme[0].focus(); });
  q("[data-copy]")?.addEventListener("click", async (e) => {
    try { await navigator.clipboard.writeText(text); e.target.textContent = "Copied ✓"; } catch { e.target.textContent = "Copy not available"; }
  });
}

if (window.SKIN) init(window.SKIN);
else document.addEventListener("skin:ready", (ev) => init(ev.detail), { once: true });
