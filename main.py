// ═══════════════════════════════════════════════════════
// MARKETPULSE — YOUTUBE PAGE LOGIC
// YouTube Data API v3 key: AIzaSyBUABx4WHCox3crRyd4LRM63KpTLjBBPPY
// ═══════════════════════════════════════════════════════

const YT_API_KEY = 'AIzaSyBUABx4WHCox3crRyd4LRM63KpTLjBBPPY';
const YT_BASE    = 'https://www.googleapis.com/youtube/v3';

class YouTubeManager {
  constructor() {
    this.allVideos    = [];
    this.category     = 'all';
    this.sortBy       = 'date';
    this.query        = '';
    this.page         = 1;
    this.perPage      = 9;
    this.nextPageToken = null;
    this.loading      = false;
    this.usingLive    = false;

    this.categoryQueries = {
      crypto:    'bitcoin ethereum cryptocurrency 2024',
      stocks:    'stock market investing 2024',
      macro:     'federal reserve macroeconomics global economy',
      trading:   'technical analysis trading strategies',
      education: 'personal finance investing beginners',
    };

    this.init();
  }

  async init() {
    await this.fetchVideos('financial markets crypto stocks investing 2024');
  }

  async fetchVideos(searchQuery, pageToken = null) {
    this.loading = true;
    this.showSkeletons();

    try {
      let url = `${YT_BASE}/search?part=snippet&type=video&maxResults=24&order=relevance&key=${YT_API_KEY}&q=${encodeURIComponent(searchQuery)}`;
      if (pageToken) url += `&pageToken=${pageToken}`;

      const res  = await fetch(url);
      const data = await res.json();

      if (data.error) throw new Error(data.error.message);

      // Fetch video details (duration, view count)
      const ids = data.items.map(i => i.id.videoId).join(',');
      const detailRes  = await fetch(
        `${YT_BASE}/videos?part=contentDetails,statistics&id=${ids}&key=${YT_API_KEY}`
      );
      const detailData = await detailRes.json();

      const detailMap = {};
      (detailData.items || []).forEach(v => { detailMap[v.id] = v; });

      const videos = data.items.map(item => {
        const detail   = detailMap[item.id.videoId] || {};
        const stats    = detail.statistics || {};
        const duration = detail.contentDetails?.duration
          ? this.parseDuration(detail.contentDetails.duration)
          : null;
        const views = stats.viewCount
          ? this.formatViews(parseInt(stats.viewCount))
          : 'N/A';

        return {
          id:       item.id.videoId,
          title:    item.snippet.title,
          channel:  item.snippet.channelTitle,
          date:     item.snippet.publishedAt,
          thumb:    item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url,
          desc:     item.snippet.description,
          duration,
          views,
          category: this.detectCategory(item.snippet.title + ' ' + item.snippet.description),
        };
      }).filter(v => v.id);

      if (pageToken) {
        this.allVideos = [...this.allVideos, ...videos];
      } else {
        this.allVideos = videos;
      }

      this.nextPageToken = data.nextPageToken || null;
      this.usingLive     = true;
      this.loading       = false;

      const notice = document.getElementById('apiNotice');
      if (notice) notice.style.display = 'none';

      this.render();

    } catch(e) {
      console.warn('YouTube API error, falling back to curated:', e.message);
      this.loading   = false;
      this.usingLive = false;

      const notice = document.getElementById('apiNotice');
      if (notice) notice.style.display = 'flex';

      this.allVideos = this.getCuratedVideos();
      this.render();
    }
  }

  async fetchByCategory(category) {
    this.page = 1;
    this.nextPageToken = null;

    if (category === 'all') {
      await this.fetchVideos('financial markets crypto stocks investing 2024');
      return;
    }

    const q = this.categoryQueries[category] || category;
    await this.fetchVideos(q);
  }

  async searchVideos(query) {
    if (!query.trim()) {
      await this.fetchVideos('financial markets crypto stocks investing 2024');
      return;
    }
    await this.fetchVideos(query);
  }

  detectCategory(text) {
    const t = text.toLowerCase();
    if (t.includes('bitcoin') || t.includes('crypto') || t.includes('ethereum') || t.includes('defi')) return 'crypto';
    if (t.includes('stock') || t.includes('equity') || t.includes('nasdaq') || t.includes('s&p')) return 'stocks';
    if (t.includes('fed') || t.includes('macro') || t.includes('inflation') || t.includes('gdp')) return 'macro';
    if (t.includes('trad') || t.includes('technical analysis') || t.includes('chart')) return 'trading';
    return 'education';
  }

  parseDuration(iso) {
    const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return null;
    const h = parseInt(match[1] || 0);
    const m = parseInt(match[2] || 0);
    const s = parseInt(match[3] || 0);
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  formatViews(n) {
    if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B';
    if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
    if (n >= 1e3) return (n / 1e3).toFixed(0) + 'K';
    return n.toString();
  }

  getFiltered() {
    let videos = [...this.allVideos];

    if (this.category !== 'all') {
      videos = videos.filter(v => v.category === this.category);
    }

    if (this.query && !this.usingLive) {
      const q = this.query.toLowerCase();
      videos  = videos.filter(v =>
        (v.title || '').toLowerCase().includes(q) ||
        (v.channel || '').toLowerCase().includes(q)
      );
    }

    if (this.sortBy === 'views') {
      videos.sort((a, b) => {
        const parse = s => {
          if (!s || s === 'N/A') return 0;
          const n = parseFloat(s);
          if (s.includes('B')) return n * 1e9;
          if (s.includes('M')) return n * 1e6;
          if (s.includes('K')) return n * 1e3;
          return n;
        };
        return parse(b.views) - parse(a.views);
      });
    } else if (this.sortBy === 'title') {
      videos.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    } else {
      videos.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
    }

    return videos;
  }

  render() {
    const videos    = this.getFiltered();
    const paginated = videos.slice(0, this.page * this.perPage);

    const badge = document.getElementById('videoCountBadge');
    if (badge) badge.textContent = `${videos.length} videos`;

    const loadMore = document.getElementById('loadMoreWrap');
    if (loadMore) {
      loadMore.style.display =
        (videos.length > paginated.length || this.nextPageToken) ? 'block' : 'none';
    }

    const grid = document.getElementById('videoGrid');
    if (!grid) return;

    if (!videos.length) {
      grid.innerHTML = `
        <div style="text-align:center;padding:60px;color:var(--text3);grid-column:1/-1">
          <div style="font-size:3rem;margin-bottom:16px">🎬</div>
          <h3 style="color:var(--text2)">No videos found</h3>
          <p>Try a different search or category.</p>
        </div>`;
      return;
    }

    grid.innerHTML = paginated.map(v => `
      <div class="video-card fade-up"
        onclick="youtubePage.openModal('${v.id}','${(v.title || '').replace(/'/g, "\\'")}','${(v.channel || '').replace(/'/g, "\\'")}')">
        <div class="video-thumb">
          <img src="${v.thumb || `https://img.youtube.com/vi/${v.id}/mqdefault.jpg`}"
               alt="${(v.title || '').replace(/"/g, '&quot;')}" loading="lazy">
          <div class="video-play-btn"><i class="bi bi-play-fill"></i></div>
          ${v.duration ? `<div class="video-duration">${v.duration}</div>` : ''}
        </div>
        <div class="video-body">
          <div class="video-channel">
            <i class="bi bi-youtube" style="color:#ff0000"></i>
            ${v.channel || 'Unknown Channel'}
          </div>
          <div class="video-title">${v.title || 'Untitled Video'}</div>
          <div class="video-meta">
            <span class="video-views"><i class="bi bi-eye me-1"></i>${v.views} views</span>
            <span>${v.date ? Fmt.date(v.date) : ''}</span>
          </div>
        </div>
      </div>`).join('');

    setTimeout(() => {
      document.querySelectorAll('.fade-up').forEach(el => el.classList.add('visible'));
    }, 50);
  }

  setCategory(cat, el) {
    document.querySelectorAll('.filter-chips .chip').forEach(c => c.classList.remove('active'));
    el.classList.add('active');
    this.category = cat;
    this.page     = 1;
    this.fetchByCategory(cat);
  }

  setSort(val) { this.sortBy = val; this.render(); }

  search(q) {
    this.query = q;
    this.page  = 1;
    clearTimeout(this._searchDebounce);
    this._searchDebounce = setTimeout(() => {
      if (this.usingLive) this.searchVideos(q);
      else this.render();
    }, 500);
  }

  async loadMore() {
    this.page++;
    if (this.usingLive && this.nextPageToken && this.page * this.perPage > this.allVideos.length) {
      const q = this.categoryQueries[this.category] || 'financial markets investing';
      await this.fetchVideos(q, this.nextPageToken);
    } else {
      this.render();
    }
    Toast.show('More videos loaded');
  }

  openModal(videoId, title, channel) {
    const frame = document.getElementById('videoFrame');
    const mtitle = document.getElementById('modalVideoTitle');
    const mmeta  = document.getElementById('modalVideoMeta');
    if (frame)  frame.src   = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
    if (mtitle) mtitle.textContent = title || 'Video';
    if (mmeta)  mmeta.textContent  = `${channel || ''} · YouTube`;
    document.getElementById('videoOverlay')?.classList.add('open');
  }

  closeModal() {
    const frame = document.getElementById('videoFrame');
    if (frame) frame.src = '';
    document.getElementById('videoOverlay')?.classList.remove('open');
  }

  showSkeletons() {
    const grid = document.getElementById('videoGrid');
    if (!grid) return;
    grid.innerHTML = Array(9).fill(`
      <div class="video-card">
        <div class="video-thumb skeleton" style="padding-top:56.25%"></div>
        <div class="video-body">
          <div class="skeleton" style="height:10px;width:50%;margin-bottom:8px"></div>
          <div class="skeleton" style="height:14px;margin-bottom:6px"></div>
          <div class="skeleton" style="height:14px;width:70%"></div>
        </div>
      </div>`).join('');
  }

  getCuratedVideos() {
    return [
      { id:'eHRmM5SaxBk', title:'How The Economic Machine Works by Ray Dalio', channel:'Principles by Ray Dalio', category:'macro',     views:'42M', date:'2013-09-22', duration:'31:00', thumb:`https://img.youtube.com/vi/eHRmM5SaxBk/mqdefault.jpg` },
      { id:'ZCFkWDdmXG8', title:'Bitcoin Explained Simply', channel:'99Bitcoins',                                  category:'crypto',    views:'3.2M',date:'2024-01-10', duration:'12:34', thumb:`https://img.youtube.com/vi/ZCFkWDdmXG8/mqdefault.jpg` },
      { id:'GmOzih6I1zs', title:'Warren Buffett: How To Invest For Beginners', channel:'CNBC',                     category:'stocks',    views:'8.7M',date:'2024-03-15', duration:'22:10', thumb:`https://img.youtube.com/vi/GmOzih6I1zs/mqdefault.jpg` },
      { id:'7FaYwtDetXE', title:'How The Stock Market Works', channel:'Patrick Boyle',                             category:'stocks',    views:'5.1M',date:'2024-02-20', duration:'18:45', thumb:`https://img.youtube.com/vi/7FaYwtDetXE/mqdefault.jpg` },
      { id:'0W0apxkzBHA', title:'Ethereum and the Future of Finance', channel:'Bankless',                          category:'crypto',    views:'1.8M',date:'2024-04-01', duration:'45:22', thumb:`https://img.youtube.com/vi/0W0apxkzBHA/mqdefault.jpg` },
      { id:'Ph3FrFSGX0Y', title:'Macro Economics for Investors 2024', channel:'Real Vision',                      category:'macro',     views:'2.3M',date:'2024-05-10', duration:'28:17', thumb:`https://img.youtube.com/vi/Ph3FrFSGX0Y/mqdefault.jpg` },
      { id:'a5zsWsTknBU', title:'Technical Analysis Masterclass', channel:'Trading 212',                          category:'trading',   views:'4.5M',date:'2024-01-28', duration:'35:50', thumb:`https://img.youtube.com/vi/a5zsWsTknBU/mqdefault.jpg` },
      { id:'1BKnfLf9gXQ', title:'The Basics of Investing Explained', channel:'Khan Academy',                      category:'education', views:'12M', date:'2023-11-05', duration:'16:20', thumb:`https://img.youtube.com/vi/1BKnfLf9gXQ/mqdefault.jpg` },
      { id:'Rm5KUJhBf-4', title:'How Central Banks Control Money Supply', channel:'The Plain Bagel',              category:'macro',     views:'3.8M',date:'2024-02-01', duration:'14:30', thumb:`https://img.youtube.com/vi/Rm5KUJhBf-4/mqdefault.jpg` },
      { id:'oVfHeWTKjag', title:'DeFi Explained: The Future of Finance', channel:'Whiteboard Crypto',             category:'crypto',    views:'2.1M',date:'2024-03-22', duration:'20:15', thumb:`https://img.youtube.com/vi/oVfHeWTKjag/mqdefault.jpg` },
      { id:'2MHIcabnjrA', title:'How to Read Stock Charts Like a Pro', channel:'Investors Underground',           category:'trading',   views:'6.7M',date:'2024-01-15', duration:'42:18', thumb:`https://img.youtube.com/vi/2MHIcabnjrA/mqdefault.jpg` },
      { id:'sMmCFJNEoew', title:'Global Macro: Why Currencies Matter', channel:'George Gammon',                   category:'macro',     views:'1.5M',date:'2024-04-20', duration:'25:40', thumb:`https://img.youtube.com/vi/sMmCFJNEoew/mqdefault.jpg` },
    ];
  }
}

// Boot
document.addEventListener('DOMContentLoaded', () => {
  window.youtubePage = new YouTubeManager();
});

// Global helpers called from HTML
function setVideoCategory(cat, el) { window.youtubePage?.setCategory(cat, el); }
function setVideoSort(val)         { window.youtubePage?.setSort(val); }
function searchVideos(q)           { window.youtubePage?.search(q); }
function loadMoreVideos()          { window.youtubePage?.loadMore(); }
