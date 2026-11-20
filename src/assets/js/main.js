/* א.ח.ד הנדסת בניין ובטיחות – site behaviour (no third-party code) */
(function () {
  'use strict';

  var PHONE_WA = '972509737244';
  var MIDRAG_URL = 'https://www.google.com/search?q=%D7%90.%D7%97.%D7%93+%D7%93%D7%95%D7%93+%D7%97%D7%99+%D7%90%D7%91%D7%A8%D7%92%D7%9C+%D7%9E%D7%93%D7%A8%D7%92';
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var doc = document.documentElement;
  if (!doc.getAttribute('dir')) { doc.setAttribute('dir', 'rtl'); doc.setAttribute('lang', 'he'); }
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  function store(key, val) {
    try {
      if (val === undefined) return window.localStorage.getItem(key);
      if (val === null) window.localStorage.removeItem(key); else window.localStorage.setItem(key, val);
    } catch (e) { return null; }
    return null;
  }

  /* ---------- WhatsApp links with a prefilled, topic-aware message ---------- */
  $$('.js-wa').forEach(function (a) {
    var topic = a.getAttribute('data-wa');
    var msg = topic
      ? 'שלום דוד, הגעתי מהאתר ואשמח לפרטים על ' + topic + '.'
      : 'שלום דוד, הגעתי מהאתר ואשמח לתאם בדק בית / לקבל הצעת מחיר.';
    a.href = 'https://wa.me/' + PHONE_WA + '?text=' + encodeURIComponent(msg);
  });
  $$('.js-midrag').forEach(function (a) { a.href = MIDRAG_URL; });

  /* ---------- small live details ---------- */
  var y = new Date().getFullYear();
  $$('.js-year').forEach(function (el) { el.textContent = y; });
  var today = $('.js-today');
  if (today) {
    try { today.textContent = new Intl.DateTimeFormat('he-IL', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date()); } catch (e) { /* keep fallback */ }
  }

  /* ---------- header + scroll tape + action bar ---------- */
  var header = $('.site-header');
  var tape = $('.tape__bar');
  var bar = $('.action-bar');
  var ticking = false;
  function onScroll() {
    var st = window.scrollY || doc.scrollTop;
    var max = Math.max(1, doc.scrollHeight - window.innerHeight);
    if (header) header.classList.toggle('is-solid', st > 24);
    if (tape) tape.style.setProperty('--p', Math.min(1, st / max).toFixed(4));
    if (bar) bar.classList.toggle('is-visible', st > 420);
    ticking = false;
  }
  window.addEventListener('scroll', function () { if (!ticking) { ticking = true; window.requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();

  /* ---------- current page in the nav strip (small screens) ---------- */
  var curLink = $('.nav a[aria-current="page"]');
  if (curLink) {
    var strip = curLink.closest('.nav');
    if (strip && strip.scrollWidth > strip.clientWidth + 2) {
      var sr = strip.getBoundingClientRect(), cr = curLink.getBoundingClientRect();
      strip.scrollLeft += (cr.left + cr.width / 2) - (sr.left + sr.width / 2);
    }
  }

  /* ---------- mobile menu ---------- */
  var menu = $('#menu');
  var burger = $('.burger');
  var lastFocus = null;
  function trapFocus(container, e) {
    if (e.key !== 'Tab') return;
    var f = $$('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])', container).filter(function (el) { return el.offsetParent !== null; });
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
  function openMenu() {
    if (!menu) return;
    lastFocus = document.activeElement;
    menu.hidden = false;
    window.requestAnimationFrame(function () { menu.classList.add('is-open'); });
    burger.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    var c = $('.menu__close', menu); if (c) c.focus();
  }
  function closeMenu(skipFocus) {
    if (!menu || menu.hidden) return;
    menu.classList.remove('is-open');
    burger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    setTimeout(function () { menu.hidden = true; }, reduceMotion ? 0 : 350);
    if (!skipFocus && lastFocus) lastFocus.focus();
  }
  if (burger && menu) {
    burger.addEventListener('click', openMenu);
    $('.menu__close', menu).addEventListener('click', function () { closeMenu(); });
    $$('a', menu).forEach(function (a) { a.addEventListener('click', function () { closeMenu(true); }); });
    menu.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); trapFocus(menu, e); });
  }

  /* ---------- reveal on scroll (content is visible without JS) ---------- */
  var reveals = $$('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion && reveals.length) {
    var vh = window.innerHeight;
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('revealed');
          en.target.classList.remove('will-reveal');
          obs.unobserve(en.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    reveals.forEach(function (el, i) {
      if (el.getBoundingClientRect().top > vh * 0.92) {
        el.classList.add('will-reveal');
        el.style.transitionDelay = ((i % 3) * 70) + 'ms';
        obs.observe(el);
      }
    });
  }

  /* ---------- inspector's eye: thermal lens ---------- */
  var stage = $('#eye-stage');
  if (stage) {
    var items = $$('.eye__item');
    var temp = $('.js-temp');
    var hint = $('.eye__hint', stage);
    var pos = { x: 21, y: 23 };
    var target = { x: 21, y: 23 };
    var userMoved = false;
    var idleT = null;
    var autoIdx = 0;
    function radius() { return Math.max(56, Math.min(120, stage.clientWidth * 0.11)); }
    function apply() {
      stage.style.setProperty('--x', pos.x + '%');
      stage.style.setProperty('--y', pos.y + '%');
      stage.style.setProperty('--r', radius() + 'px');
    }
    function nearestTemp(x, yv) {
      var best = null, bd = 1e9;
      items.forEach(function (b) {
        var dx = x - parseFloat(b.dataset.x), dy = yv - parseFloat(b.dataset.y);
        var d = dx * dx + dy * dy;
        if (d < bd) { bd = d; best = b; }
      });
      var base = 21.5;
      if (best && bd < 120) return parseFloat(best.dataset.t);
      return base + Math.sin(x * 0.3) * 0.8 + Math.cos(yv * 0.2) * 0.6;
    }
    function select(btn, move) {
      items.forEach(function (b) { b.setAttribute('aria-pressed', b === btn ? 'true' : 'false'); });
      if (move) { target.x = parseFloat(btn.dataset.x); target.y = parseFloat(btn.dataset.y); }
    }
    function animate() {
      pos.x += (target.x - pos.x) * 0.18;
      pos.y += (target.y - pos.y) * 0.18;
      apply();
      if (temp) temp.textContent = nearestTemp(pos.x, pos.y).toFixed(1) + '°C';
      if (Math.abs(target.x - pos.x) > 0.05 || Math.abs(target.y - pos.y) > 0.05) window.requestAnimationFrame(animate);
      else animating = false;
    }
    var animating = false;
    function kick() { if (!animating) { animating = true; window.requestAnimationFrame(animate); } }
    function fromEvent(e) {
      var r = stage.getBoundingClientRect();
      var cx = (e.touches ? e.touches[0].clientX : e.clientX) - r.left;
      var cy = (e.touches ? e.touches[0].clientY : e.clientY) - r.top;
      target.x = Math.max(0, Math.min(100, cx / r.width * 100));
      target.y = Math.max(0, Math.min(100, cy / r.height * 100));
      if (!userMoved) { userMoved = true; if (hint) hint.hidden = true; }
      // auto-select the nearest finding when the lens passes over it
      items.forEach(function (b) {
        var dx = target.x - parseFloat(b.dataset.x), dy = target.y - parseFloat(b.dataset.y);
        if (dx * dx + dy * dy < 40) select(b, false);
      });
      kick();
      clearTimeout(idleT);
      idleT = setTimeout(autoTour, 9000);
    }
    stage.addEventListener('pointermove', fromEvent);
    stage.addEventListener('pointerdown', function (e) { if (stage.setPointerCapture) { try { stage.setPointerCapture(e.pointerId); } catch (er) { /* noop */ } } fromEvent(e); });
    items.forEach(function (b) {
      b.addEventListener('click', function () { userMoved = true; if (hint) hint.hidden = true; select(b, true); kick(); clearTimeout(idleT); idleT = setTimeout(autoTour, 12000); });
    });
    function autoTour() {
      if (reduceMotion || doc.classList.contains('a11y-still')) return;
      var r = stage.getBoundingClientRect();
      if (r.bottom > 0 && r.top < window.innerHeight) {
        autoIdx = (autoIdx + 1) % items.length;
        select(items[autoIdx], true); kick();
      }
      idleT = setTimeout(autoTour, 4200);
    }
    window.addEventListener('resize', apply);
    apply();
    idleT = setTimeout(autoTour, 5000);
  }

  /* ---------- certificates: carousel + lightbox (view only) ---------- */
  var track = $('#certs-track');
  if (track) {
    var step = function () { var c = $('.cert', track); return c ? c.getBoundingClientRect().width + 18 : 260; };
    var prev = $('.js-certs-prev'), next = $('.js-certs-next');
    // RTL: scrolling "forward" moves toward negative scrollLeft
    if (next) next.addEventListener('click', function () { track.scrollBy({ left: -step(), behavior: reduceMotion ? 'auto' : 'smooth' }); });
    if (prev) prev.addEventListener('click', function () { track.scrollBy({ left: step(), behavior: reduceMotion ? 'auto' : 'smooth' }); });
  }
  var lb = $('#lightbox');
  if (lb) {
    var lbImg = $('img', lb), lbCap = $('figcaption', lb), lbClose = $('.lightbox__close', lb), lbLast = null;
    function closeLb() { lb.hidden = true; document.body.style.overflow = ''; if (lbLast) lbLast.focus(); }
    $$('.cert__btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        lbLast = btn;
        lbImg.src = btn.getAttribute('data-full');
        var cap = btn.parentNode.querySelector('b');
        lbImg.alt = cap ? cap.textContent : '';
        lbCap.textContent = (cap ? cap.textContent + ' · ' : '') + 'לצפייה בלבד';
        lb.hidden = false;
        document.body.style.overflow = 'hidden';
        lbClose.focus();
      });
    });
    lbClose.addEventListener('click', closeLb);
    lb.addEventListener('click', function (e) { if (e.target === lb) closeLb(); });
    lb.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeLb(); trapFocus(lb, e); });
  }
  // discourage saving certificate images
  document.addEventListener('contextmenu', function (e) { if (e.target.closest && e.target.closest('.cert, .lightbox')) e.preventDefault(); });
  document.addEventListener('dragstart', function (e) { if (e.target.closest && e.target.closest('.cert, .lightbox')) e.preventDefault(); });

  /* ---------- footer: ruler numbers, skyline windows, bubble level ---------- */
  var nums = $('.js-ruler-nums');
  if (nums) {
    var n = Math.ceil(Math.max(window.screen.width, window.innerWidth) / 100) + 1;
    var frag = document.createDocumentFragment();
    for (var i = 0; i < n; i++) { var s = document.createElement('span'); s.textContent = i * 10; frag.appendChild(s); }
    nums.appendChild(frag);
  }
  var sky = $('.js-skyline');
  if (sky) {
    var NS = 'http://www.w3.org/2000/svg';
    var towers = [[20, 96, 70], [110, 60, 44], [170, 34, 44], [230, 80, 80], [330, 40, 66], [420, 100, 60], [500, 54, 56], [576, 12, 40], [636, 72, 70], [726, 36, 46], [792, 90, 90], [902, 48, 60], [982, 70, 56], [1058, 30, 36], [1114, 84, 66]];
    var wins = [];
    towers.forEach(function (t) {
      for (var yy = t[1] + 10; yy < 150; yy += 14) {
        for (var xx = t[0] + 8; xx < t[0] + t[2] - 8; xx += 12) {
          var r = document.createElementNS(NS, 'rect');
          r.setAttribute('x', xx); r.setAttribute('y', yy); r.setAttribute('width', 5); r.setAttribute('height', 6);
          r.setAttribute('class', 'win' + (Math.random() < 0.22 ? ' on' : ''));
          sky.appendChild(r); wins.push(r);
        }
      }
    });
    if (!reduceMotion) setInterval(function () {
      if (doc.classList.contains('a11y-still')) return;
      var w = wins[Math.floor(Math.random() * wins.length)]; if (w) w.classList.toggle('on');
    }, 650);
  }
  var level = $('.js-level');
  if (level) {
    var bubble = $('.level__bubble', level);
    var levelText = $('.js-level-text');
    var setTilt = function (t) {
      t = Math.max(-1, Math.min(1, t));
      var max = (level.clientWidth / 2) - 26;
      bubble.style.setProperty('--tilt', (t * max).toFixed(1) + 'px');
      if (levelText) levelText.textContent = Math.abs(t) < 0.08 ? 'מאוזן. בדיוק כמו שצריך.' : 'הזיזו את העכבר או הטו את הטלפון. אנחנו בודקים שהכל מאוזן.';
    };
    window.addEventListener('pointermove', function (e) {
      var r = level.getBoundingClientRect();
      if (r.top > window.innerHeight || r.bottom < 0) return;
      setTilt(((e.clientX / window.innerWidth) - 0.5) * 2.2);
    }, { passive: true });
    window.addEventListener('deviceorientation', function (e) { if (e.gamma !== null) setTilt(e.gamma / 30); }, { passive: true });
  }

  /* ---------- accessibility widget ---------- */
  var ICON = {
    a11y: '<path fill="currentColor" d="M12 2a2 2 0 1 1 0 4 2 2 0 0 1 0-4Zm8.6 5.3-5.6 1.4V13l2.3 7.4a1.1 1.1 0 0 1-2.1.7L12.9 15h-1.8l-2.3 6.1a1.1 1.1 0 0 1-2.1-.7L9 13V8.7L3.4 7.3a1.1 1.1 0 1 1 .5-2.1c2.7.6 5.4 1.1 8.1 1.1s5.4-.5 8.1-1.1a1.1 1.1 0 1 1 .5 2.1Z"/>',
    close: '<path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" d="M6 6l12 12M18 6 6 18"/>',
    contrast: '<path fill="none" stroke="currentColor" stroke-width="1.8" d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z"/><path fill="currentColor" d="M12 3a9 9 0 0 1 0 18V3Z"/>',
    moon: '<path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z"/>',
    gray: '<path fill="none" stroke="currentColor" stroke-width="1.8" d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11Z"/>',
    link: '<path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
    heading: '<path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" d="M6 4v16M18 4v16M6 12h12"/>',
    font: '<path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M4 20 10 4h1l6 16M6.5 14h8M17 20h3"/>',
    spacing: '<path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" d="M9 6h11M9 12h11M9 18h11M4 4v16M2.5 6 4 4l1.5 2M2.5 18 4 20l1.5-2"/>',
    cursor: '<path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" d="M5 3l14 10-6.5 1L9 21 5 3Z"/>',
    pause: '<path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" d="M9 6v12M15 6v12"/>'
  };
  function svg(name) { return '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">' + ICON[name] + '</svg>'; }
  var OPTS = [
    ['contrast', 'ניגודיות גבוהה', 'contrast'],
    ['dark', 'מצב כהה', 'moon'],
    ['gray', 'גווני אפור', 'gray'],
    ['links', 'הדגשת קישורים', 'link'],
    ['headings', 'הדגשת כותרות', 'heading'],
    ['readable', 'גופן קריא', 'font'],
    ['spacing', 'ריווח טקסט', 'spacing'],
    ['cursor', 'סמן גדול', 'cursor'],
    ['still', 'עצירת אנימציות', 'pause']
  ];
  var statementHref = (document.body.getAttribute('data-root') || '') + 'accessibility.html';
  var btn = document.createElement('button');
  btn.type = 'button'; btn.className = 'a11y-btn'; btn.setAttribute('aria-label', 'תפריט נגישות');
  btn.setAttribute('aria-expanded', 'false'); btn.setAttribute('aria-controls', 'a11y-panel');
  btn.innerHTML = svg('a11y');
  var panel = document.createElement('div');
  panel.className = 'a11y-panel'; panel.id = 'a11y-panel'; panel.hidden = true;
  panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-label', 'הגדרות נגישות');
  var html = '<div class="a11y-panel__head"><h2>הגדרות נגישות</h2><button type="button" class="js-a11y-close" aria-label="סגירת תפריט הנגישות">' + svg('close') + '</button></div>' +
    '<div class="a11y-grid"><div class="a11y-size"><span id="a11y-size-label">גודל טקסט</span><div><button type="button" class="js-fs" data-d="-1" aria-label="הקטנת טקסט">−</button><output class="js-fs-out" aria-live="polite" aria-labelledby="a11y-size-label">100%</output><button type="button" class="js-fs" data-d="1" aria-label="הגדלת טקסט">+</button></div></div>';
  OPTS.forEach(function (o) { html += '<button type="button" class="a11y-opt" data-opt="' + o[0] + '" aria-pressed="false">' + svg(o[2]) + o[1] + '</button>'; });
  html += '</div><div class="a11y-panel__foot"><a href="' + statementHref + '">הצהרת נגישות</a><button type="button" class="js-a11y-reset">איפוס הגדרות</button></div>';
  panel.innerHTML = html;
  document.body.appendChild(btn);
  document.body.appendChild(panel);

  var state = { fs: 100, opts: {} };
  try { var saved = JSON.parse(store('ahd-a11y') || 'null'); if (saved && typeof saved === 'object') state = { fs: Number(saved.fs) || 100, opts: saved.opts || {} }; } catch (e) { /* ignore */ }
  function applyA11y() {
    OPTS.forEach(function (o) {
      var on = !!state.opts[o[0]];
      doc.classList.toggle('a11y-' + o[0], on);
      var b = panel.querySelector('[data-opt="' + o[0] + '"]'); if (b) b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    doc.style.fontSize = state.fs === 100 ? '' : state.fs + '%';
    $('.js-fs-out', panel).textContent = state.fs + '%';
    store('ahd-a11y', JSON.stringify(state));
  }
  $$('.a11y-opt', panel).forEach(function (b) {
    b.addEventListener('click', function () {
      var k = b.getAttribute('data-opt');
      state.opts[k] = !state.opts[k];
      if (k === 'contrast' && state.opts[k]) state.opts.dark = false;
      if (k === 'dark' && state.opts[k]) state.opts.contrast = false;
      applyA11y();
    });
  });
  $$('.js-fs', panel).forEach(function (b) {
    b.addEventListener('click', function () { state.fs = Math.max(90, Math.min(150, state.fs + Number(b.getAttribute('data-d')) * 10)); applyA11y(); });
  });
  $('.js-a11y-reset', panel).addEventListener('click', function () { state = { fs: 100, opts: {} }; applyA11y(); });
  function togglePanel(open) {
    panel.hidden = !open;
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open) { var f = panel.querySelector('.js-a11y-close'); if (f) f.focus(); } else btn.focus();
  }
  btn.addEventListener('click', function () { togglePanel(panel.hidden); });
  $('.js-a11y-close', panel).addEventListener('click', function () { togglePanel(false); });
  panel.addEventListener('keydown', function (e) { if (e.key === 'Escape') togglePanel(false); trapFocus(panel, e); });
  document.addEventListener('click', function (e) { if (!panel.hidden && !panel.contains(e.target) && !btn.contains(e.target)) { panel.hidden = true; btn.setAttribute('aria-expanded', 'false'); } });
  applyA11y();
})();
