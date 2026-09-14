const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

class User {
  #id;
  #name;
  #email;
  #password;
  #role;

  constructor({ id, name, email, password, role = 'user' }) {
    this.#id = id;
    this.#name = name;
    this.#email = email;
    this.#password = password;
    this.#role = role;
  }

  get id() {
    return this.#id;
  }

  get name() {
    return this.#name;
  }

  get email() {
    return this.#email;
  }

  get role() {
    return this.#role;
  }

  async hashPassword() {
    if (!this.#password) throw new Error('Password is required');
    this.#password = await bcrypt.hash(this.#password, 10);
    return this.#password;
  }

  async comparePassword(plainPassword) {
    return bcrypt.compare(plainPassword, this.#password);
  }

  generateToken() {
    const secret = process.env.JWT_SECRET;
    const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
    return jwt.sign(
      { id: this.#id, email: this.#email, role: this.#role },
      secret,
      { expiresIn }
    );
  }

  toSafeObject() {
    return {
      id: this.#id,
      name: this.#name,
      email: this.#email,
      role: this.#role
    };
  }

  static fromDocument(doc) {
    return new User({
      id: doc._id.toString(),
      name: doc.name,
      email: doc.email,
      password: doc.password,
      role: doc.role
    });
  }
}

module.exports = User;
