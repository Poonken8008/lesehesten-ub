/* Lesehesten UB – premium-lag: intro, myk scrolling, reveals, 3D-tilt, magnetiske knapper og lys i toppen.
   Rører ikke skjemaet; app.js håndterer det som før. */
(function () {
  'use strict';
  var html = document.documentElement;
  var reduce = html.classList.contains('reduce');
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };

  /* ---------- Overskrift ord for ord (teksten blir stående i DOM) ---------- */
  var h1 = $('.hero h1');
  if (h1 && !reduce) {
    var idx = 0;
    var wrapWords = function (node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
            var w = document.createElement('span'); w.className = 'w';
            var i = document.createElement('span'); i.textContent = part; i.style.setProperty('--i', idx++);
            w.appendChild(i); frag.appendChild(w);
          });
          node.replaceChild(frag, n);
        } else if (n.nodeType === 1) wrapWords(n);
      });
    };
    wrapWords(h1);
  }
  $$('.hero .tag, .hero .lead, .hero__actions, .hero .pills').forEach(function (el, i) {
    el.classList.add('hero-in'); el.style.setProperty('--d', [0, 520, 640, 760][i]);
  });

  /* ---------- Myk scrolling (Lenis) ---------- */
  var lenis = null;
  if (!reduce && window.Lenis) {
    lenis = new window.Lenis({ duration: 1.1, smoothWheel: true, easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); } });
    window.__lenis = lenis;
    $$('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var id = a.getAttribute('href');
        if (id.length < 2) return;
        var t = document.getElementById(id.slice(1));
        if (!t) return;
        e.preventDefault();
        lenis.scrollTo(id === '#top' ? 0 : t, { offset: -84 });
      });
    });
    var raf = function (time) { lenis.raf(time); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
  }

  /* ---------- Intro ---------- */
  function ready() {
    html.classList.add('ready');
    if (lenis) lenis.start();
    document.dispatchEvent(new CustomEvent('lesehest:ready'));
  }
  if (html.classList.contains('intro')) {
    if (lenis) lenis.stop();
    try { sessionStorage.setItem('lesehest-intro', '1'); } catch (e) {}
    setTimeout(function () {
      html.classList.add('leaving');
      setTimeout(ready, 250);
      setTimeout(function () { html.classList.remove('intro', 'leaving'); }, 950);
    }, 1150);
  } else {
    requestAnimationFrame(function () { requestAnimationFrame(ready); });
  }

  /* ---------- Scroll-reveals ---------- */
  var groups = [
    ['#hvorfor .kicker, #hvorfor h2, #hvorfor .intro, #hvorfor .mission', 90],
    ['.cards .card', 120, 'rv--pop'],
    ['.book__art', 0, 'rv--pop'], ['.book__text > *', 70],
    ['.story > *', 70],
    ['.about__badge', 0, 'rv--pop'], ['.about > div:last-child > *', 80],
    ['.order__intro > *', 80], ['.form', 120],
    ['.support > *', 80],
    ['.faq > *', 50],
    ['.footer__inner > *', 100]
  ];
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.01 });
  if (!reduce) {
    groups.forEach(function (g) {
      $$(g[0]).forEach(function (el, i) {
        el.classList.add('rv'); if (g[2]) el.classList.add(g[2]);
        el.style.setProperty('--d', Math.min(i * g[1], 600));
        io.observe(el);
      });
    });
  }

  /* ---------- Løpende bånd: dupliser og kjør bare når synlig ---------- */
  var mq = $('.marquee');
  if (mq && !reduce) {
    var track = $('.marquee__track', mq);
    Array.prototype.slice.call(track.children).forEach(function (c) { track.appendChild(c.cloneNode(true)); });
    new IntersectionObserver(function (en) { mq.classList.toggle('is-on', en[0].isIntersecting); }).observe(mq);
  }

  /* ---------- Topplinje og mobilknapp ---------- */
  var topbar = $('.topbar'), sticky = $('#sticky-cta'), hero = $('.hero');
  var onScroll = function () {
    var y = window.scrollY;
    topbar.classList.toggle('is-scrolled', y > 20);
    if (sticky && hero) sticky.classList.toggle('is-top', y < hero.offsetHeight * 0.55);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if (reduce) { startGl(); return; }

  /* ---------- 3D-tilt: emblem i hero og bokomslaget ---------- */
  var stage = $('.emblem-stage'), cover = $('.cover'), glare = $('.cover__glare');
  if (fine) {
    var heroEl = $('.hero');
    heroEl.addEventListener('pointermove', function (e) {
      var r = stage.getBoundingClientRect();
      var x = clamp((e.clientX - (r.left + r.width / 2)) / window.innerWidth, -.5, .5);
      var y = clamp((e.clientY - (r.top + r.height / 2)) / window.innerHeight, -.5, .5);
      stage.style.setProperty('--ry', (x * 22).toFixed(2) + 'deg');
      stage.style.setProperty('--rx', (-y * 18).toFixed(2) + 'deg');
    });
    heroEl.addEventListener('pointerleave', function () { stage.style.setProperty('--rx', '0deg'); stage.style.setProperty('--ry', '0deg'); });
    if (cover) {
      cover.addEventListener('pointermove', function (e) {
        var r = cover.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        cover.style.setProperty('--ry', ((x - .5) * 24).toFixed(2) + 'deg');
        cover.style.setProperty('--rx', ((.5 - y) * 18).toFixed(2) + 'deg');
        glare.style.setProperty('--gx', (x * 100).toFixed(1) + '%');
        glare.style.setProperty('--gy', (y * 100).toFixed(1) + '%');
      });
      cover.addEventListener('pointerleave', function () { cover.style.setProperty('--rx', '0deg'); cover.style.setProperty('--ry', '0deg'); });
    }
    /* lys som følger musa på kortene */
    $$('.card').forEach(function (c) {
      c.addEventListener('pointermove', function (e) {
        var r = c.getBoundingClientRect();
        c.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        c.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
    });
    /* magnetiske knapper */
    $$('.btn--primary, .btn--sun').forEach(function (b) {
      b.addEventListener('pointermove', function (e) {
        var r = b.getBoundingClientRect();
        var dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
        var k = b.id === 'submit-btn' ? .08 : .25;
        b.classList.add('is-magnet');
        b.style.translate = (dx * k).toFixed(1) + 'px ' + (dy * k * 1.4).toFixed(1) + 'px';
      });
      b.addEventListener('pointerleave', function () { b.classList.remove('is-magnet'); b.style.translate = ''; });
    });
  }

  /* ---------- Svak parallax: omslaget svever ---------- */
  if (cover) {
    var vh = window.innerHeight;
    window.addEventListener('resize', function () { vh = window.innerHeight; });
    var bookVisible = false;
    new IntersectionObserver(function (en) { bookVisible = en[0].isIntersecting; if (bookVisible) requestAnimationFrame(par); }).observe(cover);
    var par = function (t) {
      if (!bookVisible) return;
      var r = cover.getBoundingClientRect();
      var c = (r.top + r.height / 2 - vh / 2) * -0.06 + Math.sin(t / 900) * 6;
      cover.style.setProperty('--fy', c.toFixed(1) + 'px');
      requestAnimationFrame(par);
    };
  }

  /* ---------- Lys og stjerner i toppen: lastes først når siden er klar ---------- */
  document.addEventListener('lesehest:ready', function () {
    (window.requestIdleCallback || function (f) { setTimeout(f, 200); })(startGl, { timeout: 1200 });
  });
  function startGl() {
    var cv = $('.hero-gl');
    if (!cv) return;
    var s = document.createElement('script');
    s.src = 'hero-gl.js?v=1'; s.async = true;
    s.onload = function () { if (window.startHeroGl) window.startHeroGl(cv); };
    document.body.appendChild(s);
  }
})();
