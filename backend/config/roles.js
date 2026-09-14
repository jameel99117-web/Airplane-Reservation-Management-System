const ROLES = {
  PASSENGER: 'passenger',
  ADMIN: 'admin',
  AGENT: 'agent',
  MANAGER: 'manager'
};

const ROLE_LABELS = {
  passenger: 'Passenger (Customer)',
  admin: 'Airline Admin',
  agent: 'Reservation Agent (Staff)',
  manager: 'Operations Manager'
};

const DASHBOARD_BY_ROLE = {
  passenger: '/dashboard-passenger.html',
  user: '/dashboard-passenger.html',
  admin: '/dashboard-admin.html',
  agent: '/dashboard-agent.html',
  manager: '/dashboard-manager.html'
};

const ASSIGNABLE_ROLES = [ROLES.PASSENGER, ROLES.ADMIN, ROLES.AGENT, ROLES.MANAGER];

function normalizeRole(role) {
  if (role === 'user') return ROLES.PASSENGER;
  if (role === 'system_admin') return ROLES.ADMIN;
  return role;
}

module.exports = { ROLES, ROLE_LABELS, DASHBOARD_BY_ROLE, ASSIGNABLE_ROLES, normalizeRole };
