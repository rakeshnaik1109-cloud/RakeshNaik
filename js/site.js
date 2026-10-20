/* ═══════════════════════════════════════════════════════════════════
   rakeshnaik — site behaviour
   Vanilla, dependency-free, and quiet. Everything degrades to a
   perfectly readable page if JavaScript never runs.
═══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── Mobile navigation ─────────────────────────────────────────── */
  var toggle = document.querySelector('.nav-toggle');
  var links = document.querySelector('.nav-links');

  if (toggle && links) {
    toggle.addEventListener('click', function () {
      var open = links.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(open));
    });
    links.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        links.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ── Sticky nav hairline + scroll progress ─────────────────────── */
  var nav = document.querySelector('.nav');
  var line = document.querySelector('.scroll-line');
  var ticking = false;

  function onScroll() {
    var y = window.scrollY;
    if (nav) nav.classList.toggle('is-stuck', y > 12);
    if (line) {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      line.style.width = (max > 0 ? (y / max) * 100 : 0) + '%';
    }
    ticking = false;
  }

  window.addEventListener('scroll', function () {
    if (!ticking) { window.requestAnimationFrame(onScroll); ticking = true; }
  }, { passive: true });
  onScroll();

  /* ── Scroll reveal ─────────────────────────────────────────────── */
  var reveals = document.querySelectorAll('.reveal');

  if (reduced || !('IntersectionObserver' in window)) {
    reveals.forEach(function (el) { el.classList.add('is-in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    reveals.forEach(function (el) { io.observe(el); });
  }

  /* ── Hero spectrum: tap a band to pin its assignment ───────────── */
  document.querySelectorAll('.band').forEach(function (band) {
    band.setAttribute('tabindex', '0');
    band.addEventListener('click', function () {
      var wasOpen = band.classList.contains('is-open');
      document.querySelectorAll('.band.is-open').forEach(function (b) { b.classList.remove('is-open'); });
      band.classList.toggle('is-open', !wasOpen);
    });
    band.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); band.click(); }
    });
  });

  /* ── Blog: expand a post in place ──────────────────────────────── */
  document.querySelectorAll('.post-toggle').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var post = btn.closest('.post');
      var open = post.classList.toggle('is-open');
      btn.textContent = open ? btn.dataset.less || 'Show less ↑' : btn.dataset.more || 'Read the full story ↓';
      btn.setAttribute('aria-expanded', String(open));
    });
  });

  /* ── Gallery lightbox ──────────────────────────────────────────── */
  var box = document.getElementById('lightbox');
  if (box) {
    var shots = Array.prototype.slice.call(document.querySelectorAll('.shot'));
    var img = box.querySelector('img');
    var cap = box.querySelector('.lightbox-cap');
    var at = 0;

    function show(i) {
      at = (i + shots.length) % shots.length;
      var source = shots[at].querySelector('img');
      var text = shots[at].querySelector('figcaption');
      img.src = source.currentSrc || source.src;
      img.alt = source.alt || '';
      cap.textContent = text ? text.textContent.trim() : '';
    }

    function open(i) {
      show(i);
      box.classList.add('is-open');
      document.body.style.overflow = 'hidden';
      box.querySelector('.lb-close').focus();
    }

    function close() {
      box.classList.remove('is-open');
      document.body.style.overflow = '';
      if (shots[at]) shots[at].focus();
    }

    shots.forEach(function (shot, i) {
      shot.setAttribute('tabindex', '0');
      shot.setAttribute('role', 'button');
      shot.addEventListener('click', function () { open(i); });
      shot.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(i); }
      });
    });

    box.querySelector('.lb-close').addEventListener('click', close);
    box.querySelector('.lb-prev').addEventListener('click', function () { show(at - 1); });
    box.querySelector('.lb-next').addEventListener('click', function () { show(at + 1); });
    box.addEventListener('click', function (e) { if (e.target === box) close(); });

    document.addEventListener('keydown', function (e) {
      if (!box.classList.contains('is-open')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') show(at - 1);
      if (e.key === 'ArrowRight') show(at + 1);
    });
  }

  /* ── Footer year ───────────────────────────────────────────────── */
  document.querySelectorAll('[data-year]').forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });
})();
