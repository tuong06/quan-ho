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
