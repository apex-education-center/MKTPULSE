// ═══════════════════════════════════════════════════════
// MARKETPULSE — YOUTUBE VIDEOS v9.3
// YouTube Data API v3 — finance, crypto & market topics
// ═══════════════════════════════════════════════════════

const YT_KEY  = 'AIzaSyBUABx4WHCox3crRyd4LRM63KpTLjBBPPY';
const YT_BASE = 'https://www.googleapis.com/youtube/v3';

// ─── YOUTUBE VIDEO MANAGER ────────────────────────────
class YouTubeManager {
  constructor() {
    this.allVideos     = [];
    this.category      = 'all';
    this.sortBy        = 'date';
    this.query         = '';
    this.page          = 1;
    this.perPage       = 12;
    this.nextPageToken = null;
    this.loading       = false;

    this.queries = {
      all:       'financial markets crypto stocks investing analysis 2025',
      crypto:    'bitcoin ethereum cryptocurrency price analysis 2025',
      stocks:    'stock market S&P500 investing earnings analysis 2025',
      macro:     'federal reserve interest rates inflation GDP 2025',
      trading:   'technical analysis trading forex chart patterns 2025',
      education: 'personal finance investing for beginners explained',
    };

    this.init();
  }

  async init() {
    const qParam = new URLSearchParams(location.search).get('q');
    if (qParam) {
      this.query = qParam;
      const inp = document.getElementById('ytSearch');
      if (inp) inp.value = qParam;
    }
    this.allVideos = this._curated();
    this.render();

    try {
      await this.fetchVideos(qParam || this.queries.all);
    } catch(e) {
      console.warn('YT API unavailable, using curated list');
    }
  }

  async fetchVideos(searchQuery, pageToken = null) {
    if (this.loading) return;
    this.loading = true;
    if (!this.allVideos.length) this._showSkeletons();

    try {
      let url = `${YT_BASE}/search?part=snippet&type=video&maxResults=24`
              + `&order=relevance&key=${YT_KEY}`
              + `&q=${encodeURIComponent(searchQuery)}`
              + `&relevanceLanguage=en&safeSearch=none`;
      if (pageToken) url += `&pageToken=${pageToken}`;

      const sRes  = await fetch(url);
      const sData = await sRes.json();
      if (sData.error) throw new Error(sData.error.message);

      this.nextPageToken = sData.nextPageToken || null;

      const ids   = (sData.items||[]).map(i => i.id?.videoId).filter(Boolean).join(',');
      const dRes  = await fetch(`${YT_BASE}/videos?part=contentDetails,statistics&id=${ids}&key=${YT_KEY}`);
      const dData = await dRes.json();
      const dMap  = {};
      (dData.items||[]).forEach(v => { dMap[v.id] = v; });

      const videos = (sData.items||[]).map(item => {
        const vid = item.id?.videoId;
        if (!vid) return null;
        const d   = dMap[vid] || {};
        const st  = d.statistics || {};
        return {
          id:       vid,
          title:    item.snippet?.title || 'Untitled',
          channel:  item.snippet?.channelTitle || 'YouTube',
          date:     item.snippet?.publishedAt || '',
          thumb:    item.snippet?.thumbnails?.medium?.url || `https://img.youtube.com/vi/${vid}/mqdefault.jpg`,
          duration: d.contentDetails?.duration ? this._parseDur(d.contentDetails.duration) : null,
          views:    st.viewCount ? this._fmtViews(+st.viewCount) : null,
          url:      `https://www.youtube.com/watch?v=${vid}`,
          category: this._detectCat(item.snippet?.title + ' ' + item.snippet?.description),
        };
      }).filter(Boolean);

      if (!pageToken) {
        this.allVideos = videos.length > 0 ? videos : this._curated();
      } else {
        this.allVideos = [...this.allVideos, ...videos];
      }
      this.render();

    } catch(e) {
      console.warn('YT API error:', e.message);
      if (!this.allVideos.length) {
        this.allVideos = this._curated();
        this.render();
        Toast.show('Using curated video list (API quota or network issue)', 'warning');
      }
    }
    this.loading = false;
  }

  getFiltered() {
    let v = [...this.allVideos];
    if (this.category !== 'all') v = v.filter(x => x.category === this.category);
    if (this.query) {
      const q = this.query.toLowerCase();
      v = v.filter(x => x.title.toLowerCase().includes(q) || x.channel.toLowerCase().includes(q));
    }
    if (this.sortBy === 'title') v.sort((a,b) => a.title.localeCompare(b.title));
    else v.sort((a,b) => new Date(b.date||0) - new Date(a.date||0));
    return v;
  }

  render() {
    const videos = this.getFiltered();
    const shown  = videos.slice(0, this.page * this.perPage);

    const badge  = document.getElementById('videoCountBadge');
    const lmWrap = document.getElementById('loadMoreWrap');
    if (badge)  badge.textContent = `${videos.length} video${videos.length!==1?'s':''}`;
    if (lmWrap) lmWrap.style.display = (videos.length > shown.length || this.nextPageToken) ? 'block' : 'none';

    const grid = document.getElementById('videoGrid');
    if (!grid) {
      setTimeout(() => this.render(), 100);
      return;
    }

    if (!shown.length) {
      grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:60px;
        font-family:var(--font-mono);font-size:.78rem;color:var(--text-muted)">
        NO VIDEOS FOUND</div>`;
      return;
    }

    grid.innerHTML = shown.map(v => `
      <a class="vc fade-up"
         href="${v.url}"
         target="_blank"
         rel="noopener noreferrer"
         title="Watch on YouTube: ${this._esc(v.title)}">
        <div class="vc-thumb">
          <img src="${v.thumb}" alt=""
               loading="lazy"
               onerror="this.src='https://img.youtube.com/vi/${v.id}/mqdefault.jpg'">
          <div class="vc-play"><i class="bi bi-play-fill"></i></div>
          ${v.duration ? `<div class="vc-dur">${v.duration}</div>` : ''}
          <div class="vc-yt-badge"><i class="bi bi-youtube"></i> YT</div>
        </div>
        <div class="vc-body">
          <div class="vc-ch">
            <i class="bi bi-youtube" style="color:#ff0000"></i>
            ${this._esc(v.channel)}
          </div>
          <div class="vc-title">${this._esc(v.title)}</div>
          <div class="vc-meta">
            <span>${v.views ? `<i class="bi bi-eye me-1"></i>${v.views}` : ''}</span>
            <span style="color:var(--amber);font-weight:600;font-size:.58rem">
              ↗ YOUTUBE
            </span>
          </div>
        </div>
      </a>`).join('');

    setTimeout(() => window.scrollAnimator?.refresh(), 50);
  }

  setCategory(cat, el) {
    document.querySelectorAll('.chip-row .chip').forEach(c => c.classList.remove('active'));
    el.classList.add('active');
    document.querySelectorAll('.yt-topic').forEach(t => t.classList.remove('active'));
    this.category  = cat;
    this.page      = 1;
    this.query     = '';
    const searchEl = document.getElementById('videoSearch');
    if (searchEl) {
      searchEl.value = '';
      searchEl.closest('.search-bar')?.classList.remove('has-val');
    }
    this.allVideos = [];
    this.fetchVideos(this.queries[cat] || this.queries.all);
  }

  setSort(val) { this.sortBy = val; this.render(); }

  search(q) {
    this.query = q;
    clearTimeout(this._debounce);
    this._debounce = setTimeout(() => {
      this.page = 1; this.allVideos = [];
      this.fetchVideos(q.length >= 2 ? q : this.queries.all);
    }, 450);
  }

  suggestTopic(query, el) {
    document.querySelectorAll('.yt-topic').forEach(t => t.classList.remove('active'));
    el?.classList.add('active');
    document.querySelectorAll('.chip-row .chip').forEach(c => c.classList.remove('active'));
    document.querySelector('.chip-row .chip')?.classList.add('active');
    this.category = 'all';
    this.query    = '';
    this.page     = 1;
    this.allVideos = [];

    const searchEl = document.getElementById('videoSearch');
    if (searchEl) {
      searchEl.value = query;
      searchEl.closest('.search-bar')?.classList.add('has-val');
    }

    this.fetchVideos(query);
    Toast.show(`Searching: ${query}`, 'info', 2000);
  }

  async loadMore() {
    this.page++;
    if (this.nextPageToken && this.page * this.perPage > this.allVideos.length) {
      await this.fetchVideos(this.queries[this.category] || this.queries.all, this.nextPageToken);
    } else {
      this.render();
    }
  }

  _showSkeletons() {
    const grid = document.getElementById('videoGrid');
    if (!grid) return;
    grid.innerHTML = Array(12).fill(`
      <div class="vc">
        <div class="vc-thumb skeleton" style="padding-top:56.25%;height:0"></div>
        <div class="vc-body">
          <div class="skeleton" style="height:10px;width:50%;margin-bottom:8px;border-radius:2px"></div>
          <div class="skeleton" style="height:13px;margin-bottom:5px;border-radius:2px"></div>
          <div class="skeleton" style="height:11px;width:65%;border-radius:2px"></div>
        </div>
      </div>`).join('');
  }

  _parseDur(iso) {
    const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!m) return null;
    const h=+m[1]||0, mn=+m[2]||0, s=+m[3]||0;
    return h ? `${h}:${String(mn).padStart(2,'0')}:${String(s).padStart(2,'0')}`
             : `${mn}:${String(s).padStart(2,'0')}`;
  }

  _fmtViews(n) {
    if (n>=1e9) return (n/1e9).toFixed(1)+'B';
    if (n>=1e6) return (n/1e6).toFixed(1)+'M';
    if (n>=1e3) return (n/1e3).toFixed(0)+'K';
    return String(n);
  }

  _detectCat(text) {
    const t = (text||'').toLowerCase();
    if (/bitcoin|ethereum|crypto|defi|blockchain|solana|xrp/.test(t)) return 'crypto';
    if (/stock|equity|nasdaq|s.p|dow|earnings|dividend|ipo|nvidia/.test(t))  return 'stocks';
    if (/federal reserve|interest rate|inflation|gdp|macro|ecb|cpi|gold/.test(t)) return 'macro';
    if (/technical analysis|trading|forex|chart|rsi|macd/.test(t))   return 'trading';
    if (/personal finance|beginner|explained|how to invest|guide/.test(t)) return 'education';
    return 'all';
  }

  _esc(s) {
    return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  _curated() {
    return [
      { id:'eHRmM5SaxBk', title:'How The Economic Machine Works',          channel:'Ray Dalio',           category:'macro',     views:'42M',  date:'2013-09-22', duration:'31:00', thumb:'https://img.youtube.com/vi/eHRmM5SaxBk/mqdefault.jpg', url:'https://www.youtube.com/watch?v=eHRmM5SaxBk' },
      { id:'PHe0bXAIuk0', title:'Stock Market Investing for Beginners',     channel:'Andrei Jikh',         category:'stocks',    views:'8.1M', date:'2024-01-10', duration:'15:22', thumb:'https://img.youtube.com/vi/PHe0bXAIuk0/mqdefault.jpg', url:'https://www.youtube.com/watch?v=PHe0bXAIuk0' },
      { id:'GmOzih6I1zs', title:'Warren Buffett: How To Invest',            channel:'CNBC',                category:'education', views:'8.7M', date:'2024-03-15', duration:'22:10', thumb:'https://img.youtube.com/vi/GmOzih6I1zs/mqdefault.jpg', url:'https://www.youtube.com/watch?v=GmOzih6I1zs' },
      { id:'7FaYwtDetXE', title:'How The Stock Market Works',               channel:'Patrick Boyle',       category:'stocks',    views:'5.1M', date:'2024-02-20', duration:'18:45', thumb:'https://img.youtube.com/vi/7FaYwtDetXE/mqdefault.jpg', url:'https://www.youtube.com/watch?v=7FaYwtDetXE' },
      { id:'ZCFkWDdmXG8', title:'Bitcoin Explained Simply',                 channel:'99Bitcoins',          category:'crypto',    views:'3.2M', date:'2024-01-10', duration:'12:34', thumb:'https://img.youtube.com/vi/ZCFkWDdmXG8/mqdefault.jpg', url:'https://www.youtube.com/watch?v=ZCFkWDdmXG8' },
      { id:'a5zsWsTknBU', title:'Technical Analysis Masterclass',           channel:'Trading 212',         category:'trading',   views:'4.5M', date:'2024-01-28', duration:'35:50', thumb:'https://img.youtube.com/vi/a5zsWsTknBU/mqdefault.jpg', url:'https://www.youtube.com/watch?v=a5zsWsTknBU' },
      { id:'Rm5KUJhBf-4', title:'How Central Banks Control Money',          channel:'The Plain Bagel',     category:'macro',     views:'3.8M', date:'2024-02-01', duration:'14:30', thumb:'https://img.youtube.com/vi/Rm5KUJhBf-4/mqdefault.jpg', url:'https://www.youtube.com/watch?v=Rm5KUJhBf-4' },
      { id:'oVfHeWTKjag', title:'DeFi Explained: Future of Finance',        channel:'Whiteboard Crypto',   category:'crypto',    views:'2.1M', date:'2024-03-22', duration:'20:15', thumb:'https://img.youtube.com/vi/oVfHeWTKjag/mqdefault.jpg', url:'https://www.youtube.com/watch?v=oVfHeWTKjag' },
      { id:'2MHIcabnjrA', title:'How to Read Stock Charts Like a Pro',      channel:'Investors Underground',category:'trading',  views:'6.7M', date:'2024-01-15', duration:'42:18', thumb:'https://img.youtube.com/vi/2MHIcabnjrA/mqdefault.jpg', url:'https://www.youtube.com/watch?v=2MHIcabnjrA' },
      { id:'sMmCFJNEoew', title:'Global Macro: Why Currencies Matter',      channel:'George Gammon',       category:'macro',     views:'1.5M', date:'2024-04-20', duration:'25:40', thumb:'https://img.youtube.com/vi/sMmCFJNEoew/mqdefault.jpg', url:'https://www.youtube.com/watch?v=sMmCFJNEoew' },
      { id:'1BKnfLf9gXQ', title:'Complete Guide to Investing',              channel:'Khan Academy',        category:'education', views:'12M',  date:'2023-11-05', duration:'16:20', thumb:'https://img.youtube.com/vi/1BKnfLf9gXQ/mqdefault.jpg', url:'https://www.youtube.com/watch?v=1BKnfLf9gXQ' },
      { id:'Ph3FrFSGX0Y', title:'Macro Economics for Investors 2024',       channel:'Real Vision',         category:'macro',     views:'2.3M', date:'2024-05-10', duration:'28:17', thumb:'https://img.youtube.com/vi/Ph3FrFSGX0Y/mqdefault.jpg', url:'https://www.youtube.com/watch?v=Ph3FrFSGX0Y' },
    ];
  }
}

// ─── BOOT ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  window.youtubePage = new YouTubeManager();
});

function setVideoCategory(cat, el) { window.youtubePage?.setCategory(cat, el); }
function setVideoSort(val)         { window.youtubePage?.setSort(val); }
function searchVideos(q)           { window.youtubePage?.search(q); }
function loadMoreVideos()          { window.youtubePage?.loadMore(); }
function suggestVideoTopic(q, el)  { window.youtubePage?.suggestTopic(q, el); }
