// MarketPulse — accounts, Google Sign-In, cloud sync
const API = (typeof window !== 'undefined' && window.location?.protocol?.startsWith('http'))
  ? window.location.origin
  : 'http://localhost:8000';

const GOOGLE_CLIENT_ID = '175986550586-rgsis4asdfi9ol9p30t7sv26nltc6qsp.apps.googleusercontent.com';

const MP_DEFAULTS = {
  favorites: {},
  portfolio: [],
  notes: [],
  alerts: [],
  alert_settings: {},
  theme: 'dark',
  calendar_alerts: {
    enabled: false,
    keywords: ['FOMC', 'CPI', 'NFP', 'Fed', 'ECB'],
    minutes_before: 60,
  },
};

class AuthManager {
  constructor() {
    this.token = localStorage.getItem('auth_token') || localStorage.getItem('mp-token') || '';
    this.email = localStorage.getItem('mp-email') || '';
    this.user = this._readProfile();
    this._syncTimer = null;
    this._googleReady = false;
    this._loading = false;
    this._injectUI();
    if (this.token) this._validateAndPull();
    this._initGoogle();
    this._watchTheme();
  }

  _readProfile() {
    try { return JSON.parse(localStorage.getItem('mp-user') || 'null'); } catch (e) { return null; }
  }

  isLoggedIn() { return !!this.token; }

  headers() {
    return this.token ? { Authorization: `Bearer ${this.token}` } : {};
  }

  _injectUI() {
    const actions = document.querySelector('.nav-actions');
    if (!actions) return;

    let slot = document.getElementById('authSlot');
    if (!slot) {
      slot = document.createElement('div');
      slot.id = 'authSlot';
      slot.className = 'auth-slot';
      actions.insertBefore(slot, actions.firstChild);
    }

    if (!this._slotWired) {
      this._slotWired = true;
    }

    this._renderAuthSlot();
    this._injectDrawerAuth();
  }

  _injectDrawerAuth() {
    const btn = document.getElementById('drawerAuthBtn');
    if (!btn) {
      setTimeout(() => this._injectDrawerAuth(), 50);
      return;
    }
    if (!this._drawerWired) {
      this._drawerWired = true;
      btn.addEventListener('click', () => {
        window.navManager?.closeDrawer?.();
        this.showModal();
      });
    }
    this._updateDrawerAuth();
  }

  _updateDrawerAuth() {
    const btn = document.getElementById('drawerAuthBtn');
    if (!btn) return;
    if (this.isLoggedIn()) {
      const name = this.user?.name || this.email?.split('@')[0] || 'Account';
      btn.innerHTML = `<i class="bi bi-person-check"></i><span>${name}</span>`;
      btn.classList.add('is-signed-in');
    } else {
      btn.innerHTML = `<i class="bi bi-google"></i><span>SIGN IN</span>`;
      btn.classList.remove('is-signed-in');
    }
  }

  _setLoading(on) {
    this._loading = on;
    const slot = document.getElementById('authSlot');
    if (!slot) return;
    slot.classList.toggle('is-loading', on);
    if (on) {
      slot.innerHTML = '<div class="auth-spinner" aria-label="Signing in"></div>';
    }
  }

  _renderAuthSlot() {
    const slot = document.getElementById('authSlot');
    if (!slot || this._loading) return;
    slot.classList.remove('is-loading');

    if (this.isLoggedIn() && (this.user?.picture || this.user?.name || this.email)) {
      const name = this.user?.name || this.email.split('@')[0];
      const pic = this.user?.picture || '';
      const initial = (name.trim()[0] || '?').toUpperCase();
      slot.classList.add('is-signed-in');
      slot.innerHTML = `
        <button type="button" class="auth-profile" id="authProfileBtn" title="${this.email}" onclick="window.openSignIn(event)">
          <span class="auth-avatar-wrap">
            ${pic
              ? `<img class="auth-avatar" src="${pic}" alt="" referrerpolicy="no-referrer">`
              : `<span class="auth-avatar auth-avatar-fallback">${initial}</span>`}
            <span class="auth-status-dot" aria-hidden="true"></span>
          </span>
          <span class="auth-text">
            <span class="auth-name">${name}</span>
            <span class="auth-label">CLOUD SYNC</span>
          </span>
          <i class="bi bi-chevron-down auth-chevron" aria-hidden="true"></i>
        </button>`;
      this._updateDrawerAuth();
      return;
    }

    slot.classList.remove('is-signed-in');

    slot.innerHTML = `
      <button type="button" class="auth-google-custom auth-nav-btn" id="authNavBtn" aria-label="Sign in" onclick="window.openSignIn(event)">
        <span class="auth-g-logo">${this._googleLogoSvg()}</span>
        <span class="auth-nav-label">SIGN IN</span>
      </button>`;
    this._updateDrawerAuth();
  }

  _googleLogoSvg() {
    return `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>`;
  }

  _renderGoogleButton(containerId, compact = false) {
    const el = document.getElementById(containerId);
    if (!el || this.isLoggedIn()) return;

    if (compact) {
      this._renderAuthSlot();
      return;
    }

    el.className = 'auth-google-wrap auth-google-modal';
    el.style.display = '';
    el.innerHTML = '';

    if (this._googleReady && window.google?.accounts?.id) {
      try {
        const w = Math.max(200, Math.min(280, el.offsetWidth || 240));
        window.google.accounts.id.renderButton(el, {
          type: 'standard',
          theme: this._googleTheme(),
          size: 'large',
          text: 'continue_with',
          shape: 'pill',
          logo_alignment: 'left',
          width: w,
        });
        return;
      } catch (e) { /* use fallback below */ }
    }

    el.innerHTML = `
      <button type="button" class="auth-google-custom auth-google-modal-btn" style="width:100%;justify-content:center;height:44px">
        <span class="auth-g-logo">${this._googleLogoSvg()}</span>
        <span>Continue with Google</span>
      </button>`;
    el.querySelector('button')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this._openGoogleSignIn();
    });
  }

  _googleTheme() {
    return document.documentElement.getAttribute('data-theme') === 'light' ? 'outline' : 'filled_black';
  }

_openGoogleSignIn() {
  if (this._googleReady && window.google?.accounts?.id) {
    // Look for Google's native iframe/button inside your wrapper
    const rendered = document.querySelector('#googleBtnModal iframe, #googleBtnModal [role="button"]');
    if (rendered) {
      // If it's an iframe, we can't always programmatically .click() it securely.
      // Instead, force Google to open the One Tap / Popup prompt directly:
      try {
        window.google.accounts.id.prompt();
        return;
      } catch (e) {
        console.error("Google prompt failed:", e);
      }
    }
  }
  // Fallback to opening the standard modal if it wasn't open yet
  if (!document.getElementById('authModal')?.classList.contains('open')) {
    this.showModal();
  }
}
  _waitForGoogle(maxMs = 12000) {
    return new Promise((resolve, reject) => {
      if (window.google?.accounts?.id) return resolve();
      const start = Date.now();
      const tick = () => {
        if (window.google?.accounts?.id) return resolve();
        if (Date.now() - start > maxMs) return reject(new Error('Google Sign-In failed to load'));
        setTimeout(tick, 80);
      };
      tick();
    });
  }

  async _initGoogle() {
    try {
      await this._waitForGoogle();
      let clientId = GOOGLE_CLIENT_ID;
      try {
        const cfg = await fetch(`${API}/api/auth/google/config`);
        if (cfg.ok) {
          const j = await cfg.json();
          if (j.client_id) clientId = j.client_id;
        }
      } catch (e) { /* use default */ }
      this._clientId = clientId;
      this._googleReady = true;
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (r) => this.handleCredentialResponse(r),
        auto_select: false,
        cancel_on_tap_outside: true,
        context: 'signin',
        ux_mode: 'popup',
        itp_support: true,
      });
      this._renderAuthSlot();
      this._renderGoogleInModal();
    } catch (e) {
      console.warn('Google auth:', e.message);
    }
  }

  _renderGoogleInModal() {
    const wrap = document.getElementById('googleBtnModal');
    if (wrap) this._renderGoogleButton('googleBtnModal', false);
  }

  _watchTheme() {
    new MutationObserver(() => {
      if (!this.isLoggedIn()) {
        this._renderAuthSlot();
        this._renderGoogleInModal();
      }
    }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  }

  async handleCredentialResponse(response) {
    if (!response?.credential) {
      Toast.show('Google sign-in cancelled', 'warning');
      return;
    }
    this._setLoading(true);
    try {
      await this._beforeAccountChange();
      const res = await fetch(`${API}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: response.credential }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Google sign-in failed');
      this._setSession(data);
      await this.pullCloud();
      this.hideModal();
      Toast.show(`Welcome, ${data.name || data.email}`, 'success');
    } catch (e) {
      Toast.show(e.message || 'Google sign-in failed', 'error');
    } finally {
      this._setLoading(false);
      this._renderAuthSlot();
    }
  }

  showModal() {
    let el = document.getElementById('authModal');
    if (!el) {
      el = document.createElement('div');
      el.id = 'authModal';
      el.className = 'modal-overlay';
      el.innerHTML = `
        <div class="modal-box" style="width:min(400px,92vw)">
          <div class="modal-head">
            <span class="modal-title" id="authModalTitle">ACCOUNT</span>
            <button class="modal-close" onclick="window.authManager.hideModal()">✕</button>
          </div>
          <div class="modal-body" id="authModalBody"></div>
        </div>`;
      el.onclick = e => { if (e.target === el) this.hideModal(); };
      document.body.appendChild(el);
    }
    this._renderModal();
    el.classList.add('open');
    requestAnimationFrame(() => this._renderGoogleInModal());
  }

  hideModal() {
    document.getElementById('authModal')?.classList.remove('open');
  }

  _renderModal() {
    const body = document.getElementById('authModalBody');
    const title = document.getElementById('authModalTitle');
    if (!body) return;
    if (this.isLoggedIn()) {
      title.textContent = 'CLOUD SYNC';
      const pic = this.user?.picture || '';
      const name = this.user?.name || this.email;
      body.innerHTML = `
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px">
          ${pic ? `<img src="${pic}" alt="" referrerpolicy="no-referrer" style="width:44px;height:44px;border-radius:50%;border:1px solid var(--border-mid)">` : ''}
          <div>
            <div style="font-weight:600;color:var(--text-primary)">${name}</div>
            <div style="font-size:.72rem;color:var(--text-muted);font-family:var(--font-mono)">${this.email}</div>
          </div>
        </div>
        <p style="font-size:.78rem;color:var(--text-secondary);margin-bottom:16px">
          Watchlist, portfolio, alerts & theme sync to the server.
        </p>
        <button class="btn-mp btn-mp-primary" style="width:100%;margin-bottom:8px" onclick="window.authManager.pushCloud()">Sync now</button>
        <button class="btn-mp btn-mp-ghost" style="width:100%" onclick="window.authManager.logout()">Log out</button>`;
      return;
    }
    title.textContent = 'SIGN IN';
    body.innerHTML = `
      <div class="auth-google-wrap auth-google-modal" id="googleBtnModal" style="margin-bottom:12px"></div>
      <div class="auth-divider"></div>
      <p style="font-size:.68rem;color:var(--text-muted);text-align:center;margin-bottom:12px">Or use email</p>
      <input class="form-input" id="authEmail" type="email" placeholder="Email" style="margin-bottom:10px;width:100%">
      <input class="form-input" id="authPass" type="password" placeholder="Password (6+ chars)" style="margin-bottom:14px;width:100%">
      <button class="btn-mp btn-mp-primary" style="width:100%;margin-bottom:8px" onclick="window.authManager.login()">Log in</button>
      <button class="btn-mp btn-mp-ghost" style="width:100%" onclick="window.authManager.register()">Create account</button>`;
    this._renderGoogleInModal();
  }

  async login() {
    const email = document.getElementById('authEmail')?.value?.trim();
    const password = document.getElementById('authPass')?.value;
    if (!email || !password) return Toast.show('Enter email and password', 'warning');
    this._setLoading(true);
    try {
      await this._beforeAccountChange();
      const res = await fetch(`${API}/api/auth/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Login failed');
      this._setSession(data);
      await this.pullCloud();
      this._renderModal();
      Toast.show('Logged in — data synced', 'success');
    } catch (e) {
      Toast.show(e.message, 'error');
    } finally {
      this._setLoading(false);
      this._renderAuthSlot();
    }
  }

  async register() {
    const email = document.getElementById('authEmail')?.value?.trim();
    const password = document.getElementById('authPass')?.value;
    if (!email || !password) return Toast.show('Enter email and password', 'warning');
    this._setLoading(true);
    try {
      await this._beforeAccountChange();
      const res = await fetch(`${API}/api/auth/register`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Register failed');
      this._setSession(data);
      await this.pushCloud();
      this._renderModal();
      Toast.show('Account created', 'success');
    } catch (e) {
      Toast.show(e.message, 'error');
    } finally {
      this._setLoading(false);
      this._renderAuthSlot();
    }
  }

  logout() {
    this.token = '';
    this.email = '';
    this.user = null;
    localStorage.removeItem('auth_token');
    localStorage.removeItem('mp-token');
    localStorage.removeItem('mp-email');
    localStorage.removeItem('mp-user');
    try { window.google?.accounts?.id?.disableAutoSelect?.(); } catch (e) {}
    this._restoreGuestState();
    this._renderAuthSlot();
    this._updateDrawerAuth();
    this.hideModal();
    Toast.show('Logged out — local defaults restored', 'info');
  }

  _snapshotGuest() {
    if (this.isLoggedIn()) return;
    localStorage.setItem('mp-guest-snapshot', JSON.stringify(this.collectLocal()));
  }

  _restoreGuestState() {
    try {
      const snap = JSON.parse(localStorage.getItem('mp-guest-snapshot') || 'null');
      this.applyCloud(snap || MP_DEFAULTS);
    } catch (e) {
      this.applyCloud(MP_DEFAULTS);
    }
  }

  async _beforeAccountChange() {
    if (this.isLoggedIn()) await this.pushCloud();
    else this._snapshotGuest();
  }

  _normalizeCloud(data) {
    const d = data || {};
    return {
      favorites: d.favorites ?? MP_DEFAULTS.favorites,
      portfolio: d.portfolio ?? MP_DEFAULTS.portfolio,
      notes: d.notes ?? MP_DEFAULTS.notes,
      alerts: d.alerts ?? MP_DEFAULTS.alerts,
      alert_settings: d.alert_settings ?? MP_DEFAULTS.alert_settings,
      theme: d.theme ?? MP_DEFAULTS.theme,
      calendar_alerts: d.calendar_alerts ?? MP_DEFAULTS.calendar_alerts,
    };
  }

  _refreshAllUI() {
    window.favoritesManager?.reload?.();
    window.priceAlerts?.reloadFromStorage?.();
    window.priceAlerts?.start?.();
    window.themeManager?.set?.(localStorage.getItem('mp-theme') || MP_DEFAULTS.theme);
    window.refreshFavoritesUI?.();
    window.toolsPage?.renderPortfolio?.();
    window.toolsPage?.renderAlerts?.();
    window.toolsPage?.renderNotes?.();
    window.mktPage?.renderTable?.();
    window.calendarPage?.initCalendarAlerts?.();
  }

  _setSession(data) {
    this.token = data.token;
    this.email = data.email;
    this.user = {
      email: data.email,
      name: data.name || '',
      picture: data.picture || '',
      google_id: data.google_id || '',
    };
    localStorage.setItem('auth_token', data.token);
    localStorage.setItem('mp-token', data.token);
    localStorage.setItem('mp-email', data.email);
    localStorage.setItem('mp-user', JSON.stringify(this.user));
    this._renderAuthSlot();
    this._updateDrawerAuth();
  }

  async _validateAndPull() {
    try {
      const res = await fetch(`${API}/api/auth/me`, { headers: this.headers() });
      if (!res.ok) { this.logout(); return; }
      const me = await res.json();
      if (me.name || me.picture) {
        this.user = { email: me.email, name: me.name, picture: me.picture, google_id: me.google_id };
        localStorage.setItem('mp-user', JSON.stringify(this.user));
        this._renderAuthSlot();
      }
      await this.pullCloud();
    } catch (e) { /* offline */ }
  }

  collectLocal() {
    return {
      favorites: JSON.parse(localStorage.getItem('mp-favorites') || '{}'),
      portfolio: JSON.parse(localStorage.getItem('mp-portfolio') || '[]'),
      notes: JSON.parse(localStorage.getItem('mp-notes') || '[]'),
      alerts: JSON.parse(localStorage.getItem('mp-alerts') || '[]'),
      alert_settings: JSON.parse(localStorage.getItem('mp-alert-settings') || '{}'),
      theme: localStorage.getItem('mp-theme') || 'dark',
      calendar_alerts: JSON.parse(localStorage.getItem('mp-calendar-alerts') || '{"enabled":false,"keywords":["FOMC","CPI","NFP","Fed","ECB"],"minutes_before":60}'),
    };
  }

  applyCloud(data) {
    const bundle = this._normalizeCloud(data);
    localStorage.setItem('mp-favorites', JSON.stringify(window.normalizeFavorites?.(bundle.favorites) ?? bundle.favorites));
    localStorage.setItem('mp-portfolio', JSON.stringify(bundle.portfolio));
    localStorage.setItem('mp-notes', JSON.stringify(bundle.notes));
    localStorage.setItem('mp-alerts', JSON.stringify(bundle.alerts));
    localStorage.setItem('mp-alert-settings', JSON.stringify(bundle.alert_settings));
    localStorage.setItem('mp-calendar-alerts', JSON.stringify(bundle.calendar_alerts));
    localStorage.setItem('mp-theme', bundle.theme);
    if (window.themeManager) window.themeManager.set(bundle.theme);
    this._refreshAllUI();
  }

  async pullCloud() {
    if (!this.isLoggedIn()) return;
    const res = await fetch(`${API}/api/user/data`, { headers: this.headers() });
    if (!res.ok) return;
    this.applyCloud(await res.json());
  }

  async pushCloud() {
    if (!this.isLoggedIn()) return;
    const res = await fetch(`${API}/api/user/data`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...this.headers() },
      body: JSON.stringify(this.collectLocal()),
    });
    if (res.ok) Toast.show('Synced to cloud', 'success');
    else Toast.show('Sync failed', 'error');
  }

  scheduleSync() {
    if (!this.isLoggedIn()) return;
    clearTimeout(this._syncTimer);
    this._syncTimer = setTimeout(() => this.pushCloud(), 1500);
  }
}

// ── GLOBAL SIGN-IN ENTRY POINT ────────────────────────────
// All HTML pages call onclick="window.openSignIn(event)"
// This function MUST exist before any button is clicked.
window.openSignIn = function (e) {
  if (e) { e.stopPropagation(); e.preventDefault(); }
  if (!window.authManager) return;
  if (window.authManager.isLoggedIn()) {
    window.authManager.showModal();
  } else {
    window.authManager._openGoogleSignIn();
  }
};

// Global callback required by Google Identity Services
window.handleCredentialResponse = function (response) {
  window.authManager?.handleCredentialResponse(response);
};

// ── AUTO-INJECT GOOGLE GSI SCRIPT IF MISSING ─────────────
// Needed on every page; safe to call multiple times (guards by id)
(function injectGSI() {
  if (document.getElementById('google-gsi-script')) return;
  if (window.google?.accounts?.id) return;
  const s = document.createElement('script');
  s.id  = 'google-gsi-script';
  s.src = 'https://accounts.google.com/gsi/client';
  s.async = true;
  s.defer = true;
  document.head.appendChild(s);
})();

function bootAuthManager() {
  if (window.authManager) return;
  window.authManager = new AuthManager();
  const _origToggle = window.favoritesManager?.toggle?.bind(window.favoritesManager);
  if (_origToggle) {
    window.favoritesManager.toggle = function (...args) {
      const r = _origToggle(...args);
      window.authManager?.scheduleSync();
      return r;
    };
  }
  const _origTheme = window.themeManager?.toggle?.bind(window.themeManager);
  if (_origTheme) {
    window.themeManager.toggle = function () {
      _origTheme();
      window.authManager?.scheduleSync();
    };
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootAuthManager);
} else {
  bootAuthManager();
}
