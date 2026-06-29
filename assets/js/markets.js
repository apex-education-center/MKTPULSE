// ═══════════════════════════════════════════════════════
// MARKETPULSE — MARKETS PAGE v9
// Clean Bloomberg-style price table
// ═══════════════════════════════════════════════════════

class MarketsPage {
  constructor() {
    this.data     = {};
    this.tab      = 'crypto';
    this.sortKey  = 'rank';
    this.sortAsc  = true;
    this.query    = '';
    this.chart    = null;
    this.init();
  }

  async init() {
    await this.reload();
    setInterval(() => this.reload(), 5 * 60 * 1000);
    this.loadFG();
  }

  async reload() {
    const btn = document.getElementById('refreshBtn');
    if (btn) btn.innerHTML = '<div class="spinner-border spinner-border-sm" style="color:var(--amber);width:.8rem;height:.8rem"></div>';
    try {
      this.data = await window.apiClient.get('/api/watchlist', 0);
      // Treat empty response same as failure — shows demo data instead
      const totalAssets = (this.data.crypto?.length || 0) + (this.data.stocks?.length || 0) + (this.data.commodities?.length || 0);
      if (totalAssets === 0) throw new Error('No data returned');
      this._isFakeData = false;
      this._removeDemoBanner();
      if (this._demoRetryTimer) { clearInterval(this._demoRetryTimer); this._demoRetryTimer = null; }
      window.cacheWatchlistData?.(this.data);
      this.renderKPI();
      this.renderTable();
      this.renderSideHeatmap();
      this.renderSideFavorites();
      this.renderSideMovers();
      const el = document.getElementById('lastUpdate');
      if (el) el.textContent = 'UPD ' + new Date().toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit', hour12:false });
      window.refreshFavoritesUI?.(this.data);
    } catch(e) {
      this._renderUnavailable();
    }
    if (btn) btn.innerHTML = '<i class="bi bi-arrow-clockwise me-1"></i>REFRESH';
  }

  // ── FAKE / DEMO DATA (shown when API is rate-limited) ──
  _getFakeData() {
    return {
      crypto: [
        { symbol:'BTC',  name:'Bitcoin',       price:67420.00, change_24h:+1.82, change_7d:+5.41,  volume:28400000000, market_cap:1320000000000, rank:1,  image:'https://assets.coingecko.com/coins/images/1/thumb/bitcoin.png',    sparkline:[] },
        { symbol:'ETH',  name:'Ethereum',      price:3512.50,  change_24h:-0.64, change_7d:+3.17,  volume:12100000000, market_cap:421000000000,  rank:2,  image:'https://assets.coingecko.com/coins/images/279/thumb/ethereum.png', sparkline:[] },
        { symbol:'BNB',  name:'BNB',           price:594.30,   change_24h:+0.91, change_7d:+2.05,  volume:1800000000,  market_cap:86000000000,   rank:3,  image:'https://assets.coingecko.com/coins/images/825/thumb/bnb-icon2_2x.png', sparkline:[] },
        { symbol:'SOL',  name:'Solana',        price:178.40,   change_24h:+3.21, change_7d:+9.88,  volume:3200000000,  market_cap:82000000000,   rank:4,  image:'https://assets.coingecko.com/coins/images/4128/thumb/solana.png', sparkline:[] },
        { symbol:'XRP',  name:'XRP',           price:0.6210,   change_24h:-1.10, change_7d:-2.30,  volume:1500000000,  market_cap:34000000000,   rank:5,  image:'https://assets.coingecko.com/coins/images/44/thumb/xrp-symbol-white-128.png', sparkline:[] },
        { symbol:'USDT', name:'Tether',        price:1.0000,   change_24h:+0.01, change_7d:+0.00,  volume:55000000000, market_cap:110000000000,  rank:6,  image:'', sparkline:[] },
        { symbol:'ADA',  name:'Cardano',       price:0.4510,   change_24h:-0.82, change_7d:+1.44,  volume:480000000,   market_cap:16000000000,   rank:7,  image:'', sparkline:[] },
        { symbol:'AVAX', name:'Avalanche',     price:38.20,    change_24h:+2.15, change_7d:+6.70,  volume:640000000,   market_cap:15700000000,   rank:8,  image:'', sparkline:[] },
        { symbol:'DOGE', name:'Dogecoin',      price:0.1620,   change_24h:+4.50, change_7d:+12.10, volume:1900000000,  market_cap:23000000000,   rank:9,  image:'', sparkline:[] },
        { symbol:'DOT',  name:'Polkadot',      price:7.840,    change_24h:-1.34, change_7d:-3.20,  volume:280000000,   market_cap:11000000000,   rank:10, image:'', sparkline:[] },
      ],
      stocks: [
        { symbol:'AAPL',  name:'Apple Inc.',         price:189.30, change_24h:+0.72, change_7d:+2.10,  volume:54000000,  market_cap:2940000000000, rank:1, image:'', sparkline:[] },
        { symbol:'MSFT',  name:'Microsoft Corp.',    price:415.80, change_24h:+1.14, change_7d:+3.40,  volume:22000000,  market_cap:3090000000000, rank:2, image:'', sparkline:[] },
        { symbol:'NVDA',  name:'NVIDIA Corp.',       price:875.40, change_24h:+2.88, change_7d:+8.60,  volume:41000000,  market_cap:2160000000000, rank:3, image:'', sparkline:[] },
        { symbol:'GOOGL', name:'Alphabet Inc.',      price:175.60, change_24h:-0.31, change_7d:+1.20,  volume:24000000,  market_cap:2190000000000, rank:4, image:'', sparkline:[] },
        { symbol:'AMZN',  name:'Amazon.com Inc.',    price:192.40, change_24h:+0.55, change_7d:+2.80,  volume:31000000,  market_cap:2010000000000, rank:5, image:'', sparkline:[] },
        { symbol:'TSLA',  name:'Tesla Inc.',         price:248.50, change_24h:-1.22, change_7d:-4.30,  volume:98000000,  market_cap:792000000000,  rank:6, image:'', sparkline:[] },
        { symbol:'META',  name:'Meta Platforms',     price:521.30, change_24h:+1.60, change_7d:+4.10,  volume:15000000,  market_cap:1340000000000, rank:7, image:'', sparkline:[] },
        { symbol:'JPM',   name:'JPMorgan Chase',     price:201.70, change_24h:+0.40, change_7d:+1.60,  volume:9500000,   market_cap:581000000000,  rank:8, image:'', sparkline:[] },
        { symbol:'V',     name:'Visa Inc.',           price:278.90, change_24h:+0.28, change_7d:+0.90,  volume:7200000,   market_cap:564000000000,  rank:9, image:'', sparkline:[] },
        { symbol:'WMT',   name:'Walmart Inc.',        price:68.40,  change_24h:+0.15, change_7d:+0.50,  volume:22000000,  market_cap:549000000000,  rank:10, image:'', sparkline:[] },
      ],
      commodities: [
        { symbol:'XAU',  name:'Gold',          price:2324.50, change_24h:+0.61, change_7d:+1.80,  volume:0, market_cap:0, rank:1, image:'', sparkline:[] },
        { symbol:'XAG',  name:'Silver',        price:29.14,   change_24h:+1.02, change_7d:+2.40,  volume:0, market_cap:0, rank:2, image:'', sparkline:[] },
        { symbol:'CL',   name:'Crude Oil WTI', price:82.75,   change_24h:-0.48, change_7d:-1.20,  volume:0, market_cap:0, rank:3, image:'', sparkline:[] },
        { symbol:'NG',   name:'Natural Gas',   price:2.184,   change_24h:-1.10, change_7d:-3.50,  volume:0, market_cap:0, rank:4, image:'', sparkline:[] },
        { symbol:'ZW',   name:'Wheat',         price:568.00,  change_24h:+0.35, change_7d:+0.80,  volume:0, market_cap:0, rank:5, image:'', sparkline:[] },
        { symbol:'ZC',   name:'Corn',          price:452.75,  change_24h:-0.22, change_7d:-0.60,  volume:0, market_cap:0, rank:6, image:'', sparkline:[] },
        { symbol:'HG',   name:'Copper',        price:4.562,   change_24h:+0.80, change_7d:+2.10,  volume:0, market_cap:0, rank:7, image:'', sparkline:[] },
        { symbol:'PL',   name:'Platinum',      price:984.20,  change_24h:-0.30, change_7d:-0.90,  volume:0, market_cap:0, rank:8, image:'', sparkline:[] },
      ],
    };
  }

  _injectDemoBanner() {
    // Avoid duplicate banners
    if (document.getElementById('mp-demo-banner')) return;
    const banner = document.createElement('div');
    banner.id = 'mp-demo-banner';
    banner.style.cssText = `
      position:sticky; top:0; z-index:50;
      background:rgba(246,36,89,.10);
      border-bottom:1px solid rgba(246,36,89,.40);
      padding:7px 16px;
      display:flex; align-items:center; gap:10px; flex-wrap:wrap;
    `;
    banner.innerHTML = `
      <span style="font-family:var(--font-mono);font-size:.58rem;letter-spacing:.12em;color:#f62459;font-weight:700">
        ⚠ DEMO DATA
      </span>
      <span style="font-family:var(--font-mono);font-size:.6rem;color:var(--text-muted);flex:1">
        Live prices unavailable — API rate limit reached. Prices below are <strong style="color:var(--text-secondary)">illustrative only</strong> and do not reflect real market values.
      </span>
      <button onclick="mktPage.reload()" style="
        background:transparent;border:1px solid rgba(246,36,89,.5);color:#f62459;
        font-family:var(--font-mono);font-size:.58rem;letter-spacing:.08em;
        padding:4px 12px;cursor:pointer;border-radius:2px;white-space:nowrap;
      ">↻ RETRY LIVE FEED</button>
    `;
    // Insert before the main market table wrapper
    const tableWrap = document.querySelector('.mkts-wrap') || document.querySelector('.markets-layout') || document.getElementById('mktsBody')?.closest('table');
    if (tableWrap?.parentNode) {
      tableWrap.parentNode.insertBefore(banner, tableWrap);
    } else {
      // fallback: prepend to main
      const main = document.querySelector('main') || document.body;
      main.prepend(banner);
    }
  }

  _removeDemoBanner() {
    document.getElementById('mp-demo-banner')?.remove();
  }

  // ── DATA UNAVAILABLE STATE ─────────────────────────────
  _renderUnavailable() {
    // Inject fake data so the page still shows content
    this.data = this._getFakeData();
    this._isFakeData = true;

    // Show the sticky warning banner
    this._injectDemoBanner();

    // Render everything normally with fake data
    this.renderKPI();
    this.renderTable();
    this.renderSideHeatmap();
    this.renderSideFavorites();
    this.renderSideMovers();

    // Status bar timestamp
    const el = document.getElementById('lastUpdate');
    if (el) el.textContent = 'DEMO MODE';

    // Side panels — add demo note
    const sideHeatmap = document.getElementById('sideHeatmap');
    if (sideHeatmap) {
      const note = document.createElement('div');
      note.style.cssText = 'font-family:var(--font-mono);font-size:.55rem;color:rgba(246,36,89,.7);text-align:center;padding:4px 0 0;letter-spacing:.06em';
      note.textContent = '⚠ DEMO PRICES';
      sideHeatmap.appendChild(note);
    }

    // Keep retrying the live feed every 15s
    if (!this._demoRetryTimer) {
      this._demoRetryTimer = setInterval(async () => {
        try {
          const fresh = await window.apiClient.get('/api/watchlist', 0);
          const total = (fresh.crypto?.length || 0) + (fresh.stocks?.length || 0) + (fresh.commodities?.length || 0);
          if (total === 0) throw new Error('still empty');
          clearInterval(this._demoRetryTimer);
          this._demoRetryTimer = null;
          this._isFakeData = false;
          this.data = fresh;
          this._removeDemoBanner();
          window.cacheWatchlistData?.(fresh);
          this.renderKPI();
          this.renderTable();
          this.renderSideHeatmap();
          this.renderSideFavorites();
          this.renderSideMovers();
          const el = document.getElementById('lastUpdate');
          if (el) el.textContent = 'UPD ' + new Date().toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit', hour12:false });
          window.refreshFavoritesUI?.(fresh);
          Toast.show('Live feed restored', 'success');
        } catch(e) {}
      }, 15000);
    }
  }
  // ── KPI STRIP ──────────────────────────────────────────
  renderKPI() {
    const all = [...(this.data.crypto||[]), ...(this.data.stocks||[]), ...(this.data.commodities||[])];
    const btc  = this.data.crypto?.find(c => c.symbol === 'BTC');
    const g    = all.filter(a => a.change_24h > 0).length;
    const l    = all.filter(a => a.change_24h < 0).length;
    const strip = document.getElementById('kpiStrip');
    if (!strip) return;
    strip.innerHTML = `
      <div class="kpi-cell">
        <div class="kc-label">TOTAL ASSETS</div>
        <div class="kc-value">${all.length}</div>
        <div class="kc-sub" style="color:var(--text-muted)">3 CATEGORIES</div>
      </div>
      <div class="kpi-cell">
        <div class="kc-label">GAINERS 24H</div>
        <div class="kc-value" style="color:var(--green)">${g}</div>
        <div class="kc-sub" style="color:var(--green)">▲ POSITIVE</div>
      </div>
      <div class="kpi-cell">
        <div class="kc-label">LOSERS 24H</div>
        <div class="kc-value" style="color:var(--red)">${l}</div>
        <div class="kc-sub" style="color:var(--red)">▼ NEGATIVE</div>
      </div>
      <div class="kpi-cell">
        <div class="kc-label">BTC PRICE</div>
        <div class="kc-value">${btc ? Fmt.price(btc.price) : '—'}</div>
        <div class="kc-sub">${btc ? (btc.change_24h >= 0 ? `<span style="color:var(--green)">▲ ${btc.change_24h.toFixed(2)}%</span>` : `<span style="color:var(--red)">▼ ${Math.abs(btc.change_24h).toFixed(2)}%</span>`) : ''}</div>
      </div>
      <div class="kpi-cell">
        <div class="kc-label">FAVORITES</div>
        <div class="kc-value" style="color:var(--amber)">${window.favoritesManager.count()}</div>
        <div class="kc-sub" style="color:var(--amber)">⭐ SAVED</div>
      </div>`;
  }

  // ── TABLE ───────────────────────────────────────────────
  setTab(tab, el) {
    document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
    el.classList.add('active');
    this.tab = tab;
    this.renderTable();
  }

  sort(key) {
    if (this.sortKey === key) this.sortAsc = !this.sortAsc;
    else { this.sortKey = key; this.sortAsc = key === '#'; }
    // Update header classes
    document.querySelectorAll('.mkts-table th').forEach(th => { th.classList.remove('asc','desc'); });
    this.renderTable();
  }

  search(q) {
    this.query = q;
    this.renderTable();
  }

  renderTable() {
    let assets = [...(this.data[this.tab] || [])];

    // Filter
    if (this.query) {
      const q = this.query.toLowerCase();
      assets = assets.filter(a => a.name.toLowerCase().includes(q) || a.symbol.toLowerCase().includes(q));
    }

    // Sort
    if (this.sortKey === '#' || this.sortKey === 'rank') {
      // default order
    } else {
      assets.sort((a,b) => {
        const av = a[this.sortKey] ?? 0;
        const bv = b[this.sortKey] ?? 0;
        return this.sortAsc ? av - bv : bv - av;
      });
    }

    const body = document.getElementById('mktsBody');
    if (!body) return;

    this._displayAssets = assets;

    if (!assets.length) {
      body.innerHTML = `<tr><td colspan="9" style="text-align:center;padding:40px;color:var(--text-muted);font-family:var(--font-mono);font-size:.72rem">NO ASSETS FOUND</td></tr>`;
      return;
    }

    body.innerHTML = assets.map((a, i) => {
      const up24 = (a.change_24h || 0) >= 0;
      const up7d = (a.change_7d  || 0) >= 0;
      const isFav = window.favoritesManager.has(a.symbol);
      const sparkId = `spark_${this.tab}_${i}`;

      const icon = a.image
        ? `<img src="${a.image}" alt="" onerror="this.parentElement.innerHTML='${a.symbol.substring(0,3)}';">`
        : `<span style="font-size:.58rem">${a.symbol.substring(0,3)}</span>`;

      return `<tr class="mrow" onclick="mktPage.openDetail(${i})">
        <td style="color:var(--text-muted);font-size:.7rem">${i+1}</td>
        <td>
          <div class="asset-cell">
            <div class="asset-ico">${icon}</div>
            <div>
              <span class="asset-name">${a.name}</span>
              <span class="asset-sym">${a.symbol}</span>
            </div>
          </div>
        </td>
        <td><span class="price-val">${Fmt.price(a.price)}</span></td>
        <td><span class="${up24 ? 'chg-up' : 'chg-down'}">${up24 ? '▲' : '▼'} ${Math.abs(a.change_24h || 0).toFixed(2)}%</span></td>
        <td><span class="${up7d ? 'chg-up' : 'chg-down'}">${up7d ? '▲' : '▼'} ${Math.abs(a.change_7d || 0).toFixed(2)}%</span></td>
        <td><span class="num-cell">${Fmt.large(a.volume)}</span></td>
        <td><span class="num-cell">${Fmt.large(a.market_cap || 0)}</span></td>
        <td><canvas id="${sparkId}" width="80" height="28" class="spark-canvas"></canvas></td>
        <td>
          <button class="fav-btn ${isFav ? 'on' : ''}"
            onclick="event.stopPropagation();mktPage.toggleFav('${a.symbol}',this,'${a.name.replace(/'/g,"\\'")}')">
            ${isFav ? '⭐' : '☆'}
          </button>
        </td>
        <td>
          <button class="compare-col-btn ${window.quickCompare?.selected?.some(x=>x.symbol===a.symbol)?'on':''}" title="Add to compare"
            onclick="event.stopPropagation();mktPage.addCompare(${i})">⇄</button>
        </td>
      </tr>`;
    }).join('');

    // Draw sparklines after DOM is ready
    requestAnimationFrame(() => {
      assets.forEach((a, i) => {
        if (a.sparkline?.length) {
          Sparkline.draw(`spark_${this.tab}_${i}`, a.sparkline, (a.change_7d || 0) >= 0);
        }
      });
    });
  }

  toggleFav(symbol, btn, name) {
    const active = window.favoritesManager.toggle(symbol, { name, type: this.tab });
    btn.textContent = active ? '⭐' : '☆';
    btn.classList.toggle('on', active);
    this.renderKPI();
    this.renderSideFavorites();
  }

  // ── SIDEBAR ─────────────────────────────────────────────
  async loadFG() {
    window.loadFearGreed?.();
  }

  renderSideHeatmap() {
    const el = document.getElementById('sideHeatmap');
    if (!el) return;
    const assets = this.data.crypto || [];
    el.innerHTML = assets.map(a => {
      const pct   = a.change_24h || 0;
      const alpha = Math.min(0.85, 0.12 + Math.abs(pct) * 0.06);
      const bg    = pct >= 0 ? `rgba(0,200,83,${alpha})` : `rgba(246,36,89,${alpha})`;
      const color = pct >= 0 ? 'var(--green)' : 'var(--red)';
      return `<div class="hm-sm-cell" style="background:${bg}">
        <div class="hm-sm-sym">${a.symbol}</div>
        <div class="hm-sm-pct" style="color:${color}">${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%</div>
      </div>`;
    }).join('');
  }

  renderSideFavorites() {
    const el = document.getElementById('sideFavorites');
    if (!el) return;
    const favs = window.favoritesManager.getAll();
    if (!favs.length) {
      el.innerHTML = `<div style="color:var(--text-muted);font-family:var(--font-mono);font-size:.65rem;text-align:center;padding:12px 0">CLICK ☆ TO ADD</div>`;
      return;
    }
    const items = window.matchFavoritesToWatchlist(this.data);
    el.innerHTML = items.map(a => {
      const up = (a.change_24h || 0) >= 0;
      return `<div class="wl-item">
        <span class="wl-sym">${a.symbol}</span>
        <span class="wl-px">${Fmt.price(a.price)}</span>
        <span class="wl-chg" style="color:${up ? 'var(--green)' : 'var(--red)'}">${up ? '▲' : '▼'}${Math.abs(a.change_24h || 0).toFixed(2)}%</span>
      </div>`;
    }).join('') || `<div style="color:var(--text-muted);font-family:var(--font-mono);font-size:.65rem;text-align:center;padding:12px 0">STAR FROM MARKETS LIST</div>`;
  }

  renderSideMovers() {
    const el  = document.getElementById('sideMovers');
    if (!el) return;
    const all = [
      ...(this.data.crypto || []).map(a => ({...a, type:'Crypto'})),
      ...(this.data.stocks || []).map(a => ({...a, type:'Stock'})),
      ...(this.data.commodities || []).map(a => ({...a, type:'Commodity'})),
    ];
    const sorted = [...all].sort((a,b) => Math.abs(b.change_24h||0) - Math.abs(a.change_24h||0));
    el.innerHTML = sorted.slice(0, 6).map(a => {
      const up = (a.change_24h || 0) >= 0;
      return `<div class="wl-item">
        <span class="wl-sym">${a.symbol}</span>
        <span class="wl-px" style="color:var(--text-muted);font-size:.62rem">${a.type}</span>
        <span class="wl-chg" style="color:${up ? 'var(--green)' : 'var(--red)'}">${up ? '▲' : '▼'}${Math.abs(a.change_24h || 0).toFixed(2)}%</span>
      </div>`;
    }).join('');
  }

  // ── ASSET DETAIL + COMPARE ──────────────────────────────
  openDetail(index) {
    const a = this._displayAssets?.[index];
    if (a && window.AssetDetailModal) AssetDetailModal.open(a, this.tab);
  }

  addCompare(index) {
    const a = this._displayAssets?.[index];
    if (a) window.quickCompare?.toggle(a);
    this.renderTable();
  }

  // ── CHART MODAL (legacy) ─────────────────────────────────
  openChart(tab, index) {
    const a = (this.data[tab] || [])[index];
    if (!a) return;

    document.getElementById('chartTitle').textContent = `${a.symbol} — ${a.name.toUpperCase()}`;
    document.getElementById('chartSub').textContent   = `7-DAY PRICE HISTORY  |  LAST PRICE: ${Fmt.price(a.price)}  |  VOLUME: ${Fmt.large(a.volume)}`;

    const ctx   = document.getElementById('chartCanvas').getContext('2d');
    const color = (a.change_7d || 0) >= 0 ? '#00c853' : '#f62459';
    if (this.chart) this.chart.destroy();

    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: (a.sparkline || []).map((_, i) => i),
        datasets: [{
          data: a.sparkline || [],
          borderColor: color,
          borderWidth: 1.5,
          fill: true,
          backgroundColor: (a.change_7d || 0) >= 0 ? 'rgba(0,200,83,0.07)' : 'rgba(246,36,89,0.07)',
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 4,
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: { label: c => Fmt.price(c.raw) },
            backgroundColor: 'var(--bg-raised)',
            borderColor: 'var(--border-mid)',
            borderWidth: 1,
            titleColor: 'var(--amber)',
            bodyColor: 'var(--text-secondary)',
            titleFont: { family:'IBM Plex Mono', size:10 },
            bodyFont:  { family:'IBM Plex Mono', size:10 },
          }
        },
        scales: {
          y: {
            grid: { color:'rgba(255,255,255,0.04)' },
            ticks: { color:'var(--text-muted)', font:{family:'IBM Plex Mono',size:10}, callback: v => Fmt.price(v) },
          },
          x: { display: false }
        }
      }
    });

    document.getElementById('chartStats').innerHTML = [
      ['PRICE',     Fmt.price(a.price),                                              'var(--text-primary)'],
      ['24H CHANGE',`${(a.change_24h||0) >= 0?'+':''}${a.change_24h||0}%`,          (a.change_24h||0) >= 0 ? 'var(--green)' : 'var(--red)'],
      ['7D CHANGE', `${(a.change_7d ||0) >= 0?'+':''}${a.change_7d ||0}%`,          (a.change_7d ||0) >= 0 ? 'var(--green)' : 'var(--red)'],
      ['VOLUME',    Fmt.large(a.volume),                                             'var(--text-primary)'],
      ['MKT CAP',   Fmt.large(a.market_cap || 0),                                   'var(--text-primary)'],
      ['SYMBOL',    a.symbol,                                                        'var(--amber)'],
    ].map(([l, v, c]) => `
      <div class="cstat">
        <div class="cstat-lbl">${l}</div>
        <div class="cstat-val" style="color:${c}">${v}</div>
      </div>`).join('');

    document.getElementById('chartOverlay').classList.add('open');
  }

  closeChart() { document.getElementById('chartOverlay').classList.remove('open'); }

  // ── CSV EXPORT ──────────────────────────────────────────
  exportCSV() {
    const assets = this.data[this.tab] || [];
    const rows   = [
      ['#','Symbol','Name','Price','24h%','7d%','Volume','Market Cap'],
      ...assets.map((a,i) => [i+1, a.symbol, a.name, a.price, a.change_24h, a.change_7d, a.volume, a.market_cap||''])
    ];
    const csv  = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF'+csv], { type:'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `${this.tab}_${new Date().toISOString().split('T')[0]}.csv`; a.click();
    URL.revokeObjectURL(url);
    Toast.show(`EXPORTED ${this.tab.toUpperCase()}.CSV`, 'success');
  }
}

window.mktPage = new MarketsPage();