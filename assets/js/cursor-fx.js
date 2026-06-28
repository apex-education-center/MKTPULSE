/**
 * cursor-fx.js — MarketPulse Chart Tracer Cursor
 *
 * DEFAULT  → amber "current price" dot + fading polyline trail (chart line)
 * HOVER    → dot becomes endpoint bracket [ ] snapped to grid, trail pauses
 * CLICK    → random green (▲ BUY) or red (▼ SELL) flash floats up from cursor
 *
 * Toggle    → button#cursorFxToggle enables/disables the whole effect.
 *             State is remembered in localStorage across pages/reloads.
 *
 * Drop in assets/js/, add before </body>:
 *   <script src="assets/js/cursor-fx.js"></script>
 */
(function () {
  'use strict';

  /* ── skip touch ── */
  if (window.matchMedia('(pointer: coarse)').matches) return;

  const STORAGE_KEY = 'mp-cursor-fx-disabled';
  const AMBER      = '#ffaa00';
  const GREEN      = '#00c853';
  const RED        = '#ff1744';
  const TRAIL_LEN  = 28;
  const TRAIL_MS   = 520;
  const DOT_R      = 4;
  const BRACKET_W  = 16;
  const BRACKET_H  = 10;

  let active = false;
  let css = null, svg = null;
  let segments = [], dot = null, bracket = null, hLine = null, tickLabel = null;
  let trail = [];
  let mx = -300, my = -300;
  let isHover = false;
  let fakePrice = 100 + Math.random() * 900;
  let lastY = my;
  let rafId = null;

  const NS = 'http://www.w3.org/2000/svg';

  function updateFakePrice(y) {
    const dy = lastY - y;
    fakePrice = Math.max(0.01, fakePrice + dy * 0.08 + (Math.random() - .5) * 0.3);
    lastY = y;
    return fakePrice.toFixed(2);
  }

  function onMouseMove(e) { mx = e.clientX; my = e.clientY; }
  function onMouseOver(e) {
    if (e.target.closest && e.target.closest(HOVER_SEL)) isHover = true;
  }
  function onMouseOut(e) {
    if (e.target.closest && e.target.closest(HOVER_SEL)) isHover = false;
  }
  function onMouseDown(e) {
    const sig   = SIGNALS[Math.random() < .5 ? 0 : 1];
    const el    = document.createElement('div');
    const price = fakePrice.toFixed(2);
    el.className  = 'mp-signal';
    el.textContent = `${sig.label}  ${price}`;
    el.style.color = sig.color;
    el.style.left  = (e.clientX + 10) + 'px';
    el.style.top   = (e.clientY - 6) + 'px';
    document.body.appendChild(el);

    dot.setAttribute('fill', sig.color);
    dot.setAttribute('stroke', sig.color.replace(')', ',.25)').replace('rgb', 'rgba'));
    setTimeout(() => {
      if (!dot) return;
      dot.setAttribute('fill', AMBER);
      dot.setAttribute('stroke', 'rgba(255,170,0,.3)');
    }, 260);

    el.addEventListener('animationend', () => el.remove());
  }
  function onMouseLeave() { if (svg) svg.style.opacity = '0'; }
  function onMouseEnter() { if (svg) svg.style.opacity = '1'; }

  const HOVER_SEL = 'a,button,[role="button"],input,select,textarea,.chip,.vc,.yt-topic,.nav-link,.card,label,[onclick],.btn,.vc-thumb';
  const SIGNALS = [
    { label: '▲ BUY',  color: GREEN },
    { label: '▼ SELL', color: RED   },
  ];

  function frame() {
    if (!active) return;
    const now = Date.now();

    if (!isHover) {
      trail.push({ x: mx, y: my, t: now });
      if (trail.length > TRAIL_LEN) trail.shift();
    }
    trail = trail.filter(p => now - p.t < TRAIL_MS * 1.5);

    const POOL_SIZE = TRAIL_LEN - 1;
    for (let i = 0; i < POOL_SIZE; i++) {
      const a = trail[i], b = trail[i + 1];
      if (!a || !b) { segments[i].style.opacity = '0'; continue; }
      const age  = now - b.t;
      const fade = Math.max(0, 1 - age / TRAIL_MS);
      segments[i].setAttribute('x1', a.x);
      segments[i].setAttribute('y1', a.y);
      segments[i].setAttribute('x2', b.x);
      segments[i].setAttribute('y2', b.y);
      segments[i].style.opacity = (fade * 0.85).toFixed(3);
    }

    dot.setAttribute('cx', mx);
    dot.setAttribute('cy', my);

    const priceStr = updateFakePrice(my);
    tickLabel.textContent = priceStr;
    tickLabel.setAttribute('x', mx + 10);
    tickLabel.setAttribute('y', my - 8);

    if (isHover) {
      const gx = Math.round(mx / 8) * 8;
      const gy = Math.round(my / 8) * 8;
      const bw = BRACKET_W, bh = BRACKET_H, arm = 5;
      const d = [
        `M${gx-bw},${gy-bh+arm} L${gx-bw},${gy-bh} L${gx-bw+arm},${gy-bh}`,
        `M${gx+bw-arm},${gy-bh} L${gx+bw},${gy-bh} L${gx+bw},${gy-bh+arm}`,
        `M${gx-bw},${gy+bh-arm} L${gx-bw},${gy+bh} L${gx-bw+arm},${gy+bh}`,
        `M${gx+bw-arm},${gy+bh} L${gx+bw},${gy+bh} L${gx+bw},${gy+bh-arm}`,
      ].join(' ');
      bracket.setAttribute('d', d);
      bracket.style.opacity = '1';

      hLine.setAttribute('x1', 0);
      hLine.setAttribute('y1', gy);
      hLine.setAttribute('x2', window.innerWidth);
      hLine.setAttribute('y2', gy);
      hLine.style.opacity = '.35';
      tickLabel.style.opacity = '1';
      dot.setAttribute('r', DOT_R * 1.4);
    } else {
      bracket.style.opacity = '0';
      hLine.style.opacity   = '0';
      tickLabel.style.opacity = '0';
      dot.setAttribute('r', DOT_R);
    }

    rafId = requestAnimationFrame(frame);
  }

  function buildDOM() {
    css = document.createElement('style');
    css.id = 'mp-cursor-fx-style';
    css.textContent = `
      *, *::before, *::after { cursor: none !important; }
      #mp-svg-layer {
        position: fixed; inset: 0;
        width: 100vw; height: 100vh;
        pointer-events: none;
        z-index: 999990;
        overflow: visible;
      }
      .mp-signal {
        position: fixed;
        font-family: 'IBM Plex Mono', monospace;
        font-size: .62rem;
        font-weight: 700;
        letter-spacing: .1em;
        pointer-events: none;
        z-index: 999999;
        white-space: nowrap;
        animation: mp-signal-float .7s ease-out forwards;
      }
      @keyframes mp-signal-float {
        0%   { transform: translateY(0)   scale(1);   opacity: 1; }
        60%  { transform: translateY(-22px) scale(1.1); opacity: 1; }
        100% { transform: translateY(-38px) scale(.9); opacity: 0; }
      }
      @media (prefers-reduced-motion: reduce) {
        #mp-svg-layer polyline { display: none; }
        .mp-signal { animation: none; opacity: 0; }
      }
    `;
    document.head.appendChild(css);

    svg = document.createElementNS(NS, 'svg');
    svg.id = 'mp-svg-layer';
    svg.setAttribute('aria-hidden', 'true');
    document.body.appendChild(svg);

    segments = [];
    const POOL_SIZE = TRAIL_LEN - 1;
    for (let i = 0; i < POOL_SIZE; i++) {
      const seg = document.createElementNS(NS, 'line');
      seg.setAttribute('stroke', AMBER);
      seg.setAttribute('stroke-width', '1.5');
      seg.setAttribute('stroke-linecap', 'round');
      seg.style.opacity = '0';
      svg.appendChild(seg);
      segments.push(seg);
    }

    dot = document.createElementNS(NS, 'circle');
    dot.setAttribute('r', DOT_R);
    dot.setAttribute('fill', AMBER);
    dot.setAttribute('stroke', 'rgba(255,170,0,.3)');
    dot.setAttribute('stroke-width', '4');
    svg.appendChild(dot);

    bracket = document.createElementNS(NS, 'path');
    bracket.setAttribute('fill', 'none');
    bracket.setAttribute('stroke', AMBER);
    bracket.setAttribute('stroke-width', '1.5');
    bracket.setAttribute('stroke-linecap', 'square');
    bracket.style.opacity = '0';
    bracket.style.transition = 'opacity .15s ease';
    svg.appendChild(bracket);

    hLine = document.createElementNS(NS, 'line');
    hLine.setAttribute('stroke', AMBER);
    hLine.setAttribute('stroke-width', '.6');
    hLine.setAttribute('stroke-dasharray', '3 5');
    hLine.style.opacity = '0';
    hLine.style.transition = 'opacity .15s ease';
    svg.appendChild(hLine);

    tickLabel = document.createElementNS(NS, 'text');
    tickLabel.setAttribute('font-family', "'IBM Plex Mono', monospace");
    tickLabel.setAttribute('font-size', '9');
    tickLabel.setAttribute('fill', AMBER);
    tickLabel.style.opacity = '0';
    tickLabel.style.transition = 'opacity .15s ease';
    svg.appendChild(tickLabel);

    trail = [];
    fakePrice = 100 + Math.random() * 900;
    lastY = my;
  }

  function destroyDOM() {
    if (css && css.parentNode) css.parentNode.removeChild(css);
    if (svg && svg.parentNode) svg.parentNode.removeChild(svg);
    document.querySelectorAll('.mp-signal').forEach(el => el.remove());
    css = null; svg = null;
    segments = []; dot = null; bracket = null; hLine = null; tickLabel = null;
  }

  function attachListeners() {
    document.addEventListener('mousemove', onMouseMove, { passive: true });
    document.addEventListener('mouseover', onMouseOver);
    document.addEventListener('mouseout', onMouseOut);
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mouseleave', onMouseLeave);
    document.addEventListener('mouseenter', onMouseEnter);
  }

  function detachListeners() {
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseover', onMouseOver);
    document.removeEventListener('mouseout', onMouseOut);
    document.removeEventListener('mousedown', onMouseDown);
    document.removeEventListener('mouseleave', onMouseLeave);
    document.removeEventListener('mouseenter', onMouseEnter);
  }

  function enable() {
    if (active) return;
    active = true;
    buildDOM();
    attachListeners();
    if (rafId) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(frame);
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
    syncButton();
  }

  function disable() {
    if (!active) return;
    active = false;
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
    detachListeners();
    destroyDOM();
    isHover = false;
    try { localStorage.setItem(STORAGE_KEY, '1'); } catch (e) {}
    syncButton();
  }

  function toggle() {
    if (active) disable(); else enable();
  }

  function syncButton() {
    const btn = document.getElementById('cursorFxToggle');
    if (!btn) return;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    btn.title = active ? 'Disable cursor FX' : 'Enable cursor FX';
    btn.style.opacity = active ? '1' : '.5';
  }

  function wireButton() {
    const btn = document.getElementById('cursorFxToggle');
    if (!btn) return;
    btn.addEventListener('click', toggle);
    syncButton();
  }

  /* ── init ── */
  let startDisabled = false;
  try { startDisabled = localStorage.getItem(STORAGE_KEY) === '1'; } catch (e) {}

  function init() {
    wireButton();
    if (!startDisabled) enable();
    else syncButton();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  /* expose for debugging / other scripts */
  window.mpCursorFx = { enable, disable, toggle };

})();
