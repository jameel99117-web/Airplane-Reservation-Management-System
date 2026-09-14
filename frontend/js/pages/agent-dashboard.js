if (!Session.requireRole('agent', 'admin')) throw new Error('auth');

const agentUser = Session.getUser();
DashboardUI.init(agentUser);

// Tab Switching
document.querySelectorAll('.dash-tab-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    const targetId = btn.dataset.tab;
    document.querySelectorAll('.dash-tab-btn').forEach((b) => b.classList.remove('active'));
    document.querySelectorAll('.dash-tab-pane').forEach((p) => p.classList.remove('active'));
    btn.classList.add('active');
    const pane = document.getElementById(targetId);
    if (pane) pane.classList.add('active');
  });
});

const bookImg = typeof Visuals !== 'undefined' ? Visuals.IMAGES.destinations[2] : '';

const dashActionsEl = document.getElementById('dash-actions');
if (dashActionsEl) {
  dashActionsEl.innerHTML = DashboardUI.actionCard(
    'booking.html',
    'Book on Behalf',
    'Select flight, seats, and passenger',
    bookImg,
    'plane'
  );
}

document.getElementById('modify-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const bookingId = document.getElementById('mod-booking-id').value.trim();
  try {
    await api.updateBooking(bookingId, {
      specialRequest: document.getElementById('mod-special').value,
      passengerName: document.getElementById('mod-name').value || undefined
    });
    UI.showToast('Booking updated successfully', 'success');
    load();
  } catch (err) {
    UI.showToast(err.message, 'error');
  }
});

async function loadFlightsForDropdown() {
  const select = document.getElementById('flight-id');
  if (!select) return;
  try {
    const res = await api.getFlights();
    const flights = res.data || [];
    if (!flights.length) {
      select.innerHTML = '<option value="">No flights available</option>';
      return;
    }
    select.innerHTML =
      '<option value="">— Select a flight —</option>' +
      flights
        .map((f) => {
          const id = f.id || f._id;
          const date = new Date(f.departureDate).toLocaleDateString();
          return `<option value="${id}">${f.flightNumber}: ${f.source} → ${f.destination} (${date}) — $${f.price}</option>`;
        })
        .join('');
  } catch (err) {
    select.innerHTML = `<option value="">Error: ${err.message}</option>`;
  }
}

async function loadBookingsForTicketDropdown() {
  const select = document.getElementById('ticket-booking-id');
  if (!select) return;
  try {
    const res = await api.getAllBookings();
    const bookings = res.data || [];
    const confirmedBookings = bookings.filter((b) => b.status === 'confirmed' && b.paymentStatus === 'success');
    if (!confirmedBookings.length) {
      select.innerHTML = '<option value="">No confirmed bookings available</option>';
      return;
    }
    select.innerHTML =
      '<option value="">— Select a booking —</option>' +
      confirmedBookings
        .map((b) => {
          const id = b.id || b._id;
          return `<option value="${id}">${b.bookingReference} - ${b.passengerName} ($${b.totalAmount})</option>`;
        })
        .join('');
  } catch (err) {
    select.innerHTML = `<option value="">Error: ${err.message}</option>`;
  }
}

document.getElementById('seat-availability-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const flightId = document.getElementById('flight-id').value;
  const resultDiv = document.getElementById('seat-availability-result');
  try {
    const flight = await api.getFlight(flightId);
    const f = flight.data;
    const totalSeats = f.totalSeats;
    const bookedSeats = (f.seats || []).filter((s) => s.isBooked).length;
    const availableSeats = totalSeats - bookedSeats;
    resultDiv.innerHTML = `
      <div style="background:var(--bg); border:1px solid var(--border); border-radius:var(--radius); padding:1rem; margin-top:0.75rem;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem;">
          <strong style="color:var(--primary); font-size:1.05rem;">✈ ${UI.escapeHtml(f.flightNumber)} (${UI.escapeHtml(f.source)} → ${UI.escapeHtml(f.destination)})</strong>
          ${availableSeats > 0 ? '<span class="badge badge-success">Seats Available</span>' : '<span class="badge badge-danger">Flight Full</span>'}
        </div>
        <div class="profile-meta-grid" style="grid-template-columns:repeat(3, 1fr); margin-bottom:0;">
          <div class="profile-meta-item"><label>Total Capacity</label><strong>${totalSeats}</strong></div>
          <div class="profile-meta-item"><label>Booked Seats</label><strong>${bookedSeats}</strong></div>
          <div class="profile-meta-item"><label>Available Remaining</label><strong style="color:${availableSeats > 0 ? 'var(--success)' : 'var(--danger)'}">${availableSeats}</strong></div>
        </div>
      </div>
    `;
  } catch (err) {
    resultDiv.innerHTML = `<p class="text-muted">Error: ${err.message}</p>`;
  }
});

document.getElementById('issue-ticket-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const bookingId = document.getElementById('ticket-booking-id').value;
  const resultDiv = document.getElementById('ticket-result');
  try {
    const ticket = await api.issueTicket({ bookingId });
    resultDiv.innerHTML = `
      <div style="background:var(--bg); border:1px solid var(--border); border-radius:var(--radius); padding:1rem; margin-top:0.75rem;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem;">
          <strong style="color:var(--primary); font-size:1.05rem;">Ticket #${UI.escapeHtml(ticket.data.ticketNumber)}</strong>
          <span class="badge badge-success">${ticket.data.status}</span>
        </div>
        <div class="profile-meta-grid" style="grid-template-columns:repeat(3, 1fr); margin-bottom:0;">
          <div class="profile-meta-item"><label>Passenger</label><strong>${UI.escapeHtml(ticket.data.passengerName)}</strong></div>
          <div class="profile-meta-item"><label>Assigned Seats</label><strong>${(ticket.data.seatNumbers || []).join(', ')}</strong></div>
          <div class="profile-meta-item"><label>Final Total</label><strong>$${ticket.data.finalPrice}</strong></div>
        </div>
      </div>
    `;
    UI.showToast('Ticket issued successfully', 'success');
  } catch (err) {
    resultDiv.innerHTML = `<p class="text-muted">Error: ${err.message}</p>`;
    UI.showToast(err.message, 'error');
  }
});

async function loadSupportRequests() {
  const tbody = document.getElementById('support-tbody');
  if (!tbody) return;
  try {
    const res = await api.getAllSupportRequests();
    const requests = res.data || [];
    if (!requests.length) {
      tbody.innerHTML = `<tr><td colspan="4" class="text-muted">No pending support requests found</td></tr>`;
      return;
    }
    tbody.innerHTML = requests
      .map(
        (s) => `
      <tr>
        <td><strong>${UI.escapeHtml(s.subject)}</strong></td>
        <td>${UI.statusBadge(s.status)}</td>
        <td><span class="badge ${s.priority === 'high' ? 'badge-danger' : s.priority === 'medium' ? 'badge-warning' : 'badge-default'}">${UI.escapeHtml(s.priority)}</span></td>
        <td>
          <div class="table-actions">
            ${s.status === 'pending' ? `<button type="button" class="btn-action btn-action-primary" data-respond="${s._id}">Respond</button>` : '<span class="text-muted" style="font-size:0.8rem;">Resolved</span>'}
          </div>
        </td>
      </tr>`
      )
      .join('');

    tbody.querySelectorAll('[data-respond]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const response = await UI.prompt({
          title: 'Respond to Support Ticket',
          label: 'Enter your response for the passenger:',
          placeholder: 'Type response here...',
          required: true
        });
        if (!response) return;
        try {
          await api.updateSupportRequest(btn.dataset.respond, {
            status: 'in_progress',
            response
          });
          UI.showToast('Response sent to passenger', 'success');
          loadSupportRequests();
        } catch (err) {
          UI.showToast(err.message, 'error');
        }
      });
    });
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="4">${err.message}</td></tr>`;
  }
}

async function load() {
  const res = await api.getAllBookings();
  const bookings = res.data || [];

  DashboardUI.setStats([
    { label: 'Total Bookings', value: bookings.length, icon: 'bookings', variant: 'primary' },
    {
      label: 'Confirmed',
      value: bookings.filter((b) => b.status === 'confirmed').length,
      icon: 'confirmed',
      variant: 'success'
    },
    {
      label: 'Cancelled',
      value: bookings.filter((b) => b.status === 'cancelled').length,
      icon: 'pending',
      variant: 'warn'
    }
  ]);

  DashboardUI.setActivity(
    bookings.slice(0, 8).map((b) => ({
      title: `${b.bookingReference}`,
      meta: b.passengerName || 'Passenger',
      badge: b.status,
      icon: 'ticket'
    })),
    'No agent bookings yet'
  );

  const listEl = document.getElementById('bookings-list');
  if (listEl) {
    listEl.innerHTML = bookings.length
      ? `<div class="table-wrap"><table><thead><tr><th>Ref</th><th>Passenger</th><th>Route</th><th>Payment</th><th>Status</th><th>Actions</th></tr></thead><tbody>
      ${bookings
        .map(
          (b) =>
            `<tr>
              <td><strong>${UI.escapeHtml(b.bookingReference)}</strong></td>
              <td>${UI.escapeHtml(b.passengerName)}</td>
              <td>${UI.formatRoute(b.flight)}</td>
              <td>${UI.statusBadge(b.paymentStatus)}</td>
              <td>${UI.statusBadge(b.status)}</td>
              <td>
                <div class="table-actions">
                  <a href="reschedule.html?bookingId=${b._id}" class="btn-action">Reschedule</a>
                  ${b.status !== 'cancelled' ? `<button type="button" class="btn-action btn-action-danger" data-cancel="${b._id}">Cancel</button>` : ''}
                </div>
              </td>
            </tr>`
        )
        .join('')}</tbody></table></div>`
      : '<p class="text-muted">No bookings yet.</p>';
  }

  document.querySelectorAll('[data-cancel]').forEach((btn) => {
    btn.onclick = async () => {
      const confirmed = await UI.confirm('Are you sure you want to cancel this reservation?', 'Cancel Booking', { danger: true });
      if (confirmed) {
        try {
          await api.cancelBooking(btn.dataset.cancel);
          UI.showToast('Booking cancelled', 'info');
          load();
        } catch (err) {
          UI.showToast(err.message, 'error');
        }
      }
    };
  });

  if (typeof Visuals !== 'undefined' && listEl) Visuals.afterContentUpdate(listEl);

  await loadSupportRequests();
  await loadFlightsForDropdown();
  await loadBookingsForTicketDropdown();
}

load();

