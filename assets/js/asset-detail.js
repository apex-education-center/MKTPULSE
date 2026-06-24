// MarketPulse — asset detail panel (chart, news, calendar, videos)
class AssetDetailModal {
  static _chart = null;
  static _asset = null;

  static _keywords(sym) {
    const map = {
      BTC: ['bitcoin', 'btc'], ETH: ['ethereum', 'eth'], SOL: ['solana'],
      NVDA: ['nvidia', 'nvda'], AAPL: ['apple', 'aapl'], TSLA: ['tesla'],
      MSFT: ['microsoft'], AMZN: ['amazon'], GOOGL: ['google', 'alphabet'],
      GC: ['gold'], CL: ['crude oil', 'oil'], SI: ['silver'],
    };
    return map[sym] || [sym.toLowerCase()];
  }

  static async open(asset, category = 'crypto') {
    if (!asset) return;
    this._asset = { ...asset, category };
    let el = document.getElementById('assetDetailModal');
    if (!el) {
      el = document.createElement('div');
      el.id = 'assetDetailModal';
      el.className = 'modal-overlay';
      el.innerHTML = `
        <div class="modal-box asset-detail-box">
          <div class="modal-head">
            <div>
              <div class="modal-title" id="adTitle">—</div>
              <div id="adSub" style="font-size:.62rem;color:var(--text-muted);margin-top:4px"></div>
            </div>
            <div style="display:flex;gap:8px;align-items:center">
              <button class="btn-mp btn-mp-ghost" style="font-size:.65rem;padding:4px 10px" id="adCompareBtn">Compare</button>
              <button class="modal-close" onclick="AssetDetailModal.close()">✕</button>
            </div>
          </div>
          <div class="ad-tabs">
            <button class="ad-tab active" data-tab="overview" onclick="AssetDetailModal.tab('overview')">Overview</button>
            <button class="ad-tab" data-tab="news" onclick="AssetDetailModal.tab('news')">News</button>
            <button class="ad-tab" data-tab="calendar" onclick="AssetDetailModal.tab('calendar')">Calendar</button>
            <button class="ad-tab" data-tab="videos" onclick="AssetDetailModal.tab('videos')">Videos</button>
          </div>
          <div class="modal-body" id="adBody"></div>
        </div>`;
      el.onclick = e => { if (e.target === el) this.close(); };
      document.body.appendChild(el);
    }
    document.getElementById('adTitle').textContent = `${asset.symbol} — ${asset.name}`;
    document.getElementById('adSub').textContent = `${Fmt.price(asset.price)} · 24h ${Fmt.pct(asset.change_24h, false)} · 7d ${Fmt.pct(asset.change_7d, false)}`;
    document.getElementById('adCompareBtn').onclick = () => {
      window.quickCompare?.toggle(asset);
      Toast.show(`Added ${asset.symbol} to compare`, 'info');
    };
    el.classList.add('open');
    this.tab('overview');
  }

  static close() {
    document.getElementById('assetDetailModal')?.classList.remove('open');
    if (this._chart) { this._chart.destroy(); this._chart = null; }
  }

  static tab(name) {
    document.querySelectorAll('.ad-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === name));
    const body = document.getElementById('adBody');
    if (!body || !this._asset) return;
    if (name === 'overview') this._renderOverview(body);
    else if (name === 'news') this._loadNews(body);
    else if (name === 'calendar') this._loadCalendar(body);
    else if (name === 'videos') this._renderVideos(body);
  }

  static _renderOverview(body) {
    const a = this._asset;
    body.innerHTML = `
      <div class="modal-stats" style="margin-bottom:16px">
        <div class="mstat"><div class="ms-label">PRICE</div><div class="ms-val">${Fmt.price(a.price)}</div></div>
        <div class="mstat"><div class="ms-label">24H</div><div class="ms-val" style="color:${(a.change_24h||0)>=0?'var(--green)':'var(--red)'}">${Fmt.pct(a.change_24h,false)}</div></div>
        <div class="mstat"><div class="ms-label">7D</div><div class="ms-val" style="color:${(a.change_7d||0)>=0?'var(--green)':'var(--red)'}">${Fmt.pct(a.change_7d,false)}</div></div>
        <div class="mstat"><div class="ms-label">VOLUME</div><div class="ms-val">${Fmt.large(a.volume)}</div></div>
      </div>
      <canvas id="adChart" height="200"></canvas>`;
    const ctx = document.getElementById('adChart')?.getContext('2d');
    if (!ctx) return;
    const up = (a.change_7d || 0) >= 0;
    const color = up ? '#00c853' : '#f62459';
    const css = getComputedStyle(document.documentElement);
    const tickColor = document.documentElement.getAttribute('data-theme') === 'light'
      ? (css.getPropertyValue('--text-secondary').trim() || '#4a5568')
      : '#e2e8f0';
    const gridColor = document.documentElement.getAttribute('data-theme') === 'light'
      ? 'rgba(0,0,0,.06)'
      : 'rgba(255,255,255,.04)';
    if (this._chart) this._chart.destroy();
    this._chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: (a.sparkline || []).map((_, i) => i),
        datasets: [{ data: a.sparkline || [], borderColor: color, borderWidth: 1.5, fill: true,
          backgroundColor: up ? 'rgba(0,200,83,.07)' : 'rgba(246,36,89,.07)', tension: 0.4, pointRadius: 0 }],
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => Fmt.price(c.raw) } } },
        scales: {
          y: { ticks: { callback: v => Fmt.price(v), color: tickColor, font: { family: 'IBM Plex Mono', size: 10 } }, grid: { color: gridColor } },
          x: { display: false },
        },
      },
    });
  }

  static async _loadNews(body) {
    body.innerHTML = '<div style="color:var(--text-muted);font-size:.75rem;padding:20px;text-align:center">Loading news…</div>';
    const q = this._keywords(this._asset.symbol)[0];
    try {
      const articles = await window.apiClient.get(`/api/news?q=${encodeURIComponent(q)}&period=week`, 10 * 60 * 1000);
      if (!articles.length) {
        body.innerHTML = '<div style="color:var(--text-muted);padding:20px;text-align:center">No recent news</div>';
        return;
      }
      body.innerHTML = articles.slice(0, 8).map(a => `
        <a href="${a.url}" target="_blank" rel="noopener" class="ad-news-item">
          <div class="ad-news-title">${a.title}</div>
          <div class="ad-news-meta">${a.source || ''} · ${a.published_at ? new Date(a.published_at).toLocaleDateString() : ''}</div>
        </a>`).join('');
    } catch (e) {
      body.innerHTML = '<div style="color:var(--red);padding:20px">Could not load news</div>';
    }
  }

  static async _loadCalendar(body) {
    body.innerHTML = '<div style="color:var(--text-muted);font-size:.75rem;padding:20px;text-align:center">Loading events…</div>';
    const keys = this._keywords(this._asset.symbol);
    try {
      const events = await window.apiClient.get('/api/calendar', 30 * 60 * 1000);
      const related = events.filter(e => {
        const text = `${e.event || ''} ${e.country || ''}`.toLowerCase();
        return keys.some(k => text.includes(k)) || (this._asset.symbol === 'BTC' && /fed|cpi|inflation|rate/i.test(text));
      }).slice(0, 10);
      if (!related.length) {
        body.innerHTML = '<div style="color:var(--text-muted);padding:20px;text-align:center">No related macro events in range</div>';
        return;
      }
      body.innerHTML = related.map(e => `
        <div class="ad-cal-item">
          <span class="ad-cal-date">${e.date || ''}</span>
          <span class="ad-cal-event">${e.event}</span>
          <span class="ad-cal-imp imp-${e.importance || 'low'}">${(e.importance || '').toUpperCase()}</span>
        </div>`).join('');
    } catch (e) {
      body.innerHTML = '<div style="color:var(--red);padding:20px">Could not load calendar</div>';
    }
  }

  static _renderVideos(body) {
    const q = this._keywords(this._asset.symbol)[0];
    body.innerHTML = `
      <p style="font-size:.78rem;color:var(--text-secondary);margin-bottom:14px">Finance videos about <strong>${this._asset.symbol}</strong></p>
      <a class="btn-mp btn-mp-primary" href="youtube.html?q=${encodeURIComponent(q)}" style="width:100%;text-align:center;display:block;margin-bottom:10px">
        Search videos on Videos page →
      </a>
      <div style="font-size:.7rem;color:var(--text-muted)">Topics: ${this._keywords(this._asset.symbol).join(', ')}</div>`;
  }
}

window.AssetDetailModal = AssetDetailModal;
