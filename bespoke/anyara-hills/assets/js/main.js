/* ============================================================
   Prototype 001 · Anyara Hills — behaviour
   Made by Kites

   Everything here degrades safely: if the CDN fails or JS is
   off, the page still renders all content, readable, at rest.
   Reveals are opt-in via the .r-on class on <html>.
   ============================================================ */

(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasGSAP = typeof window.gsap !== 'undefined';
  var hasST = hasGSAP && typeof window.ScrollTrigger !== 'undefined';
  var lenis = null;

  /* ---------- 1. line splitting ------------------------------
     Hand-rolled rather than SplitText, so there is no plugin
     licence question and no extra request. Wraps each visual
     line in a masked span. Re-runs on resize.               */

  function splitLines(el) {
    if (el.dataset.splitDone === '1') {
      el.innerHTML = el.dataset.splitSrc;
    } else {
      el.dataset.splitSrc = el.innerHTML;
      el.dataset.splitDone = '1';
    }

    var src = el.dataset.splitSrc;
    // wrap every word, keeping inline tags (the accent <em>) intact
    var tmp = document.createElement('div');
    tmp.innerHTML = src;

    var words = [];
    (function walk(node, tag) {
      Array.prototype.forEach.call(node.childNodes, function (n) {
        if (n.nodeType === 3) {
          n.textContent.split(/(\s+)/).forEach(function (t) {
            if (!t.trim()) return;
            words.push({ text: t, tag: tag });
          });
        } else if (n.nodeType === 1) {
          walk(n, n.tagName === 'EM' ? 'em' : tag);
        }
      });
    })(tmp, null);

    el.innerHTML = words.map(function (w) {
      var inner = w.tag === 'em' ? '<em class="accent">' + w.text + '</em>' : w.text;
      return '<span data-w>' + inner + '</span>';
    }).join(' ');

    // group words into lines by their offsetTop
    var spans = el.querySelectorAll('[data-w]');
    var lines = [];
    var last = null;
    Array.prototype.forEach.call(spans, function (s) {
      var top = Math.round(s.offsetTop);
      if (last === null || Math.abs(top - last) > 4) { lines.push([]); last = top; }
      lines[lines.length - 1].push(s.outerHTML);
    });

    el.innerHTML = lines.map(function (l) {
      return '<span class="line-mask"><span>' + l.join(' ') + '</span></span>';
    }).join('');
  }

  var splitTargets = document.querySelectorAll('[data-split]');

  function runSplits() {
    Array.prototype.forEach.call(splitTargets, function (el) { splitLines(el); });
  }

  /* ---------- 2. reveals -------------------------------------
     One IntersectionObserver for everything. Masked lines and
     fade-ups share the same trigger point.                   */

  var revealIO = null;

  function observeAll() {
    if (!revealIO) return;
    document.querySelectorAll('.reveal:not(.is-in)').forEach(function (el) {
      revealIO.observe(el);
    });
    // stagger the masked lines within each headline
    document.querySelectorAll('[data-split]').forEach(function (h) {
      h.querySelectorAll('.line-mask:not(.is-in)').forEach(function (m, i) {
        m.querySelector('span').style.transitionDelay = (i * 0.075) + 's';
        revealIO.observe(m);
      });
    });
  }

  function initReveals() {
    /* The hero is the first thing anyone sees and its CTA row sits
       inside the observer's bottom margin, so it would never fire
       until the reader scrolled. Reveal the hero outright the moment
       the preloader hands over; observe everything below it. */
    document.querySelectorAll('.hero .reveal, .hero .line-mask').forEach(function (el) {
      el.classList.add('is-in');
    });

    revealIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-in');
        revealIO.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.1 });

    observeAll();
  }

  /* A re-split rebuilds the masked lines, which would blank a
     headline the reader has already seen. So: re-split, then
     immediately restore anything at or above the fold, and hand
     the rest back to the observer. */
  function resplit() {
    runSplits();
    document.querySelectorAll('.line-mask').forEach(function (m) {
      if (m.getBoundingClientRect().top < window.innerHeight * 0.9) m.classList.add('is-in');
    });
    observeAll();
    if (hasST) window.ScrollTrigger.refresh();
  }

  /* ---------- 3. smooth scroll -------------------------------
     Lenis, with its RAF driven by GSAP's ticker so scrubbed
     ScrollTriggers stay in sync with the smoothed position.  */

  function initLenis() {
    if (reduce || typeof window.Lenis === 'undefined') return;

    lenis = new window.Lenis({
      duration: 1.1,
      easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); },
      smoothWheel: true,
      touchMultiplier: 1.6
    });

    if (hasST) {
      lenis.on('scroll', window.ScrollTrigger.update);
      window.gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
      window.gsap.ticker.lagSmoothing(0);
    } else {
      requestAnimationFrame(function raf(t) { lenis.raf(t); requestAnimationFrame(raf); });
    }
  }

  /* ---------- 4. scrubbed parallax ---------------------------
     Note: no pinning anywhere. The depth comes from scrubbed
     transforms on elements that scroll normally, with graded
     smoothing — heavier layers get more smoothing. This is why
     it stays smooth on a phone.                              */

  function initParallax() {
    if (!hasST || reduce) return;
    var gsap = window.gsap;
    gsap.registerPlugin(window.ScrollTrigger);

    // hero ridgelines — nearest layer moves least
    var depth = { 4: -90, 3: -60, 2: -34, 1: -14 };
    Object.keys(depth).forEach(function (k) {
      var layer = document.querySelector('[data-ridge="' + k + '"]');
      if (!layer) return;
      gsap.to(layer, {
        y: depth[k],
        ease: 'none',
        scrollTrigger: {
          trigger: '.hero',
          start: 'top top',
          end: 'bottom top',
          scrub: k >= 3 ? 0.5 : 0.25
        }
      });
    });

    // drifting mist bands
    document.querySelectorAll('[data-mist]').forEach(function (m, i) {
      gsap.to(m, {
        y: -40 - i * 18, opacity: 0.55, ease: 'none',
        scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
      });
    });

    // contour band — slow counter-scroll
    var band = document.querySelector('[data-band]');
    if (band) {
      gsap.fromTo(band, { y: '-6%' }, {
        y: '6%', ease: 'none',
        scrollTrigger: { trigger: '#land', start: 'top bottom', end: 'bottom top', scrub: 0.5 }
      });
    }
  }

  /* ---------- 5. header, progress bar, section rail --------- */

  function initChrome() {
    var head = document.querySelector('[data-head]');
    var bar = document.querySelector('[data-progress]');
    var links = document.querySelectorAll('[data-rail-link]');

    function onScroll() {
      var y = window.scrollY || document.documentElement.scrollTop;
      if (head) head.classList.toggle('is-stuck', y > 40);

      if (bar) {
        var max = document.documentElement.scrollHeight - window.innerHeight;
        bar.style.width = (max > 0 ? (y / max) * 100 : 0) + '%';
      }

      // mark the section nearest the top third of the viewport
      var mark = window.innerHeight * 0.34, best = null, bestD = Infinity;
      links.forEach(function (a) {
        var id = a.getAttribute('href').replace('#', '');
        var t = document.getElementById(id);
        if (!t) return;
        var d = Math.abs(t.getBoundingClientRect().top - mark);
        if (d < bestD) { bestD = d; best = a; }
      });
      links.forEach(function (a) { a.classList.toggle('is-on', a === best); });
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    // anchor links go through Lenis so the easing matches the page
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (ev) {
        var id = a.getAttribute('href');
        if (id === '#' || id.length < 2) return;
        var t = document.querySelector(id);
        if (!t) return;
        ev.preventDefault();
        if (lenis) lenis.scrollTo(t, { offset: -10, duration: 1.2 });
        else t.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
      });
    });
  }

  /* ---------- 6. preloader -----------------------------------
     Locks scroll, counts real progress, then hands off to the
     hero. The load is the opening shot, not a spinner.       */

  function initPreloader(done) {
    var el = document.getElementById('preloader');
    if (!el) { done(); return; }

    var pct = el.querySelector('[data-pre-pct]');
    var bar = el.querySelector('[data-pre-bar]');
    var l = el.querySelector('[data-pre-l]');
    var r = el.querySelector('[data-pre-r]');

    document.documentElement.classList.add('lenis-stopped');

    var n = 0;
    var tick = setInterval(function () {
      n = Math.min(99, n + Math.random() * 11);
      if (pct) pct.textContent = String(Math.floor(n)).padStart(2, '0');
      if (bar) bar.style.width = n + '%';
    }, 90);

    function finish() {
      clearInterval(tick);
      if (pct) pct.textContent = '100';
      if (bar) bar.style.width = '100%';

      setTimeout(function () {
        if (hasGSAP && !reduce) {
          window.gsap.to([l, r], {
            y: function (i) { return i === 0 ? '-110%' : '110%'; },
            duration: 0.7, ease: 'power3.inOut', stagger: 0.04
          });
        }
        setTimeout(function () {
          el.classList.add('is-done');
          document.documentElement.classList.remove('lenis-stopped');
          if (lenis) lenis.start();
          done();
          setTimeout(function () { el.remove(); }, 1300);
        }, reduce ? 60 : 520);
      }, 260);
    }

    if (document.readyState === 'complete') setTimeout(finish, 650);
    else window.addEventListener('load', function () { setTimeout(finish, 450); });
    // hard ceiling — never hold the page hostage to a slow asset
    setTimeout(finish, 4200);
  }

  /* ---------- 7. masterplan: drag to pan, buttons to zoom --- */

  function initPlan() {
    var stage = document.querySelector('[data-plan]');
    if (!stage) return;
    var g = stage.querySelector('[data-plan-g]');
    if (!g) return;

    var x = 0, y = 0, k = 1, dragging = false, sx = 0, sy = 0;

    function apply() {
      // keep the drawing from being dragged entirely off screen
      var lim = 260 * k;
      x = Math.max(-lim, Math.min(lim, x));
      y = Math.max(-lim * 0.55, Math.min(lim * 0.55, y));
      g.setAttribute('transform', 'translate(' + x + ' ' + y + ') scale(' + k + ')');
      g.style.transformOrigin = 'center';
    }

    stage.addEventListener('pointerdown', function (e) {
      dragging = true; sx = e.clientX - x; sy = e.clientY - y;
      stage.classList.add('is-drag');
      stage.setPointerCapture(e.pointerId);
    });
    stage.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      x = e.clientX - sx; y = e.clientY - sy; apply();
    });
    ['pointerup', 'pointercancel'].forEach(function (ev) {
      stage.addEventListener(ev, function () { dragging = false; stage.classList.remove('is-drag'); });
    });

    stage.querySelectorAll('[data-zoom]').forEach(function (b) {
      b.addEventListener('click', function () {
        var mode = b.dataset.zoom;
        if (mode === 'in') k = Math.min(2.4, k * 1.25);
        if (mode === 'out') k = Math.max(1, k / 1.25);
        if (mode === 'reset') { k = 1; x = 0; y = 0; }
        apply();
      });
    });

    // keyboard pan, so the component is not mouse-only
    stage.tabIndex = 0;
    stage.addEventListener('keydown', function (e) {
      var step = 40;
      if (e.key === 'ArrowLeft') x += step;
      else if (e.key === 'ArrowRight') x -= step;
      else if (e.key === 'ArrowUp') y += step;
      else if (e.key === 'ArrowDown') y -= step;
      else return;
      e.preventDefault(); apply();
    });

    apply();
  }

  /* ---------- 8. two-step form + UTM capture ---------------- */

  function initForm() {
    var form = document.querySelector('[data-form]');
    if (!form) return;

    var steps = form.querySelectorAll('[data-step]');
    var pips = form.querySelectorAll('[data-pip]');

    function show(n) {
      steps.forEach(function (s) { s.hidden = s.dataset.step !== String(n); });
      pips.forEach(function (p) { p.classList.toggle('is-on', Number(p.dataset.pip) <= n); });
      if (lenis) lenis.scrollTo(form, { offset: -140, duration: 0.8 });
    }

    // populate attribution from the URL — in production this is
    // the difference between knowing and guessing the channel
    var params = new URLSearchParams(location.search);
    var box = form.querySelector('[data-utm]');
    if (box) {
      box.querySelectorAll('input[name^="utm_"]').forEach(function (i) {
        i.value = params.get(i.name) || '';
      });
      var pu = box.querySelector('[name="page_url"]');
      if (pu) pu.value = location.href;
    }
    var readout = form.querySelector('[data-utm-readout]');
    if (readout) {
      var src = params.get('utm_source');
      readout.textContent = src
        ? 'Attribution captured — source: ' + src + (params.get('utm_campaign') ? ' · campaign: ' + params.get('utm_campaign') : '')
        : 'Attribution fields present and empty (no UTMs on this URL). Try ?utm_source=meta&utm_campaign=phase1';
    }

    form.querySelector('[data-next]').addEventListener('click', function () {
      var s1 = form.querySelector('[data-step="1"]');
      var bad = null;
      s1.querySelectorAll('[required]').forEach(function (f) {
        var ok = f.type === 'checkbox' ? f.checked : f.value.trim() !== '';
        f.style.borderBottomColor = ok ? '' : 'var(--err)';
        if (!ok && !bad) bad = f;
      });
      if (bad) { bad.focus(); return; }
      show(2);
    });

    form.querySelector('[data-back]').addEventListener('click', function () { show(1); });
    form.querySelector('[data-reset]').addEventListener('click', function () {
      form.reset(); show(1);
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      // prototype only — production posts to the lead router
      show(3);
    });
  }

  /* ---------- 9. WhatsApp deep links ------------------------ */

  function initWhatsApp() {
    var params = new URLSearchParams(location.search);
    var src = params.get('utm_source') || 'site';
    var msg = 'Hi, I am enquiring about Anyara Hills — the one-acre freehold lots. [' + src + ']';
    var href = 'https://wa.me/60196606511?text=' + encodeURIComponent(msg);
    var wa = document.querySelector('[data-wa]');
    if (wa) wa.href = href;
  }

  /* ---------- 10. annotation mode (for presenting) ---------- */

  function initNotes() {
    var btn = document.querySelector('[data-notes]');
    if (!btn) return;
    btn.addEventListener('click', function () {
      var on = document.body.classList.toggle('notes-on');
      btn.setAttribute('aria-pressed', String(on));
    });
    // shortcut for presenting: press A
    document.addEventListener('keydown', function (e) {
      if (e.key === 'a' && !/input|textarea|select/i.test(document.activeElement.tagName)) {
        btn.click();
      }
    });
  }

  /* ---------- 11. live weight readout ----------------------- */

  function initPerf() {
    var el = document.querySelector('[data-perf]');
    if (!el) return;
    window.addEventListener('load', function () {
      setTimeout(function () {
        var res = performance.getEntriesByType('resource');
        var nav = performance.getEntriesByType('navigation')[0] || {};
        var kb = res.reduce(function (a, r) { return a + (r.transferSize || 0); }, 0) / 1024;
        kb += (nav.transferSize || 0) / 1024;
        var load = Math.round(nav.loadEventEnd || 0);
        el.textContent = Math.round(kb) + ' KB · ' + (load / 1000).toFixed(2) + ' s · '
          + (res.length + 1) + ' requests';
      }, 400);
    });
  }

  /* ---------- boot ------------------------------------------ */

  function boot() {
    // opt in to the reveal styles before first paint, so nothing
    // flashes from visible to hidden once the observer starts
    if (!reduce) document.documentElement.classList.add('r-on');

    runSplits();
    // fonts swap after first layout, which changes where lines break
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(resplit);
    }
    initLenis();
    initChrome();
    initPlan();
    initForm();
    initWhatsApp();
    initNotes();
    initPerf();

    initPreloader(function () {
      initReveals();
      initParallax();
    });

    var t;
    window.addEventListener('resize', function () {
      clearTimeout(t);
      t = setTimeout(resplit, 220);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
