// ═══════════════════════════════════════════════════════
// MARKETPULSE — MARKETS PAGE v6 (Bloomberg Terminal)
// ═══════════════════════════════════════════════════════
class MarketsPage {
  constructor() {
    this.data = {}; this.tab = 'crypto'; this.sortKey = 'rank'; this.sortAsc = true;
    this.query = ''; this.modalChart = null;
    this.init();
  }
  async init() { await this.reload(); setInterval(()=>this.reload(), 5*60*1000); this.loadFG(); }

  async reload() {
    try {
      this.data = await window.apiClient.get('/api/watchlist', 0);
      this.renderKPI(); this.renderTable(); this.renderSideHeatmap();
      this.renderSideFavorites(); this.renderSideStats();
      const el = document.getElementById('mktUpdateTime');
      if (el) el.textContent = `UPDATED ${new Date().toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit',hour12:false})}`;
    } catch(e) {
      document.getElementById('mktBody').innerHTML =
        `<tr><td colspan="9" style="text-align:center;padding:40px;color:var(--text3);font-family:var(--font-mono);font-size:.72rem">⚠ BACKEND OFFLINE — RUN: uvicorn main:app --port 8000</td></tr>`;
    }
  }

  renderKPI() {
    const all = [...(this.data.crypto||[]),...(this.data.stocks||[]),...(this.data.commodities||[])];
    const gainers = all.filter(a=>a.change_24h>0).length;
    const losers  = all.filter(a=>a.change_24h<0).length;
    const btc     = this.data.crypto?.find(c=>c.symbol==='BTC');
    document.getElementById('kpiStrip').innerHTML = `
      <div class="kpi-strip-cell"><div class="lbl">TOTAL ASSETS</div><div class="val">${all.length}</div><div class="sub" style="color:var(--text3)">ACROSS 3 CATEGORIES</div></div>
      <div class="kpi-strip-cell"><div class="lbl">GAINERS</div><div class="val change-up">${gainers}</div><div class="sub" style="color:var(--green)">24H POSITIVE</div></div>
      <div class="kpi-strip-cell"><div class="lbl">LOSERS</div><div class="val change-down">${losers}</div><div class="sub" style="color:var(--red)">24H NEGATIVE</div></div>
      <div class="kpi-strip-cell"><div class="lbl">BTC PRICE</div><div class="val">${btc?Fmt.price(btc.price):'—'}</div><div class="sub">${btc?Fmt.pct(btc.change_24h):''}</div></div>
      <div class="kpi-strip-cell"><div class="lbl">FAVORITES</div><div class="val" style="color:var(--amber)">${window.favoritesManager.count()} ⭐</div><div class="sub" style="color:var(--text3)">SAVED ASSETS</div></div>`;
  }

  renderTable() {
    let assets = [...(this.data[this.tab]||[])];
    if (this.query) { const q=this.query.toLowerCase(); assets=assets.filter(a=>a.name.toLowerCase().includes(q)||a.symbol.toLowerCase().includes(q)); }
    assets.sort((a,b)=>{ const av=a[this.sortKey]??0; const bv=b[this.sortKey]??0; return this.sortAsc?av-bv:bv-av; });
    const tbody = document.getElementById('mktBody');
    if (!assets.length) { tbody.innerHTML=`<tr><td colspan="9" style="text-align:center;padding:30px;color:var(--text3);font-family:var(--font-mono);font-size:.72rem">NO ASSETS FOUND</td></tr>`; return; }
    tbody.innerHTML = assets.map((a,i)=>{
      const sparkId = `spark-${this.tab}-${i}`;
      const icon = a.image?`<img src="${a.image}" alt="">`:`<span>${a.symbol.substring(0,3)}</span>`;
      const isFav = window.favoritesManager.has(a.symbol);
      return `<tr class="row" onclick="marketsPage.openModal('${this.tab}',${i})">
        <td class="muted-cell">${i+1}</td>
        <td><div class="asset-cell"><div class="asset-ico">${icon}</div><div><span class="asset-name">${a.name}</span><span class="asset-sym">${a.symbol}</span></div></div></td>
        <td class="price-cell">${Fmt.price(a.price)}</td>
        <td>${Fmt.pct(a.change_24h)}</td>
        <td>${Fmt.pct(a.change_7d)}</td>
        <td class="muted-cell">${Fmt.large(a.volume)}</td>
        <td class="muted-cell">${Fmt.large(a.market_cap||0)}</td>
        <td class="spark-cell"><canvas id="${sparkId}" width="80" height="28"></canvas></td>
        <td><button class="fav-btn ${isFav?'active':''}" onclick="event.stopPropagation();marketsPage.toggleFav('${a.symbol}',this,'${a.name}')">${isFav?'⭐':'☆'}</button></td>
      </tr>`;
    }).join('');
    requestAnimationFrame(()=>{ assets.forEach((a,i)=>Sparkline.draw(`spark-${this.tab}-${i}`,a.sparkline,a.change_7d>=0)); });
  }

  setTab(tab, el) { document.querySelectorAll('.chip').forEach(c=>c.classList.remove('active')); el.classList.add('active'); this.tab=tab; this.renderTable(); }
  sort(key) { if(this.sortKey===key) this.sortAsc=!this.sortAsc; else{this.sortKey=key;this.sortAsc=false;} this.renderTable(); }
  search(q) { this.query=q; const bar=document.querySelector('.terminal-search'); if(bar) bar.classList.toggle('has-value',q.length>0); this.renderTable(); }
  clearSearch() { this.query=''; const el=document.getElementById('assetSearch'); if(el){el.value='';el.focus();} document.querySelector('.terminal-search')?.classList.remove('has-value'); this.renderTable(); }

  toggleFav(symbol, btn, name) {
    const active = window.favoritesManager.toggle(symbol,{name});
    btn.textContent = active?'⭐':'☆'; btn.classList.toggle('active',active);
    this.renderKPI(); this.renderSideFavorites();
  }

  renderSideHeatmap() {
    const assets = this.data.crypto||[];
    const grid   = document.getElementById('sideHeatmap');
    if (!grid) return;
    grid.innerHTML = assets.map(a=>{
      const pct=a.change_24h||0; const abs=Math.abs(pct);
      const alpha=Math.min(0.85,0.1+abs*0.06);
      const bg=pct>=0?`rgba(0,200,83,${alpha})`:`rgba(255,23,68,${alpha})`;
      return `<div class="hm-cell-sm" style="background:${bg}"><div class="hm-sym-sm">${a.symbol}</div><div class="hm-pct-sm" style="color:${pct>=0?'var(--green)':'var(--red)'}">${pct>=0?'+':''}${pct.toFixed(1)}%</div></div>`;
    }).join('');
  }

  renderSideFavorites() {
    const el   = document.getElementById('sideFavorites');
    if (!el) return;
    const favs = window.favoritesManager.getAll();
    if (!favs.length) { el.innerHTML='<div style="color:var(--text3);font-family:var(--font-mono);font-size:.65rem;text-align:center;padding:16px">NO FAVORITES YET<br>CLICK ☆ TO ADD</div>'; return; }
    const all = [...(this.data.crypto||[]),...(this.data.stocks||[]),...(this.data.commodities||[])];
    el.innerHTML = favs.map(f=>{
      const asset = all.find(a=>a.symbol===f.id);
      if (!asset) return '';
      const up = asset.change_24h>=0;
      return `<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid var(--border)">
        <span style="font-family:var(--font-mono);font-size:.68rem;color:var(--amber);font-weight:600;min-width:40px">${asset.symbol}</span>
        <span style="font-family:var(--font-mono);font-size:.68rem;flex:1">${Fmt.price(asset.price)}</span>
        <span style="font-family:var(--font-mono);font-size:.62rem;color:${up?'var(--green)':'var(--red)'}">${up?'▲':'▼'}${Math.abs(asset.change_24h).toFixed(2)}%</span>
      </div>`;
    }).join('');
  }

  renderSideStats() {
    const el  = document.getElementById('sideStats');
    if (!el) return;
    const all = [...(this.data.crypto||[]),...(this.data.stocks||[]),...(this.data.commodities||[])];
    const sorted = [...all].sort((a,b)=>b.change_24h-a.change_24h);
    const top = sorted[0]; const bot = sorted[sorted.length-1];
    const totalVol = all.reduce((s,a)=>s+(a.volume||0),0);
    el.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:8px">
        <div style="background:var(--bg3);border-radius:var(--radius);padding:8px 10px">
          <div style="font-family:var(--font-mono);font-size:.55rem;color:var(--text3);letter-spacing:.1em;margin-bottom:3px">TOP GAINER</div>
          <div style="font-family:var(--font-mono);font-size:.72rem;font-weight:600;color:var(--green)">${top?.symbol} ${top?Fmt.pct(top.change_24h):''}</div>
        </div>
        <div style="background:var(--bg3);border-radius:var(--radius);padding:8px 10px">
          <div style="font-family:var(--font-mono);font-size:.55rem;color:var(--text3);letter-spacing:.1em;margin-bottom:3px">TOP LOSER</div>
          <div style="font-family:var(--font-mono);font-size:.72rem;font-weight:600;color:var(--red)">${bot?.symbol} ${bot?Fmt.pct(bot.change_24h):''}</div>
        </div>
        <div style="background:var(--bg3);border-radius:var(--radius);padding:8px 10px">
          <div style="font-family:var(--font-mono);font-size:.55rem;color:var(--text3);letter-spacing:.1em;margin-bottom:3px">TOTAL VOLUME</div>
          <div style="font-family:var(--font-mono);font-size:.72rem;font-weight:600">${Fmt.large(totalVol)}</div>
        </div>
      </div>`;
  }

  async loadFG() {
    try {
      const data  = await window.apiClient.get('/api/fear-greed',60*60*1000);
      const cur   = data.current||{};
      const val   = parseInt(cur.value||50);
      const label = cur.value_classification||'Neutral';
      const colors= {'Extreme Fear':'var(--red)','Fear':'#ff8f00','Neutral':'var(--amber)','Greed':'#69f0ae','Extreme Greed':'var(--green)'};
      const color = colors[label]||'var(--amber)';
      const vEl=document.getElementById('sideFgVal'); const lEl=document.getElementById('sideFgLabel'); const iEl=document.getElementById('sideFgInd');
      if(vEl){vEl.textContent=val;vEl.style.color=color;}
      if(lEl){lEl.textContent=label.toUpperCase();lEl.style.color=color;}
      if(iEl) iEl.style.left=`${val}%`;
    } catch(e){}
  }

  openModal(tab, index) {
    const a = (this.data[tab]||[])[index];
    if (!a) return;
    document.getElementById('modalTitle').textContent = `${a.symbol} — ${a.name.toUpperCase()}`;
    document.getElementById('modalSub').textContent   = `7-DAY PRICE HISTORY · LAST: ${Fmt.price(a.price)} · VOL: ${Fmt.large(a.volume)}`;
    const color = a.change_7d>=0?'#00c853':'#ff1744';
    const ctx = document.getElementById('modalChart').getContext('2d');
    if (this.modalChart) this.modalChart.destroy();
    this.modalChart = new Chart(ctx,{
      type:'line',
      data:{labels:(a.sparkline||[]).map((_,i)=>i),datasets:[{data:a.sparkline||[],borderColor:color,borderWidth:1.5,fill:true,
        backgroundColor:a.change_7d>=0?'rgba(0,200,83,0.06)':'rgba(255,23,68,0.06)',tension:0.4,pointRadius:0,pointHoverRadius:4}]},
      options:{responsive:true,plugins:{legend:{display:false},tooltip:{
        callbacks:{label:c=>`${Fmt.price(c.raw)}`},
        backgroundColor:'var(--bg3)',borderColor:'var(--border2)',borderWidth:1,titleColor:'var(--amber)',bodyColor:'var(--text2)',
        titleFont:{family:'IBM Plex Mono',size:10},bodyFont:{family:'IBM Plex Mono',size:10}
      }},
      scales:{y:{grid:{color:'rgba(255,255,255,0.04)'},ticks:{color:'var(--text3)',font:{family:'IBM Plex Mono',size:10},callback:v=>Fmt.price(v)}},x:{display:false}}}
    });
    document.getElementById('modalStats').innerHTML = `
      <div class="modal-stat"><div class="lbl">PRICE</div><div class="val">${Fmt.price(a.price)}</div></div>
      <div class="modal-stat"><div class="lbl">24H CHANGE</div><div class="val" style="color:${a.change_24h>=0?'var(--green)':'var(--red)'}">${a.change_24h>=0?'+':''}${a.change_24h}%</div></div>
      <div class="modal-stat"><div class="lbl">7D CHANGE</div><div class="val" style="color:${a.change_7d>=0?'var(--green)':'var(--red)'}">${a.change_7d>=0?'+':''}${a.change_7d}%</div></div>
      ${a.market_cap?`<div class="modal-stat"><div class="lbl">MARKET CAP</div><div class="val">${Fmt.large(a.market_cap)}</div></div>`:''}
      <div class="modal-stat"><div class="lbl">VOLUME 24H</div><div class="val">${Fmt.large(a.volume)}</div></div>
      <div class="modal-stat"><div class="lbl">SYMBOL</div><div class="val" style="color:var(--amber)">${a.symbol}</div></div>`;
    document.getElementById('chartOverlay').classList.add('open');
  }

  closeModal() { document.getElementById('chartOverlay').classList.remove('open'); }

  exportCSV() {
    const assets = this.data[this.tab]||[];
    const rows = [['Symbol','Name','Price','24h%','7d%','Volume','Market Cap'],...assets.map(a=>[a.symbol,a.name,a.price,a.change_24h,a.change_7d,a.volume,a.market_cap||''])];
    const csv = rows.map(r=>r.map(v=>`"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv],{type:'text/csv'});
    const url  = URL.createObjectURL(blob);
    const link = document.createElement('a'); link.href=url; link.download=`${this.tab}_prices.csv`; link.click();
    URL.revokeObjectURL(url); Toast.show(`EXPORTED ${this.tab.toUpperCase()}_PRICES.CSV`,'success');
  }
}

window.marketsPage = new MarketsPage();
