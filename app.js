
import { kpis } from './src/calc.js'; // ensure script type=module or use inline

async function loadProgrammes () {
  // 1. list files in /data
  const listURL = 'https://api.github.com/repos/TheCodeGuy-2006/mpt-mvp/contents/data';
  const list = await fetch(listURL).then(r => r.json());
if (!Array.isArray(list)) {
  alert('Failed to fetch programme files. Check the API URL and repository permissions.');
  return;
}

  // 2. fetch each JSON file
  const rows = await Promise.all(
    list.map(item => fetch(item.download_url).then(r => r.json()))
  );

  initGrid(rows);
}

function initGrid (rows) {
  const table = new Tabulator('#gridContainer', {
    data: rows,
    reactiveData: true,
    selectableRows: 1,
    columns: [
      { title: 'Program Type', field: 'programType', editor: 'input' },
      { title: 'Forecasted Cost', field: 'forecastedCost', editor: 'number' },
      {
        title: 'Expected Leads',
        field: 'expectedLeads',
        editor: 'number',
        cellEdited: cell => {
          const r = cell.getRow();
          Object.assign(r.getData(), kpis(cell.getValue()));
          r.update(r.getData());
          r.getData().__modified = true; // mark as dirty
        }
      },
      { title: 'MQL', field: 'mqlForecast' },
      { title: 'SQL', field: 'sqlForecast' },
      { title: 'Opps', field: 'oppsForecast' },
      { title: 'Pipeline', field: 'pipelineForecast' },
      { title: 'Status', field: 'status',
        editor: 'list', editorParams: { values: ['Planning','Shipped'] } },
      { title: 'Region', field: 'region', editor: 'input' }
    ]
  });

  // UI buttons
  document.getElementById('addRow').onclick = () =>
    table.addRow({
      id: `program-${Date.now()}`,
      status: 'Planning',
      __modified: true
    });

  document.getElementById('delRow').onclick = () =>
    table.getSelectedRows().forEach(r => r.delete());

  document.getElementById('saveRows').onclick = () => {
    const modified = table.getData().filter(r => r.__modified);
    if (modified.length === 0) {
      alert('No changes to save.');
      return;
    }
    Promise.all(modified.map(r => {
      const filename = `${r.id}.json`;
      delete r.__modified;
      return fetch('http://localhost:3000/save-programme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename,
          content: r,
          message: `Update ${filename} from web app`
        })
      })
      .then(res => res.json())
      .then(result => {
        if (!result.success) throw new Error(result.error);
      });
    }))
    .then(() => {
      alert('Saved to GitHub!');
    })
    .catch(err => {
      alert('Failed to save: ' + err.message);
    });
  };
}

// run once the page loads
if (location.hash === '#grid' || location.hash === '') loadProgrammes();

// Ensure grid and button handlers are set up every time user navigates to Programme Grid
window.addEventListener('hashchange', () => {
  if (location.hash === '#grid') loadProgrammes();
});

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
