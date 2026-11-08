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
    var body = document.body;

    var SUBJECTS = [
      { key: 'nitrox', frac: 0.14, color: 'var(--teal)', live: true, url: '/academy/subjects/nitrox/', nameHe: 'נייטרוקס', nameEn: 'NITROX', statusHe: 'פעיל', statusEn: 'LIVE' },
      { key: 'math', frac: 0.40, color: '#6250d6', live: true, url: '/academy/subjects/math/', nameHe: 'מתמטיקה', nameEn: 'MATH', statusHe: 'פיילוט', statusEn: 'PILOT' },
      { key: 'physics', frac: 0.64, color: 'var(--blue)', live: false, url: null, nameHe: 'פיזיקה', nameEn: 'PHYSICS', statusHe: 'בקרוב', statusEn: 'SOON' },
      { key: 'chemistry', frac: 0.88, color: 'var(--amber)', live: false, url: null, nameHe: 'כימיה', nameEn: 'CHEM', statusHe: 'בקרוב', statusEn: 'SOON' },
    ];

    var totalLength = curvePath.getTotalLength();
    var samples = [];
    var SAMPLE_N = 240;
    for (var i = 0; i <= SAMPLE_N; i++) {
      var pt = curvePath.getPointAtLength((i / SAMPLE_N) * totalLength);
      samples.push({ x: pt.x, y: pt.y, frac: i / SAMPLE_N });
    }

    function pointAtFraction(frac) {
      return curvePath.getPointAtLength(frac * totalLength);
    }
    function nearestFraction(svgX) {
      var lo = 0, hi = samples.length - 1;
      while (lo < hi) {
        var mid = (lo + hi) >> 1;
        if (samples[mid].x < svgX) lo = mid + 1; else hi = mid;
      }
      return samples[lo].frac;
    }

    SUBJECTS.forEach(function (s) {
      var pt = pointAtFraction(s.frac);
      s.x = pt.x; s.y = pt.y;
      var nodeEl = svg.querySelector('.node[data-subject="' + s.key + '"]');
      if (nodeEl) {
        nodeEl.setAttribute('transform', 'translate(' + pt.x + ',' + pt.y + ')');
        s.el = nodeEl;
      }
    });

    var activeIndex = 0;

    function setReadout(index, dragging) {
      var s = SUBJECTS[index];
      statusDot.style.setProperty('--readout-color', s.live ? 'var(--good)' : 'var(--muted)');
      var he = s.nameHe + ' · ' + s.statusHe;
      var en = s.nameEn + ' · ' + s.statusEn;
      statusText.innerHTML = '<span class="t-he">' + he + '</span><span class="t-en">' + en + '</span>';
      if (s.live && !dragging) {
        openLink.href = s.url;
        openLink.hidden = false;
      } else {
        openLink.hidden = true;
      }
    }

    function placeAt(frac) {
      var x, y;
      var nearest = samples[0];
      var best = Infinity;
      for (var i = 0; i < samples.length; i++) {
        var d = Math.abs(samples[i].frac - frac);
        if (d < best) { best = d; nearest = samples[i]; }
      }
      x = nearest.x; y = nearest.y;
      group.setAttribute('transform', 'translate(' + x + ',' + y + ')');
      hairline.setAttribute('x1', x); hairline.setAttribute('x2', x);
      return nearest;
    }

    function nearestSubjectIndex(frac) {
      var bestI = 0, best = Infinity;
      SUBJECTS.forEach(function (s, i) {
        var d = Math.abs(s.frac - frac);
        if (d < best) { best = d; bestI = i; }
      });
      return bestI;
    }

    function snapTo(index, opts) {
      opts = opts || {};
      activeIndex = index;
      var s = SUBJECTS[index];
      group.style.transition = opts.animate === false ? 'none' : 'transform 260ms cubic-bezier(.2,.8,.2,1)';
      placeAt(s.frac);
      setReadout(index, false);
      body.dataset.active = s.key;
      requestAnimationFrame(function () { group.style.transition = ''; });
    }

    // init
    placeAt(SUBJECTS[0].frac);
    setReadout(0, false);
    body.dataset.active = SUBJECTS[0].key;

    var dragging = false;
    function svgPointFromClient(clientX) {
      var pt = svg.createSVGPoint();
      pt.x = clientX; pt.y = 0;
      var ctm = svg.getScreenCTM();
      if (!ctm) return null;
      return pt.matrixTransform(ctm.inverse());
    }

    function onPointerDown(e) {
      dragging = true;
      group.classList.add('dragging');
      try { svg.setPointerCapture(e.pointerId); } catch (err) {}
      onPointerMove(e);
    }
    function onPointerMove(e) {
      if (!dragging) return;
      var p = svgPointFromClient(e.clientX);
      if (!p) return;
      var frac = nearestFraction(p.x);
      group.style.transition = 'none';
      placeAt(frac);
      var idx = nearestSubjectIndex(frac);
      setReadout(idx, true);
    }
    function onPointerUp(e) {
      if (!dragging) return;
      dragging = false;
      group.classList.remove('dragging');
      var p = svgPointFromClient(e.clientX);
      var frac = p ? nearestFraction(p.x) : SUBJECTS[activeIndex].frac;
      snapTo(nearestSubjectIndex(frac));
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
      var isRtl = document.documentElement.dir === 'rtl';
      var next = null;
      if (e.key === 'ArrowRight') next = isRtl ? activeIndex - 1 : activeIndex + 1;
      else if (e.key === 'ArrowLeft') next = isRtl ? activeIndex + 1 : activeIndex - 1;
      else if (e.key === 'Home') next = 0;
      else if (e.key === 'End') next = SUBJECTS.length - 1;
      else if (e.key === 'Enter' || e.key === ' ') {
        var s = SUBJECTS[activeIndex];
        if (s.live && s.url) window.location.href = s.url;
        return;
      }
      if (next === null) return;
      e.preventDefault();
      next = Math.max(0, Math.min(SUBJECTS.length - 1, next));
      snapTo(next);
    });

    function updateAriaValueText() {
      var s = SUBJECTS[activeIndex];
      var isHe = document.documentElement.lang === 'he';
      group.setAttribute('aria-valuenow', String(activeIndex));
      group.setAttribute('aria-valuetext', (isHe ? s.nameHe + ' · ' + s.statusHe : s.nameEn + ' · ' + s.statusEn));
    }
    var origSnap = snapTo;
    snapTo = function (index, opts) { origSnap(index, opts); updateAriaValueText(); };
    updateAriaValueText();
    window.addEventListener('academy:langchange', updateAriaValueText);

    // click a node directly
    SUBJECTS.forEach(function (s, i) {
      if (!s.el) return;
      s.el.style.cursor = 'pointer';
      s.el.addEventListener('click', function () { snapTo(i); });
      s.el.addEventListener('dblclick', function () {
        if (s.live && s.url) window.location.href = s.url;
      });
    });

    // idle advertisement pass
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var touched = false;
    ['pointerdown', 'keydown'].forEach(function (ev) {
      svg.addEventListener(ev, function () { touched = true; }, { once: true });
      group.addEventListener(ev, function () { touched = true; }, { once: true });
    });
    setTimeout(function () {
      if (touched) return;
      group.style.transition = 'transform 1500ms cubic-bezier(.2,.8,.2,1)';
      placeAt(SUBJECTS[1].frac);
      setTimeout(function () {
        group.style.transition = 'transform 1500ms cubic-bezier(.2,.8,.2,1)';
        placeAt(SUBJECTS[0].frac);
        setReadout(0, false);
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

  // ---------- Nitrox demo: pO2 vs depth for EAN32 ----------
  function nitroxDemo() {
    var slider = document.getElementById('nitrox-depth');
    if (!slider) return;
    var fill = document.getElementById('nitrox-fill');
    var depthReadout = document.getElementById('nitrox-depth-readout');
    var po2Readout = document.getElementById('nitrox-po2-readout');
    var warnNote = document.getElementById('nitrox-warn-note');

    var FO2 = 0.32;
    // Recreational planning limit, sourced from apps/nitrox/src/science/limits.ts
    // (DEFAULT_PLANNING_PPO2 = 1.4). Do not add any other limit/MOD number here.
    var PLANNING_PPO2 = 1.4;
    var GAUGE_MAX = 1.6;
    var barW = 400; // matches the gauge track's SVG width, see markup

    function po2(depth) { return FO2 * (1 + depth / 10); }

    function render(depth) {
      var p = po2(depth);
      var w = Math.min(1, p / GAUGE_MAX) * barW;
      fill.setAttribute('width', w);
      depthReadout.textContent = depth + ' m';
      po2Readout.textContent = p.toFixed(2) + ' bar';
      var over = p > PLANNING_PPO2;
      po2Readout.classList.toggle('warn', over);
      warnNote.classList.toggle('show', over);
    }

    render(parseInt(slider.value, 10));
    slider.addEventListener('input', function () { render(parseInt(slider.value, 10)); });
  }

  // ---------- reveal on scroll + method strip + hero spotlight ----------
  function reveal() {
    var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var targets = document.querySelectorAll('.reveal, .subject, .method-row');
    if (reduced || !('IntersectionObserver' in window)) {
      targets.forEach(function (el) { el.classList.add('in-view'); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
            io.unobserve(entry.target);
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
    nitroxDemo();
    reveal();
    feedbackWidget();
  });
})();
