const { pool } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class Message {
  // 创建新消息
  static async create(conversationId, role, content) {
    const id = uuidv4();
    const [result] = await pool.execute(
      'INSERT INTO messages (id, conversation_id, role, content) VALUES (?, ?, ?, ?)',
      [id, conversationId, role, content]
    );
    return id;
  }

  // 获取对话的所有消息
  static async findByConversationId(conversationId) {
    const [rows] = await pool.execute(
      `SELECT id, conversation_id as conversationId, role, content, timestamp 
       FROM messages 
       WHERE conversation_id = ? 
       ORDER BY timestamp ASC`,
      [conversationId]
    );
    return rows;
  }

  // 根据ID获取消息
  static async findById(id) {
    const [rows] = await pool.execute(
      'SELECT id, conversation_id as conversationId, role, content, timestamp FROM messages WHERE id = ?',
      [id]
    );
    return rows[0] || null;
  }

  // 批量创建消息
  static async createBatch(messages) {
    if (messages.length === 0) return [];
    
    const values = messages.map(msg => [
      uuidv4(),
      msg.conversationId,
      msg.role,
      msg.content
    ]);
    
    const placeholders = messages.map(() => '(?, ?, ?, ?)').join(', ');
    const flatValues = values.flat();
    
    const [result] = await pool.execute(
      `INSERT INTO messages (id, conversation_id, role, content) VALUES ${placeholders}`,
      flatValues
    );
    
    return result.affectedRows;
  }

  // 删除对话的所有消息
  static async deleteByConversationId(conversationId) {
    const [result] = await pool.execute(
      'DELETE FROM messages WHERE conversation_id = ?',
      [conversationId]
    );
    return result.affectedRows;
  }

  // 删除单条消息
  static async delete(id) {
    const [result] = await pool.execute(
      'DELETE FROM messages WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  }

  // 获取对话的消息数量
  static async countByConversationId(conversationId) {
    const [rows] = await pool.execute(
      'SELECT COUNT(*) as count FROM messages WHERE conversation_id = ?',
      [conversationId]
    );
    return rows[0].count;
  }

  // 更新消息内容
  static async updateContent(id, content) {
    const [result] = await pool.execute(
      'UPDATE messages SET content = ? WHERE id = ?',
      [content, id]
    );
    return result.affectedRows > 0;
  }
}

module.exports = Message;