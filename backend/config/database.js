const mongoose = require('mongoose');

class Database {
  constructor() {
    this.#connection = null;
  }

  #connection;

  async connect(uri) {
    if (this.#connection) return this.#connection;
    mongoose.set('strictQuery', true);
    
    // Use the URI as-is, just ensure it has a database name
    let normalized = uri;
    if (!uri.match(/\/[^/?]+(\?|$)/)) {
      normalized = `${uri.replace(/\/?$/, '')}/airline_reservation`;
    }
    
    this.#connection = await mongoose.connect(normalized);
    console.log('MongoDB connected — database:', mongoose.connection.name);
    console.log('Flights collection ready');
    return this.#connection;
  }

  async disconnect() {
    if (this.#connection) {
      await mongoose.disconnect();
      this.#connection = null;
    }
  }
}

module.exports = new Database();
