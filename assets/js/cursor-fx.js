// ═══════════════════════════════════════════════════════
// MARKETPULSE — CURSOR FX
// Terminal crosshair cursor + click burst particles
// Sentiment-aware: colors shift with Fear & Greed index
// ═══════════════════════════════════════════════════════

(function () {
  'use strict';

  // ── CONFIG ───────────────────────────────────────────
  const SIZE   = 32;   // cursor canvas px
  const HALF   = SIZE / 2;
  const STORED = 'mp-cursor-fx';

  // Sentiment → cursor color + symbol
  const SENTIMENTS = {
    'Extreme Fear': { color: '#ef4444', symbol: '▼', label: 'EXTREME FEAR' },
    'Fear':         { color: '#f97316', symbol: '▼', label: 'FEAR'         },
    'Neutral':      { color: '#f0a500', symbol: '◆', label: 'NEUTRAL'      },
    'Greed':        { color: '#22c55e', symbol: '▲', label: 'GREED'        },
    'Extreme Greed':{ color: '#10b981', symbol: '▲', label: 'EXTREME GREED'},
  };
  const DEFAULT_SENTIMENT = { color: '#f0a500', symbol: '◆', label: 'NEUTRAL' };

  // Click burst particles
  const BURST_SYMBOLS = ['$', '¢', '₿', '+', '×', '◆', '▲'];
  const BURST_COUNT   = 10;

  // ── STATE ────────────────────────────────────────────
  let enabled   = localStorage.getItem(STORED) !== 'false';
  let sentiment = DEFAULT_SENTIMENT;
  let particles = [];
  let rafId     = null;
  let canvas, ctx;

  // ── CURSOR CANVAS ────────────────────────────────────
  function drawCursor(s) {
    const c   = document.createElement('canvas');
    c.width   = SIZE;
    c.height  = SIZE;
    const cx  = c.getContext('2d');
    const col = s.color;

    // outer thin ring
    cx.strokeStyle = col;
    cx.lineWidth   = 1;
    cx.globalAlpha = 0.35;
    cx.beginPath();
    cx.arc(HALF, HALF, HALF - 1, 0, Math.PI * 2);
    cx.stroke();
    cx.globalAlpha = 1;

    // crosshair lines
    cx.strokeStyle = col;
    cx.lineWidth   = 1.5;
    const gap = 4, arm = 10;
    // horizontal
    cx.beginPath(); cx.moveTo(HALF - arm, HALF); cx.lineTo(HALF - gap, HALF); cx.stroke();
    cx.beginPath(); cx.moveTo(HALF + gap, HALF); cx.lineTo(HALF + arm, HALF); cx.stroke();
    // vertical
    cx.beginPath(); cx.moveTo(HALF, HALF - arm); cx.lineTo(HALF, HALF - gap); cx.stroke();
    cx.beginPath(); cx.moveTo(HALF, HALF + gap); cx.lineTo(HALF, HALF + arm); cx.stroke();

    // center dot
    cx.fillStyle = col;
    cx.beginPath();
    cx.arc(HALF, HALF, 1.5, 0, Math.PI * 2);
    cx.fill();

    // sentiment symbol — tiny, top-right quadrant
    cx.fillStyle   = col;
    cx.font        = 'bold 7px monospace';
    cx.textAlign   = 'center';
    cx.textBaseline = 'middle';
    cx.fillText(s.symbol, HALF + 8, HALF - 8);

    return c.toDataURL();
  }

  function applyCursor() {
    if (!enabled) {
      document.documentElement.style.cursor = '';
      document.body.style.cursor = '';
      return;
    }
    const url = drawCursor(sentiment);
    const rule = `url("${url}") ${HALF} ${HALF}, crosshair`;
    document.documentElement.style.cursor = rule;
    document.body.style.cursor = rule;
  }

  // ── PARTICLE BURST ───────────────────────────────────
  function spawnBurst(x, y) {
    if (!enabled) return;
    for (let i = 0; i < BURST_COUNT; i++) {
      const angle  = (Math.PI * 2 / BURST_COUNT) * i + (Math.random() - 0.5) * 0.8;
      const speed  = 1.5 + Math.random() * 3;
      particles.push({
        x, y,
        vx:    Math.cos(angle) * speed,
        vy:    Math.sin(angle) * speed - 1.5,
        alpha: 1,
        sym:   BURST_SYMBOLS[Math.floor(Math.random() * BURST_SYMBOLS.length)],
        size:  9 + Math.floor(Math.random() * 7),
        color: sentiment.color,
        decay: 0.03 + Math.random() * 0.02,
      });
    }
    if (!rafId) loop();
  }

  function loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles = particles.filter(p => p.alpha > 0.01);

    for (const p of particles) {
      ctx.globalAlpha  = p.alpha;
      ctx.fillStyle    = p.color;
      ctx.font         = `bold ${p.size}px monospace`;
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(p.sym, p.x, p.y);
      p.x     += p.vx;
      p.y     += p.vy;
      p.vy    += 0.12;          // gravity
      p.alpha -= p.decay;
    }

    ctx.globalAlpha = 1;
    rafId = particles.length ? requestAnimationFrame(loop) : null;
  }

  // ── PARTICLE CANVAS SETUP ────────────────────────────
  function initCanvas() {
    canvas        = document.createElement('canvas');
    canvas.id     = 'cursorFxCanvas';
    canvas.style.cssText = [
      'position:fixed', 'inset:0', 'width:100%', 'height:100%',
      'pointer-events:none', 'z-index:999998', 'display:block',
    ].join(';');
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    document.body.appendChild(canvas);
    ctx = canvas.getContext('2d');

    window.addEventListener('resize', () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    });
  }

  // ── TOGGLE BUTTON ────────────────────────────────────
  function initToggle() {
    const btn = document.getElementById('cursorFxToggle');
    if (!btn) return;
    btn.title = 'Toggle cursor FX';

    function updateBtn() {
      btn.style.opacity = enabled ? '1' : '0.4';
      btn.style.color   = enabled ? sentiment.color : '';
    }
    updateBtn();

    btn.addEventListener('click', () => {
      enabled = !enabled;
      localStorage.setItem(STORED, enabled);
      applyCursor();
      updateBtn();
      if (window.Toast) Toast.show(enabled ? 'CURSOR FX ON' : 'CURSOR FX OFF');
    });

    // expose so sentiment update can refresh button color
    window._cursorFxUpdateBtn = updateBtn;
  }

  // ── SENTIMENT HOOK ───────────────────────────────────
  // Polls window.MP_FEAR_GREED (set by app.js) every 5 seconds
  function pollSentiment() {
    const val = window.MP_FEAR_GREED;
    if (typeof val === 'number') {
      let label;
      if      (val <= 24) label = 'Extreme Fear';
      else if (val <= 44) label = 'Fear';
      else if (val <= 55) label = 'Neutral';
      else if (val <= 74) label = 'Greed';
      else                label = 'Extreme Greed';

      const next = SENTIMENTS[label];
      if (next && next.color !== sentiment.color) {
        sentiment = next;
        applyCursor();
        window._cursorFxUpdateBtn?.();
      }
    }
    setTimeout(pollSentiment, 5000);
  }

  // ── INIT ─────────────────────────────────────────────
  function init() {
    // Don't run on touch-only devices (no cursor)
    if (window.matchMedia('(hover: none)').matches) return;

    initCanvas();
    initToggle();
    applyCursor();
    pollSentiment();

    document.addEventListener('click', e => spawnBurst(e.clientX, e.clientY));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
