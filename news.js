// ═══════════════════════════════════════════════════════
// MARKETPULSE — CALENDAR PAGE v8
// Real Finnhub API + Past & Future Events + DeepSeek Analysis
// ═══════════════════════════════════════════════════════

class CalendarManager {
  constructor() {
    this.events      = [];
    this.filter      = 'all';
    this.pickerDate  = new Date();
    this.selectedDay = null;
    this.today       = new Date().toISOString().split('T')[0];

    // Default: past 30 days + next 90 days
    const past   = new Date(); past.setDate(past.getDate() - 30);
    const future = new Date(); future.setDate(future.getDate() + 90);
    const fmt    = d => d.toISOString().split('T')[0];

    const fromEl = document.getElementById('fromDate');
    const toEl   = document.getElementById('toDate');
    if (fromEl) fromEl.value = fmt(past);
    if (toEl)   toEl.value   = fmt(future);

    this.init();
  }

  async init() {
    await Promise.all([this.fetchRange(), this.loadMood()]);
    this.renderPicker();
  }

  // ── FETCH ──────────────────────────────────────────────
  async fetchRange() {
    const fromEl = document.getElementById('fromDate');
    const toEl   = document.getElementById('toDate');
    const from   = fromEl?.value || (() => { const d=new Date(); d.setDate(d.getDate()-30); return d.toISOString().split('T')[0]; })();
    const to     = toEl?.value   || (() => { const d=new Date(); d.setDate(d.getDate()+90); return d.toISOString().split('T')[0]; })();

    const container = document.getElementById('calendarEvents');
    if (container) container.innerHTML = `
      <div style="text-align:center;padding:40px;color:var(--text-muted);font-family:var(--font-mono);font-size:.72rem">
        <div class="spinner-border spinner-border-sm me-2" style="color:var(--amber)"></div>
        FETCHING EVENTS FROM FINNHUB...
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
        <div style="text-align:center;padding:40px;color:var(--text-muted);font-family:var(--font-mono);font-size:.72rem">
          ⚠ BACKEND OFFLINE — RUN: uvicorn main:app --port 8000
        </div>`;
    }
  }

  resetRange() {
    const past   = new Date(); past.setDate(past.getDate() - 30);
    const future = new Date(); future.setDate(future.getDate() + 90);
    const fmt    = d => d.toISOString().split('T')[0];
    const fromEl = document.getElementById('fromDate');
    const toEl   = document.getElementById('toDate');
    if (fromEl) fromEl.value = fmt(past);
    if (toEl)   toEl.value   = fmt(future);
    this.fetchRange();
  }

  // ── CALENDAR PICKER ────────────────────────────────────
  renderPicker() {
    const d     = this.pickerDate;
    const year  = d.getFullYear();
    const month = d.getMonth();
    const title = document.getElementById('pickerTitle');
    const grid  = document.getElementById('pickerGrid');
    if (!title || !grid) return;

    title.textContent = d.toLocaleString('en-US', { month: 'long', year: 'numeric' });

    // Map dates → importance
    const eventDates = {};
    this.events.forEach(e => {
      const key = e.date?.substring(0, 10);
      if (key) {
        if (!eventDates[key] || e.importance === 'high') eventDates[key] = e.importance;
      }
    });

    const firstDay = new Date(year, month, 1).getDay();
    const daysIn   = new Date(year, month + 1, 0).getDate();
    const dayNames = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];

    let html = dayNames.map(d => `<div class="cal-day-header">${d}</div>`).join('');

    // Empty cells before first day
    for (let i = 0; i < firstDay; i++) {
      html += '<div class="cal-day other-month"></div>';
    }

    const todayStr = this.today;

    for (let day = 1; day <= daysIn; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const isToday    = dateStr === todayStr;
      const isSelected = this.selectedDay === dateStr;
      const isPast     = dateStr < todayStr;
      const hasEv      = eventDates[dateStr];

      let cls = 'cal-day';
      if (isPast && !isToday) cls += ' past-day';
      if (isToday)    cls += ' today';
      if (isSelected) cls += ' selected';
      if (hasEv)      cls += ` has-event has-${hasEv}`;

      // Always show the number (no hiding)
      html += `<div class="${cls}" onclick="calendarPage.selectDay('${dateStr}')">
        <span class="cal-day-num-inner">${day}</span>
      </div>`;
    }

    grid.innerHTML = html;
  }

  selectDay(dateStr) {
    this.selectedDay = this.selectedDay === dateStr ? null : dateStr;
    this.renderPicker();

    if (this.selectedDay) {
      const dayEvents = this.events.filter(e => e.date?.startsWith(dateStr));
      if (dayEvents.length) {
        this.renderEvents(dayEvents);
        const d = new Date(dateStr + 'T00:00:00');
        Toast.show(`${dayEvents.length} EVENT(S) — ${d.toLocaleDateString('en-US', {month:'short',day:'numeric',year:'numeric'}).toUpperCase()}`, 'info');
      } else {
        Toast.show('NO EVENTS ON THIS DATE', 'info');
        this.renderEvents();
      }
    } else {
      this.renderEvents();
    }
  }

  prevMonth() {
    this.pickerDate = new Date(this.pickerDate.getFullYear(), this.pickerDate.getMonth() - 1, 1);
    this.renderPicker();
  }

  nextMonth() {
    this.pickerDate = new Date(this.pickerDate.getFullYear(), this.pickerDate.getMonth() + 1, 1);
    this.renderPicker();
  }

  // ── FILTER ─────────────────────────────────────────────
  setFilter(f, el) {
    document.querySelectorAll('.chip-row .chip, .chip-row .chip').forEach(c => c.classList.remove('active'));
    el.classList.add('active');
    this.filter = f;
    this.selectedDay = null;
    this.renderPicker();
    this.renderEvents();
  }

  getFiltered(override) {
    let events = override ? [...override] : [...this.events];
    if (this.filter === 'all') return events;
    if (['high', 'medium', 'low'].includes(this.filter))
      return events.filter(e => e.importance === this.filter);
    const regionMap = { US: '🇺🇸', EU: '🇪🇺', UK: '🇬🇧', CN: '🇨🇳', JP: '🇯🇵' };
    return events.filter(e => e.region === regionMap[this.filter]);
  }

  // ── RENDER EVENTS ───────────────────────────────────────
  renderEvents(override) {
    const filtered  = this.getFiltered(override);
    const container = document.getElementById('calendarEvents');
    const countEl   = document.getElementById('eventCount');
    if (!container) return;
    if (countEl) countEl.textContent = filtered.length;

    if (!filtered.length) {
      container.innerHTML = `<div style="text-align:center;padding:40px;color:var(--text-muted);font-family:var(--font-mono);font-size:.72rem">NO EVENTS MATCH THIS FILTER</div>`;
      return;
    }

    // Group by month-year
    const grouped = {};
    filtered.forEach(e => {
      const d   = new Date((e.date || '').substring(0, 10) + 'T00:00:00');
      const key = isNaN(d) ? 'UNKNOWN' : d.toLocaleString('en-US', { month: 'long', year: 'numeric' }).toUpperCase();
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(e);
    });

    container.innerHTML = Object.entries(grouped).map(([month, evts]) => `
      <div class="cal-group fade-up">
        <div class="cal-group-header">
          ${month}
          ${month.includes(new Date().toLocaleString('en-US',{month:'long',year:'numeric'}).toUpperCase()) ? '<span style="color:var(--amber);margin-left:8px;font-size:.58rem">← CURRENT MONTH</span>' : ''}
        </div>
        ${evts.map((e, idx) => {
          const d      = new Date((e.date || '').substring(0, 10) + 'T00:00:00');
          const dayNum = isNaN(d) ? '?' : d.getDate();
          const dayMo  = isNaN(d) ? '' : d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
          const isPast = e.date < this.today;
          const uid    = `ev-${month.replace(/\s/g, '')}-${idx}`;
          const hasData = e.actual || e.estimate || e.previous;

          return `
          <div class="cal-event ${e.importance} ${isPast ? 'past-event' : ''}" onclick="calendarPage.toggleImpact('${uid}')">
            <div class="cal-date-block">
              <div class="cal-day-num" style="${isPast ? 'color:var(--text-muted)' : ''}">${dayNum}</div>
              <div class="cal-day-mo">${dayMo}</div>
              ${isPast ? '<div style="font-size:.5rem;color:var(--text-muted);letter-spacing:.06em">PAST</div>' : ''}
            </div>
            <div>
              <div class="cal-region">${e.region} <span style="color:var(--text-muted);font-size:.72rem">${e.country || ''}</span></div>
              <div class="cal-event-name" style="${isPast ? 'color:var(--text-secondary)' : ''}">${e.event}</div>
              ${hasData ? `
              <div class="cal-stats">
                ${e.actual   ? `<div class="cal-stat"><span class="lbl">ACTUAL</span><span class="val" style="color:var(--green)">${e.actual}${e.unit || ''}</span></div>` : ''}
                ${e.estimate ? `<div class="cal-stat"><span class="lbl">EST</span><span class="val">${e.estimate}${e.unit || ''}</span></div>` : ''}
                ${e.previous ? `<div class="cal-stat"><span class="lbl">PREV</span><span class="val" style="color:var(--text-muted)">${e.previous}${e.unit || ''}</span></div>` : ''}
              </div>` : ''}
              <div class="event-impact" id="${uid}">
                <div class="impact-title">📊 MARKET IMPACT ANALYSIS</div>
                ${e.detail}
              </div>
            </div>
            <div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px">
              <span class="imp-badge ${e.importance}">${e.importance.toUpperCase()}</span>
              <span style="font-size:.6rem;color:var(--text-muted);font-family:var(--font-mono)">${e.date?.substring(0, 10) || ''}</span>
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

  // ── UPCOMING SIDEBAR ────────────────────────────────────
  renderUpcoming() {
    const list = document.getElementById('upcomingList');
    if (!list) return;
    const next5 = this.events
      .filter(e => e.date >= this.today)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 5);

    list.innerHTML = next5.map(e => {
      const d = new Date(e.date.substring(0, 10) + 'T00:00:00');
      return `
        <div class="up-item">
          <div class="up-date">
            <div class="up-mo">${isNaN(d) ? '' : d.toLocaleString('en-US', { month: 'short' }).toUpperCase()}</div>
            <div class="up-day">${isNaN(d) ? '?' : d.getDate()}</div>
          </div>
          <div class="up-info">
            <div class="up-ev">${e.event}</div>
            <div class="up-sub">${e.region} · <span class="imp-badge ${e.importance}" style="font-size:.58rem;padding:1px 5px">${e.importance.toUpperCase()}</span></div>
          </div>
        </div>`;
    }).join('');
  }

  // ── CSV EXPORT WITH DATES ───────────────────────────────
  exportCSV() {
    if (!this.events.length) { Toast.show('NO EVENTS TO EXPORT', 'warning'); return; }
    const rows = [
      ['Date', 'Day', 'Event', 'Region', 'Country', 'Importance', 'Actual', 'Estimate', 'Previous', 'Unit', 'Market Impact']
    ];
    this.events.forEach(e => {
      const d = new Date((e.date || '').substring(0, 10) + 'T00:00:00');
      const dayName = isNaN(d) ? '' : d.toLocaleDateString('en-US', { weekday: 'long' });
      const dateFormatted = isNaN(d) ? e.date || '' : d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
      rows.push([
        dateFormatted,
        dayName,
        e.event || '',
        e.region || '',
        e.country || '',
        e.importance || '',
        e.actual || '',
        e.estimate || '',
        e.previous || '',
        e.unit || '',
        (e.detail || '').replace(/,/g, ';'),
      ]);
    });
    const csv  = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' }); // BOM for Excel
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    a.download = `economic_calendar_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    Toast.show(`EXPORTED ${this.events.length} EVENTS TO CSV`, 'success');
  }

  // ── AI MOOD ─────────────────────────────────────────────
  async loadMood() {
    try {
      const data     = await window.apiClient.get('/api/mood', 2 * 60 * 60 * 1000);
      const badge    = document.getElementById('moodBadge');
      const analysis = document.getElementById('moodAnalysis');
      const ts       = document.getElementById('moodTimestamp');
      if (badge)    { badge.className = `mood-badge ${(data.sentiment || 'mixed').toLowerCase()}`; badge.textContent = data.sentiment || 'MIXED'; }
      if (analysis) { analysis.className = 'mood-analysis'; analysis.textContent = data.analysis || 'No analysis.'; }
      if (ts && data.generated_at) ts.textContent = `UPDATED: ${new Date(data.generated_at).toLocaleString()}`;
    } catch(e) {
      const badge    = document.getElementById('moodBadge');
      const analysis = document.getElementById('moodAnalysis');
      if (badge)    { badge.className = 'mood-badge neutral'; badge.textContent = 'OFFLINE'; }
      if (analysis) { analysis.className = 'mood-analysis'; analysis.textContent = 'Backend offline or API key missing.'; }
    }
  }

  async refreshMood() {
    const badge    = document.getElementById('moodBadge');
    const analysis = document.getElementById('moodAnalysis');
    if (badge)    { badge.className = 'mood-badge mixed skeleton'; badge.textContent = '\u00a0'; }
    if (analysis) { analysis.className = 'mood-analysis skeleton'; analysis.textContent = '\u00a0'; }
    window.apiClient.invalidate('/api/mood');
    await this.loadMood();
    Toast.show('MOOD REFRESHED', 'success');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.calendarPage = new CalendarManager();
});

function setCalFilter(f, el) { window.calendarPage?.setFilter(f, el); }
function refreshMood()       { window.calendarPage?.refreshMood(); }
function exportCalendarCSV() { window.calendarPage?.exportCSV(); }
