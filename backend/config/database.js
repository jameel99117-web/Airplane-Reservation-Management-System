const mongoose = require('mongoose');

class Database {
  constructor() {
    this.#connection = null;
  }

  #connection;

  async connect(uri) {
    if (this.#connection) return this.#connection;
    mongoose.set('strictQuery', true);

    const normalized = this.#normalizeUri(uri);

    this.#connection = await mongoose.connect(normalized, {
      maxPoolSize: 10,
      bufferCommands: false, // fail fast instead of hanging silently if disconnected
    });

    console.log('MongoDB connected — database:', mongoose.connection.name);
    return this.#connection;
  }

  #normalizeUri(uri) {
    const [base, query] = uri.split('?');
    const trimmedBase = base.endsWith('/') ? base.slice(0, -1) : base;

    // If the base is just the host (mongodb+srv://user:pass@host), there's no db name yet.
    const hostOnlyPattern = /^mongodb(\+srv)?:\/\/[^/]+$/;
    if (hostOnlyPattern.test(trimmedBase)) {
      const withDb = `${trimmedBase}/airline_reservation`;
      return query ? `${withDb}?${query}` : withDb;
    }

    // Otherwise a db name already exists in the path — leave it untouched.
    return uri;
  }

  async disconnect() {
    if (this.#connection) {
      await mongoose.disconnect();
      this.#connection = null;
    }
  }
}

module.exports = new Database();