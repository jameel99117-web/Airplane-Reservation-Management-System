/**
 * Shared UI helpers — display only, no business logic.
 */
class UI {
  static showAlert(elementId, message, type = 'error') {
    const el = document.getElementById(elementId);
    if (!el) return;
    el.textContent = message;
    el.className = `alert alert-${type}`;
    el.classList.remove('hidden');
  }

  static escapeHtml(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /** Reusable button — returns HTML string only */
  static button({
    text,
    variant = 'primary',
    size = '',
    href = null,
    type = 'button',
    id = '',
    className = '',
    attrs = ''
  } = {}) {
    const classes = ['btn', `btn-${variant}`, size ? `btn-${size}` : '', className]
      .filter(Boolean)
      .join(' ');
    const idAttr = id ? ` id="${UI.escapeHtml(id)}"` : '';
    const extra = attrs ? ` ${attrs}` : '';
    const label = UI.escapeHtml(text);
    if (href) {
      return `<a href="${UI.escapeHtml(href)}" class="${classes}"${idAttr}${extra}>${label}</a>`;
    }
    return `<button type="${type}" class="${classes}"${idAttr}${extra}>${label}</button>`;
  }

  /** Input with optional icon */
  static inputField({ label, id, type = 'text', placeholder = '', icon = '', required = false, attrs = '' } = {}) {
    const req = required ? ' required' : '';
    const iconHtml = icon
      ? `<div class="input-wrap"><span class="input-icon" aria-hidden="true">${icon}</span><input type="${type}" id="${UI.escapeHtml(id)}" placeholder="${UI.escapeHtml(placeholder)}" class="input-field"${req}${attrs ? ` ${attrs}` : ''}></div>`
      : `<input type="${type}" id="${UI.escapeHtml(id)}" placeholder="${UI.escapeHtml(placeholder)}" class="input-field"${req}${attrs ? ` ${attrs}` : ''}>`;
    return `<div class="form-group"><label for="${UI.escapeHtml(id)}">${UI.escapeHtml(label)}</label>${iconHtml}</div>`;
  }

  static cityCode(name) {
    if (!name) return '—';
    const parts = String(name).trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 3).toUpperCase();
  }

  static renderFlightCard(flight, options = {}, cardIndex = 0) {
    const id = flight.id || flight._id;
    const date = flight.departureDate ? new Date(flight.departureDate).toLocaleDateString() : '—';
    const avail = flight.availableCount ?? null;
    const bookHref = options.bookHref || `booking.html?id=${encodeURIComponent(id)}`;
    const bookLabel = options.bookLabel || 'Book Now';
    const bookVariant = options.bookVariant || 'accent';
    const showLogin = options.showLogin;
    const imgSrc =
      typeof Visuals !== 'undefined' ? Visuals.getFlightImage(flight, cardIndex) : '';
    const destName = UI.escapeHtml(flight.destination || 'destination');

    const action = showLogin
      ? UI.button({
          text: bookLabel,
          variant: bookVariant,
          size: 'sm',
          href: `login.html?redirect=booking.html?id=${encodeURIComponent(id)}`
        })
      : UI.button({ text: bookLabel, variant: bookVariant, size: 'sm', href: bookHref });

    const seatsHtml =
      avail != null ? `<span class="flight-seats">${avail} seats available</span>` : '';

    const planeIcon = typeof Icons !== 'undefined' ? Icons.plane(22) : '✈';
    const mediaHtml =
      imgSrc && typeof Visuals !== 'undefined'
        ? `<div class="flight-card-media" style="${Visuals.mediaBackgroundStyle(imgSrc)}">
          ${Visuals.imgTag(imgSrc, `${destName} destination`, 'flight-card-img', {
            width: 600,
            height: 200,
            fallback: Visuals.FALLBACK
          })}
          <div class="flight-card-media-overlay"></div>
          <span class="flight-card-media-label">${destName}</span>
        </div>`
        : '';

    return `<article class="card flight-card card-hover">
      ${mediaHtml}
      <div class="flight-card-inner">
        <div class="flight-card-header">
          <span class="flight-airline">${UI.escapeHtml(flight.airline || 'SkyBook')}</span>
          <span class="flight-number">${UI.escapeHtml(flight.flightNumber || '')}</span>
        </div>
        <div class="flight-route">
          <div class="flight-city">
            <div class="code">${UI.escapeHtml(UI.cityCode(flight.source))}</div>
            <div class="name">${UI.escapeHtml(flight.source)}</div>
            <div class="flight-meta">${UI.escapeHtml(flight.departureTime || '')}</div>
          </div>
          <div class="flight-path" aria-hidden="true">${planeIcon}<span class="duration">${date}</span></div>
          <div class="flight-city flight-city-end">
            <div class="code">${UI.escapeHtml(UI.cityCode(flight.destination))}</div>
            <div class="name">${UI.escapeHtml(flight.destination)}</div>
            <div class="flight-meta">${UI.escapeHtml(flight.arrivalTime || '')}</div>
          </div>
        </div>
        <div class="flight-card-footer">
          <div>
            <div class="flight-price">$${UI.escapeHtml(flight.price)} <span>per person</span></div>
            ${seatsHtml}
          </div>
          ${action}
        </div>
      </div>
    </article>`;
  }

  static mountPublicNavbar(activePage = '') {
    const header = document.querySelector('.navbar');
    if (!header || header.dataset.uiMounted === '1') return;

    const page = activePage || window.location.pathname.split('/').pop() || 'index.html';
    const link = (href, label) => {
      const active = page === href || (page === '' && href === 'index.html') ? ' active' : '';
      return `<a href="${href}" class="nav-link${active}">${label}</a>`;
    };

    header.innerHTML = `
      <div class="navbar-inner">
        <a href="index.html" class="navbar-brand"><span class="logo-icon">${typeof Icons !== 'undefined' ? Icons.plane(22) : '✈'}</span> SkyBook Airlines</a>
        <button type="button" class="navbar-toggle" aria-label="Toggle menu" id="navbar-toggle">☰</button>
        <nav class="navbar-nav" aria-label="Main">
          ${link('index.html', 'Home')}
          ${link('flights.html', 'Flights')}
          ${link('login.html', 'Bookings')}
          ${link('index.html#contact', 'Contact')}
        </nav>
        <div class="navbar-actions" id="navbar-actions">
          ${UI.button({ text: 'Login', variant: 'outline', size: 'sm', href: 'login.html' })}
          ${UI.button({ text: 'Sign Up', variant: 'primary', size: 'sm', href: 'register.html' })}
        </div>
      </div>`;

    header.dataset.uiMounted = '1';
    UI.bindNavbarToggle();
    UI.bindNavbarScroll();
  }

  static renderNavbar(user) {
    const header = document.querySelector('.navbar');
    if (!header || !user) return;

    const page = window.location.pathname.split('/').pop();
    const link = (href, label) => {
      const active = page === href ? ' active' : '';
      return `<a href="${href}" class="nav-link${active}">${label}</a>`;
    };

    const menus = {
      passenger: [
        link('dashboard-passenger.html', 'Dashboard'),
        link('flights.html', 'Flights'),
        link('booking.html', 'Book')
      ],
      admin: [link('dashboard-admin.html', 'Admin'), link('flights.html', 'Flights')],
      agent: [link('dashboard-agent.html', 'Agent'), link('booking.html', 'Book for Passenger')],
      manager: [link('dashboard-manager.html', 'Analytics')]
    };

    const items = menus[user.role] || menus.passenger;
    const notificationIcon = user.role === 'passenger' ? `<button type="button" class="nav-notification-btn" id="nav-notification-btn" aria-label="Notifications">
      <span class="nav-notification-icon">🔔</span>
      <span class="nav-notification-badge" id="nav-notification-badge" style="display:none">0</span>
    </button>` : '';

    header.innerHTML = `
      <div class="navbar-inner">
        <a href="index.html" class="navbar-brand"><span class="logo-icon">${typeof Icons !== 'undefined' ? Icons.plane(22) : '✈'}</span> SkyBook Airlines</a>
        <button type="button" class="navbar-toggle" aria-label="Toggle menu" id="navbar-toggle">☰</button>
        <nav class="navbar-nav" aria-label="Main">
          ${items.join('')}
          ${link('index.html', 'Home')}
        </nav>
        <div class="navbar-actions" id="navbar-actions">
          ${notificationIcon}
          <span class="nav-user-label visible">${UI.escapeHtml(user.name)} <span class="badge badge-admin">${UI.escapeHtml(user.role)}</span></span>
          ${UI.button({ text: 'Logout', variant: 'outline', size: 'sm', id: 'btn-logout', className: 'nav-logout' })}
        </div>
      </div>`;

    header.dataset.uiMounted = '1';
    document.getElementById('btn-logout')?.addEventListener('click', () => Session.logout());
    UI.bindNavbarToggle();
    UI.bindNavbarScroll();
  }

  static bindNavbarToggle() {
    const toggle = document.getElementById('navbar-toggle');
    const nav = document.querySelector('.navbar-nav');
    if (!toggle || !nav) return;
    toggle.addEventListener('click', () => nav.classList.toggle('is-open'));
  }

  static bindNavbarScroll() {
    const navbar = document.querySelector('.navbar');
    if (!navbar || navbar.dataset.scrollBound === '1') return;
    navbar.dataset.scrollBound = '1';
    const onScroll = () => navbar.classList.toggle('is-scrolled', window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  static formatRoute(flight) {
    if (!flight) return 'Route Pending';
    if (typeof flight === 'string') return flight;
    const src = flight.source || '';
    const dest = flight.destination || '';
    if (src && dest) return `${src} → ${dest}`;
    if (src || dest) return src || dest;
    if (flight.flightNumber) return `Flight ${flight.flightNumber}`;
    return 'Route Pending';
  }

  static timeAgo(date) {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    const now = new Date();
    const diffSec = Math.floor((now - d) / 1000);
    if (diffSec < 45) return 'Just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  }

  static statusBadge(status, type = 'status') {
    if (!status) return '';
    const s = String(status).toLowerCase();
    let variant = 'default';
    if (['confirmed', 'success', 'paid', 'active', 'approved'].includes(s)) variant = 'success';
    else if (['pending', 'processing', 'carry_on'].includes(s)) variant = 'warning';
    else if (['cancelled', 'rejected', 'failed', 'refunded', 'inactive'].includes(s)) variant = 'danger';
    else if (['checked', 'special'].includes(s)) variant = 'info';
    return `<span class="badge badge-${variant}">${UI.escapeHtml(status)}</span>`;
  }

  static showToast(message, type = 'info', duration = 3500) {
    let container = document.getElementById('skybook-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'skybook-toast-container';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = `toast toast-${type} toast-enter`;
    const icons = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ'
    };
    toast.innerHTML = `
      <span class="toast-icon">${icons[type] || 'ℹ'}</span>
      <div class="toast-msg">${UI.escapeHtml(message)}</div>
      <button type="button" class="toast-close" aria-label="Close">&times;</button>
    `;
    const removeToast = () => {
      toast.classList.remove('toast-enter');
      toast.classList.add('toast-exit');
      setTimeout(() => toast.remove(), 250);
    };
    toast.querySelector('.toast-close').onclick = removeToast;
    container.appendChild(toast);
    setTimeout(removeToast, duration);
  }

  static modal({ title = '', contentHtml = '', buttons = [], maxWidth = '500px' }) {
    return new Promise((resolve) => {
      const modal = document.createElement('div');
      modal.className = 'modal';
      
      const buttonsHtml = buttons.map((b, idx) => `
        <button type="${b.type || 'button'}" class="btn ${b.className || 'btn-primary'}" data-btn-idx="${idx}">${UI.escapeHtml(b.text)}</button>
      `).join(' ');

      modal.innerHTML = `
        <div class="modal-content" style="max-width: ${maxWidth}">
          <button type="button" class="close" aria-label="Close">&times;</button>
          ${title ? `<h2>${UI.escapeHtml(title)}</h2>` : ''}
          <div class="modal-body">${contentHtml}</div>
          ${buttons.length ? `<div class="modal-footer">${buttonsHtml}</div>` : ''}
        </div>
      `;

      const close = (val = null) => {
        modal.remove();
        resolve(val);
      };

      modal.querySelector('.close').onclick = () => close(null);
      modal.onclick = (e) => { if (e.target === modal) close(null); };

      modal.querySelectorAll('[data-btn-idx]').forEach((btn) => {
        btn.onclick = () => {
          const idx = parseInt(btn.dataset.btnIdx, 10);
          const config = buttons[idx];
          if (config && typeof config.onClick === 'function') {
            const res = config.onClick(modal, close);
            if (res !== false) close(config.value ?? true);
          } else {
            close(config?.value ?? true);
          }
        };
      });

      document.body.appendChild(modal);
      const firstInput = modal.querySelector('input, select, textarea');
      if (firstInput) firstInput.focus();
    });
  }

  static async confirm(message, title = 'Confirm Action', options = {}) {
    return new Promise((resolve) => {
      UI.modal({
        title,
        contentHtml: `<p style="margin-bottom: 0.5rem; font-size: 1rem; color: var(--text);">${UI.escapeHtml(message)}</p>`,
        maxWidth: '420px',
        buttons: [
          { text: options.cancelText || 'Cancel', className: 'btn-ghost btn-sm', value: false },
          { text: options.confirmText || 'Confirm', className: options.danger ? 'btn-danger btn-sm' : 'btn-primary btn-sm', value: true }
        ]
      }).then((val) => resolve(!!val));
    });
  }

  static async prompt({ title = 'Input Required', label = '', defaultValue = '', placeholder = '', inputType = 'text', required = false }) {
    return new Promise((resolve) => {
      const inputId = 'prompt-input-' + Date.now();
      const contentHtml = `
        <form id="prompt-form" onsubmit="return false;">
          <div class="form-group" style="margin-bottom: 0;">
            ${label ? `<label for="${inputId}" style="font-weight:600;margin-bottom:0.4rem;display:block;">${UI.escapeHtml(label)}</label>` : ''}
            <input type="${inputType}" id="${inputId}" class="input-field" value="${UI.escapeHtml(defaultValue)}" placeholder="${UI.escapeHtml(placeholder)}" style="width:100%;" ${required ? 'required' : ''}>
          </div>
        </form>
      `;

      UI.modal({
        title,
        contentHtml,
        maxWidth: '440px',
        buttons: [
          { text: 'Cancel', className: 'btn-ghost btn-sm', value: null },
          {
            text: 'Submit',
            className: 'btn-primary btn-sm',
            onClick: (modal, close) => {
              const input = modal.querySelector(`#${inputId}`);
              if (required && !input.value.trim()) {
                input.focus();
                return false;
              }
              close(input.value);
            }
          }
        ]
      }).then((res) => resolve(res));
    });
  }

  static renderFooter() {
    const footer = document.getElementById('site-footer');
    if (!footer) return;
    footer.innerHTML = `
      <div class="footer-inner">
        <div>
          <h4>SkyBook Airlines</h4>
          <p>Premium travel experiences with seamless booking worldwide.</p>
        </div>
        <div>
          <h4>Quick Links</h4>
          <p><a href="index.html">Home</a></p>
          <p><a href="flights.html">Flights</a></p>
          <p><a href="login.html">Login</a></p>
        </div>
        <div id="contact">
          <h4>Contact</h4>
          <p>📧 support@skybook.com</p>
          <p>📞 +1 (800) 555-0199</p>
          <p>🌐 24/7 Customer Service</p>
        </div>
      </div>
      <div class="footer-bottom">© ${new Date().getFullYear()} SkyBook Airlines. All rights reserved.</div>`;
  }

  static initPage() {
    if (document.body.classList.contains('dashboard-page')) return;
    UI.renderFooter();
    const header = document.querySelector('.navbar');
    const user = typeof Session !== 'undefined' ? Session.getUser() : null;
    if (header && header.dataset.uiMounted !== '1') {
      if (user) UI.renderNavbar(user);
      else UI.mountPublicNavbar();
    } else {
      UI.bindNavbarScroll();
    }
    if (typeof Visuals !== 'undefined') {
      Visuals.upgradeInputIcons();
      Visuals.bindImages(document);
      Visuals.refreshReveal();
    }
  }
}

document.addEventListener('DOMContentLoaded', () => UI.initPage());

window.UI = UI;

