/**
 * Session UI state — token storage and role-based redirect only.
 */
class Session {
  static TOKEN_KEY = 'token';
  static USER_KEY = 'user';

  static save(token, user) {
    user.role = RolesConfig.normalize(user.role);
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  static clear() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  }

  static getUser() {
    const raw = localStorage.getItem(this.USER_KEY);
    if (!raw) return null;
    const user = JSON.parse(raw);
    user.role = RolesConfig.normalize(user.role);
    return user;
  }

  static isLoggedIn() {
    return !!localStorage.getItem(this.TOKEN_KEY);
  }

  static redirectAfterLogin(apiResponse) {
    const dashboard = apiResponse.dashboard?.replace(/^\//, '') ||
      RolesConfig.getDashboard(apiResponse.user.role);
    window.location.href = dashboard;
  }

  static requireAuth(loginPage = 'login.html') {
    if (!this.isLoggedIn()) {
      window.location.href = loginPage;
      return false;
    }
    return true;
  }

  static requireRole(...roles) {
    if (!this.requireAuth()) return false;
    const user = this.getUser();
    const allowed = roles.flatMap((r) => (r === 'user' ? ['passenger', 'user'] : [r]));
    if (!allowed.includes(user.role)) {
      window.location.href = RolesConfig.getDashboard(user.role);
      return false;
    }
    return true;
  }

  static logout() {
    this.clear();
    window.location.href = 'index.html';
  }
}

window.Session = Session;
