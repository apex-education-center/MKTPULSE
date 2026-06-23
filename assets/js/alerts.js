// ═══════════════════════════════════════════════════════
// MARKETPULSE — PRICE ALERTS (free: browser + Telegram)
// ═══════════════════════════════════════════════════════

class PriceAlertManager {
  constructor() {
    this.alerts   = JSON.parse(localStorage.getItem('mp-alerts') || '[]');
    this.settings = JSON.parse(localStorage.getItem('mp-alert-settings') || '{}');
    this.alerts.forEach(a => {
      if (!a.id) a.id = Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    });
    this.watchlist = null;
    this._timer   = null;
  }

  start() {
    this._updateBrowserStatus();
    this._syncServer();
    this.check();
    if (this._timer) clearInterval(this._timer);
    this._timer = setInterval(() => this.check(), 30000);
  }

  getAlerts() { return this.alerts; }

  reloadFromStorage() {
    this.alerts = JSON.parse(localStorage.getItem('mp-alerts') || '[]');
    this.settings = JSON.parse(localStorage.getItem('mp-alert-settings') || '{}');
    this.alerts.forEach(a => {
      if (!a.id) a.id = Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    });
    this._updateBrowserStatus();
  }

  _save() {
    localStorage.setItem('mp-alerts', JSON.stringify(this.alerts));
    localStorage.setItem('mp-alert-settings', JSON.stringify(this.settings));
    this._syncServer();
    window.authManager?.scheduleSync();
    if (typeof this.onChange === 'function') this.onChange();
  }

  async _syncServer() {
    try {
      const base = window.apiClient?.base || 'http://localhost:8000';
      await fetch(`${base}/api/alerts/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alerts: this.alerts,
          telegram_chat_id: this.settings.telegramChatId || '',
        }),
      });
    } catch (e) {}
  }

  addAlert(sym, price, dir) {
    sym = (sym || '').trim().toUpperCase();
    price = parseFloat(price);
    if (!sym || !price) return false;
    this.alerts.push({
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
      sym, price, dir: dir || 'above',
      createdAt: Date.now(),
    });
    this._save();
    return true;
  }

  removeAlert(idx) {
    this.alerts.splice(idx, 1);
    this._save();
  }

  async enableBrowser() {
    if (!('Notification' in window)) {
      window.Toast?.show('Browser notifications not supported', 'warning');
      return false;
    }
    const perm = await Notification.requestPermission();
    this.settings.browserEnabled = perm === 'granted';
    this._save();
    this._updateBrowserStatus();
    if (perm === 'granted') {
      window.Toast?.show('Browser alerts enabled', 'success');
      new Notification('MarketPulse', { body: 'Price alerts are active.' });
    } else {
      window.Toast?.show('Permission denied — enable in browser settings', 'warning');
    }
    return perm === 'granted';
  }

  saveTelegramChatId(raw) {
    const id = (raw || '').trim();
    this.settings.telegramChatId = id;
    this._save();
    window.Toast?.show(id ? 'Telegram chat ID saved' : 'Telegram cleared', 'success');
  }

  async testTelegram() {
    const chatId = this.settings.telegramChatId;
    if (!chatId) {
      window.Toast?.show('Enter your Telegram chat ID first', 'warning');
      return;
    }
    try {
      const base = window.apiClient?.base || 'http://localhost:8000';
      const res = await fetch(`${base}/api/telegram/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId }),
      });
      const data = await res.json();
      if (data.ok) window.Toast?.show('Telegram test sent — check your phone', 'success');
      else window.Toast?.show(data.error || data.detail || 'Telegram failed — set TELEGRAM_BOT_TOKEN on server', 'error');
    } catch (e) {
      window.Toast?.show('Backend offline or Telegram not configured', 'error');
    }
  }

  async checkTelegramStatus() {
    try {
      const base = window.apiClient?.base || 'http://localhost:8000';
      const res = await fetch(`${base}/api/telegram/status`);
      const data = await res.json();
      const el = document.getElementById('alertTelegramStatus');
      if (el) {
        el.textContent = data.configured
          ? 'Bot configured on server'
          : 'Set TELEGRAM_BOT_TOKEN env on server for phone alerts';
      }
    } catch (e) {}
  }

  _updateBrowserStatus() {
    const el = document.getElementById('alertBrowserStatus');
    if (!el) return;
    if (!('Notification' in window)) {
      el.textContent = 'Not supported';
      return;
    }
    const labels = { granted: '✓ Enabled', denied: '✗ Blocked', default: 'Click to enable' };
    el.textContent = labels[Notification.permission] || Notification.permission;
  }

  _priceFor(symbol) {
    const sym = symbol.toUpperCase();
    const all = [
      ...(this.watchlist?.crypto || []),
      ...(this.watchlist?.stocks || []),
      ...(this.watchlist?.commodities || []),
    ];
    const asset = all.find(a => a.symbol.toUpperCase() === sym);
    return asset?.price ?? null;
  }

  async check() {
    try {
      this.watchlist = await window.apiClient.get('/api/watchlist', 2 * 60 * 1000);
    } catch (e) {
      return;
    }

    const toRemove = [];
    for (const alert of this.alerts) {
      const current = this._priceFor(alert.sym);
      if (current == null) continue;
      const hit = alert.dir === 'above' ? current >= alert.price : current <= alert.price;
      if (!hit) continue;

      const dirLabel = alert.dir === 'above' ? 'above' : 'below';
      const msg = `${alert.sym} went ${dirLabel} $${alert.price.toLocaleString()} — now ${window.Fmt.price(current)}`;
      window.Toast?.show(`🔔 ${msg}`, 'warning', 8000);

      if (Notification.permission === 'granted') {
        try {
          new Notification('MarketPulse Price Alert', {
            body: msg,
            tag: `alert-${alert.id}`,
            requireInteraction: true,
          });
        } catch (e) {}
      }

      if (this.settings.telegramChatId) {
        try {
          const base = window.apiClient?.base || 'http://localhost:8000';
          await fetch(`${base}/api/telegram/notify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: this.settings.telegramChatId,
              message: `🔔 <b>${alert.sym}</b> went ${dirLabel} <b>$${alert.price.toLocaleString()}</b>\nCurrent: <b>${window.Fmt.price(current)}</b>`,
            }),
          });
        } catch (e) {}
      }

      toRemove.push(alert.id);
      const row = document.querySelector(`[data-alert-id="${alert.id}"]`);
      if (row) row.classList.add('alert-triggered');
    }

    if (toRemove.length) {
      this.alerts = this.alerts.filter(a => !toRemove.includes(a.id));
      this._save();
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.priceAlerts = new PriceAlertManager();
  window.priceAlerts.start();
  window.priceAlerts.checkTelegramStatus();
});
