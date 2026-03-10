import { loadBudgetSettings, saveBudgetSettings, renderBudget } from './budget.js';
import { switchTab, setReloadCallback, setPreset, onDateChange, updatePeriodPill } from './filters.js';
import { filterSessions, toggleGroup } from './renders.js';
import { fetchJSON, showError } from './api.js';
import { renderCards, renderTopDays, renderDailyTable, renderSessions, renderMonthly } from './renders.js';
import { renderDailyChart, renderModelChart } from './charts.js';

// State
let dailyData = [], allDailyData = [], sessionData = [], monthlyData = [];

async function loadAll() {
  document.getElementById('summary-cards').innerHTML = '<div class="loading"><div class="spinner"></div> Loading…</div>';
  try {
    const [daily, allDaily, sessions, monthly] = await Promise.all([
      fetchJSON('daily'),
      fetch('/api/daily').then(r => r.json()),   // unfiltered — always for budget
      fetchJSON('session'),
      fetchJSON('monthly'),
    ]);
    dailyData    = daily.daily      || [];
    allDailyData = allDaily.daily   || [];
    sessionData  = sessions.sessions || [];
    monthlyData  = monthly.monthly   || [];

    renderCards(dailyData, sessionData);
    renderDailyChart(dailyData);
    renderModelChart(dailyData);
    renderTopDays(dailyData);
    renderDailyTable(dailyData);
    renderSessions(sessionData);
    renderMonthly(monthlyData);
    renderBudget(allDailyData);
  } catch (e) {
    showError('Could not load data: ' + e.message);
    console.error(e);
  }
}

// Wire up reload callback so filters.js can trigger loadAll
setReloadCallback(loadAll);

// Expose functions that are called from inline HTML event handlers
window.setPreset = setPreset;
window.onDateChange = onDateChange;
window.switchTab = switchTab;
window.filterSessions = filterSessions;
window.toggleGroup = toggleGroup;
window.saveBudgetSettings = saveBudgetSettings;
window.renderBudget = () => renderBudget(allDailyData);

// Window resize — redraw charts
let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    Chart.instances && Object.values(Chart.instances).forEach(c => c.resize());
  }, 100);
});

// Init
loadBudgetSettings();
switchTab('overview');
loadAll();
