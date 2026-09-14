/**
 * UI-only role → dashboard mapping (no business logic, no API calls).
 */
const RolesConfig = {
  DASHBOARDS: {
    passenger: 'dashboard-passenger.html',
    user: 'dashboard-passenger.html',
    admin: 'dashboard-admin.html',
    agent: 'dashboard-agent.html',
    manager: 'dashboard-manager.html'
  },

  normalize(role) {
    if (role === 'user') return 'passenger';
    if (role === 'system_admin') return 'admin';
    return role;
  },

  getDashboard(role) {
    return this.DASHBOARDS[this.normalize(role)] || 'dashboard-passenger.html';
  }
};

window.RolesConfig = RolesConfig;
