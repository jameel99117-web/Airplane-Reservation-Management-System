class Payment {
  #transactionId;
  #bookingId;
  #amount;
  #status;
  #method;
  #message;

  constructor({ transactionId, bookingId, amount, status, method, message }) {
    this.#transactionId = transactionId;
    this.#bookingId = bookingId;
    this.#amount = amount;
    this.#status = status;
    this.#method = method;
    this.#message = message;
  }

  static generateTransactionId() {
    return `PAY-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  }

  static shouldSimulateFailure(cardLastFour, amount) {
    if (cardLastFour === '0000') return true;
    if (amount > 5000) return true;
    return Math.random() < 0.05;
  }

  toObject() {
    return {
      transactionId: this.#transactionId,
      bookingId: this.#bookingId,
      amount: this.#amount,
      status: this.#status,
      method: this.#method,
      message: this.#message
    };
  }
}

module.exports = Payment;
