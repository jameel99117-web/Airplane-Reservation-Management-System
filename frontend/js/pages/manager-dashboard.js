if (!Session.requireRole('manager')) throw new Error('auth');
DashboardUI.init(Session.getUser());

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

function renderBar(label, value, max, cssClass, suffix = '') {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return `<div class="bar-row">
    <span>${label}</span>
    <div class="bar-track"><div class="bar-fill ${cssClass}" style="width:${pct}%"></div></div>
    <span><strong>${value}</strong>${suffix}</span>
  </div>`;
}

function renderPerformanceCharts(p) {
  const totalPayments = p.successfulPayments + p.failedPayments;
  const successPct = p.paymentSuccessRate ?? 0;
  const occPct = p.systemWideOccupancy ?? 0;
  const generated = p.generatedAt ? new Date(p.generatedAt).toLocaleString() : '—';

  document.getElementById('report-meta').textContent =
    `${p.period} · Generated ${generated}`;

  document.getElementById('performance-charts').innerHTML = `
    <div class="chart-panel">
      <h4>Payment Success Rate</h4>
      <div class="donut-wrap">
        <div class="donut" style="background:conic-gradient(#43a047 0% ${successPct}%, #ffcdd2 ${successPct}% 100%)">
          <div class="donut-inner">${successPct}%<span>success</span></div>
        </div>
        <div>
          <p><strong>${p.successfulPayments}</strong> successful</p>
          <p><strong>${p.failedPayments}</strong> failed</p>
          <p style="color:var(--muted);font-size:0.85rem">Last 7 days</p>
        </div>
      </div>
    </div>

    <div class="chart-panel">
      <h4>Payments Breakdown</h4>
      <div class="bar-chart">
        ${renderBar('Successful', p.successfulPayments, Math.max(totalPayments, 1), 'success')}
        ${renderBar('Failed', p.failedPayments, Math.max(totalPayments, 1), 'failed')}
      </div>
    </div>

    <div class="chart-panel">
      <h4>Bookings Created</h4>
      <div class="bar-chart">
        ${renderBar('Last 7 days', p.bookingsCreated, Math.max(p.bookingsCreated, 5), 'bookings')}
      </div>
      <p style="margin-top:0.75rem;font-size:1.5rem;font-weight:700;color:var(--primary)">${p.bookingsCreated} <span style="font-size:0.9rem;font-weight:500">new bookings</span></p>
    </div>

    <div class="chart-panel">
      <h4>System-Wide Seat Occupancy</h4>
      <div class="occupancy-bar-lg">
        <div class="bar-fill occupancy" style="width:${Math.max(occPct, 2)}%">${occPct}%</div>
      </div>
      <p><strong>${p.bookedSeats}</strong> booked of <strong>${p.totalSeats}</strong> total seats</p>
    </div>
  `;
}

function renderOccupancyRow(r) {
  const pct = r.occupancyRate ?? 0;
  return `<tr>
    <td>${r.flightNumber}</td>
    <td>${r.route}</td>
    <td>${r.bookedSeats} / ${r.totalSeats}</td>
    <td class="occ-bar-cell">
      <strong>${pct}%</strong>
      <div class="occ-mini-track"><div class="occ-mini-fill" style="width:${pct}%"></div></div>
    </td>
  </tr>`;
}

async function loadRoutePerformance(sort = 'desc') {
  const tbody = document.getElementById('route-performance-tbody');
  if (!tbody) return;
  try {
    const res = await api.getRoutePerformance(sort);
    tbody.innerHTML = (res.data || [])
      .map(
        (r) => `
      <tr>
        <td>${r.route}</td>
        <td>${r.totalBookings}</td>
        <td>$${r.totalRevenue.toFixed(2)}</td>
      </tr>`
      )
      .join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="3">${err.message}</td></tr>`;
  }
}

document.querySelectorAll('[data-sort-routes]').forEach((btn) => {
  btn.addEventListener('click', () => {
    loadRoutePerformance(btn.dataset.sortRoutes);
  });
});

async function loadFlightPerformanceRanking() {
  const tbody = document.getElementById('flight-ranking-tbody');
  if (!tbody) return;
  try {
    const res = await api.getFlightPerformanceRanking();
    tbody.innerHTML = (res.data || [])
      .map(
        (f) => `
      <tr>
        <td><span class="badge badge-primary">#${f.rank}</span></td>
        <td>${f.flightNumber}</td>
        <td>${f.route}</td>
        <td>${f.totalBookings}</td>
        <td>$${f.totalRevenue.toFixed(2)}</td>
        <td>${f.occupancyRate.toFixed(1)}%</td>
      </tr>`
      )
      .join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6">${err.message}</td></tr>`;
  }
}

async function loadPaymentsAndRefunds(status = '') {
  const tbody = document.getElementById('payments-refunds-tbody');
  if (!tbody) return;
  try {
    const res = await api.getPaymentsAndRefunds(status);
    tbody.innerHTML = (res.data || [])
      .map(
        (t) => `
      <tr>
        <td><span class="badge ${t.type}">${t.type}</span></td>
        <td>${t.passengerName || t.userEmail || '—'}</td>
        <td>${t.bookingReference || '—'}</td>
        <td>$${t.amount.toFixed(2)}</td>
        <td><span class="badge ${t.status}">${t.status}</span></td>
      </tr>`
      )
      .join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="5">${err.message}</td></tr>`;
  }
}

document.getElementById('payment-filter')?.addEventListener('change', (e) => {
  loadPaymentsAndRefunds(e.target.value);
});

async function loadPeakBookingTimes() {
  try {
    const res = await api.getPeakBookingTimes();
    const data = res.data;
    
    document.getElementById('peak-hour').textContent = `${data.peakHour}:00`;
    document.getElementById('low-hour').textContent = `${data.lowHour}:00`;
    document.getElementById('peak-day').textContent = data.peakDay;
    document.getElementById('low-day').textContent = data.lowDay;
  } catch (err) {
    console.error('Load peak booking times error:', err);
  }
}

async function load() {
  const [overview, occupancy, performance] = await Promise.all([
    api.getReportOverview(),
    api.getReportOccupancy(),
    api.getReportPerformance()
  ]);

  const o = overview.data;
  const p = performance.data;

  DashboardUI.setStats([
    { label: 'Total Bookings', value: o.totalBookings, icon: 'bookings', variant: 'primary' },
    { label: 'Confirmed', value: o.confirmedBookings, icon: 'confirmed', variant: 'success' },
    { label: 'Revenue', value: `$${o.totalRevenue}`, icon: 'revenue', variant: 'accent' },
    { label: 'Active Flights', value: o.totalFlights, icon: 'flights', variant: 'primary' }
  ]);

  DashboardUI.setActivity([
    {
      title: 'Performance report',
      meta: `${p.period} · ${p.bookingsCreated} new bookings`,
      badge: 'report',
      icon: 'chart'
    },
    {
      title: 'Payment success rate',
      meta: `${p.paymentSuccessRate ?? 0}% successful (${p.successfulPayments}/${p.successfulPayments + p.failedPayments})`,
      badge: 'analytics',
      icon: 'chart'
    },
    {
      title: 'Seat occupancy',
      meta: `${p.bookedSeats} / ${p.totalSeats} seats (${p.systemWideOccupancy ?? 0}%)`,
      badge: 'occupancy',
      icon: 'plane'
    },
    ...(occupancy.data || []).slice(0, 5).map((r) => ({
      title: `Flight ${r.flightNumber}`,
      meta: `${r.route} · ${r.occupancyRate}% full`,
      badge: 'flight',
      icon: 'plane'
    }))
  ]);

  document.getElementById('occupancy-tbody').innerHTML = (occupancy.data || [])
    .map(renderOccupancyRow)
    .join('');

  renderPerformanceCharts(performance.data);
  
  await loadRoutePerformance();
  await loadFlightPerformanceRanking();
  await loadPaymentsAndRefunds();
  await loadPeakBookingTimes();
}

load();
