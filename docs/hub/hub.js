// Academy hub — behavior. Plain ES2020, no modules, no backend. See /HUB_LLD.md.
(function () {
  'use strict';

  // ---------- prefs: language + theme ----------
  function prefs() {
    var langLabels = {
      lang: document.getElementById('lang-switch'),
      heBtn: document.getElementById('lang-btn-he'),
      enBtn: document.getElementById('lang-btn-en'),
    };
    var themeBtn = document.getElementById('theme-toggle');
    var themeIcon = document.getElementById('theme-icon');
    var sunPath = 'M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0-15v2m0 16v2M4.2 4.2l1.4 1.4m12.8 12.8 1.4 1.4M2 12h2m16 0h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4';
    var moonPath = 'M21 13.5A8.5 8.5 0 0 1 10.5 3 8.5 8.5 0 1 0 21 13.5Z';

    function applyLang(lang) {
      document.documentElement.lang = lang;
      document.documentElement.dir = lang === 'he' ? 'rtl' : 'ltr';
      document.documentElement.dataset.lang = lang;
      if (langLabels.heBtn) langLabels.heBtn.setAttribute('aria-pressed', String(lang === 'he'));
      if (langLabels.enBtn) langLabels.enBtn.setAttribute('aria-pressed', String(lang === 'en'));
      document.querySelectorAll('[data-label-he][data-label-en]').forEach(function (el) {
        el.setAttribute('aria-label', lang === 'he' ? el.dataset.labelHe : el.dataset.labelEn);
      });
      try { localStorage.setItem('academy:lang', lang); } catch (e) {}
      window.dispatchEvent(new CustomEvent('academy:langchange', { detail: { lang: lang } }));
    }
    function applyTheme(theme) {
      document.documentElement.dataset.theme = theme;
      if (themeIcon) themeIcon.setAttribute('d', theme === 'light' ? moonPath : sunPath);
      if (themeBtn) themeBtn.setAttribute('aria-label', theme === 'light' ? 'Dark mode' : 'Light mode');
      try { localStorage.setItem('academy:theme', theme); } catch (e) {}
    }

    applyLang(document.documentElement.lang);
    applyTheme(document.documentElement.dataset.theme);

    if (langLabels.heBtn) langLabels.heBtn.addEventListener('click', function () { applyLang('he'); });
    if (langLabels.enBtn) langLabels.enBtn.addEventListener('click', function () { applyLang('en'); });
    if (themeBtn) themeBtn.addEventListener('click', function () {
      applyTheme(document.documentElement.dataset.theme === 'light' ? 'dark' : 'light');
    });

    var topbar = document.querySelector('.topbar');
    if (topbar) {
      window.addEventListener('scroll', function () {
        topbar.classList.toggle('scrolled', window.scrollY > 8);
      }, { passive: true });
    }
  }

  // ---------- hero handle: draggable subject scrubber ----------
  function heroHandle() {
    var svg = document.getElementById('hero-handle-svg');
    if (!svg) return;
    var group = document.getElementById('hero-handle-group');
    var curvePath = svg.querySelector('.curve');
    var hairline = document.getElementById('hero-hairline');
    var statusDot = document.getElementById('hero-status-dot');
    var statusText = document.getElementById('hero-status-text');
    var openLink = document.getElementById('hero-open-link');
    var axis = document.getElementById('hero-axis');
    var VIEW_W = 520; // must match the SVG's viewBox width

    // Subjects sit on the curve at a target x (SVG units) rather than an arc-length fraction,
    // so their axis chips are evenly spaced and never collide at phone width.
    var SUBJECTS = [
      { key: 'math', x: 120, live: true, url: '/academy/subjects/math/', nameHe: 'מתמטיקה', nameEn: 'MATH', statusHe: 'פיילוט', statusEn: 'PILOT' },
      { key: 'physics', x: 270, live: true, url: '/academy/subjects/physics/', nameHe: 'פיזיקה', nameEn: 'PHYSICS', statusHe: 'פיילוט', statusEn: 'PILOT' },
      { key: 'chemistry', x: 420, live: false, url: null, nameHe: 'כימיה', nameEn: 'CHEM', statusHe: 'בקרוב', statusEn: 'SOON' },
    ];

    var totalLength = curvePath.getTotalLength();
    var samples = [];
    var SAMPLE_N = 240;
    for (var i = 0; i <= SAMPLE_N; i++) {
      var pt = curvePath.getPointAtLength((i / SAMPLE_N) * totalLength);
      samples.push({ x: pt.x, y: pt.y, frac: i / SAMPLE_N });
    }

    // The curve is monotonic in x, so "nearest sample to an x" is a binary search.
    function sampleAtX(svgX) {
      var lo = 0, hi = samples.length - 1;
      while (lo < hi) {
        var mid = (lo + hi) >> 1;
        if (samples[mid].x < svgX) lo = mid + 1; else hi = mid;
      }
      return samples[lo];
    }

    // Nodes and the handle are drawn at unit size and counter-scaled by k = viewBox / rendered
    // width, so they stay the same size on screen whether the panel is 300 or 440 px wide.
    var k = 1;
    function measureScale() {
      var w = svg.getBoundingClientRect().width;
      k = w > 0 ? Math.min(1.8, Math.max(1, VIEW_W / w)) : 1;
    }
    function placeGroup(el, x, y) {
      el.setAttribute('transform', 'translate(' + x + ',' + y + ') scale(' + k + ')');
    }

    SUBJECTS.forEach(function (s) {
      var pt = sampleAtX(s.x);
      s.x = pt.x; s.y = pt.y; s.frac = pt.frac;
      s.el = svg.querySelector('.node[data-subject="' + s.key + '"]');
      s.chip = axis ? axis.querySelector('.axis-chip[data-subject="' + s.key + '"]') : null;
      if (s.chip) s.chip.style.left = (pt.x / VIEW_W * 100) + '%';
    });

    function layoutNodes() {
      measureScale();
      SUBJECTS.forEach(function (s) { if (s.el) placeGroup(s.el, s.x, s.y); });
    }

    var activeIndex = 0;
    var current = samples[0];

    function setReadout(index, dragging) {
      var s = SUBJECTS[index];
      statusDot.style.setProperty('--readout-color', s.live ? 'var(--good)' : 'var(--muted)');
      statusText.innerHTML = '<span class="t-he">' + s.nameHe + ' · ' + s.statusHe + '</span>' +
                             '<span class="t-en">' + s.nameEn + ' · ' + s.statusEn + '</span>';
      if (s.live && !dragging) {
        openLink.href = s.url;
        openLink.hidden = false;
      } else {
        openLink.hidden = true;
      }
      SUBJECTS.forEach(function (o, i) {
        var on = i === index;
        if (o.chip) { o.chip.classList.toggle('is-active', on); o.chip.setAttribute('aria-pressed', String(on)); }
        if (o.el) o.el.classList.toggle('is-active', on);
      });
    }

    function placeAt(sample) {
      current = sample;
      placeGroup(group, sample.x, sample.y);
      hairline.setAttribute('x1', sample.x); hairline.setAttribute('x2', sample.x);
    }

    function nearestSubjectIndex(x) {
      var bestI = 0, best = Infinity;
      SUBJECTS.forEach(function (s, i) {
        var d = Math.abs(s.x - x);
        if (d < best) { best = d; bestI = i; }
      });
      return bestI;
    }

    function updateAriaValueText() {
      var s = SUBJECTS[activeIndex];
      var isHe = document.documentElement.lang === 'he';
      group.setAttribute('aria-valuenow', String(activeIndex));
      group.setAttribute('aria-valuetext', isHe ? s.nameHe + ' · ' + s.statusHe : s.nameEn + ' · ' + s.statusEn);
    }

    function snapTo(index, opts) {
      opts = opts || {};
      activeIndex = index;
      var s = SUBJECTS[index];
      group.style.transition = opts.animate === false ? 'none' : 'transform 260ms cubic-bezier(.2,.8,.2,1)';
      placeAt(sampleAtX(s.x));
      setReadout(index, false);
      updateAriaValueText();
      requestAnimationFrame(function () { group.style.transition = ''; });
    }

    // init
    layoutNodes();
    snapTo(0, { animate: false });

    if ('ResizeObserver' in window) {
      new ResizeObserver(function () {
        layoutNodes();
        group.style.transition = 'none';
        placeAt(current);
        requestAnimationFrame(function () { group.style.transition = ''; });
      }).observe(svg);
    }

    var dragging = false;
    function svgXFromClient(clientX) {
      var pt = svg.createSVGPoint();
      pt.x = clientX; pt.y = 0;
      var ctm = svg.getScreenCTM();
      if (!ctm) return null;
      return pt.matrixTransform(ctm.inverse()).x;
    }

    function onPointerDown(e) {
      if (e.button !== undefined && e.button !== 0) return;
      dragging = true;
      group.classList.add('dragging');
      svg.classList.add('dragging');
      try { svg.setPointerCapture(e.pointerId); } catch (err) {}
      onPointerMove(e);
    }
    function onPointerMove(e) {
      if (!dragging) return;
      var x = svgXFromClient(e.clientX);
      if (x === null) return;
      group.style.transition = 'none';
      var sample = sampleAtX(x);
      placeAt(sample);
      setReadout(nearestSubjectIndex(sample.x), true);
    }
    function onPointerUp(e) {
      if (!dragging) return;
      dragging = false;
      group.classList.remove('dragging');
      svg.classList.remove('dragging');
      var x = e.clientX !== undefined ? svgXFromClient(e.clientX) : null;
      snapTo(nearestSubjectIndex(x === null ? current.x : sampleAtX(x).x));
    }

    svg.addEventListener('pointerdown', onPointerDown);
    svg.addEventListener('pointermove', onPointerMove);
    svg.addEventListener('pointerup', onPointerUp);
    svg.addEventListener('pointercancel', onPointerUp);

    group.setAttribute('tabindex', '0');
    group.setAttribute('role', 'slider');
    group.setAttribute('aria-valuemin', '0');
    group.setAttribute('aria-valuemax', String(SUBJECTS.length - 1));
    group.addEventListener('keydown', function (e) {
      // Arrow keys follow the visual direction: the curve never mirrors, so in RTL "right"
      // still means "towards the next node on the right".
      var next = null;
      if (e.key === 'ArrowRight' || e.key === 'ArrowUp') next = activeIndex + 1;
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') next = activeIndex - 1;
      else if (e.key === 'Home') next = 0;
      else if (e.key === 'End') next = SUBJECTS.length - 1;
      else if (e.key === 'Enter' || e.key === ' ') {
        var s = SUBJECTS[activeIndex];
        if (s.live && s.url) window.location.href = s.url;
        e.preventDefault();
        return;
      }
      if (next === null) return;
      e.preventDefault();
      snapTo(Math.max(0, Math.min(SUBJECTS.length - 1, next)));
    });
    window.addEventListener('academy:langchange', updateAriaValueText);

    // click a node or its axis chip directly
    var touched = false;
    SUBJECTS.forEach(function (s, i) {
      if (s.el) {
        s.el.style.cursor = 'pointer';
        s.el.addEventListener('click', function () { snapTo(i); });
        s.el.addEventListener('dblclick', function () { if (s.live && s.url) window.location.href = s.url; });
      }
      if (s.chip) {
        s.chip.addEventListener('click', function () { touched = true; snapTo(i); group.focus({ preventScroll: true }); });
      }
    });

    // idle advertisement pass: one slow trip to the next node and back, once, then still
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    ['pointerdown', 'keydown'].forEach(function (ev) {
      svg.addEventListener(ev, function () { touched = true; }, { once: true });
      group.addEventListener(ev, function () { touched = true; }, { once: true });
    });
    setTimeout(function () {
      if (touched) return;
      group.style.transition = 'transform 1500ms cubic-bezier(.2,.8,.2,1)';
      placeAt(sampleAtX(SUBJECTS[1].x));
      setTimeout(function () {
        if (touched) return;
        group.style.transition = 'transform 1500ms cubic-bezier(.2,.8,.2,1)';
        placeAt(sampleAtX(SUBJECTS[0].x));
        setTimeout(function () { group.style.transition = ''; }, 1500);
      }, 1500);
    }, 2500);
  }

  // ---------- Riemann demo: f(x) = x^2 on [0,2], midpoint rule ----------
  function riemannDemo() {
    var svg = document.getElementById('riemann-svg');
    if (!svg) return;
    var rectsGroup = document.getElementById('riemann-rects');
    var slider = document.getElementById('riemann-n');
    var estimateEl = document.getElementById('riemann-estimate');
    var nReadout = document.getElementById('riemann-n-readout');

    var a = 0, b = 2;
    var W = 480, H = 240, PAD_L = 36, PAD_B = 28, PAD_T = 12, PAD_R = 12;
    var plotW = W - PAD_L - PAD_R, plotH = H - PAD_T - PAD_B;
    var fMax = f(b);

    function f(x) { return x * x; }
    function xToPx(x) { return PAD_L + (x / b) * plotW; }
    function yToPx(y) { return PAD_T + plotH - (y / fMax) * plotH; }

    // Draw f itself (a polyline of 48 points) so the curve the rectangles chase is exact.
    var curveEl = document.getElementById('riemann-curve');
    if (curveEl) {
      var d = '';
      for (var c = 0; c <= 48; c++) {
        var cx = a + (b - a) * (c / 48);
        d += (c === 0 ? 'M' : 'L') + xToPx(cx).toFixed(1) + ' ' + yToPx(f(cx)).toFixed(1) + ' ';
      }
      curveEl.setAttribute('d', d.trim());
    }

    var MAX_N = 40;
    var rects = [];
    for (var i = 0; i < MAX_N; i++) {
      var r = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      r.setAttribute('fill', 'rgba(98,80,214,.28)');
      r.setAttribute('stroke', '#6250d6');
      r.setAttribute('stroke-width', '1');
      rectsGroup.appendChild(r);
      rects.push(r);
    }

    function render(n) {
      var dx = (b - a) / n;
      var sum = 0;
      for (var i = 0; i < MAX_N; i++) {
        if (i >= n) { rects[i].setAttribute('width', 0); rects[i].setAttribute('height', 0); continue; }
        var mid = a + (i + 0.5) * dx;
        var y = f(mid);
        sum += y * dx;
        var x0 = xToPx(a + i * dx);
        var x1 = xToPx(a + (i + 1) * dx);
        var yTop = yToPx(y);
        var yBase = yToPx(0);
        rects[i].setAttribute('x', x0);
        rects[i].setAttribute('width', Math.max(0, x1 - x0 - 1));
        rects[i].setAttribute('y', yTop);
        rects[i].setAttribute('height', Math.max(0, yBase - yTop));
      }
      estimateEl.textContent = sum.toFixed(2);
      estimateEl.classList.remove('pop'); void estimateEl.offsetWidth; estimateEl.classList.add('pop');
      nReadout.textContent = 'n = ' + n;
    }

    render(parseInt(slider.value, 10));
    slider.addEventListener('input', function () { render(parseInt(slider.value, 10)); });
  }

  // ---------- reveal on scroll + method strip + hero spotlight ----------
  function reveal() {
    var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var targets = document.querySelectorAll('.reveal, .tile, .method-row');
    if (reduced || !('IntersectionObserver' in window)) {
      targets.forEach(function (el) { el.classList.add('in-view'); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            var el = entry.target;
            el.classList.add('in-view');
            io.unobserve(el);
            // The stagger delay is for the fade-in only; drop it so hover transitions on tiles are immediate.
            el.addEventListener('transitionend', function clear(ev) {
              if (ev.propertyName !== 'opacity') return;
              el.style.transitionDelay = '';
              el.removeEventListener('transitionend', clear);
            });
          }
        });
      }, { threshold: 0.2 });
      targets.forEach(function (el, i) {
        el.style.transitionDelay = (i % 6) * 60 + 'ms';
        io.observe(el);
      });
    }

    // method row replay on hover
    document.querySelectorAll('.method-row.live').forEach(function (row) {
      row.addEventListener('mouseenter', function () {
        if (!row.classList.contains('in-view')) return;
        row.classList.remove('in-view');
        void row.offsetWidth;
        row.classList.add('in-view');
      });
    });

    // hero spotlight (pointer devices only, via CSS hover:hover)
    var heroPanel = document.querySelector('.hero-panel');
    if (heroPanel && window.matchMedia && window.matchMedia('(hover: hover)').matches) {
      heroPanel.addEventListener('pointermove', function (e) {
        var rect = heroPanel.getBoundingClientRect();
        heroPanel.style.setProperty('--mx', ((e.clientX - rect.left) / rect.width * 100) + '%');
        heroPanel.style.setProperty('--my', ((e.clientY - rect.top) / rect.height * 100) + '%');
      });
    }
  }

  // ---------- subject tiles: "continue where you stopped", read-only (HUB_LLD.md §11.7) ----------
  // Reads the three apps' saved progress straight out of their own IndexedDB records. The hub
  // NEVER writes, deletes, upgrades or creates anything there: see openExisting() for how the
  // database is guaranteed not to be created on a profile where no app has run yet.
  function tileProgress() {
    var tiles = document.querySelectorAll('.tile[data-subject]:not(.tile--soon)');
    if (!tiles.length || !('indexedDB' in window)) return;
    var ID_RE = /^[a-z0-9][a-z0-9-]{0,63}$/;   // lesson/chapter ids are kebab-case; anything else is rejected
    // `total` must equal the real lesson count (see §11.5 notes) — same numbers as the tiles' meta-first text.
    var SOURCES = {
      math:    { key: 'academy-math:v1',    total: 6,  home: '/academy/subjects/math/',
                 lessonUrl: function (id) { return '/academy/subjects/math/#/lesson/' + id; },
                 lastVisited: function (v) { return typeof v === 'string' && ID_RE.test(v) ? v : null; } },
      physics: { key: 'academy-physics:v1', total: 3,  home: '/academy/subjects/physics/',
                 lessonUrl: function (id) { return '/academy/subjects/physics/#/lesson/' + id; },
                 lastVisited: function (v) { return typeof v === 'string' && ID_RE.test(v) ? v : null; } }
    };

    // 1. Open read-only; abort if the DB would be created; give up silently after 1500 ms.
    function openExisting(cb) {
      var done = false; function finish(db) { if (!done) { done = true; cb(db || null); } }
      try {
        var req = indexedDB.open('keyval-store');            // no version → opens whatever exists
        req.onupgradeneeded = function () { try { req.transaction.abort(); } catch (e) {} finish(null); }; // DB absent → never create it
        req.onerror = req.onblocked = function () { finish(null); };
        req.onsuccess = function () {
          var db = req.result;
          if (done) { try { db.close(); } catch (e) {} return; }   // arrived after the 1500 ms guard: don't leave a connection open
          db.onversionchange = function () { try { db.close(); } catch (e) {} };
          if (!db.objectStoreNames.contains('keyval')) { db.close(); return finish(null); }
          finish(db);
        };
        setTimeout(function () { finish(null); }, 1500);
      } catch (e) { finish(null); }
    }

    // 2. One readonly transaction, one get per key.
    function readAll(db, keys, cb) {
      var out = {}; try {
        var tx = db.transaction('keyval', 'readonly'), store = tx.objectStore('keyval');
        keys.forEach(function (k) { var g = store.get(k); g.onsuccess = function () { out[k] = g.result; }; });
        tx.oncomplete = function () { db.close(); cb(out); };
        tx.onerror = tx.onabort = function () { db.close(); cb(out); };
      } catch (e) { try { db.close(); } catch (_) {} cb(out); }
    }

    // 3. Parse defensively: anything unexpected → null (first-visit state).
    function parse(raw, src) {
      try {
        if (typeof raw !== 'string') return null;             // idb-keyval stores zustand's JSON string
        var state = JSON.parse(raw).state;
        if (!state || typeof state !== 'object') return null;
        var lc = state.lessonsCompleted;
        var completed = {};
        if (lc && typeof lc === 'object' && !Array.isArray(lc)) {
          Object.keys(lc).forEach(function (id) { if (ID_RE.test(id) && typeof lc[id] === 'number' && isFinite(lc[id])) completed[id] = true; });
        }
        var done = Math.min(src.total, Object.keys(completed).length);
        var lv = src.lastVisited(state.lastVisited);
        var lvId = lv && (typeof lv === 'string' ? lv : lv.lessonId);
        var resume = lv && !completed[lvId];                   // the apps' own useNextLesson rule: last visited, if still incomplete
        return { done: done, total: src.total, complete: done >= src.total, href: resume ? src.lessonUrl(lv) : src.home, hasProgress: done > 0 || !!lv };
      } catch (e) { return null; }
    }

    // 4. Apply to the DOM. Both languages are written; CSS shows one.
    function apply(tile, p) {
      if (!p || !p.hasProgress) return;                        // first-visit state is the markup's default
      tile.classList.add('has-progress'); if (p.complete) tile.classList.add('is-complete');
      tile.href = p.href;
      var he = tile.querySelector('.meta-progress .t-he'), en = tile.querySelector('.meta-progress .t-en');
      if (he) he.textContent = p.done + ' מתוך ' + p.total + ' שיעורים';
      if (en) en.textContent = p.done + ' of ' + p.total + ' lessons';
      var arc = tile.querySelector('.tile-ring .arc');
      if (arc) { var c = 97.39; arc.style.strokeDashoffset = String(c * (1 - (p.total ? p.done / p.total : 0))); }
      var ring = tile.querySelector('.tile-ring'); if (ring) ring.setAttribute('aria-label', Math.round(100 * p.done / p.total) + '%');
      var greet = document.getElementById('tiles-greeting'); if (greet) greet.hidden = false;
    }

    openExisting(function (db) {
      if (!db) return;
      var keys = Object.keys(SOURCES).map(function (k) { return SOURCES[k].key; });
      readAll(db, keys, function (values) {
        tiles.forEach(function (tile) {
          var src = SOURCES[tile.dataset.subject]; if (!src) return;
          apply(tile, parse(values[src.key], src));
        });
      });
    });
  }

  // ---------- tabs (live preview) ----------
  function tabs() {
    var tablist = document.querySelector('[role="tablist"]');
    if (!tablist) return;
    var tabEls = Array.prototype.slice.call(tablist.querySelectorAll('[role="tab"]'));
    var panels = {};
    tabEls.forEach(function (t) { panels[t.dataset.tab] = document.getElementById(t.getAttribute('aria-controls')); });

    function select(key) {
      tabEls.forEach(function (t) {
        var active = t.dataset.tab === key;
        t.setAttribute('aria-selected', String(active));
        t.tabIndex = active ? 0 : -1;
        panels[t.dataset.tab].hidden = !active;
      });
      try { localStorage.setItem('academy:hub-demo', key); } catch (e) {}
    }

    tabEls.forEach(function (t, i) {
      t.addEventListener('click', function () { select(t.dataset.tab); });
      t.addEventListener('keydown', function (e) {
        var next = null;
        if (e.key === 'ArrowRight') next = (i + 1) % tabEls.length;
        else if (e.key === 'ArrowLeft') next = (i - 1 + tabEls.length) % tabEls.length;
        if (next === null) return;
        e.preventDefault();
        tabEls[next].focus();
        select(tabEls[next].dataset.tab);
      });
    });

    var stored = null;
    try { stored = localStorage.getItem('academy:hub-demo'); } catch (e) {}
    select(stored && panels[stored] ? stored : tabEls[0].dataset.tab);
  }

  // ---------- feedback widget ----------
  function feedbackWidget() {
    var overlay = document.getElementById('feedback-overlay');
    if (!overlay) return;
    var form = document.getElementById('feedback-form');
    var status = document.getElementById('feedback-status');
    var submitBtn = document.getElementById('feedback-submit');
    var subjectField = document.getElementById('feedback-subject-field');
    var fileInput = document.getElementById('feedback-file');
    var fileLabel = document.getElementById('feedback-file-label');
    var fileText = document.getElementById('feedback-file-text');

    function open() { overlay.classList.add('open'); document.getElementById('feedback-message').focus(); }
    function close() { overlay.classList.remove('open'); }

    document.getElementById('feedback-open').addEventListener('click', open);
    document.getElementById('feedback-close').addEventListener('click', close);
    overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });

    document.querySelectorAll('.feedback-type').forEach(function (btn) {
      btn.addEventListener('click', function () {
        document.querySelectorAll('.feedback-type').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        subjectField.value = 'Academy hub feedback: ' + btn.dataset.type;
      });
    });

    fileInput.addEventListener('change', function () {
      if (fileInput.files && fileInput.files[0]) {
        fileText.textContent = fileInput.files[0].name;
        fileLabel.classList.add('has-file');
      } else {
        fileLabel.classList.remove('has-file');
      }
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      status.textContent = '';
      status.className = 'feedback-status';
      submitBtn.disabled = true;

      var data = new FormData(form);
      data.append('page', location.href);
      data.append('language', document.documentElement.lang);
      data.append('theme', document.documentElement.dataset.theme || '');

      fetch('https://api.web3forms.com/submit', { method: 'POST', body: data, headers: { Accept: 'application/json' } })
        .then(function (r) { return r.json(); })
        .then(function (result) {
          if (result.success) {
            var isHe = document.documentElement.lang === 'he';
            status.textContent = isHe ? 'תודה! קיבלנו את ההודעה שלכם.' : "Thanks! We've got your message.";
            status.className = 'feedback-status ok';
            form.reset();
            fileText.innerHTML = '<span class="t-he">בחירת קובץ…</span><span class="t-en">Choose a file…</span>';
            fileLabel.classList.remove('has-file');
            setTimeout(close, 1800);
          } else {
            throw new Error(result.message || 'failed');
          }
        })
        .catch(function () {
          var isHe = document.documentElement.lang === 'he';
          status.textContent = isHe ? 'משהו השתבש. נסו שוב, או כתבו ישירות.' : 'Something went wrong. Please try again.';
          status.className = 'feedback-status err';
        })
        .finally(function () { submitBtn.disabled = false; });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    prefs();
    tabs();
    heroHandle();
    riemannDemo();
    reveal();
    tileProgress();
    feedbackWidget();
  });
})();
