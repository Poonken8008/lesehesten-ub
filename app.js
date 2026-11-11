(function () {
  'use strict';
  var PRICE = 249;
  var fmt = function (n) { return n.toLocaleString('nb-NO') + ' kr'; };

  var form = document.getElementById('order-form');
  var qty = document.getElementById('antall');
  var sum = document.getElementById('total-sum');
  var btnSum = document.getElementById('btn-sum');
  var totalField = document.getElementById('total-field');
  var next = document.getElementById('next-url');
  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  // Takk-siden ligger ved siden av index.html, uansett hvor siden publiseres
  if (next && /^https?:$/.test(location.protocol)) {
    next.value = new URL('takk.html', location.href.split('#')[0]).href;
  }

  function count() {
    var n = parseInt(qty.value, 10);
    return isNaN(n) ? 0 : n;
  }
  function updateTotal() {
    var n = Math.max(0, Math.min(50, count()));
    var t = fmt(n * PRICE);
    sum.textContent = t;
    btnSum.textContent = t;
    totalField.value = n + ' × 249 kr = ' + t;
  }
  qty.addEventListener('input', updateTotal);
  document.querySelectorAll('.qty__btn').forEach(function (b) {
    b.addEventListener('click', function () {
      var n = count() + parseInt(b.getAttribute('data-step'), 10);
      qty.value = Math.max(1, Math.min(50, n));
      updateTotal();
      validateField(qty);
    });
  });

  var rules = {
    navn: function (v) { return v.trim().length >= 2 ? '' : 'Skriv inn navnet ditt.'; },
    epost: function (v) {
      if (!v.trim()) return 'Skriv inn e-postadressen din.';
      return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? '' : 'Sjekk at e-postadressen er riktig (f.eks. navn@eksempel.no).';
    },
    tlf: function (v) {
      if (!v.trim()) return '';
      return /^\+?[\d\s()-]{8,16}$/.test(v.trim()) ? '' : 'Telefonnummeret ser ikke riktig ut.';
    },
    antall: function (v) {
      var n = parseInt(v, 10);
      if (isNaN(n) || n < 1) return 'Velg minst 1 bok.';
      if (n > 50) return 'Vil du ha mer enn 50 bøker? Skriv det i meldingen.';
      return '';
    }
  };

  function validateField(el) {
    var rule = rules[el.id];
    if (!rule) return true;
    var msg = rule(el.value);
    var err = document.getElementById(el.id + '-err');
    if (err) err.textContent = msg;
    el.setAttribute('aria-invalid', msg ? 'true' : 'false');
    return !msg;
  }

  Object.keys(rules).forEach(function (id) {
    var el = document.getElementById(id);
    el.addEventListener('blur', function () { validateField(el); });
    el.addEventListener('input', function () {
      if (el.getAttribute('aria-invalid') === 'true') validateField(el);
    });
  });

  form.addEventListener('submit', function (e) {
    var firstBad = null;
    Object.keys(rules).forEach(function (id) {
      var el = document.getElementById(id);
      if (!validateField(el) && !firstBad) firstBad = el;
    });
    if (firstBad) {
      e.preventDefault();
      firstBad.focus();
      return;
    }
    updateTotal();
    var btn = document.getElementById('submit-btn');
    btn.disabled = true;
    btn.textContent = 'Sender …';
  });

  // Skjul den faste mobilknappen når skjemaet, historien eller støtt-seksjonen er synlig
  var sticky = document.getElementById('sticky-cta');
  var hideWhen = ['bestill', 'historien', 'stott'];
  if (sticky && 'IntersectionObserver' in window) {
    var visible = {};
    var syncSticky = function () {
      var any = hideWhen.some(function (id) { return visible[id]; });
      sticky.classList.toggle('is-hidden', any);
    };
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        visible[entry.target.id] = entry.isIntersecting;
      });
      syncSticky();
    }, { threshold: 0.15 });
    hideWhen.forEach(function (id) {
      var el = document.getElementById(id);
      if (el) obs.observe(el);
    });
  }

  // Kopier Vipps-nummer
  var copyBtn = document.getElementById('copy-vipps');
  var copyFeedback = document.getElementById('copy-feedback');
  var copyTimer;
  function fallbackCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    var ok = false;
    try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
    document.body.removeChild(ta);
    return ok;
  }
  function showCopied(ok) {
    if (!copyFeedback) return;
    copyFeedback.textContent = ok ? 'Kopiert!' : 'Kunne ikke kopiere. Skriv av nummeret 960 40 533.';
    clearTimeout(copyTimer);
    copyTimer = setTimeout(function () { copyFeedback.textContent = ''; }, 2500);
  }
  if (copyBtn) {
    copyBtn.addEventListener('click', function () {
      var number = copyBtn.getAttribute('data-number') || '96040533';
      var done = function () { showCopied(true); };
      var fail = function () {
        if (fallbackCopy(number)) done();
        else showCopied(false);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(number).then(done).catch(fail);
      } else {
        fail();
      }
    });
  }

  updateTotal();
})();
