if (!Session.requireRole('passenger', 'agent', 'admin', 'user')) throw new Error('auth');
UI.renderNavbar(Session.getUser());

const user = Session.getUser();
const isAgent = user.role === 'agent' || user.role === 'admin';
const selectedSeats = new Set();
let passengerCount = 1;
let appliedPromo = null;

let currentFlightId = new URLSearchParams(location.search).get('id');
let currentFlight = null;

const el = {
  loading: document.getElementById('loading'),
  content: document.getElementById('booking-content'),
  agentPicker: document.getElementById('agent-select-flight'),
  noFlight: document.getElementById('no-flight-msg'),
  flightPicker: document.getElementById('flight-picker'),
  changeFlightBtn: document.getElementById('btn-change-flight')
};

function hideAllPanels() {
  el.loading.classList.add('hidden');
  el.content.classList.add('hidden');
  el.agentPicker.classList.add('hidden');
  el.noFlight.classList.add('hidden');
}

function updatePriceDisplay() {
  if (!currentFlight) return;
  const subtotal = currentFlight.price * selectedSeats.size;
  document.getElementById('subtotal-price').textContent = String(subtotal);

  const discountLine = document.getElementById('discount-line');
  const discountAmountEl = document.getElementById('discount-amount');

  if (appliedPromo && appliedPromo.valid) {
    discountLine.classList.remove('hidden');
    discountAmountEl.textContent = String(appliedPromo.discountApplied);
    document.getElementById('total-price').textContent = String(appliedPromo.finalAmount);
  } else {
    discountLine.classList.add('hidden');
    document.getElementById('total-price').textContent = String(subtotal);
  }
}

function renderSeatMap(flight) {
  const map = document.getElementById('seat-map');
  selectedSeats.clear();
  appliedPromo = null;
  document.getElementById('promo-feedback')?.classList.add('hidden');
  document.getElementById('promo-discount-line')?.classList.add('hidden');
  document.getElementById('discount-code').value = '';
  updatePriceDisplay();

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
      } else {
        selectedSeats.add(num);
        seatEl.classList.add('selected');
      }
      appliedPromo = null;
      document.getElementById('promo-feedback')?.classList.add('hidden');
      document.getElementById('promo-discount-line')?.classList.add('hidden');
      updatePriceDisplay();
    });
  });
}

document.getElementById('btn-apply-promo')?.addEventListener('click', async () => {
  const code = document.getElementById('discount-code').value.trim();
  const feedback = document.getElementById('promo-feedback');
  const discountLine = document.getElementById('promo-discount-line');

  if (!code) {
    UI.showAlert('alert', 'Please enter a promo code');
    return;
  }
  if (!selectedSeats.size) {
    UI.showAlert('alert', 'Please select at least one seat first');
    return;
  }

  const amount = currentFlight.price * selectedSeats.size;
  try {
    const res = await api.validatePromoCode(code, amount);
    appliedPromo = res.data;
    feedback.textContent = res.data.message;
    feedback.classList.remove('hidden');
    feedback.style.color = 'var(--accent, #0d9488)';
    discountLine.textContent = `You save $${res.data.discountApplied} (${res.data.discountType === 'percentage' ? res.data.discountValue + '%' : '$' + res.data.discountValue} off)`;
    discountLine.classList.remove('hidden');
    updatePriceDisplay();
  } catch (err) {
    appliedPromo = null;
    feedback.textContent = err.message;
    feedback.classList.remove('hidden');
    feedback.style.color = '#dc2626';
    discountLine.classList.add('hidden');
    updatePriceDisplay();
  }
});

async function loadPassengersIntoForm() {
  const wrap = document.getElementById('agent-passenger-wrap');
  const select = document.getElementById('passenger-user-id');
  wrap.classList.remove('hidden');

  const res = await api.getPassengers();
  const passengers = res.data || [];
  if (!passengers.length) {
    select.innerHTML = '<option value="">No passengers registered</option>';
    return;
  }

  select.innerHTML =
    '<option value="">— Select passenger —</option>' +
    passengers
      .map((p) => `<option value="${p.id}" data-name="${p.name}" data-email="${p.email}">${p.name} (${p.email})</option>`)
      .join('');

  select.onchange = () => {
    const opt = select.selectedOptions[0];
    if (!opt || !opt.value) return;
    document.getElementById('passenger-name').value = opt.dataset.name || '';
    document.getElementById('passenger-email').value = opt.dataset.email || '';
  };
}

async function showBookingForFlight(flightId) {
  hideAllPanels();
  el.loading.classList.remove('hidden');
  currentFlightId = flightId;

  try {
    const res = await api.getFlight(flightId);
    currentFlight = res.data;

    el.loading.classList.add('hidden');
    el.content.classList.remove('hidden');
    if (isAgent) el.changeFlightBtn.classList.remove('hidden');

    const date = new Date(currentFlight.departureDate).toLocaleDateString();
    document.getElementById('flight-info').innerHTML = `
      <div class="flight-card-header">
        <span class="flight-airline">${UI.escapeHtml(currentFlight.airline)}</span>
        <span class="flight-number">${UI.escapeHtml(currentFlight.flightNumber)}</span>
      </div>
      <div class="flight-route">
        <div class="flight-city">
          <div class="code">${UI.escapeHtml(UI.cityCode(currentFlight.source))}</div>
          <div class="name">${UI.escapeHtml(currentFlight.source)}</div>
        </div>
        <div class="flight-path" aria-hidden="true">✈<span class="duration">${date}</span></div>
        <div class="flight-city" style="text-align:right">
          <div class="code">${UI.escapeHtml(UI.cityCode(currentFlight.destination))}</div>
          <div class="name">${UI.escapeHtml(currentFlight.destination)}</div>
        </div>
      </div>
      <p class="flight-price mt-1">$${UI.escapeHtml(currentFlight.price)} <span>per seat</span></p>`;

    if (isAgent) {
      await loadPassengersIntoForm();
    } else {
      document.getElementById('passenger-name').value = user.name || '';
      document.getElementById('passenger-email').value = user.email || '';
    }

    renderSeatMap(currentFlight);
  } catch (err) {
    el.loading.classList.add('hidden');
    UI.showAlert('alert', err.message);
    if (isAgent) showAgentFlightPicker();
    else {
      el.noFlight.classList.remove('hidden');
    }
  }
}

async function showAgentFlightPicker() {
  hideAllPanels();
  el.agentPicker.classList.remove('hidden');
  el.flightPicker.innerHTML = '<option value="">Loading flights...</option>';

  try {
    const res = await api.getFlights();
    const flights = res.data || [];
    if (!flights.length) {
      el.flightPicker.innerHTML = '<option value="">No flights available — ask admin to add flights</option>';
      return;
    }
    el.flightPicker.innerHTML =
      '<option value="">— Select a flight —</option>' +
      flights
        .map((f) => {
          const id = f.id || f._id;
          const date = new Date(f.departureDate).toLocaleDateString();
          return `<option value="${id}">${f.flightNumber}: ${f.source} → ${f.destination} (${date}) — $${f.price}</option>`;
        })
        .join('');
  } catch (err) {
    el.flightPicker.innerHTML = `<option value="">Error: ${err.message}</option>`;
    UI.showAlert('alert', err.message);
  }
}

document.getElementById('btn-continue-flight')?.addEventListener('click', () => {
  const id = el.flightPicker.value;
  if (!id) {
    UI.showAlert('alert', 'Please select a flight from the list');
    return;
  }
  showBookingForFlight(id);
});

el.changeFlightBtn?.addEventListener('click', () => {
  if (isAgent) showAgentFlightPicker();
  else window.location.href = 'flights.html';
});

document.getElementById('add-passenger-btn')?.addEventListener('click', () => {
  if (passengerCount >= selectedSeats.size) {
    UI.showAlert('alert', 'Cannot add more passengers than selected seats');
    return;
  }
  
  passengerCount++;
  const container = document.getElementById('passengers-container');
  const passengerForm = document.createElement('div');
  passengerForm.className = 'passenger-form';
  passengerForm.dataset.passengerIndex = passengerCount - 1;
  passengerForm.innerHTML = `
    <h4>Passenger ${passengerCount}</h4>
    <div class="form-group">
      <label>Passenger name</label>
      <div class="input-wrap">
        <span class="input-icon" aria-hidden="true">👤</span>
        <input class="input-field passenger-name" required>
      </div>
    </div>
    <div class="form-group">
      <label>Passenger email</label>
      <div class="input-wrap">
        <span class="input-icon" aria-hidden="true">✉</span>
        <input type="email" class="input-field passenger-email" required>
      </div>
    </div>
    <button type="button" class="btn btn-sm btn-danger remove-passenger-btn">Remove</button>
  `;
  container.appendChild(passengerForm);
  
  passengerForm.querySelector('.remove-passenger-btn').addEventListener('click', () => {
    if (passengerCount > 1) {
      passengerForm.remove();
      passengerCount--;
      updatePassengerLabels();
    }
  });
});

function updatePassengerLabels() {
  const forms = document.querySelectorAll('.passenger-form');
  forms.forEach((form, index) => {
    form.querySelector('h4').textContent = `Passenger ${index + 1}`;
  });
}

const BookingHelper = {
  async saveBookingOptions(bookingId, body) {
    const tasks = [];

    if (body.emergencyContact.name && body.emergencyContact.phone) {
      tasks.push(
        api.createEmergencyContact({
          name: body.emergencyContact.name,
          relationship: body.emergencyContact.relationship,
          phone: body.emergencyContact.phone
        }).catch(err => console.error('Error saving emergency contact:', err))
      );
    }

    if (body.assistanceRequest.type) {
      tasks.push(
        api.createAssistanceRequest({
          bookingId,
          assistanceType: body.assistanceRequest.type,
          notes: body.assistanceRequest.notes
        }).catch(err => console.error('Error saving assistance request:', err))
      );
    }

    if (body.mealPreference.type) {
      tasks.push(
        api.createMealPreference({
          bookingId,
          mealType: body.mealPreference.type,
          specialNotes: body.mealPreference.specialNotes
        }).catch(err => console.error('Error saving meal preference:', err))
      );
    }

    await Promise.all(tasks);
  }
};

document.getElementById('booking-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!currentFlightId) {
    UI.showAlert('alert', 'No flight selected');
    return;
  }
  if (!selectedSeats.size) {
    UI.showAlert('alert', 'Please select at least one seat');
    return;
  }

  const passengerForms = document.querySelectorAll('.passenger-form');
  const passengers = [];
  
  passengerForms.forEach((form, index) => {
    const name = form.querySelector('.passenger-name').value.trim();
    const email = form.querySelector('.passenger-email').value.trim();
    if (name && email) {
      passengers.push({ name, email });
    }
  });

  if (passengers.length === 0) {
    UI.showAlert('alert', 'Please provide passenger details');
    return;
  }

  if (passengers.length > selectedSeats.size) {
    UI.showAlert('alert', 'Cannot have more passengers than selected seats');
    return;
  }

  const body = {
    flightId: currentFlightId,
    seatNumbers: [...selectedSeats],
    passengers,
    specialRequest: document.getElementById('special-request').value.trim(),
    discountCode: document.getElementById('discount-code').value.trim(),
    emergencyContact: {
      name: document.getElementById('emergency-contact-name').value.trim(),
      relationship: document.getElementById('emergency-contact-relationship').value.trim(),
      phone: document.getElementById('emergency-contact-phone').value.trim()
    },
    assistanceRequest: {
      type: document.getElementById('assistance-type').value,
      notes: document.getElementById('assistance-notes').value.trim()
    },
    mealPreference: {
      type: document.getElementById('meal-preference').value,
      specialNotes: document.getElementById('meal-notes').value.trim()
    }
  };

  if (isAgent) {
    const passengerId = document.getElementById('passenger-user-id').value;
    if (!passengerId) {
      UI.showAlert('alert', 'Please select a passenger account');
      return;
    }
    body.passengerUserId = passengerId;
  }

  try {
    const res = await api.createBooking(body);
    const bookingId = res.data._id || res.data.id;
    
    await BookingHelper.saveBookingOptions(bookingId, body);
    
    window.location.href = `payment.html?bookingId=${bookingId}`;
  } catch (err) {
    UI.showAlert('alert', err.message);
  }
});

async function init() {
  if (currentFlightId) {
    await showBookingForFlight(currentFlightId);
  } else if (isAgent) {
    await showAgentFlightPicker();
  } else {
    hideAllPanels();
    el.noFlight.classList.remove('hidden');
  }
}

init();
