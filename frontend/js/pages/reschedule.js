if (!Session.requireAuth()) throw new Error('auth');
UI.renderNavbar(Session.getUser());

const bookingId = new URLSearchParams(location.search).get('bookingId');
const user = Session.getUser();
const dashboardUrl = RolesConfig.getDashboard(user.role);

const selectedSeats = new Set();
let bookingData = null;
let requiredSeatCount = 0;
let selectedFlight = null;

document.getElementById('back-link').href = dashboardUrl;
document.getElementById('error-back-link').href = dashboardUrl;

function showError(message) {
  document.getElementById('loading').classList.add('hidden');
  document.getElementById('reschedule-content').classList.add('hidden');
  document.getElementById('error-panel').classList.remove('hidden');
  document.getElementById('error-message').textContent = message;
}

function renderCurrentBooking(info) {
  const flight = info.currentFlight || {};
  const date = flight.departureDate ? new Date(flight.departureDate).toLocaleDateString() : '—';

  document.getElementById('current-booking-info').innerHTML = `
    <h3>Current Booking — ${UI.escapeHtml(info.bookingReference)}</h3>
    <p><strong>Flight:</strong> ${UI.escapeHtml(flight.flightNumber || '—')} · ${UI.escapeHtml(flight.source || '')} → ${UI.escapeHtml(flight.destination || '')}</p>
    <p><strong>Date:</strong> ${date} · <strong>Departure:</strong> ${UI.escapeHtml(flight.departureTime || '—')}</p>
    <p><strong>Seats:</strong> ${(info.seatNumbers || []).join(', ')}</p>
    <p><strong>Status:</strong> ${UI.escapeHtml(info.status)} · <strong>Payment:</strong> ${UI.escapeHtml(info.paymentStatus)}</p>
    <p><strong>Total:</strong> $${info.totalAmount}${info.paidAmount ? ` · <strong>Paid:</strong> $${info.paidAmount}` : ''}</p>
    ${info.promoCode ? `<p><strong>Promo Code:</strong> ${UI.escapeHtml(info.promoCode)}</p>` : ''}
    ${info.rescheduleCount ? `<p class="text-muted">Previously rescheduled ${info.rescheduleCount} time(s)</p>` : ''}`;
}

function populateFlightPicker(flights) {
  const picker = document.getElementById('new-flight-picker');
  if (!flights.length) {
    picker.innerHTML = '<option value="">No alternative flights available</option>';
    return;
  }

  picker.innerHTML =
    '<option value="">— Select a flight —</option>' +
    flights
      .map((f) => {
        const id = f.id || f._id;
        const date = new Date(f.departureDate).toLocaleDateString();
        return `<option value="${id}">${f.flightNumber}: ${f.source} → ${f.destination} (${date}) — $${f.price}/seat</option>`;
      })
      .join('');
}

function updateNewTotal() {
  if (!selectedFlight) return;
  const total = selectedFlight.price * requiredSeatCount;
  document.getElementById('new-total-price').textContent = String(total);

  const diffEl = document.getElementById('price-difference');
  if (bookingData && bookingData.paidAmount > 0) {
    const diff = total - bookingData.paidAmount;
    diffEl.classList.remove('hidden');
    if (diff > 0) {
      diffEl.textContent = `Additional payment required after reschedule: $${diff.toFixed(2)}`;
      diffEl.style.color = '#b45309';
    } else if (diff < 0) {
      diffEl.textContent = `New fare is $${Math.abs(diff).toFixed(2)} lower than amount paid. No refund issued automatically.`;
      diffEl.style.color = 'var(--accent, #0d9488)';
    } else {
      diffEl.textContent = 'No additional payment required.';
      diffEl.style.color = '';
    }
  } else {
    diffEl.classList.add('hidden');
  }
}

function renderSeatMap(flight) {
  selectedSeats.clear();
  selectedFlight = flight;
  document.getElementById('required-seats').textContent = String(requiredSeatCount);

  const map = document.getElementById('seat-map');
  map.innerHTML = (flight.seats || [])
    .map(
      (s) =>
        `<div class="${s.isBooked ? 'seat booked' : 'seat'}" data-seat="${s.seatNumber}">${s.seatNumber}</div>`
    )
    .join('');

  map.querySelectorAll('.seat:not(.booked)').forEach((seatEl) => {
    seatEl.addEventListener('click', () => {
      const num = seatEl.dataset.seat;
      if (selectedSeats.has(num)) {
        selectedSeats.delete(num);
        seatEl.classList.remove('selected');
      } else if (selectedSeats.size < requiredSeatCount) {
        selectedSeats.add(num);
        seatEl.classList.add('selected');
      } else {
        UI.showAlert('alert', `You can only select ${requiredSeatCount} seat(s)`);
      }
      updateNewTotal();
    });
  });

  const date = new Date(flight.departureDate).toLocaleDateString();
  document.getElementById('new-flight-info').innerHTML = `
    <p><strong>${UI.escapeHtml(flight.airline)}</strong> · ${UI.escapeHtml(flight.flightNumber)}</p>
    <p>${UI.escapeHtml(flight.source)} → ${UI.escapeHtml(flight.destination)} · ${date}</p>
    <p>Departure ${UI.escapeHtml(flight.departureTime)} · Arrival ${UI.escapeHtml(flight.arrivalTime)} · $${flight.price}/seat</p>`;

  updateNewTotal();
  document.getElementById('new-flight-panel').classList.remove('hidden');
}

document.getElementById('new-flight-picker')?.addEventListener('change', async (e) => {
  const flightId = e.target.value;
  if (!flightId) {
    document.getElementById('new-flight-panel').classList.add('hidden');
    return;
  }

  try {
    const res = await api.getFlight(flightId);
    renderSeatMap(res.data);
  } catch (err) {
    UI.showAlert('alert', err.message);
  }
});

document.getElementById('btn-confirm-reschedule')?.addEventListener('click', async () => {
  if (!selectedFlight) {
    UI.showAlert('alert', 'Please select a new flight');
    return;
  }
  if (selectedSeats.size !== requiredSeatCount) {
    UI.showAlert('alert', `Please select exactly ${requiredSeatCount} seat(s)`);
    return;
  }

  if (!confirm('Confirm reschedule to the selected flight and seats?')) return;

  try {
    const res = await api.rescheduleBooking(bookingId, {
      newFlightId: selectedFlight._id || selectedFlight.id,
      seatNumbers: [...selectedSeats]
    });

    UI.showAlert('alert', res.message, 'success');

    const updated = res.data;
    const amountDue = Math.max(0, (updated.totalAmount || 0) - (updated.paidAmount || 0));
    if (updated.paymentStatus === 'pending' && amountDue > 0) {
      setTimeout(() => {
        window.location.href = `payment.html?bookingId=${bookingId}`;
      }, 1500);
    } else {
      setTimeout(() => {
        window.location.href = dashboardUrl;
      }, 1500);
    }
  } catch (err) {
    UI.showAlert('alert', err.message);
  }
});

async function init() {
  if (!bookingId) {
    showError('No booking ID provided.');
    return;
  }

  try {
    const res = await api.getRescheduleOptions(bookingId);
    const { booking, availableFlights } = res.data;

    bookingData = booking;
    requiredSeatCount = booking.seatCount;

    document.getElementById('loading').classList.add('hidden');
    document.getElementById('reschedule-content').classList.remove('hidden');

    renderCurrentBooking(booking);
    populateFlightPicker(availableFlights || []);
  } catch (err) {
    showError(err.message);
  }
}

init();
