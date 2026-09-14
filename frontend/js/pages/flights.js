if (!Session.requireRole('passenger', 'admin', 'user')) throw new Error('auth');
UI.renderNavbar(Session.getUser());

const listEl = document.getElementById('flights-list');
const loadingEl = document.getElementById('flights-loading');
const emptyEl = document.getElementById('flights-empty');
const resultsEl = document.getElementById('search-results');

function renderFlights(flights, isSearch) {
  loadingEl.classList.add('hidden');
  resultsEl.classList.remove('hidden');
  resultsEl.textContent = `${flights.length} flight(s) found`;

  if (!flights.length) {
    emptyEl.classList.remove('hidden');
    const loadBtn = UI.button({ text: 'Load Sample Flights', variant: 'primary', id: 'btn-load-sample' });
    emptyEl.innerHTML =
      typeof Visuals !== 'undefined'
        ? Visuals.renderEmptyState({
            title: 'No flights found',
            message: 'Adjust your search or load sample routes to get started.',
            actionHtml: loadBtn
          })
        : `<p class="mb-1">No flights found.</p>${loadBtn}`;
    listEl.innerHTML = '';
    document.getElementById('btn-load-sample')?.addEventListener('click', async () => {
      await api.seedFlights();
      loadFlights();
    });
    if (typeof Visuals !== 'undefined') Visuals.afterContentUpdate(emptyEl);
    return;
  }
  emptyEl.classList.add('hidden');
  listEl.innerHTML = flights.map((f, i) => UI.renderFlightCard(f, {}, i)).join('');
  if (typeof Visuals !== 'undefined') Visuals.afterContentUpdate(listEl);
}

async function loadFlights(params = {}, isSearch = false) {
  loadingEl.classList.remove('hidden');
  if (typeof Visuals !== 'undefined') {
    loadingEl.innerHTML = Visuals.renderLoadingState('Finding the best flights for you');
  }
  try {
    const res = await api.getFlightsPublic(params);
    renderFlights(res.data || [], isSearch);
  } catch (err) {
    loadingEl.classList.add('hidden');
    UI.showAlert('alert', err.message);
  }
}

document.getElementById('search-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const params = {};
  if (document.getElementById('source').value.trim()) params.source = document.getElementById('source').value.trim();
  if (document.getElementById('destination').value.trim()) params.destination = document.getElementById('destination').value.trim();
  if (document.getElementById('date').value) params.date = document.getElementById('date').value;
  loadFlights(params, true);
});

document.getElementById('btn-clear').addEventListener('click', () => {
  document.getElementById('search-form').reset();
  loadFlights();
});
document.getElementById('btn-show-all')?.addEventListener('click', () => {
  document.getElementById('search-form').reset();
  loadFlights();
});

document.querySelectorAll('.quick-search:not(#btn-show-all)').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.getElementById('source').value = btn.dataset.source || '';
    document.getElementById('destination').value = btn.dataset.dest || '';
    loadFlights({ source: btn.dataset.source, destination: btn.dataset.dest }, true);
  });
});

(async function init() {
  try {
    const s = await api.getSetupStatus();
    if (s.data.flightCount === 0) await api.seedFlights();
  } catch (e) { /* skip */ }
  loadFlights();
})();
