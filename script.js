/* Quan họ Bắc Ninh — page behaviour (vanilla JS, no build step) */
(function () {
  'use strict';

  // Canonical public URL, used for the QR code when the page is not served from GitHub Pages
  // (e.g. local preview). Change this if the repo moves to another account.
  var SITE_URL = 'https://tuong06.github.io/quan-ho/';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var header = document.getElementById('site-header');
  var navList = document.getElementById('nav-list');
  var navLinks = Array.prototype.slice.call(navList.querySelectorAll('a'));

  /* ---------- smooth scroll for in-page anchors ---------- */
  function scrollToId(id) {
    var el = document.getElementById(id);
    if (!el) return;
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

  /* ---------- scroll progress + header state ---------- */
  var bar = document.getElementById('progress-bar');
  var darkZones = Array.prototype.slice.call(document.querySelectorAll('.hero, .closing'));
  var ticking = false;
  function onScroll() {
    ticking = false;
    var doc = document.documentElement;
    var max = doc.scrollHeight - window.innerHeight;
    bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(window.pageYOffset / max, 1) : 0) + ')';
    header.classList.toggle('is-scrolled', window.pageYOffset > 8);
    var probe = header.offsetHeight / 2;
    var onDark = darkZones.some(function (z) {
      var r = z.getBoundingClientRect();
      return r.top <= probe && r.bottom >= probe;
    });
    header.classList.toggle('on-dark', onDark);
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  onScroll();

  /* ---------- animated hero background ---------- */
  (function () {
    var slides = Array.prototype.slice.call(document.querySelectorAll('.hero-slide'));
    var credit = document.getElementById('hero-credit');
    if (slides.length < 2 || reduceMotion) return;
    var idx = 0, timer = null, heroVisible = true;
    var INTERVAL = 7000;
    function ready(img) { return img.getAttribute('src') && img.complete && img.naturalWidth > 0; }
    function loadRest() {
      slides.forEach(function (img) {
        var src = img.getAttribute('data-src');
        if (src && !img.getAttribute('src')) img.setAttribute('src', src);
      });
    }
    function show(n) {
      slides[idx].classList.remove('is-active');
      slides[idx].setAttribute('aria-hidden', 'true');
      idx = n;
      slides[idx].classList.add('is-active');
      slides[idx].removeAttribute('aria-hidden');
      if (credit) {
        credit.classList.add('is-fading');
        setTimeout(function () {
          credit.textContent = slides[idx].getAttribute('data-credit') || '';
          credit.classList.remove('is-fading');
        }, 600);
      }
    }
    function next() {
      // skip slides that have not finished loading (slow network) or failed
      for (var k = 1; k < slides.length; k++) {
        var n = (idx + k) % slides.length;
        if (ready(slides[n])) { show(n); return; }
      }
    }
    function run() {
      stop();
      if (heroVisible && !document.hidden) timer = setInterval(next, INTERVAL);
    }
    function stop() { if (timer) { clearInterval(timer); timer = null; } }
    // fetch the other slides only after the first photo is on screen
    if (ready(slides[0])) loadRest();
    else slides[0].addEventListener('load', loadRest);
    window.addEventListener('load', loadRest);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        heroVisible = entries[0].isIntersecting;
        run();
      }).observe(document.querySelector('.hero'));
    }
    document.addEventListener('visibilitychange', run);
    run();
  })();

  /* ---------- count-up ---------- */
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
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(Math.round(from + (to - from) * eased));
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  /* ---------- scroll reveal ---------- */
  var revealEls = Array.prototype.slice.call(document.querySelectorAll('.reveal'));
  function show(el) {
    el.classList.add('is-visible');
    Array.prototype.forEach.call(el.querySelectorAll('.count'), countUp);
  }
  if ('IntersectionObserver' in window) {
    var revealObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        // light stagger for siblings revealed in the same frame
        var siblings = el.parentElement ? el.parentElement.querySelectorAll(':scope > .reveal') : [];
        var idx = Array.prototype.indexOf.call(siblings, el);
        el.style.transitionDelay = reduceMotion ? '0ms' : Math.min(Math.max(idx, 0) * 70, 350) + 'ms';
        show(el);
        revealObs.unobserve(el);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    revealEls.forEach(function (el) { revealObs.observe(el); });
  } else {
    revealEls.forEach(show);
  }

  /* ---------- active nav link ---------- */
  var sections = navLinks.map(function (a) { return document.getElementById(a.getAttribute('href').slice(1)); }).filter(Boolean);
  function setActive(id) {
    navLinks.forEach(function (a) {
      var on = a.getAttribute('href') === '#' + id;
      a.classList.toggle('is-active', on);
      if (on) {
        a.setAttribute('aria-current', 'true');
        // keep the active pill visible inside the horizontally scrolling nav (without moving the page)
        var left = a.offsetLeft - (navList.clientWidth - a.offsetWidth) / 2;
        navList.scrollTo({ left: left, behavior: reduceMotion ? 'auto' : 'smooth' });
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
      else {
        navLinks.forEach(function (a) { a.classList.remove('is-active'); a.removeAttribute('aria-current'); });
        if (window.pageYOffset < window.innerHeight) navList.scrollTo({ left: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
      }
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(function (s) { navObs.observe(s); });
  }

  /* ---------- QR code + copy link ---------- */
  function pageUrl() {
    var h = location.hostname;
    if (/\.github\.io$/.test(h)) return location.origin + location.pathname.replace(/index\.html$/, '');
    return SITE_URL;
  }
  var url = pageUrl();
  var qrBox = document.getElementById('qr');
  var qrLink = document.getElementById('qr-url');
  qrLink.href = url;
  var shown = url.replace(/^https?:\/\//, '').replace(/\/$/, '');
  qrLink.textContent = '';
  shown.split('/').forEach(function (part, i) {
    if (i) { qrLink.appendChild(document.createElement('wbr')); qrLink.appendChild(document.createTextNode('/')); }
    qrLink.appendChild(document.createTextNode(part));
  });
  if (typeof window.qrcode === 'function') {
    var qr = window.qrcode(0, 'M');
    qr.addData(url);
    qr.make();
    qrBox.innerHTML = qr.createSvgTag({ cellSize: 4, margin: 0, scalable: true });
    var path = qrBox.querySelector('path');
    if (path) path.setAttribute('fill', '#2B211B');
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

  /* ---------- pronunciation (Web Speech API, vi-VN) ---------- */
  var synth = window.speechSynthesis;
  var viVoice = null;
  var warnedNoVoice = false;
  function pickVoice() {
    if (!synth) return;
    var voices = synth.getVoices() || [];
    viVoice = voices.filter(function (v) { return /^vi(-|_|$)/i.test(v.lang); })[0] || null;
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
  // Turn every pronunciation chip into a tap-to-listen button
  Array.prototype.forEach.call(document.querySelectorAll('.pron span:not(.pron-label)'), function (chip) {
    var b = chip.querySelector('b[lang="vi"]');
    if (!b) return;
    chip.setAttribute('data-say', b.textContent.trim());
    chip.insertAdjacentHTML('beforeend', SPEAKER);
  });
  Array.prototype.forEach.call(document.querySelectorAll('.pron-label'), function (l) {
    l.insertAdjacentHTML('beforeend', '<small>탭하여 듣기</small>');
  });
  Array.prototype.forEach.call(document.querySelectorAll('[data-say]'), function (el) {
    if (el.tagName !== 'BUTTON') {
      el.setAttribute('role', 'button');
      el.setAttribute('tabindex', '0');
      if (!el.hasAttribute('aria-label')) el.setAttribute('aria-label', el.getAttribute('data-say') + ' 발음 듣기');
      el.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); say(el.getAttribute('data-say'), el); }
      });
    }
    el.addEventListener('click', function () { say(el.getAttribute('data-say'), el); });
  });

  /* ---------- Hội Lim countdown ---------- */
  (function () {
    var out = document.getElementById('lim-dday');
    if (!out) return;
    // Gregorian dates of lunar 1/13 (Tết 2027-02-06, Tết 2028-01-26)
    var DATES = ['2027-02-18', '2028-02-07'];
    var now = new Date();
    var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    for (var i = 0; i < DATES.length; i++) {
      var p = DATES[i].split('-');
      var d = new Date(+p[0], +p[1] - 1, +p[2]);
      var diff = Math.round((d - today) / 86400000);
      if (diff < 0) continue;
      out.innerHTML = diff === 0
        ? '<b>오늘은 Hội Lim 축제 날!</b>'
        : '다음 축제까지 <b>D-' + diff + '</b> <span>(' + p[0] + '년 ' + (+p[1]) + '월 ' + (+p[2]) + '일)</span>';
      out.hidden = false;
      return;
    }
  })();

  /* ---------- quiz ---------- */
  var QUIZ = [
    { q: 'Quan họ가 유네스코 인류무형문화유산에 등재된 해는?', opts: ['2003년', '2009년', '2011년', '2016년'], a: 1,
      exp: '2009년 9월 30일, 아부다비 제4차 정부간위원회(4.COM)에서 등재되었다.', link: '#intro' },
    { q: '옛 낀박 지역의 Quan họ 마을은 모두 몇 곳일까?', opts: ['24곳', '44곳', '49곳', '213곳'], a: 2,
      exp: '박닌성 44곳 + 박장성 5곳 = 49곳. 213은 가락의 수다.', link: '#region' },
    { q: 'Quan họ를 부르는 방식으로 맞는 것은?', opts: ['장구 반주에 맞춰 부른다', '반주 없이 목소리로만 부른다', '한 사람이 혼자 부른다', '악기 합주가 중심이다'], a: 1,
      exp: 'Quan họ는 반주 없는 육성 민요로, 남녀가 짝을 지어 주고받는다.', link: '#art' },
    { q: 'O / X — kết chạ로 결연한 두 마을의 남녀는 서로 결혼할 수 있다.', opts: ['O', 'X'], a: 1, ox: true,
      exp: '결연한 두 마을은 형제 마을이므로, 남녀 간 혼인을 금지하는 불문율이 있다.', link: '#values' },
    { q: 'Hội Lim 축제가 열리는 날은?', opts: ['음력 1월 13일', '음력 8월 15일', '양력 1월 1일', '음력 5월 5일'], a: 0,
      exp: '음력 1월 13일, 박닌성 띠엔주현 림 일대에서 열린다. 음력 8월 15일은 한가위다.', link: '#stage' },
    { q: '발성의 4대 기준이 아닌 것은?', opts: ['vang (울림)', 'rền (여운)', 'nón (모자)', 'nảy (튐)'], a: 2,
      exp: '4대 기준은 vang · rền · nền · nảy. nón은 모자(nón quai thao)다.', link: '#art' },
    { q: 'Quan họ와 강강술래의 공통점이 아닌 것은?', opts: ['2009년 같은 회의에서 등재', '주고받는 구조', '공동체 명절의 노래', '여성만 부르는 노래'], a: 3,
      exp: '강강술래는 마을 여성들의 노래지만, Quan họ는 남녀가 화답하는 노래다.', link: '#compare' }
  ];
  var GRADES = [
    { min: 7, title: 'Quan họ 명창', msg: '만점! 오늘부터 liền anh · liền chị로 인정합니다.' },
    { min: 5, title: 'Quan họ 소리꾼', msg: '훌륭해요. 호이 림 축제에 가도 되겠어요.' },
    { min: 3, title: 'Quan họ 연습생', msg: '좋은 출발이에요. 틀린 부분을 다시 확인해 볼까요?' },
    { min: 0, title: 'Quan họ 새내기', msg: '괜찮아요. 발표 내용을 한 번 더 둘러보고 다시 도전해 보세요.' }
  ];
  var quizEl = document.getElementById('quiz-app');
  var qi = 0, score = 0, answers = [];
  function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function buzz(p) { if (navigator.vibrate) { try { navigator.vibrate(p); } catch (e) { /* ignore */ } } }
  function renderQ() {
    var item = QUIZ[qi];
    var html =
      '<div class="quiz-top"><span class="quiz-count">문제 <b>' + (qi + 1) + '</b> / ' + QUIZ.length + '</span>' +
      '<span class="quiz-score">점수 ' + score + '</span></div>' +
      '<div class="quiz-bar"><span style="transform:scaleX(' + (qi / QUIZ.length) + ')"></span></div>' +
      '<h3 class="quiz-q" tabindex="-1">' + esc(item.q) + '</h3>' +
      '<div class="quiz-opts' + (item.ox ? ' is-ox' : '') + '">';
    item.opts.forEach(function (o, i) {
      html += '<button type="button" class="quiz-opt" data-i="' + i + '"><span class="quiz-key">' +
        (item.ox ? '' : String.fromCharCode(65 + i)) + '</span><span>' + esc(o) + '</span></button>';
    });
    html += '</div><div class="quiz-feedback" aria-live="polite"></div>';
    quizEl.innerHTML = html;
    Array.prototype.forEach.call(quizEl.querySelectorAll('.quiz-opt'), function (btn) {
      btn.addEventListener('click', function () { answer(+btn.getAttribute('data-i')); });
    });
  }
  function answer(i) {
    var item = QUIZ[qi];
    var ok = i === item.a;
    if (ok) score++;
    answers.push(ok);
    buzz(ok ? 25 : [60, 50, 60]);
    Array.prototype.forEach.call(quizEl.querySelectorAll('.quiz-opt'), function (btn) {
      var bi = +btn.getAttribute('data-i');
      btn.disabled = true;
      if (bi === item.a) btn.classList.add('is-correct');
      else if (bi === i) btn.classList.add('is-wrong');
    });
    quizEl.querySelector('.quiz-score').textContent = '점수 ' + score;
    var last = qi === QUIZ.length - 1;
    var fb = quizEl.querySelector('.quiz-feedback');
    fb.className = 'quiz-feedback ' + (ok ? 'ok' : 'no');
    fb.innerHTML =
      '<p class="quiz-verdict">' + (ok ? '정답!' : '아쉬워요') + '</p>' +
      '<p>' + esc(item.exp) + '</p>' +
      '<div class="quiz-actions"><a class="link-btn" href="' + item.link + '">관련 내용 보기</a>' +
      '<button type="button" class="btn-primary quiz-next">' + (last ? '결과 보기' : '다음 문제') + '</button></div>';
    var next = fb.querySelector('.quiz-next');
    next.addEventListener('click', function () {
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
    if (score === QUIZ.length) confetti();
    quizEl.querySelector('.quiz-retry').addEventListener('click', function () {
      qi = 0; score = 0; answers = []; renderQ();
      quizEl.querySelector('.quiz-q').focus({ preventScroll: true });
    });
  }
  function confetti() {
    if (reduceMotion) return;
    var box = document.createElement('div');
    box.className = 'confetti';
    box.setAttribute('aria-hidden', 'true');
    var colors = ['#7A1F2B', '#C9A227', '#1F4E5F', '#F2E0DA', '#8C6D10'];
    for (var i = 0; i < 40; i++) {
      var s = document.createElement('i');
      s.style.left = Math.random() * 100 + '%';
      s.style.background = colors[i % colors.length];
      s.style.animationDelay = Math.random() * 0.4 + 's';
      s.style.animationDuration = 1.6 + Math.random() * 1.2 + 's';
      s.style.transform = 'rotate(' + Math.random() * 360 + 'deg)';
      box.appendChild(s);
    }
    quizEl.appendChild(box);
    setTimeout(function () { box.remove(); }, 3200);
  }
  if (quizEl) renderQ();

  /* ---------- floating quiz button ---------- */
  var fab = document.getElementById('quiz-fab');
  if (fab) {
    var hideZones = ['top', 'quiz', 'closing', 'sources'].map(function (id) {
      return id === 'top' ? document.querySelector('.hero') : document.getElementById(id);
    }).filter(Boolean);
    var fabTick = false;
    var updateFab = function () {
      fabTick = false;
      var vh = window.innerHeight;
      var hide = hideZones.some(function (z) {
        var r = z.getBoundingClientRect();
        return r.top < vh * 0.85 && r.bottom > vh * 0.15;
      });
      fab.classList.toggle('is-on', !hide);
    };
    window.addEventListener('scroll', function () {
      if (!fabTick) { fabTick = true; requestAnimationFrame(updateFab); }
    }, { passive: true });
    window.addEventListener('resize', updateFab);
    updateFab();
  }

  /* ---------- Leaflet map ---------- */
  initMap();

  function initMap() {
    var mapEl = document.getElementById('map');
    if (!mapEl) return;
    if (typeof window.L === 'undefined') {
      mapEl.innerHTML = '<p class="map-fallback">지도를 불러오지 못했습니다.</p>';
      return;
    }
    var L = window.L;

    var COLORS = { bn: '#7A1F2B', bg: '#1F4E5F', ref: '#8A8178' };
    var PROV = { bn: '박닌성 (Bắc Ninh)', bg: '박장성 (Bắc Giang)', ref: '참고 지점' };

    // District/city-level anchor points (approximate centres). Individual village
    // coordinates are intentionally NOT plotted; the source only gives counts per province.
    var PLACES = [
      { id: 'bacninh', prov: 'bn', ko: '박닌시', vi: 'TP. Bắc Ninh', lat: 21.1861, lng: 106.0763,
        desc: '박닌성 Quan họ 마을 44곳의 중심 권역' },
      { id: 'yenphong', prov: 'bn', ko: '옌퐁현', vi: 'Yên Phong', lat: 21.2005, lng: 105.9530,
        desc: '박닌성 Quan họ 마을 44곳의 중심 권역' },
      { id: 'tiendu', prov: 'bn', ko: '띠엔주현 · 림', vi: 'Tiên Du · Lim', lat: 21.1437, lng: 106.0205,
        desc: '음력 1월 13일 Hội Lim 축제가 열리는 곳' },
      { id: 'vietyen', prov: 'bg', ko: '비엣옌현', vi: 'Việt Yên', lat: 21.2650, lng: 106.0850,
        desc: '박장성 Quan họ 마을 5곳이 있는 곳' },
      { id: 'hanoi', prov: 'ref', ko: '하노이', vi: 'Hà Nội', lat: 21.0285, lng: 105.8542,
        desc: '위치 참고용 · Quan họ 마을 아님' }
    ];

    // Schematic outline of the Quan họ core area inside old Kinh Bắc — NOT a surveyed boundary.
    var ZONE = [
      [21.335, 105.905], [21.340, 106.160], [21.230, 106.185],
      [21.120, 106.125], [21.100, 106.000], [21.150, 105.895]
    ];

    var coarse = window.matchMedia('(pointer: coarse)').matches;
    var map = L.map(mapEl, {
      scrollWheelZoom: false,
      dragging: !coarse,
      tap: false,
      zoomSnap: 0.25,
      attributionControl: true
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      subdomains: 'abcd',
      maxZoom: 18,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
    }).addTo(map);

    var zone = L.polygon(ZONE, {
      color: '#8C6D10', weight: 2, dashArray: '6 6', fillColor: '#C9A227', fillOpacity: 0.14
    }).addTo(map);
    // Zone label pinned near the northern edge so it never covers the district markers
    map.openTooltip(L.tooltip({ permanent: true, direction: 'center', className: 'region-label', interactive: false })
      .setLatLng([21.318, 106.02]).setContent('옛 낀박 · Quan họ 전승 권역 (개략)'));
    zone.bindPopup(
      '<p class="pop-title">옛 낀박(Kinh Bắc) 지역</p>' +
      '<p class="pop-desc">Quan họ 마을 49곳 — 박닌성 44곳 · 박장성 5곳</p>' +
      '<p class="pop-approx">점선은 전승 권역의 개략적 표시이며 실제 역사 경계가 아닙니다.</p>'
    );

    var layers = { bn: L.layerGroup().addTo(map), bg: L.layerGroup().addTo(map), ref: L.layerGroup().addTo(map) };
    var markers = {};
    var listEl = document.getElementById('map-list');

    PLACES.forEach(function (p) {
      var isRef = p.prov === 'ref';
      var ll = [p.lat, p.lng];
      if (!isRef) {
        L.circleMarker(ll, { radius: 20, stroke: false, fillColor: COLORS[p.prov], fillOpacity: 0.16, interactive: false }).addTo(layers[p.prov]);
      }
      var m = L.circleMarker(ll, {
        radius: isRef ? 6 : 10, color: '#fff', weight: 2.5, fillColor: COLORS[p.prov], fillOpacity: 1
      }).addTo(layers[p.prov]);

      m.bindTooltip(p.ko, { direction: 'top', offset: [0, -10], className: 'tt ' + p.prov, permanent: !isRef });
      m.bindPopup(
        '<span class="pop-prov ' + p.prov + '">' + PROV[p.prov] + '</span>' +
        '<p class="pop-title">' + p.ko + '</p>' +
        '<p class="pop-vi" lang="vi">' + p.vi + '</p>' +
        '<p class="pop-desc">' + p.desc + '</p>' +
        (isRef ? '' : '<p class="pop-approx">표시 위치는 현·시 중심부의 근사값입니다.</p>')
      );
      m.on('mouseover', function () { m.setRadius(isRef ? 8 : 13); });
      m.on('mouseout', function () { m.setRadius(isRef ? 6 : 10); });
      m.on('popupopen', function () { markActive(p.id); });
      markers[p.id] = m;

      var li = document.createElement('li');
      li.setAttribute('data-prov', p.prov);
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'ml-' + p.prov;
      btn.setAttribute('data-id', p.id);
      btn.innerHTML = '<b>' + p.ko + '</b><span lang="vi">' + p.vi + '</span><span>' + p.desc + '</span>';
      btn.addEventListener('click', function () { focusPlace(p.id); });
      li.appendChild(btn);
      listEl.appendChild(li);
    });

    function markActive(id) {
      Array.prototype.forEach.call(listEl.querySelectorAll('button'), function (b) {
        b.classList.toggle('is-active', b.getAttribute('data-id') === id);
      });
    }

    function focusPlace(id) {
      var m = markers[id];
      if (!m) return;
      map.flyTo(m.getLatLng(), 12, { duration: reduceMotion ? 0 : 0.9 });
      map.once('moveend', function () { m.openPopup(); });
      markActive(id);
    }

    // Legend
    var legend = L.control({ position: 'bottomleft' });
    legend.onAdd = function () {
      var d = L.DomUtil.create('div', 'map-legend');
      d.innerHTML =
        '<div><i style="background:' + COLORS.bn + '"></i>박닌성 · 44곳</div>' +
        '<div><i style="background:' + COLORS.bg + '"></i>박장성 · 5곳</div>' +
        '<div><i class="lg-zone"></i>전승 권역 (개략)</div>';
      return d;
    };
    legend.addTo(map);

    var fitAll = function () { map.fitBounds(zone.getBounds(), { padding: [18, 18] }); };
    fitAll();

    // Filters
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
        ['bn', 'bg', 'ref'].forEach(function (k) {
          var shown = f === 'all' || f === k;
          if (shown && !map.hasLayer(layers[k])) map.addLayer(layers[k]);
          if (!shown && map.hasLayer(layers[k])) map.removeLayer(layers[k]);
        });
        Array.prototype.forEach.call(listEl.children, function (li) {
          li.hidden = !(f === 'all' || li.getAttribute('data-prov') === f);
        });
        markActive(null);
        if (f === 'all') { fitAll(); return; }
        var pts = PLACES.filter(function (p) { return p.prov === f; }).map(function (p) { return [p.lat, p.lng]; });
        if (pts.length === 1) map.flyTo(pts[0], 11.5, { duration: reduceMotion ? 0 : 0.8 });
        else map.flyToBounds(pts, { padding: [60, 60], maxZoom: 12, duration: reduceMotion ? 0 : 0.8 });
      });
    });

    // Touch devices: one-finger drag scrolls the page until the user unlocks the map
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

    // "지도에서 위치 보기" buttons elsewhere on the page
    Array.prototype.forEach.call(document.querySelectorAll('[data-fly]'), function (b) {
      b.addEventListener('click', function () {
        scrollToId('region');
        setTimeout(function () { focusPlace(b.getAttribute('data-fly')); }, reduceMotion ? 0 : 700);
      });
    });

    // The map sits inside a revealed (transformed) block; recompute size once it is shown.
    if ('ResizeObserver' in window) {
      new ResizeObserver(function () { map.invalidateSize(); }).observe(mapEl);
    }
    window.addEventListener('load', function () { map.invalidateSize(); fitAll(); });
  }
})();
