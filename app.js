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