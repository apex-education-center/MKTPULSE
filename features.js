// ═══════════════════════════════════════════════════════
// MARKETPULSE — CORE v8 (Bloomberg Terminal Edition)
// ═══════════════════════════════════════════════════════

const API = 'http://localhost:8000';

// ── FINANCIAL LOADING SCREEN ─────────────────────────────
class FinancialLoader {
  constructor() {
    this.quotes = [
      "LOADING MARKET DATA...",
      "FETCHING LIVE PRICES...",
      "CONNECTING TO EXCHANGES...",
      "SYNCING PORTFOLIO...",
      "ANALYZING SENTIMENT...",
      "CALIBRATING INDICATORS...",
      "STREAMING LIVE FEEDS...",
    ];
    this.tickers = ['BTC','ETH','SPX','NVDA','XAU','OIL','EUR/USD'];
    this._inject();
  }

  _inject() {
    const el = document.createElement('div');
    el.id = 'mpLoader';
    el.innerHTML = `
      <style>
        #mpLoader {
          position:fixed;inset:0;z-index:99999;
          background:#080a0e;
          display:flex;flex-direction:column;
          align-items:center;justify-content:center;
          font-family:'IBM Plex Mono',monospace;
          transition:opacity .5s ease;
        }
        #mpLoader .ld-brand {
          font-size:1.6rem;font-weight:700;letter-spacing:.12em;
          color:#f0a500;margin-bottom:6px;
        }
        #mpLoader .ld-brand span { color:#e8ecf0; }
        #mpLoader .ld-sub {
          font-size:.62rem;letter-spacing:.2em;text-transform:uppercase;
          color:#4a5568;margin-bottom:48px;
        }
        #mpLoader .ld-bar-wrap {
          width:360px;max-width:90vw;
          background:#111520;border:1px solid #1e2535;border-radius:2px;
          padding:2px;margin-bottom:16px;
          position:relative;overflow:hidden;
        }
        #mpLoader .ld-bar {
          height:3px;background:linear-gradient(90deg,#f0a500,#ffd700,#f0a500);
          background-size:200% 100%;
          border-radius:1px;
          animation:ldShimmer 1.2s linear infinite;
          transition:width .3s ease;width:0%;
        }
        @keyframes ldShimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
        #mpLoader .ld-tickers {
          display:flex;gap:16px;margin-bottom:20px;flex-wrap:wrap;justify-content:center;max-width:90vw;
        }
        #mpLoader .ld-tick {
          font-size:.62rem;letter-spacing:.06em;color:#2d3748;
          animation:ldTickFade 2s ease-in-out infinite;
        }
        #mpLoader .ld-tick.lit { color:#f0a500; }
        @keyframes ldTickFade{0%,100%{opacity:.3}50%{opacity:1}}
        #mpLoader .ld-status {
          font-size:.62rem;letter-spacing:.12em;text-transform:uppercase;color:#4a5568;
        }
        #mpLoader .ld-status span { color:#f0a500; }
        #mpLoader .ld-grid {
          position:absolute;inset:0;
          background-image:
            linear-gradient(rgba(240,165,0,.03) 1px,transparent 1px),
            linear-gradient(90deg,rgba(240,165,0,.03) 1px,transparent 1px);
          background-size:40px 40px;
          pointer-events:none;
        }
        #mpLoader .ld-corner {
          position:absolute;font-size:.55rem;font-family:'IBM Plex Mono',monospace;
          letter-spacing:.1em;color:#1e2535;
        }
        #mpLoader .ld-corner.tl{top:16px;left:20px}
        #mpLoader .ld-corner.tr{top:16px;right:20px}
        #mpLoader .ld-corner.bl{bottom:16px;left:20px}
        #mpLoader .ld-corner.br{bottom:16px;right:20px}
      </style>
      <div class="ld-grid"></div>
      <div class="ld-corner tl">MKTPULSE TERMINAL v8</div>
      <div class="ld-corner tr" id="ldTime"></div>
      <div class="ld-corner bl">© 2026 MARKETPULSE</div>
      <div class="ld-corner br">ALL DATA EDUCATIONAL USE</div>
      <div class="ld-brand">MKT<span>PULSE</span></div>
      <div class="ld-sub">Financial Intelligence Terminal</div>
      <div class="ld-tickers" id="ldTickers">
        ${this.tickers.map((t,i)=>`<span class="ld-tick" id="ldt${i}">${t}</span>`).join('')}
      </div>
      <div class="ld-bar-wrap"><div class="ld-bar" id="ldBar"></div></div>
      <div class="ld-status" id="ldStatus">INITIALIZING TERMINAL...</div>
    `;
    document.body.prepend(el);

    // Animate tickers
    let i = 0;
    const tickAnim = setInterval(() => {
      document.querySelectorAll('.ld-tick').forEach(t=>t.classList.remove('lit'));
      const el = document.getElementById(`ldt${i % this.tickers.length}`);
      if (el) el.classList.add('lit');
      i++;
    }, 300);

    // Clock
    const clockEl = document.getElementById('ldTime');
    const clk = setInterval(() => {
      if (clockEl) clockEl.textContent = new Date().toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false});
    }, 1000);

    this._tickAnim = tickAnim;
    this._clk = clk;
    this._progress = 0;
    this._advance();
  }

  _advance() {
    const steps = [
      [15, 'AUTHENTICATING SESSION...'],
      [30, 'LOADING MARKET ENGINE...'],
      [50, 'FETCHING LIVE PRICES...'],
      [65, 'SYNCING EXCHANGE DATA...'],
      [80, 'CALIBRATING INDICATORS...'],
      [90, 'RENDERING TERMINAL...'],
      [99, 'READY'],
    ];
    let idx = 0;
    const interval = setInterval(() => {
      if (idx >= steps.length) { clearInterval(interval); return; }
      const [pct, msg] = steps[idx++];
      this.setProgress(pct, msg);
    }, 280);
  }

  setProgress(pct, msg) {
    const bar = document.getElementById('ldBar');
    const status = document.getElementById('ldStatus');
    if (bar) bar.style.width = pct + '%';
    if (status && msg) {
      status.innerHTML = `<span>●</span> ${msg}`;
    }
  }

  hide() {
    const el = document.getElementById('mpLoader');
    if (!el) return;
    this.setProgress(100, 'TERMINAL READY');
    clearInterval(this._tickAnim);
    clearInterval(this._clk);
    setTimeout(() => {
      el.style.opacity = '0';
      setTimeout(() => el.remove(), 500);
    }, 300);
  }
}

// Start loader immediately
window._loader = new FinancialLoader();

// ── ThemeManager ─────────────────────────────────────────
// BroadcastChannel syncs ALL open tabs instantly
// storage event catches tabs that don't support BroadcastChannel
// visibilitychange catches returning to a tab after switching
class ThemeManager {
  constructor() {
    this.theme = localStorage.getItem('mp-theme') || 'dark';
    this.channel = null;

    // ── LAYER 1: BroadcastChannel — fires instantly in ALL other same-origin tabs ──
    // Note: does NOT fire in the sender tab, that's handled by _apply() directly
    try {
      this.channel = new BroadcastChannel('mp-theme-sync');
      this.channel.onmessage = (e) => {
        if (e.data === 'dark' || e.data === 'light') {
          this.theme = e.data;
          this._apply(false); // apply without re-broadcasting (avoid loop)
        }
      };
    } catch(e) {
      this.channel = null;
    }

    // ── LAYER 2: storage event — ALWAYS register (not just as fallback) ──
    // Fires in tabs that missed the BroadcastChannel message (e.g. background tabs)
    window.addEventListener('storage', (e) => {
      if (e.key === 'mp-theme' && (e.newValue === 'dark' || e.newValue === 'light')) {
        this.theme = e.newValue;
        this._apply(false);
      }
    });

    // ── LAYER 3: visibilitychange + focus — catch tab switches ──
    // When user returns to a tab, re-read localStorage in case it changed
    const onVisible = () => {
      const stored = localStorage.getItem('mp-theme') || 'dark';
      if (stored !== this.theme) {
        this.theme = stored;
        this._apply(false);
      }
    };
    document.addEventListener('visibilitychange', () => { if (!document.hidden) onVisible(); });
    window.addEventListener('focus', onVisible);
    window.addEventListener('pageshow', onVisible); // handles back/forward cache

    // Apply on load (no broadcast — just render this tab)
    this._apply(false);
  }

  _apply(broadcast = true) {
    // 1. Set CSS attribute on <html> — this drives ALL CSS [data-theme] rules
    document.documentElement.setAttribute('data-theme', this.theme);

    // 2. Update every toggle button on the page
    document.querySelectorAll('#themeToggle').forEach(btn => {
      btn.textContent = this.theme === 'dark' ? '☀' : '☾';
    });

    // 3. Broadcast to all OTHER open tabs via BroadcastChannel
    if (broadcast && this.channel) {
      try { this.channel.postMessage(this.theme); } catch(e) {}
    }

    // 4. Also write localStorage so Layer 2 (storage event) catches it
    // Only write when broadcasting (i.e. this is the originating toggle)
    if (broadcast) {
      localStorage.setItem('mp-theme', this.theme);
    }
  }

  toggle() {
    this.theme = this.theme === 'dark' ? 'light' : 'dark';
    // Write to localStorage FIRST so storage event fires in other tabs
    localStorage.setItem('mp-theme', this.theme);
    // Then apply locally + broadcast
    this._apply(true);
    Toast.show(this.theme === 'dark' ? '🌙 DARK MODE' : '☀️ LIGHT MODE', 'info', 1500);
  }
}

// ── Toast ─────────────────────────────────────────────────
class Toast {
  static show(msg, type = 'info', duration = 3000) {
    let c = document.querySelector('.toast-container');
    if (!c) { c = document.createElement('div'); c.className = 'toast-container'; document.body.appendChild(c); }
    const icons = { info:'[INFO]', success:'[OK]', error:'[ERR]', warning:'[WARN]' };
    const colors = { info:'var(--amber)', success:'var(--green)', error:'var(--red)', warning:'#ff8f00' };
    const t = document.createElement('div');
    t.className = 'toast-mp';
    t.style.borderLeftColor = colors[type] || 'var(--amber)';
    t.innerHTML = `<span style="color:${colors[type]||'var(--amber)'};font-weight:700">${icons[type]||'[INFO]'}</span><span>${msg}</span>`;
    c.appendChild(t);
    setTimeout(() => {
      t.style.opacity = '0';
      t.style.transform = 'translateX(20px)';
      t.style.transition = '0.25s ease';
      setTimeout(() => t.remove(), 250);
    }, duration);
  }
}

// ── FavoritesManager ─────────────────────────────────────
class FavoritesManager {
  constructor() { this.key = 'mp-favorites'; this.data = JSON.parse(localStorage.getItem(this.key) || '{}'); }
  toggle(id, meta = {}) {
    if (this.data[id]) { delete this.data[id]; Toast.show(`REMOVED ${id}`, 'info'); }
    else { this.data[id] = { ...meta, savedAt: Date.now() }; Toast.show(`ADDED ${id} TO WATCHLIST ⭐`, 'success'); }
    localStorage.setItem(this.key, JSON.stringify(this.data));
    return !!this.data[id];
  }
  has(id) { return !!this.data[id]; }
  getAll() { return Object.entries(this.data).map(([id, meta]) => ({ id, ...meta })); }
  count() { return Object.keys(this.data).length; }
}

// ── APIClient ─────────────────────────────────────────────
class APIClient {
  constructor(base = API) { this.base = base; this._cache = new Map(); }
  async get(endpoint, ttl = 5 * 60 * 1000) {
    const c = this._cache.get(endpoint);
    if (c && ttl > 0 && Date.now() - c.ts < ttl) return c.data;
    const res = await fetch(`${this.base}${endpoint}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    this._cache.set(endpoint, { data, ts: Date.now() });
    return data;
  }
  invalidate(endpoint) { this._cache.delete(endpoint); }
}

// ── ScrollAnimator ────────────────────────────────────────
class ScrollAnimator {
  constructor() {
    this.io = new IntersectionObserver(
      es => es.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); }),
      { threshold: 0.06, rootMargin: '0px 0px -20px 0px' }
    );
    this.refresh();
  }
  refresh() { document.querySelectorAll('.fade-up:not(.visible)').forEach(el => this.io.observe(el)); }
}

// ── NavManager ────────────────────────────────────────────
class NavManager {
  constructor() {
    this._setActive();
    this._buildDrawer();
    this._startClock();
  }

  _setActive() {
    const path = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-link').forEach(l => {
      const h = l.getAttribute('href') || '';
      l.classList.toggle('active', h === path || (path === '' && h === 'index.html'));
    });
  }

  _buildDrawer() {
    if (document.getElementById('mpDrawer')) return;
    const overlay = document.createElement('div');
    overlay.id = 'drawerOverlay';
    overlay.className = 'drawer-overlay';
    overlay.onclick = () => this.closeDrawer();

    const drawer = document.createElement('div');
    drawer.id = 'mpDrawer';
    drawer.className = 'nav-drawer';

    const pages = [
      { href: 'index.html',    icon: 'bi-display',     label: 'Terminal' },
      { href: 'markets.html',  icon: 'bi-graph-up',    label: 'Markets' },
      { href: 'news.html',     icon: 'bi-newspaper',   label: 'News Feed' },
      { href: 'youtube.html',  icon: 'bi-play-circle', label: 'Videos' },
      { href: 'calendar.html', icon: 'bi-calendar3',   label: 'Macro Calendar' },
      { href: 'tools.html',    icon: 'bi-tools',       label: 'Tools' },
      { href: 'search.html',   icon: 'bi-search',      label: 'Search' },
    ];

    const path = window.location.pathname.split('/').pop() || 'index.html';
    drawer.innerHTML = `
      <div class="drawer-head">
        <span class="drawer-brand">MKT<span class="accent">PULSE</span></span>
        <button class="drawer-x" onclick="window.navManager.closeDrawer()">✕</button>
      </div>
      <nav class="drawer-nav">
        ${pages.map(p => `
          <a href="${p.href}" class="drawer-link ${p.href === path ? 'active' : ''}">
            <i class="bi ${p.icon}"></i>
            <span>${p.label}</span>
            ${p.href === path ? '<span class="drawer-dot"></span>' : ''}
          </a>`).join('')}
      </nav>
      <div class="drawer-foot">
        <button class="drawer-theme" onclick="window.themeManager.toggle()">
          <i class="bi bi-circle-half"></i> THEME
        </button>
        <span class="drawer-clock-sm" id="drawerClock"></span>
      </div>`;

    document.body.appendChild(overlay);
    document.body.appendChild(drawer);

    const toggler = document.getElementById('hamburgerBtn') || document.querySelector('.hamburger, .navbar-toggler');
    if (toggler) {
      toggler.removeAttribute('data-bs-toggle');
      toggler.removeAttribute('data-bs-target');
      toggler.onclick = () => this.openDrawer();
    }
  }

  openDrawer()  {
    document.getElementById('mpDrawer')?.classList.add('open');
    document.getElementById('drawerOverlay')?.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  closeDrawer() {
    document.getElementById('mpDrawer')?.classList.remove('open');
    document.getElementById('drawerOverlay')?.classList.remove('open');
    document.body.style.overflow = '';
  }

  _startClock() {
    const update = () => {
      const now = new Date();
      const t = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
      const d = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase();
      const el = document.getElementById('navClock');
      const de = document.getElementById('drawerClock');
      if (el) el.innerHTML = `<span class="date">${d}</span>${t}`;
      if (de) de.textContent = t;
    };
    update();
    setInterval(update, 1000);
  }
}

// ── Format Helpers ────────────────────────────────────────
class Fmt {
  static price(p, d = 2) {
    if (p === null || p === undefined || isNaN(p)) return '—';
    if (p >= 1000) return '$' + p.toLocaleString('en-US', { maximumFractionDigits: 2 });
    if (p >= 1)    return '$' + parseFloat(p).toFixed(d);
    return '$' + parseFloat(p).toFixed(4);
  }
  static large(v) {
    if (!v || isNaN(v)) return '—';
    if (v >= 1e12) return '$' + (v / 1e12).toFixed(2) + 'T';
    if (v >= 1e9)  return '$' + (v / 1e9).toFixed(1) + 'B';
    if (v >= 1e6)  return '$' + (v / 1e6).toFixed(1) + 'M';
    return '$' + (v / 1e3).toFixed(0) + 'K';
  }
  static pct(v, cls = true) {
    if (v === null || v === undefined || isNaN(v)) return '—';
    const up = parseFloat(v) >= 0;
    const abs = Math.abs(parseFloat(v)).toFixed(2);
    if (!cls) return `${up ? '+' : '-'}${abs}%`;
    return `<span class="badge-${up ? 'up' : 'down'}">${up ? '▲' : '▼'} ${abs}%</span>`;
  }
  static date(s) {
    if (!s) return '—';
    return new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
  static timeAgo(s) {
    if (!s) return '—';
    const m = Math.floor((Date.now() - new Date(s).getTime()) / 60000);
    if (m < 1)  return 'JUST NOW';
    if (m < 60) return `${m}M AGO`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}H AGO`;
    return `${Math.floor(h / 24)}D AGO`;
  }
}

// ── Sparkline ─────────────────────────────────────────────
class Sparkline {
  static draw(canvasId, prices, positive) {
    const canvas = document.getElementById(canvasId);
    if (!canvas || !prices?.length) return;
    const color = positive ? '#00c853' : '#ff1744';
    if (canvas._chart) canvas._chart.destroy();
    canvas._chart = new Chart(canvas.getContext('2d'), {
      type: 'line',
      data: {
        labels: prices.map((_, i) => i),
        datasets: [{
          data: prices,
          borderColor: color,
          borderWidth: 1.5,
          fill: true,
          backgroundColor: positive ? 'rgba(0,200,83,0.06)' : 'rgba(255,23,68,0.06)',
          tension: 0.4,
          pointRadius: 0,
        }]
      },
      options: {
        responsive: false, animation: false,
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
        scales: { x: { display: false }, y: { display: false } }
      }
    });
  }
}

// ── Boot ──────────────────────────────────────────────────
window.themeManager     = new ThemeManager();
window.favoritesManager = new FavoritesManager();
window.apiClient        = new APIClient();
window.Fmt              = Fmt;
window.Sparkline        = Sparkline;
window.Toast            = Toast;

// ── GLOBAL STATUS BAR ─────────────────────────────────
// Runs on every page. Image 2 style: prices + sessions + watchlist favorites
window.initStatusBar = async function() {
  // World clocks every second
  function clocks() {
    const fmt = tz => new Date().toLocaleTimeString('en-US',{timeZone:tz,hour:'2-digit',minute:'2-digit',hour12:false});
    const s = (id,v) => { const e=document.getElementById(id); if(e) e.textContent=v; };
    s('sb-ny',fmt('America/New_York')); s('sb-ln',fmt('Europe/London'));
    s('sb-tk',fmt('Asia/Tokyo'));       s('sb-bt',fmt('Asia/Beirut'));
  }
  clocks(); setInterval(clocks, 1000);

  // Market sessions — NYSE / LSE / TSE / CRYPTO — Image 2 style
  function sessions() {
    const el = document.getElementById('marketSessions');
    if (!el) return;
    const now = new Date();
    const list = [
      { name:'NYSE',   tz:'America/New_York', oh:9,  om:30, ch:16, cm:0  },
      { name:'LSE',    tz:'Europe/London',    oh:8,  om:0,  ch:16, cm:30 },
      { name:'TSE',    tz:'Asia/Tokyo',       oh:9,  om:0,  ch:15, cm:30 },
      { name:'CRYPTO', tz:'UTC',              always:true, color:'var(--purple)' },
    ];
    el.innerHTML = list.map(s => {
      let open = s.always || false;
      if (!s.always) {
        const loc = new Date(now.toLocaleString('en-US',{timeZone:s.tz}));
        const hm  = loc.getHours()*60 + loc.getMinutes();
        const dow = loc.getDay();
        open = dow>=1 && dow<=5 && hm>=(s.oh*60+s.om) && hm<(s.ch*60+s.cm);
      }
      const dot   = s.always ? 'var(--purple)' : (open ? 'var(--green)' : 'var(--text-muted)');
      const label = s.always ? '24/7' : (open ? 'OPEN' : 'CLOSED');
      const lcolor= open || s.always ? (s.color||'var(--green)') : 'var(--text-muted)';
      return `<div class="sb-session">
        <span style="width:5px;height:5px;border-radius:50%;background:${dot};${(open||s.always)?'box-shadow:0 0 4px '+dot:''}"></span>
        <span style="font-family:var(--font-mono);font-size:.59rem;color:var(--text-muted);font-weight:700;letter-spacing:.04em">${s.name}</span>
        <span style="font-family:var(--font-mono);font-size:.56rem;color:${lcolor}">${label}</span>
      </div>`;
    }).join('');
  }
  sessions(); setInterval(sessions, 60000);

  // Live prices + watchlist favorites
  async function prices() {
    try {
      const data = await window.apiClient.get('/api/watchlist', 5*60*1000);
      const set = (id, asset) => {
        const el = document.getElementById(id);
        if (!el || !asset) return;
        const up = (asset.change_24h||0) >= 0;
        el.className = 'sb-item ' + (up?'up':'down');
        el.innerHTML = `<span class="sb-label">${el.querySelector('.sb-label')?.textContent||''}</span>`
          + `<span class="sb-value">${Fmt.price(asset.price)}</span>`
          + `<span style="font-size:.55rem;color:${up?'var(--green)':'var(--red)'}">`
          + `${up?'▲':'▼'}${Math.abs(asset.change_24h||0).toFixed(2)}%</span>`;
      };
      set('sb-btc',  data.crypto?.find(c=>c.symbol==='BTC'));
      set('sb-eth',  data.crypto?.find(c=>c.symbol==='ETH'));
      set('sb-nvda', data.stocks?.find(s=>s.symbol==='NVDA'));
      set('sb-gold', data.commodities?.find(c=>c.name==='Gold'));
      set('sb-oil',  data.commodities?.find(c=>c.name==='Crude Oil'));

      // Watchlist favorites in status bar
      const wlEl = document.getElementById('sb-watchlist');
      if (wlEl) {
        const favs = window.favoritesManager?.getAll() || [];
        const all  = [...(data.crypto||[]),...(data.stocks||[]),...(data.commodities||[])];
        wlEl.innerHTML = favs.slice(0,6).map(f => {
          const a = all.find(x => x.symbol === f.id);
          if (!a) return '';
          const up = (a.change_24h||0) >= 0;
          return `<div class="sb-wl-item" onclick="window.location.href='markets.html'" title="${a.name}">
            <span class="sb-wl-sym">${a.symbol}</span>
            <span class="sb-wl-px" style="color:${up?'var(--green)':'var(--red)'}">${Fmt.price(a.price)}</span>
            <span class="sb-wl-chg" style="color:${up?'var(--green)':'var(--red)'}">${up?'▲':'▼'}${Math.abs(a.change_24h||0).toFixed(2)}%</span>
          </div>`;
        }).filter(Boolean).join('');
      }
    } catch(e) {}
  }
  prices(); setInterval(prices, 5*60*1000);

  // Re-render watchlist when favorites change (called from markets page)
  window.refreshSBWatchlist = () => prices();
};

document.addEventListener('DOMContentLoaded', () => {
  window.navManager     = new NavManager();
  window.scrollAnimator = new ScrollAnimator();
  const t = document.getElementById('themeToggle');
  if (t) t.onclick = () => window.themeManager.toggle();
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') window.navManager?.closeDrawer();
  });
  // Init status bar (prices + sessions + watchlist)
  window.initStatusBar();
  // Hide loader
  setTimeout(() => window._loader?.hide(), 1800);
});
