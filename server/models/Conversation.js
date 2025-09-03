const { pool } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class Conversation {
  // 创建新对话
  static async create(userId, title = '新对话') {
    const id = uuidv4();
    const [result] = await pool.execute(
      'INSERT INTO conversations (id, user_id, title) VALUES (?, ?, ?)',
      [id, userId, title]
    );
    return id;
  }

  // 根据ID获取对话
  static async findById(id) {
    const [rows] = await pool.execute(
      'SELECT id, user_id as userId, title, created_at as createdAt, updated_at as updatedAt FROM conversations WHERE id = ?',
      [id]
    );
    return rows[0] || null;
  }

  // 获取用户的所有对话（按时间倒序）
  static async findByUserId(userId, limit = 10) {
    // 由于MySQL参数绑定问题，使用字符串模板
    const userIdParam = Number(userId);
    const limitParam = Number(limit);
    
    const [rows] = await pool.execute(
      `SELECT id, user_id as userId, title, created_at as createdAt, updated_at as updatedAt
       FROM conversations
       WHERE user_id = ?
       ORDER BY updated_at DESC
       LIMIT ${limitParam}`,
      [userIdParam]
    );
    return rows;
  }

  // 更新对话标题
  static async updateTitle(id, title) {
    const [result] = await pool.execute(
      'UPDATE conversations SET title = ? WHERE id = ?',
      [title, id]
    );
    return result.affectedRows > 0;
  }

  // 删除对话
  static async delete(id) {
    const [result] = await pool.execute(
      'DELETE FROM conversations WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  }

  // 检查用户是否拥有该对话
  static async belongsToUser(conversationId, userId) {
    const [rows] = await pool.execute(
      'SELECT id FROM conversations WHERE id = ? AND user_id = ?',
      [conversationId, userId]
    );
    return rows.length > 0;
  }

  // 获取用户的对话数量
  static async countByUserId(userId) {
    const [rows] = await pool.execute(
      'SELECT COUNT(*) as count FROM conversations WHERE user_id = ?',
      [userId]
    );
    return Number(rows[0].count);
  }

  // 删除用户最旧的对话（用于限制会话数量）
  static async deleteOldestConversation(userId, keepCount = 10) {
    const [rows] = await pool.execute(
      `SELECT id FROM conversations 
       WHERE user_id = ? 
       ORDER BY updated_at ASC 
       LIMIT 1`,
      [userId]
    );
    
    if (rows.length > 0) {
      await this.delete(rows[0].id);
      return true;
    }
    return false;
  }
}

module.exports = Conversation;