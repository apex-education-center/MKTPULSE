// ═══════════════════════════════════════════════════════
// MARKETPULSE — MARKETS PAGE LOGIC
// ═══════════════════════════════════════════════════════

class MarketsPage {
  constructor() {
    this.data       = {};
    this.currentTab = 'crypto';
    this.sortKey    = 'rank';
    this.sortAsc    = true;
    this.query      = '';
    this.modalChart = null;
    this.init();
  }

  async init() {
    await this.reload();
    setInterval(() => this.reload(), 5 * 60 * 1000);
  }

  async reload() {
    try {
      this.data = await window.apiClient.get('/api/watchlist', 0);
      this.renderSummary();
      this.renderTable();
      Toast.show('Markets updated', 'success', 2000);
    } catch(e) {
      document.getElementById('marketTableBody').innerHTML =
        `<tr><td colspan="9" class="text-center py-5" style="color:var(--text3)">
          ⚠ Backend not running.<br><small>Run: <code>uvicorn main:app --port 8000</code></small>
        </td></tr>`;
    }
  }

  renderSummary() {
    const crypto = this.data.crypto || [];
    const stocks = this.data.stocks || [];
    const commod = this.data.commodities || [];
    const all    = [...crypto, ...stocks, ...commod];
    const gainers = all.filter(a => a.change_24h > 0).length;
    const losers  = all.filter(a => a.change_24h < 0).length;
    const btc     = crypto.find(c => c.symbol === 'BTC');

    document.getElementById('summaryCards').innerHTML = `
      <div class="summary-card">
        <div class="lbl">Total Assets</div>
        <div class="val">${all.length}</div>
        <div class="sub">Across 3 categories</div>
      </div>
      <div class="summary-card">
        <div class="lbl">Gainers / Losers</div>
        <div class="val" style="color:var(--green)">${gainers}
          <span style="color:var(--text3);font-size:1rem">/</span>
          <span style="color:var(--red)">${losers}</span>
        </div>
        <div class="sub">24h performance</div>
      </div>
      <div class="summary-card">
        <div class="lbl">Bitcoin Price</div>
        <div class="val">${btc ? Fmt.price(btc.price) : '—'}</div>
        <div class="sub">${btc ? Fmt.pct(btc.change_24h) : ''} 24h</div>
      </div>
      <div class="summary-card">
        <div class="lbl">Favorites</div>
        <div class="val">${window.favoritesManager.count()} <span style="color:var(--accent);font-size:1.2rem">⭐</span></div>
        <div class="sub">Saved assets</div>
      </div>`;
  }

  renderTable() {
    let assets = [...(this.data[this.currentTab] || [])];

    if (this.query) {
      const q = this.query.toLowerCase();
      assets = assets.filter(a =>
        a.name.toLowerCase().includes(q) || a.symbol.toLowerCase().includes(q)
      );
    }

    assets.sort((a, b) => {
      const av = a[this.sortKey] ?? 0;
      const bv = b[this.sortKey] ?? 0;
      return this.sortAsc ? av - bv : bv - av;
    });

    const tbody = document.getElementById('marketTableBody');

    if (!assets.length) {
      tbody.innerHTML = `<tr><td colspan="9" class="text-center py-5" style="color:var(--text3)">No assets found.</td></tr>`;
      return;
    }

    tbody.innerHTML = assets.map((a, i) => {
      const sparkId  = `spark-${this.currentTab}-${i}`;
      const iconHtml = a.image
        ? `<img src="${a.image}" alt="${a.symbol}">`
        : `<span>${a.symbol.substring(0, 3)}</span>`;
      const isFav = window.favoritesManager.has(a.symbol);
      return `
        <tr class="asset-row" onclick="marketsPage.openModal('${this.currentTab}', ${i})">
          <td class="rank-cell">${i + 1}</td>
          <td>
            <div class="asset-cell">
              <div class="asset-ico">${iconHtml}</div>
              <div class="asset-lbl">
                <strong>${a.name}</strong>
                <span>${a.symbol}</span>
              </div>
            </div>
          </td>
          <td class="price-cell">${Fmt.price(a.price)}</td>
          <td>${Fmt.pct(a.change_24h)}</td>
          <td>${Fmt.pct(a.change_7d)}</td>
          <td class="vol-cell">${Fmt.large(a.volume)}</td>
          <td class="vol-cell">${Fmt.large(a.market_cap || 0)}</td>
          <td class="spark-cell">
            <canvas id="${sparkId}" width="110" height="36"></canvas>
          </td>
          <td>
            <button class="fav-btn ${isFav ? 'active' : ''}"
              onclick="event.stopPropagation();marketsPage.toggleFav('${a.symbol}',this,'${a.name}')">
              ${isFav ? '⭐' : '☆'}
            </button>
          </td>
        </tr>`;
    }).join('');

    requestAnimationFrame(() => {
      assets.forEach((a, i) => {
        Sparkline.draw(`spark-${this.currentTab}-${i}`, a.sparkline, a.change_7d >= 0);
      });
    });
  }

  setTab(tab, el) {
    document.querySelectorAll('.filter-chips .chip').forEach(c => c.classList.remove('active'));
    el.classList.add('active');
    this.currentTab = tab;
    this.renderTable();
  }

  sort(key) {
    if (this.sortKey === key) this.sortAsc = !this.sortAsc;
    else { this.sortKey = key; this.sortAsc = false; }
    this.renderTable();
  }

  search(q) { this.query = q; this.renderTable(); }

  toggleFav(symbol, btn, name) {
    const active = window.favoritesManager.toggle(symbol, { name });
    btn.textContent = active ? '⭐' : '☆';
    btn.classList.toggle('active', active);
    this.renderSummary();
  }

  openModal(tab, index) {
    const a = (this.data[tab] || [])[index];
    if (!a) return;

    document.getElementById('modalName').textContent = `${a.name} (${a.symbol})`;
    document.getElementById('modalSub').textContent  = `7-day price history · ${Fmt.price(a.price)}`;

    const color = a.change_7d >= 0 ? '#20e08a' : '#ff3d5a';
    const ctx   = document.getElementById('modalChart').getContext('2d');
    if (this.modalChart) this.modalChart.destroy();

    this.modalChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: (a.sparkline || []).map((_, i) => i),
        datasets: [{
          data: a.sparkline || [],
          borderColor: color,
          borderWidth: 2,
          fill: true,
          backgroundColor: a.change_7d >= 0 ? 'rgba(32,224,138,0.07)' : 'rgba(255,61,90,0.07)',
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 5,
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#5a6478', font: { family: 'DM Mono', size: 11 } } },
          x: { display: false }
        }
      }
    });

    document.getElementById('modalStats').innerHTML = `
      <div class="modal-stat"><div class="lbl">Price</div><div class="val">${Fmt.price(a.price)}</div></div>
      <div class="modal-stat"><div class="lbl">24h Change</div>
        <div class="val" style="color:${a.change_24h >= 0 ? 'var(--green)' : 'var(--red)'}">
          ${a.change_24h >= 0 ? '+' : ''}${a.change_24h}%
        </div>
      </div>
      <div class="modal-stat"><div class="lbl">7d Change</div>
        <div class="val" style="color:${a.change_7d >= 0 ? 'var(--green)' : 'var(--red)'}">
          ${a.change_7d >= 0 ? '+' : ''}${a.change_7d}%
        </div>
      </div>
      ${a.market_cap ? `<div class="modal-stat"><div class="lbl">Market Cap</div><div class="val">${Fmt.large(a.market_cap)}</div></div>` : ''}
      <div class="modal-stat"><div class="lbl">Volume 24h</div><div class="val">${Fmt.large(a.volume)}</div></div>
      <div class="modal-stat"><div class="lbl">Symbol</div><div class="val">${a.symbol}</div></div>`;

    document.getElementById('chartOverlay').classList.add('open');
  }

  closeModal() {
    document.getElementById('chartOverlay').classList.remove('open');
  }
}

window.marketsPage = new MarketsPage();
