/* ═══════════════════════════════════════════════════════════════
   MARKETPULSE — BLOOMBERG TERMINAL DESIGN SYSTEM
   Aesthetic: Data-dense, monospace-forward, dark financial terminal
   Typography: IBM Plex Mono + IBM Plex Sans
   Palette: Terminal black, phosphor amber, electric blue, signal red
═══════════════════════════════════════════════════════════════ */

@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:ital,wght@0,300;0,400;0,500;0,600;1,400&family=IBM+Plex+Sans:wght@300;400;500;600;700&family=IBM+Plex+Serif:wght@400;600&display=swap');

/* ── VARIABLES ── */
:root {
  /* Terminal blacks */
  --bg:         #080a0e;
  --bg2:        #0c0f15;
  --bg3:        #111520;
  --bg4:        #171c2a;
  --bg5:        #1e2535;

  /* Borders */
  --border:     rgba(255,255,255,0.06);
  --border2:    rgba(255,255,255,0.12);
  --border3:    rgba(255,255,255,0.20);

  /* Bloomberg amber accent */
  --amber:      #f0a500;
  --amber2:     #d48900;
  --amber-dim:  rgba(240,165,0,0.12);
  --amber-glow: 0 0 20px rgba(240,165,0,0.15);

  /* Signal colors */
  --green:      #00c853;
  --green-dim:  rgba(0,200,83,0.12);
  --red:        #ff1744;
  --red-dim:    rgba(255,23,68,0.12);
  --blue:       #2979ff;
  --blue-dim:   rgba(41,121,255,0.12);
  --cyan:       #00e5ff;
  --purple:     #d500f9;

  /* Text */
  --text:       #e8ecf0;
  --text2:      #8896a8;
  --text3:      #4a5568;
  --text4:      #2d3748;

  /* Layout */
  --nav-h:      48px;
  --radius:     4px;
  --radius-md:  6px;
  --radius-lg:  8px;
  --font-mono:  'IBM Plex Mono', monospace;
  --font-sans:  'IBM Plex Sans', sans-serif;
  --font-serif: 'IBM Plex Serif', serif;
  --transition: 0.15s ease;
  --shadow:     0 2px 16px rgba(0,0,0,0.5);
  --shadow-lg:  0 4px 32px rgba(0,0,0,0.7);
}

/* ── LIGHT MODE ── */
[data-theme="light"] {
  --bg:         #f4f5f7;
  --bg2:        #ffffff;
  --bg3:        #f0f1f4;
  --bg4:        #e8eaed;
  --bg5:        #dde0e6;
  --border:     rgba(0,0,0,0.07);
  --border2:    rgba(0,0,0,0.12);
  --border3:    rgba(0,0,0,0.20);
  --text:       #0d1117;
  --text2:      #4a5568;
  --text3:      #9aa3b0;
  --text4:      #c4c9d4;
  --amber-dim:  rgba(240,165,0,0.08);
  --green-dim:  rgba(0,150,60,0.08);
  --red-dim:    rgba(200,0,40,0.08);
  --blue-dim:   rgba(30,90,220,0.08);
  --shadow:     0 2px 12px rgba(0,0,0,0.08);
  --shadow-lg:  0 4px 24px rgba(0,0,0,0.12);
}

/* ── RESET ── */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html { scroll-behavior: smooth; font-size: 14px; }

body {
  font-family: var(--font-sans);
  background: var(--bg);
  color: var(--text);
  min-height: 100vh;
  overflow-x: hidden;
  line-height: 1.5;
}

/* Terminal scanline overlay - subtle atmosphere */
body::before {
  content: '';
  position: fixed; inset: 0;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(0,0,0,0.015) 2px,
    rgba(0,0,0,0.015) 4px
  );
  pointer-events: none;
  z-index: 9999;
  opacity: 0.4;
}

[data-theme="light"] body::before { display: none; }

/* ── SCROLLBAR ── */
::-webkit-scrollbar { width: 4px; height: 4px; }
::-webkit-scrollbar-track { background: var(--bg2); }
::-webkit-scrollbar-thumb { background: var(--bg5); border-radius: 2px; }
::-webkit-scrollbar-thumb:hover { background: var(--text3); }

/* ── TYPOGRAPHY ── */
h1,h2,h3,h4,h5,h6 { font-family: var(--font-sans); font-weight: 600; line-height: 1.25; }
.mono { font-family: var(--font-mono); }
a { color: inherit; text-decoration: none; }
code { font-family: var(--font-mono); font-size: 0.85em; color: var(--amber); background: var(--amber-dim); padding: 1px 5px; border-radius: 3px; }

/* ── TOP STATUS BAR ── */
.status-bar {
  height: 26px;
  background: var(--bg3);
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  padding: 0 16px;
  gap: 20px;
  font-family: var(--font-mono);
  font-size: 0.7rem;
  color: var(--text3);
  overflow: hidden;
}

.status-bar-item { display: flex; align-items: center; gap: 5px; white-space: nowrap; }
.status-bar-item .label { color: var(--text3); }
.status-bar-item .value { color: var(--text2); font-weight: 500; }
.status-bar-item.positive .value { color: var(--green); }
.status-bar-item.negative .value { color: var(--red); }
.status-bar-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--green); animation: dot-pulse 2s ease-in-out infinite; flex-shrink: 0; }
@keyframes dot-pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }

/* ── NAVBAR ── */
.navbar {
  position: sticky; top: 0; z-index: 1000;
  height: var(--nav-h);
  background: var(--bg2);
  border-bottom: 2px solid var(--amber);
  display: flex; align-items: center;
  padding: 0 16px;
  gap: 0;
}

.navbar-brand {
  font-family: var(--font-mono);
  font-size: 1rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  color: var(--text) !important;
  margin-right: 24px;
  flex-shrink: 0;
}

.navbar-brand .accent { color: var(--amber); }
.navbar-brand .version { color: var(--text3); font-size: 0.65rem; margin-left: 4px; vertical-align: super; }

.nav-divider { width: 1px; height: 20px; background: var(--border2); margin: 0 4px; flex-shrink: 0; }

.navbar-nav { display: flex; align-items: center; gap: 0; list-style: none; flex: 1; }

.nav-link {
  font-family: var(--font-mono);
  font-size: 0.72rem;
  font-weight: 400;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--text3) !important;
  padding: 0 12px !important;
  height: var(--nav-h);
  display: flex !important;
  align-items: center;
  gap: 6px;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  transition: all var(--transition);
  white-space: nowrap;
}

.nav-link:hover { color: var(--text) !important; background: var(--bg3); }
.nav-link.active { color: var(--amber) !important; border-bottom-color: var(--amber); background: var(--amber-dim); }
.nav-link i { font-size: 0.8rem; }

.nav-clock {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  color: var(--text2);
  letter-spacing: 0.05em;
  margin-left: auto;
  padding: 0 12px;
  white-space: nowrap;
}

.nav-clock .date { color: var(--text3); margin-right: 6px; }

.theme-toggle {
  background: none;
  border: 1px solid var(--border2);
  color: var(--text3);
  width: 28px; height: 28px;
  border-radius: var(--radius);
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  font-size: 0.8rem;
  transition: all var(--transition);
  flex-shrink: 0;
}

.theme-toggle:hover { border-color: var(--amber); color: var(--amber); }

/* ── HAMBURGER ── */
.navbar-toggler {
  background: var(--bg3) !important;
  border: 1px solid var(--border2) !important;
  color: var(--text2) !important;
  width: 32px; height: 32px;
  border-radius: var(--radius) !important;
  display: flex; align-items: center; justify-content: center;
  padding: 0 !important;
  transition: all var(--transition);
}

.navbar-toggler:hover { border-color: var(--amber) !important; color: var(--amber) !important; }
.navbar-toggler:focus { box-shadow: none !important; }
.navbar-toggler i { font-size: 1.1rem; }

/* ── DRAWER ── */
.drawer-overlay {
  display: none; position: fixed; inset: 0;
  background: rgba(0,0,0,0.7); backdrop-filter: blur(4px);
  z-index: 1040; opacity: 0; transition: opacity 0.2s ease;
}
.drawer-overlay.open { display: block; opacity: 1; }

.nav-drawer {
  position: fixed; top: 0; right: -300px; width: 280px; height: 100vh;
  background: var(--bg2);
  border-left: 2px solid var(--amber);
  z-index: 1050;
  display: flex; flex-direction: column;
  transition: right 0.25s cubic-bezier(0.4,0,0.2,1);
  font-family: var(--font-mono);
}

.nav-drawer.open { right: 0; }

.drawer-header {
  padding: 14px 16px;
  border-bottom: 1px solid var(--border);
  display: flex; align-items: center; justify-content: space-between;
  background: var(--bg3);
}

.drawer-brand { font-size: 0.9rem; font-weight: 600; letter-spacing: 0.08em; }
.drawer-brand .accent { color: var(--amber); }

.drawer-close {
  background: var(--bg4); border: 1px solid var(--border2);
  color: var(--text2); width: 28px; height: 28px;
  border-radius: var(--radius); cursor: pointer;
  display: flex; align-items: center; justify-content: center; font-size: 0.8rem;
  transition: all var(--transition);
}
.drawer-close:hover { border-color: var(--red); color: var(--red); }

.drawer-nav { flex: 1; padding: 8px; overflow-y: auto; }

.drawer-link {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 12px; border-radius: var(--radius);
  color: var(--text2); font-size: 0.72rem; letter-spacing: 0.06em;
  text-transform: uppercase; text-decoration: none;
  transition: all var(--transition); margin-bottom: 2px;
  position: relative;
}
.drawer-link i { font-size: 0.85rem; width: 16px; text-align: center; }
.drawer-link:hover { background: var(--bg3); color: var(--text); }
.drawer-link.active { background: var(--amber-dim); color: var(--amber); border-left: 2px solid var(--amber); }
.drawer-active-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--amber); margin-left: auto; box-shadow: 0 0 6px var(--amber); }

.drawer-footer {
  padding: 12px 16px; border-top: 1px solid var(--border);
  display: flex; align-items: center; justify-content: space-between;
}

.drawer-theme-btn {
  background: var(--bg3); border: 1px solid var(--border2);
  color: var(--text2); padding: 6px 12px;
  border-radius: var(--radius); font-size: 0.7rem;
  cursor: pointer; font-family: var(--font-mono);
  transition: all var(--transition); display: flex; align-items: center; gap: 6px;
}
.drawer-theme-btn:hover { border-color: var(--amber); color: var(--amber); }
.drawer-clock { font-size: 0.68rem; color: var(--text3); }

/* ── PAGE LAYOUT ── */
.page { position: relative; }
.container-fluid { max-width: 1600px; }
main { padding: 0; }

/* ── PANEL SYSTEM (Bloomberg-style bordered panels) ── */
.panel {
  background: var(--bg2);
  border: 1px solid var(--border2);
  border-radius: var(--radius);
  overflow: hidden;
}

.panel-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 8px 14px;
  background: var(--bg3);
  border-bottom: 1px solid var(--border);
  font-family: var(--font-mono);
  font-size: 0.68rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--text3);
}

.panel-header .title { color: var(--amber); font-weight: 600; }
.panel-header .actions { display: flex; gap: 6px; }
.panel-body { padding: 14px; }

/* ── SECTION LABEL ── */
.section-label {
  font-family: var(--font-mono);
  font-size: 0.65rem;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--amber);
  padding: 4px 0 12px;
  display: flex;
  align-items: center;
  gap: 10px;
}
.section-label::after { content: ''; flex: 1; height: 1px; background: var(--border); }
.section-label .count { color: var(--text3); font-size: 0.6rem; }

/* ── DATA TABLE ── */
.data-table {
  width: 100%;
  border-collapse: collapse;
  font-family: var(--font-mono);
}

.data-table th {
  font-size: 0.62rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--text3);
  padding: 6px 10px;
  border-bottom: 1px solid var(--border);
  text-align: left;
  cursor: pointer;
  white-space: nowrap;
  user-select: none;
  background: var(--bg3);
}

.data-table th:hover { color: var(--text2); }
.data-table th.sorted { color: var(--amber); }

.data-table tr.row {
  cursor: pointer;
  transition: background var(--transition);
  border-bottom: 1px solid var(--border);
}
.data-table tr.row:hover td { background: var(--bg3); }
.data-table tr.row:last-child { border-bottom: none; }

.data-table td {
  padding: 8px 10px;
  font-size: 0.8rem;
  vertical-align: middle;
}

/* ── ASSET CELL ── */
.asset-cell { display: flex; align-items: center; gap: 8px; }
.asset-ico {
  width: 28px; height: 28px; border-radius: 50%;
  background: var(--bg4); border: 1px solid var(--border2);
  display: flex; align-items: center; justify-content: center;
  overflow: hidden; flex-shrink: 0;
  font-size: 0.6rem; font-weight: 700; color: var(--amber);
}
.asset-ico img { width: 100%; height: 100%; object-fit: cover; border-radius: 50%; }
.asset-name { font-size: 0.78rem; font-weight: 600; display: block; font-family: var(--font-sans); }
.asset-sym  { font-size: 0.65rem; color: var(--text3); }

/* ── PRICE CELLS ── */
.price-cell { font-size: 0.82rem; font-weight: 500; }
.change-up   { color: var(--green); }
.change-down { color: var(--red); }
.muted-cell  { color: var(--text3); font-size: 0.72rem; }

/* ── CHANGE BADGES ── */
.badge-up, .badge-down, .badge-neu {
  display: inline-flex; align-items: center; gap: 2px;
  padding: 1px 5px; border-radius: 2px;
  font-family: var(--font-mono); font-size: 0.7rem; font-weight: 500;
}
.badge-up   { background: var(--green-dim); color: var(--green); }
.badge-down { background: var(--red-dim);   color: var(--red); }
.badge-neu  { background: var(--bg4);       color: var(--text3); }

/* ── BUTTONS ── */
.btn-terminal {
  font-family: var(--font-mono);
  font-size: 0.68rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 5px 12px;
  border-radius: var(--radius);
  border: 1px solid var(--border2);
  background: var(--bg3);
  color: var(--text2);
  cursor: pointer;
  transition: all var(--transition);
  display: inline-flex; align-items: center; gap: 6px;
  white-space: nowrap;
}
.btn-terminal:hover { border-color: var(--amber); color: var(--amber); }
.btn-terminal.active { background: var(--amber-dim); border-color: var(--amber); color: var(--amber); }
.btn-terminal.danger:hover { border-color: var(--red); color: var(--red); }

.btn-primary {
  background: var(--amber); color: #000;
  border-color: var(--amber); font-weight: 600;
}
.btn-primary:hover { background: var(--amber2); border-color: var(--amber2); color: #000; }

/* ── FILTER CHIPS ── */
.chip-row { display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 14px; }

.chip {
  font-family: var(--font-mono);
  font-size: 0.65rem; letter-spacing: 0.08em; text-transform: uppercase;
  padding: 4px 10px; border-radius: 2px;
  border: 1px solid var(--border2);
  background: var(--bg3); color: var(--text3);
  cursor: pointer; transition: all var(--transition);
}
.chip:hover { border-color: var(--amber); color: var(--amber); }
.chip.active { background: var(--amber-dim); border-color: var(--amber); color: var(--amber); font-weight: 600; }

/* ── SEARCH INPUT ── */
.terminal-search {
  display: flex; align-items: center;
  background: var(--bg3); border: 1px solid var(--border2);
  border-radius: var(--radius); padding: 6px 12px; gap: 8px;
  transition: all var(--transition);
}
.terminal-search:focus-within { border-color: var(--amber); box-shadow: 0 0 0 2px var(--amber-dim); }
.terminal-search input {
  background: none; border: none; outline: none;
  color: var(--text); font-family: var(--font-mono); font-size: 0.78rem;
  flex: 1;
}
.terminal-search input::placeholder { color: var(--text3); }
.terminal-search .s-icon { color: var(--text3); font-size: 0.75rem; }
.terminal-search .s-clear {
  background: none; border: none; color: var(--text3); cursor: pointer;
  font-size: 0.75rem; padding: 0; transition: color var(--transition); display: none;
}
.terminal-search.has-value .s-clear { display: block; }
.terminal-search .s-clear:hover { color: var(--red); }

/* ── KPI CARDS ── */
.kpi-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px,1fr)); gap: 1px; background: var(--border); }
.kpi-cell {
  background: var(--bg2); padding: 12px 14px;
  transition: background var(--transition);
}
.kpi-cell:hover { background: var(--bg3); }
.kpi-label { font-family: var(--font-mono); font-size: 0.6rem; letter-spacing: 0.12em; text-transform: uppercase; color: var(--text3); margin-bottom: 4px; }
.kpi-value { font-family: var(--font-mono); font-size: 1.15rem; font-weight: 600; color: var(--text); }
.kpi-sub   { font-family: var(--font-mono); font-size: 0.68rem; margin-top: 2px; }

/* ── TICKER TAPE ── */
.ticker-tape {
  background: var(--bg3);
  border-top: 1px solid var(--border);
  border-bottom: 1px solid var(--amber);
  height: 30px; overflow: hidden;
  display: flex; align-items: center;
}
.ticker-inner {
  display: flex; gap: 0;
  animation: ticker-scroll 60s linear infinite;
  width: max-content;
}
.ticker-inner:hover { animation-play-state: paused; }
@keyframes ticker-scroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }

.ticker-item {
  display: flex; align-items: center; gap: 6px;
  padding: 0 16px; border-right: 1px solid var(--border);
  white-space: nowrap; font-family: var(--font-mono); font-size: 0.68rem;
}
.ticker-sym  { color: var(--amber); font-weight: 600; }
.ticker-price { color: var(--text2); }
.ticker-chg  { font-size: 0.65rem; }

/* ── SPARKLINE ── */
.spark-cell { width: 80px; }
.spark-cell canvas { display: block; }

/* ── NEWS CARDS ── */
.news-card {
  background: var(--bg2); border: 1px solid var(--border);
  border-radius: var(--radius); overflow: hidden;
  cursor: pointer; transition: all var(--transition);
  display: flex; flex-direction: column;
}
.news-card:hover { border-color: var(--amber); transform: translateY(-1px); box-shadow: var(--shadow); }

.news-img { height: 150px; background: var(--bg3); overflow: hidden; flex-shrink: 0; }
.news-img img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.4s ease; }
.news-card:hover .news-img img { transform: scale(1.04); }
.news-img-placeholder { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 2rem; background: var(--bg4); }

.news-body { padding: 12px 14px; flex: 1; display: flex; flex-direction: column; }
.news-source { font-family: var(--font-mono); font-size: 0.62rem; color: var(--amber); letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 5px; }
.news-title  { font-size: 0.82rem; font-weight: 500; line-height: 1.45; flex: 1; margin-bottom: 8px; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
.news-meta   { font-family: var(--font-mono); font-size: 0.65rem; color: var(--text3); display: flex; justify-content: space-between; border-top: 1px solid var(--border); padding-top: 8px; margin-top: auto; }

/* ── VIDEO CARDS ── */
.video-card { background: var(--bg2); border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; cursor: pointer; transition: all var(--transition); }
.video-card:hover { border-color: var(--amber); transform: translateY(-1px); box-shadow: var(--shadow); }
.video-thumb { position: relative; padding-top: 56.25%; overflow: hidden; background: var(--bg3); }
.video-thumb img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; transition: transform 0.4s; }
.video-card:hover .video-thumb img { transform: scale(1.04); }
.video-play { position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); width: 40px; height: 40px; border-radius: 50%; background: rgba(0,0,0,0.75); border: 2px solid rgba(255,255,255,0.4); display: flex; align-items: center; justify-content: center; transition: all var(--transition); pointer-events: none; }
.video-play i { color: #fff; font-size: 1rem; margin-left: 2px; }
.video-card:hover .video-play { background: rgba(240,165,0,0.85); border-color: var(--amber); }
.video-duration { position: absolute; bottom: 6px; right: 6px; background: rgba(0,0,0,0.85); color: #fff; font-family: var(--font-mono); font-size: 0.62rem; padding: 1px 5px; border-radius: 2px; }
.video-body { padding: 10px 12px; }
.video-channel { font-family: var(--font-mono); font-size: 0.62rem; color: var(--amber); letter-spacing: 0.06em; text-transform: uppercase; margin-bottom: 4px; display: flex; align-items: center; gap: 4px; }
.video-title { font-size: 0.8rem; font-weight: 500; line-height: 1.4; margin-bottom: 6px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.video-meta { font-family: var(--font-mono); font-size: 0.62rem; color: var(--text3); display: flex; justify-content: space-between; }

/* ── CALENDAR EVENTS ── */
.cal-event {
  background: var(--bg2); border: 1px solid var(--border);
  border-left: 3px solid transparent;
  border-radius: var(--radius);
  padding: 10px 14px; margin-bottom: 6px;
  display: grid; grid-template-columns: 52px 1fr auto;
  gap: 12px; align-items: start;
  cursor: pointer; transition: all var(--transition);
}
.cal-event:hover { border-color: var(--border2); background: var(--bg3); }
.cal-event.high   { border-left-color: var(--red); }
.cal-event.medium { border-left-color: var(--amber); }
.cal-event.low    { border-left-color: var(--blue); }

.cal-date-block { text-align: center; }
.cal-day-num { font-family: var(--font-mono); font-size: 1.5rem; font-weight: 600; line-height: 1; color: var(--text); }
.cal-day-mo  { font-family: var(--font-mono); font-size: 0.58rem; letter-spacing: 0.1em; text-transform: uppercase; color: var(--amber); }

.cal-event-name { font-size: 0.82rem; font-weight: 600; margin-bottom: 3px; }
.cal-region  { font-size: 0.72rem; color: var(--text3); margin-bottom: 4px; }
.cal-detail  { font-size: 0.72rem; color: var(--text2); line-height: 1.45; }
.cal-stats   { display: flex; gap: 10px; margin-top: 8px; flex-wrap: wrap; }
.cal-stat    { font-family: var(--font-mono); font-size: 0.65rem; }
.cal-stat .lbl { color: var(--text3); margin-right: 3px; text-transform: uppercase; letter-spacing: 0.06em; }
.cal-stat .val { color: var(--text); font-weight: 500; }

.imp-badge {
  font-family: var(--font-mono); font-size: 0.6rem; font-weight: 600;
  letter-spacing: 0.1em; text-transform: uppercase;
  padding: 2px 6px; border-radius: 2px; white-space: nowrap;
}
.imp-badge.high   { background: var(--red-dim);   color: var(--red); }
.imp-badge.medium { background: var(--amber-dim);  color: var(--amber); }
.imp-badge.low    { background: var(--blue-dim);   color: var(--blue); }

.event-impact { display: none; padding: 10px 12px; background: var(--bg4); border-radius: var(--radius); margin-top: 10px; font-size: 0.75rem; color: var(--text2); line-height: 1.55; border-left: 2px solid var(--amber); }
.event-impact.open { display: block; }
.impact-title { font-family: var(--font-mono); font-size: 0.6rem; letter-spacing: 0.1em; text-transform: uppercase; color: var(--amber); margin-bottom: 5px; }

/* ── MODAL ── */
.modal-overlay {
  display: none; position: fixed; inset: 0;
  background: rgba(0,0,0,0.8); backdrop-filter: blur(6px);
  z-index: 2000; align-items: center; justify-content: center; padding: 20px;
}
.modal-overlay.open { display: flex; }

.modal-box {
  background: var(--bg2);
  border: 1px solid var(--amber);
  border-top: 3px solid var(--amber);
  border-radius: var(--radius);
  width: min(740px, 100%);
  max-height: 90vh; overflow-y: auto;
  animation: modal-in 0.2s ease;
  position: relative;
}
@keyframes modal-in { from { opacity:0; transform:scale(0.96) translateY(8px); } to { opacity:1; transform:scale(1) translateY(0); } }

.modal-head { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border-bottom: 1px solid var(--border); background: var(--bg3); }
.modal-title { font-family: var(--font-mono); font-size: 0.85rem; font-weight: 600; color: var(--amber); letter-spacing: 0.05em; }
.modal-close { background: var(--bg4); border: 1px solid var(--border2); color: var(--text2); width: 26px; height: 26px; border-radius: var(--radius); cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; transition: all var(--transition); }
.modal-close:hover { border-color: var(--red); color: var(--red); }
.modal-body { padding: 16px; }

.modal-stats { display: grid; grid-template-columns: repeat(3,1fr); gap: 8px; margin-top: 14px; }
.modal-stat { background: var(--bg3); border: 1px solid var(--border); border-radius: var(--radius); padding: 10px 12px; }
.modal-stat .lbl { font-family: var(--font-mono); font-size: 0.6rem; letter-spacing: 0.1em; text-transform: uppercase; color: var(--text3); margin-bottom: 3px; }
.modal-stat .val { font-family: var(--font-mono); font-size: 0.9rem; font-weight: 500; }

/* ── SKELETON ── */
.skeleton {
  background: linear-gradient(90deg, var(--bg3) 25%, var(--bg4) 50%, var(--bg3) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s ease-in-out infinite;
  border-radius: var(--radius);
}
@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

/* ── TOAST ── */
.toast-container { position: fixed; bottom: 16px; right: 16px; z-index: 9998; display: flex; flex-direction: column; gap: 6px; }
.toast-mp {
  background: var(--bg3); border: 1px solid var(--border2); border-left: 3px solid var(--amber);
  border-radius: var(--radius); padding: 10px 14px;
  font-family: var(--font-mono); font-size: 0.72rem;
  min-width: 200px; max-width: 300px;
  box-shadow: var(--shadow);
  display: flex; align-items: center; gap: 8px;
  animation: toast-in 0.25s ease;
}
@keyframes toast-in { from{opacity:0;transform:translateX(20px)} to{opacity:1;transform:translateX(0)} }

/* ── FADE UP ANIMATION ── */
.fade-up { opacity: 0; transform: translateY(16px); transition: opacity 0.4s ease, transform 0.4s ease; }
.fade-up.visible { opacity: 1; transform: translateY(0); }
.fade-up-delay-1 { transition-delay: 0.08s; }
.fade-up-delay-2 { transition-delay: 0.16s; }
.fade-up-delay-3 { transition-delay: 0.24s; }

/* ── FEAR & GREED WIDGET ── */
.fg-bar { height: 6px; border-radius: 3px; background: linear-gradient(to right,#ff1744,#ff8f00,#f0a500,#69f0ae,#00c853); position: relative; margin: 10px 0 4px; }
.fg-indicator { position: absolute; top: -4px; width: 14px; height: 14px; border-radius: 50%; background: var(--text); border: 2px solid var(--bg); transition: left 0.5s ease; transform: translateX(-50%); }

/* ── HEATMAP ── */
.heatmap-grid { display: grid; grid-template-columns: repeat(auto-fill,minmax(80px,1fr)); gap: 3px; }
.hm-cell { border-radius: var(--radius); padding: 8px 6px; text-align: center; cursor: default; transition: all var(--transition); }
.hm-cell:hover { transform: scale(1.06); }
.hm-sym { font-family: var(--font-mono); font-weight: 600; font-size: 0.72rem; margin-bottom: 3px; }
.hm-pct { font-family: var(--font-mono); font-size: 0.8rem; font-weight: 500; }

/* ── FOOTER ── */
footer {
  background: var(--bg2);
  border-top: 2px solid var(--amber);
  padding: 24px 0 16px;
  margin-top: 60px;
  font-family: var(--font-mono);
}
.footer-brand { font-size: 0.9rem; font-weight: 600; letter-spacing: 0.08em; }
.footer-brand .accent { color: var(--amber); }
footer p { color: var(--text3); font-size: 0.68rem; }
footer a { color: var(--text3); transition: color var(--transition); }
footer a:hover { color: var(--amber); }

/* ── RESPONSIVE ── */
@media (max-width: 992px) {
  .navbar-nav { display: none; }
  .nav-clock { display: none; }
}
@media (max-width: 768px) {
  .data-table th:nth-child(n+6), .data-table td:nth-child(n+6) { display: none; }
  .modal-stats { grid-template-columns: 1fr 1fr; }
  .kpi-grid { grid-template-columns: repeat(2,1fr); }
}

/* ── LIGHT MODE OVERRIDES ── */
[data-theme="light"] .panel { box-shadow: 0 1px 8px rgba(0,0,0,0.06); }
[data-theme="light"] .data-table th { background: var(--bg3); }
[data-theme="light"] .ticker-tape { background: var(--bg3); }
[data-theme="light"] footer { background: var(--bg2); }

/* ── SMOOTH TRANSITIONS ── */
body, .panel, .kpi-cell, .news-card, .video-card, .cal-event, .chip, .btn-terminal {
  transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease;
}

/* ═══════════════════════════════════════════════════════════════
   UI POLISH PASS v6.1 — Spacing, Alignment, Component Fixes
═══════════════════════════════════════════════════════════════ */

/* ── TOOLS PAGE POLISH ── */
.tool-card {
  background: var(--bg2);
  border: 1px solid var(--border2);
  border-radius: var(--radius-lg);
  padding: 20px 22px;
  transition: border-color var(--transition), box-shadow var(--transition);
}
.tool-card:hover { border-color: var(--border3); box-shadow: 0 2px 20px rgba(0,0,0,0.3); }
.tool-title {
  font-family: var(--font-mono);
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--amber);
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--border);
}
.tool-icon { font-size: 1rem; }

.tools-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: 16px;
  padding: 16px;
}

/* Tool inputs — unified style */
.conv-input, .port-input {
  background: var(--bg3);
  border: 1px solid var(--border2);
  color: var(--text);
  padding: 8px 12px;
  border-radius: var(--radius);
  font-family: var(--font-mono);
  font-size: 0.82rem;
  width: 100%;
  outline: none;
  transition: border-color var(--transition), box-shadow var(--transition);
}
.conv-input:focus, .port-input:focus {
  border-color: var(--amber);
  box-shadow: 0 0 0 2px rgba(240,165,0,0.1);
}
.conv-input::placeholder, .port-input::placeholder {
  color: var(--text3);
  font-size: 0.75rem;
}

.conv-select {
  background: var(--bg3);
  border: 1px solid var(--border2);
  color: var(--text);
  padding: 8px 12px;
  border-radius: var(--radius);
  font-family: var(--font-mono);
  font-size: 0.78rem;
  width: 100%;
  outline: none;
  cursor: pointer;
  transition: border-color var(--transition);
}
.conv-select:focus { border-color: var(--amber); }

.conv-result {
  background: var(--bg3);
  border: 1px solid var(--border2);
  border-radius: var(--radius);
  padding: 14px;
  text-align: center;
  font-family: var(--font-mono);
  font-size: 1.4rem;
  font-weight: 700;
  color: var(--amber);
  margin-top: 10px;
  letter-spacing: 0.02em;
}

.conv-rate {
  font-family: var(--font-mono);
  font-size: 0.65rem;
  color: var(--text3);
  text-align: center;
  margin-top: 6px;
  letter-spacing: 0.04em;
}

.conv-swap {
  background: var(--bg4);
  border: 1px solid var(--border2);
  color: var(--text2);
  width: 34px; height: 34px;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  transition: all var(--transition);
  font-size: 1rem;
  flex-shrink: 0;
  align-self: flex-end;
  margin-bottom: 2px;
}
.conv-swap:hover { border-color: var(--amber); color: var(--amber); transform: rotate(180deg); }

/* ── PORTFOLIO ITEMS ── */
.portfolio-item {
  display: flex; align-items: center; gap: 10px;
  padding: 8px 12px;
  background: var(--bg3);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  margin-bottom: 6px;
  transition: border-color var(--transition);
}
.portfolio-item:hover { border-color: var(--border2); }
.port-sym { font-family: var(--font-mono); font-weight: 700; min-width: 44px; font-size: 0.75rem; color: var(--amber); letter-spacing: 0.06em; }
.port-info { flex: 1; font-size: 0.72rem; color: var(--text2); line-height: 1.4; }
.port-pnl  { font-family: var(--font-mono); font-size: 0.75rem; font-weight: 600; text-align: right; }
.port-del  { background: none; border: none; color: var(--text3); cursor: pointer; font-size: 0.8rem; transition: color var(--transition); padding: 4px; flex-shrink: 0; }
.port-del:hover { color: var(--red); }

.port-total {
  background: var(--bg3);
  border: 1px solid var(--border2);
  border-radius: var(--radius);
  padding: 12px;
  text-align: center;
  margin-top: 10px;
}

/* ── GAS GRID ── */
.gas-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 8px; }
.gas-item  { background: var(--bg3); border: 1px solid var(--border); border-radius: var(--radius); padding: 12px 10px; text-align: center; }
.gas-label { font-family: var(--font-mono); font-size: 0.6rem; color: var(--text3); text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 6px; }
.gas-val   { font-family: var(--font-mono); font-size: 1.2rem; font-weight: 700; line-height: 1; }
.gas-val.slow   { color: var(--blue); }
.gas-val.normal { color: var(--amber); }
.gas-val.fast   { color: var(--red); }
.gas-unit { font-family: var(--font-mono); font-size: 0.6rem; color: var(--text3); margin-top: 3px; }

/* ── ALERT ITEMS ── */
.alert-item {
  display: flex; align-items: center; gap: 10px;
  padding: 8px 12px;
  background: var(--bg3);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  margin-bottom: 6px;
  transition: all var(--transition);
}
.alert-item:hover { border-color: var(--amber); }
.alert-info { flex: 1; font-size: 0.75rem; }
.alert-sym  { font-family: var(--font-mono); font-weight: 700; color: var(--amber); }
.alert-del  { background: none; border: none; color: var(--text3); cursor: pointer; transition: color var(--transition); font-size: 0.8rem; }
.alert-del:hover { color: var(--red); }

/* ── NOTE ITEMS ── */
.notes-list { display: flex; flex-direction: column; gap: 6px; max-height: 260px; overflow-y: auto; }
.note-item  { background: var(--bg3); border-left: 2px solid var(--amber); border-radius: 0 var(--radius) var(--radius) 0; padding: 8px 12px; font-size: 0.78rem; }
.note-sym   { font-family: var(--font-mono); font-weight: 700; color: var(--amber); font-size: 0.65rem; margin-bottom: 3px; letter-spacing: 0.06em; }
.note-text  { color: var(--text2); line-height: 1.45; }
.note-time  { font-family: var(--font-mono); font-size: 0.6rem; color: var(--text3); margin-top: 4px; }

/* ── EXPORT BUTTONS ── */
.export-options { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.export-btn {
  background: var(--bg3);
  border: 1px solid var(--border2);
  color: var(--text2);
  padding: 12px 10px;
  border-radius: var(--radius);
  cursor: pointer;
  transition: all var(--transition);
  font-family: var(--font-mono);
  font-size: 0.68rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  display: flex; align-items: center; justify-content: center; gap: 6px;
}
.export-btn:hover { border-color: var(--amber); color: var(--amber); background: var(--amber-dim); }

/* ── HEATMAP ── */
.heatmap-grid { display: grid; grid-template-columns: repeat(auto-fill,minmax(76px,1fr)); gap: 4px; }
.hm-cell { border-radius: var(--radius); padding: 9px 6px; text-align: center; cursor: default; transition: transform var(--transition); }
.hm-cell:hover { transform: scale(1.06); }
.hm-sym { font-family: var(--font-mono); font-weight: 700; font-size: 0.7rem; margin-bottom: 3px; }
.hm-pct { font-family: var(--font-mono); font-size: 0.78rem; font-weight: 500; }

/* ── PAGE BARS (universal) ── */
.page-bar {
  background: var(--bg2);
  border-bottom: 1px solid var(--border);
  padding: 8px 16px;
  display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
  position: sticky; top: var(--nav-h); z-index: 10;
}
.page-bar h1 {
  font-family: var(--font-mono);
  font-size: 0.82rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  color: var(--amber);
  margin: 0;
  display: flex; align-items: center; gap: 8px;
}

/* ── SEARCH RESULTS ── */
.result-item {
  background: var(--bg2);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 12px 16px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: all var(--transition);
  display: flex; align-items: center; gap: 14px;
}
.result-item:hover { border-color: var(--amber); transform: translateX(3px); }
.result-icon { width: 40px; height: 40px; border-radius: var(--radius); background: var(--bg4); display: flex; align-items: center; justify-content: center; font-size: 1.1rem; flex-shrink: 0; overflow: hidden; }
.result-icon img { width: 100%; height: 100%; object-fit: cover; border-radius: var(--radius); }
.result-body { flex: 1; }
.result-type  { font-family: var(--font-mono); font-size: 0.6rem; color: var(--amber); letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 3px; }
.result-title { font-size: 0.85rem; font-weight: 500; margin-bottom: 2px; }
.result-sub   { font-family: var(--font-mono); font-size: 0.65rem; color: var(--text3); }

/* ── CALENDAR POLISH ── */
.cal-picker-wrap {
  background: var(--bg2);
  border: 1px solid var(--border2);
  border-radius: var(--radius-lg);
  padding: 16px;
  margin-bottom: 20px;
}
.cal-picker-header {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 14px;
}
.cal-picker-title { font-family: var(--font-mono); font-size: 0.8rem; font-weight: 600; color: var(--amber); letter-spacing: 0.06em; }
.cal-nav-btn {
  background: var(--bg3); border: 1px solid var(--border2);
  color: var(--text2); width: 28px; height: 28px;
  border-radius: var(--radius); cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  font-size: 0.75rem; transition: all var(--transition);
}
.cal-nav-btn:hover { border-color: var(--amber); color: var(--amber); }
.cal-grid { display: grid; grid-template-columns: repeat(7,1fr); gap: 3px; }
.cal-day-header { text-align: center; font-family: var(--font-mono); font-size: 0.58rem; color: var(--text3); padding: 5px 0; letter-spacing: 0.08em; text-transform: uppercase; }
.cal-day { text-align: center; padding: 7px 4px; border-radius: var(--radius); cursor: pointer; font-family: var(--font-mono); font-size: 0.78rem; transition: all var(--transition); position: relative; min-height: 32px; display: flex; align-items: center; justify-content: center; }
.cal-day:hover { background: var(--bg3); }
.cal-day.other-month { color: var(--text4); }
.cal-day.today { background: var(--amber-dim); color: var(--amber); font-weight: 700; border: 1px solid rgba(240,165,0,0.3); }
.cal-day.selected { background: var(--amber); color: #000; font-weight: 700; }
.cal-day.has-event::after { content: ''; position: absolute; bottom: 2px; left: 50%; transform: translateX(-50%); width: 4px; height: 4px; border-radius: 50%; }
.cal-day.has-high::after   { background: var(--red); }
.cal-day.has-medium::after { background: var(--amber); }
.cal-day.has-low::after    { background: var(--blue); }

/* ── DATE INPUT ── */
.date-input {
  background: var(--bg3); border: 1px solid var(--border2);
  color: var(--text); padding: 7px 12px;
  border-radius: var(--radius); font-family: var(--font-mono); font-size: 0.75rem;
  outline: none; cursor: pointer; transition: border-color var(--transition);
}
.date-input:focus { border-color: var(--amber); }

/* ── UPCOMING SIDEBAR ── */
.upcoming-card { background: var(--bg2); border: 1px solid var(--border2); border-radius: var(--radius-lg); padding: 16px; position: sticky; top: calc(var(--nav-h) + 48px); }
.upcoming-card h3 { font-family: var(--font-mono); font-size: 0.68rem; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: var(--amber); margin-bottom: 14px; }
.upcoming-item { display: flex; gap: 12px; align-items: flex-start; padding: 10px 0; border-bottom: 1px solid var(--border); }
.upcoming-item:last-child { border-bottom: none; }
.upcoming-date-block { text-align: center; background: var(--bg3); border: 1px solid var(--border2); border-radius: var(--radius); padding: 5px 8px; min-width: 42px; flex-shrink: 0; }
.upcoming-month { font-family: var(--font-mono); font-size: 0.52rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: var(--amber); }
.upcoming-day   { font-family: var(--font-mono); font-size: 1.1rem; font-weight: 700; line-height: 1; }
.upcoming-info  { flex: 1; }
.upcoming-event { font-size: 0.78rem; font-weight: 600; margin-bottom: 3px; }
.upcoming-detail { font-family: var(--font-mono); font-size: 0.62rem; color: var(--text3); }

/* ── FEAR & GREED WIDGET ── */
.fg-widget { background: var(--bg2); border: 1px solid var(--border2); border-radius: var(--radius-lg); padding: 16px; margin-bottom: 14px; }
.fg-widget h3 { font-family: var(--font-mono); font-size: 0.68rem; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: var(--amber); margin-bottom: 14px; display: flex; align-items: center; gap: 6px; }

/* ── VIDEO OVERLAY (modal) ── */
.video-overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.88); backdrop-filter: blur(8px); z-index: 2000; align-items: center; justify-content: center; padding: 20px; }
.video-overlay.open { display: flex; }
.video-modal { width: min(920px,100%); background: var(--bg2); border: 1px solid var(--amber); border-top: 3px solid var(--amber); border-radius: var(--radius-lg); overflow: hidden; animation: modal-in 0.2s ease; }
.video-embed-wrap { position: relative; width: 100%; padding-top: 56.25%; background: #000; }
.video-embed-wrap iframe { position: absolute; inset: 0; width: 100%; height: 100%; border: none; }
.video-modal-body { padding: 16px 20px; border-top: 1px solid var(--border); }
.video-modal-title { font-family: var(--font-mono); font-size: 0.85rem; font-weight: 600; margin-bottom: 4px; }
.video-modal-meta  { font-family: var(--font-mono); font-size: 0.65rem; color: var(--text3); }
.modal-close-outer { position: fixed; top: 16px; right: 16px; background: var(--bg3); border: 1px solid var(--border2); color: var(--text); width: 36px; height: 36px; border-radius: 50%; font-size: 1rem; cursor: pointer; display: flex; align-items: center; justify-content: center; z-index: 2010; transition: all var(--transition); }
.modal-close-outer:hover { border-color: var(--red); color: var(--red); }

/* ── NEWS BREAKING CAROUSEL ── */
.breaking-wrap { margin: 0 16px 16px; }

/* ── RESPONSIVE FIXES ── */
@media (max-width: 900px) {
  .tools-grid { grid-template-columns: 1fr; padding: 12px; }
  .export-options { grid-template-columns: 1fr; }
  .gas-grid { grid-template-columns: repeat(3,1fr); }
  .cal-layout { grid-template-columns: 1fr !important; }
  .upcoming-card { position: static !important; }
}

@media (max-width: 600px) {
  .conv-row { flex-direction: column; }
  .conv-swap { display: none; }
  .portfolio-add-row { flex-direction: column; }
  .alert-row { flex-direction: column; }
  .page-bar { padding: 8px 12px; gap: 8px; }
}

/* ── LIGHT MODE TOOL FIXES ── */
[data-theme="light"] .tool-card { box-shadow: 0 1px 8px rgba(0,0,0,0.06); }
[data-theme="light"] .conv-input, [data-theme="light"] .port-input, [data-theme="light"] .conv-select { background: var(--bg3); }
[data-theme="light"] .gas-item, [data-theme="light"] .portfolio-item, [data-theme="light"] .alert-item { background: var(--bg3); }
