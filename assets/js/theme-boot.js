// Runs synchronously in <head> before paint — restores theme on every page load
(function () {
  var t = null;
  try {
    var q = new URLSearchParams(location.search).get('theme');
    if (q === 'light' || q === 'dark') t = q;
    if (!t) t = localStorage.getItem('mp-theme');
    if (t !== 'light' && t !== 'dark') t = 'dark';
    localStorage.setItem('mp-theme', t);
  } catch (e) {
    t = 'dark';
  }
  document.documentElement.setAttribute('data-theme', t);
})();

// Google Identity Services — load once, early (no render until auth.js)
(function () {
  if (document.querySelector('script[src*="accounts.google.com/gsi/client"]')) return;
  var s = document.createElement('script');
  s.src = 'https://accounts.google.com/gsi/client';
  s.async = true;
  s.defer = true;
  document.head.appendChild(s);
})();
