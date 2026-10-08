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
  var logoImg = $('[data-logo-img]');
  var LOGO_SRC = logoImg ? logoImg.getAttribute('src') : '';
  // logo 動畫先在背景下載好；還沒好之前，序幕停在那顆點上等它，不會出現空白
  var logoReady = !LOGO_SRC;
  if (LOGO_SRC) {
    var logoPre = new Image();
    logoPre.onload = logoPre.onerror = function () { logoReady = true; };
    logoPre.src = LOGO_SRC;
    if (logoPre.complete) logoReady = true;
  }
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
  var logoRuns = 0;
  function showLogo() {
    if (!logoImg) return;
    logoImg.hidden = false;
    // 第一次直接播；之後重播要換一個網址，瀏覽器才會讓動畫從頭開始
    logoRuns++;
    logoImg.src = logoRuns > 1 ? LOGO_SRC + '?r=' + logoRuns : LOGO_SRC;
  }
  function finishIntro() { state.introDone = true; updateTarget(); }
  function runIntro() {
    cancelAnimationFrame(introRaf);
    state.introDone = false;
    state.target = 0;
    if (logoImg) logoImg.hidden = true;
    sndPlay(snd.intro, 0.85);
    var cv = $('[data-intro]');
    var sp = startPoint();
    if (reduce || !cv || !cv.getContext || !sp) { showLogo(); finishIntro(); return; }
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W = sp.sr.width, H = sp.sr.height;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    var ctx = cv.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var px = sp.x, py = sp.y;
    var N = Math.round(Math.min(240, Math.max(100, W * H / 5200)));
    var parts = [];
    for (var i = 0; i < N; i++) {
      var x = Math.random() * W, y = Math.random() * H, dx = px - x, dy = py - y, len = Math.sqrt(dx * dx + dy * dy) || 1;
      parts.push({ x: x, y: y, r: 1.4 + Math.random() * 2.8, blue: Math.random() < 0.28, delay: Math.random() * 0.5, bend: (Math.random() - 0.5) * 0.6 * len, nx: -dy / len, ny: dx / len, ph: Math.random() * 6.28 });
    }
    var t0 = performance.now(), HOLD = 0.6, FLY = 1.0, END = HOLD + 0.5 + FLY, logoShown = false;
    var ease = function (t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
    (function step(now) {
      var t = (now - t0) / 1000, arrived = 0;
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
      if (frac > 0) {
        var sq = frac >= 1 ? Math.max(0, 1 - (t - END) * 4) : 0;
        ctx.globalAlpha = 1; ctx.fillStyle = '#FFFFFF';
        ctx.save(); ctx.translate(px, py); ctx.scale(1 + 0.45 * sq, 1 - 0.45 * sq);
        ctx.beginPath(); ctx.arc(0, 0, 2 + 4 * frac, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      }
      if (!logoShown && t > HOLD + FLY * 0.85 && logoReady) { logoShown = true; showLogo(); }
      if (frac >= 1 && t > END + 0.3 && logoShown) {
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
  var segs = null, totalL = 0, ymax = null, ylen = null, STEP = 6, bounds = {}, rootTopDoc = 0, tipPlaced = false;
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
  var LB_SRC = {
    1: function () { return 'assets/brand-film.mp4?v=20261009b'; },
    2: function () { return state.lang === 'en' ? 'assets/ere-original-en.mp4?v=20261009f' : 'assets/ere-original-zh.mp4?v=20261009f'; },
    3: function () { return 'assets/yunjiao-reel.mp4'; }
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
        if (lbVideo.getAttribute('src') !== src) lbVideo.setAttribute('src', src);
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
        if (!snd.intro) { snd.intro = new Audio('assets/intro-sound.mp3?v=20261009e'); snd.intro.preload = 'auto'; }
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
    var tx = -100, ty = -100, cx = -100, cy = -100;
    window.addEventListener('pointermove', function (e) {
      tx = e.clientX; ty = e.clientY;
      if (!cur) return;
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
    (function follow() {
      cx += (tx - cx) * 0.22; cy += (ty - cy) * 0.22;
      if (cur) cur.style.transform = 'translate(' + cx + 'px, ' + cy + 'px)';
      requestAnimationFrame(follow);
    })();
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
