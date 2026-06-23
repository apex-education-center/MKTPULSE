// ═══════════════════════════════════════════════════════
// MARKETPULSE — CALENDAR PAGE LOGIC v3
// Real Finnhub API + Date Picker + Market Impact Analysis
// ═══════════════════════════════════════════════════════

class CalendarManager {
  constructor() {
    this.events      = [];
    this.filter      = 'all';
    this.pickerDate  = new Date();
    this.selectedDay = null;

    // Set default date range inputs
    const today  = new Date();
    const future = new Date(); future.setDate(today.getDate() + 60);
    const fmt    = d => d.toISOString().split('T')[0];

    const fromEl = document.getElementById('fromDate');
    const toEl   = document.getElementById('toDate');
    if (fromEl) fromEl.value = fmt(today);
    if (toEl)   toEl.value   = fmt(future);

    this.init();
  }

  async init() {
    await Promise.all([
      this.fetchRange(),
      this.loadMood(),
      this.loadFearGreed(),
    ]);
    this.renderPicker();
  }

  // ── DATE RANGE FETCH ─────────────────────────────────
  async fetchRange() {
    const fromEl = document.getElementById('fromDate');
    const toEl   = document.getElementById('toDate');
    const from   = fromEl?.value || new Date().toISOString().split('T')[0];
    const to     = toEl?.value   || (() => { const d=new Date(); d.setDate(d.getDate()+60); return d.toISOString().split('T')[0]; })();

    const container = document.getElementById('calendarEvents');
    if (container) container.innerHTML = `
      <div class="text-center py-5" style="color:var(--text3)">
        <div class="spinner-border spinner-border-sm me-2" style="color:var(--accent)"></div>
        Fetching events from Finnhub...
      </div>`;

    try {
      const data = await window.apiClient.get(`/api/calendar?from_date=${from}&to_date=${to}`, 0);
      this.events = Array.isArray(data) ? data : [];
      this.renderEvents();
      this.renderUpcoming();
      this.renderPicker();
      const countEl = document.getElementById('eventCount');
      if (countEl) countEl.textContent = this.events.length;
    } catch(e) {
      if (container) container.innerHTML = `
        <div style="color:var(--text3);padding:20px;text-align:center">
          ⚠ Could not load calendar. Start backend: <code>uvicorn main:app --port 8000</code>
        </div>`;
    }
  }

  resetRange() {
    const today  = new Date();
    const future = new Date(); future.setDate(today.getDate() + 60);
    const fmt    = d => d.toISOString().split('T')[0];
    const fromEl = document.getElementById('fromDate');
    const toEl   = document.getElementById('toDate');
    if (fromEl) fromEl.value = fmt(today);
    if (toEl)   toEl.value   = fmt(future);
    this.fetchRange();
  }

  // ── MINI DATE PICKER ──────────────────────────────────
  renderPicker() {
    const d     = this.pickerDate;
    const year  = d.getFullYear();
    const month = d.getMonth();
    const title = document.getElementById('pickerTitle');
    const grid  = document.getElementById('pickerGrid');
    if (!title || !grid) return;

    title.textContent = d.toLocaleString('en-US', { month: 'long', year: 'numeric' });

    // Build set of dates with events
    const eventDates = {};
    this.events.forEach(e => {
      const key = e.date?.substring(0, 10);
      if (key) {
        if (!eventDates[key] || e.importance === 'high') eventDates[key] = e.importance;
      }
    });

    const today    = new Date();
    const firstDay = new Date(year, month, 1).getDay();
    const daysIn   = new Date(year, month + 1, 0).getDate();
    const days     = ['Su','Mo','Tu','We','Th','Fr','Sa'];

    let html = days.map(d => `<div class="cal-day-header">${d}</div>`).join('');

    // Empty cells before first day
    for (let i = 0; i < firstDay; i++) html += '<div class="cal-day other-month"></div>';

    for (let day = 1; day <= daysIn; day++) {
      const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
      const isToday = today.getFullYear()===year && today.getMonth()===month && today.getDate()===day;
      const isSel   = this.selectedDay === dateStr;
      const hasEv   = eventDates[dateStr];
      let cls = 'cal-day';
      if (isToday)      cls += ' today';
      if (isSel)        cls += ' selected';
      if (hasEv)        cls += ` has-event has-${hasEv}`;

      html += `<div class="${cls}" onclick="calendarPage.selectDay('${dateStr}')">${day}</div>`;
    }

    grid.innerHTML = html;
  }

  selectDay(dateStr) {
    this.selectedDay = this.selectedDay === dateStr ? null : dateStr;
    this.renderPicker();

    // Filter events to that day or clear
    if (this.selectedDay) {
      const dayEvents = this.events.filter(e => e.date?.startsWith(dateStr));
      if (dayEvents.length) {
        this.renderEvents(dayEvents);
        Toast.show(`${dayEvents.length} event(s) on ${Fmt.date(dateStr)}`);
      } else {
        Toast.show('No events on this date', 'info');
        this.renderEvents();
      }
    } else {
      this.renderEvents();
    }
  }

  prevMonth() {
    this.pickerDate.setMonth(this.pickerDate.getMonth() - 1);
    this.renderPicker();
  }

  nextMonth() {
    this.pickerDate.setMonth(this.pickerDate.getMonth() + 1);
    this.renderPicker();
  }

  // ── FILTER ────────────────────────────────────────────
  setFilter(f, el) {
    document.querySelectorAll('.filter-chips .chip').forEach(c => c.classList.remove('active'));
    el.classList.add('active');
    this.filter = f;
    this.selectedDay = null;
    this.renderPicker();
    this.renderEvents();
  }

  getFiltered(override) {
    let events = override || [...this.events];
    if (this.filter === 'all')    return events;
    if (['high','medium','low'].includes(this.filter)) return events.filter(e => e.importance === this.filter);
    const regionMap = { US:'🇺🇸', EU:'🇪🇺', UK:'🇬🇧', CN:'🇨🇳', JP:'🇯🇵' };
    return events.filter(e => e.region === regionMap[this.filter]);
  }

  // ── RENDER EVENTS ─────────────────────────────────────
  renderEvents(override) {
    const filtered  = this.getFiltered(override);
    const container = document.getElementById('calendarEvents');
    if (!container) return;

    const countEl = document.getElementById('eventCount');
    if (countEl) countEl.textContent = filtered.length;

    if (!filtered.length) {
      container.innerHTML = `<div style="text-align:center;padding:40px;color:var(--text3)">No events match this filter.</div>`;
      return;
    }

    // Group by month
    const grouped = {};
    filtered.forEach(e => {
      const d   = new Date(e.date + 'T00:00:00');
      const key = isNaN(d) ? 'Unknown' : d.toLocaleString('en-US', { month:'long', year:'numeric' });
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(e);
    });

    container.innerHTML = Object.entries(grouped).map(([month, evts]) => `
      <div class="cal-group fade-up">
        <div class="cal-group-header">${month}</div>
        ${evts.map((e, idx) => {
          const d      = new Date(e.date + 'T00:00:00');
          const dayNum = isNaN(d) ? '?' : d.getDate();
          const dayMo  = isNaN(d) ? '' : d.toLocaleString('en-US', { month:'short' });
          const uid    = `ev-${month.replace(/\s/g,'')}-${idx}`;
          const hasData = e.actual || e.estimate || e.previous;

          return `
          <div class="cal-event ${e.importance}" onclick="calendarPage.toggleImpact('${uid}')">
            <div class="cal-day-block">
              <div class="cal-day-num">${dayNum}</div>
              <div class="cal-day-mo">${dayMo}</div>
            </div>
            <div>
              <div class="cal-region">${e.region} <span style="color:var(--text3);font-size:.75rem">${e.country||''}</span></div>
              <div class="cal-event-name">${e.event}</div>
              ${hasData ? `
              <div class="cal-stats">
                ${e.actual   ? `<div class="cal-stat-item"><div class="cal-stat-label">Actual</div><div class="cal-stat-val" style="color:var(--green)">${e.actual}${e.unit||''}</div></div>` : ''}
                ${e.estimate ? `<div class="cal-stat-item"><div class="cal-stat-label">Estimate</div><div class="cal-stat-val">${e.estimate}${e.unit||''}</div></div>` : ''}
                ${e.previous ? `<div class="cal-stat-item"><div class="cal-stat-label">Previous</div><div class="cal-stat-val" style="color:var(--text3)">${e.previous}${e.unit||''}</div></div>` : ''}
              </div>` : ''}
              <div class="event-impact" id="${uid}">
                <div class="impact-title">📊 Market Impact Analysis</div>
                ${e.detail}
              </div>
            </div>
            <div style="display:flex;flex-direction:column;align-items:flex-end;gap:8px">
              <span class="imp-badge ${e.importance}">${e.importance}</span>
              <span style="font-size:.68rem;color:var(--text3)">Click for impact</span>
            </div>
          </div>`;
        }).join('')}
      </div>`).join('');

    setTimeout(() => window.scrollAnimator?.refresh(), 50);
  }

  toggleImpact(uid) {
    const el = document.getElementById(uid);
    if (!el) return;
    el.classList.toggle('open');
  }

  renderUpcoming() {
    const list = document.getElementById('upcomingList');
    if (!list) return;
    const today = new Date().toISOString().split('T')[0];
    const next5 = this.events
      .filter(e => e.date >= today)
      .sort((a,b) => a.date.localeCompare(b.date))
      .slice(0, 5);

    list.innerHTML = next5.map(e => {
      const d = new Date(e.date + 'T00:00:00');
      return `
        <div class="upcoming-item">
          <div class="upcoming-date-block">
            <div class="upcoming-month">${isNaN(d)?'':d.toLocaleString('en-US',{month:'short'})}</div>
            <div class="upcoming-day">${isNaN(d)?'?':d.getDate()}</div>
          </div>
          <div class="upcoming-info">
            <div class="upcoming-event">${e.event}</div>
            <div class="upcoming-detail">${e.region} · <span class="imp-badge ${e.importance}" style="font-size:.6rem;padding:2px 6px">${e.importance}</span></div>
          </div>
        </div>`;
    }).join('');
  }

  // ── FEAR & GREED ──────────────────────────────────────
  async loadFearGreed() {
    try {
      const data    = await window.apiClient.get('/api/fear-greed', 60 * 60 * 1000);
      const current = data.current || {};
      const val     = parseInt(current.value || 50);
      const label   = current.value_classification || 'Neutral';

      const fgColors = {
        'Extreme Fear': 'var(--red)', 'Fear': '#ff8c00',
        'Neutral': 'var(--accent)', 'Greed': '#90ee90',
        'Extreme Greed': 'var(--green)'
      };
      const color = fgColors[label] || 'var(--accent)';

      const valEl  = document.getElementById('fgValue');
      const lblEl  = document.getElementById('fgLabel');
      const indEl  = document.getElementById('fgIndicator');
      const histEl = document.getElementById('fgHistory');

      if (valEl)  { valEl.textContent = val; valEl.style.color = color; }
      if (lblEl)  { lblEl.textContent = label; lblEl.style.color = color; }
      if (indEl)  indEl.style.left = `${val}%`;

      if (histEl && data.history) {
        histEl.innerHTML = data.history.slice(0,7).reverse().map(h => {
          const hv = parseInt(h.value);
          const hc = fgColors[h.value_classification] || 'var(--accent)';
          const hd = new Date(parseInt(h.timestamp)*1000).toLocaleDateString('en-US',{month:'short',day:'numeric'});
          return `<div class="fg-hist-item">
            <div class="fg-hist-val" style="color:${hc}">${hv}</div>
            <div class="fg-hist-date">${hd}</div>
          </div>`;
        }).join('');
      }
    } catch(e) {
      console.warn('Fear & Greed error:', e);
    }
  }

  // ── AI MOOD ───────────────────────────────────────────
  async loadMood() {
    try {
      const data     = await window.apiClient.get('/api/mood', 2*60*60*1000);
      const badge    = document.getElementById('moodBadge');
      const analysis = document.getElementById('moodAnalysis');
      const ts       = document.getElementById('moodTimestamp');
      if (badge)    { badge.className = `mood-badge ${(data.sentiment||'mixed').toLowerCase()}`; badge.textContent = data.sentiment||'Mixed'; }
      if (analysis) { analysis.className = 'mood-analysis'; analysis.textContent = data.analysis||'No analysis.'; }
      if (ts && data.generated_at) ts.textContent = `Last updated: ${new Date(data.generated_at).toLocaleString()}`;
    } catch(e) {
      const badge = document.getElementById('moodBadge');
      const analysis = document.getElementById('moodAnalysis');
      if (badge)    { badge.className = 'mood-badge neutral'; badge.textContent = 'Offline'; }
      if (analysis) { analysis.className = 'mood-analysis'; analysis.textContent = 'Add ANTHROPIC_KEY environment variable to enable AI mood analysis.'; }
    }
  }

  async refreshMood() {
    const badge    = document.getElementById('moodBadge');
    const analysis = document.getElementById('moodAnalysis');
    if (badge)    { badge.className = 'mood-badge mixed skeleton'; badge.textContent = '\u00a0'; }
    if (analysis) { analysis.className = 'mood-analysis skeleton'; analysis.textContent = '\u00a0'; }
    window.apiClient._cache.delete('/api/mood');
    await this.loadMood();
    Toast.show('Market mood refreshed', 'success');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.calendarPage = new CalendarManager();
});

function setCalFilter(f, el) { window.calendarPage?.setFilter(f, el); }
function refreshMood()       { window.calendarPage?.refreshMood(); }
