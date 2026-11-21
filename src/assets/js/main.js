/* א.ח.ד הנדסת בניין ובטיחות – site behaviour (no third-party code) */
(function () {
  'use strict';

  var PHONE_WA = '972509737244';
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

  /* ---------- Facebook page feed (official Page Plugin). Loads only after the visitor asks. ---------- */
  Array.prototype.forEach.call(document.querySelectorAll('.js-fb-load'), function (btn) {
    btn.addEventListener('click', function () {
      var box = btn.closest('.fb-embed');
      var page = box.getAttribute('data-page');
      var w = Math.min(500, Math.max(280, Math.floor(box.clientWidth)));
      var f = document.createElement('iframe');
      f.src = 'https://www.facebook.com/plugins/page.php?href=' + encodeURIComponent(page) + '&tabs=timeline&width=' + w + '&height=620&small_header=true&adapt_container_width=true&hide_cover=false&show_facepile=false&locale=he_IL';
      f.width = w; f.height = 620; f.title = 'הפוסטים האחרונים מעמוד הפייסבוק';
      f.setAttribute('loading', 'lazy');
      f.setAttribute('allow', 'encrypted-media');
      f.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
      var frame = box.querySelector('.fb-embed__frame');
      while (frame.firstChild) frame.removeChild(frame.firstChild);
      frame.appendChild(f);
      try { window.localStorage.setItem('ahd-fb', '1'); } catch (e) { /* ignore */ }
    });
    try { if (window.localStorage.getItem('ahd-fb') === '1') btn.click(); } catch (e) { /* ignore */ }
  });

  /* pipe camera distance follows the 9s travel loop */
  Array.prototype.forEach.call(document.querySelectorAll('.js-gear-dist'), function (el) {
    var t0 = Date.now();
    setInterval(function () {
      if (doc.classList.contains('a11y-still')) return;
      var p = ((Date.now() - t0) % 9000) / 9000;
      el.textContent = (0.4 + p * 3.1).toFixed(1);
    }, 120);
  });
  /* equipment monitor: running recording timer */
  Array.prototype.forEach.call(document.querySelectorAll('.js-gear-time'), function (el) {
    var t0 = Date.now();
    setInterval(function () {
      if (doc.classList.contains('a11y-still')) return;
      var s = Math.floor((Date.now() - t0) / 1000) % 3600;
      el.textContent = String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
    }, 1000);
  });

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

  /* ---------- inspector's eye: thermal lens with discovery ---------- */
  Array.prototype.forEach.call(document.querySelectorAll('.eye__stage'), function (stage) {
    var root = stage.closest('.eye__layout');
    var items = Array.prototype.slice.call(root.querySelectorAll('.eye__item'));
    var pins = Array.prototype.slice.call(stage.querySelectorAll('.eye__pin'));
    var temp = stage.querySelector('.js-temp');
    var hint = stage.querySelector('.eye__hint');
    var callout = stage.querySelector('.eye__callout');
    var cTitle = stage.querySelector('.js-callout-title');
    var cTemp = stage.querySelector('.js-callout-temp');
    var foundEl = root.querySelector('.js-found');
    var meter = root.querySelector('.js-meter');
    var done = root.querySelector('.eye__done');
    var modeBtn = root.querySelector('.js-eye-mode');
    var spots = items.map(function (b) { return { x: parseFloat(b.dataset.x), y: parseFloat(b.dataset.y), t: parseFloat(b.dataset.t), name: b.querySelector('b').textContent }; });
    var found = spots.map(function () { return false; });
    var pos = { x: 50, y: 45 }, target = { x: 50, y: 45 };
    var animating = false, interacted = false, tourT = null, tourI = -1, hover = -1;

    pins.forEach(function (p, i) { p.style.setProperty('--px', spots[i].x + '%'); p.style.setProperty('--py', spots[i].y + '%'); });
    function radius() { return Math.max(52, Math.min(118, stage.clientWidth * 0.12)); }
    function apply() {
      stage.style.setProperty('--x', pos.x + '%');
      stage.style.setProperty('--y', pos.y + '%');
      stage.style.setProperty('--r', radius() + 'px');
    }
    function nearest(x, y) {
      // distance in screen-proportional units so it feels the same on any aspect ratio
      var w = stage.clientWidth || 1, h = stage.clientHeight || 1, best = -1, bd = 1e9;
      spots.forEach(function (s, i) {
        var dx = (x - s.x) / 100 * w, dy = (y - s.y) / 100 * h, d = Math.sqrt(dx * dx + dy * dy);
        if (d < bd) { bd = d; best = i; }
      });
      return { i: best, d: bd };
    }
    function select(i) { items.forEach(function (b, k) { b.setAttribute('aria-pressed', k === i ? 'true' : 'false'); }); }
    function markFound(i) {
      if (found[i]) return;
      found[i] = true;
      pins[i].classList.add('is-found');
      items[i].classList.add('is-found');
      var n = found.filter(Boolean).length;
      foundEl.textContent = n;
      meter.style.setProperty('--p', (n / spots.length * 100) + '%');
      if (n === spots.length) done.hidden = false;
    }
    function update() {
      var near = nearest(pos.x, pos.y);
      var r = radius();
      var t = near.d < r * 0.55 ? spots[near.i].t : 21.4 + Math.sin(pos.x * 0.21) * 0.6 + Math.cos(pos.y * 0.17) * 0.4;
      temp.textContent = t.toFixed(1) + '°C';
      if (near.d < r * 0.55) {
        if (hover !== near.i) { hover = near.i; select(near.i); }
        markFound(near.i);
        cTitle.textContent = spots[near.i].name;
        cTemp.textContent = spots[near.i].t.toFixed(1) + '°C';
        callout.hidden = false;
        callout.classList.toggle('is-left', pos.x > 58);
        callout.classList.toggle('is-low', pos.y < 30);
      } else { hover = -1; callout.hidden = true; }
    }
    function frame() {
      pos.x += (target.x - pos.x) * 0.2;
      pos.y += (target.y - pos.y) * 0.2;
      apply(); update();
      if (Math.abs(target.x - pos.x) > 0.04 || Math.abs(target.y - pos.y) > 0.04) window.requestAnimationFrame(frame);
      else animating = false;
    }
    function go(x, y) {
      target.x = Math.max(2, Math.min(98, x)); target.y = Math.max(3, Math.min(97, y));
      if (!animating) { animating = true; window.requestAnimationFrame(frame); }
    }
    function fromEvent(e) {
      var r = stage.getBoundingClientRect();
      return { x: (e.clientX - r.left) / r.width * 100, y: (e.clientY - r.top) / r.height * 100 };
    }
    function userMoved() {
      interacted = true; if (hint) hint.hidden = true;
      clearTimeout(tourT); tourT = setTimeout(tour, 9000);
    }
    var dragging = false;
    stage.addEventListener('pointermove', function (e) {
      if (e.pointerType === 'mouse' || dragging) { var p = fromEvent(e); go(p.x, p.y); userMoved(); }
    });
    stage.addEventListener('pointerdown', function (e) { dragging = true; var p = fromEvent(e); go(p.x, p.y); userMoved(); });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (ev) { stage.addEventListener(ev, function () { dragging = false; }); });
    items.forEach(function (b, i) {
      b.addEventListener('click', function () { select(i); go(spots[i].x, spots[i].y); userMoved(); markFound(i); });
    });
    modeBtn.addEventListener('click', function () {
      var on = !stage.classList.contains('is-full');
      stage.classList.toggle('is-full', on);
      modeBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
      modeBtn.textContent = on ? 'חזרה לעדשה' : 'מצב תרמי מלא';
      if (on) spots.forEach(function (s, i) { markFound(i); });
      callout.hidden = true;
    });
    function tour() {
      if (reduceMotion || doc.classList.contains('a11y-still') || stage.classList.contains('is-full')) return;
      var r = stage.getBoundingClientRect();
      if (r.bottom > 0 && r.top < window.innerHeight) {
        tourI = (tourI + 1) % spots.length;
        select(tourI); go(spots[tourI].x, spots[tourI].y);
      }
      tourT = setTimeout(tour, 3800);
    }
    // the idle tour must not count discoveries: guard markFound until the visitor interacts
    var realMark = markFound;
    markFound = function (i) { if (interacted) realMark(i); };
    window.addEventListener('resize', apply);
    apply(); update();
    tourT = setTimeout(tour, 2500);
  });

  /* ---------- planner: personal inspection timeline ---------- */
  var planner = document.getElementById('planner');
  if (planner) {
    var dateIn = document.getElementById('pl-date');
    var roomsIn = document.getElementById('pl-rooms');
    var stepsEl = planner.querySelector('.js-pl-steps');
    var daysEl = planner.querySelector('.js-pl-days');
    var daysLabel = planner.querySelector('.js-pl-days-label');
    var dateLabel = planner.querySelector('.js-pl-date-label');
    var waBtn = planner.querySelector('.js-pl-wa');
    var DAY = 864e5;
    var fmt = function (d) { try { return new Intl.DateTimeFormat('he-IL', { weekday: 'long', day: 'numeric', month: 'long' }).format(d); } catch (e) { return d.toLocaleDateString(); } };
    var addDays = function (d, n) { return new Date(d.getTime() + n * DAY); };
    var today = new Date(); today.setHours(0, 0, 0, 0);
    // default: three weeks from today
    var def = addDays(today, 21);
    dateIn.value = def.getFullYear() + '-' + String(def.getMonth() + 1).padStart(2, '0') + '-' + String(def.getDate()).padStart(2, '0');
    var TYPES = {
      new: { label: 'תאריך מסירת המפתח', event: 'מסירת המפתח', name: 'בדק בית לדירה חדשה' },
      used: { label: 'תאריך החתימה על החוזה', event: 'החתימה על החוזה', name: 'בדק בית לדירה יד 2' },
      after: { label: 'מתי נכנסתם לדירה?', event: 'הכניסה לדירה', name: 'חוות דעת על ליקויים אחרי הכניסה' }
    };
    function type() { var c = planner.querySelector('input[name="pl-type"]:checked'); return c ? c.value : 'new'; }
    function step(when, title, text, state) {
      var li = document.createElement('li');
      if (state) li.className = state;
      var t = document.createElement('time'); t.textContent = when;
      var b = document.createElement('b'); b.textContent = title;
      var p = document.createElement('span'); p.textContent = text;
      li.appendChild(t); li.appendChild(b); li.appendChild(p);
      return li;
    }
    function render() {
      var tp = type(), T = TYPES[tp];
      dateLabel.textContent = T.label;
      while (stepsEl.firstChild) stepsEl.removeChild(stepsEl.firstChild);
      var d = dateIn.value ? new Date(dateIn.value + 'T00:00:00') : null;
      if (!d || isNaN(d)) { daysEl.textContent = '—'; daysLabel.textContent = 'בחרו תאריך כדי לראות את לוח הזמנים'; return; }
      var diff = Math.round((d - today) / DAY);
      var list = [];
      if (tp === 'after') {
        var since = -diff;
        daysEl.textContent = since >= 0 ? since : 0;
        daysLabel.textContent = since >= 0 ? 'ימים מאז הכניסה לדירה' : 'התאריך עוד לא הגיע';
        list.push(step('היום', 'מתעדים ושולחים הודעה', 'צלמו את הליקויים ושלחו לדוד בוואטסאפ. כדאי לא לחכות, כדי לפעול בתוך תקופת הבדק והאחריות.', 'is-now'));
        list.push(step('בימים הקרובים', 'בדיקה הנדסית בנכס', 'בדיקה עם מכשור מתקדם, כולל מצלמה תרמית ומד לחות.'));
        list.push(step('ימים ספורים אחרי הבדיקה', 'חוות דעת מומחה', 'חוות דעת מסודרת עם תמונות, תקנים ואומדן עלויות, שאפשר להעביר לקבלן או להגיש לבית משפט.'));
        list.push(step('אחרי קבלת הדוח', 'דרישה בכתב לקבלן', 'מעבירים לקבלן את הדוח ודורשים תיקון. דוד מלווה אתכם גם בשלב הזה.'));
      } else {
        daysEl.textContent = diff >= 0 ? diff : 0;
        daysLabel.textContent = diff > 0 ? 'ימים עד ' + T.event : (diff === 0 ? T.event + ' היום' : 'התאריך כבר עבר');
        var inspect = addDays(d, tp === 'new' ? -3 : -7);
        var urgent = inspect <= today;
        list.push(step('היום', 'שולחים הודעה ומתאמים', urgent ? 'הזמן קצר. שלחו הודעה עכשיו ונשתדל לתאם בדיקה בהקדם.' : 'מתאמים מועד מראש, כדי שתהיה גמישות.', 'is-now'));
        list.push(step(urgent ? 'בהקדם האפשרי' : 'עד ' + fmt(inspect), 'בדיקה בנכס', tp === 'new' ? 'מומלץ לבדוק כמה ימים לפני המסירה, כדי להגיע אליה עם רשימת ליקויים מסודרת.' : 'מומלץ לבדוק לפחות שבוע לפני החתימה, כדי שיהיה זמן למשא ומתן.', urgent ? 'is-urgent' : ''));
        list.push(step(urgent ? 'ימים ספורים אחרי הבדיקה' : 'עד ' + fmt(addDays(inspect, 2)), 'הדוח אצלכם', 'דוח מפורט עם תמונות, הפניה לתקנים ואומדן עלויות תיקון.'));
        list.push(step(fmt(d), T.event, tp === 'new' ? 'מגיעים למסירה עם הדוח, ודורשים מהקבלן לתקן את הליקויים.' : 'חותמים כשאתם יודעים בדיוק מה קונים, אחרי משא ומתן על סמך עובדות.'));
      }
      list.forEach(function (li) { stepsEl.appendChild(li); });
      var msg = 'שלום דוד, הגעתי מהאתר. אני מעוניין/ת ב' + T.name + '. ' + T.label.replace('?', '') + ': ' + fmt(d) + '.' + (roomsIn.value ? ' מספר חדרים: ' + roomsIn.value + '.' : '');
      waBtn.href = 'https://wa.me/' + PHONE_WA + '?text=' + encodeURIComponent(msg);
    }
    Array.prototype.forEach.call(planner.querySelectorAll('input, select'), function (el) { el.addEventListener('change', render); el.addEventListener('input', render); });
    render();
  }

  /* ---------- timeline line draws in when visible ---------- */
  Array.prototype.forEach.call(document.querySelectorAll('.timeline'), function (tl) {
    if (reduceMotion || !('IntersectionObserver' in window)) return;
    tl.classList.add('js-draw');
    var o = new IntersectionObserver(function (en) { if (en[0].isIntersecting) { tl.classList.add('is-drawn'); o.disconnect(); } }, { threshold: 0.2 });
    o.observe(tl);
  });

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
  /* bubble level: a small physics gimmick – the bubble sways and settles back to centre */
  var level = $('.js-level');
  if (level) {
    var bubble = $('.level__bubble', level);
    var x = 0, v = 0, target = 0, lastY = window.scrollY, running = false, seen = false;
    var still = function () { return reduceMotion || doc.classList.contains('a11y-still'); };
    var maxX = function () { return Math.max(10, level.clientWidth / 2 - 24); };
    var step = function () {
      // spring towards the target, which itself relaxes back to 0 (level)
      target *= 0.94;
      v += (target - x) * 0.08;
      v *= 0.86;
      x += v;
      var m = maxX();
      if (x > m) { x = m; v *= -0.4; } else if (x < -m) { x = -m; v *= -0.4; }
      bubble.style.setProperty('--tilt', x.toFixed(2) + 'px');
      if (Math.abs(v) > 0.02 || Math.abs(x) > 0.05 || Math.abs(target) > 0.05) window.requestAnimationFrame(step);
      else { running = false; bubble.style.setProperty('--tilt', '0px'); }
    };
    var kick = function (dx) {
      if (still()) return;
      target = Math.max(-maxX(), Math.min(maxX(), target + dx));
      if (!running) { running = true; window.requestAnimationFrame(step); }
    };
    var inView = function () { var r = level.getBoundingClientRect(); return r.top < window.innerHeight && r.bottom > 0; };
    window.addEventListener('scroll', function () {
      var y = window.scrollY, dy = y - lastY; lastY = y;
      if (!inView()) return;
      if (!seen) { seen = true; kick(maxX() * 0.9); return; }
      kick(Math.max(-14, Math.min(14, dy * 0.35)));
    }, { passive: true });
    level.parentNode.addEventListener('pointermove', function (e) {
      var r = level.getBoundingClientRect();
      kick(((e.clientX - (r.left + r.width / 2)) / r.width) * 6);
    });
    level.parentNode.addEventListener('pointerdown', function () { kick((Math.random() > 0.5 ? 1 : -1) * maxX() * 0.8); });
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
