/**
 * cursor-fx.js — MarketPulse Chart Tracer Cursor
 *
 * DEFAULT  → amber "current price" dot + fading polyline trail (chart line)
 * HOVER    → dot becomes endpoint bracket [ ] snapped to grid, trail pauses
 * CLICK    → random green (▲ BUY) or red (▼ SELL) flash floats up from cursor
 *
 * Drop in assets/js/, add before </body>:
 *   <script src="assets/js/cursor-fx.js"></script>
 */
(function () {
  'use strict';

  /* ── skip touch ── */
  if (window.matchMedia('(pointer: coarse)').matches) return;

  /* ── constants ── */
  const AMBER      = '#ffaa00';
  const GREEN      = '#00c853';
  const RED        = '#ff1744';
  const TRAIL_LEN  = 28;          // number of points kept in trail
  const TRAIL_MS   = 520;         // how long a segment fades (ms)
  const DOT_R      = 4;           // current-price dot radius
  const BRACKET_W  = 16;          // hover bracket half-width
  const BRACKET_H  = 10;          // hover bracket half-height

  /* ── inject CSS (hide native cursor everywhere) ── */
  const css = document.createElement('style');
  css.textContent = `
    *, *::before, *::after { cursor: none !important; }

    #mp-svg-layer {
      position: fixed; inset: 0;
      width: 100vw; height: 100vh;
      pointer-events: none;
      z-index: 999990;
      overflow: visible;
    }

    /* floating buy/sell label */
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

    /* reduced-motion: keep dot, kill trail & animation */
    @media (prefers-reduced-motion: reduce) {
      #mp-svg-layer polyline { display: none; }
      .mp-signal { animation: none; opacity: 0; }
    }
  `;
  document.head.appendChild(css);

  /* ── build SVG layer ── */
  const NS  = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg');
  svg.id = 'mp-svg-layer';
  svg.setAttribute('aria-hidden', 'true');
  document.body.appendChild(svg);

  /* ── trail: array of {x,y,t} ── */
  let trail = [];
  let mx = -300, my = -300;
  let isHover = false;

  /* ── polyline for trail ── */
  const trailLine = document.createElementNS(NS, 'polyline');
  trailLine.setAttribute('fill', 'none');
  trailLine.setAttribute('stroke', AMBER);
  trailLine.setAttribute('stroke-width', '1.5');
  trailLine.setAttribute('stroke-linecap', 'round');
  trailLine.setAttribute('stroke-linejoin', 'round');
  svg.appendChild(trailLine);

  /* gradient fade: we'll use a defs linearGradient trick — actually
     we'll fake fade by rendering N segments with decreasing opacity */
  /* simpler: one polyline with stroke-dasharray animated — but
     the cleanest approach for a "fading tail" is multiple short
     polyline segments rendered each frame. We'll do that. */
  svg.removeChild(trailLine); // remove the single one, use segment pool

  const POOL_SIZE = TRAIL_LEN - 1;
  const segments  = [];
  for (let i = 0; i < POOL_SIZE; i++) {
    const seg = document.createElementNS(NS, 'line');
    seg.setAttribute('stroke', AMBER);
    seg.setAttribute('stroke-width', '1.5');
    seg.setAttribute('stroke-linecap', 'round');
    seg.style.opacity = '0';
    svg.appendChild(seg);
    segments.push(seg);
  }

  /* ── dot (current price endpoint) ── */
  const dot = document.createElementNS(NS, 'circle');
  dot.setAttribute('r', DOT_R);
  dot.setAttribute('fill', AMBER);
  dot.setAttribute('stroke', 'rgba(255,170,0,.3)');
  dot.setAttribute('stroke-width', '4');
  svg.appendChild(dot);

  /* ── hover bracket (4 corner L-shapes as one path) ── */
  const bracket = document.createElementNS(NS, 'path');
  bracket.setAttribute('fill', 'none');
  bracket.setAttribute('stroke', AMBER);
  bracket.setAttribute('stroke-width', '1.5');
  bracket.setAttribute('stroke-linecap', 'square');
  bracket.style.opacity = '0';
  bracket.style.transition = 'opacity .15s ease';
  svg.appendChild(bracket);

  /* ── horizontal price-level line (dashed, faint) ── */
  const hLine = document.createElementNS(NS, 'line');
  hLine.setAttribute('stroke', AMBER);
  hLine.setAttribute('stroke-width', '.6');
  hLine.setAttribute('stroke-dasharray', '3 5');
  hLine.style.opacity = '0';
  hLine.style.transition = 'opacity .15s ease';
  svg.appendChild(hLine);

  /* ── tick label next to dot ── */
  const tickLabel = document.createElementNS(NS, 'text');
  tickLabel.setAttribute('font-family', "'IBM Plex Mono', monospace");
  tickLabel.setAttribute('font-size', '9');
  tickLabel.setAttribute('fill', AMBER);
  tickLabel.style.opacity = '0';
  tickLabel.style.transition = 'opacity .15s ease';
  svg.appendChild(tickLabel);

  /* ── fake price that drifts with cursor Y ── */
  let fakePrice = 100 + Math.random() * 900; // start somewhere
  let lastY = my;

  function updateFakePrice(y) {
    const dy = lastY - y; // up = price up
    fakePrice = Math.max(0.01, fakePrice + dy * 0.08 + (Math.random() - .5) * 0.3);
    lastY = y;
    return fakePrice.toFixed(2);
  }

  /* ── rAF loop ── */
  let rafRunning = false;

  function frame() {
    const now = Date.now();

    /* push new point when not hovering */
    if (!isHover) {
      trail.push({ x: mx, y: my, t: now });
      if (trail.length > TRAIL_LEN) trail.shift();
    }

    /* prune old points */
    trail = trail.filter(p => now - p.t < TRAIL_MS * 1.5);

    /* draw segments with opacity based on age */
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

    /* dot */
    dot.setAttribute('cx', mx);
    dot.setAttribute('cy', my);

    /* price label */
    const priceStr = updateFakePrice(my);
    tickLabel.textContent = priceStr;
    tickLabel.setAttribute('x', mx + 10);
    tickLabel.setAttribute('y', my - 8);

    /* hover bracket */
    if (isHover) {
      /* snap to nearest 8px grid */
      const gx = Math.round(mx / 8) * 8;
      const gy = Math.round(my / 8) * 8;
      const bw = BRACKET_W, bh = BRACKET_H, arm = 5;
      /* 4 L-corners: TL TR BL BR */
      const d = [
        `M${gx-bw},${gy-bh+arm} L${gx-bw},${gy-bh} L${gx-bw+arm},${gy-bh}`,
        `M${gx+bw-arm},${gy-bh} L${gx+bw},${gy-bh} L${gx+bw},${gy-bh+arm}`,
        `M${gx-bw},${gy+bh-arm} L${gx-bw},${gy+bh} L${gx-bw+arm},${gy+bh}`,
        `M${gx+bw-arm},${gy+bh} L${gx+bw},${gy+bh} L${gx+bw},${gy+bh-arm}`,
      ].join(' ');
      bracket.setAttribute('d', d);
      bracket.style.opacity = '1';

      /* dashed horizontal level line */
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

    rafRunning = true;
    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);

  /* ── mouse events ── */
  document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; }, { passive: true });

  const HOVER_SEL = 'a,button,[role="button"],input,select,textarea,.chip,.vc,.yt-topic,.nav-link,.card,label,[onclick],.btn,.vc-thumb';

  document.addEventListener('mouseover', e => {
    if (e.target.closest && e.target.closest(HOVER_SEL)) isHover = true;
  });
  document.addEventListener('mouseout', e => {
    if (e.target.closest && e.target.closest(HOVER_SEL)) isHover = false;
  });

  /* ── click: BUY / SELL signal ── */
  const SIGNALS = [
    { label: '▲ BUY',  color: GREEN },
    { label: '▼ SELL', color: RED   },
  ];

  document.addEventListener('mousedown', e => {
    const sig   = SIGNALS[Math.random() < .5 ? 0 : 1];
    const el    = document.createElement('div');
    const price = fakePrice.toFixed(2);
    el.className  = 'mp-signal';
    el.textContent = `${sig.label}  ${price}`;
    el.style.color = sig.color;
    el.style.left  = (e.clientX + 10) + 'px';
    el.style.top   = (e.clientY - 6) + 'px';
    document.body.appendChild(el);

    /* dot flash */
    dot.setAttribute('fill', sig.color);
    dot.setAttribute('stroke', sig.color.replace(')', ',.25)').replace('rgb', 'rgba'));
    setTimeout(() => {
      dot.setAttribute('fill', AMBER);
      dot.setAttribute('stroke', 'rgba(255,170,0,.3)');
    }, 260);

    el.addEventListener('animationend', () => el.remove());
  });

  /* ── hide/show on leave/enter ── */
  document.addEventListener('mouseleave', () => {
    svg.style.opacity = '0';
  });
  document.addEventListener('mouseenter', () => {
    svg.style.opacity = '1';
  });

})();
