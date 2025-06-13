
import { kpis } from './src/calc.js';

async function loadProgrammes() {
  // 1. list files in /data
  const listURL = './data/';
  // For local dev, we list files manually (since no API)
  const files = ['sample.json'];
  // 2. fetch each JSON file
  const rows = (await Promise.all(
    files.map(item => fetch(listURL + item).then(r => r.json()))
  )).flat();

  // 3. Add KPIs to each row
  rows.forEach(row => {
    Object.assign(row, kpis(row.leads));
  });

  // 4. Initialise Tabulator
  new Tabulator('#gridContainer', {
    data: rows,
    layout: 'fitColumns',
    columns: [
      { title: 'Programme', field: 'programme' },
      { title: 'Leads', field: 'leads' },
      { title: 'MQL', field: 'mql' },
      { title: 'SQL', field: 'sql' },
      { title: 'Opps', field: 'opps' },
      { title: 'Pipeline', field: 'pipeline' }
    ]
  });
}

// Load grid when Programme Grid section is shown
window.addEventListener('hashchange', () => {
  if (location.hash === '#grid') loadProgrammes();
});
if (location.hash === '#grid') loadProgrammes();

// Show the section whose ID matches the current hash
function route() {
  const hash = location.hash || '#budget-setup';
  document.querySelectorAll('section').forEach(sec => {
    const name = '#' + sec.id.replace('view-', '');
    sec.style.display = (name === hash) ? 'block' : 'none';
  });
}

window.addEventListener('hashchange', route);
route(); // Initial call
function downloadJSON(name, obj) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
}

document.getElementById('savePlan').onclick = () => {
  const rows = [...document.querySelectorAll('#planTable tbody tr')];
  const budgets = {};
  rows.forEach(row => {
    const region = row.cells[0].innerText.trim();
    const plan = Number(row.cells[1].querySelector('input').value || 0);
    budgets[region] = { assignedBudget: plan };
  });
  downloadJSON('budgets.json', budgets);
  alert('budgets.json downloaded – commit this file in GitHub');
};
