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

  // ── DATA UNAVAILABLE STATE ─────────────────────────────
  _renderUnavailable() {
    // Table body — trivia game
    const body = document.getElementById('mktsBody');
    if (body) {
      body.innerHTML = `
        <tr>
          <td colspan="10" style="padding:0">
            <div id="mp-trivia-root" style="
              padding: 36px 24px 28px;
              display: flex;
              flex-direction: column;
              align-items: center;
              gap: 0;
            "></div>
          </td>
        </tr>`;
      this._triviaInit();
    }

    // KPI strip — gray out all values
    const strip = document.getElementById('kpiStrip');
    if (strip) strip.innerHTML = `
      <div class="kpi-cell">
        <div class="kc-label">TOTAL ASSETS</div>
        <div class="kc-value" style="color:var(--text-muted)">—</div>
        <div class="kc-sub" style="color:var(--text-muted)">3 CATEGORIES</div>
      </div>
      <div class="kpi-cell">
        <div class="kc-label">GAINERS 24H</div>
        <div class="kc-value" style="color:var(--text-muted)">—</div>
        <div class="kc-sub" style="color:var(--text-muted)">N/A</div>
      </div>
      <div class="kpi-cell">
        <div class="kc-label">LOSERS 24H</div>
        <div class="kc-value" style="color:var(--text-muted)">—</div>
        <div class="kc-sub" style="color:var(--text-muted)">N/A</div>
      </div>
      <div class="kpi-cell">
        <div class="kc-label">BTC PRICE</div>
        <div class="kc-value" style="color:var(--text-muted)">—</div>
        <div class="kc-sub" style="color:var(--text-muted)">FEED DOWN</div>
      </div>
      <div class="kpi-cell">
        <div class="kc-label">FAVORITES</div>
        <div class="kc-value" style="color:var(--amber)">${window.favoritesManager?.count() ?? '—'}</div>
        <div class="kc-sub" style="color:var(--amber)">⭐ SAVED</div>
      </div>`;

    // Side panels
    const sideHeatmap = document.getElementById('sideHeatmap');
    if (sideHeatmap) sideHeatmap.innerHTML = `
      <div style="color:var(--text-muted);font-family:var(--font-mono);font-size:.62rem;text-align:center;padding:12px 0">
        NO DATA
      </div>`;

    const sideMovers = document.getElementById('sideMovers');
    if (sideMovers) sideMovers.innerHTML = `
      <div style="color:var(--text-muted);font-family:var(--font-mono);font-size:.62rem;text-align:center;padding:12px 0">
        NO DATA
      </div>`;

    // Status bar timestamp
    const el = document.getElementById('lastUpdate');
    if (el) el.textContent = 'FEED OFFLINE';
  }

  // ── TRIVIA GAME ────────────────────────────────────────
  _triviaInit() {
    this._trivia = {
      score: 0,
      streak: 0,
      total: 0,
      answered: false,
      pool: this._triviaShuffled(),
      idx: 0,
      retryTimer: null,
    };
    this._triviaRender();
    // Keep retrying the API every 15s in background
    this._trivia.retryTimer = setInterval(async () => {
      try {
        this.data = await window.apiClient.get('/api/watchlist', 0);
        clearInterval(this._trivia.retryTimer);
        window.cacheWatchlistData?.(this.data);
        this._triviaSuccess();
      } catch(e) {}
    }, 15000);
  }

  _triviaSuccess() {
    const root = document.getElementById('mp-trivia-root');
    if (root) root.innerHTML = `
      <div style="text-align:center;font-family:var(--font-mono)">
        <div style="color:var(--green);font-size:.7rem;letter-spacing:.12em;margin-bottom:6px">● FEED RESTORED</div>
        <div style="color:var(--text-muted);font-size:.65rem;margin-bottom:16px">Live prices loading…</div>
        <div style="color:var(--amber);font-size:.85rem">FINAL SCORE: ${this._trivia?.score ?? 0} / ${this._trivia?.total ?? 0}</div>
      </div>`;
    setTimeout(() => {
      this.renderKPI();
      this.renderTable();
      this.renderSideHeatmap();
      this.renderSideFavorites();
      this.renderSideMovers();
      const el = document.getElementById('lastUpdate');
      if (el) el.textContent = 'UPD ' + new Date().toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit', hour12:false });
      window.refreshFavoritesUI?.(this.data);
    }, 1800);
  }

  _triviaShuffled() {
    const qs = [
      { q: 'What does "BTC" stand for?', opts: ['Bitcoin','Bitcash','Blockchain Token Coin','Binary Trade Coin'], a: 0 },
      { q: 'In what year was Bitcoin created?', opts: ['2007','2008','2009','2011'], a: 2 },
      { q: 'What is the maximum supply of Bitcoin?', opts: ['18 million','21 million','100 million','Unlimited'], a: 1 },
      { q: 'What is a "bull market"?', opts: ['Prices falling rapidly','Prices rising over time','A sideways market','High volatility period'], a: 1 },
      { q: 'What does "DeFi" stand for?', opts: ['Defined Finance','Decentralized Finance','Digital Finance','Derivative Finance'], a: 1 },
      { q: 'What is the S&P 500?', opts: ['A bond index','A commodities index','An index of 500 large US stocks','A crypto index'], a: 2 },
      { q: 'What is a "short" position?', opts: ['Buying an asset expecting it to rise','Betting an asset will fall in price','Holding for under a week','A small trade'], a: 1 },
      { q: 'What does ETH stand for?', opts: ['Ethereum','Ethanol','Electronic Trade Hub','None of these'], a: 0 },
      { q: 'What is "market cap"?', opts: ['Daily trading volume','Maximum price of an asset','Total value of all shares/coins','The cap on daily trades'], a: 2 },
      { q: 'What does P/E ratio stand for?', opts: ['Profit/Equity','Price/Earnings','Portfolio/Expense','Price/Exchange'], a: 1 },
      { q: 'What is a "halving" in Bitcoin?', opts: ['BTC price drops 50%','Mining reward is cut in half','Half the network goes offline','A 50% trading fee'], a: 1 },
      { q: 'What is "liquidity" in finance?', opts: ['How fast you can buy/sell without affecting price','The amount of debt a company holds','A company\'s cash on hand','Interest earned on deposits'], a: 0 },
      { q: 'What does "HODL" mean in crypto culture?', opts: ['A trading strategy','Hold On for Dear Life','A type of wallet','High Order Distributed Ledger'], a: 1 },
      { q: 'What is a "bear market"?', opts: ['A market for commodities','Prices rising 10% or more','A prolonged price decline of 20%+','A sideways-moving market'], a: 2 },
      { q: 'What is Ethereum\'s native token called?', opts: ['ETH','GAS','ETHER','Both ETH and ETHER'], a: 3 },
      { q: 'What does "ROI" stand for?', opts: ['Rate of Investment','Return on Investment','Risk of Inflation','Revenue over Income'], a: 1 },
      { q: 'What is a "smart contract"?', opts: ['A legal document signed digitally','Self-executing code on a blockchain','A contract between two brokers','An AI-written agreement'], a: 1 },
      { q: 'What is "inflation"?', opts: ['Increase in asset prices only','A rise in the general price level over time','A fall in interest rates','Increase in money supply only'], a: 1 },
      { q: 'What does "FOMO" mean in trading?', opts: ['Fear of Missing Out','Future Order Market Operation','Fixed Open Market Offering','Fast Order Management Option'], a: 0 },
      { q: 'What is a "stablecoin"?', opts: ['A coin that never changes','A crypto pegged to a stable asset like USD','A government-issued digital currency','A coin with low volatility by algorithm'], a: 1 },
      { q: 'What is the "Fear & Greed Index"?', opts: ['A measure of market volatility','A sentiment indicator (0=Fear, 100=Greed)','An index of risky assets','A bond yield tracker'], a: 1 },
      { q: 'What is "market order"?', opts: ['A buy/sell at best available current price','A scheduled trade','A trade at a specific price','An order to hold'], a: 0 },
      { q: 'What does "ATH" stand for?', opts: ['Annual Trading High','All Time High','Average Trading History','Asset To Hold'], a: 1 },
      { q: 'What is "gas" in Ethereum?', opts: ['The ETH token itself','A fee paid to execute transactions','A type of validator node','A layer-2 solution'], a: 1 },
      { q: 'What is a "blockchain"?', opts: ['A type of encryption','A distributed, immutable ledger of transactions','A centralized database','A digital wallet'], a: 1 },
    ];
    // Fisher-Yates shuffle
    for (let i = qs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [qs[i], qs[j]] = [qs[j], qs[i]];
    }
    return qs;
  }

  _triviaRender() {
    const root = document.getElementById('mp-trivia-root');
    if (!root) return;
    const t = this._trivia;
    const q = t.pool[t.idx % t.pool.length];
    const streakLabel = t.streak >= 3 ? ` 🔥 ${t.streak} STREAK` : '';

    root.innerHTML = `
      <style>
        .tv-badge { display:inline-block; background:rgba(246,36,89,.12); border:1px solid rgba(246,36,89,.35); color:#f62459; font-family:var(--font-mono); font-size:.58rem; letter-spacing:.12em; padding:3px 10px; border-radius:2px; margin-bottom:18px; }
        .tv-meta { font-family:var(--font-mono); font-size:.6rem; color:var(--text-muted); margin-bottom:4px; letter-spacing:.08em; }
        .tv-score { font-family:var(--font-mono); font-size:.62rem; color:var(--amber); letter-spacing:.1em; margin-bottom:20px; }
        .tv-q { font-family:var(--font-mono); font-size:.82rem; color:var(--text-primary); text-align:center; max-width:540px; line-height:1.6; margin-bottom:24px; letter-spacing:.01em; }
        .tv-opts { display:grid; grid-template-columns:1fr 1fr; gap:10px; width:100%; max-width:540px; margin-bottom:20px; }
        .tv-opt { background:transparent; border:1px solid var(--border-mid); color:var(--text-secondary); font-family:var(--font-mono); font-size:.68rem; padding:10px 14px; cursor:pointer; border-radius:3px; text-align:left; transition:border-color .15s, color .15s, background .15s; letter-spacing:.02em; }
        .tv-opt:hover:not(:disabled) { border-color:var(--amber); color:var(--amber); }
        .tv-opt.correct { border-color:var(--green) !important; color:var(--green) !important; background:rgba(0,200,83,.08) !important; }
        .tv-opt.wrong   { border-color:var(--red)   !important; color:var(--red)   !important; background:rgba(246,36,89,.08) !important; }
        .tv-opt:disabled { cursor:default; }
        .tv-explain { font-family:var(--font-mono); font-size:.64rem; color:var(--text-muted); text-align:center; max-width:480px; min-height:18px; margin-bottom:18px; line-height:1.5; }
        .tv-next { background:transparent; border:1px solid var(--amber); color:var(--amber); font-family:var(--font-mono); font-size:.62rem; letter-spacing:.1em; padding:7px 22px; cursor:pointer; border-radius:2px; opacity:0; pointer-events:none; transition:opacity .2s; }
        .tv-next.show { opacity:1; pointer-events:all; }
        .tv-retry { background:transparent; border:1px solid var(--border-mid); color:var(--text-muted); font-family:var(--font-mono); font-size:.58rem; letter-spacing:.08em; padding:5px 14px; cursor:pointer; border-radius:2px; margin-top:6px; }
        .tv-progress { width:100%; max-width:540px; height:2px; background:var(--border-mid); border-radius:1px; margin-bottom:20px; }
        .tv-progress-fill { height:100%; background:var(--amber); border-radius:1px; transition:width .4s ease; }
      </style>

      <div class="tv-badge">● LIVE DATA UNAVAILABLE — FEED RECONNECTING</div>
      <div class="tv-meta">MARKETPULSE TERMINAL QUIZ · Q${t.idx + 1} OF ${t.pool.length}</div>
      <div class="tv-score">SCORE: ${t.score} / ${t.total}${streakLabel}</div>

      <div class="tv-progress">
        <div class="tv-progress-fill" style="width:${(t.idx / t.pool.length) * 100}%"></div>
      </div>

      <div class="tv-q">${q.q}</div>

      <div class="tv-opts">
        ${q.opts.map((opt, i) => `
          <button class="tv-opt" id="tv-opt-${i}" onclick="mktPage._triviaAnswer(${i})">
            <span style="color:var(--amber);margin-right:6px">${['A','B','C','D'][i]}.</span>${opt}
          </button>`).join('')}
      </div>

      <div class="tv-explain" id="tv-explain"></div>

      <button class="tv-next" id="tv-next" onclick="mktPage._triviaNext()">NEXT QUESTION →</button>
      <button class="tv-retry" onclick="mktPage.reload()">↻ RETRY FEED NOW</button>
    `;
  }

  _triviaAnswer(chosen) {
    const t = this._trivia;
    if (t.answered) return;
    t.answered = true;
    t.total++;

    const q = t.pool[t.idx % t.pool.length];
    const correct = q.a;

    document.querySelectorAll('.tv-opt').forEach((btn, i) => {
      btn.disabled = true;
      if (i === correct) btn.classList.add('correct');
      else if (i === chosen) btn.classList.add('wrong');
    });

    const explainEl = document.getElementById('tv-explain');
    if (chosen === correct) {
      t.score++;
      t.streak++;
      if (explainEl) explainEl.innerHTML = `<span style="color:var(--green)">✓ CORRECT${t.streak >= 3 ? ` — ${t.streak} IN A ROW 🔥` : ''}</span>`;
    } else {
      t.streak = 0;
      const correctText = q.opts[correct];
      if (explainEl) explainEl.innerHTML = `<span style="color:var(--red)">✗ INCORRECT</span> <span style="color:var(--text-muted)">— Answer: <span style="color:var(--text-primary)">${correctText}</span></span>`;
    }

    const nextBtn = document.getElementById('tv-next');
    if (nextBtn) {
      const isLast = (t.idx + 1) >= t.pool.length;
      nextBtn.textContent = isLast ? 'RESTART QUIZ →' : 'NEXT QUESTION →';
      nextBtn.classList.add('show');
    }
  }

  _triviaNext() {
    const t = this._trivia;
    t.idx++;
    if (t.idx >= t.pool.length) {
      t.idx = 0;
      t.pool = this._triviaShuffled(); // re-shuffle on loop
    }
    t.answered = false;
    this._triviaRender();
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
      body.innerHTML = `<tr><td colspan="10" style="text-align:center;padding:40px;color:var(--text-muted);font-family:var(--font-mono);font-size:.72rem">NO ASSETS FOUND</td></tr>`;
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