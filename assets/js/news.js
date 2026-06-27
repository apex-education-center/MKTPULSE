// ═══════════════════════════════════════════════════════
// MARKETPULSE — NEWS PAGE v9
// Real NewsAPI + time filters (Today/Week/Month/All)
// ═══════════════════════════════════════════════════════

class NewsManager {
  constructor() {
    this.allArticles = [];
    this._baseArticles = [];
    this.category    = 'all';
    this.timeFilter  = 'all';   // today | week | month | all
    this.sortBy      = 'date';
    this.query       = '';
    this.page        = 1;
    this.perPage     = 12;
    this._debounce   = null;
    this.init();
  }

  async init() {
    await this.fetch('all', '', 'all');
  }

  _loadPeriodCounts() {
    const now = new Date();
    const todayUTC = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
    const weekUTC  = todayUTC - 7  * 86400000;
    const monthUTC = todayUTC - 30 * 86400000;

    const src = this._baseArticles || this.allArticles;

    let cAll = 0, cMonth = 0, cWeek = 0, cToday = 0;
    for (const a of src) {
      const t = new Date(a.published_at || 0).getTime();
      if (isNaN(t)) continue;
      cAll++;
      if (t >= monthUTC) cMonth++;
      if (t >= weekUTC)  cWeek++;
      if (t >= todayUTC) cToday++;
    }

    const map = { all: cAll, month: cMonth, week: cWeek, today: cToday };
    for (const [p, count] of Object.entries(map)) {
      const el = document.getElementById('tc-' + p);
      if (el) el.textContent = count;
    }
  }

  // ── FETCH ────────────────────────────────────────────
  async fetch(category = 'all', q = '', period = null) {
    const p = period || this.timeFilter || 'all';
    this.timeFilter = p;
    this._showSkeletons();
    try {
      let url = `${window.apiClient.base}/api/news?category=${category}&period=${p}`;
      if (q) url += `&q=${encodeURIComponent(q)}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const articles = await res.json();
      if (!Array.isArray(articles)) throw new Error('Bad response');
      this.allArticles = articles;
      this._buildCarousel();
      this.render();

      // Keep the period-count baseline in sync with the CURRENT
      // category/query, not just the very first load.
      if (p === 'all') {
        this._baseArticles = articles;
        this._loadPeriodCounts();
      } else {
        this._refreshBaseCounts(category, q);
      }
    } catch(e) {
      this._showError(e.message);
    }
  }

  async _refreshBaseCounts(category, q) {
    try {
      let url = `${window.apiClient.base}/api/news?category=${category}&period=all`;
      if (q) url += `&q=${encodeURIComponent(q)}`;
      const res = await fetch(url);
      if (!res.ok) return;
      const articles = await res.json();
      if (Array.isArray(articles)) {
        this._baseArticles = articles;
        this._loadPeriodCounts();
      }
    } catch (e) {
      console.warn('[NewsCount] failed to refresh base counts', e);
    }
  }

  // ── CAROUSEL (breaking news — capped height) ─────────
  _buildCarousel() {
    const top   = this.allArticles.slice(0, 5);
    const ind   = document.getElementById('breakingIndicators');
    const inner = document.getElementById('breakingInner');
    if (!ind || !inner || !top.length) return;

    ind.innerHTML = top.map((_,i) =>
      `<button type="button" data-bs-target="#breakingCarousel" data-bs-slide-to="${i}" ${i===0?'class="active"':''}></button>`
    ).join('');

    inner.innerHTML = top.map((a,i) => `
      <div class="carousel-item ${i===0?'active':''}" onclick="window.open('${a.url}','_blank')" style="cursor:pointer">
        <div class="breaking-slide">
          ${a.image ? `<img class="bs-bg" src="${a.image}" alt="" onerror="this.style.display='none'">` : ''}
          <div class="bs-gradient"></div>
          <div class="bs-content">
            <span class="bs-tag">BREAKING</span>
            <div class="bs-title">${a.title}</div>
            <div class="bs-meta">${a.source?.toUpperCase()} · ${Fmt.timeAgo(a.published_at)}</div>
          </div>
        </div>
      </div>`).join('');
  }

  // ── TIME FILTER ───────────────────────────────────────
  setTimeFilter(filter, el) {
    document.querySelectorAll('.time-chip').forEach(c => c.classList.remove('active'));
    el.classList.add('active');
    this.timeFilter = filter;
    this.page = 1;
    this.fetch(this.category, this.query, filter);
  }

  // ── CATEGORY + SORT ───────────────────────────────────
  setCategory(cat, el) {
    document.querySelectorAll('.cat-chip').forEach(c => c.classList.remove('active'));
    el.classList.add('active');
    this.category = cat;
    this.page = 1;
    this.query = '';
    const si = document.getElementById('newsSearch');
    if (si) si.value = '';
    document.querySelector('.search-bar')?.classList.remove('has-val');
    this.fetch(cat, '', this.timeFilter);
  }

  setSort(val) { this.sortBy = val; this.render(); }

  search(q) {
    this.query = q;
    this.page  = 1;
    clearTimeout(this._debounce);
    this._debounce = setTimeout(() => {
      if (!q) this.fetch(this.category, '', this.timeFilter);
      else if (q.length >= 2) this.fetch('all', q, this.timeFilter);
      else this.render();
    }, 400);
  }

  clearSearch() {
    this.query = '';
    const si = document.getElementById('newsSearch');
    if (si) si.value = '';
    document.querySelector('.search-bar')?.classList.remove('has-val');
    this.fetch(this.category, '', this.timeFilter);
  }

  // ── RENDER ────────────────────────────────────────────
  getFiltered() {
    let articles = [...this.allArticles];
    if (this.query) {
      const q = this.query.toLowerCase();
      articles = articles.filter(a =>
        (a.title||'').toLowerCase().includes(q) ||
        (a.source||'').toLowerCase().includes(q)
      );
    }
    // Period filtering is done by the API — no client-side date filter
    if (this.sortBy === 'source') articles.sort((a,b) => (a.source||'').localeCompare(b.source||''));
    else articles.sort((a,b) => new Date(b.published_at||0) - new Date(a.published_at||0));
    return articles;
  }

  render() {
    const articles  = this.getFiltered();
    const paginated = articles.slice(0, this.page * this.perPage);

    const countEl = document.getElementById('articleCount');
    if (countEl) countEl.textContent = `${articles.length} ARTICLES`;

    const lmWrap = document.getElementById('loadMoreWrap');
    if (lmWrap) lmWrap.style.display = articles.length > paginated.length ? 'block' : 'none';

    // Show time filter counts
    this._updateTimeCounts();

    const grid = document.getElementById('newsGrid');
    if (!grid) return;

    if (!paginated.length) {
      grid.innerHTML = `
        <div style="grid-column:1/-1;text-align:center;padding:60px 20px;
          font-family:var(--font-mono);font-size:.78rem;color:var(--text-muted)">
          NO ARTICLES FOUND FOR THIS FILTER
        </div>`;
      return;
    }

    grid.innerHTML = paginated.map(a => `
      <div class="news-card fade-up" onclick="window.open('${a.url}','_blank')">
        <div class="nc-img">
          ${a.image
            ? `<img src="${a.image}" alt="" loading="lazy"
                onerror="this.parentElement.innerHTML='<div class=nc-placeholder>📰</div>'">`
            : '<div class="nc-placeholder">📰</div>'}
        </div>
        <div class="nc-body">
          <div class="nc-src-row">
            <span class="nc-src">${a.source || 'UNKNOWN'}</span>
            <span class="nc-time">${Fmt.timeAgo(a.published_at)}</span>
          </div>
          <div class="nc-title">${a.title || 'Untitled'}</div>
          ${a.description ? `<div class="nc-desc">${a.description.substring(0,120)}...</div>` : ''}
          <div class="nc-footer">
            <span style="color:var(--amber);font-size:.62rem;font-family:var(--font-mono)">READ MORE →</span>
          </div>
        </div>
      </div>`).join('');

    setTimeout(() => window.scrollAnimator?.refresh(), 50);
  }

  _updateTimeCounts() {
    // Counts are now refreshed directly in fetch()/_refreshBaseCounts()
    // whenever the category/query changes — no need to recompute here.
  }

  loadMore() { this.page++; this.render(); Toast.show('MORE ARTICLES LOADED'); }

  _showSkeletons() {
    const g = document.getElementById('newsGrid');
    if (!g) return;
    g.innerHTML = Array(12).fill(`
      <div class="news-card">
        <div class="nc-img skeleton"></div>
        <div class="nc-body">
          <div class="skeleton" style="height:10px;width:45%;margin-bottom:8px;border-radius:2px"></div>
          <div class="skeleton" style="height:14px;margin-bottom:5px;border-radius:2px"></div>
          <div class="skeleton" style="height:12px;width:75%;border-radius:2px"></div>
        </div>
      </div>`).join('');
  }

  _showError(msg) {
    const g = document.getElementById('newsGrid');
    if (!g) return;
    g.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:48px;
        font-family:var(--font-mono);font-size:.72rem;color:var(--text-muted)">
        ⚠ BACKEND OFFLINE — ${msg || 'Run: uvicorn main:app --port 8000'}
      </div>`;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.newsManager = new NewsManager();
});

function setNewsCategory(cat, el) { window.newsManager?.setCategory(cat, el); }
function setNewsTimeFilter(f, el)  { window.newsManager?.setTimeFilter(f, el); }
function setNewsSort(val)           { window.newsManager?.setSort(val); }
function searchNews(q)              { window.newsManager?.search(q); }
function clearNewsSearch()          { window.newsManager?.clearSearch(); }
function loadMoreNews()             { window.newsManager?.loadMore(); }