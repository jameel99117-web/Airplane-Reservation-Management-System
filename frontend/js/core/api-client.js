/**
 * API layer — fetch() calls ONLY. No UI logic. No business rules.
 */
class ApiClient {
  constructor(baseUrl = '/api') {
    this.#baseUrl = baseUrl;
  }

  #baseUrl;

  #getToken() {
    return localStorage.getItem('token');
  }

  async #request(endpoint, options = {}, auth = true) {
    const headers = { 'Content-Type': 'application/json', ...options.headers };
    const token = this.#getToken();
    if (auth && token) headers.Authorization = `Bearer ${token}`;

    const response = await fetch(`${this.#baseUrl}${endpoint}`, { ...options, headers });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || 'Request failed');
    return data;
  }

  register(body) {
    return this.#request('/users/register', { method: 'POST', body: JSON.stringify(body) }, false);
  }

  login(body) {
    return this.#request('/users/login', { method: 'POST', body: JSON.stringify(body) }, false);
  }

  getProfile() {
    return this.#request('/users/profile');
  }

  updateProfile(body) {
    return this.#request('/users/profile', { method: 'PATCH', body: JSON.stringify(body) });
  }

  getPassengers() {
    return this.#request('/users/passengers');
  }

  getFlightsPublic(params = {}) {
    const q = new URLSearchParams(params).toString();
    return this.#request(`/flights/public${q ? `?${q}` : ''}`, {}, false);
  }

  getFlights(params = {}) {
    const q = new URLSearchParams(params).toString();
    return this.#request(`/flights${q ? `?${q}` : ''}`);
  }

  getFlight(id) {
    return this.#request(`/flights/${id}`);
  }

  createFlight(body) {
    return this.#request('/flights', { method: 'POST', body: JSON.stringify(body) });
  }

  updateFlight(id, body) {
    return this.#request(`/flights/${id}`, { method: 'PUT', body: JSON.stringify(body) });
  }

  deleteFlight(id) {
    return this.#request(`/flights/${id}`, { method: 'DELETE' });
  }

  createBooking(body) {
    return this.#request('/bookings', { method: 'POST', body: JSON.stringify(body) });
  }

  updateBooking(id, body) {
    return this.#request(`/bookings/${id}`, { method: 'PATCH', body: JSON.stringify(body) });
  }

  cancelBooking(id) {
    return this.#request(`/bookings/${id}/cancel`, { method: 'POST' });
  }

  getRescheduleOptions(bookingId) {
    return this.#request(`/bookings/${bookingId}/reschedule-options`);
  }

  rescheduleBooking(bookingId, body) {
    return this.#request(`/bookings/${bookingId}/reschedule`, {
      method: 'POST',
      body: JSON.stringify(body)
    });
  }

  getMyBookings() {
    return this.#request('/bookings/my');
  }

  getAllBookings() {
    return this.#request('/bookings/all');
  }

  getBooking(id) {
    return this.#request(`/bookings/${id}`);
  }

  createRefund(body) {
    return this.#request('/refunds', { method: 'POST', body: JSON.stringify(body) });
  }

  getMyRefunds() {
    return this.#request('/refunds/my');
  }

  getAllRefunds() {
    return this.#request('/refunds/all');
  }

  updateRefundStatus(id, body) {
    return this.#request(`/refunds/${id}`, { method: 'PATCH', body: JSON.stringify(body) });
  }

  getSystemSettings() {
    return this.#request('/system/settings');
  }

  updateSystemSettings(body) {
    return this.#request('/system/settings', { method: 'PATCH', body: JSON.stringify(body) });
  }

  getAllPricingRules() {
    return this.#request('/pricing');
  }

  createPricingRule(body) {
    return this.#request('/pricing', { method: 'POST', body: JSON.stringify(body) });
  }

  updatePricingRule(id, body) {
    return this.#request(`/pricing/${id}`, { method: 'PATCH', body: JSON.stringify(body) });
  }

  deletePricingRule(id) {
    return this.#request(`/pricing/${id}`, { method: 'DELETE' });
  }

  getRoutePerformance(sort = 'desc') {
    return this.#request(`/analytics/routes?sort=${sort}`);
  }

  getFlightPerformanceRanking() {
    return this.#request('/analytics/flights-ranking');
  }

  getPaymentsAndRefunds(status = '') {
    const query = status ? `?status=${status}` : '';
    return this.#request(`/analytics/payments-refunds${query}`);
  }

  getPeakBookingTimes() {
    return this.#request('/analytics/peak-times');
  }

  createSupportRequest(body) {
    return this.#request('/support', { method: 'POST', body: JSON.stringify(body) });
  }

  getAllSupportRequests() {
    return this.#request('/support');
  }

  getSupportRequestById(id) {
    return this.#request(`/support/${id}`);
  }

  updateSupportRequest(id, body) {
    return this.#request(`/support/${id}`, { method: 'PATCH', body: JSON.stringify(body) });
  }

  issueTicket(body) {
    return this.#request('/tickets', { method: 'POST', body: JSON.stringify(body) });
  }

  getAllTickets() {
    return this.#request('/tickets');
  }

  getTicketById(id) {
    return this.#request(`/tickets/${id}`);
  }

  getTicketsByBooking(bookingId) {
    return this.#request(`/tickets/booking/${bookingId}`);
  }

  cancelTicket(id) {
    return this.#request(`/tickets/${id}/cancel`, { method: 'PATCH' });
  }

  getNotifications(unreadOnly = false) {
    const query = unreadOnly ? '?unread=true' : '';
    return this.#request(`/notifications${query}`);
  }

  getUnreadNotificationCount() {
    return this.#request('/notifications/unread-count');
  }

  markNotificationAsRead(id) {
    return this.#request(`/notifications/${id}/mark-read`, { method: 'PATCH' });
  }

  markAllNotificationsAsRead() {
    return this.#request('/notifications/mark-all-read', { method: 'PATCH' });
  }

  generateTestNotifications() {
    return this.#request('/notifications/generate-test', { method: 'POST' });
  }

  createFeedback(body) {
    return this.#request('/feedback', { method: 'POST', body: JSON.stringify(body) });
  }

  getMyFeedback() {
    return this.#request('/feedback/my');
  }

  createEmergencyContact(body) {
    return this.#request('/emergency-contacts', { method: 'POST', body: JSON.stringify(body) });
  }

  getEmergencyContacts() {
    return this.#request('/emergency-contacts');
  }

  updateEmergencyContact(id, body) {
    return this.#request(`/emergency-contacts/${id}`, { method: 'PATCH', body: JSON.stringify(body) });
  }

  deleteEmergencyContact(id) {
    return this.#request(`/emergency-contacts/${id}`, { method: 'DELETE' });
  }

  generateBoardingPass(bookingId) {
    return this.#request(`/boarding-passes/booking/${bookingId}`);
  }

  getMyBoardingPasses() {
    return this.#request('/boarding-passes/my');
  }

  createAssistanceRequest(body) {
    return this.#request('/assistance-requests', { method: 'POST', body: JSON.stringify(body) });
  }

  getMyAssistanceRequests() {
    return this.#request('/assistance-requests/my');
  }

  createMealPreference(body) {
    return this.#request('/meal-preferences', { method: 'POST', body: JSON.stringify(body) });
  }

  getMyMealPreferences() {
    return this.#request('/meal-preferences/my');
  }

  getMealPreferenceByBooking(bookingId) {
    return this.#request(`/meal-preferences/booking/${bookingId}`);
  }

  processPayment(body) {
    return this.#request('/payments/process', { method: 'POST', body: JSON.stringify(body) });
  }

  getReportOverview() {
    return this.#request('/reports/overview');
  }

  getReportOccupancy() {
    return this.#request('/reports/occupancy');
  }

  getReportPerformance() {
    return this.#request('/reports/performance');
  }

  getSystemUsers() {
    return this.#request('/system/users');
  }

  updateUserRole(userId, role) {
    return this.#request(`/system/users/${userId}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role })
    });
  }

  deleteSystemUser(userId) {
    return this.#request(`/system/users/${userId}`, { method: 'DELETE' });
  }

  getSetupStatus() {
    return this.#request('/setup/status', {}, false);
  }

  seedFlights(force = false) {
    return this.#request(`/setup/seed-flights${force ? '?force=true' : ''}`, { method: 'POST' }, false);
  }

  // Loyalty Program API
  getMyLoyaltyProgram() {
    return this.#request('/loyalty/my');
  }

  getLoyaltyBenefits() {
    return this.#request('/loyalty/my/benefits');
  }

  getLoyaltyHistory() {
    return this.#request('/loyalty/my/history');
  }

  redeemLoyaltyPoints(points, description) {
    return this.#request('/loyalty/my/redeem', { method: 'POST', body: JSON.stringify({ points, description }) });
  }

  getLoyaltyRedemptionValue(points) {
    return this.#request(`/loyalty/redemption-value/${points}`);
  }

  addLoyaltyPoints(amount, flightCount, referenceId, referenceType) {
    return this.#request('/loyalty/my/add-points', { method: 'POST', body: JSON.stringify({ amount, flightCount, referenceId, referenceType }) });
  }

  // Baggage Management API
  getBaggageByBooking(bookingId) {
    return this.#request(`/baggage/booking/${bookingId}`);
  }

  addBaggageItem(bookingId, weight, type, description) {
    return this.#request(`/baggage/booking/${bookingId}/items`, { method: 'POST', body: JSON.stringify({ weight, type, description }) });
  }

  removeBaggageItem(bookingId, itemIndex) {
    return this.#request(`/baggage/booking/${bookingId}/items`, { method: 'DELETE', body: JSON.stringify({ itemIndex }) });
  }

  calculateBaggageFee(bookingId) {
    return this.#request(`/baggage/booking/${bookingId}/fee`);
  }

  updateBaggageFeeStatus(bookingId, status) {
    return this.#request(`/baggage/booking/${bookingId}/fee-status`, { method: 'PUT', body: JSON.stringify({ status }) });
  }

  checkBaggageRestrictions(bookingId) {
    return this.#request(`/baggage/booking/${bookingId}/restrictions`);
  }

  getMyBaggage() {
    return this.#request('/baggage/my');
  }

  // Promo Code API
  getAllPromoCodes() {
    return this.#request('/promo-codes');
  }

  createPromoCode(body) {
    return this.#request('/promo-codes', { method: 'POST', body: JSON.stringify(body) });
  }

  updatePromoCode(id, body) {
    return this.#request(`/promo-codes/${id}`, { method: 'PATCH', body: JSON.stringify(body) });
  }

  deletePromoCode(id) {
    return this.#request(`/promo-codes/${id}`, { method: 'DELETE' });
  }

  validatePromoCode(code, amount) {
    return this.#request('/promo-codes/validate', {
      method: 'POST',
      body: JSON.stringify({ code, amount })
    });
  }

  getPromoCodeUsage(id) {
    return this.#request(`/promo-codes/${id}/usage`);
  }
}

window.api = new ApiClient();
