/* dalta 官網互動：序幕、一筆畫到底的線、文字與圓點進場、服務磚範例、語言切換 */
(function () {
  'use strict';

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  var root = $('[data-root]');
  if (!root) return;

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var touch = window.matchMedia && window.matchMedia('(hover: none)').matches;
  var hasIO = typeof IntersectionObserver !== 'undefined';

  var hero = $('[data-hero]');
  var header = $('.d-hdr');
  var tip = $('[data-tip]');
  var LOGO_SRC = '';
  var bgSecs = $$('[data-bgsec]');
  var secEls = {};
  $$('[data-anim]').forEach(function (el) { secEls[el.getAttribute('data-anim')] = el; });

  var state = { introDone: false, drawn: 0, target: 0, lang: 'zh', live: 0, lb: 0 };
  var langHooks = [];
  /* 音效：預設關閉，訪客按了右上角的「聲音」才載入、才出聲 */
  var snd = { on: false, intro: null, tap: null };
  function sndPlay(a, vol) {
    if (!snd.on || !a) return;
    try { a.volume = vol; a.currentTime = 0; } catch (e) {}
    var pr = a.play && a.play(); if (pr && pr.catch) pr.catch(function () {});
  }

  /* ---------- 語言 ---------- */
  var TEXT = {
    zh: { label: 'Switch to English', close: '關閉', htmlLang: 'zh-Hant-TW', sndOn: '開啟音效', sndOff: '關閉音效',
      cap: ['', 'dalta｜自有品牌動態：More than data.', 'ERE｜ORIGINAL 極簡開關廣告影片', '耘角 YunJiao｜社群短影音'] },
    en: { label: '切換成中文', close: 'Close', htmlLang: 'en', sndOn: 'Turn sound on', sndOff: 'Turn sound off',
      cap: ['', 'dalta · our own brand film: More than data.', 'ERE · ORIGINAL switch line ad film', 'YunJiao · social reel'] }
  };
  function setLang(lang, remember) {
    state.lang = lang;
    if (remember) { try { localStorage.setItem('dalta-lang', lang); } catch (e) {} }
    root.classList.remove('lang-zh', 'lang-en');
    root.classList.add('lang-' + lang);
    document.documentElement.lang = TEXT[lang].htmlLang;
    var btn = $('[data-act="lang"]');
    if (btn) btn.setAttribute('aria-label', TEXT[lang].label);
    $$('[data-act="sound"]').forEach(function (sb) { sb.setAttribute('aria-label', snd.on ? TEXT[lang].sndOff : TEXT[lang].sndOn); });
    $$('[data-act="close"]').forEach(function (b) { b.setAttribute('aria-label', TEXT[lang].close); });
    $$('[data-zh-src]').forEach(function (v) {
      var src = v.getAttribute('data-' + lang + '-src'), poster = v.getAttribute('data-' + lang + '-poster');
      if (v.getAttribute('src') !== src) { v.setAttribute('poster', poster); v.setAttribute('src', src); }
    });
    if (state.lb) fillLightbox(state.lb);
    langHooks.forEach(function (fn) { fn(); });
    requestAnimationFrame(measure);
  }
  (function initLang() {
    var lang = null;
    try { lang = localStorage.getItem('dalta-lang'); } catch (e) {}
    if (lang !== 'zh' && lang !== 'en') lang = /^zh/i.test(navigator.language || '') ? 'zh' : 'en';
    setLang(lang, false);
  })();

  /* ---------- 進場：段落、文字、圓點 ---------- */
  var DOT_OWNER = { hero: 'leadTxt', belief: 'beliefTxt', svc1: 'workTxt', svc2: 'workTxt', svc3: 'workTxt', habit: 'habitTxt', talk: 'talkTxt' };
  var dotWraps = {};
  $$('[data-dot]').forEach(function (w) { dotWraps[w.getAttribute('data-dot')] = w; });
  var dotSeen = {}, txtOn = {};
  function syncDot(k) {
    var w = dotWraps[k]; if (!w) return;
    var inner = w.firstElementChild; if (!inner) return;
    inner.classList.toggle('d-dot-go', !!(dotSeen[k] && txtOn[DOT_OWNER[k]]));
  }
  function setBlock(k, on) {
    var el = secEls[k]; if (!el) return;
    var isTxt = /Txt$/.test(k);
    el.classList.toggle(isTxt ? 'd-on' : 'd-lab', on);
    if (isTxt) {
      txtOn[k] = on;
      Object.keys(DOT_OWNER).forEach(function (d) { if (DOT_OWNER[d] === k) syncDot(d); });
    }
  }
  function showAll() {
    Object.keys(secEls).forEach(function (k) { setBlock(k, true); });
    Object.keys(dotWraps).forEach(function (k) { dotSeen[k] = true; syncDot(k); });
    if (header) header.classList.add('d-hdr-on');
  }

  if (reduce || !hasIO) {
    showAll();
  } else {
    var ioSec = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var k = e.target.getAttribute('data-anim');
        if (e.isIntersecting && e.intersectionRatio >= 0.12) setBlock(k, true);
        else if (!e.isIntersecting) setBlock(k, false);
      });
    }, { threshold: [0, 0.12] });
    var ioTxt = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var k = e.target.getAttribute('data-anim');
        if (e.isIntersecting && e.intersectionRatio >= 0.45) setBlock(k, true);
        else if (!e.isIntersecting) setBlock(k, false);
      });
    }, { threshold: [0, 0.45] });
    Object.keys(secEls).forEach(function (k) { (/Txt$/.test(k) ? ioTxt : ioSec).observe(secEls[k]); });
    var ioDot = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var k = e.target.getAttribute('data-dot');
        if (e.isIntersecting && e.intersectionRatio >= 0.99) { dotSeen[k] = true; syncDot(k); }
        else if (!e.isIntersecting) { dotSeen[k] = false; syncDot(k); }
      });
    }, { threshold: [0, 1], rootMargin: '0px 0px -18% 0px' });
    Object.keys(dotWraps).forEach(function (k) { ioDot.observe(dotWraps[k]); });
  }

  /* ---------- 頁首：離開首屏才出現；首屏捲回來重播序幕 ---------- */
  var heroLeft = false;
  if (hero && hasIO && !reduce) {
    new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var show = !e.isIntersecting || e.intersectionRatio < 0.9;
        if (header) header.classList.toggle('d-hdr-on', show);
        if (!e.isIntersecting) { heroLeft = true; return; }
        if (e.intersectionRatio >= 0.6 && heroLeft && state.introDone) { heroLeft = false; runIntro(); }
      });
    }, { threshold: [0, 0.6, 0.9] }).observe(hero);
  }

  /* ---------- 序幕：數據小點聚成一顆點子 ---------- */
  var introRaf = 0;
  function startPoint() {
    var slot = $('[data-logo-slot]');
    if (!hero || !slot) return null;
    var sr = hero.getBoundingClientRect(), lr = slot.getBoundingClientRect();
    return { sr: sr, x: lr.left - sr.left + lr.width / 2, y: Math.min(sr.height - 48, lr.bottom - sr.top + 56) };
  }
  /* ---------- logo 向量動畫（照原版逐格量出的數據）：字母依序落下、數據點跳進 i、點眨兩下、字母跳兩下 ---------- */
  var LG = (function () {
    var svgEl = $('[data-logo-svg]');
    if (!svgEl) return null;
    var g = {};
    ['d', 'a1', 'stroke', 'r', 'a2', 'dot'].forEach(function (n) { g[n] = $('[data-p="' + n + '"]', svgEl); });
    var c01 = function (x) { return x < 0 ? 0 : x > 1 ? 1 : x; };
    var FX = 1788.5, FY = 1401;
    var LETK = {
      d: [[0.16, -900], [0.24, -646], [0.28, -581], [0.32, -516], [0.36, -442], [0.40, -355], [0.44, -251], [0.48, -135], [0.52, -3], [0.56, -15], [0.60, -17], [0.64, -7], [0.68, 0]],
      a1: [[0.32, -900], [0.40, -593], [0.44, -522], [0.48, -458], [0.52, -400], [0.56, -337], [0.60, -266], [0.64, -180], [0.68, -77], [0.72, -3], [0.76, -12], [0.80, -12], [0.84, 0]],
      stroke: [[0.48, -900], [0.56, -451], [0.60, -408], [0.64, -365], [0.68, -314], [0.72, -251], [0.76, -179], [0.80, -95], [0.84, -3], [0.88, -10], [0.92, -13], [0.96, -5], [1.00, 0]],
      r: [[0.60, -900], [0.68, -465], [0.72, -417], [0.76, -368], [0.80, -306], [0.84, -232], [0.88, -149], [0.92, -49], [0.96, -5], [1.00, -13], [1.04, -10], [1.08, 0]],
      a2: [[0.68, -900], [0.76, -609], [0.80, -537], [0.84, -471], [0.88, -415], [0.92, -352], [0.96, -282], [1.00, -203], [1.04, -107], [1.08, 0], [1.12, -10], [1.16, -12], [1.20, -5], [1.24, 0]]
    };
    var DOTK = [[1.60, 1317, 1409], [1.64, 1380, 1372], [1.68, 1456, 1318], [1.72, 1513, 1270], [1.76, 1575, 1250], [1.80, 1626, 1252], [1.84, 1653, 1282], [1.88, 1661, 1338], [1.92, 1668, 1403], [1.96, 1752, 1393], [2.00, 1762, 1361], [2.04, 1770, 1343], [2.08, 1775, 1339], [2.12, 1779, 1351], [2.16, 1782, 1378], [2.20, 1786, 1405], [2.24, FX, FY]];
    var DOTS = [[1.54, 1, 1], [1.60, 1.12, 0.83], [1.66, 0.95, 1.06], [1.72, 1, 1], [1.88, 1, 1], [1.92, 1.15, 0.8], [1.98, 0.95, 1.07], [2.06, 0.92, 1.12], [2.14, 1, 1], [2.20, 1.07, 0.88], [2.27, 1, 1]];
    var BLINK = [[3.00, 1], [3.04, 0.07], [3.12, 0.07], [3.16, 1], [3.32, 1], [3.36, 0.07], [3.44, 0.07], [3.48, 1]];
    var WAVE = [2.90, 3.22], ORDER = { d: 0, a1: 1, stroke: 2, r: 3, a2: 4 };
    function cr(K, t, j, i) {
      var p0 = K[Math.max(0, i - 2)], p1 = K[i - 1], p2 = K[i], p3 = K[Math.min(K.length - 1, i + 1)], u = (t - p1[0]) / (p2[0] - p1[0]), u2 = u * u, u3 = u2 * u;
      return 0.5 * ((2 * p1[j]) + (-p0[j] + p2[j]) * u + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * u2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * u3);
    }
    function seg(K, t) { for (var i = 1; i < K.length; i++) if (t <= K[i][0]) return i; return -1; }
    function spl(K, t, j) { if (t <= K[0][0]) return K[0][j]; var i = seg(K, t); return i < 0 ? K[K.length - 1][j] : cr(K, t, j, i); }
    function lin(K, t, j) { if (t <= K[0][0]) return K[0][j]; var i = seg(K, t); if (i < 0) return K[K.length - 1][j]; var a = K[i - 1], b = K[i]; return a[j] + (b[j] - a[j]) * (t - a[0]) / (b[0] - a[0]); }
    function fall(t, k) { var K = LETK[k]; if (t <= K[0][0]) return -900; return spl(K, t, 1); }
    function wave(t, k) { var off = 0, i = ORDER[k]; for (var w = 0; w < WAVE.length; w++) { var kk = (t - WAVE[w] - i * 0.035) / 0.2; if (kk > 0 && kk < 1) off -= 26 * 4 * kk * (1 - kk); } return off; }
    function dip(t) { if (t < 2.40 || t > 2.84) return 0; if (t < 2.48) return 5 * (t - 2.40) / 0.08; if (t < 2.64) return 5; return 5 * (1 - (t - 2.64) / 0.2); }
    // P：粒子點在 logo 座標裡的位置；s0：粒子點相對 logo 點的大小
    function render(t, P) {
      var dp = dip(t);
      ['d', 'a1', 'r', 'a2', 'stroke'].forEach(function (k) { g[k].setAttribute('transform', 'translate(0 ' + (fall(t, k) + dp + wave(t, k)).toFixed(1) + ')'); });
      if (t < 1.28 || !P) { g.dot.setAttribute('opacity', '0'); return; }
      var x, y, grow = 1;
      if (t < 1.60) {
        var k = c01((t - 1.28) / 0.32), bx = 1317, by = 1409;
        x = P.x + (bx - P.x) * k; y = P.y + (by - P.y) * k - 4 * (Math.max(P.y, by) - 1120) * k * (1 - k);
        grow = P.s0 + (1 - P.s0) * Math.min(1, k * 1.6);
      } else { x = spl(DOTK, t, 1); y = spl(DOTK, t, 2); }
      var sx = lin(DOTS, t, 1) * grow, sy = lin(DOTS, t, 2) * lin(BLINK, t, 1) * grow;
      y += dp + (t > 2.5 ? wave(t, 'stroke') : 0);
      g.dot.setAttribute('opacity', '1');
      g.dot.setAttribute('transform', 'translate(' + (x - FX).toFixed(1) + ' ' + (y - FY).toFixed(1) + ') translate(1788.5 1442.5) scale(' + sx.toFixed(3) + ' ' + sy.toFixed(3) + ') translate(-1788.5 -1442.5)');
    }
    // 頁面座標 → logo 座標
    function toLogo(cx, cy) {
      var m = svgEl.getScreenCTM(); if (!m) return { x: 1620, y: 1900, k: 0.33 };
      var pt = svgEl.createSVGPoint(); pt.x = cx; pt.y = cy; var q = pt.matrixTransform(m.inverse());
      return { x: q.x, y: q.y, k: m.a };
    }
    function dotScreen() { var m = svgEl.getScreenCTM(); if (!m) return null; var pt = svgEl.createSVGPoint(); pt.x = FX; pt.y = FY; var q = pt.matrixTransform(m); return { x: q.x, y: q.y, r: 41.5 * m.a }; }
    return { render: render, toLogo: toLogo, dotScreen: dotScreen, END: 3.75 };
  })();

  function finishIntro() { state.introDone = true; tipPlaced = false; updateTarget(); }
  function runIntro() {
    cancelAnimationFrame(introRaf);
    state.introDone = false;
    state.target = 0;
    if (LG) LG.render(-1, null);
    sndPlay(snd.intro, 0.85);
    var cv = $('[data-intro]');
    var sp = startPoint();
    if (reduce || !cv || !cv.getContext || !sp) { if (LG) LG.render(9, { x: 1788.5, y: 1401, s0: 1 }); finishIntro(); return; }
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W = sp.sr.width, H = sp.sr.height;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    var ctx = cv.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var px = sp.x, py = sp.y, DOTR = 6;
    var N = Math.round(Math.min(240, Math.max(100, W * H / 5200)));
    var parts = [];
    for (var i = 0; i < N; i++) {
      var x = Math.random() * W, y = Math.random() * H, dx = px - x, dy = py - y, len = Math.sqrt(dx * dx + dy * dy) || 1;
      parts.push({ x: x, y: y, r: 1.4 + Math.random() * 2.8, blue: Math.random() < 0.28, delay: Math.random() * 0.5, bend: (Math.random() - 0.5) * 0.6 * len, nx: -dy / len, ny: dx / len, ph: Math.random() * 6.28 });
    }
    var P = null;
    if (LG) { var q = LG.toLogo(sp.sr.left + px, sp.sr.top + py); P = { x: q.x, y: q.y, s0: Math.min(1, DOTR / (41.5 * q.k)) }; }
    var LOGO0 = 1.45, HAND = 1.28;
    var t0 = performance.now(), HOLD = 0.6, FLY = 1.0;
    var ease = function (t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
    (function step(now) {
      var t = (now - t0) / 1000, lt = t - LOGO0, arrived = 0;
      ctx.clearRect(0, 0, W, H);
      for (var i = 0; i < parts.length; i++) {
        var p = parts[i], k = Math.max(0, Math.min(1, (t - HOLD - p.delay) / FLY));
        if (k >= 1) { arrived++; continue; }
        var e = ease(k);
        var x = p.x + (px - p.x) * e + p.nx * Math.sin(e * Math.PI) * p.bend * 0.25 + Math.sin(t * 1.6 + p.ph) * 4 * (1 - e);
        var y = p.y + (py - p.y) * e + p.ny * Math.sin(e * Math.PI) * p.bend * 0.25 + Math.cos(t * 1.3 + p.ph) * 3 * (1 - e);
        ctx.globalAlpha = Math.min(1, t / 0.35) * (0.5 + 0.5 * (1 - e));
        ctx.fillStyle = p.blue ? '#435BD8' : '#FFFFFF';
        ctx.beginPath(); ctx.arc(x, y, p.r * (1 - 0.5 * e), 0, Math.PI * 2); ctx.fill();
      }
      var frac = arrived / parts.length;
      // 聚好的那顆點，等字母落完就跳進 logo，變成 i 上的點
      if (frac > 0 && lt < HAND) {
        ctx.globalAlpha = 1; ctx.fillStyle = '#FFFFFF';
        ctx.beginPath(); ctx.arc(px, py, (DOTR - 4) + 4 * frac, 0, Math.PI * 2); ctx.fill();
      }
      if (LG) LG.render(lt, P);
      // 最後從 i 的點滴下一顆小點，落到下面，成為往下畫線的起點
      var DRIP = LG ? LG.END : 0;
      if (LG && lt > DRIP) {
        var ds = LG.dotScreen(), kd = Math.min(1, (lt - DRIP) / 0.42);
        if (ds) {
          var sx = ds.x - sp.sr.left, sy = ds.y - sp.sr.top + ds.r * 0.6;
          var yy = sy + (py - sy) * kd * kd, sq = kd >= 1 ? Math.max(0, 1 - (lt - DRIP - 0.42) * 6) : 0;
          ctx.globalAlpha = 1; ctx.fillStyle = '#FFFFFF';
          ctx.save(); ctx.translate(sx + (px - sx) * kd, yy); ctx.scale(1 + 0.4 * sq, 1 - 0.4 * sq);
          ctx.beginPath(); ctx.arc(0, 0, DOTR * (0.55 + 0.45 * kd), 0, Math.PI * 2); ctx.fill(); ctx.restore();
        }
      }
      if (lt > DRIP + 0.62) {
        finishIntro();
        requestAnimationFrame(function () { ctx.clearRect(0, 0, W, H); });
        return;
      }
      introRaf = requestAnimationFrame(step);
    })(t0);
  }

  /* ---------- 一筆畫到底的線（切成六段，只重畫正在畫的那段） ---------- */
  var svg = $('[data-svg]');
  var stops = svg ? $$('stop', svg) : [];
  var segEls = $$('[data-seg]').sort(function (a, b) { return +a.getAttribute('data-seg') - +b.getAttribute('data-seg'); });
  var segs = null, totalL = 0, ymax = null, ylen = null, STEP = 10, lastKey = '', bounds = {}, rootTopDoc = 0, tipPlaced = false;
  var film = $('[data-film]'), filmV = film ? $('video', film) : null, filmPlayBtn = film ? $('.d-film-play', film) : null;
  var filmSeg = -1, filmEnd = -1, filmLineHidden = false;
  var fs = { vis: false, played: false }, rt2 = 0;

  function measure() {
    var sp = startPoint();
    var lead = secEls.lead, talk = secEls.talk;
    if (!sp || !lead || !talk || !svg) return;
    var rr = root.getBoundingClientRect();
    var rel = function (el) { var r = el.getBoundingClientRect(); return { top: r.top - rr.top, bottom: r.bottom - rr.top, left: r.left - rr.left, h: r.height }; };
    var leadR = rel(lead), talkR = rel(talk), heroR = rel(hero);
    var g = leadR.left + 24;
    var padL = parseFloat(getComputedStyle(lead).paddingLeft) || 48;
    var r = Math.max(7, Math.min(26, (leadR.left + padL - g - 10) / 2));
    var sx = sp.x + (sp.sr.left - rr.left), sy = sp.y + heroR.top;
    var endEl = $('[data-end]');
    var yEnd = endEl ? rel(endEl).top + 40 : talkR.top + 200;
    var loop = ' a ' + r + ' ' + r + ' 0 1 0 ' + (2 * r) + ' 0 a ' + r + ' ' + r + ' 0 1 0 ' + (-2 * r) + ' 0';
    var ds = [], prevY = null;
    var filmR = film ? rel(film) : null, fcx = rr.width / 2;
    filmSeg = -1;
    $$('[data-label]').forEach(function (el, i) {
      var cy = rel(el).top - 76;
      if (i === 0) {
        var span = cy - sy;
        ds.push('M ' + sx + ' ' + sy + ' C ' + sx + ' ' + (sy + span * 0.55) + ' ' + g + ' ' + (cy - span * 0.55) + ' ' + g + ' ' + cy + loop);
      } else if (filmR && filmR.top > prevY && filmR.bottom <= cy) {
        // 線往下畫進影片，轉進畫面正中央，點落下的那一刻影片開播；影片下緣再接著往下
        var fy = filmR.top + filmR.h / 2;
        ds.push('M ' + g + ' ' + prevY + ' L ' + g + ' ' + filmR.top);
        ds.push('M ' + g + ' ' + filmR.top + ' C ' + g + ' ' + (filmR.top + filmR.h * 0.34) + ' ' + (fcx - (fcx - g) * 0.5) + ' ' + fy + ' ' + fcx + ' ' + fy);
        filmSeg = ds.length - 1;
        // 從影片下緣正中央接出來，往下彎回左側，再在 04 打一個圈
        var dy = cy - filmR.bottom;
        ds.push('M ' + fcx + ' ' + filmR.bottom + ' C ' + fcx + ' ' + (filmR.bottom + dy * 0.62) + ' ' + g + ' ' + (cy - dy * 0.62) + ' ' + g + ' ' + cy + loop);
      } else ds.push('M ' + g + ' ' + prevY + ' L ' + g + ' ' + cy + loop);
      prevY = cy;
    });
    ds.push('M ' + g + ' ' + prevY + ' L ' + g + ' ' + yEnd);
    var w = Math.round(rr.width), h = Math.round(root.scrollHeight || rr.height);
    // 版面沒變就不重算整條線（重算很吃手機效能）
    var key = w + 'x' + h + '|' + ds.join('|');
    rootTopDoc = rr.top + (window.scrollY || 0);
    if (key === lastKey && segs) { updateTarget(); return; }
    lastKey = key;
    svg.setAttribute('width', w); svg.setAttribute('height', h); svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
    var grad = $('#dInk'); if (grad) grad.setAttribute('y2', h);
    var s1 = (heroR.bottom / h).toFixed(5), s2 = (talkR.top / h).toFixed(5);
    if (stops.length === 6) { stops[1].setAttribute('offset', s1); stops[2].setAttribute('offset', s1); stops[3].setAttribute('offset', s2); stops[4].setAttribute('offset', s2); }
    bounds = { heroBottom: heroR.bottom, talkTop: talkR.top, filmTop: filmR ? filmR.top : -1, filmBottom: filmR ? filmR.bottom : -1 };
    rootTopDoc = rr.top + (window.scrollY || 0);
    var start = 0;
    segs = segEls.map(function (el, i) {
      el.setAttribute('d', ds[i] || 'M 0 0');
      var len = ds[i] ? el.getTotalLength() : 0;
      var sg = { el: el, len: len, start: start, last: -1 };
      start += len;
      el.style.strokeDasharray = len + ' ' + len;
      return sg;
    });
    totalL = start;
    segEls.forEach(function (el, i) { el.setAttribute('stroke', i === filmSeg ? '#FFFFFF' : 'url(#dInk)'); });
    filmEnd = filmSeg >= 0 ? segs[filmSeg].start + segs[filmSeg].len : -1;
    if (filmSeg >= 0) segEls[filmSeg].style.opacity = filmLineHidden ? '0' : '1';
    ymax = []; ylen = [];
    var m = -1e9;
    segs.forEach(function (sg) {
      for (var t = 0; t < sg.len; t += STEP) { m = Math.max(m, sg.el.getPointAtLength(t).y); ymax.push(m); ylen.push(sg.start + t); }
    });
    if (reduce) state.drawn = totalL;
    if (state.drawn > totalL) state.drawn = totalL;
    paintSegs(true);
    tipPlaced = false;
    updateTarget();
  }
  function paintSegs(force) {
    if (!segs) return;
    for (var i = 0; i < segs.length; i++) {
      var sg = segs[i], want = Math.max(0, Math.min(sg.len, state.drawn - sg.start));
      if (force || Math.abs(want - sg.last) > 0.25) { sg.el.style.strokeDashoffset = String(sg.len - want); sg.last = want; }
    }
  }
  function pointAt(len) {
    for (var i = 0; i < segs.length; i++) {
      var sg = segs[i];
      if (sg.len && len <= sg.start + sg.len + 0.01) return sg.el.getPointAtLength(Math.max(0, len - sg.start));
    }
    for (var j = segs.length - 1; j >= 0; j--) if (segs[j].len) return segs[j].el.getPointAtLength(segs[j].len);
    return { x: 0, y: 0 };
  }
  function updateTarget() {
    if (!ymax) return;
    if (!state.introDone) { state.target = 0; return; }
    if (reduce) { state.target = totalL; return; }
    var T = (window.scrollY || 0) + window.innerHeight * 0.62 - rootTopDoc;
    var n = 0;
    while (n < ymax.length && ymax[n] <= T) n++;
    // 用每個取樣點的實際長度，線才會剛好停在段落交界（例如影片正中央）
    state.target = n < ylen.length ? ylen[n] : totalL;
  }
  var nudgeOn = false;
  function frame() {
    if (segs && tip) {
      if (!state.introDone) tip.style.opacity = '0';
      var nudge = !reduce && state.introDone && state.drawn < 40 && (window.scrollY || 0) < 30;
      if (nudge !== nudgeOn) { nudgeOn = nudge; tip.classList.toggle('d-nudge', nudge); }
      var diff = state.target - state.drawn;
      if (!(Math.abs(diff) < 0.3 && tipPlaced)) {
        tipPlaced = true;
        state.drawn += diff * 0.09;
        paintSegs(false);
        var p = pointAt(Math.max(0, state.drawn));
        tip.style.transform = 'translate(' + p.x + 'px, ' + p.y + 'px)';
        var inFilm = filmEnd >= 0 && p.y >= bounds.filmTop && p.y <= bounds.filmBottom;
        tip.style.opacity = state.introDone && !(inFilm && fs.played && state.drawn >= filmEnd - 4) ? '1' : '0';
        tip.style.color = (p.y < bounds.heroBottom || p.y >= bounds.talkTop || inFilm) ? '#FFFFFF' : '#435BD8';
      }
    }
    if (filmEnd >= 0 && filmV && state.introDone) {
      // 捲到位就開播（片頭前半秒是空的橘底），線頭追上中央的那一刻線和點一起淡出
      if (!reduce && !fs.played && fs.vis && state.target >= filmEnd - 4) startFilm();
      else if ((fs.played || filmLineHidden) && state.target < filmEnd - 60 && state.drawn < filmEnd - 60) resetFilm();
      if (fs.played && !filmLineHidden && state.drawn >= filmEnd - 4) { setFilmLine(true); tipPlaced = false; }
    }
    requestAnimationFrame(frame);
  }

  var rt = 0;
  window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(measure, 150); });
  window.addEventListener('scroll', updateTarget, { passive: true });
  window.addEventListener('load', measure);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
  [300, 1200, 3000].forEach(function (t) { setTimeout(measure, t); });

  /* ---------- 服務磚：電腦指到撐開；手機捲到就播 ---------- */
  var tilesWrap = $('.d-tiles');
  var tiles = $$('[data-tile]');
  function playVid(v, restart) {
    if (!v) return;
    v.muted = true; v.defaultMuted = true; v.playsInline = true;
    v.setAttribute('muted', ''); v.setAttribute('playsinline', '');
    if (restart) { try { v.currentTime = 0; } catch (e) {} }
    var pr = v.play && v.play(); if (pr && pr.catch) pr.catch(function () {});
  }
  var brandRuns = 0;
  function restartBrand(tile) {
    var img = $('.d-tmedia img', tile); if (!img) return;
    brandRuns++;
    img.src = LOGO_SRC + '?b=' + brandRuns;
  }
  function setLive(i) {
    if (touch || state.live === i) return;
    state.live = i;
    if (tilesWrap) { tilesWrap.classList.remove('d-l1', 'd-l2', 'd-l3'); if (i) tilesWrap.classList.add('d-l' + i); }
    tiles.forEach(function (t) {
      var n = +t.getAttribute('data-tile');
      t.classList.toggle('d-live', n === i);
      var v = $('[data-prev]', t);
      if (n === i) { if (v) playVid(v, true); else restartBrand(t); }
      else if (v && v.pause) v.pause();
    });
  }
  tiles.forEach(function (t) {
    var n = +t.getAttribute('data-tile');
    t.addEventListener('mouseenter', function () { setLive(n); });
    t.addEventListener('focus', function () { setLive(n); });
    t.addEventListener('blur', function () { setLive(0); });
    t.addEventListener('click', function (e) { e.preventDefault(); openLb(n); });
  });
  if (tilesWrap) tilesWrap.addEventListener('mouseleave', function () { setLive(0); });
  if (touch && hasIO) {
    var brandVis = false;
    var ioTile = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var t = e.target, vis = e.isIntersecting && e.intersectionRatio >= 0.5;
        var v = $('[data-prev]', t);
        if (!v) { if (vis && !brandVis) { brandVis = true; restartBrand(t); } else if (!vis) brandVis = false; return; }
        if (vis) playVid(v, false); else if (v.pause) v.pause();
      });
    }, { threshold: [0, 0.5, 1] });
    tiles.forEach(function (t) { ioTile.observe(t); });
  }

  /* ---------- 全螢幕看完整作品 ---------- */
  var lb = $('.d-lb'), lbVideo = lb ? $('video', lb) : null, lbImg = lb ? $('[data-lbi]', lb) : null;
  // 手機和小螢幕放 720p 版（檔案約一半），行動網路才不會一直轉圈；大螢幕維持 1080p
  var small = touch || (window.matchMedia && window.matchMedia('(max-width: 900px)').matches);
  var LB_SRC = {
    1: function () { return 'assets/brand-film.mp4?v=20261009b'; },
    2: function () { return 'assets/ere-original-' + (state.lang === 'en' ? 'en' : 'zh') + (small ? '-720' : '') + '.mp4?v=20261009g'; },
    3: function () { return small ? 'assets/yunjiao-reel-720.mp4?v=20261009g' : 'assets/yunjiao-reel.mp4'; }
  };
  var LB_POSTER = {
    1: function () { return 'assets/brand-poster.jpg?v=20261009b'; },
    2: function () { return 'assets/ere-poster-' + (state.lang === 'en' ? 'en' : 'zh') + '.jpg'; },
    3: function () { return 'assets/yunjiao-poster.jpg'; }
  };
  function fillLightbox(i) {
    if (!lb) return;
    var cap = TEXT[state.lang].cap[i];
    lb.setAttribute('aria-label', cap);
    var p = $('p', lb); if (p) p.textContent = cap;
    var frameBox = lbVideo ? lbVideo.parentNode : null;
    if (frameBox) frameBox.style.background = i === 1 ? '#E35E37' : '#000000';
    {
      if (lbImg) lbImg.hidden = true;
      if (lbVideo) {
        var src = LB_SRC[i]();
        lbVideo.hidden = false;
        if (lbVideo.getAttribute('src') !== src) { lbVideo.setAttribute('poster', LB_POSTER[i]()); lbVideo.setAttribute('src', src); }
        var pr = lbVideo.play(); if (pr && pr.catch) pr.catch(function () {});
      }
    }
  }
  function openLb(i) {
    if (!lb) return;
    setLive(0);
    state.lb = i;
    lb.hidden = false;
    document.body.classList.add('d-lock');
    fillLightbox(i);
    var x = $$('[data-act="close"]', lb).pop(); if (x) x.focus();
  }
  function closeLb() {
    if (!lb) return;
    state.lb = 0;
    if (lbVideo) { lbVideo.pause(); }
    lb.hidden = true;
    document.body.classList.remove('d-lock');
  }
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && state.lb) closeLb(); });

  /* ---------- manifesto 影片：線的點落到中央才開播，捲回去就重來 ---------- */
  function setFilmLine(hidden) {
    filmLineHidden = hidden;
    if (filmSeg >= 0 && segEls[filmSeg]) segEls[filmSeg].style.opacity = hidden ? '0' : '1';
  }
  function playFilm(fromStart) {
    if (!filmV) return;
    if (snd.on && filmV.muted) { filmV.muted = false; syncSound(); }
    filmV.playsInline = true;
    if (fromStart) { try { filmV.currentTime = 0; } catch (e) {} }
    var pr = filmV.play && filmV.play();
    if (pr && pr.then) pr.then(function () { if (filmPlayBtn) filmPlayBtn.hidden = true; }, function (err) {
      // 換語言、捲走造成的中斷不用處理；被瀏覽器擋下有聲播放就改靜音再試，還是不行才給播放鈕
      if (!err || err.name !== 'NotAllowedError' || !fs.played) return;
      if (!filmV.muted) { filmV.muted = true; syncSound(); playFilm(false); return; }
      if (filmPlayBtn) filmPlayBtn.hidden = false;
    });
  }
  function startFilm() {
    fs.played = true;
    film.classList.add('d-film-live');
    tipPlaced = false;
    playFilm(true);
  }
  function resetFilm() {
    fs.played = false;
    if (filmV) { filmV.pause(); try { filmV.currentTime = 0; } catch (e) {} }
    film.classList.remove('d-film-live');
    if (filmPlayBtn) filmPlayBtn.hidden = true;
    setFilmLine(false);
    tipPlaced = false;
  }
  function syncSound() {
    var b = film ? $('[data-act="film-sound"]', film) : null;
    if (b && filmV) b.setAttribute('aria-pressed', filmV.muted ? 'false' : 'true');
  }
  function syncFilmSrc() {
    if (!film || !filmV) return;
    var wide = film.clientWidth / Math.max(1, film.clientHeight) > 1.85;
    var src = filmV.getAttribute('data-film-' + state.lang + (wide ? '-wide' : ''));
    if (src && filmV.getAttribute('src') !== src) {
      var was = fs.played || filmLineHidden;
      filmV.setAttribute('src', src);
      if (was) resetFilm();
    }
  }
  if (film && filmV) {
    filmV.muted = true; filmV.defaultMuted = true;
    syncFilmSrc();
    window.addEventListener('resize', function () { clearTimeout(rt2); rt2 = setTimeout(syncFilmSrc, 200); });
    if (reduce) { film.classList.add('d-film-live'); if (filmPlayBtn) filmPlayBtn.hidden = false; }
    if (hasIO) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          fs.vis = e.isIntersecting && e.intersectionRatio >= 0.35;
          if (!e.isIntersecting && fs.played) { fs.played = false; filmV.pause(); try { filmV.currentTime = 0; } catch (er) {} }
        });
      }, { threshold: [0, 0.35] }).observe(film);
    } else fs.vis = true;
    langHooks.push(function () { if (fs.played) resetFilm(); syncFilmSrc(); });
  }

  /* ---------- 按鈕 ---------- */
  document.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('[data-act]') : null;
    if (!a) return;
    var act = a.getAttribute('data-act');
    if (act === 'lang') { e.preventDefault(); setLang(state.lang === 'en' ? 'zh' : 'en', true); }
    else if (act === 'close') { e.preventDefault(); closeLb(); }
    else if (act === 'film-sound' && filmV) { e.preventDefault(); filmV.muted = !filmV.muted; syncSound(); if (filmV.paused || filmV.ended) playFilm(filmV.ended); }
    else if (act === 'film-replay' && filmV) { e.preventDefault(); fs.played = true; playFilm(true); }
    else if (act === 'film-play' && filmV) { e.preventDefault(); fs.played = true; film.classList.add('d-film-live'); setFilmLine(true); playFilm(false); }
    else if (act === 'sound') {
      e.preventDefault();
      snd.on = !snd.on;
      $$('[data-act="sound"]').forEach(function (b) {
        b.setAttribute('aria-pressed', snd.on ? 'true' : 'false');
        b.setAttribute('aria-label', snd.on ? TEXT[state.lang].sndOff : TEXT[state.lang].sndOn);
      });
      if (snd.on) {
        if (!snd.intro) { snd.intro = new Audio('assets/intro-sound.mp3?v=20261009h'); snd.intro.preload = 'auto'; }
        if (!snd.tap) { snd.tap = new Audio('assets/tap-sound.mp3?v=20261009e'); snd.tap.preload = 'auto'; }
        // 首屏還看得到就整段開場帶聲音重播一次
        var hr = hero ? hero.getBoundingClientRect() : null;
        if (hr && hr.bottom > window.innerHeight * 0.5) runIntro();
        if (filmV && fs.played && !filmV.paused) { filmV.muted = false; syncSound(); }
      } else {
        if (snd.intro) snd.intro.pause();
        if (filmV && !filmV.muted) { filmV.muted = true; syncSound(); }
      }
    }
    else if (act === 'top') { e.preventDefault(); window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }); }
  });

  /* ---------- 游標旁的點、點一下掉下來的點 ---------- */
  function colorAt(y) {
    for (var i = 0; i < bgSecs.length; i++) { var r = bgSecs[i].getBoundingClientRect(); if (y >= r.top && y <= r.bottom) return '#FFFFFF'; }
    return '#435BD8';
  }
  if (!reduce) {
    var cur = $('[data-cursor]'), inner = cur ? cur.firstElementChild : null, drops = $('[data-drops]');
    var tx = -100, ty = -100, cx = -100, cy = -100, following = false;
    var finePointer = window.matchMedia && window.matchMedia('(pointer: fine)').matches;
    if (cur) cur.style.transform = 'translate(-100px, -100px)';
    // 游標旁的點只在有滑鼠時跑，而且停下來就不再每格重畫
    function follow() {
      cx += (tx - cx) * 0.22; cy += (ty - cy) * 0.22;
      if (cur) cur.style.transform = 'translate(' + cx + 'px, ' + cy + 'px)';
      if (Math.abs(tx - cx) < 0.2 && Math.abs(ty - cy) < 0.2) { following = false; return; }
      requestAnimationFrame(follow);
    }
    window.addEventListener('pointermove', function (e) {
      tx = e.clientX; ty = e.clientY;
      if (!cur || !finePointer || e.pointerType === 'touch') return;
      if (!following) { following = true; requestAnimationFrame(follow); }
      var t = e.target.closest ? e.target.closest('a, button') : null;
      cur.classList.toggle('d-cursor-big', !!t);
      if (inner) inner.style.background = colorAt(ty);
    }, { passive: true });
    window.addEventListener('pointerdown', function (e) {
      if (cur) { cur.classList.add('d-cursor-press'); setTimeout(function () { cur.classList.remove('d-cursor-press'); }, 160); }
      if (!drops || state.lb) return;
      if (!(e.target.closest && e.target.closest('a, button, video'))) sndPlay(snd.tap, 0.35);
      var d = document.createElement('span');
      d.className = 'd-tapdot'; d.setAttribute('aria-hidden', 'true');
      d.style.left = Math.round(e.clientX) + 'px'; d.style.top = Math.round(e.clientY) + 'px'; d.style.background = colorAt(e.clientY);
      drops.appendChild(d);
      setTimeout(function () { d.remove(); }, 1600);
    }, { passive: true });
  }

  /* ---------- 開始 ---------- */
  measure();
  // 等畫面真的畫出來再開始序幕，手機上才不會一開場就少了前幾格
  requestAnimationFrame(function () { requestAnimationFrame(runIntro); });
  requestAnimationFrame(frame);

  /* ---------- 影片快捲到了才開始下載，首屏不跟 logo 搶網路 ---------- */
  if (hasIO) {
    var ioPre = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var v = e.target;
        ioPre.unobserve(v);
        if (v.getAttribute('preload') === 'none') {
          v.setAttribute('preload', 'auto');
          if (v.getAttribute('src') && v.readyState === 0 && v.paused) { try { v.load(); } catch (er) {} }
        }
      });
    }, { rootMargin: '800px 0px' });
    $$('video[preload="none"]').forEach(function (v) { if (!v.hasAttribute('data-lbv')) ioPre.observe(v); });
  } else {
    $$('video[preload="none"]').forEach(function (v) { v.setAttribute('preload', 'metadata'); });
  }
})();
