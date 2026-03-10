import { escapeHTML, today, daysAgo, monthStart } from './formatters.js';

export let activePreset = 'all';

let _reloadCallback = null;
export function setReloadCallback(fn) {
  _reloadCallback = fn;
}

export function setPreset(p) {
  activePreset = p;
  document.querySelectorAll('.preset').forEach(el => {
    el.classList.toggle('active', el.getAttribute('onclick').includes(`'${p}'`));
  });

  const since = document.getElementById('since');
  const until = document.getElementById('until');

  const map = {
    today:     [today(), today()],
    yesterday: [daysAgo(1), daysAgo(1)],
    '7d':      [daysAgo(6), today()],
    '30d':     [daysAgo(29), today()],
    month:     [monthStart(), today()],
    all:       ['', ''],
  };
  const [s, u] = map[p] || ['',''];
  since.value = s;
  until.value = u;
  updatePeriodPill();
  if (_reloadCallback) _reloadCallback();
}

export function onDateChange() {
  // deactivate all presets when user manually edits dates
  activePreset = 'custom';
  document.querySelectorAll('.preset').forEach(el => el.classList.remove('active'));
  updatePeriodPill();
  if (_reloadCallback) _reloadCallback();
}

export function updatePeriodPill() {
  const s = document.getElementById('since').value;
  const u = document.getElementById('until').value;
  const pill = document.getElementById('period-pill');
  if (!s && !u) {
    pill.innerHTML = 'Showing <strong>all time</strong>';
  } else if (s === u && s) {
    pill.innerHTML = `Showing <strong>${escapeHTML(s)}</strong>`;
  } else {
    pill.innerHTML = `<strong>${escapeHTML(s) || '…'}</strong> → <strong>${escapeHTML(u) || '…'}</strong>`;
  }
}

export function periodLabel() {
  const s = document.getElementById('since').value;
  const u = document.getElementById('until').value;
  if (!s && !u) return 'All time';
  if (s === u && s) return s;
  return `${s || 'start'} → ${u || 'now'}`;
}

const TAB_NAMES = ['overview','daily','sessions','monthly','budget','about'];
export function switchTab(name) {
  document.querySelectorAll('.nav-item').forEach((el, i) => {
    el.classList.toggle('active', TAB_NAMES[i] === name);
  });
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  document.getElementById('tab-' + name).classList.add('active');
}
