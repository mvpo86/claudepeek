import { escapeHTML } from './formatters.js';

export const MODEL_PALETTE = {
  opus:   { bg: 'rgba(192,132,252,0.7)', border: '#c084fc', cls: 'opus' },
  sonnet: { bg: 'rgba(96,165,250,0.7)',  border: '#60a5fa', cls: 'sonnet' },
  haiku:  { bg: 'rgba(52,211,153,0.7)',  border: '#34d399', cls: 'haiku' },
};

export const FALLBACK_COLORS = ['rgba(124,111,255,0.7)','rgba(245,166,35,0.7)','rgba(248,113,113,0.7)','rgba(96,165,250,0.7)'];

export function modelFamily(name) {
  if (name.includes('opus'))   return 'opus';
  if (name.includes('sonnet')) return 'sonnet';
  if (name.includes('haiku'))  return 'haiku';
  return null;
}

export function modelColor(name, idx = 0) {
  const f = modelFamily(name);
  return f ? MODEL_PALETTE[f].bg : FALLBACK_COLORS[idx % FALLBACK_COLORS.length];
}

export function modelBorderColor(name, idx = 0) {
  const f = modelFamily(name);
  return f ? MODEL_PALETTE[f].border : FALLBACK_COLORS[idx % FALLBACK_COLORS.length].replace('0.7','1');
}

export function modelBadge(name) {
  const short = escapeHTML(name.replace('claude-','').replace(/-\d{8}$/,'').replace(/-20\d{6}$/,''));
  const cls   = escapeHTML(modelFamily(name) || '');
  return `<span class="badge ${cls}">${short}</span>`;
}
