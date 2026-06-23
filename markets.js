/* ═══════════════════════════════════════════════════════
   MARKETPULSE — DESIGN SYSTEM
   Premium dark theme with glassmorphism
═══════════════════════════════════════════════════════ */

@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:ital,wght@0,300;0,400;0,500;1,400&family=Outfit:wght@300;400;500;600&display=swap');

/* ── VARIABLES ── */
:root {
  --bg:          #07090f;
  --bg2:         #0d1117;
  --bg3:         #131922;
  --bg4:         #1a2230;
  --glass:       rgba(255,255,255,0.04);
  --glass2:      rgba(255,255,255,0.08);
  --border:      rgba(255,255,255,0.07);
  --border2:     rgba(255,255,255,0.14);
  --accent:      #f5c842;
  --accent2:     #e8a820;
  --blue:        #4da6ff;
  --blue2:       #1a7fff;
  --green:       #20e08a;
  --red:         #ff3d5a;
  --purple:      #a78bfa;
  --text:        #eef0f3;
  --text2:       #9aa3b0;
  --text3:       #5a6478;
  --nav-h:       64px;
  --radius:      14px;
  --radius-sm:   8px;
  --shadow:      0 4px 24px rgba(0,0,0,0.4);
  --shadow-lg:   0 8px 48px rgba(0,0,0,0.6);
  --glow-gold:   0 0 40px rgba(245,200,66,0.12);
  --glow-blue:   0 0 40px rgba(77,166,255,0.12);
  --transition:  0.25s cubic-bezier(0.4,0,0.2,1);
}

[data-theme="light"] {
  --bg:          #f0f2f5;
  --bg2:         #ffffff;
  --bg3:         #f7f8fa;
  --bg4:         #eef0f4;
  --glass:       rgba(0,0,0,0.03);
  --glass2:      rgba(0,0,0,0.06);
  --border:      rgba(0,0,0,0.08);
  --border2:     rgba(0,0,0,0.14);
  --text:        #0f1419;
  --text2:       #4a5568;
  --text3:       #9aa3b0;
  --shadow:      0 4px 24px rgba(0,0,0,0.08);
  --shadow-lg:   0 8px 48px rgba(0,0,0,0.12);
}

/* ── RESET ── */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html { scroll-behavior: smooth; font-size: 16px; }

body {
  font-family: 'Outfit', sans-serif;
  background: var(--bg);
  color: var(--text);
  min-height: 100vh;
  overflow-x: hidden;
  transition: background var(--transition), color var(--transition);
}

body::before {
  content: '';
  position: fixed;
  inset: 0;
  background:
    radial-gradient(ellipse 70% 50% at 5% -10%, rgba(245,200,66,0.07) 0%, transparent 55%),
    radial-gradient(ellipse 50% 40% at 95% 110%, rgba(77,166,255,0.06) 0%, transparent 55%);
  pointer-events: none;
  z-index: 0;
}

/* ── SCROLLBAR ── */
::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: var(--bg2); }
::-webkit-scrollbar-thumb { background: var(--bg4); border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: var(--text3); }

/* ── TYPOGRAPHY ── */
h1,h2,h3,h4,h5 { font-family: 'Syne', sans-serif; line-height: 1.2; }
.mono { font-family: 'DM Mono', monospace; }
a { color: inherit; text-decoration: none; }

/* ── NAVBAR ── */
.navbar {
  position: sticky;
  top: 0;
  z-index: 1000;
  height: var(--nav-h);
  background: rgba(7,9,15,0.85);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--border);
  transition: background var(--transition);
}

[data-theme="light"] .navbar { background: rgba(240,242,245,0.9); }

.navbar-brand {
  font-family: 'Syne', sans-serif;
  font-size: 1.4rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--text) !important;
}

.navbar-brand .accent { color: var(--accent); }

.nav-link {
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--text2) !important;
  letter-spacing: 0.02em;
  padding: 6px 14px !important;
  border-radius: var(--radius-sm);
  transition: all var(--transition);
  position: relative;
}

.nav-link:hover, .nav-link.active {
  color: var(--text) !important;
  background: var(--glass2);
}

.nav-link.active::after {
  content: '';
  position: absolute;
  bottom: -1px; left: 50%; transform: translateX(-50%);
  width: 20px; height: 2px;
  background: var(--accent);
  border-radius: 2px;
}

.nav-dot {
  width: 7px; height: 7px;
  border-radius: 50%;
  background: var(--green);
  box-shadow: 0 0 8px var(--green);
  display: inline-block;
  animation: livePulse 2s ease-in-out infinite;
}

@keyframes livePulse {
  0%,100% { opacity: 1; transform: scale(1); }
  50%      { opacity: 0.5; transform: scale(0.85); }
}

.theme-toggle {
  background: var(--glass2);
  border: 1px solid var(--border2);
  color: var(--text2);
  width: 36px; height: 36px;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  transition: all var(--transition);
  font-size: 1rem;
}

.theme-toggle:hover { border-color: var(--accent); color: var(--accent); }

/* ── PAGE WRAPPER ── */
.page { position: relative; z-index: 1; }
.container-fluid { max-width: 1400px; }

/* ── SECTION HEADING ── */
.section-heading {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 28px;
}

.section-heading h2 {
  font-size: 1.4rem;
  font-weight: 700;
  letter-spacing: -0.01em;
  white-space: nowrap;
}

.section-heading .line {
  flex: 1;
  height: 1px;
  background: var(--border);
}

.section-heading .badge-count {
  font-family: 'DM Mono', monospace;
  font-size: 0.7rem;
  padding: 3px 8px;
  border-radius: 20px;
  background: var(--glass2);
  border: 1px solid var(--border2);
  color: var(--text3);
}

/* ── CARDS ── */
.mp-card {
  background: var(--bg2);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  transition: all var(--transition);
  overflow: hidden;
}

.mp-card:hover {
  border-color: var(--border2);
  transform: translateY(-3px);
  box-shadow: var(--shadow-lg);
}

/* ── GLASS CARD ── */
.glass-card {
  background: var(--glass);
  backdrop-filter: blur(20px);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  transition: all var(--transition);
}

.glass-card:hover {
  background: var(--glass2);
  border-color: var(--border2);
}

/* ── BUTTONS ── */
.btn-mp {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 22px;
  border-radius: var(--radius-sm);
  font-family: 'Outfit', sans-serif;
  font-size: 0.875rem;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: all var(--transition);
  letter-spacing: 0.02em;
}

.btn-mp-primary {
  background: var(--accent);
  color: #0a0a0a;
}

.btn-mp-primary:hover {
  background: var(--accent2);
  transform: translateY(-1px);
  box-shadow: 0 4px 20px rgba(245,200,66,0.3);
}

.btn-mp-ghost {
  background: var(--glass2);
  color: var(--text2);
  border: 1px solid var(--border2);
}

.btn-mp-ghost:hover {
  background: var(--bg4);
  color: var(--text);
  border-color: var(--accent);
}

/* ── CHANGE PILLS ── */
.pill {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 3px 9px;
  border-radius: 20px;
  font-family: 'DM Mono', monospace;
  font-size: 0.75rem;
  font-weight: 500;
}

.pill-up   { background: rgba(32,224,138,0.12); color: var(--green); }
.pill-down { background: rgba(255,61,90,0.12);  color: var(--red); }
.pill-neu  { background: var(--glass2);          color: var(--text3); }

/* ── SKELETON ── */
.skeleton {
  background: linear-gradient(90deg,
    var(--bg3) 25%,
    var(--bg4) 50%,
    var(--bg3) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.6s ease-in-out infinite;
  border-radius: var(--radius-sm);
}

@keyframes shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* ── TOAST ── */
.toast-container {
  position: fixed;
  bottom: 24px; right: 24px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.toast-mp {
  background: var(--bg3);
  border: 1px solid var(--border2);
  border-radius: var(--radius-sm);
  padding: 12px 18px;
  font-size: 0.875rem;
  min-width: 220px;
  box-shadow: var(--shadow);
  animation: toastIn 0.3s ease;
  display: flex;
  align-items: center;
  gap: 10px;
}

@keyframes toastIn {
  from { opacity: 0; transform: translateX(30px); }
  to   { opacity: 1; transform: translateX(0); }
}

/* ── FADE IN ANIMATIONS ── */
.fade-up {
  opacity: 0;
  transform: translateY(24px);
  transition: opacity 0.6s ease, transform 0.6s ease;
}

.fade-up.visible {
  opacity: 1;
  transform: translateY(0);
}

.fade-up-delay-1 { transition-delay: 0.1s; }
.fade-up-delay-2 { transition-delay: 0.2s; }
.fade-up-delay-3 { transition-delay: 0.3s; }
.fade-up-delay-4 { transition-delay: 0.4s; }

/* ── SEARCH BAR ── */
.search-bar {
  display: flex;
  align-items: center;
  background: var(--bg3);
  border: 1px solid var(--border2);
  border-radius: 50px;
  padding: 10px 20px;
  gap: 10px;
  transition: all var(--transition);
}

.search-bar:focus-within {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(245,200,66,0.1);
}

.search-bar input {
  background: none;
  border: none;
  outline: none;
  color: var(--text);
  font-family: 'Outfit', sans-serif;
  font-size: 0.9rem;
  flex: 1;
}

.search-bar input::placeholder { color: var(--text3); }

/* ── FILTER CHIPS ── */
.filter-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 20px;
}

.chip {
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 500;
  border: 1px solid var(--border2);
  background: var(--glass);
  color: var(--text2);
  cursor: pointer;
  transition: all var(--transition);
}

.chip:hover { border-color: var(--accent); color: var(--text); }
.chip.active { background: var(--accent); color: #0a0a0a; border-color: var(--accent); font-weight: 600; }

/* ── STATS COUNTER ── */
.stat-value {
  font-family: 'Syne', sans-serif;
  font-size: 2rem;
  font-weight: 800;
  color: var(--accent);
  line-height: 1;
}

/* ── FOOTER ── */
footer {
  background: var(--bg2);
  border-top: 1px solid var(--border);
  padding: 40px 0 24px;
  margin-top: 80px;
}

.footer-brand {
  font-family: 'Syne', sans-serif;
  font-size: 1.3rem;
  font-weight: 800;
}

.footer-brand .accent { color: var(--accent); }

footer p { color: var(--text3); font-size: 0.85rem; }

/* ── RESPONSIVE ── */
@media (max-width: 768px) {
  :root { --nav-h: 56px; }
  .stat-value { font-size: 1.5rem; }
  .section-heading h2 { font-size: 1.2rem; }
}

/* ═══════════════════════════════════════════════════════
   DRAWER NAVIGATION
═══════════════════════════════════════════════════════ */

/* Prevent theme flash */
html { visibility: visible; }

.drawer-overlay {
  display: none;
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.6);
  backdrop-filter: blur(4px);
  z-index: 1040;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.drawer-overlay.open {
  display: block;
  opacity: 1;
}

.nav-drawer {
  position: fixed;
  top: 0; right: -320px;
  width: 300px;
  height: 100vh;
  background: var(--bg2);
  border-left: 1px solid var(--border2);
  z-index: 1050;
  display: flex;
  flex-direction: column;
  transition: right 0.35s cubic-bezier(0.4,0,0.2,1);
  box-shadow: -8px 0 40px rgba(0,0,0,0.4);
}

.nav-drawer.open { right: 0; }

.drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border);
}

.drawer-brand {
  font-family: 'Syne', sans-serif;
  font-size: 1.3rem;
  font-weight: 800;
}

.drawer-close {
  background: var(--bg3);
  border: 1px solid var(--border2);
  color: var(--text2);
  width: 32px; height: 32px;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all var(--transition);
}

.drawer-close:hover { border-color: var(--red); color: var(--red); }

.drawer-nav {
  flex: 1;
  padding: 16px 12px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.drawer-link {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 13px 16px;
  border-radius: var(--radius);
  color: var(--text2);
  font-size: 0.95rem;
  font-weight: 500;
  transition: all var(--transition);
  position: relative;
  text-decoration: none;
}

.drawer-link i {
  font-size: 1.1rem;
  width: 22px;
  text-align: center;
}

.drawer-link:hover {
  background: var(--glass2);
  color: var(--text);
}

.drawer-link.active {
  background: rgba(245,200,66,0.1);
  color: var(--accent);
  border: 1px solid rgba(245,200,66,0.2);
}

.drawer-active-dot {
  width: 6px; height: 6px;
  border-radius: 50%;
  background: var(--accent);
  margin-left: auto;
  box-shadow: 0 0 6px var(--accent);
}

.drawer-footer {
  padding: 16px 24px;
  border-top: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.drawer-theme-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 11px 16px;
  background: var(--bg3);
  border: 1px solid var(--border2);
  border-radius: var(--radius);
  color: var(--text2);
  font-family: 'Outfit', sans-serif;
  font-size: 0.88rem;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition);
}

.drawer-theme-btn:hover { border-color: var(--accent); color: var(--accent); }

.drawer-clock {
  font-family: 'DM Mono', monospace;
  font-size: 0.75rem;
  color: var(--text3);
  text-align: center;
  letter-spacing: 0.06em;
}

/* Hide Bootstrap collapse on mobile — we use the drawer */
@media (max-width: 991px) {
  .navbar-collapse { display: none !important; }
  .navbar-toggler { display: flex !important; }
}

/* Better hamburger icon */
.navbar-toggler {
  display: none;
  align-items: center;
  justify-content: center;
  width: 40px; height: 40px;
  background: var(--glass2) !important;
  border: 1px solid var(--border2) !important;
  border-radius: var(--radius-sm) !important;
  color: var(--text2);
  cursor: pointer;
  transition: all var(--transition);
  padding: 0 !important;
}

.navbar-toggler:hover {
  border-color: var(--accent) !important;
  color: var(--accent);
}

.hamburger-icon {
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 18px;
}

.hamburger-icon span {
  display: block;
  height: 2px;
  background: currentColor;
  border-radius: 2px;
  transition: all 0.3s ease;
}

.hamburger-icon span:nth-child(2) { width: 70%; }

/* ═══════════════════════════════════════════════════════
   IMPROVED SEARCH
═══════════════════════════════════════════════════════ */

.search-bar {
  position: relative;
}

.search-bar .search-clear {
  background: none;
  border: none;
  color: var(--text3);
  cursor: pointer;
  font-size: 0.85rem;
  padding: 4px;
  transition: color var(--transition);
  display: none;
}

.search-bar .search-clear.visible { display: block; }
.search-bar .search-clear:hover { color: var(--text); }

.search-bar input:not(:placeholder-shown) + .search-clear { display: block; }

/* Global search highlight */
.search-highlight {
  background: rgba(245,200,66,0.25);
  color: var(--accent);
  border-radius: 2px;
  padding: 0 2px;
}

/* ═══════════════════════════════════════════════════════
   GENERAL IMPROVEMENTS
═══════════════════════════════════════════════════════ */

/* Smoother page load */
.page { animation: pageIn 0.3s ease; }
@keyframes pageIn {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* Better focus rings */
:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
  border-radius: 4px;
}

/* Improved table hover */
.market-table tr.asset-row { position: relative; }

/* Better empty states */
.empty-state .icon { animation: float 3s ease-in-out infinite; }
@keyframes float {
  0%,100% { transform: translateY(0); }
  50%      { transform: translateY(-8px); }
}

/* Scroll to top button */
.scroll-top {
  position: fixed;
  bottom: 80px; right: 24px;
  width: 40px; height: 40px;
  background: var(--bg3);
  border: 1px solid var(--border2);
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  z-index: 500;
  opacity: 0; pointer-events: none;
  transition: all var(--transition);
  color: var(--text2);
  font-size: 0.9rem;
}

.scroll-top.visible {
  opacity: 1;
  pointer-events: auto;
}

.scroll-top:hover {
  border-color: var(--accent);
  color: var(--accent);
  transform: translateY(-2px);
}

/* ═══════════════════════════════════════════════════════
   DRAWER NAV + IMPROVEMENTS v2
═══════════════════════════════════════════════════════ */

/* ── THEME FLASH PREVENTION ── */
/* Handled by inline script in each page */

/* ── DRAWER OVERLAY ── */
.drawer-overlay {
  display: none;
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.6);
  backdrop-filter: blur(4px);
  z-index: 1040;
  opacity: 0;
  transition: opacity 0.3s ease;
}
.drawer-overlay.open { display: block; opacity: 1; }

/* ── DRAWER PANEL ── */
.nav-drawer {
  position: fixed;
  top: 0; right: -320px;
  width: 300px; height: 100vh;
  background: var(--bg2);
  border-left: 1px solid var(--border2);
  z-index: 1050;
  display: flex; flex-direction: column;
  transition: right 0.35s cubic-bezier(0.4,0,0.2,1);
  box-shadow: -8px 0 40px rgba(0,0,0,0.4);
}
.nav-drawer.open { right: 0; }

.drawer-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border);
}

.drawer-brand {
  font-family: 'Syne', sans-serif;
  font-size: 1.3rem; font-weight: 800;
}
.drawer-brand .accent { color: var(--accent); }

.drawer-close {
  background: var(--bg3); border: 1px solid var(--border2);
  color: var(--text2); width: 32px; height: 32px;
  border-radius: 50%; font-size: 0.9rem;
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  transition: all var(--transition);
}
.drawer-close:hover { border-color: var(--red); color: var(--red); }

.drawer-nav {
  flex: 1; padding: 16px 12px;
  display: flex; flex-direction: column; gap: 4px;
  overflow-y: auto;
}

.drawer-link {
  display: flex; align-items: center; gap: 14px;
  padding: 13px 16px;
  border-radius: var(--radius-sm);
  color: var(--text2);
  font-size: 0.92rem; font-weight: 500;
  transition: all var(--transition);
  position: relative;
  text-decoration: none;
}
.drawer-link i { font-size: 1.1rem; width: 20px; text-align: center; }
.drawer-link:hover { background: var(--glass2); color: var(--text); }
.drawer-link.active {
  background: rgba(245,200,66,0.1);
  color: var(--accent);
  border: 1px solid rgba(245,200,66,0.2);
}
.drawer-active-dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: var(--accent);
  margin-left: auto;
  box-shadow: 0 0 6px var(--accent);
}

.drawer-footer {
  padding: 16px 20px;
  border-top: 1px solid var(--border);
  display: flex; align-items: center; justify-content: space-between;
}

.drawer-theme-btn {
  display: flex; align-items: center; gap: 8px;
  background: var(--bg3); border: 1px solid var(--border2);
  color: var(--text2); padding: 8px 14px;
  border-radius: var(--radius-sm); font-size: 0.82rem;
  cursor: pointer; transition: all var(--transition);
  font-family: 'Outfit', sans-serif;
}
.drawer-theme-btn:hover { border-color: var(--accent); color: var(--accent); }

.drawer-clock {
  font-family: 'DM Mono', monospace;
  font-size: 0.75rem; color: var(--text3);
}

/* ── HAMBURGER BUTTON ── */
.navbar-toggler {
  width: 38px; height: 38px;
  border: 1px solid var(--border2) !important;
  border-radius: var(--radius-sm) !important;
  background: var(--glass2) !important;
  display: flex; align-items: center; justify-content: center;
  transition: all var(--transition);
  padding: 0 !important;
}
.navbar-toggler:hover { border-color: var(--accent) !important; }
.navbar-toggler:focus { box-shadow: none !important; }
.navbar-toggler i { color: var(--text2); transition: color var(--transition); }
.navbar-toggler:hover i { color: var(--accent); }

/* ── IMPROVED SEARCH BAR ── */
.search-bar { position: relative; }
.search-bar .search-clear {
  background: none; border: none;
  color: var(--text3); cursor: pointer;
  font-size: 0.9rem; padding: 2px 4px;
  transition: color var(--transition);
  display: none;
}
.search-bar.has-value .search-clear { display: block; }
.search-bar .search-clear:hover { color: var(--text); }

/* ── IMPROVED CARDS ── */
.mp-card { position: relative; }

/* ── NEWS EMPTY STATE ── */
.news-offline {
  background: rgba(245,200,66,0.06);
  border: 1px solid rgba(245,200,66,0.2);
  border-radius: var(--radius);
  padding: 28px 32px;
  text-align: center;
  grid-column: 1/-1;
}
.news-offline .icon { font-size: 2.5rem; margin-bottom: 12px; }
.news-offline h3 { color: var(--text); margin-bottom: 8px; }
.news-offline p  { color: var(--text2); font-size: 0.88rem; max-width: 440px; margin: 0 auto; }

/* ── BETTER LIGHT MODE ── */
[data-theme="light"] .mp-card   { box-shadow: 0 2px 12px rgba(0,0,0,0.06); }
[data-theme="light"] .glass-card { background: rgba(255,255,255,0.8); }
[data-theme="light"] .navbar    { box-shadow: 0 2px 12px rgba(0,0,0,0.06); }
[data-theme="light"] .nav-drawer { box-shadow: -8px 0 40px rgba(0,0,0,0.12); }
[data-theme="light"] .ticker-wrap { background: #fff; }

/* ── SMOOTH TRANSITIONS ── */
*, *::before, *::after {
  transition-property: background-color, border-color, color, box-shadow;
  transition-duration: 0.2s;
  transition-timing-function: ease;
}
/* Don't transition transforms/opacity (breaks animations) */
.fade-up, .nav-drawer, .chart-overlay, .video-overlay,
.drawer-overlay, canvas, img { transition: none !important; }
.fade-up { transition: opacity 0.6s ease, transform 0.6s ease !important; }
.nav-drawer { transition: right 0.35s cubic-bezier(0.4,0,0.2,1) !important; }
