import { escapeHTML, fmt, fmtN, parseSessionPath, today } from './formatters.js';
import { modelBadge } from './models.js';
import { periodLabel } from './filters.js';
import { renderMonthlyChart } from './charts.js';

let allSessions = [];

export function renderCards(daily, sessions) {
  const totalCost   = daily.reduce((s, d) => s + d.totalCost, 0);
  const avgDaily    = daily.length ? totalCost / daily.length : 0;
  const topDay      = [...daily].sort((a,b) => b.totalCost - a.totalCost)[0];
  const totalTokens = daily.reduce((s, d) => s + d.totalTokens, 0);

  const modelTotals = {};
  daily.forEach(d => (d.modelBreakdowns||[]).forEach(mb => {
    modelTotals[mb.modelName] = (modelTotals[mb.modelName]||0) + mb.cost;
  }));
  const topModel = Object.entries(modelTotals).sort((a,b) => b[1]-a[1])[0];

  const label = periodLabel();
  document.getElementById('overview-meta').textContent = label;

  document.getElementById('summary-cards').innerHTML = `
    <div class="card" style="--card-color:var(--green)">
      <div class="card-label">Total spend</div>
      <div class="card-value">${fmt(totalCost)}</div>
      <div class="card-sub">${daily.length} active day${daily.length !== 1 ? 's' : ''} · ${label}</div>
    </div>
    <div class="card" style="--card-color:var(--yellow)">
      <div class="card-label">Avg per active day</div>
      <div class="card-value">${fmt(avgDaily)}</div>
      <div class="card-sub">only counts days you used Claude</div>
    </div>
    <div class="card" style="--card-color:var(--red)">
      <div class="card-label">Highest single day</div>
      <div class="card-value">${topDay ? fmt(topDay.totalCost) : '—'}</div>
      <div class="card-sub">${topDay ? escapeHTML(topDay.date) : 'no data'}</div>
    </div>
    <div class="card" style="--card-color:var(--accent)">
      <div class="card-label">Top model by spend</div>
      <div class="card-value" style="font-size:16px;padding-top:4px">${topModel ? escapeHTML(topModel[0].replace('claude-','').replace(/-\d{8}$/,'').replace(/-20\d{6}$/,'')) : '—'}</div>
      <div class="card-sub">${topModel ? fmt(topModel[1]) + ' of total' : ''}</div>
    </div>
    <div class="card" style="--card-color:var(--blue)">
      <div class="card-label">Total tokens</div>
      <div class="card-value">${fmtN(totalTokens)}</div>
      <div class="card-sub">${sessions.length} session${sessions.length !== 1 ? 's' : ''}</div>
    </div>
  `;
}

export function renderTopDays(daily) {
  const top = [...daily].sort((a,b) => b.totalCost - a.totalCost).slice(0, 10);
  const maxCost = top[0]?.totalCost || 1;
  const todayStr = today();
  document.getElementById('top-days-meta').textContent = `${top.length} of ${daily.length} days`;
  document.getElementById('top-days-body').innerHTML = top.length ? top.map((d, i) => `
    <tr${d.date === todayStr ? ' class="today-row"' : ''}>
      <td style="color:var(--text3);width:32px">${i+1}</td>
      <td>${escapeHTML(d.date)}${d.date === todayStr ? ' <span style="font-size:10px;color:var(--accent);background:var(--accent-dim);padding:1px 6px;border-radius:10px">today</span>' : ''}</td>
      <td>
        <div class="cost-cell">
          <span class="cost-amount" style="color:var(--green)">${fmt(d.totalCost)}</span>
          <div class="bar-track"><div class="bar-fill" style="width:${(d.totalCost/maxCost*100).toFixed(1)}%"></div></div>
        </div>
      </td>
      <td style="color:var(--text2)">${fmtN(d.totalTokens)}</td>
      <td>${(d.modelsUsed||[]).map(m => modelBadge(m)).join(' ')}</td>
    </tr>
  `).join('') : `<tr><td colspan="5" class="empty">No data for this period</td></tr>`;
}

export function renderDailyTable(daily) {
  const total = daily.reduce((s,d) => s+d.totalCost, 0);
  const sorted = [...daily].sort((a,b) => b.date.localeCompare(a.date));
  const todayStr = today();
  document.getElementById('daily-meta').textContent = periodLabel();
  document.getElementById('daily-total-meta').textContent = `${sorted.length} days · Total: ${fmt(total)}`;
  document.getElementById('daily-body').innerHTML = sorted.length ? sorted.map(d => `
    <tr${d.date === todayStr ? ' class="today-row"' : ''}>
      <td>${escapeHTML(d.date)}${d.date === todayStr ? ' <span style="font-size:10px;color:var(--accent);background:var(--accent-dim);padding:1px 6px;border-radius:10px">today</span>' : ''}</td>
      <td><span style="color:var(--green);font-weight:600">${fmt(d.totalCost)}</span></td>
      <td style="color:var(--text2)">${fmtN(d.inputTokens)}</td>
      <td style="color:var(--text2)">${fmtN(d.outputTokens)}</td>
      <td style="color:var(--text2)">${fmtN(d.cacheCreationTokens)}</td>
      <td style="color:var(--text2)">${fmtN(d.cacheReadTokens)}</td>
      <td>${(d.modelsUsed||[]).map(m => modelBadge(m)).join(' ')}</td>
    </tr>
  `).join('') : `<tr><td colspan="7" class="empty">No data for this period</td></tr>`;
}

export function renderSessions(sessions) {
  allSessions = [...sessions].sort((a,b) => b.totalCost - a.totalCost);
  filterSessions();
}

export function getSessionUUID(projectPath) {
  if (!projectPath || projectPath === 'Unknown Project') return null;
  const last = projectPath.split('/').pop();
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(last) ? last : null;
}

export function toggleGroup(groupId) {
  const rows = document.querySelectorAll(`[data-group="${groupId}"]`);
  const toggle = document.querySelector(`[data-group-id="${groupId}"] .group-toggle`);
  const isOpen = toggle && toggle.classList.contains('open');
  rows.forEach(r => { r.style.display = isOpen ? 'none' : ''; });
  if (toggle) toggle.classList.toggle('open', !isOpen);
}

export function filterSessions() {
  const q = document.getElementById('session-search').value.toLowerCase();
  const filtered = allSessions.filter(s => {
    if (!q) return true;
    const { name, fullPath } = parseSessionPath(s.sessionId);
    const uuid = getSessionUUID(s.projectPath) || '';
    return name.toLowerCase().includes(q) || fullPath.toLowerCase().includes(q) || s.sessionId.toLowerCase().includes(q) || uuid.includes(q);
  });

  // Group by sessionId (project)
  const groupMap = new Map();
  filtered.forEach(s => {
    if (!groupMap.has(s.sessionId)) groupMap.set(s.sessionId, []);
    groupMap.get(s.sessionId).push(s);
  });
  // Sort groups by total cost desc
  const groups = [...groupMap.entries()]
    .map(([id, sessions]) => ({
      id,
      sessions: [...sessions].sort((a,b) => (b.lastActivity||'').localeCompare(a.lastActivity||'')),
      totalCost: sessions.reduce((s,x) => s+x.totalCost, 0),
      totalTokens: sessions.reduce((s,x) => s+x.totalTokens, 0),
      lastActivity: sessions.map(s=>s.lastActivity||'').sort().pop(),
      modelsUsed: [...new Set(sessions.flatMap(s => s.modelsUsed||[]))],
    }))
    .sort((a,b) => b.totalCost - a.totalCost);

  const total = filtered.reduce((s,x) => s+x.totalCost, 0);
  document.getElementById('sessions-meta').textContent = 'All-time cost · active in ' + periodLabel();
  document.getElementById('session-count-meta').textContent = `${filtered.length} of ${allSessions.length} sessions · ${groups.length} project${groups.length !== 1 ? 's' : ''} · Total: ${fmt(total)}`;

  const maxCost = groups[0]?.totalCost || 1;
  if (!groups.length) {
    document.getElementById('sessions-body').innerHTML = `<tr><td colspan="5" class="empty">No sessions match your search</td></tr>`;
    return;
  }

  document.getElementById('sessions-body').innerHTML = groups.map(g => {
    const { name, fullPath } = parseSessionPath(g.id);
    const multi = g.sessions.length > 1;
    const groupId = 'grp-' + g.id.replace(/[^a-z0-9]/gi, '_');
    const header = `
    <tr class="session-group-header" onclick="${multi ? `toggleGroup('${groupId}')` : ''}" data-group-id="${groupId}" style="${multi ? '' : 'cursor:default'}">
      <td>
        <span class="group-toggle${multi ? '' : ' open'}">${multi ? '▶' : ''}</span>
        <span class="session-name">${escapeHTML(name)}${multi ? `<span class="session-count-badge">${g.sessions.length}</span>` : ''}</span>
        <div class="session-path" style="margin-left:14px">${escapeHTML(fullPath)}</div>
      </td>
      <td>
        <div class="cost-cell">
          <span class="cost-amount" style="color:var(--green)">${fmt(g.totalCost)}</span>
          <div class="bar-track"><div class="bar-fill" style="width:${(g.totalCost/maxCost*100).toFixed(1)}%"></div></div>
        </div>
      </td>
      <td style="color:var(--text2)">${fmtN(g.totalTokens)}</td>
      <td style="color:var(--text2)">${escapeHTML(g.lastActivity || '—')}</td>
      <td>${g.modelsUsed.map(m => modelBadge(m)).join(' ')}</td>
    </tr>`;

    if (!multi) return header;

    const children = g.sessions.map(s => {
      const uuid = getSessionUUID(s.projectPath);
      return `
      <tr class="session-child-row" data-group="${groupId}" style="display:none">
        <td>
          <div class="session-name">${uuid ? uuid.slice(0,8) : 'session'}</div>
          <div class="session-path">${escapeHTML(s.lastActivity || '—')}</div>
        </td>
        <td>
          <span class="cost-amount" style="color:var(--green)">${fmt(s.totalCost)}</span>
        </td>
        <td style="color:var(--text2)">${fmtN(s.totalTokens)}</td>
        <td style="color:var(--text2)">${s.lastActivity || '—'}</td>
        <td>${(s.modelsUsed||[]).map(m => modelBadge(m)).join(' ')}</td>
      </tr>`;
    }).join('');

    return header + children;
  }).join('');
}

export function renderMonthly(monthly) {
  const sorted = [...monthly].sort((a,b) => b.month.localeCompare(a.month));
  document.getElementById('monthly-meta').textContent = `${sorted.length} months`;

  document.getElementById('monthly-grid').innerHTML = sorted.map(m => {
    const top = [...(m.modelBreakdowns||[])].sort((a,b)=>b.cost-a.cost)[0];
    const topName = top ? top.modelName.replace('claude-','').replace(/-\d{8}$/,'').replace(/-20\d{6}$/,'') : '—';
    return `
    <div class="monthly-card">
      <h4>
        ${escapeHTML(m.month)}
        <span class="monthly-cost">${fmt(m.totalCost)}</span>
      </h4>
      <div class="monthly-row"><span class="key">Top model</span><span class="val">${modelBadge(top?.modelName||'')}</span></div>
      <div class="monthly-row"><span class="key">Total tokens</span><span class="val">${fmtN(m.totalTokens)}</span></div>
      <div class="monthly-row"><span class="key">Input</span><span class="val">${fmtN(m.inputTokens)}</span></div>
      <div class="monthly-row"><span class="key">Output</span><span class="val">${fmtN(m.outputTokens)}</span></div>
      <div class="monthly-row"><span class="key">Cache write</span><span class="val">${fmtN(m.cacheCreationTokens)}</span></div>
      <div class="monthly-row"><span class="key">Cache read</span><span class="val">${fmtN(m.cacheReadTokens)}</span></div>
    </div>
  `}).join('');

  renderMonthlyChart(monthly);
}
