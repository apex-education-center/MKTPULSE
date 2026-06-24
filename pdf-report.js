// ═══════════════════════════════════════════════════════
// MARKETPULSE — 10 NEW FEATURES v8
// ═══════════════════════════════════════════════════════

// ── FEATURE 1: KEYBOARD SHORTCUTS ───────────────────────
class KeyboardShortcuts {
  constructor() {
    this.shortcuts = {
      'g+h': () => window.location.href = 'index.html',
      'g+m': () => window.location.href = 'markets.html',
      'g+n': () => window.location.href = 'news.html',
      'g+y': () => window.location.href = 'youtube.html',
      'g+c': () => window.location.href = 'calendar.html',
      'g+t': () => window.location.href = 'tools.html',
      'g+s': () => window.location.href = 'search.html',
      '/':   () => { const s = document.getElementById('globalSearch') || document.getElementById('assetSearch') || document.getElementById('newsSearch'); if (s) { s.focus(); } },
      't':   () => window.themeManager?.toggle(),
    };
    this._buf = '';
    this._timer = null;
    this._listen();
    this._renderHelp();
  }

  _listen() {
    document.addEventListener('keydown', e => {
      // Ignore when typing in inputs
      if (['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName)) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      this._buf += e.key.toLowerCase();
      clearTimeout(this._timer);
      this._timer = setTimeout(() => { this._buf = ''; }, 800);

      if (this.shortcuts[this._buf]) {
        e.preventDefault();
        this.shortcuts[this._buf]();
        this._buf = '';
        clearTimeout(this._timer);
      } else if (this._buf.length > 3) {
        this._buf = e.key.toLowerCase();
      }
    });
  }

  _renderHelp() {
    // ? key shows shortcut overlay
    document.addEventListener('keydown', e => {
      if (e.key === '?' && !['INPUT','TEXTAREA'].includes(e.target.tagName)) {
        this.toggleHelp();
      }
      if (e.key === 'Escape') this.hideHelp();
    });

    const overlay = document.createElement('div');
    overlay.id = 'shortcutOverlay';
    overlay.style.cssText = `display:none;position:fixed;inset:0;z-index:9000;background:rgba(0,0,0,.85);backdrop-filter:blur(8px);align-items:center;justify-content:center;font-family:'IBM Plex Mono',monospace`;
    overlay.onclick = e => { if (e.target === overlay) this.hideHelp(); };
    overlay.innerHTML = `
      <div style="background:var(--bg-surface);border:1px solid var(--amber);border-top:3px solid var(--amber);border-radius:8px;padding:28px 32px;min-width:360px;max-width:90vw">
        <div style="font-size:.7rem;letter-spacing:.15em;text-transform:uppercase;color:var(--amber);margin-bottom:20px;display:flex;justify-content:space-between">
          <span>KEYBOARD SHORTCUTS</span>
          <span style="cursor:pointer;color:var(--text-muted)" onclick="window._shortcuts.hideHelp()">✕</span>
        </div>
        ${[
          ['G → H','Go to Terminal'],
          ['G → M','Go to Markets'],
          ['G → N','Go to News'],
          ['G → Y','Go to Videos'],
          ['G → C','Go to Calendar'],
          ['G → T','Go to Tools'],
          ['G → S','Go to Search'],
          ['/','Focus Search'],
          ['T','Toggle Theme'],
          ['?','Show this help'],
        ].map(([k,d]) => `
          <div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid var(--border-dim)">
            <span style="background:var(--bg-raised);border:1px solid var(--border-mid);padding:2px 8px;border-radius:3px;font-size:.68rem;color:var(--amber)">${k}</span>
            <span style="font-size:.72rem;color:var(--text-secondary)">${d}</span>
          </div>`).join('')}
        <div style="font-size:.6rem;color:var(--text-muted);margin-top:14px;text-align:center">PRESS ? TO TOGGLE · ESC TO CLOSE</div>
      </div>`;
    document.body.appendChild(overlay);
  }

  toggleHelp() {
    const el = document.getElementById('shortcutOverlay');
    if (!el) return;
    el.style.display = el.style.display === 'none' ? 'flex' : 'none';
  }

  hideHelp() {
    const el = document.getElementById('shortcutOverlay');
    if (el) el.style.display = 'none';
  }
}

// ── FEATURE 2: PRICE CHANGE FLASH ───────────────────────
class PriceFlash {
  static flash(el, direction) {
    if (!el) return;
    el.style.transition = 'background .05s';
    el.style.background = direction === 'up' ? 'rgba(0,200,83,.25)' : 'rgba(255,23,68,.25)';
    setTimeout(() => {
      el.style.background = '';
      el.style.transition = 'background .5s';
    }, 400);
  }
}

// ── FEATURE 3: MINI CHART MODAL (click any sparkline) ───
class SparklineExpand {
  static init() {
    document.addEventListener('click', e => {
      const canvas = e.target.closest('canvas[id^="spark-"]');
      if (!canvas) return;
      const id    = canvas.id; // spark-crypto-0
      const parts = id.split('-');
      if (parts.length < 3) return;
      e.stopPropagation();
    });
  }
}

// ── FEATURE 4: WATCHLIST SNAPSHOT (save current state) ──
class WatchlistSnapshot {
  static save(data) {
    const snapshot = {
      timestamp: new Date().toISOString(),
      data: data,
    };
    const snapshots = JSON.parse(localStorage.getItem('mp-snapshots') || '[]');
    snapshots.unshift(snapshot);
    if (snapshots.length > 10) snapshots.splice(10);
    localStorage.setItem('mp-snapshots', JSON.stringify(snapshots));
    Toast.show('SNAPSHOT SAVED ✓', 'success');
  }

  static getAll() {
    return JSON.parse(localStorage.getItem('mp-snapshots') || '[]');
  }
}

// ── FEATURE 5: CONNECTION STATUS MONITOR ────────────────
class ConnectionMonitor {
  constructor() {
    this._online = navigator.onLine;
    this._el = null;
    this._init();
  }

  _init() {
    const el = document.createElement('div');
    el.id = 'connStatus';
    el.style.cssText = `
      position:fixed;bottom:16px;left:16px;z-index:9998;
      font-family:'IBM Plex Mono',monospace;font-size:.6rem;letter-spacing:.08em;
      padding:4px 10px;border-radius:2px;border:1px solid;
      display:none;transition:all .3s;
    `;
    document.body.appendChild(el);
    this._el = el;

    window.addEventListener('online',  () => this._update(true));
    window.addEventListener('offline', () => this._update(false));

    // Periodic check
    setInterval(() => {
      if (!navigator.onLine && this._online) this._update(false);
      else if (navigator.onLine && !this._online) this._update(true);
    }, 5000);
  }

  _update(online) {
    this._online = online;
    if (!this._el) return;
    if (online) {
      this._el.style.display = 'block';
      this._el.style.background = 'rgba(0,200,83,.1)';
      this._el.style.borderColor = 'var(--green)';
      this._el.style.color = 'var(--green)';
      this._el.textContent = '● CONNECTED';
      setTimeout(() => { if (this._el) this._el.style.display = 'none'; }, 3000);
    } else {
      this._el.style.display = 'block';
      this._el.style.background = 'rgba(255,23,68,.1)';
      this._el.style.borderColor = 'var(--red)';
      this._el.style.color = 'var(--red)';
      this._el.textContent = '⚠ OFFLINE — DATA MAY BE STALE';
    }
  }
}

// ── FEATURE 6: DATA REFRESH INDICATOR ───────────────────
class RefreshIndicator {
  static show(message = 'REFRESHING...') {
    let el = document.getElementById('refreshBar');
    if (!el) {
      el = document.createElement('div');
      el.id = 'refreshBar';
      el.style.cssText = `
        position:fixed;top:0;left:0;right:0;height:2px;z-index:99998;
        background:linear-gradient(90deg,transparent,var(--amber),transparent);
        background-size:200% 100%;
        animation:refreshSlide 1s linear infinite;
      `;
      const style = document.createElement('style');
      style.textContent = '@keyframes refreshSlide{0%{background-position:200% 0}100%{background-position:-200% 0}}';
      document.head.appendChild(style);
      document.body.appendChild(el);
    }
    el.style.display = 'block';
  }

  static hide() {
    const el = document.getElementById('refreshBar');
    if (el) el.style.display = 'none';
  }
}

// ── FEATURE 7: CONTEXTUAL TOOLTIPS ──────────────────────
class TerminalTooltips {
  static init() {
    document.querySelectorAll('[data-tip]').forEach(el => {
      el.style.position = 'relative';
      el.style.cursor   = 'help';
      el.addEventListener('mouseenter', e => {
        const tip = document.createElement('div');
        tip.className = 'mp-tooltip';
        tip.textContent = el.dataset.tip;
        tip.style.cssText = `
          position:absolute;bottom:calc(100% + 6px);left:50%;transform:translateX(-50%);
          background:var(--bg-raised);border:1px solid var(--amber);border-radius:4px;
          font-family:'IBM Plex Mono',monospace;font-size:.62rem;letter-spacing:.04em;
          color:var(--text-primary);padding:5px 10px;white-space:nowrap;z-index:9000;
          box-shadow:0 4px 16px rgba(0,0,0,.5);pointer-events:none;
        `;
        el.appendChild(tip);
      });
      el.addEventListener('mouseleave', () => {
        el.querySelector('.mp-tooltip')?.remove();
      });
    });
  }
}

// ── FEATURE 8: MARKET SESSION INDICATOR ─────────────────
class MarketSession {
  static render(containerId) {
    const el = document.getElementById(containerId);
    if (!el) return;

    const now = new Date();
    const sessions = [
      { name: 'NYSE',    tz: 'America/New_York',  open: '09:30', close: '16:00', color: '#00c853' },
      { name: 'LSE',     tz: 'Europe/London',     open: '08:00', close: '16:30', color: '#4da6ff' },
      { name: 'TSE',     tz: 'Asia/Tokyo',        open: '09:00', close: '15:30', color: '#f0a500' },
      { name: 'CRYPTO',  tz: 'UTC',               open: '00:00', close: '23:59', color: '#a78bfa', always: true },
    ];

    el.innerHTML = sessions.map(s => {
      if (s.always) {
        return `<div style="display:flex;align-items:center;gap:5px;font-family:var(--font-mono);font-size:.62rem">
          <span style="width:6px;height:6px;border-radius:50%;background:${s.color};box-shadow:0 0 5px ${s.color};flex-shrink:0"></span>
          <span style="color:${s.color}">${s.name}</span>
          <span style="color:var(--green);font-size:.58rem">24/7</span>
        </div>`;
      }

      const localTime = new Date(now.toLocaleString('en-US', { timeZone: s.tz }));
      const h = localTime.getHours();
      const m = localTime.getMinutes();
      const [oh, om] = s.open.split(':').map(Number);
      const [ch, cm] = s.close.split(':').map(Number);
      const isOpen = (h * 60 + m) >= (oh * 60 + om) && (h * 60 + m) < (ch * 60 + cm);
      const dow = localTime.getDay();
      const isWeekday = dow >= 1 && dow <= 5;
      const active = isOpen && isWeekday;

      return `<div style="display:flex;align-items:center;gap:5px;font-family:var(--font-mono);font-size:.62rem">
        <span style="width:6px;height:6px;border-radius:50%;background:${active ? s.color : 'var(--text-muted)'};${active ? `box-shadow:0 0 5px ${s.color};animation:livePulse 2s infinite` : ''};flex-shrink:0"></span>
        <span style="color:${active ? s.color : 'var(--text-muted)'}">${s.name}</span>
        <span style="color:${active ? 'var(--green)' : 'var(--red)'};font-size:.58rem">${active ? 'OPEN' : 'CLOSED'}</span>
      </div>`;
    }).join('');
  }
}

// ── FEATURE 9: QUICK COMPARE (select 2 assets) ──────────
class QuickCompare {
  constructor() {
    this.selected = [];
    this.maxSelect = 2;
  }

  toggle(asset) {
    const idx = this.selected.findIndex(a => a.symbol === asset.symbol);
    if (idx >= 0) {
      this.selected.splice(idx, 1);
    } else if (this.selected.length < this.maxSelect) {
      this.selected.push(asset);
    } else {
      Toast.show('MAX 2 ASSETS FOR COMPARISON', 'warning');
      return;
    }
    this._updateUI();
  }

  _updateUI() {
    let el = document.getElementById('compareBar');
    if (!el) {
      el = document.createElement('div');
      el.id = 'compareBar';
      el.style.cssText = `
        position:fixed;bottom:0;left:0;right:0;
        background:var(--bg-surface);border-top:2px solid var(--amber);
        padding:10px 20px;display:flex;align-items:center;gap:16px;
        font-family:'IBM Plex Mono',monospace;font-size:.72rem;
        z-index:500;transform:translateY(100%);transition:transform .3s ease;
      `;
      document.body.appendChild(el);
    }

    if (!this.selected.length) {
      el.style.transform = 'translateY(100%)';
      return;
    }

    el.style.transform = 'translateY(0)';
    const items = this.selected.map(a => {
      const up = a.change_24h >= 0;
      return `<div style="display:flex;gap:8px;align-items:center;padding:4px 12px;background:var(--bg-raised);border:1px solid var(--border-mid);border-radius:4px">
        <span style="color:var(--amber);font-weight:700">${a.symbol}</span>
        <span>${Fmt.price(a.price)}</span>
        <span style="color:${up?'var(--green)':'var(--red)'}">${up?'+':''}${a.change_24h?.toFixed(2)}%</span>
        <span style="cursor:pointer;color:var(--text-muted)" onclick="window.quickCompare.toggle({symbol:'${a.symbol}'})">✕</span>
      </div>`;
    }).join('<span style="color:var(--text-muted)">vs</span>');

    const compareBtn = this.selected.length === 2 ? `
      <button onclick="window.quickCompare.showModal()" style="background:var(--amber);color:#000;border:none;padding:6px 16px;border-radius:3px;font-family:'IBM Plex Mono',monospace;font-size:.65rem;font-weight:700;letter-spacing:.08em;cursor:pointer;margin-left:auto">
        COMPARE →
      </button>` : '';

    el.innerHTML = `
      <span style="color:var(--text-muted);letter-spacing:.1em;font-size:.6rem">COMPARE</span>
      ${items}
      ${compareBtn}
      <button onclick="window.quickCompare.clear()" style="background:none;border:1px solid var(--border-mid);color:var(--text-muted);padding:4px 10px;border-radius:3px;font-family:'IBM Plex Mono',monospace;font-size:.6rem;cursor:pointer;${this.selected.length===2?'':'margin-left:auto'}">
        CLEAR
      </button>`;
  }

  showModal() {
    if (this.selected.length < 2) return;
    const [a, b] = this.selected;
    const rows = [
      ['Price', Fmt.price(a.price), Fmt.price(b.price)],
      ['24h Change', Fmt.pct(a.change_24h, false), Fmt.pct(b.change_24h, false)],
      ['7d Change', Fmt.pct(a.change_7d, false), Fmt.pct(b.change_7d, false)],
      ['Volume', Fmt.large(a.volume), Fmt.large(b.volume)],
      ['Market Cap', Fmt.large(a.market_cap||0), Fmt.large(b.market_cap||0)],
    ];

    let modal = document.getElementById('compareModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'compareModal';
      modal.style.cssText = 'position:fixed;inset:0;z-index:3000;background:rgba(0,0,0,.8);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;padding:20px';
      modal.onclick = e => { if (e.target === modal) modal.remove(); };
      document.body.appendChild(modal);
    }

    modal.style.display = 'flex';
    modal.innerHTML = `
      <div style="background:var(--bg-surface);border:1px solid var(--amber);border-top:3px solid var(--amber);border-radius:8px;padding:24px;width:min(720px,94vw);max-width:94vw;box-sizing:border-box;font-family:'IBM Plex Mono',monospace">
        <div style="display:flex;justify-content:space-between;margin-bottom:20px">
          <span style="color:var(--amber);font-size:.72rem;letter-spacing:.1em;text-transform:uppercase">COMPARISON: ${a.symbol} vs ${b.symbol}</span>
          <span style="cursor:pointer;color:var(--text-muted)" onclick="document.getElementById('compareModal').remove()">✕</span>
        </div>
        <table style="width:100%;border-collapse:collapse;font-size:.72rem">
          <thead>
            <tr>
              <th style="text-align:left;padding:6px 10px;border-bottom:1px solid var(--border-dim);color:var(--text-muted);font-weight:400">METRIC</th>
              <th style="text-align:right;padding:6px 10px;border-bottom:1px solid var(--border-dim);color:var(--amber)">${a.symbol}</th>
              <th style="text-align:right;padding:6px 10px;border-bottom:1px solid var(--border-dim);color:var(--blue)">${b.symbol}</th>
            </tr>
          </thead>
          <tbody>
            ${rows.map(([label, av, bv]) => `
              <tr>
                <td style="padding:7px 10px;border-bottom:1px solid var(--border-dim);color:var(--text-muted)">${label}</td>
                <td style="padding:7px 10px;border-bottom:1px solid var(--border-dim);text-align:right;color:var(--text-primary)">${av}</td>
                <td style="padding:7px 10px;border-bottom:1px solid var(--border-dim);text-align:right;color:var(--text-primary)">${bv}</td>
              </tr>`).join('')}
          </tbody>
        </table>
        ${a.sparkline?.length && b.sparkline?.length ? `
        <div style="margin-top:20px;display:grid;grid-template-columns:1fr 1fr;gap:16px">
          <div style="min-width:0">
            <div style="text-align:center;font-size:.6rem;color:var(--amber);margin-bottom:6px">${a.symbol} 7D</div>
            <canvas id="cmpChartA" style="width:100%!important;max-width:100%;height:80px"></canvas>
          </div>
          <div style="min-width:0">
            <div style="text-align:center;font-size:.6rem;color:var(--blue);margin-bottom:6px">${b.symbol} 7D</div>
            <canvas id="cmpChartB" style="width:100%!important;max-width:100%;height:80px"></canvas>
          </div>
        </div>` : ''}
      </div>`;

    if (a.sparkline?.length && b.sparkline?.length) {
      setTimeout(() => {
        Sparkline.draw('cmpChartA', a.sparkline, (a.change_7d||0)>=0);
        Sparkline.draw('cmpChartB', b.sparkline, (b.change_7d||0)>=0);
      }, 50);
    }
  }

  clear() {
    this.selected = [];
    this._updateUI();
  }
}

// ── FEATURE 10: READING PROGRESS + SCROLL TO TOP ─────────
class ScrollUX {
  constructor() {
    // Scroll to top button
    const btn = document.createElement('button');
    btn.id = 'scrollTop';
    btn.innerHTML = '▲';
    btn.style.cssText = `
      position:fixed;bottom:20px;right:20px;z-index:500;
      background:var(--bg-raised);border:1px solid var(--border-mid);
      color:var(--text-muted);width:34px;height:34px;
      border-radius:3px;cursor:pointer;font-size:.8rem;
      font-family:'IBM Plex Mono',monospace;
      transition:all .2s;display:none;
      display:flex;align-items:center;justify-content:center;
      opacity:0;pointer-events:none;
    `;
    btn.onclick = () => window.scrollTo({ top: 0, behavior: 'smooth' });
    btn.onmouseenter = () => { btn.style.borderColor='var(--amber)'; btn.style.color='var(--amber)'; };
    btn.onmouseleave = () => { btn.style.borderColor='var(--border-mid)'; btn.style.color='var(--text-muted)'; };
    document.body.appendChild(btn);

    window.addEventListener('scroll', () => {
      const visible = window.scrollY > 400;
      btn.style.opacity = visible ? '1' : '0';
      btn.style.pointerEvents = visible ? 'all' : 'none';
    });
  }
}

// ── INIT ALL FEATURES ────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  window._shortcuts       = new KeyboardShortcuts();
  window._connMonitor     = new ConnectionMonitor();
  window.quickCompare     = new QuickCompare();
  new ScrollUX();
  TerminalTooltips.init();
  SparklineExpand.init();

  // Render market sessions in status bar if element exists
  setInterval(() => MarketSession.render('marketSessions'), 60000);
  MarketSession.render('marketSessions');

  // Add keyboard shortcut hint to footer
  const hint = document.createElement('div');
  hint.style.cssText = 'position:fixed;bottom:8px;right:58px;font-family:"IBM Plex Mono",monospace;font-size:.55rem;color:var(--text-muted);letter-spacing:.08em;z-index:499;pointer-events:none';
  hint.textContent = 'PRESS ? FOR SHORTCUTS';
  document.body.appendChild(hint);
  setTimeout(() => { hint.style.opacity='0'; hint.style.transition='opacity 1s'; setTimeout(()=>hint.remove(),1000); }, 4000);
});
