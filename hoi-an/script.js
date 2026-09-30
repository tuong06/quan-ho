/* Phố cổ Hội An — page behaviour (vanilla JS, no build step) */
(function () {
  'use strict';

  // Canonical public URL, used for the QR code when the page is not served from GitHub Pages.
  var SITE_URL = 'https://tuong06.github.io/quan-ho/hoi-an/';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var root = document.documentElement;
  var header = document.getElementById('site-header');
  var navList = document.getElementById('nav-list');
  var navLinks = Array.prototype.slice.call(navList.querySelectorAll('a'));
  var each = function (sel, fn, scope) { Array.prototype.forEach.call((scope || document).querySelectorAll(sel), fn); };

  function store(key, val) {
    try {
      if (val === undefined) return localStorage.getItem(key);
      localStorage.setItem(key, val);
    } catch (e) { /* private mode or blocked storage: the page works without it */ }
    return null;
  }
  function buzz(p) { if (navigator.vibrate) { try { navigator.vibrate(p); } catch (e) { /* ignore */ } } }

  /* ---------- toast ---------- */
  var toastEl = document.getElementById('toast');
  var toastTimer = null;
  function toast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('is-on'); }, 2600);
  }

  /* ---------- smooth scroll for in-page anchors ---------- */
  var srcDetails = document.getElementById('src-details');
  function scrollToId(id) {
    var el = document.getElementById(id);
    if (!el) return;
    if (srcDetails && id.indexOf('src-') === 0) srcDetails.open = true;
    var top = el.getBoundingClientRect().top + window.pageYOffset - (header.offsetHeight + 8);
    window.scrollTo({ top: id === 'top' ? 0 : top, behavior: reduceMotion ? 'auto' : 'smooth' });
    if (history.replaceState) history.replaceState(null, '', '#' + id);
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href^="#"]');
    if (!a) return;
    var id = a.getAttribute('href').slice(1);
    if (!id || !document.getElementById(id)) return;
    e.preventDefault();
    scrollToId(id);
    if (id !== 'top') {
      var target = document.getElementById(id);
      target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    }
  });
  if (srcDetails && /^#src-/.test(location.hash)) srcDetails.open = true;

  /* ---------- scroll progress + header state ---------- */
  var bar = document.getElementById('progress-bar');
  var darkZones = Array.prototype.slice.call(document.querySelectorAll('.hero, .section-dark, .closing'));
  var ticking = false;
  function onScroll() {
    ticking = false;
    var max = root.scrollHeight - window.innerHeight;
    bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(window.pageYOffset / max, 1) : 0) + ')';
    header.classList.toggle('is-scrolled', window.pageYOffset > 8);
    var probe = header.offsetHeight / 2;
    header.classList.toggle('on-dark', darkZones.some(function (z) {
      var r = z.getBoundingClientRect();
      return r.top <= probe && r.bottom >= probe;
    }));
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  onScroll();

  /* ---------- lantern-night mode (the page's own "Đêm phố cổ") ---------- */
  var nightButtons = Array.prototype.slice.call(document.querySelectorAll('[data-night-toggle]'));
  var nightListeners = [];
  function setNight(on, announce) {
    root.classList.toggle('night', on);
    nightButtons.forEach(function (b) {
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
      if (b.classList.contains('night-btn')) b.setAttribute('aria-label', on ? '등불 모드 끄기' : '등불 모드 켜기');
    });
    store('hoian-night', on ? '1' : '0');
    nightListeners.forEach(function (fn) { fn(on); });
    if (announce) toast(on ? '전등을 끄고 등불을 밝혔어요. 구시가지의 밤에 오신 것을 환영합니다.' : '전등을 다시 켰어요.');
  }
  nightButtons.forEach(function (b) {
    b.addEventListener('click', function () { setNight(!root.classList.contains('night'), true); buzz(20); });
  });
  setNight(root.classList.contains('night'), false);

  /* ---------- table-of-contents sheet (phones / tablets) ---------- */
  (function () {
    var btn = document.getElementById('menu-btn');
    var sheet = document.getElementById('menu-sheet');
    var close = document.getElementById('menu-close');
    if (!btn || !sheet) return;
    function open() {
      sheet.hidden = false;
      document.body.classList.add('menu-open');
      btn.setAttribute('aria-expanded', 'true');
      var cur = sheet.querySelector('a.is-active') || sheet.querySelector('a');
      if (cur) cur.focus({ preventScroll: true });
    }
    function shut(restore) {
      if (sheet.hidden) return;
      sheet.hidden = true;
      document.body.classList.remove('menu-open');
      btn.setAttribute('aria-expanded', 'false');
      if (restore) btn.focus({ preventScroll: true });
    }
    btn.addEventListener('click', open);
    close.addEventListener('click', function () { shut(true); });
    sheet.addEventListener('keydown', function (e) { if (e.key === 'Escape') shut(true); });
    sheet.addEventListener('click', function (e) { if (e.target.closest('a')) shut(false); }, true);
    window.addEventListener('resize', function () { if (window.innerWidth >= 900) shut(false); });
  })();

  /* ---------- count-up + scroll reveal ---------- */
  function countUp(el) {
    var to = parseInt(el.getAttribute('data-to'), 10);
    var plain = el.hasAttribute('data-plain');
    var fmt = function (n) { return plain ? String(n) : n.toLocaleString('ko-KR'); };
    if (reduceMotion || isNaN(to)) { el.textContent = fmt(to); return; }
    var from = plain ? Math.max(to - 40, 0) : 0;
    var dur = 1200, start = null;
    function step(t) {
      if (start === null) start = t;
      var p = Math.min((t - start) / dur, 1);
      el.textContent = fmt(Math.round(from + (to - from) * (1 - Math.pow(1 - p, 3))));
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  var revealEls = Array.prototype.slice.call(document.querySelectorAll('.reveal'));
  function reveal(el) {
    el.classList.add('is-visible');
    each('.count', countUp, el);
  }
  if ('IntersectionObserver' in window) {
    var revealObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var siblings = el.parentElement ? el.parentElement.querySelectorAll(':scope > .reveal') : [];
        var idx = Array.prototype.indexOf.call(siblings, el);
        el.style.transitionDelay = reduceMotion ? '0ms' : Math.min(Math.max(idx, 0) * 70, 350) + 'ms';
        reveal(el);
        revealObs.unobserve(el);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    revealEls.forEach(function (el) { revealObs.observe(el); });
  } else {
    revealEls.forEach(reveal);
  }

  /* ---------- active nav link + chapter counter ---------- */
  var sections = navLinks.map(function (a) { return document.getElementById(a.getAttribute('href').slice(1)); }).filter(Boolean);
  var chapterEl = document.getElementById('chapter');
  var menuLinks = Array.prototype.slice.call(document.querySelectorAll('.menu-list a'));
  function setChapter(id) {
    var s = id ? document.querySelector('.menu-list a[href="#' + id + '"] span') : null;
    var n = s && /^\d\d$/.test(s.textContent) ? s.textContent : (id === 'sources' ? '11' : '00');
    if (chapterEl) chapterEl.firstChild.textContent = n;
    menuLinks.forEach(function (l) { l.classList.toggle('is-active', l.getAttribute('href') === '#' + id); });
  }
  function setActive(id) {
    setChapter(id);
    navLinks.forEach(function (a) {
      var on = a.getAttribute('href') === '#' + id;
      a.classList.toggle('is-active', on);
      if (on) {
        a.setAttribute('aria-current', 'true');
        navList.scrollTo({ left: a.offsetLeft - (navList.clientWidth - a.offsetWidth) / 2, behavior: reduceMotion ? 'auto' : 'smooth' });
      } else {
        a.removeAttribute('aria-current');
      }
    });
  }
  if ('IntersectionObserver' in window) {
    var visible = {};
    var navObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { visible[e.target.id] = e.isIntersecting; });
      var current = null;
      for (var i = 0; i < sections.length; i++) { if (visible[sections[i].id]) { current = sections[i].id; break; } }
      if (current) setActive(current);
      else if (window.pageYOffset < window.innerHeight) {
        navLinks.forEach(function (a) { a.classList.remove('is-active'); a.removeAttribute('aria-current'); });
        setChapter(null);
        navList.scrollTo({ left: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
      }
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(function (s) { navObs.observe(s); });
  }

  /* ---------- pronunciation (Web Speech API, vi-VN) ---------- */
  var synth = window.speechSynthesis;
  var viVoice = null;
  var warnedNoVoice = false;
  function pickVoice() {
    if (!synth) return;
    viVoice = (synth.getVoices() || []).filter(function (v) { return /^vi(-|_|$)/i.test(v.lang); })[0] || null;
  }
  if (synth) {
    pickVoice();
    if (typeof synth.addEventListener === 'function') synth.addEventListener('voiceschanged', pickVoice);
    else synth.onvoiceschanged = pickVoice;
  }
  var speakingEl = null;
  function say(text, el) {
    if (!synth || typeof window.SpeechSynthesisUtterance !== 'function') {
      toast('이 브라우저는 음성 재생을 지원하지 않습니다.');
      return;
    }
    synth.cancel();
    if (speakingEl) speakingEl.classList.remove('is-speaking');
    var u = new SpeechSynthesisUtterance(text);
    u.lang = 'vi-VN';
    u.rate = 0.8;
    if (!viVoice) pickVoice();
    if (viVoice) u.voice = viVoice;
    else if (!warnedNoVoice) {
      warnedNoVoice = true;
      toast('기기에 베트남어 음성이 없으면 발음이 부정확할 수 있어요.');
    }
    speakingEl = el || null;
    if (el) el.classList.add('is-speaking');
    var clear = function () { if (el) el.classList.remove('is-speaking'); };
    u.onend = clear;
    u.onerror = clear;
    synth.speak(u);
  }
  var SPEAKER = '<svg class="say-ico" viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4zm12.5 3a4.5 4.5 0 0 0-2.5-4v8a4.5 4.5 0 0 0 2.5-4z" fill="currentColor"/></svg>';
  each('.pron span:not(.pron-label)', function (chip) {
    var b = chip.querySelector('b[lang="vi"]');
    if (!b) return;
    chip.setAttribute('data-say', b.textContent.trim());
    chip.insertAdjacentHTML('beforeend', SPEAKER);
  });
  each('.pron-label', function (l) { l.insertAdjacentHTML('beforeend', '<small>탭하여 듣기</small>'); });
  each('[data-say]', function (el) {
    if (el.tagName !== 'BUTTON') {
      el.setAttribute('role', 'button');
      el.setAttribute('tabindex', '0');
      if (!el.hasAttribute('aria-label')) el.setAttribute('aria-label', el.getAttribute('data-say') + ' 발음 듣기');
      el.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); say(el.getAttribute('data-say'), el); }
      });
    } else if (!el.hasAttribute('aria-label')) {
      el.setAttribute('aria-label', el.getAttribute('data-say') + ' 발음 듣기');
    }
    el.addEventListener('click', function () { say(el.getAttribute('data-say'), el); });
  });

  /* ---------- 03 history: era slider ---------- */
  (function () {
    var steps = Array.prototype.slice.call(document.querySelectorAll('.era-step'));
    var range = document.getElementById('era-range');
    var prev = document.getElementById('era-prev');
    var next = document.getElementById('era-next');
    var ticks = Array.prototype.slice.call(document.querySelectorAll('.era-ticks span'));
    var ships = Array.prototype.slice.call(document.querySelectorAll('.era-port .ship'));
    if (!steps.length || !range) return;
    var cur = 0;
    function go(i) {
      cur = Math.max(0, Math.min(steps.length - 1, i));
      steps.forEach(function (s, k) {
        var on = k === cur;
        s.classList.toggle('is-on', on);
        s.setAttribute('aria-hidden', on ? 'false' : 'true');
      });
      ticks.forEach(function (t, k) { t.classList.toggle('is-on', k === cur); });
      range.value = String(cur);
      range.setAttribute('aria-valuetext', steps[cur].querySelector('.era-when').textContent + ' · ' + steps[cur].querySelector('h3').textContent);
      var pos = document.getElementById('era-pos');
      if (pos) pos.textContent = (cur + 1) + ' / ' + steps.length;
      prev.disabled = cur === 0;
      next.disabled = cur === steps.length - 1;
      var n = parseInt(steps[cur].getAttribute('data-ships'), 10) || 0;
      ships.forEach(function (sh) { sh.classList.toggle('is-on', parseInt(sh.getAttribute('data-i'), 10) <= n); });
    }
    range.addEventListener('input', function () { go(parseInt(range.value, 10)); });
    prev.addEventListener('click', function () { go(cur - 1); });
    next.addEventListener('click', function () { go(cur + 1); });
    var list = document.getElementById('era-list');
    var x0 = null;
    list.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    list.addEventListener('touchend', function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0;
      x0 = null;
      if (Math.abs(dx) > 50) go(cur + (dx < 0 ? 1 : -1));
    });
    go(0);
  })();

  /* ---------- 04 house cross-section ---------- */
  (function () {
    var house = document.getElementById('house-tour');
    if (!house) return;
    var hots = Array.prototype.slice.call(house.querySelectorAll('.hot'));
    var infos = Array.prototype.slice.call(house.querySelectorAll('.hi'));
    function select(n) {
      house.setAttribute('data-active', n);
      hots.forEach(function (h) { h.setAttribute('aria-pressed', h.getAttribute('data-area') === n ? 'true' : 'false'); });
      infos.forEach(function (d) { d.hidden = d.getAttribute('data-area') !== n; });
    }
    hots.forEach(function (h) {
      h.addEventListener('click', function () { select(h.getAttribute('data-area')); buzz(10); });
    });
    select('1');
  })();

  /* ---------- 06 next "Đêm phố cổ" (lunar 14th), Vietnamese lunar calendar, UTC+7 ---------- */
  var Lunar = (function () {
    var PI = Math.PI, TZ = 7;
    function INT(d) { return Math.floor(d); }
    function jdFromDate(dd, mm, yy) {
      var a = INT((14 - mm) / 12), y = yy + 4800 - a, m = mm + 12 * a - 3;
      var jd = dd + INT((153 * m + 2) / 5) + 365 * y + INT(y / 4) - INT(y / 100) + INT(y / 400) - 32045;
      if (jd < 2299161) jd = dd + INT((153 * m + 2) / 5) + 365 * y + INT(y / 4) - 32083;
      return jd;
    }
    function newMoon(k) {
      var T = k / 1236.85, T2 = T * T, T3 = T2 * T, dr = PI / 180;
      var jd1 = 2415020.75933 + 29.53058868 * k + 0.0001178 * T2 - 0.000000155 * T3;
      jd1 += 0.00033 * Math.sin((166.56 + 132.87 * T - 0.009173 * T2) * dr);
      var M = 359.2242 + 29.10535608 * k - 0.0000333 * T2 - 0.00000347 * T3;
      var Mpr = 306.0253 + 385.81691806 * k + 0.0107306 * T2 + 0.00001236 * T3;
      var F = 21.2964 + 390.67050646 * k - 0.0016528 * T2 - 0.00000239 * T3;
      var C1 = (0.1734 - 0.000393 * T) * Math.sin(M * dr) + 0.0021 * Math.sin(2 * dr * M);
      C1 = C1 - 0.4068 * Math.sin(Mpr * dr) + 0.0161 * Math.sin(dr * 2 * Mpr);
      C1 = C1 - 0.0004 * Math.sin(dr * 3 * Mpr);
      C1 = C1 + 0.0104 * Math.sin(dr * 2 * F) - 0.0051 * Math.sin(dr * (M + Mpr));
      C1 = C1 - 0.0074 * Math.sin(dr * (M - Mpr)) + 0.0004 * Math.sin(dr * (2 * F + M));
      C1 = C1 - 0.0004 * Math.sin(dr * (2 * F - M)) - 0.0006 * Math.sin(dr * (2 * F + Mpr));
      C1 = C1 + 0.0010 * Math.sin(dr * (2 * F - Mpr)) + 0.0005 * Math.sin(dr * (2 * Mpr + M));
      var deltat = T < -11
        ? 0.001 + 0.000839 * T + 0.0002261 * T2 - 0.00000845 * T3 - 0.000000081 * T * T3
        : -0.000278 + 0.000265 * T + 0.000262 * T2;
      return jd1 + C1 - deltat;
    }
    function sunLongitude(jdn) {
      var T = (jdn - 2451545.0) / 36525, T2 = T * T, dr = PI / 180;
      var M = 357.52910 + 35999.05030 * T - 0.0001559 * T2 - 0.00000048 * T * T2;
      var L0 = 280.46645 + 36000.76983 * T + 0.0003032 * T2;
      var DL = (1.914600 - 0.004817 * T - 0.000014 * T2) * Math.sin(dr * M);
      DL += (0.019993 - 0.000101 * T) * Math.sin(dr * 2 * M) + 0.000290 * Math.sin(dr * 3 * M);
      var L = (L0 + DL) * dr;
      return L - PI * 2 * INT(L / (PI * 2));
    }
    function sunSector(dayNumber) { return INT(sunLongitude(dayNumber - 0.5 - TZ / 24) / PI * 6); }
    function newMoonDay(k) { return INT(newMoon(k) + 0.5 + TZ / 24); }
    function lunarMonth11(yy) {
      var k = INT((jdFromDate(31, 12, yy) - 2415021) / 29.530588853);
      var nm = newMoonDay(k);
      return sunSector(nm) >= 9 ? newMoonDay(k - 1) : nm;
    }
    function leapMonthOffset(a11) {
      var k = INT((a11 - 2415021.076998695) / 29.530588853 + 0.5), last, i = 1;
      var arc = sunSector(newMoonDay(k + i));
      do { last = arc; i++; arc = sunSector(newMoonDay(k + i)); } while (arc !== last && i < 14);
      return i - 1;
    }
    function fromSolar(dd, mm, yy) {
      var dayNumber = jdFromDate(dd, mm, yy), k = INT((dayNumber - 2415021.076998695) / 29.530588853);
      var monthStart = newMoonDay(k + 1);
      if (monthStart > dayNumber) monthStart = newMoonDay(k);
      var a11 = lunarMonth11(yy), b11 = a11;
      if (a11 >= monthStart) a11 = lunarMonth11(yy - 1);
      else b11 = lunarMonth11(yy + 1);
      var day = dayNumber - monthStart + 1, diff = INT((monthStart - a11) / 29), leap = false, month = diff + 11;
      if (b11 - a11 > 365) {
        var leapDiff = leapMonthOffset(a11);
        if (diff >= leapDiff) { month = diff + 10; leap = diff === leapDiff; }
      }
      if (month > 12) month -= 12;
      return { day: day, month: month, leap: leap };
    }
    return { fromSolar: fromSolar };
  })();
  (function () {
    var dday = document.getElementById('moon-dday');
    var date = document.getElementById('moon-date');
    if (!dday) return;
    var now = new Date();
    var d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    for (var i = 0; i < 62; i++) {
      var l = Lunar.fromSolar(d.getDate(), d.getMonth() + 1, d.getFullYear());
      if (l.day === 14) {
        dday.textContent = i === 0 ? '오늘 밤!' : 'D-' + i;
        date.textContent = d.getFullYear() + '년 ' + (d.getMonth() + 1) + '월 ' + d.getDate() + '일 · 음력 ' +
          (l.leap ? '윤' : '') + l.month + '월 14일';
        return;
      }
      d.setDate(d.getDate() + 1);
    }
  })();

  /* ---------- 06 lantern workshop + wishes on the river ---------- */
  (function () {
    var preview = document.getElementById('ws-preview');
    var light = document.getElementById('ws-light');
    var form = document.getElementById('wish-form');
    var input = document.getElementById('wish-text');
    var strip = document.getElementById('river-strip');
    var countEl = document.getElementById('river-count');
    if (!preview) return;
    each('input[name="ws-shape"]', function (r) {
      r.addEventListener('change', function () { preview.setAttribute('data-shape', r.value); });
    });
    each('input[name="ws-color"]', function (r) {
      r.addEventListener('change', function () { preview.style.color = r.value; });
    });
    function setLit(on) {
      preview.classList.toggle('is-lit', on);
      light.setAttribute('aria-pressed', on ? 'true' : 'false');
      light.textContent = on ? '불 끄기' : '③ 불 켜기';
    }
    light.addEventListener('click', function () { setLit(!preview.classList.contains('is-lit')); buzz(15); });

    var count = parseInt(store('hoian-wishes'), 10) || 0;
    function showCount() { countEl.textContent = count ? '이 기기에서 띄운 꽃등 ' + count + '개' : '강물이 소원을 기다려요'; }
    showCount();
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var text = (input.value || '').trim().slice(0, 24) || '모두 평안하기를';
      var boat = document.createElement('div');
      boat.className = 'wish-float';
      boat.style.setProperty('--w', strip.clientWidth + 'px');
      boat.style.top = (16 + Math.random() * 30) + 'px';
      boat.innerHTML = '<svg viewBox="-24 -30 48 40" aria-hidden="true"><use href="#hd"/></svg>';
      var label = document.createElement('span');
      label.textContent = text;
      boat.appendChild(label);
      strip.appendChild(boat);
      var done = function () { if (boat.parentNode) boat.parentNode.removeChild(boat); };
      boat.addEventListener('animationend', done);
      setTimeout(done, reduceMotion ? 4000 : 17000);
      if (!preview.classList.contains('is-lit')) setLit(true);
      input.value = '';
      count++;
      store('hoian-wishes', String(count));
      showCount();
      buzz([20, 40, 20]);
    });
  })();

  /* ---------- 07 food flip cards ---------- */
  each('.food', function (card) {
    card.addEventListener('click', function () {
      card.setAttribute('aria-pressed', card.getAttribute('aria-pressed') === 'true' ? 'false' : 'true');
    });
  });

  /* ---------- 08 flood slider ---------- */
  (function () {
    var range = document.getElementById('flood-range');
    var water = document.getElementById('flood-water');
    var out = document.getElementById('flood-out');
    if (!range) return;
    var PX_PER_M = 50, GROUND = 230;
    function text(v) {
      if (v === 0) return '평소의 거리';
      if (v < 0.3) return '길바닥에 물이 고인다';
      if (v < 0.8) return '무릎 높이 — 걷기가 힘들다';
      if (v < 1.3) return '허리 높이 — 1층 가게가 잠기기 시작한다';
      if (v < 1.8) return '어른 키에 가까운 깊이 — 1층 대부분이 잠긴다';
      if (v <= 2.1) return '어른 키를 넘는다 — 2025년 10월 내원교 일대와 비슷한 깊이';
      return '1층이 완전히 잠기고 2층까지 물이 차오른다';
    }
    function update() {
      var v = Math.round(parseFloat(range.value) * 10) / 10;
      water.setAttribute('y', String(GROUND - v * PX_PER_M));
      water.setAttribute('height', String(v * PX_PER_M));
      var t = text(v);
      out.innerHTML = '<b>' + v.toFixed(1) + 'm</b> — ' + t;
      range.setAttribute('aria-valuetext', v.toFixed(1) + '미터, ' + t);
    }
    range.addEventListener('input', update);
    update();
  })();

  /* ---------- QR code + share + copy link ---------- */
  function pageUrl() {
    if (/\.github\.io$/.test(location.hostname)) return location.origin + location.pathname.replace(/index\.html$/, '');
    return SITE_URL;
  }
  var url = pageUrl();
  var qrBox = document.getElementById('qr');
  var qrLink = document.getElementById('qr-url');
  qrLink.href = url;
  qrLink.textContent = '';
  url.replace(/^https?:\/\//, '').replace(/\/$/, '').split('/').forEach(function (part, i) {
    if (i) { qrLink.appendChild(document.createElement('wbr')); qrLink.appendChild(document.createTextNode('/')); }
    var seg = document.createElement('span');
    seg.className = 'url-seg';
    seg.textContent = part;
    qrLink.appendChild(seg);
  });
  if (typeof window.qrcode === 'function') {
    var qr = window.qrcode(0, 'M');
    qr.addData(url);
    qr.make();
    qrBox.innerHTML = qr.createSvgTag({ cellSize: 4, margin: 0, scalable: true });
    var path = qrBox.querySelector('path');
    if (path) path.setAttribute('fill', '#121A24');
  }
  var shareBtn = document.getElementById('share-btn');
  if (shareBtn && navigator.share) {
    shareBtn.hidden = false;
    shareBtn.addEventListener('click', function () {
      navigator.share({ title: document.title, text: 'Phố cổ Hội An · 호이안 고대 도시 발표 자료', url: url })
        .catch(function () { /* user cancelled */ });
    });
  }
  var copyBtn = document.getElementById('copy-url');
  copyBtn.addEventListener('click', function () {
    var done = function () { copyBtn.textContent = '복사됨 ✓'; setTimeout(function () { copyBtn.textContent = '링크 복사'; }, 1800); };
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(url).then(done, function () { window.prompt('링크를 복사하세요', url); });
    } else {
      window.prompt('링크를 복사하세요', url);
    }
  });

  /* ---------- 10 quiz ---------- */
  var QUIZ = [
    { q: '호이안 고대 도시가 유네스코 세계문화유산이 된 해는?', opts: ['1985년', '1993년', '1999년', '2009년'], a: 2,
      exp: '1999년 12월 4일, 마라케시 제23차 세계유산위원회에서 등재되었다. 1985년은 베트남 국가 문화유적 지정 연도다.', link: '#intro' },
    { q: '호이안과 같은 날 세계유산이 된 베트남 유적은?', opts: ['하롱베이', '미선 유적', '후에 기념물 단지', '짱안 경관 단지'], a: 1,
      exp: '참파 왕국의 성지 미선(Mỹ Sơn) 유적도 1999년 12월 4일에 함께 등재되었다.', link: '#place' },
    { q: '내원교(Chùa Cầu)가 그려진 베트남 지폐는?', opts: ['1만 동', '2만 동', '5만 동', '10만 동'], a: 1,
      exp: '내원교는 20,000동 지폐에 그려져 있다.', link: '#spots' },
    { q: 'O / X — ‘구시가지의 밤(Đêm phố cổ)’은 음력 매월 14일 밤에 열린다.', opts: ['O', 'X'], a: 0, ox: true,
      exp: '1998년부터 음력 매월 14일 밤, 등불을 밝히고 강에 꽃등을 띄운다.', link: '#lantern' },
    { q: '호이안 전통 가옥 ‘냐 옹(nhà ống)’의 특징은?', opts: ['폭이 넓고 얕다', '폭이 좁고 안쪽으로 깊다', '둥근 초가지붕을 얹는다', '지하에 창고를 둔다'], a: 1,
      exp: '앞은 가게, 가운데는 안뜰, 뒤는 살림집이 이어지는 좁고 깊은 집이다.', link: '#house' },
    { q: '호이안이 무역항으로서 쇠퇴한 이유가 아닌 것은?', opts: ['강 하구에 토사가 쌓였다', '프랑스가 다낭을 항구로 택했다', '큰 배가 드나들기 어려워졌다', '큰 지진으로 도시가 무너졌다'], a: 3,
      exp: '토사 퇴적과 다낭으로의 항구 이동이 원인이었다. 개발에서 비껴난 덕분에 옛 거리가 남았다.', link: '#history' },
    { q: '호이안에서도 공연되는 바이 쪼이(Bài Chòi)가 인류무형문화유산으로 등재된 곳은?', opts: ['하노이', '파리', '제주', '마라케시'], a: 2,
      exp: '2017년 12월 7일, 제주에서 열린 제12차 무형유산 정부간위원회에서 등재되었다.', link: '#lantern' }
  ];
  var GRADES = [
    { min: 7, title: '호이안 명예 주민', msg: '만점! 호이안의 등불처럼 빛나는 실력이에요.' },
    { min: 5, title: '호이안 가이드', msg: '훌륭해요. 친구에게 구시가지를 안내해 줄 수 있겠어요.' },
    { min: 3, title: '호이안 여행자', msg: '좋은 출발이에요. 틀린 문제의 내용을 다시 확인해 볼까요?' },
    { min: 0, title: '호이안 새내기', msg: '괜찮아요. 페이지를 한 번 더 둘러보고 다시 도전해 보세요.' }
  ];
  var quizEl = document.getElementById('quiz-app');
  var qi = 0, score = 0, answers = [];
  function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function renderQ() {
    var item = QUIZ[qi];
    var html =
      '<div class="quiz-top"><span class="quiz-count">문제 <b>' + (qi + 1) + '</b> / ' + QUIZ.length + '</span>' +
      '<span class="quiz-score">점수 ' + score + '</span></div>' +
      '<div class="quiz-segs" aria-hidden="true">' + QUIZ.map(function (_, k) {
        return '<i class="' + (k < qi ? 'done' : k === qi ? 'now' : '') + '"></i>';
      }).join('') + '</div>' +
      '<span class="quiz-qno" aria-hidden="true">Q' + (qi + 1) + '</span>' +
      '<h3 class="quiz-q" tabindex="-1">' + esc(item.q) + '</h3>' +
      '<div class="quiz-opts' + (item.ox ? ' is-ox' : '') + '">';
    item.opts.forEach(function (o, i) {
      html += '<button type="button" class="quiz-opt" data-i="' + i + '"><span class="quiz-key">' +
        (item.ox ? '' : String.fromCharCode(65 + i)) + '</span><span>' + esc(o) + '</span></button>';
    });
    html += '</div><div class="quiz-feedback" aria-live="polite"></div>';
    quizEl.innerHTML = html;
    each('.quiz-opt', function (btn) {
      btn.addEventListener('click', function () { answer(+btn.getAttribute('data-i')); });
    }, quizEl);
  }
  function answer(i) {
    var item = QUIZ[qi];
    var ok = i === item.a;
    if (ok) score++;
    answers.push(ok);
    buzz(ok ? 25 : [60, 50, 60]);
    each('.quiz-opt', function (btn) {
      var bi = +btn.getAttribute('data-i');
      btn.disabled = true;
      if (bi === item.a) btn.classList.add('is-correct');
      else if (bi === i) btn.classList.add('is-wrong');
    }, quizEl);
    quizEl.querySelector('.quiz-score').textContent = '점수 ' + score;
    var last = qi === QUIZ.length - 1;
    var fb = quizEl.querySelector('.quiz-feedback');
    fb.className = 'quiz-feedback ' + (ok ? 'ok' : 'no');
    fb.innerHTML =
      '<p class="quiz-verdict">' + (ok ? '정답!' : '아쉬워요') + '</p>' +
      '<p>' + esc(item.exp) + '</p>' +
      '<div class="quiz-actions"><a class="link-btn" href="' + item.link + '">관련 내용 보기</a>' +
      '<button type="button" class="btn-primary quiz-next">' + (last ? '결과 보기' : '다음 문제') + '</button></div>';
    fb.querySelector('.quiz-next').addEventListener('click', function () {
      qi++;
      if (qi < QUIZ.length) renderQ(); else renderResult();
      var h = quizEl.querySelector('.quiz-q, .quiz-result-title');
      if (h) h.focus({ preventScroll: true });
      var top = quizEl.getBoundingClientRect().top;
      if (top < header.offsetHeight || top > window.innerHeight * 0.5) scrollToId('quiz');
    });
    fb.scrollIntoView({ block: 'nearest', behavior: reduceMotion ? 'auto' : 'smooth' });
  }
  function renderResult() {
    var g = GRADES.filter(function (x) { return score >= x.min; })[0];
    var dots = answers.map(function (ok, i) {
      return '<li class="' + (ok ? 'ok' : 'no') + '" title="' + (i + 1) + '번 ' + (ok ? '정답' : '오답') + '">' + (i + 1) + '</li>';
    }).join('');
    quizEl.innerHTML =
      '<div class="quiz-result">' +
      '<div class="quiz-ring" style="--p:' + (score / QUIZ.length) + '"><span><b>' + score + '</b>/' + QUIZ.length + '</span></div>' +
      '<p class="quiz-grade-label">나의 등급</p>' +
      '<h3 class="quiz-result-title" tabindex="-1">' + esc(g.title) + '</h3>' +
      '<p class="quiz-msg">' + esc(g.msg) + '</p>' +
      '<ol class="quiz-dots" aria-label="문항별 결과">' + dots + '</ol>' +
      '<button type="button" class="btn-primary quiz-retry">다시 풀기</button>' +
      '</div>';
    buzz(score === QUIZ.length ? [40, 60, 40, 60, 120] : 40);
    if (score === QUIZ.length) lanternRain();
    quizEl.querySelector('.quiz-retry').addEventListener('click', function () {
      qi = 0; score = 0; answers = []; renderQ();
      quizEl.querySelector('.quiz-q').focus({ preventScroll: true });
    });
  }
  function lanternRain() {
    if (reduceMotion) return;
    var box = document.createElement('div');
    box.className = 'confetti';
    box.setAttribute('aria-hidden', 'true');
    var colors = ['#C9382E', '#F2B233', '#E8762B', '#8E4BA8', '#2F8F8A', '#D9486E'];
    for (var i = 0; i < 36; i++) {
      var s = document.createElement('i');
      s.style.left = Math.random() * 100 + '%';
      s.style.background = colors[i % colors.length];
      s.style.animationDelay = Math.random() * 0.5 + 's';
      s.style.animationDuration = 1.8 + Math.random() * 1.4 + 's';
      box.appendChild(s);
    }
    quizEl.appendChild(box);
    setTimeout(function () { if (box.parentNode) box.parentNode.removeChild(box); }, 3600);
  }
  if (quizEl) renderQ();

  /* ---------- floating quiz button ---------- */
  (function () {
    var fab = document.getElementById('quiz-fab');
    if (!fab) return;
    var hideZones = [document.querySelector('.hero'), document.getElementById('quiz'), document.getElementById('closing'), document.getElementById('sources')].filter(Boolean);
    var tick = false;
    function update() {
      tick = false;
      var vh = window.innerHeight;
      fab.classList.toggle('is-on', !hideZones.some(function (z) {
        var r = z.getBoundingClientRect();
        return r.top < vh * 0.85 && r.bottom > vh * 0.15;
      }));
    }
    window.addEventListener('scroll', function () { if (!tick) { tick = true; requestAnimationFrame(update); } }, { passive: true });
    window.addEventListener('resize', update);
    update();
  })();

  /* ---------- 02 Leaflet map ---------- */
  initMap();

  function initMap() {
    var mapEl = document.getElementById('map');
    if (!mapEl) return;
    if (typeof window.L === 'undefined') {
      mapEl.innerHTML = '<p class="map-fallback">지도를 불러오지 못했습니다.</p>';
      return;
    }
    var L = window.L;
    var COLORS = { town: '#B8322A', near: '#1F5C66', ref: '#8A8178' };
    var KIND = { town: '호이안 구시가지', near: '주변 유산', ref: '참고 지점' };

    // Chùa Cầu uses its published coordinates; the other points are representative
    // coordinates of a whole site (an island group, a temple complex, a city centre).
    var PLACES = [
      { id: 'chuacau', kind: 'town', ko: '내원교', vi: 'Chùa Cầu', lat: 15.87707, lng: 108.32601, zoom: 16,
        desc: '구시가지의 상징. 1719년 ‘래원교(來遠橋)’라는 이름을 받았다.', note: '공개된 정확한 좌표' },
      { id: 'oldtown', kind: 'town', ko: '구시가지', vi: 'Phố cổ Hội An', lat: 15.8773, lng: 108.3290, zoom: 15, zone: 420,
        desc: '보호 구역 30ha · 목조 건축물 1,107채', note: '원은 위치를 알려 주는 개략 표시' },
      { id: 'culaocham', kind: 'near', ko: '꾸라오짬', vi: 'Cù Lao Chàm', lat: 15.95411, lng: 108.52239, zoom: 12,
        desc: '2009년 5월 26일 ‘꾸라오짬–호이안’ 세계 생물권보전지역으로 지정되었다.', note: '섬 무리의 대표 좌표' },
      { id: 'myson', kind: 'near', ko: '미선 유적', vi: 'Mỹ Sơn', lat: 15.763, lng: 108.126, zoom: 13,
        desc: '참파 왕국의 힌두 성지. 1999년 12월 4일 호이안과 같은 날 세계유산이 되었다.', note: '유적 단지의 대표 좌표' },
      { id: 'danang', kind: 'ref', ko: '다낭 시내', vi: 'Đà Nẵng', lat: 16.0544, lng: 108.2022, zoom: 12,
        desc: '위치 참고 · 호이안에서 북쪽으로 약 30km', note: '도시 중심의 대표 좌표' }
    ];

    var coarse = window.matchMedia('(pointer: coarse)').matches;
    var map = L.map(mapEl, { scrollWheelZoom: false, dragging: !coarse, tap: false, zoomSnap: 0.25 });
    var TILE_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';
    var tiles = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', { subdomains: 'abcd', maxZoom: 19, attribution: TILE_ATTR }).addTo(map);
    function tileUrl(on) {
      return on ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
                : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
    }
    tiles.setUrl(tileUrl(root.classList.contains('night')));
    nightListeners.push(function (on) { tiles.setUrl(tileUrl(on)); });

    var layers = { town: L.layerGroup().addTo(map), near: L.layerGroup().addTo(map), ref: L.layerGroup().addTo(map) };
    var markers = {};
    var listEl = document.getElementById('map-list');

    PLACES.forEach(function (p) {
      var ll = [p.lat, p.lng];
      if (p.zone) {
        L.circle(ll, { radius: p.zone, color: COLORS.town, weight: 2, dashArray: '6 6', fillColor: COLORS.town, fillOpacity: 0.12 }).addTo(layers[p.kind]);
      }
      var isRef = p.kind === 'ref';
      var m = L.circleMarker(ll, { radius: isRef ? 6 : 9, color: '#fff', weight: 2.5, fillColor: COLORS[p.kind], fillOpacity: 1 }).addTo(layers[p.kind]);
      m.bindTooltip(p.ko, { direction: 'top', offset: [0, -10], className: 'tt ' + p.kind, permanent: p.id !== 'oldtown' && !isRef });
      m.bindPopup(
        '<span class="pop-kind ' + p.kind + '">' + KIND[p.kind] + '</span>' +
        '<p class="pop-title">' + p.ko + '</p>' +
        '<p class="pop-vi" lang="vi">' + p.vi + '</p>' +
        '<p class="pop-desc">' + p.desc + '</p>' +
        '<p class="pop-note">' + p.note + '</p>'
      );
      m.on('popupopen', function () { markActive(p.id); });
      markers[p.id] = m;

      var li = document.createElement('li');
      li.setAttribute('data-kind', p.kind);
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'ml-' + p.kind;
      btn.setAttribute('data-id', p.id);
      btn.innerHTML = '<b>' + p.ko + '</b><span lang="vi">' + p.vi + '</span><span>' + p.desc + '</span>';
      btn.addEventListener('click', function () { focusPlace(p.id); });
      li.appendChild(btn);
      listEl.appendChild(li);
    });

    function markActive(id) {
      each('button', function (b) {
        var on = b.getAttribute('data-id') === id;
        b.classList.toggle('is-active', on);
        if (on && listEl.scrollWidth > listEl.clientWidth) {
          var li = b.parentNode;
          listEl.scrollTo({ left: li.offsetLeft - (listEl.clientWidth - li.offsetWidth) / 2, behavior: reduceMotion ? 'auto' : 'smooth' });
        }
      }, listEl);
    }
    function focusPlace(id) {
      var p = PLACES.filter(function (x) { return x.id === id; })[0];
      if (!p) return;
      map.flyTo([p.lat, p.lng], p.zoom, { duration: reduceMotion ? 0 : 0.9 });
      map.once('moveend', function () { markers[id].openPopup(); });
      markActive(id);
    }

    var legend = L.control({ position: 'bottomleft' });
    legend.onAdd = function () {
      var d = L.DomUtil.create('div', 'map-legend');
      d.innerHTML =
        '<div><i style="background:' + COLORS.town + '"></i>구시가지</div>' +
        '<div><i style="background:' + COLORS.near + '"></i>주변 유산</div>' +
        '<div><i class="lg-zone"></i>구시가지 (개략)</div>';
      return d;
    };
    legend.addTo(map);

    var fitAll = function () { map.fitBounds(PLACES.map(function (p) { return [p.lat, p.lng]; }), { padding: [26, 26] }); };
    fitAll();

    var chips = Array.prototype.slice.call(document.querySelectorAll('.map-toolbar .chip'));
    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        var f = chip.getAttribute('data-filter');
        chips.forEach(function (c) {
          var on = c === chip;
          c.classList.toggle('is-active', on);
          c.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
        map.closePopup();
        ['town', 'near', 'ref'].forEach(function (k) {
          var shown = f === 'all' || f === k;
          if (shown && !map.hasLayer(layers[k])) map.addLayer(layers[k]);
          if (!shown && map.hasLayer(layers[k])) map.removeLayer(layers[k]);
        });
        Array.prototype.forEach.call(listEl.children, function (li) {
          li.hidden = !(f === 'all' || li.getAttribute('data-kind') === f);
        });
        markActive(null);
        if (f === 'all') { fitAll(); return; }
        if (f === 'town') { map.flyTo([15.8773, 108.3285], 15.5, { duration: reduceMotion ? 0 : 0.8 }); return; }
        var pts = PLACES.filter(function (p) { return p.kind === f; }).map(function (p) { return [p.lat, p.lng]; });
        map.flyToBounds(pts.concat([[15.8773, 108.329]]), { padding: [40, 40], duration: reduceMotion ? 0 : 0.8 });
      });
    });

    var unlock = document.getElementById('map-unlock');
    if (coarse) {
      unlock.hidden = false;
      unlock.setAttribute('aria-pressed', 'false');
      unlock.addEventListener('click', function () {
        var on = !map.dragging.enabled();
        if (on) map.dragging.enable(); else map.dragging.disable();
        unlock.setAttribute('aria-pressed', String(on));
        unlock.textContent = on ? '지도 고정하기' : '지도 움직이기';
      });
    }

    each('[data-fly]', function (b) {
      b.addEventListener('click', function () {
        scrollToId('place');
        setTimeout(function () { focusPlace(b.getAttribute('data-fly')); }, reduceMotion ? 0 : 700);
      });
    });

    if ('ResizeObserver' in window) new ResizeObserver(function () { map.invalidateSize(); }).observe(mapEl);
    window.addEventListener('load', function () { map.invalidateSize(); fitAll(); });
  }
})();
