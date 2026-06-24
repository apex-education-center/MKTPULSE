// ═══════════════════════════════════════════════════════
// MARKETPULSE — CORE v8 (Bloomberg Terminal Edition)
// ═══════════════════════════════════════════════════════

const API = (typeof window !== 'undefined' && window.location?.protocol?.startsWith('http'))
  ? window.location.origin
  : 'http://localhost:8000';

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

// Stamp ?theme= on internal links so navigation keeps the same mode (works on file:// too)
function stampThemeLinks() {
  const theme = document.documentElement.getAttribute('data-theme');
  if (theme !== 'light' && theme !== 'dark') return;
  document.querySelectorAll('a[href]').forEach(a => {
    const raw = a.getAttribute('href');
    if (!raw || /^(https?:|#|mailto:|tel:|javascript:)/i.test(raw)) return;
    if (!/\.html(\?|#|$)/i.test(raw)) return;
    const hashIdx = raw.indexOf('#');
    const hash = hashIdx >= 0 ? raw.slice(hashIdx) : '';
    const beforeHash = hashIdx >= 0 ? raw.slice(0, hashIdx) : raw;
    const qIdx = beforeHash.indexOf('?');
    const path = qIdx >= 0 ? beforeHash.slice(0, qIdx) : beforeHash;
    const params = new URLSearchParams(qIdx >= 0 ? beforeHash.slice(qIdx + 1) : '');
    params.set('theme', theme);
    a.setAttribute('href', path + '?' + params.toString() + hash);
  });
}

// ── ThemeManager ─────────────────────────────────────────
class ThemeManager {
  constructor() {
    this.theme = this._read();
    this.channel = null;
    try {
      this.channel = new BroadcastChannel('mp-theme-sync');
      this.channel.onmessage = (e) => {
        const t = typeof e.data === 'string' ? e.data : e.data?.theme;
        if (t === 'light' || t === 'dark') this.apply(t, false);
      };
    } catch (e) { this.channel = null; }

    window.addEventListener('storage', (e) => {
      if (e.key === 'mp-theme' && (e.newValue === 'dark' || e.newValue === 'light')) {
        this.apply(e.newValue, false);
      }
    });

    this.apply(this.theme, false);
  }

  _read() {
    try {
      const q = new URLSearchParams(location.search).get('theme');
      if (q === 'light' || q === 'dark') return q;
      const t = localStorage.getItem('mp-theme');
      return t === 'light' ? 'light' : 'dark';
    } catch (e) { return 'dark'; }
  }

  apply(theme, persist = true) {
    if (theme !== 'light' && theme !== 'dark') return;
    this.theme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    document.querySelectorAll('#themeToggle').forEach(btn => {
      btn.textContent = theme === 'dark' ? '☀' : '☾';
    });
    if (persist) {
      try { localStorage.setItem('mp-theme', theme); } catch (e) {}
      try { this.channel?.postMessage({ theme }); } catch (e) {}
    }
    stampThemeLinks();
  }

  toggle() {
    const next = this.theme === 'dark' ? 'light' : 'dark';
    this.apply(next, true);
    Toast.show(next === 'dark' ? '🌙 DARK MODE' : '☀️ LIGHT MODE', 'info', 1500);
  }

  set(theme) { this.apply(theme, true); }
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
function normalizeFavorites(raw) {
  if (!raw) return {};
  if (typeof raw === 'string') {
    try { return normalizeFavorites(JSON.parse(raw)); } catch (e) { return {}; }
  }
  if (Array.isArray(raw)) {
    const out = {};
    raw.forEach(item => {
      if (typeof item === 'string') {
        const sym = item.toUpperCase();
        out[sym] = { name: item, savedAt: Date.now() };
      } else if (item && (item.id || item.symbol)) {
        const sym = String(item.id || item.symbol).toUpperCase();
        out[sym] = { name: item.name || sym, type: item.type, savedAt: item.savedAt || Date.now() };
      }
    });
    return out;
  }
  if (typeof raw === 'object') {
    const out = {};
    Object.entries(raw).forEach(([id, meta]) => {
      const sym = String(id).toUpperCase();
      if (typeof meta === 'object' && meta) out[sym] = { ...meta };
      else if (typeof meta === 'string') out[sym] = { name: meta, savedAt: Date.now() };
      else out[sym] = { name: sym, savedAt: Date.now() };
    });
    return out;
  }
  return {};
}

window.normalizeFavorites = normalizeFavorites;
window.isWatchlistPayload = function (wl) {
  return !!(wl && (Array.isArray(wl.crypto) || Array.isArray(wl.stocks) || Array.isArray(wl.commodities)));
};

window.cacheWatchlistData = function (wl) {
  if (window.isWatchlistPayload(wl)) window._watchlistCache = wl;
  return wl;
};

window.getWatchlistData = async function () {
  if (window.isWatchlistPayload(window._watchlistCache)) return window._watchlistCache;
  if (window.isWatchlistPayload(window.toolsPage?.watchlist)) return window.cacheWatchlistData(window.toolsPage.watchlist);
  if (window.isWatchlistPayload(window.mktPage?.data)) return window.cacheWatchlistData(window.mktPage.data);
  if (window.isWatchlistPayload(window.homePage?.data)) return window.cacheWatchlistData(window.homePage.data);
  try {
    return window.cacheWatchlistData(await window.apiClient.get('/api/watchlist', 0));
  } catch (e) {
    return null;
  }
};

class FavoritesManager {
  constructor() { this.key = 'mp-favorites'; this.data = this._read(); }
  _read() {
    try {
      const raw = JSON.parse(localStorage.getItem(this.key) || '{}');
      const norm = normalizeFavorites(raw);
      if (JSON.stringify(raw) !== JSON.stringify(norm)) {
        localStorage.setItem(this.key, JSON.stringify(norm));
      }
      return norm;
    } catch (e) { return {}; }
  }
  toggle(id, meta = {}) {
    id = String(id).toUpperCase();
    if (this.data[id]) { delete this.data[id]; Toast.show(`REMOVED ${id}`, 'info'); }
    else { this.data[id] = { ...meta, savedAt: Date.now() }; Toast.show(`ADDED ${id} TO WATCHLIST ⭐`, 'success'); }
    localStorage.setItem(this.key, JSON.stringify(this.data));
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('mp-favorites-changed'));
      window.refreshFavoritesUI?.();
    }, 0);
    return !!this.data[id];
  }
  has(id) { return !!this.data[String(id).toUpperCase()]; }
  getAll() { return Object.entries(this.data).map(([id, meta]) => ({ id, ...meta })); }
  count() { return Object.keys(this.data).length; }
  reload() { this.data = this._read(); }
}

// ── Watchlist helpers ─────────────────────────────────────
window.matchFavoritesToWatchlist = function (wlData) {
  window.favoritesManager?.reload?.();
  const favs = window.favoritesManager?.getAll() || [];
  if (!favs.length || !window.isWatchlistPayload(wlData)) return [];
  const all = [...(wlData.crypto || []), ...(wlData.stocks || []), ...(wlData.commodities || [])];
  return favs.map(f => {
    const sym = String(f.id || '').toUpperCase();
    const a = all.find(x => String(x.symbol).toUpperCase() === sym);
    return a ? { ...a, favName: f.name || a.name } : null;
  }).filter(Boolean);
};

window.paintSbWatchlist = function (el, items) {
  if (!el) return;
  if (!items.length) {
    el.innerHTML = '';
    return;
  }
  const itemsHtml = items.slice(0, 8).map(a => {
    const up = (a.change_24h || 0) >= 0;
    return `<div class="sb-wl-item" onclick="window.location.href='markets.html'" title="${a.name || a.favName}">
      <span class="sb-wl-sym">${a.symbol}</span>
      <span class="sb-wl-px" style="color:${up ? 'var(--green)' : 'var(--red)'}">${Fmt.price(a.price)}</span>
      <span class="sb-wl-chg" style="color:${up ? 'var(--green)' : 'var(--red)'}">${up ? '▲' : '▼'}${Math.abs(a.change_24h || 0).toFixed(2)}%</span>
    </div>`;
  }).join('');
  el.innerHTML = `<span class="sb-wl-label">★ WATCHLIST</span>${itemsHtml}`;
};

window.paintLeaderboard = function (elId, period, wlData) {
  const el = document.getElementById(elId);
  if (!el) return;
  const items = window.matchFavoritesToWatchlist(wlData);
  if (!window.favoritesManager?.getAll()?.length) {
    el.innerHTML = '<div style="color:var(--text-muted);font-size:.82rem;text-align:center;padding:20px">Star assets on Markets to see them here</div>';
    return;
  }
  if (!items.length) {
    el.innerHTML = '<div style="color:var(--text-muted);font-size:.82rem;text-align:center;padding:20px">Star assets from the Markets list (BTC, ETH, NVDA…)</div>';
    return;
  }
  const key = period === '7d' ? 'change_7d' : 'change_24h';
  const sorted = [...items].sort((a, b) => (b[key] || 0) - (a[key] || 0));
  el.innerHTML = sorted.map((a, i) => {
    const chg = a[key] || 0;
    const up = chg >= 0;
    return `<div class="lb-row">
      <span class="lb-rank">#${i + 1}</span>
      <span class="lb-sym">${a.symbol}</span>
      <span class="lb-name">${a.favName || a.name}</span>
      <span style="font-family:var(--font-mono);font-size:.72rem;color:var(--text-secondary);min-width:70px;text-align:right">${Fmt.price(a.price)}</span>
      <span class="lb-chg" style="color:${up ? 'var(--green)' : 'var(--red)'}">${up ? '+' : ''}${chg.toFixed(2)}%</span>
    </div>`;
  }).join('');
};

window.refreshFavoritesUI = async function (wlData) {
  window.favoritesManager?.reload?.();
  if (!window.isWatchlistPayload(wlData)) wlData = await window.getWatchlistData();
  else window.cacheWatchlistData(wlData);

  const wlEl = document.getElementById('sb-watchlist');
  if (wlEl && wlData) {
    const items = window.matchFavoritesToWatchlist(wlData);
    window.paintSbWatchlist(wlEl, items);
  }
  window.paintLeaderboard?.('favLeaderboard', window.toolsPage?._lbPeriod || '24h', wlData);
  window.mktPage?.renderSideFavorites?.();
  window.mktPage?.renderKPI?.();
};

// ── Fear & Greed (shared across pages) ─────────────────
window.FG_COLORS = {
  'Extreme Fear': 'var(--red)', Fear: '#ff8f00', Neutral: 'var(--amber)',
  Greed: '#69f0ae', 'Extreme Greed': 'var(--green)',
};

window.loadFearGreed = async function () {
  const hasFG = document.getElementById('fgMini') || document.getElementById('fgPanel')
    || document.getElementById('fgValue') || document.getElementById('fgVal');
  if (!hasFG) return;

  try {
    const data = await window.apiClient.get('/api/fear-greed', 60 * 60 * 1000);
    const cur = data.current || {};
    const val = parseInt(cur.value || 50, 10);
    const label = cur.value_classification || 'Neutral';
    const color = window.FG_COLORS[label] || 'var(--amber)';

    // Terminal (index.html)
    const fgMini = document.getElementById('fgMini');
    const fgInd = document.getElementById('fgInd');
    if (fgMini) {
      fgMini.innerHTML = `
        <div class="fg-mini-val" style="color:${color}">${val}</div>
        <div class="fg-mini-info">
          <div class="fg-mini-label" style="color:${color}">${label.toUpperCase()}</div>
          <div class="fg-mini-sub">CRYPTO FEAR & GREED INDEX</div>
        </div>`;
    }
    if (fgInd) fgInd.style.left = `${val}%`;

    // Markets sidebar + Calendar sidebar (shared label id)
    const fgVal = document.getElementById('fgVal');
    const fgValue = document.getElementById('fgValue');
    const fgLabel = document.getElementById('fgLabel');
    const fgIndicator = document.getElementById('fgIndicator');
    if (fgVal) { fgVal.textContent = val; fgVal.style.color = color; }
    if (fgValue) { fgValue.textContent = val; fgValue.style.color = color; }
    if (fgLabel) { fgLabel.textContent = label.toUpperCase(); fgLabel.style.color = color; }
    if (fgIndicator) fgIndicator.style.left = `${val}%`;

    const fgHistory = document.getElementById('fgHistory');
    if (fgHistory) {
      const history = data.history || [];
      fgHistory.innerHTML = history.length
        ? history.slice(0, 7).map(h => {
            const v = parseInt(h.value || 50, 10);
            const d = h.timestamp ? new Date(parseInt(h.timestamp, 10) * 1000) : null;
            const dateStr = d && !isNaN(d) ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';
            return `<div class="fg-hist-item"><div class="fg-hist-val">${v}</div><div class="fg-hist-date">${dateStr}</div></div>`;
          }).join('')
        : '<div style="font-size:.65rem;color:var(--text-muted)">No history</div>';
    }

    // Tools page panel
    const fgPanel = document.getElementById('fgPanel');
    if (fgPanel) {
      fgPanel.innerHTML = `
        <div style="display:flex;align-items:center;gap:14px;margin-bottom:12px">
          <div style="font-family:var(--font-mono);font-size:2.2rem;font-weight:700;color:${color}">${val}</div>
          <div>
            <div style="font-family:var(--font-mono);font-size:.82rem;font-weight:600;color:${color}">${label.toUpperCase()}</div>
            <div style="font-family:var(--font-mono);font-size:.62rem;color:var(--text-muted);margin-top:2px">CRYPTO FEAR & GREED INDEX</div>
          </div>
        </div>
        <div class="fg-bar"><div class="fg-indicator" style="left:${val}%"></div></div>
        <div class="fg-scale" style="margin-top:8px"><span>EXTREME FEAR</span><span>NEUTRAL</span><span>EXTREME GREED</span></div>`;
    }
  } catch (e) {
    const err = '<div style="color:var(--text-muted);font-size:.82rem;text-align:center;padding:16px">Unable to load Fear & Greed — start backend</div>';
    const fgPanel = document.getElementById('fgPanel');
    if (fgPanel) fgPanel.innerHTML = err;
    const fgValue = document.getElementById('fgValue');
    if (fgValue) fgValue.textContent = '—';
    const fgLabel = document.getElementById('fgLabel');
    if (fgLabel && document.getElementById('fgValue')) fgLabel.textContent = 'Offline';
  }
};

// ── APIClient ─────────────────────────────────────────────
class APIClient {
  constructor(base = API) { this.base = base; this._cache = new Map(); }
  async get(endpoint, ttl = 5 * 60 * 1000) {
    const c = this._cache.get(endpoint);
    if (c && ttl > 0 && Date.now() - c.ts < ttl) {
      if (endpoint === '/api/watchlist') window.cacheWatchlistData?.(c.data);
      return c.data;
    }
    const res = await fetch(`${this.base}${endpoint}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    this._cache.set(endpoint, { data, ts: Date.now() });
    if (endpoint === '/api/watchlist') window.cacheWatchlistData?.(data);
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
    const theme = document.documentElement.getAttribute('data-theme') || 'dark';
    const withTheme = (href) => href + '?theme=' + theme;
    drawer.innerHTML = `
      <div class="drawer-head">
        <span class="drawer-brand">MKT<span class="accent">PULSE</span></span>
        <button class="drawer-x" onclick="window.navManager.closeDrawer()">✕</button>
      </div>
      <nav class="drawer-nav">
        ${pages.map(p => `
          <a href="${withTheme(p.href)}" class="drawer-link ${p.href === path ? 'active' : ''}">
            <i class="bi ${p.icon}"></i>
            <span>${p.label}</span>
            ${p.href === path ? '<span class="drawer-dot"></span>' : ''}
          </a>`).join('')}
      </nav>
      <div class="drawer-foot">
        <div class="drawer-foot-row">
          <button class="drawer-theme" onclick="window.themeManager.toggle()">
            <i class="bi bi-circle-half"></i> THEME
          </button>
          <span class="drawer-clock-sm" id="drawerClock"></span>
        </div>
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
      if (el) el.innerHTML = `<span class="nav-clock-date">${d}</span><span class="nav-clock-time">${t}</span>`;
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
  if (window._statusBarReady) return;
  window._statusBarReady = true;
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
  const SB_LABELS = { 'sb-btc': 'BTC', 'sb-eth': 'ETH', 'sb-nvda': 'NVDA', 'sb-gold': 'XAU', 'sb-oil': 'OIL' };
  async function prices() {
    try {
      const data = await window.apiClient.get('/api/watchlist', 5 * 60 * 1000);
      window.cacheWatchlistData(data);
      const set = (id, asset) => {
        const el = document.getElementById(id);
        if (!el || !asset) return;
        const up = (asset.change_24h || 0) >= 0;
        el.className = 'sb-item ' + (up ? 'up' : 'down');
        el.innerHTML = `<span class="sb-label">${SB_LABELS[id] || ''}</span>`
          + `<span class="sb-value">${Fmt.price(asset.price)}</span>`
          + `<span style="font-size:.55rem;color:${up ? 'var(--green)' : 'var(--red)'}">`
          + `${up ? '▲' : '▼'}${Math.abs(asset.change_24h || 0).toFixed(2)}%</span>`;
      };
      set('sb-btc', data.crypto?.find(c => c.symbol === 'BTC'));
      set('sb-eth', data.crypto?.find(c => c.symbol === 'ETH'));
      set('sb-nvda', data.stocks?.find(s => s.symbol === 'NVDA'));
      set('sb-gold', data.commodities?.find(c => c.name === 'Gold'));
      set('sb-oil', data.commodities?.find(c => c.name === 'Crude Oil'));

      const wlEl = document.getElementById('sb-watchlist');
      if (wlEl) window.paintSbWatchlist(wlEl, window.matchFavoritesToWatchlist(data));
      window.refreshFavoritesUI?.(data);
    } catch (e) { /* offline */ }
  }
  prices(); setInterval(prices, 5*60*1000);

  // Re-render watchlist when favorites change (called from markets page)
  window.refreshSBWatchlist = () => prices();
};

// ── GLOBAL TICKER TAPE ────────────────────────────────
window.initTickerTape = async function() {
  const t = document.getElementById('tickerInner');
  if (!t || t.dataset.loaded) return;
  try {
    const data = await window.apiClient.get('/api/watchlist', 5 * 60 * 1000);
    window.cacheWatchlistData(data);
    const all = [...(data.crypto || []), ...(data.stocks || []), ...(data.commodities || [])];
    if (!all.length) return;
    const html = all.map(a => {
      const up = (a.change_24h || 0) >= 0;
      return `<div class="ticker-item">
        <span class="ti-sym">${a.symbol}</span>
        <span class="ti-price">${Fmt.price(a.price)}</span>
        <span class="ti-chg ${up ? 'up' : 'down'}">${up ? '▲' : '▼'}${Math.abs(a.change_24h || 0).toFixed(2)}%</span>
      </div>`;
    }).join('');
    t.innerHTML = html + html;
    t.dataset.loaded = '1';
  } catch (e) {}
};

document.addEventListener('DOMContentLoaded', () => {
  window.navManager     = new NavManager();
  window.scrollAnimator = new ScrollAnimator();
  stampThemeLinks();
  const t = document.getElementById('themeToggle');
  if (t) t.onclick = () => window.themeManager.toggle();
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') window.navManager?.closeDrawer();
  });
  window.addEventListener('mp-favorites-changed', () => window.refreshFavoritesUI?.());
  window.addEventListener('storage', e => { if (e.key === 'mp-favorites') window.refreshFavoritesUI?.(); });
  window.addEventListener('focus', () => window.refreshFavoritesUI?.());
  // Init status bar (prices + sessions + watchlist)
  window.initStatusBar();
  window.initTickerTape();
  window.loadFearGreed?.();
  setTimeout(() => window._loader?.hide(), 1800);
});
