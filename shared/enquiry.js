/** Kites demos — enquiry helpers shared by every template.
 * Reference numbers, brief text, estimate lines, and the WhatsApp / email handoffs.
 * Everything reads from the loaded skin (window.SKIN); nothing here is business-specific.
 */
export function createReference(prefix = "KQ") {
  const d = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const rnd = (crypto.randomUUID ? crypto.randomUUID() : String(Math.random())).replace(/-/g, "").slice(0, 4).toUpperCase();
  return `${prefix}-${d}-${rnd}`;
}

export function money(n, currency = "RM") {
  if (n == null || isNaN(n)) return "";
  return currency + " " + Number(n).toLocaleString("en-MY", { maximumFractionDigits: 0 });
}

/** Estimate for a T1 line: product.fromPrice × qty, respecting a minimum quantity if given. */
export function estimate(product, qty) {
  if (!product || product.fromPrice == null) return null;
  const q = Math.max(Number(qty) || 0, product.minQty || 1);
  const unit = product.unit || "pc";
  const total = product.fromPrice * (product.perUnit === false ? 1 : q);
  return { total, unit, qty: q, from: true };
}

/** Plain-text brief used for WhatsApp, email and copy. Lines with empty values are dropped. */
export function formatBrief(skin, d, reference) {
  const b = skin.business || {};
  const lines = [
    `Hello ${b.name || ""},`,
    skin.brief && skin.brief.opener ? skin.brief.opener : "I'd like a quote for the following.",
    "",
    reference ? `Reference: ${reference}` : "",
    d.name ? `Name: ${d.name}` : "",
    d.phone ? `Phone: ${d.phone}` : "",
    d.email ? `Email: ${d.email}` : "",
    d.productLabel ? `Item: ${d.productLabel}` : "",
    d.quantity ? `Quantity: ${d.quantity}` : "",
    d.deadline ? `Needed by: ${d.deadline}` : "",
    d.estimate ? `Estimate shown: ${d.estimate}` : "",
    ...(d.extra || []),
    "",
    d.message || "",
    "",
    skin.brief && skin.brief.closer ? skin.brief.closer : "Please confirm the details, price and timing. Thank you.",
  ];
  return lines.filter((x, i, a) => x !== "" || a[i - 1] !== "").join("\n").trim();
}

/** wa.me link. Number may be "60167003007" or a local "016-700 3007" (leading 0 → country code, default 60 = Malaysia). */
export function whatsappLink(number, text, country = "60") {
  let digits = String(number || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("0")) digits = country + digits.slice(1);
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

export function emailLink(recipient, subject, text) {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient || "")) return "";
  return `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`;
}

/** Simple validation shared by contact forms. Honeypot field: companyFax. */
export function validate(input) {
  const data = {
    name: String(input.name || "").trim(),
    phone: String(input.phone || "").trim(),
    email: String(input.email || "").trim(),
    message: String(input.message || "").trim(),
    companyFax: String(input.companyFax || ""),
  };
  const errors = {};
  if (data.name.length < 2) errors.name = "Please enter your name.";
  if (!data.phone && !data.email) errors.phone = "A phone number or email so we can reply.";
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.email = "That email doesn't look right.";
  if (data.phone && data.phone.replace(/\D/g, "").length < 9) errors.phone = "That phone number looks short.";
  if (data.companyFax) errors.companyFax = "We could not verify this enquiry.";
  return { ok: Object.keys(errors).length === 0, data, errors };
}
