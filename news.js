// ═══════════════════════════════════════════════════════
// MARKETPULSE — CALENDAR PAGE LOGIC
// ═══════════════════════════════════════════════════════

class CalendarManager {
  constructor() {
    this.events = [];
    this.filter = 'all';
    this.init();
  }

  async init() {
    await Promise.all([this.loadCalendar(), this.loadMood()]);
  }

  // ── CALENDAR EVENTS ────────────────────────────────────
  async loadCalendar() {
    try {
      this.events = await window.apiClient.get('/api/calendar');
      this.render();
      this.renderUpcoming();
    } catch(e) {
      const el = document.getElementById('calendarEvents');
      if (el) el.innerHTML = `
        <div style="color:var(--text3);padding:20px;text-align:center">
          ⚠ Could not load calendar. Make sure backend is running.
        </div>`;
    }
  }

  setFilter(f, el) {
    document.querySelectorAll('.filter-chips .chip').forEach(c => c.classList.remove('active'));
    el.classList.add('active');
    this.filter = f;
    this.render();
  }

  getFiltered() {
    if (this.filter === 'all') return this.events;
    if (this.filter === 'high' || this.filter === 'medium' || this.filter === 'low') {
      return this.events.filter(e => e.importance === this.filter);
    }
    const regionMap = { US: '🇺🇸', EU: '🇪🇺', UK: '🇬🇧', JP: '🇯🇵', CN: '🇨🇳' };
    return this.events.filter(e => e.region === regionMap[this.filter]);
  }

  render() {
    const filtered  = this.getFiltered();
    const container = document.getElementById('calendarEvents');
    if (!container) return;

    if (!filtered.length) {
      container.innerHTML = `
        <div style="text-align:center;padding:40px;color:var(--text3)">
          No events match this filter.
        </div>`;
      return;
    }

    // Group by month
    const grouped = {};
    filtered.forEach(e => {
      const d   = new Date(e.date);
      const key = d.toLocaleString('en-US', { month: 'long', year: 'numeric' });
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(e);
    });

    container.innerHTML = Object.entries(grouped).map(([month, events]) => `
      <div class="cal-group fade-up">
        <div class="cal-group-header">${month}</div>
        ${events.map(e => {
          const d = new Date(e.date);
          return `
          <div class="cal-event ${e.importance}">
            <div class="cal-day-block">
              <div class="cal-day-num">${d.getDate()}</div>
              <div class="cal-day-mo">${d.toLocaleString('en-US', { month: 'short' })}</div>
            </div>
            <div class="cal-main">
              <div class="cal-region">${e.region}</div>
              <div class="cal-event-name">${e.event}</div>
              <div class="cal-detail">${e.detail}</div>
            </div>
            <div>
              <span class="imp-badge ${e.importance}">${e.importance}</span>
            </div>
          </div>`;
        }).join('')}
      </div>`).join('');

    setTimeout(() => {
      document.querySelectorAll('.fade-up').forEach(el => el.classList.add('visible'));
    }, 50);
  }

  renderUpcoming() {
    const list = document.getElementById('upcomingList');
    if (!list) return;

    const next5 = this.events
      .filter(e => new Date(e.date) >= new Date())
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(0, 5);

    list.innerHTML = next5.map(e => {
      const d = new Date(e.date);
      return `
        <div class="upcoming-item">
          <div class="upcoming-date-block">
            <div class="upcoming-month">${d.toLocaleString('en-US', { month: 'short' })}</div>
            <div class="upcoming-day">${d.getDate()}</div>
          </div>
          <div class="upcoming-info">
            <div class="upcoming-event">${e.event}</div>
            <div class="upcoming-detail">
              ${e.region} · <span class="imp-badge ${e.importance}" style="font-size:0.6rem;padding:2px 6px">${e.importance}</span>
            </div>
          </div>
        </div>`;
    }).join('');
  }

  // ── AI MOOD ─────────────────────────────────────────────
  async loadMood() {
    const badge    = document.getElementById('moodBadge');
    const analysis = document.getElementById('moodAnalysis');
    const ts       = document.getElementById('moodTimestamp');

    try {
      const data = await window.apiClient.get('/api/mood', 2 * 60 * 60 * 1000);

      if (badge) {
        badge.className   = `mood-badge ${(data.sentiment || 'mixed').toLowerCase()}`;
        badge.textContent = data.sentiment || 'Mixed';
      }
      if (analysis) {
        analysis.className   = 'mood-analysis';
        analysis.textContent = data.analysis || 'No analysis available.';
      }
      if (ts && data.generated_at) {
        ts.textContent = `Last updated: ${new Date(data.generated_at).toLocaleString()}`;
      }

    } catch(e) {
      if (badge) {
        badge.className   = 'mood-badge neutral';
        badge.textContent = 'Offline';
      }
      if (analysis) {
        analysis.className   = 'mood-analysis';
        analysis.textContent = 'Add Anthropic API key to backend (.env: ANTHROPIC_KEY=sk-...) for AI market mood analysis.';
      }
    }
  }

  async refreshMood() {
    const badge    = document.getElementById('moodBadge');
    const analysis = document.getElementById('moodAnalysis');

    if (badge) {
      badge.className   = 'mood-badge mixed skeleton';
      badge.textContent = '\u00a0';
    }
    if (analysis) {
      analysis.className   = 'mood-analysis skeleton';
      analysis.textContent = '\u00a0';
    }

    // Clear API cache for mood endpoint
    window.apiClient._cache.delete('/api/mood');
    await this.loadMood();
    Toast.show('Market mood refreshed', 'success');
  }
}

// Boot
document.addEventListener('DOMContentLoaded', () => {
  window.calendarPage = new CalendarManager();
});

// Global helpers called from HTML
function setCalFilter(f, el)  { window.calendarPage?.setFilter(f, el); }
function refreshMood()        { window.calendarPage?.refreshMood(); }
