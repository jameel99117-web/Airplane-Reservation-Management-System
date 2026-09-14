class Booking {
  #id;
  #userId;
  #flightId;
  #seatNumbers;
  #passengerName;
  #passengerEmail;
  #totalAmount;
  #status;
  #bookingReference;

  constructor({
    id,
    userId,
    flightId,
    seatNumbers,
    passengerName,
    passengerEmail,
    totalAmount,
    status = 'confirmed',
    bookingReference
  }) {
    this.#id = id;
    this.#userId = userId;
    this.#flightId = flightId;
    this.#seatNumbers = seatNumbers;
    this.#passengerName = passengerName;
    this.#passengerEmail = passengerEmail;
    this.#totalAmount = totalAmount;
    this.#status = status;
    this.#bookingReference = bookingReference;
  }

  static generateReference() {
    const prefix = 'BK';
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    const timestamp = Date.now().toString(36).toUpperCase().slice(-4);
    return `${prefix}-${timestamp}-${random}`;
  }

  calculateTotal(pricePerSeat, seatCount) {
    this.#totalAmount = pricePerSeat * seatCount;
    return this.#totalAmount;
  }

  toObject() {
    return {
      id: this.#id,
      userId: this.#userId,
      flightId: this.#flightId,
      seatNumbers: this.#seatNumbers,
      passengerName: this.#passengerName,
      passengerEmail: this.#passengerEmail,
      totalAmount: this.#totalAmount,
      status: this.#status,
      bookingReference: this.#bookingReference
    };
  }

  static fromDocument(doc) {
    return new Booking({
      id: doc._id.toString(),
      userId: doc.user?.toString() || doc.user,
      flightId: doc.flight?.toString() || doc.flight,
      seatNumbers: doc.seatNumbers,
      passengerName: doc.passengerName,
      passengerEmail: doc.passengerEmail,
      totalAmount: doc.totalAmount,
      status: doc.status,
      bookingReference: doc.bookingReference
    });
  }
}

module.exports = Booking;
