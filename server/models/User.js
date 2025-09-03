const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');

class User {
  static async exists(username, email) {
    const [rows] = await pool.execute(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      [username, email]
    );
    return rows.length > 0;
  }

  static async create(username, email, password) {
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const [result] = await pool.execute(
      'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
      [username, email, password_hash]
    );

    return result.insertId;
  }

  static async findByEmail(email) {
    const [rows] = await pool.execute(
      'SELECT id, username, email, password_hash, created_at FROM users WHERE email = ?',
      [email]
    );
    return rows[0] || null;
  }

  static async findById(id) {
    const [rows] = await pool.execute(
      'SELECT id, username, email, created_at FROM users WHERE id = ?',
      [id]
    );
    return rows[0] || null;
  }

  static async validatePassword(password, password_hash) {
    return await bcrypt.compare(password, password_hash);
  }
}

module.exports = User;
