class Flight {
  #id;
  #flightNumber;
  #airline;
  #source;
  #destination;
  #departureDate;
  #departureTime;
  #arrivalTime;
  #price;
  #totalSeats;
  #seats;

  constructor({
    id,
    flightNumber,
    airline,
    source,
    destination,
    departureDate,
    departureTime,
    arrivalTime,
    price,
    totalSeats,
    seats = []
  }) {
    this.#id = id;
    this.#flightNumber = flightNumber;
    this.#airline = airline;
    this.#source = source;
    this.#destination = destination;
    this.#departureDate = departureDate;
    this.#departureTime = departureTime;
    this.#arrivalTime = arrivalTime;
    this.#price = price;
    this.#totalSeats = totalSeats;
    this.#seats = seats;
  }

  get id() {
    return this.#id;
  }

  get availableSeats() {
    return this.#seats.filter((s) => !s.isBooked);
  }

  static generateSeats(totalSeats) {
    const seats = [];
    const rows = Math.ceil(totalSeats / 6);
    let count = 0;
    const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
    for (let r = 1; r <= rows && count < totalSeats; r++) {
      for (const letter of letters) {
        if (count >= totalSeats) break;
        seats.push({ seatNumber: `${r}${letter}`, isBooked: false });
        count++;
      }
    }
    return seats;
  }

  toObject() {
    return {
      id: this.#id,
      flightNumber: this.#flightNumber,
      airline: this.#airline,
      source: this.#source,
      destination: this.#destination,
      departureDate: this.#departureDate,
      departureTime: this.#departureTime,
      arrivalTime: this.#arrivalTime,
      price: this.#price,
      totalSeats: this.#totalSeats,
      seats: this.#seats,
      availableCount: this.availableSeats.length
    };
  }

  static fromDocument(doc) {
    return new Flight({
      id: doc._id.toString(),
      flightNumber: doc.flightNumber,
      airline: doc.airline,
      source: doc.source,
      destination: doc.destination,
      departureDate: doc.departureDate,
      departureTime: doc.departureTime,
      arrivalTime: doc.arrivalTime,
      price: doc.price,
      totalSeats: doc.totalSeats,
      seats: doc.seats
    });
  }
}

module.exports = Flight;
