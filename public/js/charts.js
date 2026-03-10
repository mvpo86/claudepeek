import { modelColor, modelBorderColor } from './models.js';
import { today, fmt } from './formatters.js';

let dailyChart = null;
let modelChart = null;
let monthlyChart = null;
let budgetChartInst = null;

export function renderDailyChart(daily) {
  // collect all model names
  const modelSet = new Set();
  daily.forEach(d => (d.modelBreakdowns||[]).forEach(mb => modelSet.add(mb.modelName)));
  const models = [...modelSet];

  const labels = daily.map(d => d.date);
  const datasets = models.map((m, i) => ({
    label: m.replace('claude-','').replace(/-\d{8}$/,'').replace(/-20\d{6}$/,''),
    data: daily.map(d => {
      const mb = (d.modelBreakdowns||[]).find(x => x.modelName === m);
      return mb ? +mb.cost.toFixed(4) : 0;
    }),
    backgroundColor: modelColor(m, i),
    borderColor: modelBorderColor(m, i),
    borderWidth: 1,
    borderRadius: models.length === 1 ? 4 : 0,
    stack: 'stack',
  }));

  // hint
  const todayStr = today();
  const todayEntry = daily.find(d => d.date === todayStr);
  document.getElementById('chart-hint').textContent = todayEntry ? `Today: ${fmt(todayEntry.totalCost)}` : '';

  if (dailyChart) dailyChart.destroy();
  dailyChart = new Chart(document.getElementById('daily-chart'), {
    type: 'bar',
    data: { labels, datasets },
    options: {
      responsive: true,
      interaction: { mode: 'index' },
      plugins: {
        legend: { position: 'bottom', labels: { color: '#9399b8', font: { size: 11 }, padding: 14, boxWidth: 10 } },
        tooltip: {
          callbacks: {
            footer: items => 'Total: $' + items.reduce((s,i) => s + i.raw, 0).toFixed(2)
          }
        }
      },
      scales: {
        x: { stacked: true, ticks: { color: '#5a6080', maxTicksLimit: 12, font: { size: 11 } }, grid: { color: '#181c2e' } },
        y: { stacked: true, ticks: { color: '#5a6080', callback: v => '$'+v, font: { size: 11 } }, grid: { color: '#181c2e' } }
      }
    }
  });
}

export function renderModelChart(daily) {
  const modelTotals = {};
  daily.forEach(d => (d.modelBreakdowns||[]).forEach(mb => {
    modelTotals[mb.modelName] = (modelTotals[mb.modelName]||0) + mb.cost;
  }));
  const sorted = Object.entries(modelTotals).sort((a,b) => b[1]-a[1]);

  if (modelChart) modelChart.destroy();
  if (!sorted.length) return;

  modelChart = new Chart(document.getElementById('model-chart'), {
    type: 'doughnut',
    data: {
      labels: sorted.map(([m]) => m.replace('claude-','').replace(/-\d{8}$/,'').replace(/-20\d{6}$/,'')),
      datasets: [{
        data: sorted.map(([,c]) => +c.toFixed(4)),
        backgroundColor: sorted.map(([m],i) => modelColor(m,i)),
        borderColor: '#161928',
        borderWidth: 3,
        hoverOffset: 6,
      }]
    },
    options: {
      cutout: '62%',
      responsive: true,
      plugins: {
        legend: { position: 'bottom', labels: { color: '#9399b8', font: { size: 11 }, padding: 14, boxWidth: 10 } },
        tooltip: { callbacks: { label: ctx => `  ${ctx.label}: ${fmt(ctx.raw)}` } }
      }
    }
  });
}

export function renderMonthlyChart(monthly) {
  if (monthlyChart) monthlyChart.destroy();
  monthlyChart = new Chart(document.getElementById('monthly-chart'), {
    type: 'bar',
    data: {
      labels: monthly.map(m => m.month),
      datasets: [{
        label: 'Spend ($)',
        data: monthly.map(m => +m.totalCost.toFixed(2)),
        backgroundColor: 'rgba(62,207,142,0.6)',
        borderColor: '#3ecf8e',
        borderWidth: 1,
        borderRadius: 5,
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: '#5a6080', font: { size: 11 } }, grid: { color: '#181c2e' } },
        y: { ticks: { color: '#5a6080', callback: v => '$'+v, font: { size: 11 } }, grid: { color: '#181c2e' } }
      }
    }
  });
}

export function renderBudgetChart(period, periodDays, budget, burn7, safeDaily) {
  // Build full date range for the period
  const allDates = [];
  const startD = new Date(period.start);
  const endD   = new Date(period.end);
  for (let d = new Date(startD); d <= endD; d.setDate(d.getDate() + 1)) {
    allDates.push(d.toISOString().slice(0,10));
  }

  const todayStr  = today();
  const spendMap  = Object.fromEntries(periodDays.map(d => [d.date, d.totalCost]));

  // Actual cumulative
  let cumActual = 0;
  const actualData = allDates.map(date => {
    if (date <= todayStr) {
      cumActual += spendMap[date] || 0;
      return +cumActual.toFixed(4);
    }
    return null;
  });

  // Projected cumulative (continues from today with burn7)
  const projData = allDates.map((date) => {
    if (date < todayStr) return null;
    const daysFromToday = Math.round((new Date(date) - new Date(todayStr)) / 86400000);
    return +(cumActual + burn7 * daysFromToday).toFixed(4);
  });

  // Safe pace (linear from 0 to budget over period)
  const safeData = allDates.map((_, i) => +((i + 1) * safeDaily).toFixed(4));

  // Budget ceiling (flat line)
  const budgetLine = allDates.map(() => budget);

  if (budgetChartInst) budgetChartInst.destroy();
  budgetChartInst = new Chart(document.getElementById('budget-chart'), {
    type: 'bar',
    data: {
      labels: allDates,
      datasets: [
        {
          label: 'Daily spend',
          type: 'bar',
          data: allDates.map(d => d <= todayStr ? (spendMap[d] || 0) : null),
          backgroundColor: allDates.map(d => {
            const v = spendMap[d] || 0;
            return v > safeDaily * 1.3 ? 'rgba(248,113,113,0.6)' : v > safeDaily ? 'rgba(245,166,35,0.6)' : 'rgba(62,207,142,0.5)';
          }),
          borderWidth: 0, borderRadius: 3,
          yAxisID: 'y',
        },
        {
          label: 'Cumulative (actual)',
          type: 'line',
          data: actualData,
          borderColor: '#60a5fa', backgroundColor: 'transparent',
          borderWidth: 2, pointRadius: 0, tension: 0.3,
          yAxisID: 'y2',
        },
        {
          label: 'Projected',
          type: 'line',
          data: projData,
          borderColor: '#f87171', backgroundColor: 'transparent',
          borderWidth: 2, borderDash: [5, 4], pointRadius: 0, tension: 0.3,
          segment: { borderDash: [5, 4] },
          yAxisID: 'y2',
        },
        {
          label: 'Budget limit',
          type: 'line',
          data: budgetLine,
          borderColor: 'rgba(248,113,113,0.5)', backgroundColor: 'transparent',
          borderWidth: 1.5, borderDash: [3, 3], pointRadius: 0,
          yAxisID: 'y2',
        },
        {
          label: 'Safe pace',
          type: 'line',
          data: safeData,
          borderColor: 'rgba(62,207,142,0.4)', backgroundColor: 'transparent',
          borderWidth: 1.5, borderDash: [3, 3], pointRadius: 0,
          yAxisID: 'y2',
        },
      ]
    },
    options: {
      responsive: true,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: {
          position: 'bottom',
          labels: { color: '#9399b8', font: { size: 11 }, padding: 14, boxWidth: 10 },
        },
        tooltip: {
          callbacks: {
            label: ctx => {
              if (ctx.raw === null) return null;
              return `  ${ctx.dataset.label}: $${ctx.raw.toFixed(2)}`;
            }
          }
        }
      },
      scales: {
        x: {
          ticks: { color: '#5a6080', maxTicksLimit: 10, font: { size: 10 } },
          grid: { color: '#181c2e' }
        },
        y: {
          position: 'left',
          ticks: { color: '#5a6080', callback: v => '$'+v, font: { size: 10 } },
          grid: { color: '#181c2e' },
          title: { display: true, text: 'Daily', color: '#5a6080', font: { size: 10 } }
        },
        y2: {
          position: 'right',
          ticks: { color: '#5a6080', callback: v => '$'+v, font: { size: 10 } },
          grid: { display: false },
          title: { display: true, text: 'Cumulative', color: '#5a6080', font: { size: 10 } }
        },
      }
    }
  });
}
