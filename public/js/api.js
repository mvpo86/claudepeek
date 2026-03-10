export function getFilters() {
  const since = document.getElementById('since').value.replace(/-/g,'');
  const until = document.getElementById('until').value.replace(/-/g,'');
  const p = new URLSearchParams();
  if (since) p.set('since', since);
  if (until) p.set('until', until);
  return p.toString() ? '?' + p.toString() : '';
}

export async function fetchJSON(endpoint) {
  const res = await fetch('/api/' + endpoint + getFilters());
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export function showError(msg) {
  const el = document.getElementById('error-box');
  el.textContent = msg;
  el.style.display = 'block';
  setTimeout(() => { el.style.display = 'none'; }, 8000);
}
