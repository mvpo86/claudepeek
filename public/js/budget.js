import { fmt, today, calDaysAgo } from './formatters.js';
import { renderBudgetChart } from './charts.js';

export function loadBudgetSettings() {
  const s = JSON.parse(localStorage.getItem('ccusage_budget') || '{}');
  document.getElementById('budget-amount').value    = s.amount    ?? 200;
  document.getElementById('budget-reset-day').value = s.resetDay  ?? 1;
}

export function saveBudgetSettings() {
  localStorage.setItem('ccusage_budget', JSON.stringify({
    amount:   parseFloat(document.getElementById('budget-amount').value)   || 200,
    resetDay: parseInt(document.getElementById('budget-reset-day').value)  || 1,
  }));
}

export function getBudgetPeriod(resetDay) {
  const now = new Date();
  const d = now.getDate();
  let start, end;
  if (d >= resetDay) {
    start = new Date(now.getFullYear(), now.getMonth(), resetDay);
    end   = new Date(now.getFullYear(), now.getMonth() + 1, resetDay - 1);
  } else {
    start = new Date(now.getFullYear(), now.getMonth() - 1, resetDay);
    end   = new Date(now.getFullYear(), now.getMonth(), resetDay - 1);
  }
  const todayD  = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const daysTotal   = Math.round((end - start)   / 86400000) + 1;
  const daysElapsed = Math.round((todayD - start) / 86400000) + 1;
  const daysLeft    = Math.round((end - todayD)   / 86400000);
  return {
    start:  start.toISOString().slice(0,10),
    end:    end.toISOString().slice(0,10),
    daysTotal, daysElapsed, daysLeft,
  };
}

export function renderBudget(allDailyData) {
  const budget   = parseFloat(document.getElementById('budget-amount').value)  || 200;
  const resetDay = parseInt(document.getElementById('budget-reset-day').value) || 1;
  const period   = getBudgetPeriod(resetDay);
  const todayStr = today();

  // Spend this period
  const periodDays = allDailyData.filter(d => d.date >= period.start && d.date <= period.end);
  const spent = periodDays.reduce((s, d) => s + d.totalCost, 0);

  // Burn rates (last 7 / 14 / 30 calendar days)
  function burnRate(calDays) {
    const since = calDaysAgo(calDays - 1);
    const sum = allDailyData
      .filter(d => d.date >= since && d.date <= todayStr)
      .reduce((s, d) => s + d.totalCost, 0);
    return sum / calDays;
  }
  const burn7  = burnRate(7);
  const burn14 = burnRate(14);

  const remaining  = Math.max(0, budget - spent);
  const daysLeft   = period.daysLeft;
  const safeDaily  = daysLeft > 0 ? remaining / daysLeft : 0;

  const projMid    = spent + burn7           * daysLeft;
  const projWorst  = spent + (burn7 * 1.5)  * daysLeft;

  const pct        = Math.min(spent / budget, 1);
  const projPct    = Math.min(projMid / budget, 1);
  const overProj   = projMid > budget;

  const status = spent >= budget ? 'danger' : projMid > budget * 0.9 ? 'warn' : 'safe';
  const statusLabels = { safe: 'On track', warn: 'Watch out', danger: 'Over budget' };

  // ── DOM updates ──
  document.getElementById('b-spent').textContent        = fmt(spent);
  document.getElementById('b-spent').style.color        = status === 'danger' ? 'var(--red)' : status === 'warn' ? 'var(--yellow)' : 'var(--green)';
  document.getElementById('b-of').textContent           = `of ${fmt(budget)}`;
  document.getElementById('b-remaining').textContent    = fmt(remaining);
  document.getElementById('b-remaining').style.color    = remaining < budget * 0.15 ? 'var(--red)' : remaining < budget * 0.3 ? 'var(--yellow)' : 'var(--green)';
  document.getElementById('b-remaining-sub').textContent= `${(pct * 100).toFixed(1)}% used`;
  document.getElementById('b-days-left').textContent    = daysLeft >= 0 ? daysLeft : 0;
  document.getElementById('b-days-sub').textContent     = `period ends ${period.end}`;
  document.getElementById('b-safe-daily').textContent   = safeDaily > 0 ? fmt(safeDaily) : '—';
  document.getElementById('b-safe-daily').style.color   = safeDaily > burn7 * 1.2 ? 'var(--green)' : safeDaily > 0 ? 'var(--blue)' : 'var(--red)';
  document.getElementById('b-burn7').textContent        = fmt(burn7);
  document.getElementById('b-burn7').style.color        = burn7 > safeDaily ? 'var(--red)' : 'var(--text)';
  document.getElementById('b-burn7-sub').textContent    = burn7 > safeDaily
    ? `${fmt(burn7 - safeDaily)}/day over safe limit`
    : `${fmt(safeDaily - burn7)}/day under safe limit`;
  document.getElementById('b-projected').textContent    = fmt(projMid);
  document.getElementById('b-projected').style.color    = projMid > budget ? 'var(--red)' : projMid > budget * 0.9 ? 'var(--yellow)' : 'var(--green)';
  document.getElementById('b-projected-sub').textContent= projMid > budget
    ? `${fmt(projMid - budget)} over budget`
    : `${fmt(budget - projMid)} under budget`;

  // Status badge
  const badge = document.getElementById('b-status-badge');
  badge.className = `status-badge ${status}`;
  badge.innerHTML = `<span class="status-dot"></span> ${statusLabels[status]}`;

  const sub = document.getElementById('b-status-sub');
  if (status === 'danger') {
    sub.textContent = `You've exceeded your budget by ${fmt(spent - budget)}`;
    sub.style.color = 'var(--red)';
  } else if (status === 'warn') {
    const daysUntilOut = burn7 > 0 ? remaining / burn7 : Infinity;
    const outDate = new Date(); outDate.setDate(outDate.getDate() + Math.floor(daysUntilOut));
    sub.textContent = `At current rate, budget runs out ~${outDate.toISOString().slice(0,10)}`;
    sub.style.color = 'var(--yellow)';
  } else {
    sub.textContent = `${period.daysElapsed} of ${period.daysTotal} days elapsed`;
    sub.style.color = 'var(--text3)';
  }

  // Progress bar
  const bar = document.getElementById('b-bar');
  bar.style.width     = (pct * 100).toFixed(1) + '%';
  bar.className       = `budget-bar-inner ${status}`;
  const projBar       = document.getElementById('b-bar-proj');
  if (overProj && projPct > pct) {
    projBar.style.left  = (pct * 100).toFixed(1) + '%';
    projBar.style.width = ((projPct - pct) * 100).toFixed(1) + '%';
    projBar.style.display = 'block';
    document.getElementById('b-bar-proj-label').textContent = `Projected: ${fmt(projMid)}`;
  } else {
    projBar.style.display = 'none';
    document.getElementById('b-bar-proj-label').textContent = '';
  }
  document.getElementById('b-bar-left').textContent  = `${fmt(spent)} spent`;
  document.getElementById('b-bar-right').textContent = `${fmt(budget)} budget`;
  document.getElementById('b-chart-hint').textContent = `${period.daysElapsed}d elapsed · ${daysLeft}d remaining`;

  // Scenarios table
  const scenarios = [
    { name: 'Optimistic', cls: 'safe',   rate: burn7 * 0.5,  desc: 'Half of recent avg' },
    { name: 'Current pace', cls: status,  rate: burn7,         desc: '7-day average' },
    { name: 'Elevated',   cls: 'warn',   rate: burn14,        desc: '14-day average' },
    { name: 'Heavy use',  cls: 'danger', rate: burn7 * 1.5,   desc: '1.5× recent avg' },
  ];
  document.getElementById('b-scenarios').innerHTML = scenarios.map(s => {
    const proj = spent + s.rate * daysLeft;
    const diff = proj - budget;
    const ovr  = diff > 0;
    const cls  = proj > budget ? 'danger' : proj > budget * 0.9 ? 'warn' : 'safe';
    const colors = { safe: 'var(--green)', warn: 'var(--yellow)', danger: 'var(--red)' };
    return `
    <div class="scenario-row">
      <div><div class="scenario-name">${s.name}</div><div class="scenario-desc">${s.desc}</div></div>
      <div style="color:var(--text2)">${fmt(s.rate)}/day</div>
      <div style="color:${colors[cls]};font-weight:600">${fmt(proj)}</div>
      <div class="scenario-pct" style="color:${ovr ? 'var(--red)' : 'var(--green)'}">
        ${ovr ? '+' : ''}${fmt(diff)} (${ovr ? 'over' : 'under'})
      </div>
    </div>`;
  }).join('');

  // Advice tip
  const tipEl = document.getElementById('b-tip');
  if (status === 'danger') {
    tipEl.innerHTML = `<strong>You've exceeded your budget.</strong> You spent ${fmt(spent)} against a ${fmt(budget)} budget this period. Consider switching to lighter models (Haiku) for routine tasks, or reducing context window usage.`;
  } else if (status === 'warn') {
    tipEl.innerHTML = `<strong>Heads up:</strong> At your current 7-day burn rate of <strong>${fmt(burn7)}/day</strong>, you're projected to spend <strong>${fmt(projMid)}</strong> this period — over your <strong>${fmt(budget)}</strong> budget. Your safe daily allowance is <strong>${fmt(safeDaily)}/day</strong>. Try using Sonnet or Haiku instead of Opus on less critical tasks.`;
  } else if (burn7 < safeDaily * 0.5) {
    tipEl.innerHTML = `<strong>Well within budget.</strong> Your 7-day burn rate is <strong>${fmt(burn7)}/day</strong>, well below your safe daily allowance of <strong>${fmt(safeDaily)}/day</strong>. You have plenty of headroom — projected to spend <strong>${fmt(projMid)}</strong> of your <strong>${fmt(budget)}</strong> budget.`;
  } else {
    tipEl.innerHTML = `<strong>On track.</strong> You've spent <strong>${fmt(spent)}</strong> with ${daysLeft} days left. At <strong>${fmt(burn7)}/day</strong>, projected total is <strong>${fmt(projMid)}</strong>. Safe daily limit is <strong>${fmt(safeDaily)}/day</strong>.`;
  }

  // Chart
  renderBudgetChart(period, periodDays, budget, burn7, safeDaily);
}
