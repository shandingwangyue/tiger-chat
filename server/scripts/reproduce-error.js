const { pool } = require('../config/database');

async function reproduceError() {
  try {
    console.log('🔍 重现原始错误...');
    
    // 创建测试用户
    await pool.execute(
      'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
      ['test_error', 'test_error@example.com', 'hashedpassword']
    );
    
    const [users] = await pool.execute('SELECT id FROM users WHERE username = ?', ['test_error']);
    const userId = users[0].id;
    console.log(`用户ID: ${userId} (类型: ${typeof userId})`);
    
    // 创建测试对话
    await pool.execute(
      'INSERT INTO conversations (id, user_id, title) VALUES (?, ?, ?)',
      ['test-error-id', userId, '错误重现测试']
    );
    
    // 重现原始错误 - 使用原始SQL
    console.log('\n尝试执行原始SQL...');
    const [rows] = await pool.execute(
      `SELECT id, user_id as userId, title, created_at as createdAt, updated_at as updatedAt 
       FROM conversations
       WHERE user_id = ?
       ORDER BY updated_at DESC
       LIMIT ?`,
      [userId, 10]
    );
    
    console.log(`✅ 成功执行: 找到 ${rows.length} 个对话`);
    
  } catch (error) {
    console.error('❌ 错误重现:');
    console.error('错误消息:', error.message);
    console.error('错误代码:', error.code);
    console.error('SQL状态:', error.sqlState);
    console.error('错误堆栈:', error.stack);
    
    if (error.sql) {
      console.error('SQL语句:', error.sql);
    }
  }
}

reproduceError();