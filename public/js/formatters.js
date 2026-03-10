export function escapeHTML(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

export function fmt(n)  { return '~$' + n.toFixed(2); }

export function fmtN(n) {
  if (n >= 1e9) return (n/1e9).toFixed(2) + 'B';
  if (n >= 1e6) return (n/1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n/1e3).toFixed(1) + 'K';
  return n.toString();
}

export function parseSessionPath(id) {
  const stripped = id.replace(/^-Users-[^-]+/, '') || '/';
  const path = stripped.replace(/-/g, '/') || '/';
  const parts = path.split('/').filter(Boolean);
  const name = parts.length ? parts[parts.length - 1] : '~ (home)';
  const fullPath = parts.length ? '~/' + parts.join('/') : '~';
  return { name, fullPath };
}

export function today()     { return new Date().toISOString().slice(0,10); }
export function daysAgo(n)  { const d = new Date(); d.setDate(d.getDate()-n); return d.toISOString().slice(0,10); }
export function monthStart(){ return new Date().toISOString().slice(0,7) + '-01'; }
export function calDaysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0,10);
}
