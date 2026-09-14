if (!Session.requireRole('admin')) throw new Error('auth');
const dashUser = Session.getUser();
DashboardUI.init(dashUser);

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

let flightsCache = [];

function formData() {
  return {
    flightNumber: document.getElementById('flightNumber').value.trim(),
    airline: document.getElementById('airline').value.trim(),
    source: document.getElementById('flight-source').value.trim(),
    destination: document.getElementById('flight-destination').value.trim(),
    departureDate: document.getElementById('departureDate').value,
    departureTime: document.getElementById('departureTime').value.trim(),
    arrivalTime: document.getElementById('arrivalTime').value.trim(),
    price: parseFloat(document.getElementById('price').value),
    totalSeats: parseInt(document.getElementById('totalSeats').value, 10)
  };
}

function resetForm() {
  document.getElementById('flight-form').reset();
  document.getElementById('flight-edit-id').value = '';
  document.getElementById('btn-flight-submit').textContent = '+ Add Flight';
  document.getElementById('flight-form-heading').textContent = 'Create / Edit Flight';
  document.getElementById('btn-cancel-edit')?.classList.add('hidden');
}

function fillFormForEdit(flight) {
  const id = flight.id || flight._id;
  document.getElementById('flight-edit-id').value = id;
  document.getElementById('flightNumber').value = flight.flightNumber || '';
  document.getElementById('airline').value = flight.airline || '';
  document.getElementById('flight-source').value = flight.source || '';
  document.getElementById('flight-destination').value = flight.destination || '';
  document.getElementById('departureDate').value = flight.departureDate
    ? new Date(flight.departureDate).toISOString().split('T')[0]
    : '';
  document.getElementById('departureTime').value = flight.departureTime || '';
  document.getElementById('arrivalTime').value = flight.arrivalTime || '';
  document.getElementById('price').value = flight.price ?? '';
  document.getElementById('totalSeats').value = flight.totalSeats ?? '';
  document.getElementById('btn-flight-submit').textContent = 'Update Flight Details';
  document.getElementById('flight-form-heading').textContent = `Edit Flight ${flight.flightNumber || ''}`;
  document.getElementById('btn-cancel-edit')?.classList.remove('hidden');
  
  // Switch to flights tab if not active
  const flightTabBtn = document.querySelector('[data-tab="admin-tab-flights"]');
  if (flightTabBtn && !flightTabBtn.classList.contains('active')) {
    flightTabBtn.click();
  }
  document.getElementById('flight-form-card').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function bindFlightActions() {
  document.querySelectorAll('[data-edit]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-edit');
      const flight = flightsCache.find((f) => String(f.id || f._id) === String(id));
      if (!flight) {
        UI.showToast('Flight not found. Refresh the page.', 'error');
        return;
      }
      fillFormForEdit(flight);
    });
  });

  document.querySelectorAll('[data-del]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const confirmed = await UI.confirm('Are you sure you want to delete this scheduled flight?', 'Delete Flight', { danger: true });
      if (!confirmed) return;
      try {
        await api.deleteFlight(btn.getAttribute('data-del'));
        UI.showToast('Flight deleted successfully', 'success');
        resetForm();
        load();
      } catch (err) {
        UI.showToast(err.message, 'error');
      }
    });
  });
}

function updateDashboardSummary(bookings) {
  DashboardUI.setStats([
    { label: 'Active Flights', value: flightsCache.length, icon: 'flights', variant: 'primary' },
    { label: 'Total Bookings', value: bookings.length, icon: 'bookings', variant: 'accent' },
    {
      label: 'Pending Payments',
      value: bookings.filter((b) => b.paymentStatus === 'pending').length,
      icon: 'pending',
      variant: 'warn'
    }
  ]);
  DashboardUI.setActivity(
    bookings.slice(0, 8).map((b) => ({
      title: `Booking ${b.bookingReference}`,
      meta: b.user?.name ? `${b.user.name} · ${b.paymentStatus}` : b.paymentStatus,
      badge: b.status,
      icon: 'ticket'
    })),
    'Bookings will appear here'
  );
}

const ROLE_OPTIONS = ['passenger', 'admin', 'agent', 'manager'];

async function loadUsers() {
  const tbody = document.getElementById('users-tbody');
  if (!tbody) return;
  try {
    const res = await api.getSystemUsers();
    tbody.innerHTML = (res.data || [])
      .map(
        (u) => `
      <tr>
        <td>${u.name}</td>
        <td>${u.email}</td>
        <td>
          <select data-user="${u.id}" class="role-select">
            ${ROLE_OPTIONS.map((r) => `<option value="${r}" ${u.role === r ? 'selected' : ''}>${r}</option>`).join('')}
          </select>
        </td>
        <td><button type="button" class="btn btn-sm btn-accent" data-save-role="${u.id}">Save Role</button></td>
      </tr>`
      )
      .join('');

    tbody.querySelectorAll('[data-save-role]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const select = tbody.querySelector(`select[data-user="${btn.dataset.saveRole}"]`);
        try {
          await api.updateUserRole(btn.dataset.saveRole, select.value);
          UI.showAlert('alert', 'Role updated', 'success');
          loadUsers();
        } catch (err) {
          UI.showAlert('alert', err.message);
        }
      });
    });
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="4">${err.message}</td></tr>`;
  }
}

document.getElementById('flight-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('flight-edit-id').value;
  try {
    if (id) {
      await api.updateFlight(id, formData());
      UI.showAlert('alert', 'Flight updated successfully', 'success');
    } else {
      await api.createFlight(formData());
      UI.showAlert('alert', 'Flight added successfully', 'success');
    }
    resetForm();
    load();
  } catch (err) {
    UI.showAlert('alert', err.message);
  }
});

document.getElementById('btn-cancel-edit')?.addEventListener('click', resetForm);

async function loadRefunds() {
  const tbody = document.getElementById('refunds-tbody');
  if (!tbody) return;
  try {
    const res = await api.getAllRefunds();
    console.log('Refunds data:', res.data);
    tbody.innerHTML = (res.data || [])
      .map(
        (r) => `
      <tr>
        <td>${r.user?.name || '—'}</td>
        <td>${r.booking?.bookingReference || '—'}</td>
        <td>$${r.amount}</td>
        <td>${r.reason}</td>
        <td><span class="badge ${r.status}">${r.status}</span></td>
        <td>
          ${r.status === 'pending' ? `
            <button type="button" class="btn btn-sm btn-success" data-approve="${r._id}">Approve</button>
            <button type="button" class="btn btn-sm btn-danger" data-reject="${r._id}">Reject</button>
          ` : ''}
        </td>
      </tr>`
      )
      .join('');

    const approveBtns = tbody.querySelectorAll('[data-approve]');
    console.log('Approve buttons found:', approveBtns.length);
    approveBtns.forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        console.log('Approve button clicked for:', btn.dataset.approve);
        try {
          await api.updateRefundStatus(btn.dataset.approve, { status: 'approved' });
          UI.showAlert('alert', 'Refund approved', 'success');
          loadRefunds();
        } catch (err) {
          console.error('Approve error:', err);
          UI.showAlert('alert', err.message);
        }
      });
    });

    const rejectBtns = tbody.querySelectorAll('[data-reject]');
    console.log('Reject buttons found:', rejectBtns.length);
    rejectBtns.forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        console.log('Reject button clicked for:', btn.dataset.reject);
        try {
          await api.updateRefundStatus(btn.dataset.reject, { status: 'rejected' });
          UI.showAlert('alert', 'Refund rejected', 'success');
          loadRefunds();
        } catch (err) {
          console.error('Reject error:', err);
          UI.showAlert('alert', err.message);
        }
      });
    });
  } catch (err) {
    console.error('Load refunds error:', err);
    tbody.innerHTML = `<tr><td colspan="6">${err.message}</td></tr>`;
  }
}

async function loadSystemSettings() {
  const form = document.getElementById('settings-form');
  if (!form) return;
  try {
    const res = await api.getSystemSettings();
    const settings = res.data || {};
    document.getElementById('systemName').value = settings.systemName || '';
    document.getElementById('supportEmail').value = settings.supportEmail || '';
    document.getElementById('supportPhone').value = settings.supportPhone || '';
    document.getElementById('currency').value = settings.currency || '';
    document.getElementById('timezone').value = settings.timezone || '';
    document.getElementById('maxBookingDays').value = settings.maxBookingDays || '';
    document.getElementById('cancellationHours').value = settings.cancellationHours || '';
    document.getElementById('refundPolicy').value = settings.refundPolicy || '';
  } catch (err) {
    UI.showAlert('alert', err.message);
  }
}

document.getElementById('settings-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    const settings = {
      systemName: document.getElementById('systemName').value,
      supportEmail: document.getElementById('supportEmail').value,
      supportPhone: document.getElementById('supportPhone').value,
      currency: document.getElementById('currency').value,
      timezone: document.getElementById('timezone').value,
      maxBookingDays: parseInt(document.getElementById('maxBookingDays').value, 10),
      cancellationHours: parseInt(document.getElementById('cancellationHours').value, 10),
      refundPolicy: document.getElementById('refundPolicy').value
    };
    await api.updateSystemSettings(settings);
    UI.showAlert('alert', 'Settings updated successfully', 'success');
  } catch (err) {
    UI.showAlert('alert', err.message);
  }
});

async function loadPricingRules() {
  const tbody = document.getElementById('pricing-tbody');
  if (!tbody) return;
  try {
    const res = await api.getAllPricingRules();
    console.log('Pricing rules data:', res.data);
    tbody.innerHTML = (res.data || [])
      .map(
        (r) => `
      <tr>
        <td>${r.name}</td>
        <td>${r.ruleType}</td>
        <td>${r.value}${r.valueType === 'percentage' ? '%' : '$'}</td>
        <td>${r.isActive ? 'Yes' : 'No'}</td>
        <td>
          <button type="button" class="btn btn-sm btn-accent" data-toggle-rule="${r._id}">Toggle</button>
          <button type="button" class="btn btn-sm btn-danger" data-delete-rule="${r._id}">Delete</button>
        </td>
      </tr>`
      )
      .join('');

    const toggleBtns = tbody.querySelectorAll('[data-toggle-rule]');
    console.log('Toggle buttons found:', toggleBtns.length);
    toggleBtns.forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        console.log('Toggle button clicked for:', btn.dataset.toggleRule);
        try {
          const ruleRes = await api.getAllPricingRules();
          const rule = ruleRes.data.find((r) => r._id === btn.dataset.toggleRule);
          if (rule) {
            console.log('Current isActive:', rule.isActive, 'New value:', !rule.isActive);
            await api.updatePricingRule(btn.dataset.toggleRule, { isActive: !rule.isActive });
            UI.showAlert('alert', 'Rule updated', 'success');
            loadPricingRules();
          } else {
            console.error('Rule not found');
          }
        } catch (err) {
          console.error('Toggle error:', err);
          UI.showAlert('alert', err.message);
        }
      });
    });

    const deleteBtns = tbody.querySelectorAll('[data-delete-rule]');
    console.log('Delete buttons found:', deleteBtns.length);
    deleteBtns.forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        if (!confirm('Delete this pricing rule?')) return;
        console.log('Delete button clicked for:', btn.dataset.deleteRule);
        try {
          await api.deletePricingRule(btn.dataset.deleteRule);
          UI.showAlert('alert', 'Pricing rule deleted', 'success');
          loadPricingRules();
        } catch (err) {
          console.error('Delete error:', err);
          UI.showAlert('alert', err.message);
        }
      });
    });
  } catch (err) {
    console.error('Load pricing rules error:', err);
    tbody.innerHTML = `<tr><td colspan="5">${err.message}</td></tr>`;
  }
}

document.getElementById('btn-add-pricing-rule')?.addEventListener('click', () => {
  const name = prompt('Rule name:');
  if (!name) return;
  const ruleType = prompt('Rule type (markup/discount/seasonal/route_specific):', 'discount');
  const value = prompt('Value (number):', '10');
  const valueType = prompt('Value type (percentage/fixed):', 'percentage');
  try {
    api.createPricingRule({
      name,
      ruleType,
      value: parseFloat(value),
      valueType,
      isActive: true,
      priority: 0
    }).then(() => {
      UI.showAlert('alert', 'Pricing rule created', 'success');
      loadPricingRules();
    }).catch((err) => {
      UI.showAlert('alert', err.message);
    });
  } catch (err) {
    UI.showAlert('alert', err.message);
  }
});

function resetPromoForm() {
  document.getElementById('promo-form')?.reset();
  document.getElementById('promo-edit-id').value = '';
  document.getElementById('btn-promo-submit').textContent = 'Create Promo Code';
  document.getElementById('btn-cancel-promo-edit')?.classList.add('hidden');
}

function promoFormData() {
  return {
    code: document.getElementById('promo-code').value.trim(),
    description: document.getElementById('promo-description').value.trim(),
    discountType: document.getElementById('promo-discount-type').value,
    discountValue: parseFloat(document.getElementById('promo-discount-value').value),
    expiresAt: new Date(document.getElementById('promo-expires').value).toISOString(),
    usageLimit: parseInt(document.getElementById('promo-usage-limit').value, 10),
    minOrderAmount: parseFloat(document.getElementById('promo-min-order').value) || 0,
    isActive: true
  };
}

async function showPromoCodeUsage(promoId, promoCode) {
  const panel = document.getElementById('promo-usage-panel');
  const tbody = document.getElementById('promo-usage-tbody');
  const title = document.getElementById('promo-usage-title');
  const summary = document.getElementById('promo-usage-summary');

  if (!panel || !tbody) return;

  panel.classList.remove('hidden');
  title.textContent = `Users who used "${promoCode}"`;
  summary.textContent = 'Loading...';
  tbody.innerHTML = '<tr><td colspan="6">Loading...</td></tr>';
  panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

  try {
    const res = await api.getPromoCodeUsage(promoId);
    const data = res.data;
    summary.textContent = `${data.redeemedCount} redeemed · ${data.pendingCount} pending payment · ${data.usageCount}/${data.usageLimit} total uses counted`;

    if (!data.redemptions.length) {
      tbody.innerHTML = '<tr><td colspan="6">No users have used this promo code yet.</td></tr>';
      return;
    }

    tbody.innerHTML = data.redemptions
      .map((item) => {
        const route = item.flight
          ? `${item.flight.flightNumber}: ${item.flight.source} → ${item.flight.destination}`
          : '—';
        return `<tr>
          <td>${UI.escapeHtml(item.user?.name || '—')}</td>
          <td>${UI.escapeHtml(item.user?.email || '—')}</td>
          <td>${UI.escapeHtml(item.bookingReference)}<br><span class="text-muted" style="font-size:0.8rem">${UI.escapeHtml(route)}</span></td>
          <td>-$${item.discountApplied || 0}</td>
          <td><span class="badge ${item.paymentStatus}">${item.paymentStatus}</span></td>
          <td>${new Date(item.redeemed ? item.redeemedAt : item.bookedAt).toLocaleString()}</td>
        </tr>`;
      })
      .join('');
  } catch (err) {
    summary.textContent = '';
    tbody.innerHTML = `<tr><td colspan="6">${err.message}</td></tr>`;
  }
}

async function loadPromoCodes() {
  const tbody = document.getElementById('promo-tbody');
  if (!tbody) return;
  try {
    const res = await api.getAllPromoCodes();
    tbody.innerHTML = (res.data || [])
      .map(
        (p) => `
      <tr>
        <td><strong>${UI.escapeHtml(p.code)}</strong></td>
        <td><span class="badge badge-success">${p.discountType === 'percentage' ? p.discountValue + '%' : '$' + p.discountValue} OFF</span></td>
        <td>${new Date(p.expiresAt).toLocaleString()}</td>
        <td>${p.usageCount}/${p.usageLimit}</td>
        <td>${p.isActive ? '<span class="badge badge-success">Active</span>' : '<span class="badge badge-default">Inactive</span>'}</td>
        <td>
          <div class="table-actions">
            <button type="button" class="btn-action btn-action-primary" data-view-promo-usage="${p._id}" data-promo-code="${UI.escapeHtml(p.code)}">Users (${p.usageCount || 0})</button>
            <button type="button" class="btn-action" data-edit-promo="${p._id}">Edit</button>
            <button type="button" class="btn-action" data-toggle-promo="${p._id}">${p.isActive ? 'Deactivate' : 'Activate'}</button>
            <button type="button" class="btn-action btn-action-danger" data-delete-promo="${p._id}">Delete</button>
          </div>
        </td>
      </tr>`
      )
      .join('');

    tbody.querySelectorAll('[data-view-promo-usage]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        await showPromoCodeUsage(btn.dataset.viewPromoUsage, btn.dataset.promoCode);
      });
    });

    tbody.querySelectorAll('[data-edit-promo]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const res = await api.getAllPromoCodes();
        const promo = (res.data || []).find((p) => p._id === btn.dataset.editPromo);
        if (!promo) return;
        document.getElementById('promo-edit-id').value = promo._id;
        document.getElementById('promo-code').value = promo.code;
        document.getElementById('promo-description').value = promo.description || '';
        document.getElementById('promo-discount-type').value = promo.discountType;
        document.getElementById('promo-discount-value').value = promo.discountValue;
        document.getElementById('promo-expires').value = new Date(promo.expiresAt).toISOString().slice(0, 16);
        document.getElementById('promo-usage-limit').value = promo.usageLimit;
        document.getElementById('promo-min-order').value = promo.minOrderAmount || 0;
        document.getElementById('btn-promo-submit').textContent = 'Update Promo Code';
        document.getElementById('btn-cancel-promo-edit')?.classList.remove('hidden');
        document.getElementById('promo-form-card')?.scrollIntoView({ behavior: 'smooth' });
      });
    });

    tbody.querySelectorAll('[data-toggle-promo]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        try {
          const res = await api.getAllPromoCodes();
          const promo = (res.data || []).find((p) => p._id === btn.dataset.togglePromo);
          if (promo) {
            await api.updatePromoCode(btn.dataset.togglePromo, { isActive: !promo.isActive });
            UI.showToast(`Promo code "${promo.code}" ${!promo.isActive ? 'activated' : 'deactivated'}`, 'success');
            loadPromoCodes();
          }
        } catch (err) {
          UI.showToast(err.message, 'error');
        }
      });
    });

    tbody.querySelectorAll('[data-delete-promo]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const confirmed = await UI.confirm('Are you sure you want to delete this promotional discount code?', 'Delete Promo Code', { danger: true });
        if (!confirmed) return;
        try {
          await api.deletePromoCode(btn.dataset.deletePromo);
          UI.showToast('Promo code deleted successfully', 'success');
          loadPromoCodes();
        } catch (err) {
          UI.showToast(err.message, 'error');
        }
      });
    });
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6">${err.message}</td></tr>`;
  }
}

document.getElementById('promo-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('promo-edit-id').value;
  try {
    if (id) {
      await api.updatePromoCode(id, promoFormData());
      UI.showToast('Promo code updated successfully', 'success');
    } else {
      await api.createPromoCode(promoFormData());
      UI.showToast('Promo code created successfully', 'success');
    }
    resetPromoForm();
    loadPromoCodes();
  } catch (err) {
    UI.showToast(err.message, 'error');
  }
});

document.getElementById('btn-cancel-promo-edit')?.addEventListener('click', resetPromoForm);

async function load() {
  const [flightsRes, bookingsRes] = await Promise.all([api.getFlights(), api.getAllBookings()]);
  flightsCache = flightsRes.data || [];
  const bookings = bookingsRes.data || [];
  updateDashboardSummary(bookings);

  document.getElementById('flights-tbody').innerHTML = flightsCache
    .map((f) => {
      const id = f.id || f._id;
      return `<tr>
        <td><strong>${UI.escapeHtml(f.flightNumber)}</strong></td>
        <td>${UI.escapeHtml(f.source)} → ${UI.escapeHtml(f.destination)}</td>
        <td>${new Date(f.departureDate).toLocaleDateString()} · ${UI.escapeHtml(f.departureTime || '')}</td>
        <td><strong style="color:var(--primary);">$${f.price}</strong></td>
        <td>
          <div class="table-actions">
            <button type="button" class="btn-action" data-edit="${id}">Edit</button>
            <button type="button" class="btn-action btn-action-danger" data-del="${id}">Delete</button>
          </div>
        </td>
      </tr>`;
    })
    .join('');

  document.getElementById('bookings-tbody').innerHTML = bookings
    .map(
      (b) =>
        `<tr><td><strong>${UI.escapeHtml(b.bookingReference)}</strong></td><td>${UI.escapeHtml(b.user?.name || '—')}</td><td>${UI.statusBadge(b.paymentStatus)}</td><td>${UI.statusBadge(b.status)}</td></tr>`
    )
    .join('');

  bindFlightActions();
  await loadUsers();
  await loadRefunds();
  await loadSystemSettings();
  await loadPricingRules();
  await loadPromoCodes();
}

load();
