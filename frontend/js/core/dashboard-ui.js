/**
 * Dashboard layout — UI only, no API/business logic.
 */
const DashboardUI = {
  NAV: {
    passenger: [
      { href: 'dashboard-passenger.html', label: 'Dashboard', icon: 'home' },
      { href: 'flights.html', label: 'Search Flights', icon: 'search' },
      { href: 'booking.html', label: 'Book Flight', icon: 'plane' },
      { href: 'index.html', label: 'Home', icon: 'globe' }
    ],
    admin: [
      { href: 'dashboard-admin.html', label: 'Admin Panel', icon: 'home' },
      { href: 'flights.html', label: 'Flights', icon: 'plane' },
      { href: 'index.html', label: 'Home', icon: 'globe' }
    ],
    agent: [
      { href: 'dashboard-agent.html', label: 'Agent Desk', icon: 'home' },
      { href: 'booking.html', label: 'Book for Passenger', icon: 'plane' },
      { href: 'index.html', label: 'Home', icon: 'globe' }
    ],
    manager: [
      { href: 'dashboard-manager.html', label: 'Analytics', icon: 'home' },
      { href: 'index.html', label: 'Home', icon: 'globe' }
    ]
  },

  TITLES: {
    passenger: { title: 'Passenger Dashboard', subtitle: 'Manage trips, bookings, and flight search' },
    admin: { title: 'Airline Admin', subtitle: 'Flights, bookings, and user management' },
    agent: { title: 'Reservation Agent', subtitle: 'Book and manage passenger reservations' },
    manager: { title: 'Operations Analytics', subtitle: 'Performance insights and occupancy reports' }
  },

  icon(name, size = 18) {
    if (typeof Icons === 'undefined') return '';
    const map = {
      home: '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
      search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
      plane: '<path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 2 1 1-1v-3l2-2 3.4 5.9c.2.4.7.5 1.1.4l.5-.2c.4-.3.6-.7.5-1.2z"/>',
      globe: '<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>',
      ticket: '<path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/>',
      calendar: '<path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/>',
      users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>',
      chart: '<path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/>'
    };
    return `<span class="nav-ico">${Icons.svg(map[name] || map.home, size)}</span>`;
  },

  statIcon(type) {
    const icons = {
      bookings: 'ticket',
      flights: 'plane',
      activity: 'chart',
      users: 'users',
      pending: 'calendar',
      revenue: 'chart',
      confirmed: 'ticket'
    };
    return DashboardUI.icon(icons[type] || 'plane', 22);
  },

  init(user, options = {}) {
    if (!user) return;
    document.body.classList.add('dashboard-page');

    const role = user.role || options.role || 'passenger';
    const page = window.location.pathname.split('/').pop();
    const meta = DashboardUI.TITLES[role] || DashboardUI.TITLES.passenger;

    DashboardUI._renderSidebar(user, role, page);
    DashboardUI._bindToggle();
    DashboardUI.setWelcome(user.name, options.title || meta.title, options.subtitle || meta.subtitle);

    const topTitle = document.querySelector('.dashboard-topbar-title');
    if (topTitle) topTitle.textContent = options.title || meta.title;

    const visual = document.querySelector('.dash-welcome-visual');
    if (visual && typeof Icons !== 'undefined') visual.innerHTML = Icons.planeLarge();

    if (typeof Visuals !== 'undefined') {
      Visuals.refreshReveal();
      Visuals.bindImages(document);
    }
  },

  _renderSidebar(user, role, activePage) {
    const sidebar = document.getElementById('dashboard-sidebar');
    if (!sidebar) return;

    const navItems = (DashboardUI.NAV[role] || DashboardUI.NAV.passenger)
      .map((item) => {
        const active = activePage === item.href ? ' active' : '';
        return `<a href="${item.href}" class="dash-nav-link${active}">${DashboardUI.icon(item.icon)}${UI.escapeHtml(item.label)}</a>`;
      })
      .join('');

    const initial = (user.name || 'U').charAt(0).toUpperCase();
    const planeBrand = typeof Icons !== 'undefined' ? Icons.plane(22) : '✈';

    sidebar.innerHTML = `
      <a href="index.html" class="dashboard-sidebar-brand">${planeBrand} SkyBook</a>
      <nav class="dashboard-nav" aria-label="Dashboard">${navItems}</nav>
      <div class="dashboard-sidebar-footer">
        <div class="dash-user-card">
          <div class="dash-avatar">${UI.escapeHtml(initial)}</div>
          <div class="dash-user-meta">
            <strong>${UI.escapeHtml(user.name)}</strong>
            <span>${UI.escapeHtml(user.role)}</span>
          </div>
        </div>
        <button type="button" class="btn btn-outline btn-sm" id="btn-dash-logout" style="width:100%;border-color:rgba(255,255,255,0.4);color:#fff">Logout</button>
      </div>`;

    document.getElementById('btn-dash-logout')?.addEventListener('click', () => Session.logout());
  },

  _bindToggle() {
    document.getElementById('dashboard-menu-btn')?.addEventListener('click', () => {
      document.body.classList.toggle('sidebar-open');
    });
    document.getElementById('dashboard-overlay')?.addEventListener('click', () => {
      document.body.classList.remove('sidebar-open');
    });
  },

  setWelcome(name, title, subtitle) {
    const el = document.getElementById('dash-welcome');
    if (!el) return;
    const h1 = el.querySelector('h1');
    const p = el.querySelector('p');
    if (h1) h1.textContent = `Welcome back, ${name}`;
    if (p) p.textContent = subtitle || '';
  },

  setStats(stats = []) {
    const el = document.getElementById('dash-stats');
    if (!el) return;
    el.innerHTML = stats
      .map(
        (s, i) => `
      <div class="dash-stat-card reveal is-visible" style="transition-delay:${i * 0.05}s">
        <div class="dash-stat-icon ${UI.escapeHtml(s.variant || 'primary')}">${DashboardUI.statIcon(s.icon || s.variant)}</div>
        <div>
          <div class="dash-stat-value">${UI.escapeHtml(String(s.value ?? '—'))}</div>
          <div class="dash-stat-label">${UI.escapeHtml(s.label)}</div>
        </div>
      </div>`
      )
      .join('');
    if (typeof Visuals !== 'undefined') Visuals.refreshReveal();
  },

  setActivity(items = [], emptyMessage = 'No recent activity') {
    const el = document.getElementById('dash-activity-list');
    if (!el) return;
    if (!items.length) {
      el.innerHTML = `<li class="activity-empty">${UI.escapeHtml(emptyMessage)}</li>`;
      return;
    }
    el.innerHTML = items
      .map(
        (item) => `
      <li class="activity-item reveal is-visible">
        <div class="activity-icon">${DashboardUI.icon(item.icon || 'plane', 16)}</div>
        <div class="activity-body">
          <strong>${UI.escapeHtml(item.title)}</strong>
          <span>${UI.escapeHtml(item.meta || '')}</span>
        </div>
        ${item.badge ? `<span class="activity-badge ${UI.escapeHtml(String(item.badge).toLowerCase())}">${UI.escapeHtml(item.badge)}</span>` : ''}
      </li>`
      )
      .join('');
    if (typeof Visuals !== 'undefined') Visuals.refreshReveal();
  },

  actionCard(href, title, desc, imageUrl, iconName = 'plane') {
    const bg = imageUrl || (typeof Visuals !== 'undefined' ? Visuals.IMAGES.destinations[0] : '');
    return `<a href="${UI.escapeHtml(href)}" class="dash-action-card reveal is-visible">
      <div class="dash-action-img" style="background-image:url('${bg.replace(/'/g, '%27')}')"></div>
      <div class="dash-action-body">
        <span class="ico">${DashboardUI.icon(iconName, 20)}</span>
        <div><h4>${UI.escapeHtml(title)}</h4><p>${UI.escapeHtml(desc)}</p></div>
      </div>
    </a>`;
  }
};

window.DashboardUI = DashboardUI;
