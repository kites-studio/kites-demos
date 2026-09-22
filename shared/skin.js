/** Kites demos — skin loader.
 * A template page is plain HTML with slots. This script reads ?skin=<slug> (or the value saved
 * for this tab), fetches skins/<slug>.json, and fills the slots. No build step.
 *
 *   data-skin="business.name"            → textContent (dot path into the skin)
 *   data-skin-html="hero.title"          → innerHTML (skin strings may contain <br> and <em>)
 *   data-skin-attr="href:contact.mapUrl" → attribute (comma-separate several: "src:hero.image,alt:hero.alt")
 *                                          src/poster values without a scheme are resolved from skins/ (e.g. "printngo/hero.webp");
 *                                          braces interpolate: data-skin-attr="href:contact.html?service={id}"
 *   data-skin-if="proof.reviews"         → element removed when the value is empty/false ("!path" inverts)
 *   <template data-skin-list="services"> → cloned once per item; inside, paths are relative
 *                                          to the item ("name", "fromPrice"), "." for the item itself, or absolute ("$.business.name")
 * Colours: skin.colors.* become CSS custom properties on :root (--navy, --blue, ...).
 * Links between template pages keep the ?skin= parameter automatically.
 */
(function () {
  const params = new URLSearchParams(location.search);
  let slug = params.get("skin");
  try {
    if (slug) sessionStorage.setItem("kites-skin", slug);
    else slug = sessionStorage.getItem("kites-skin");
  } catch {}
  if (!slug) slug = document.documentElement.dataset.defaultSkin || "printngo";
  const base = document.documentElement.dataset.skinBase || "../skins/";

  const get = (obj, path) =>
    path.split(".").reduce((o, k) => (o == null ? undefined : o[k]), obj);

  const resolve = (item, skin, path) => (path === "." ? item : path.startsWith("$.") ? get(skin, path.slice(2)) : get(item, path));
  const isUrl = (v) => /^(https?:)?\/\/|^data:|^\.{0,2}\//.test(v);
  const asset = (v) => (typeof v === "string" && v && !isUrl(v) ? base + v : v);

  function fill(root, ctx, skin) {
    // one "done" marker per directive, so an element can carry several (e.g. data-skin-if + data-skin-attr)
    const each = (sel, fn) => root.querySelectorAll(`${sel}:not([${sel.slice(1, -1)}-done])`).forEach((el) => { fn(el); el.setAttribute(sel.slice(1, -1) + "-done", ""); });
    each("[data-skin]", (el) => {
      const v = resolve(ctx, skin, el.dataset.skin);
      if (v != null && typeof v !== "object") el.textContent = v;
    });
    each("[data-skin-html]", (el) => {
      const v = resolve(ctx, skin, el.dataset.skinHtml);
      if (v != null && typeof v !== "object") el.innerHTML = v;
    });
    each("[data-skin-attr]", (el) => {
      el.dataset.skinAttr.split(",").forEach((pair) => {
        const i = pair.indexOf(":");
        const attr = pair.slice(0, i).trim(), path = pair.slice(i + 1).trim();
        let v = path.includes("{")
          ? path.replace(/\{([^}]+)\}/g, (_, p) => { const r = resolve(ctx, skin, p); return r == null ? "" : r; })
          : resolve(ctx, skin, path);
        if (attr === "src" || attr === "poster") v = asset(v);
        if (v != null && v !== "") el.setAttribute(attr, v);
        else if (attr === "href" || attr === "src") el.removeAttribute(attr);
      });
    });
    each("[data-skin-if]", (el) => {
      let path = el.dataset.skinIf, negate = false;
      if (path.startsWith("!")) { negate = true; path = path.slice(1); }
      let v = resolve(ctx, skin, path);
      const truthy = !!v && !(Array.isArray(v) && !v.length);
      if (truthy === negate) el.remove();
    });
  }

  function lists(skin) {
    document.querySelectorAll("template[data-skin-list]").forEach((tpl) => {
      const items = get(skin, tpl.dataset.skinList) || [];
      const frag = document.createDocumentFragment();
      items.forEach((item, i) => {
        const node = tpl.content.cloneNode(true);
        node.querySelectorAll("[data-skin-index]").forEach((el) => (el.textContent = String(i + 1).padStart(2, "0")));
        fill(node, item, skin);
        frag.appendChild(node);
      });
      tpl.replaceWith(frag);
    });
  }

  function colors(skin) {
    const c = skin.colors || {};
    const root = document.documentElement.style;
    for (const [k, v] of Object.entries(c)) root.setProperty("--" + k.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase()), v);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta && c.navy) meta.setAttribute("content", c.navy);
  }

  function keepSkinInLinks() {
    document.querySelectorAll('a[href$=".html"], a[href*=".html#"], a[href*=".html?"]').forEach((a) => {
      const href = a.getAttribute("href");
      if (/^(https?:)?\/\//.test(href) || href.includes("skin=")) return;
      const [pathPart, hash = ""] = href.split("#");
      const sep = pathPart.includes("?") ? "&" : "?";
      a.setAttribute("href", pathPart + sep + "skin=" + encodeURIComponent(slug) + (hash ? "#" + hash : ""));
    });
  }

  function ribbon(skin) {
    if (skin.concept === false) return;
    const r = document.createElement("a");
    r.className = "concept-ribbon";
    r.href = "https://madebykites.kitesprints-site.workers.dev/";
    r.target = "_blank";
    r.rel = "noopener";
    r.innerHTML = '<span class="dot"></span>Concept preview · <strong>Made by Kites</strong> · not live';
    document.body.appendChild(r);
  }

  fetch(base + slug + ".json", { cache: "no-cache" })
    .then((r) => {
      if (!r.ok) throw new Error("No skin: " + slug);
      return r.json();
    })
    .then((skin) => {
      window.SKIN = skin;
      colors(skin);
      lists(skin);
      fill(document, skin, skin);
      if (skin.business && skin.business.name) {
        document.title = document.title.replace("{business}", skin.business.name);
      }
      keepSkinInLinks();
      ribbon(skin);
      document.documentElement.classList.add("skin-ready");
      document.dispatchEvent(new CustomEvent("skin:ready", { detail: skin }));
    })
    .catch((err) => {
      console.error(err);
      document.documentElement.classList.add("skin-error");
      const p = document.createElement("p");
      p.className = "skin-missing";
      p.textContent = "This preview needs a skin: add ?skin=<slug> to the address.";
      document.body.prepend(p);
    });
})();
