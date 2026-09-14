if (!Session.requireRole('passenger', 'user')) throw new Error('auth');

const user = Session.getUser();

DashboardUI.init(user);

const img0 = typeof Visuals !== 'undefined' ? Visuals.IMAGES.destinations[0] : '';
const img1 = typeof Visuals !== 'undefined' ? Visuals.IMAGES.destinations[1] : '';

const dashActionsEl = document.getElementById('dash-actions');
if (dashActionsEl) {
  dashActionsEl.innerHTML =
    DashboardUI.actionCard('flights.html', 'Search Flights', 'Browse routes and fares', img0, 'search') +
    DashboardUI.actionCard('booking.html', 'Book Flight', 'Reserve your next journey', img1, 'plane');
}

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

function bookingsToActivity(bookings) {
  return (bookings || []).slice(0, 8).map((b) => {
    const f = b.flight || {};
    const route = UI.formatRoute(f);
    return {
      title: `Booking ${b.bookingReference}`,
      meta: route !== 'Route Pending' ? route : 'Flight booking',
      badge: b.status || b.paymentStatus,
      icon: 'ticket'
    };
  });
}

const DashboardLoader = {
  async loadProfile() {
    try {
      const res = await api.getProfile();
      const profile = res.data;
      const el = document.getElementById('profile-section');
      if (!el) return;

      const initial = (profile.name || 'U').charAt(0).toUpperCase();

      el.innerHTML = `
        <div class="profile-info">
          <div class="profile-display">
            <div class="profile-card-header">
              <div class="profile-card-avatar">${UI.escapeHtml(initial)}</div>
              <div>
                <h4 style="margin:0 0 0.25rem; font-size:1.15rem; color:var(--primary);">${UI.escapeHtml(profile.name)}</h4>
                <span class="badge badge-success">${UI.escapeHtml(profile.role)}</span>
              </div>
            </div>
            <div class="profile-meta-grid">
              <div class="profile-meta-item">
                <label>Full Name</label>
                <strong>${UI.escapeHtml(profile.name)}</strong>
              </div>
              <div class="profile-meta-item">
                <label>Email Address</label>
                <strong>${UI.escapeHtml(profile.email)}</strong>
              </div>
              <div class="profile-meta-item">
                <label>Account Role</label>
                <strong>${UI.escapeHtml(profile.role.toUpperCase())}</strong>
              </div>
            </div>
            <button class="btn btn-sm btn-primary" id="edit-profile-btn">Edit Profile Details</button>
          </div>
          <div class="profile-edit" id="profile-edit-form" style="display:none;">
            <form id="profile-form">
              <div class="form-grid-2">
                <div class="form-group">
                  <label for="profile-name-input">Full Name</label>
                  <input type="text" id="profile-name-input" name="name" class="input-field" value="${UI.escapeHtml(profile.name)}" required>
                </div>
                <div class="form-group">
                  <label for="profile-email-input">Email Address</label>
                  <input type="email" id="profile-email-input" name="email" class="input-field" value="${UI.escapeHtml(profile.email)}" required>
                </div>
                <div class="form-group form-grid-full">
                  <label for="profile-password-input">New Password (leave blank to keep current)</label>
                  <input type="password" id="profile-password-input" name="password" class="input-field" placeholder="Enter new password">
                </div>
              </div>
              <div class="btn-group" style="margin-top:1rem;">
                <button type="submit" class="btn btn-sm btn-primary">Save Changes</button>
                <button type="button" class="btn btn-sm btn-ghost" id="cancel-edit-btn">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      `;

      document.getElementById('edit-profile-btn').onclick = () => {
        document.querySelector('.profile-display').style.display = 'none';
        document.getElementById('profile-edit-form').style.display = 'block';
      };

      document.getElementById('cancel-edit-btn').onclick = () => {
        document.querySelector('.profile-display').style.display = 'block';
        document.getElementById('profile-edit-form').style.display = 'none';
      };

      document.getElementById('profile-form').onsubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const updates = {};
        if (formData.get('name')) updates.name = formData.get('name');
        if (formData.get('email')) updates.email = formData.get('email');
        if (formData.get('password')) updates.password = formData.get('password');

        try {
          await api.updateProfile(updates);
          UI.showToast('Profile updated successfully', 'success');
          this.loadProfile();
        } catch (err) {
          UI.showToast('Error updating profile: ' + err.message, 'error');
        }
      };

      if (typeof Visuals !== 'undefined') Visuals.afterContentUpdate(el);
    } catch (err) {
      console.error('Error loading profile:', err);
    }
  },

  async loadNotifications() {
    const listEl = document.getElementById('notifications-list');
    const badgeEl = document.getElementById('nav-notification-badge');
    if (!listEl) return;

    try {
      const [notificationsRes, countRes] = await Promise.all([
        api.getNotifications(),
        api.getUnreadNotificationCount()
      ]);

      const notifications = notificationsRes.data || [];
      const unreadCount = countRes.count || 0;

      if (badgeEl) {
        badgeEl.textContent = unreadCount;
        badgeEl.style.display = unreadCount > 0 ? 'inline-block' : 'none';
      }

      if (!notifications.length) {
        listEl.innerHTML = `
          <div class="empty-state" style="padding:1.5rem 1rem;">
            <p class="text-muted" style="margin-bottom:0;">You have no notifications at the moment.</p>
          </div>
        `;
        return;
      }

      listEl.innerHTML = notifications
        .map((n) => {
          let icon = '🔔';
          const titleLower = (n.title || '').toLowerCase();
          if (titleLower.includes('payment') || titleLower.includes('paid')) icon = '💳';
          else if (titleLower.includes('flight') || titleLower.includes('booking')) icon = '✈️';
          else if (titleLower.includes('refund')) icon = '↩';

          return `
            <div class="notification-item ${n.isRead ? 'read' : 'unread'}" data-id="${n._id}">
              <div class="notification-icon-wrap">${icon}</div>
              <div class="notification-content">
                <div class="notification-header">
                  <span class="notification-title">${UI.escapeHtml(n.title)}</span>
                  <span class="notification-time">${UI.timeAgo(n.createdAt)}</span>
                </div>
                <div class="notification-message">${UI.escapeHtml(n.message)}</div>
                ${!n.isRead ? `<button type="button" class="btn btn-sm btn-ghost mark-read-btn" data-id="${n._id}" style="font-size:0.75rem;padding:0.2rem 0.5rem;margin-top:0.25rem;">Mark as Read</button>` : ''}
              </div>
            </div>
          `;
        })
        .join('');

      listEl.querySelectorAll('.mark-read-btn').forEach((btn) => {
        btn.addEventListener('click', async () => {
          try {
            await api.markNotificationAsRead(btn.dataset.id);
            this.loadNotifications();
          } catch (err) {
            console.error('Error marking notification as read:', err);
          }
        });
      });
    } catch (err) {
      console.error('Error loading notifications:', err);
      if (listEl) listEl.innerHTML = `<p class="text-muted">Error loading notifications: ${err.message}</p>`;
    }
  },

  async loadFeedback() {
    const listEl = document.getElementById('feedback-list');
    const bookingSelect = document.getElementById('feedback-booking');
    if (!listEl || !bookingSelect) return;

    try {
      const res = await api.getMyFeedback();
      const feedbackList = res.data || [];

      if (!feedbackList.length) {
        listEl.innerHTML = '<p class="text-muted" style="font-size:0.9rem;">No feedback submitted yet.</p>';
      } else {
        listEl.innerHTML = `
          <h4 style="margin-bottom:0.75rem; font-size:0.95rem; color:var(--primary);">Past Feedback</h4>
          <div style="display:flex; flex-direction:column; gap:0.65rem;">
            ${feedbackList
              .map(
                (f) => `
              <div style="background:var(--bg); border:1px solid var(--border); border-radius:var(--radius-sm); padding:0.85rem 1rem;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.25rem;">
                  <span style="color:#f59e0b; font-size:1.05rem;">${'★'.repeat(f.rating)}${'☆'.repeat(5 - f.rating)}</span>
                  <span style="font-size:0.75rem; color:var(--text-muted);">${UI.timeAgo(f.createdAt)}</span>
                </div>
                <div style="font-size:0.85rem; font-weight:600; color:var(--primary);">Booking: ${UI.escapeHtml(f.booking?.bookingReference || 'N/A')}</div>
                ${f.comment ? `<p style="font-size:0.85rem; color:var(--text); margin-top:0.25rem; margin-bottom:0;">${UI.escapeHtml(f.comment)}</p>` : ''}
              </div>
            `
              )
              .join('')}
          </div>
        `;
      }

      const bookingsRes = await api.getMyBookings();
      const bookings = bookingsRes.data || [];
      const confirmedBookings = bookings.filter((b) => b.status === 'confirmed' && b.paymentStatus === 'success');

      bookingSelect.innerHTML =
        '<option value="">-- Select a booking --</option>' +
        confirmedBookings
          .map((b) => `<option value="${b._id}">${UI.escapeHtml(b.bookingReference)} (${UI.formatRoute(b.flight)})</option>`)
          .join('');
    } catch (err) {
      console.error('Error loading feedback:', err);
      if (listEl) listEl.innerHTML = `<p class="text-muted">Error loading feedback: ${err.message}</p>`;
    }
  },

  async loadAssistanceRequests() {
    const listEl = document.getElementById('assistance-requests-list');
    if (!listEl) return;

    try {
      const res = await api.getMyAssistanceRequests();
      const requests = res.data || [];

      if (!requests.length) {
        listEl.innerHTML = '<p class="text-muted" style="font-size:0.9rem;">No special assistance requests submitted.</p>';
        return;
      }

      listEl.innerHTML = `
        <div style="display:flex; flex-direction:column; gap:0.65rem;">
          ${requests
            .map(
              (r) => `
            <div style="background:var(--bg); border:1px solid var(--border); border-radius:var(--radius-sm); padding:0.85rem 1rem; display:flex; justify-content:space-between; align-items:flex-start;">
              <div>
                <strong style="display:block; font-size:0.9rem; color:var(--primary); text-transform:capitalize;">♿ ${UI.escapeHtml(r.assistanceType)} Assistance</strong>
                <span style="font-size:0.8rem; color:var(--text-muted);">Booking: ${UI.escapeHtml(r.booking?.bookingReference || 'N/A')}</span>
                ${r.notes ? `<p style="font-size:0.85rem; margin-top:0.25rem; margin-bottom:0;">${UI.escapeHtml(r.notes)}</p>` : ''}
              </div>
              ${UI.statusBadge(r.status)}
            </div>
          `
            )
            .join('')}
        </div>
      `;
    } catch (err) {
      console.error('Error loading assistance requests:', err);
      if (listEl) listEl.innerHTML = `<p class="text-muted">Error loading assistance requests: ${err.message}</p>`;
    }
  },

  async loadMealPreferences() {
    const listEl = document.getElementById('meal-preferences-list');
    if (!listEl) return;

    try {
      const res = await api.getMyMealPreferences();
      const preferences = res.data || [];

      if (!preferences.length) {
        listEl.innerHTML = '<p class="text-muted" style="font-size:0.9rem;">No meal preferences saved.</p>';
        return;
      }

      listEl.innerHTML = `
        <div style="display:flex; flex-direction:column; gap:0.65rem;">
          ${preferences
            .map(
              (p) => `
            <div style="background:var(--bg); border:1px solid var(--border); border-radius:var(--radius-sm); padding:0.85rem 1rem;">
              <strong style="display:block; font-size:0.9rem; color:var(--primary); text-transform:capitalize;">🍽️ ${UI.escapeHtml(p.mealType)} Meal</strong>
              <span style="font-size:0.8rem; color:var(--text-muted);">Booking: ${UI.escapeHtml(p.booking?.bookingReference || 'N/A')}</span>
              ${p.specialNotes ? `<p style="font-size:0.85rem; margin-top:0.25rem; margin-bottom:0;">${UI.escapeHtml(p.specialNotes)}</p>` : ''}
            </div>
          `
            )
            .join('')}
        </div>
      `;
    } catch (err) {
      console.error('Error loading meal preferences:', err);
      if (listEl) listEl.innerHTML = `<p class="text-muted">Error loading meal preferences: ${err.message}</p>`;
    }
  },

  async loadLoyaltyProgram() {
    const listEl = document.getElementById('loyalty-program-section');
    if (!listEl) return;

    try {
      const programRes = await api.getMyLoyaltyProgram();
      const program = programRes.data;

      if (!program) {
        listEl.innerHTML = `
          <div class="empty-state">
            <h3>Start Earning SkyMiles</h3>
            <p class="text-muted">Your frequent flyer membership is automatically activated with your first booking.</p>
            <a href="flights.html" class="btn btn-sm btn-primary mt-1">Book a Flight</a>
          </div>
        `;
        return;
      }

      const benefitsRes = await api.getLoyaltyBenefits();
      const benefits = benefitsRes.data || {};

      const tierIcons = {
        platinum: '💎',
        gold: '🥇',
        silver: '🥈'
      };

      listEl.innerHTML = `
        <div class="loyalty-digital-card tier-${program.tier || 'silver'}">
          <div class="loyalty-card-top">
            <div>
              <div class="loyalty-brand">✈ SkyBook Miles</div>
              <div style="font-size:0.8rem; opacity:0.85; margin-top:0.2rem;">Frequent Flyer Program</div>
            </div>
            <div class="loyalty-tier-badge">
              <span>${tierIcons[program.tier] || '🥈'}</span>
              <span>${(program.tier || 'Silver').toUpperCase()}</span>
            </div>
          </div>
          <div class="loyalty-points-display">
            <div class="loyalty-points-num">${(program.points || 0).toLocaleString()} <span style="font-size:1.1rem; font-weight:500;">pts</span></div>
            <div class="loyalty-points-label">Available Reward Points</div>
          </div>
          <div class="loyalty-card-footer">
            <div>
              <span style="font-size:0.75rem; opacity:0.75; display:block;">Total Flights</span>
              <strong style="font-size:1rem;">${program.totalFlights || 0}</strong>
            </div>
            <div>
              <span style="font-size:0.75rem; opacity:0.75; display:block;">Total Spent</span>
              <strong style="font-size:1rem;">$${(program.totalSpent || 0).toLocaleString()}</strong>
            </div>
            <div>
              <span style="font-size:0.75rem; opacity:0.75; display:block;">Multiplier</span>
              <strong style="font-size:1rem;">${benefits.pointsMultiplier || 1}x</strong>
            </div>
          </div>
        </div>

        <div style="background:var(--bg); border:1px solid var(--border); border-radius:var(--radius); padding:1.25rem; margin-bottom:1.25rem;">
          <h4 style="margin:0 0 0.75rem; color:var(--primary); font-size:0.95rem;">Tier Privileges & Benefits</h4>
          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(180px, 1fr)); gap:0.65rem;">
            <div style="font-size:0.85rem; color:var(--text);">🧳 Baggage Allowance: <strong>${benefits.baggageAllowance || 20}kg</strong></div>
            <div style="font-size:0.85rem; color:var(--text);">⭐ Multiplier: <strong>${benefits.pointsMultiplier || 1}x Points</strong></div>
            ${benefits.priorityCheckIn ? '<div style="font-size:0.85rem; color:var(--success);">✓ Priority Check-in Included</div>' : ''}
            ${benefits.loungeAccess ? '<div style="font-size:0.85rem; color:var(--success);">✓ Airport Lounge Access Included</div>' : ''}
            ${benefits.freeSeatSelection ? '<div style="font-size:0.85rem; color:var(--success);">✓ Complimentary Seat Selection</div>' : ''}
          </div>
        </div>

        <div class="btn-group">
          <button type="button" class="btn btn-sm btn-primary" id="redeem-points-btn">Redeem Points</button>
          <button type="button" class="btn btn-sm btn-ghost" id="view-loyalty-history-btn">Points History</button>
        </div>
      `;

      document.getElementById('redeem-points-btn').onclick = async () => {
        const pointsStr = await UI.prompt({
          title: 'Redeem Loyalty Points',
          label: `Enter number of points to redeem (Available: ${program.points || 0})`,
          placeholder: 'e.g. 500',
          inputType: 'number',
          required: true
        });

        if (pointsStr && !isNaN(pointsStr) && parseInt(pointsStr, 10) > 0) {
          this.redeemPoints(parseInt(pointsStr, 10));
        }
      };

      document.getElementById('view-loyalty-history-btn').onclick = () => {
        this.loadLoyaltyHistory();
      };
    } catch (err) {
      console.error('Error loading loyalty program:', err);
      if (listEl) listEl.innerHTML = `<p class="text-muted">Error loading loyalty program: ${err.message}</p>`;
    }
  },

  async redeemPoints(points) {
    try {
      const description = (await UI.prompt({
        title: 'Redemption Note',
        label: 'Optional description for redemption:',
        placeholder: 'e.g. Travel voucher redemption',
        defaultValue: 'Points redemption'
      })) || 'Points redemption';

      await api.redeemLoyaltyPoints(points, description);
      UI.showToast(`${points} points redeemed successfully!`, 'success');
      this.loadLoyaltyProgram();
    } catch (err) {
      console.error('Error redeeming points:', err);
      UI.showToast('Error redeeming points: ' + err.message, 'error');
    }
  },

  async loadLoyaltyHistory() {
    try {
      const res = await api.getLoyaltyHistory();
      const history = res.data || [];

      const sortedHistory = history.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });

      const contentHtml = `
        <div style="display:flex; flex-direction:column; gap:0.65rem; max-height:360px; overflow-y:auto; padding-right:0.25rem;">
          ${!sortedHistory.length ? '<p class="text-muted">No point transactions yet.</p>' : sortedHistory.map(h => `
            <div style="display:flex; justify-content:space-between; align-items:center; padding:0.75rem; background:var(--bg); border-radius:var(--radius-sm); border:1px solid var(--border);">
              <div>
                <strong style="font-size:0.85rem; color:var(--primary); text-transform:capitalize;">${UI.escapeHtml(h.type.replace('_', ' '))}</strong>
                <div style="font-size:0.8rem; color:var(--text-muted);">${UI.escapeHtml(h.description || '')}</div>
                <div style="font-size:0.75rem; color:var(--text-muted);">${new Date(h.createdAt).toLocaleDateString()}</div>
              </div>
              <span style="font-weight:700; font-size:0.95rem; color:${h.points > 0 ? 'var(--success)' : 'var(--danger)'};">
                ${h.points > 0 ? '+' : ''}${h.points} pts
              </span>
            </div>
          `).join('')}
        </div>
      `;

      UI.modal({
        title: 'Loyalty Points History',
        contentHtml,
        maxWidth: '480px',
        buttons: [{ text: 'Close', className: 'btn-ghost btn-sm', value: true }]
      });
    } catch (err) {
      console.error('Error loading loyalty history:', err);
      UI.showToast('Error loading history: ' + err.message, 'error');
    }
  },

  async loadBaggageManagement() {
    const listEl = document.getElementById('baggage-management-section');
    if (!listEl) return;

    try {
      const res = await api.getMyBaggage();
      const baggageRecords = res.data || [];

      if (!baggageRecords.length) {
        listEl.innerHTML = `
          <div class="empty-state" style="padding:1.5rem 1rem;">
            <p class="text-muted" style="margin-bottom:0;">No baggage records. Baggage allowance details appear after booking a flight.</p>
          </div>
        `;
        return;
      }

      const recentRecords = baggageRecords.slice(0, 3);

      listEl.innerHTML = recentRecords
        .map((b) => {
          const flight = b.flight || {};
          const route = UI.formatRoute(flight);
          const allowed = b.allowedWeight || 20;
          const total = b.totalWeight || 0;
          const pct = Math.min(100, Math.round((total / allowed) * 100));
          const isExcess = (b.excessWeight || 0) > 0;

          return `
            <div class="baggage-card">
              <div class="baggage-header">
                <span class="baggage-route">✈ ${UI.escapeHtml(route)}</span>
                ${UI.statusBadge(b.feeStatus)}
              </div>
              
              <div class="baggage-meter">
                <div class="baggage-meter-labels">
                  <span><strong>${total}kg</strong> used</span>
                  <span class="text-muted">${allowed}kg allowance</span>
                </div>
                <div class="baggage-meter-track">
                  <div class="baggage-meter-fill ${isExcess ? 'is-excess' : ''}" style="width: ${pct}%"></div>
                </div>
              </div>

              <div style="display:flex; justify-content:space-between; font-size:0.85rem; margin-bottom:0.85rem; color:var(--text-muted);">
                <span>Excess: <strong>${b.excessWeight || 0}kg</strong></span>
                <span>Fee: <strong style="color:${b.totalFee > 0 ? 'var(--danger)' : 'var(--primary)'}">$${b.totalFee || 0}</strong></span>
                <span>Tier: <strong style="text-transform:capitalize;">${b.tier || 'Silver'}</strong></span>
              </div>

              <div style="margin-bottom:1rem;">
                <div style="font-size:0.8rem; font-weight:600; color:var(--text-muted); margin-bottom:0.35rem;">BAGGAGE ITEMS</div>
                ${!b.baggageItems.length ? '<span class="text-muted" style="font-size:0.85rem;">No individual items checked yet</span>' :
                  `<div style="display:flex; flex-wrap:wrap; gap:0.4rem;">
                    ${b.baggageItems.map(item => `
                      <span class="badge ${item.isExcess ? 'badge-warning' : 'badge-default'}" style="font-size:0.75rem;">
                        ${UI.escapeHtml(item.type)} · ${item.weight}kg ${item.isExcess ? '(Excess)' : ''}
                      </span>
                    `).join('')}
                  </div>`
                }
              </div>

              <div class="table-actions">
                <button type="button" class="btn-action btn-action-primary" data-add-baggage="${b.booking?._id || b.booking}">+ Add Item</button>
                <button type="button" class="btn-action" data-view-fee="${b.booking?._id || b.booking}">View Fee Breakdown</button>
              </div>
            </div>
          `;
        })
        .join('');

      listEl.querySelectorAll('[data-add-baggage]').forEach((btn) => {
        btn.onclick = () => this.showAddBaggageModal(btn.dataset.addBaggage);
      });

      listEl.querySelectorAll('[data-view-fee]').forEach((btn) => {
        btn.onclick = () => this.viewBaggageFee(btn.dataset.viewFee);
      });
    } catch (err) {
      console.error('Error loading baggage management:', err);
      if (listEl) listEl.innerHTML = `<p class="text-muted">Error loading baggage: ${err.message}</p>`;
    }
  },

  async showAddBaggageModal(bookingId) {
    const contentHtml = `
      <form id="add-baggage-modal-form">
        <div class="form-group">
          <label for="modal-baggage-weight">Weight (kg)</label>
          <input type="number" id="modal-baggage-weight" name="weight" class="input-field" min="0.1" step="0.1" placeholder="e.g. 15.5" required>
        </div>
        <div class="form-group">
          <label for="modal-baggage-type">Item Type</label>
          <select id="modal-baggage-type" name="type" class="input-field" required>
            <option value="carry_on">Carry-on</option>
            <option value="checked" selected>Checked Baggage</option>
            <option value="special">Special Baggage (Sports/Music)</option>
          </select>
        </div>
        <div class="form-group">
          <label for="modal-baggage-description">Description (Optional)</label>
          <input type="text" id="modal-baggage-description" name="description" class="input-field" placeholder="e.g., Hard-shell Suitcase">
        </div>
      </form>
    `;

    UI.modal({
      title: 'Add Baggage Item',
      contentHtml,
      maxWidth: '440px',
      buttons: [
        { text: 'Cancel', className: 'btn-ghost btn-sm', value: false },
        {
          text: 'Add Baggage',
          className: 'btn-primary btn-sm',
          onClick: async (modal, close) => {
            const weightInput = modal.querySelector('#modal-baggage-weight');
            const typeInput = modal.querySelector('#modal-baggage-type');
            const descInput = modal.querySelector('#modal-baggage-description');

            const weight = parseFloat(weightInput.value);
            if (isNaN(weight) || weight <= 0) {
              weightInput.focus();
              return false;
            }

            try {
              await api.addBaggageItem(bookingId, weight, typeInput.value, descInput.value || '');
              UI.showToast('Baggage item added successfully', 'success');
              close(true);
              DashboardLoader.loadBaggageManagement();
            } catch (err) {
              UI.showToast('Error adding baggage: ' + err.message, 'error');
            }
          }
        }
      ]
    });
  },

  async viewBaggageFee(bookingId) {
    try {
      const res = await api.calculateBaggageFee(bookingId);
      const feeDetails = res.data;

      const contentHtml = `
        <div class="profile-meta-grid" style="grid-template-columns:repeat(2, 1fr); margin-bottom:1rem;">
          <div class="profile-meta-item">
            <label>Total Weight</label>
            <strong>${feeDetails.totalWeight} kg</strong>
          </div>
          <div class="profile-meta-item">
            <label>Allowed Weight</label>
            <strong>${feeDetails.allowedWeight} kg</strong>
          </div>
          <div class="profile-meta-item">
            <label>Excess Weight</label>
            <strong style="color:${feeDetails.excessWeight > 0 ? 'var(--danger)' : 'var(--success)'}">${feeDetails.excessWeight} kg</strong>
          </div>
          <div class="profile-meta-item">
            <label>Base Excess Fee</label>
            <strong>$${feeDetails.baseFee}</strong>
          </div>
          <div class="profile-meta-item">
            <label>Tier Waiver</label>
            <strong style="color:var(--success)">-$${feeDetails.tierWaiver}</strong>
          </div>
          <div class="profile-meta-item" style="background:#f0fdf4; border-color:#bbf7d0;">
            <label>Final Payable Fee</label>
            <strong style="color:var(--primary); font-size:1.15rem;">$${feeDetails.finalFee}</strong>
          </div>
        </div>
      `;

      UI.modal({
        title: 'Baggage Fee Calculation',
        contentHtml,
        maxWidth: '460px',
        buttons: [{ text: 'Close', className: 'btn-primary btn-sm', value: true }]
      });
    } catch (err) {
      console.error('Error viewing baggage fee:', err);
      UI.showToast('Error viewing fee: ' + err.message, 'error');
    }
  }
};

function showTicketDetails(booking) {
  const f = booking.flight || {};
  const route = UI.formatRoute(f);

  const contentHtml = `
    <div style="background:var(--bg); border-radius:var(--radius); padding:1.25rem; border:1px solid var(--border); margin-bottom:1rem;">
      <div style="display:flex; justify-content:space-between; border-bottom:1px dashed var(--border); padding-bottom:0.75rem; margin-bottom:0.75rem;">
        <div>
          <span style="font-size:0.75rem; color:var(--text-muted); display:block;">BOOKING REFERENCE</span>
          <strong style="font-size:1.1rem; color:var(--primary);">${UI.escapeHtml(booking.bookingReference)}</strong>
        </div>
        <div style="text-align:right;">
          <span style="font-size:0.75rem; color:var(--text-muted); display:block;">STATUS</span>
          ${UI.statusBadge(booking.status)}
        </div>
      </div>

      <div class="profile-meta-grid" style="grid-template-columns:repeat(2, 1fr); gap:0.75rem; margin-bottom:0;">
        <div class="profile-meta-item">
          <label>Passenger Name</label>
          <strong>${UI.escapeHtml(booking.passengerName)}</strong>
        </div>
        <div class="profile-meta-item">
          <label>Passenger Email</label>
          <strong>${UI.escapeHtml(booking.passengerEmail)}</strong>
        </div>
        <div class="profile-meta-item">
          <label>Route</label>
          <strong>${UI.escapeHtml(route)}</strong>
        </div>
        <div class="profile-meta-item">
          <label>Departure / Arrival</label>
          <strong>${UI.escapeHtml(f.departureTime || '—')} → ${UI.escapeHtml(f.arrivalTime || '—')}</strong>
        </div>
        <div class="profile-meta-item">
          <label>Seats Assigned</label>
          <strong>${(booking.seatNumbers || []).join(', ') || 'Unassigned'}</strong>
        </div>
        <div class="profile-meta-item">
          <label>Total Fare</label>
          <strong style="color:var(--primary); font-size:1.1rem;">$${booking.totalAmount}</strong>
        </div>
      </div>
    </div>
  `;

  UI.modal({
    title: 'E-Ticket Summary',
    contentHtml,
    maxWidth: '520px',
    buttons: [
      { text: 'Close', className: 'btn-ghost btn-sm', value: false },
      { text: '🖨️ Print Ticket', className: 'btn-primary btn-sm', onClick: () => window.print() }
    ]
  });
}

function showBoardingPass(pass) {
  const contentHtml = `
    <div style="background:linear-gradient(135deg, var(--primary), var(--primary-dark)); color:#fff; border-radius:var(--radius-lg); padding:1.5rem; position:relative; overflow:hidden; margin-bottom:1rem;">
      <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(255,255,255,0.2); padding-bottom:0.75rem; margin-bottom:1rem;">
        <div>
          <strong style="font-size:1.15rem; letter-spacing:0.05em;">✈ ${UI.escapeHtml(pass.airline || 'SkyBook Airlines')}</strong>
          <div style="font-size:0.8rem; opacity:0.8;">Boarding Pass</div>
        </div>
        <div style="text-align:right;">
          <span style="font-size:0.75rem; opacity:0.8; display:block;">FLIGHT</span>
          <strong style="font-size:1.1rem;">${UI.escapeHtml(pass.flightNumber || 'SB-101')}</strong>
        </div>
      </div>

      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.25rem;">
        <div>
          <div style="font-size:1.75rem; font-weight:800; line-height:1;">${UI.escapeHtml(UI.cityCode(pass.source))}</div>
          <div style="font-size:0.85rem; opacity:0.9;">${UI.escapeHtml(pass.source || '')}</div>
        </div>
        <div style="font-size:1.5rem; opacity:0.7;">✈</div>
        <div style="text-align:right;">
          <div style="font-size:1.75rem; font-weight:800; line-height:1;">${UI.escapeHtml(UI.cityCode(pass.destination))}</div>
          <div style="font-size:0.85rem; opacity:0.9;">${UI.escapeHtml(pass.destination || '')}</div>
        </div>
      </div>

      <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:0.5rem; background:rgba(255,255,255,0.1); border-radius:var(--radius-sm); padding:0.75rem;">
        <div>
          <span style="font-size:0.7rem; opacity:0.75; display:block;">SEAT</span>
          <strong style="font-size:0.95rem;">${(pass.seatNumbers || []).join(', ')}</strong>
        </div>
        <div>
          <span style="font-size:0.7rem; opacity:0.75; display:block;">DEPARTURE</span>
          <strong style="font-size:0.95rem;">${UI.escapeHtml(pass.departureTime || '')}</strong>
        </div>
        <div>
          <span style="font-size:0.7rem; opacity:0.75; display:block;">REF</span>
          <strong style="font-size:0.95rem;">${UI.escapeHtml(pass.bookingReference || '')}</strong>
        </div>
      </div>
    </div>
  `;

  UI.modal({
    title: 'Digital Boarding Pass',
    contentHtml,
    maxWidth: '480px',
    buttons: [
      { text: 'Close', className: 'btn-ghost btn-sm', value: false },
      { text: '🖨️ Print Boarding Pass', className: 'btn-primary btn-sm', onClick: () => window.print() }
    ]
  });
}

async function requestRefund(bookingId) {
  const reason = await UI.prompt({
    title: 'Request Booking Refund',
    label: 'Please state the reason for your refund request:',
    placeholder: 'e.g. Schedule conflict, medical emergency...',
    required: true
  });

  if (!reason) return;

  try {
    await api.createRefund({ bookingId, reason });
    UI.showToast('Refund request submitted successfully', 'success');
    load();
  } catch (err) {
    console.error('Refund error:', err);
    UI.showToast('Error submitting refund request: ' + (err.message || 'Unknown error'), 'error');
  }
}

document.getElementById('mark-all-read-btn')?.addEventListener('click', async () => {
  try {
    await api.markAllNotificationsAsRead();
    UI.showToast('All notifications marked as read', 'success');
    DashboardLoader.loadNotifications();
  } catch (err) {
    console.error('Error marking all as read:', err);
  }
});

document.getElementById('generate-test-notifications-btn')?.addEventListener('click', async () => {
  try {
    await api.generateTestNotifications();
    UI.showToast('Test notifications generated', 'info');
    DashboardLoader.loadNotifications();
  } catch (err) {
    console.error('Error generating test notifications:', err);
    UI.showToast('Error: ' + err.message, 'error');
  }
});

document.getElementById('feedback-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const bookingId = document.getElementById('feedback-booking').value;
  const rating = parseInt(document.getElementById('feedback-rating').value, 10);
  const comment = document.getElementById('feedback-comment').value.trim();

  if (!bookingId || !rating) {
    UI.showToast('Please select a booking and rating', 'warning');
    return;
  }

  try {
    await api.createFeedback({ bookingId, rating, comment });
    UI.showToast('Thank you! Your feedback was submitted.', 'success');
    document.getElementById('feedback-form').reset();
    DashboardLoader.loadFeedback();
  } catch (err) {
    console.error('Error submitting feedback:', err);
    UI.showToast('Error submitting feedback: ' + err.message, 'error');
  }
});

async function load() {
  try {
    const res = await api.getMyBookings();
    const bookings = res.data || [];

    DashboardUI.setStats([
      { label: 'Total Bookings', value: bookings.length, icon: 'bookings', variant: 'primary' },
      {
        label: 'Pending Payment',
        value: bookings.filter((b) => b.paymentStatus === 'pending').length,
        icon: 'pending',
        variant: 'warn'
      },
      {
        label: 'Confirmed Flights',
        value: bookings.filter((b) => b.status === 'confirmed').length,
        icon: 'confirmed',
        variant: 'success'
      }
    ]);

    DashboardUI.setActivity(bookingsToActivity(bookings), 'Search flights to see activity here');

    const el = document.getElementById('bookings-list');
    if (!bookings.length) {
      el.innerHTML =
        typeof Visuals !== 'undefined'
          ? Visuals.renderEmptyState({
              title: 'No bookings found',
              message: 'You have not made any flight reservations yet.',
              actionHtml: UI.button({ text: 'Search Available Flights', variant: 'primary', href: 'flights.html' })
            })
          : '<div class="empty-state"><h3>No bookings found</h3><a href="flights.html" class="btn btn-primary mt-1">Search flights</a></div>';

      if (typeof Visuals !== 'undefined') Visuals.afterContentUpdate(el);
      return;
    }

    el.innerHTML = `
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Reference</th>
              <th>Flight Route</th>
              <th>Seats</th>
              <th>Trip Status</th>
              <th>Payment</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${bookings
              .map((b) => {
                const f = b.flight || {};
                const route = UI.formatRoute(f);

                const pay =
                  b.paymentStatus === 'pending'
                    ? `<a href="payment.html?bookingId=${b._id}" class="btn-action btn-action-accent">💳 Pay Now</a>`
                    : '';

                const cancel =
                  b.status !== 'cancelled'
                    ? `<button type="button" class="btn-action btn-action-danger" data-cancel="${b._id}">Cancel</button>`
                    : '';

                const download =
                  b.status === 'confirmed' && b.paymentStatus === 'success'
                    ? `<button type="button" class="btn-action" data-download="${b._id}">📄 Ticket</button>`
                    : '';

                const boardingPass =
                  b.status === 'confirmed' && b.paymentStatus === 'success'
                    ? `<button type="button" class="btn-action btn-action-primary" data-boarding-pass="${b._id}">🎟️ Pass</button>`
                    : '';

                const refund =
                  b.status === 'confirmed' && b.paymentStatus === 'success'
                    ? `<button type="button" class="btn-action" data-refund="${b._id}">↩ Refund</button>`
                    : '';

                const reschedule =
                  b.status !== 'cancelled' && b.status !== 'refunded'
                    ? `<a href="reschedule.html?bookingId=${b._id}" class="btn-action">🔄 Reschedule</a>`
                    : '';

                const actions = [pay, boardingPass, download, reschedule, refund, cancel].filter(Boolean).join(' ');

                return `
                  <tr>
                    <td><strong>${UI.escapeHtml(b.bookingReference)}</strong></td>
                    <td>${UI.escapeHtml(route)}</td>
                    <td>${UI.escapeHtml((b.seatNumbers || []).join(', ') || 'Unassigned')}</td>
                    <td>${UI.statusBadge(b.status)}</td>
                    <td>${UI.statusBadge(b.paymentStatus)}</td>
                    <td><div class="table-actions">${actions}</div></td>
                  </tr>
                `;
              })
              .join('')}
          </tbody>
        </table>
      </div>
    `;

    document.querySelectorAll('[data-cancel]').forEach((btn) => {
      btn.onclick = async () => {
        const confirmed = await UI.confirm('Are you sure you want to cancel this booking?', 'Cancel Flight Booking', { danger: true });
        if (confirmed) {
          try {
            await api.cancelBooking(btn.dataset.cancel);
            UI.showToast('Booking cancelled successfully', 'info');
            load();
          } catch (err) {
            UI.showToast('Error cancelling booking: ' + err.message, 'error');
          }
        }
      };
    });

    document.querySelectorAll('[data-download]').forEach((btn) => {
      btn.onclick = () => {
        const booking = bookings.find((b) => b._id === btn.dataset.download);
        if (booking) showTicketDetails(booking);
      };
    });

    document.querySelectorAll('[data-boarding-pass]').forEach((btn) => {
      btn.onclick = async () => {
        const bookingId = btn.dataset.boardingPass;
        try {
          const res = await api.generateBoardingPass(bookingId);
          const pass = res.data;
          showBoardingPass(pass);
        } catch (err) {
          console.error('Error generating boarding pass:', err);
          UI.showToast('Error generating boarding pass: ' + err.message, 'error');
        }
      };
    });

    document.querySelectorAll('[data-refund]').forEach((btn) => {
      btn.onclick = async () => {
        await requestRefund(btn.dataset.refund);
      };
    });

    if (typeof Visuals !== 'undefined') Visuals.afterContentUpdate(el);

    await Promise.allSettled([
      DashboardLoader.loadNotifications(),
      DashboardLoader.loadFeedback(),
      DashboardLoader.loadAssistanceRequests(),
      DashboardLoader.loadMealPreferences(),
      DashboardLoader.loadLoyaltyProgram(),
      DashboardLoader.loadBaggageManagement()
    ]);
  } catch (err) {
    console.error('Error loading passenger dashboard data:', err);
  }
}

DashboardLoader.loadProfile();
load();

