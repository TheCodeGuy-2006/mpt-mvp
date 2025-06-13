// ...existing code...

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
