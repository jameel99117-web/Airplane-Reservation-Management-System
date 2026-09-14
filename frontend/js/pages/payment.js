try {
  if (!Session.requireAuth()) throw new Error('auth');
  UI.renderNavbar(Session.getUser());
} catch (err) {
  console.error('Auth error:', err);
  window.location.href = 'login.html';
}

const bookingId = new URLSearchParams(location.search).get('bookingId');
console.log('Booking ID from URL:', bookingId);

async function load() {
  if (!bookingId) {
    document.getElementById('booking-summary').innerHTML = '<p class="text-muted">No booking ID provided</p>';
    return;
  }
  try {
    const res = await api.getBooking(bookingId);
    const b = res.data;
    const paidAmount = b.paidAmount || 0;
    const amountDue = Math.max(0, b.totalAmount - paidAmount);
    document.getElementById('booking-summary').innerHTML = `
      <h3>Booking ${UI.escapeHtml(b.bookingReference)}</h3>
      ${b.promoCode ? `<p class="text-muted">Promo code: <strong>${UI.escapeHtml(b.promoCode)}</strong></p>` : ''}
      ${b.discountApplied > 0 ? `<p class="text-muted">Original: $${UI.escapeHtml(b.originalAmount ?? b.totalAmount)} · Discount: -$${UI.escapeHtml(b.discountApplied)}</p>` : ''}
      ${paidAmount > 0 && amountDue > 0 ? `<p class="text-muted">Total: $${UI.escapeHtml(b.totalAmount)} · Already paid: $${UI.escapeHtml(paidAmount)}</p>` : ''}
      <p class="flight-price mb-1">$${UI.escapeHtml(amountDue || b.totalAmount)} <span>${amountDue > 0 && paidAmount > 0 ? 'amount due' : 'total due'}</span></p>
      <p class="text-muted">Payment status: <strong>${UI.escapeHtml(b.paymentStatus)}</strong></p>`;
  } catch (err) {
    console.error('Error loading booking:', err);
    document.getElementById('booking-summary').innerHTML = `<p class="text-muted">Error loading booking: ${err.message}</p>`;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded');
  
  const form = document.getElementById('payment-form');
  const payButton = document.querySelector('#payment-form button[type="submit"]');
  
  console.log('Form element:', form);
  console.log('Pay button:', payButton);
  
  if (payButton) {
    payButton.addEventListener('click', async (e) => {
      e.preventDefault();
      console.log('Pay button clicked, bookingId:', bookingId);
      
      if (!bookingId) {
        UI.showAlert('alert', 'No booking ID found', 'error');
        return;
      }

      const cardLastFour = document.getElementById('cardLastFour').value;
      if (!cardLastFour || cardLastFour.length !== 4) {
        UI.showAlert('alert', 'Please enter 4 digits for card number', 'error');
        return;
      }
      
      console.log('Card last four:', cardLastFour);
      
      try {
        const res = await api.processPayment({
          bookingId,
          method: document.getElementById('method').value,
          cardLastFour
        });
        console.log('Payment response:', res);
        
        UI.showAlert('alert', res.data?.message || res.message, res.success ? 'success' : 'error');
        if (res.success) {
          setTimeout(() => { window.location.href = RolesConfig.getDashboard(Session.getUser().role); }, 2000);
        } else {
          load();
        }
      } catch (err) {
        console.error('Payment error:', err);
        UI.showAlert('alert', err.message);
      }
    });
  } else {
    console.error('Pay button not found');
  }
});

load();
