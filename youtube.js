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
      this.renderKPI();
      this.renderTable();
      this.renderSideHeatmap();
      this.renderSideFavorites();
      this.renderSideMovers();
      const el = document.getElementById('lastUpdate');
      if (el) el.textContent = 'UPD ' + new Date().toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit', hour12:false });
    } catch(e) {
      const body = document.getElementById('mktsBody');
      if (body) body.innerHTML = `<tr><td colspan="9" style="text-align:center;padding:48px;color:var(--text-muted);font-family:var(--font-mono);font-size:.72rem">⚠ BACKEND OFFLINE<br><span style="font-size:.6rem;margin-top:6px;display:block">Run: uvicorn main:app --port 8000</span></td></tr>`;
    }
    if (btn) btn.innerHTML = '<i class="bi bi-arrow-clockwise me-1"></i>REFRESH';
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

      return `<tr class="mrow" onclick="mktPage.openChart('${this.tab}',${i})">
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
    const active = window.favoritesManager.toggle(symbol, { name });
    btn.textContent = active ? '⭐' : '☆';
    btn.classList.toggle('on', active);
    this.renderKPI();
    this.renderSideFavorites();
    // Refresh status bar watchlist on all pages via shared function
    if (window.refreshSBWatchlist) window.refreshSBWatchlist();
  }

  // ── SIDEBAR ─────────────────────────────────────────────
  async loadFG() {
    try {
      const data  = await window.apiClient.get('/api/fear-greed', 60*60*1000);
      const cur   = data.current || {};
      const val   = parseInt(cur.value || 50);
      const label = cur.value_classification || 'Neutral';
      const colors = {
        'Extreme Fear':'var(--red)', 'Fear':'#ff8f00',
        'Neutral':'var(--amber)', 'Greed':'#69f0ae', 'Extreme Greed':'var(--green)'
      };
      const color = colors[label] || 'var(--amber)';
      const vEl=document.getElementById('fgVal'), lEl=document.getElementById('fgLabel'), iEl=document.getElementById('fgInd');
      if (vEl) { vEl.textContent = val; vEl.style.color = color; }
      if (lEl) { lEl.textContent = label.toUpperCase(); lEl.style.color = color; }
      if (iEl) iEl.style.left = `${val}%`;
    } catch(e) {}
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
    const el   = document.getElementById('sideFavorites');
    if (!el) return;
    const favs = window.favoritesManager.getAll();
    if (!favs.length) {
      el.innerHTML = `<div style="color:var(--text-muted);font-family:var(--font-mono);font-size:.65rem;text-align:center;padding:12px 0">CLICK ☆ TO ADD</div>`;
      return;
    }
    const all = [
      ...(this.data.crypto || []),
      ...(this.data.stocks || []),
      ...(this.data.commodities || []),
    ];
    el.innerHTML = favs.map(f => {
      const asset = all.find(a => a.symbol === f.id);
      if (!asset) return '';
      const up = (asset.change_24h || 0) >= 0;
      return `<div class="wl-item">
        <span class="wl-sym">${asset.symbol}</span>
        <span class="wl-px">${Fmt.price(asset.price)}</span>
        <span class="wl-chg" style="color:${up ? 'var(--green)' : 'var(--red)'}">${up ? '▲' : '▼'}${Math.abs(asset.change_24h || 0).toFixed(2)}%</span>
      </div>`;
    }).filter(Boolean).join('');
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

  // ── CHART MODAL ─────────────────────────────────────────
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
