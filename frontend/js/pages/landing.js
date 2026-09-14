async function displayFlights(params = {}) {
  const res = await api.getFlightsPublic(params);
  const flights = res.data || [];
  const el = document.getElementById('landing-results');
  const empty = document.getElementById('landing-empty');

  if (!flights.length) {
    el.innerHTML = '';
    empty.classList.remove('hidden');
    empty.innerHTML =
      typeof Visuals !== 'undefined'
        ? Visuals.renderEmptyState({
            title: 'No flights found',
            message: 'Try different cities or dates to discover available routes.'
          })
        : 'No flights found. Try different cities or dates.';
    if (typeof Visuals !== 'undefined') Visuals.afterContentUpdate(empty);
    return;
  }
  empty.classList.add('hidden');
  el.innerHTML = flights
    .map((f, i) =>
      UI.renderFlightCard(
        f,
        {
          showLogin: true,
          bookLabel: 'Login to Book',
          bookVariant: 'accent'
        },
        i
      )
    )
    .join('');
  if (typeof Visuals !== 'undefined') Visuals.afterContentUpdate(el);
}

document.getElementById('landing-search').addEventListener('submit', async (e) => {
  e.preventDefault();
  const params = {};
  const s = document.getElementById('source').value.trim();
  const d = document.getElementById('destination').value.trim();
  const date = document.getElementById('date').value;
  if (s) params.source = s;
  if (d) params.destination = d;
  if (date) params.date = date;
  try {
    await displayFlights(params);
  } catch (err) {
    UI.showAlert('alert', err.message);
  }
});

(async function init() {
  try {
    const status = await api.getSetupStatus();
    if (status.data.flightCount === 0) await api.seedFlights();
  } catch (e) { /* optional */ }
  displayFlights().catch((err) => UI.showAlert('alert', err.message));
})();
