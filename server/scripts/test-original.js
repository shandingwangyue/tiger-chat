const { pool } = require('../config/database');

async function testOriginalMethod() {
  try {
    console.log('🔍 测试原始findByUserId方法...');
    
    // 创建测试数据
    await pool.execute(
      'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
      ['testuser2', 'test2@example.com', 'hashedpassword']
    );
    
    const [users] = await pool.execute('SELECT id FROM users WHERE username = ?', ['testuser2']);
    const userId = users[0].id;
    console.log(`✅ 测试用户创建成功，ID: ${userId}`);
    
    // 创建测试对话
    await pool.execute(
      'INSERT INTO conversations (id, user_id, title) VALUES (?, ?, ?)',
      ['test-conv-original', userId, '原始方法测试对话']
    );
    console.log('✅ 测试对话创建成功');
    
    // 直接测试原始方法中的SQL
    console.log('🔍 直接执行原始SQL...');
    const [rows] = await pool.execute(
      `SELECT id, user_id as userId, title, created_at as createdAt, updated_at as updatedAt 
       FROM conversations
       WHERE user_id = ?
       ORDER BY updated_at DESC
       LIMIT ?`,
      [userId, 10]
    );
    
    console.log(`✅ 成功找到 ${rows.length} 个对话`);
    console.log('对话数据:', rows);
    
    console.log('✅ 原始方法测试完成！');
    
  } catch (error) {
    console.error('❌ 原始方法测试失败:', error.message);
    console.error('错误堆栈:', error.stack);
    if (error.code) console.error('错误代码:', error.code);
    if (error.sqlState) console.error('SQL状态:', error.sqlState);
    if (error.sql) console.error('SQL语句:', error.sql);
  }
}

testOriginalMethod();