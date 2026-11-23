// Shared mock controls: theme, state, menu drawer and Lucide icons. Not part of the design.
var ICONS = {
  'check': '<path d="M20 6 9 17l-5-5"/>',
  'x': '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  'plus': '<path d="M5 12h14"/><path d="M12 5v14"/>',
  'minus': '<path d="M5 12h14"/>',
  'arrow-up': '<path d="m5 12 7-7 7 7"/><path d="M12 19V5"/>',
  'arrow-down': '<path d="M12 5v14"/><path d="m19 12-7 7-7-7"/>',
  'arrow-left': '<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>',
  'arrow-right': '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
  'ellipsis': '<circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>',
  'rotate-cw': '<path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/>',
  'maximize-2': '<path d="M15 3h6v6"/><path d="M9 21H3v-6"/><path d="m21 3-7 7"/><path d="m3 21 7-7"/>',
  'menu': '<path d="M4 6h16"/><path d="M4 12h16"/><path d="M4 18h16"/>',
  'sun': '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>',
  'moon': '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
  'log-out': '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/>',
  'list': '<path d="M3 6h.01"/><path d="M3 12h.01"/><path d="M3 18h.01"/><path d="M8 6h13"/><path d="M8 12h13"/><path d="M8 18h13"/>',
  'eye-off': '<path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.53 13.53 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><path d="m2 2 20 20"/><path d="M14.12 14.12a3 3 0 1 1-4.24-4.24"/>',
  'eye': '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
  'copy': '<rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
  'key': '<path d="m15.5 7.5 2.3 2.3a1 1 0 0 0 1.4 0l2.1-2.1a1 1 0 0 0 0-1.4L19 4"/><path d="m21 2-9.6 9.6"/><circle cx="7.5" cy="15.5" r="5.5"/>',
  'trash-2': '<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
  'chevron-down': '<path d="m6 9 6 6 6-6"/>',
  'loader-circle': '<path d="M21 12a9 9 0 1 1-6.219-8.56"/>',
  'circle-alert': '<circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/>',
  'info': '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
  'wifi-off': '<path d="M12 20h.01"/><path d="M8.5 16.429a5 5 0 0 1 7 0"/><path d="M5 12.859a10 10 0 0 1 5.17-2.69"/><path d="M19 12.859a10 10 0 0 0-2.007-1.523"/><path d="M2 8.82a15 15 0 0 1 4.177-2.643"/><path d="M22 8.82a15 15 0 0 0-11.288-3.764"/><path d="m2 2 20 20"/>',
  'book-open-text': '<path d="M12 7v14"/><path d="M16 12h2"/><path d="M16 8h2"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/><path d="M6 12h2"/><path d="M6 8h2"/>'
};
function renderIcons(root) {
  (root || document).querySelectorAll('i[data-icon]').forEach(function (el) {
    var name = el.getAttribute('data-icon');
    var svg = '<svg class="icon ' + (el.className || '') + '" viewBox="0 0 24 24" aria-hidden="true">' + (ICONS[name] || '') + '</svg>';
    el.outerHTML = svg;
  });
}
function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  document.querySelectorAll('[data-theme-btn]').forEach(function (b) {
    b.classList.toggle('active', b.getAttribute('data-theme-btn') === theme);
  });
}
function setState(id) {
  document.querySelectorAll('.state-view').forEach(function (el) { el.classList.toggle('active', el.id === id); });
  document.querySelectorAll('[data-state-btn]').forEach(function (b) {
    b.classList.toggle('active', b.getAttribute('data-state-btn') === id);
  });
  // Parts shown only in some states: data-show="state-a state-b"
  document.querySelectorAll('[data-show]').forEach(function (el) {
    el.hidden = el.getAttribute('data-show').split(' ').indexOf(id) === -1;
  });
  // Panels opened in some states: data-open-in="state-a"
  document.querySelectorAll('[data-open-in]').forEach(function (el) {
    el.classList.toggle('open', el.getAttribute('data-open-in').split(' ').indexOf(id) !== -1);
  });
}
function toggleDrawer(open) {
  var d = document.getElementById('app-drawer');
  if (!d && open) {
    var nav = document.querySelector('.app-header .nav');
    d = document.createElement('div'); d.id = 'app-drawer';
    d.innerHTML = '<div class="drawer-backdrop" data-menu-close></div>' +
      '<aside class="drawer" role="dialog" aria-modal="true" aria-label="Meniu">' +
      '<div class="row between"><span class="t-h3">Meniu</span><button class="btn btn-icon" data-menu-close aria-label="Închide meniul"><i data-icon="x"></i></button></div>' +
      (nav ? '<nav>' + nav.innerHTML + '</nav>' : '') +
      '<hr class="divider"><div class="stack-sm"><span class="label-text">Limba</span><div class="lang"><button aria-pressed="true" data-toggle>RO</button><button aria-pressed="false" data-toggle>EN</button></div></div>' +
      '<div class="stack-sm"><span class="label-text">Temă</span><div class="seg"><button aria-pressed="true" data-theme-btn="light"><i data-icon="sun" class="sm"></i>Luminoasă</button><button aria-pressed="false" data-theme-btn="dark"><i data-icon="moon" class="sm"></i>Întunecată</button></div></div>' +
      '<button class="btn"><i data-icon="log-out" class="sm"></i>Ieși din cont</button></aside>';
    document.body.appendChild(d); renderIcons(d);
  }
  if (d) d.hidden = !open;
}
document.addEventListener('DOMContentLoaded', function () {
  renderIcons();
  // Review links: ?theme=dark&state=<state id>&menu=1
  var q = new URLSearchParams(location.search);
  if (q.get('theme')) setTheme(q.get('theme'));
  var first = document.querySelector('[data-state-btn].active');
  var state = q.get('state') || (first && first.getAttribute('data-state-btn'));
  if (state) setState(state);
  if (q.get('menu')) toggleDrawer(true);
});
document.addEventListener('click', function (e) {
  var t = e.target.closest('[data-theme-btn]');
  if (t) setTheme(t.getAttribute('data-theme-btn'));
  var th = e.target.closest('.theme-btn');
  if (th) setTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
  var s = e.target.closest('[data-state-btn]');
  if (s) setState(s.getAttribute('data-state-btn'));
  var p = e.target.closest('[aria-pressed][data-toggle]');
  if (p) p.setAttribute('aria-pressed', p.getAttribute('aria-pressed') === 'true' ? 'false' : 'true');
  if (e.target.closest('[data-menu]')) toggleDrawer(true);
  if (e.target.closest('[data-menu-close]')) toggleDrawer(false);
  var o = e.target.closest('[data-open-target]');
  if (o) { var el = document.getElementById(o.getAttribute('data-open-target')); if (el) el.classList.toggle('open'); }
});
