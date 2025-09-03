const { pool } = require('../config/database');

async function testParamBinding() {
  try {
    console.log('🔍 测试参数绑定问题...');
    
    // 先创建测试数据
    await pool.execute(
      'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
      ['testuser_param', 'test_param@example.com', 'hashedpassword']
    );
    
    const [users] = await pool.execute('SELECT id FROM users WHERE username = ?', ['testuser_param']);
    const userId = users[0].id;
    console.log(`✅ 测试用户创建成功，ID: ${userId} (类型: ${typeof userId})`);
    
    // 创建测试对话
    await pool.execute(
      'INSERT INTO conversations (id, user_id, title) VALUES (?, ?, ?)',
      ['test-param-binding', userId, '参数绑定测试对话']
    );
    console.log('✅ 测试对话创建成功');
    
    // 测试1: 直接使用原始SQL（应该会失败）
    console.log('\n测试1: 原始SQL (应该会失败)');
    try {
      const [rows] = await pool.execute(
        `SELECT id, user_id as userId, title, created_at as createdAt, updated_at as updatedAt 
         FROM conversations
         WHERE user_id = ?
         ORDER BY updated_at DESC
         LIMIT ?`,
        [userId, 10]
      );
      console.log(`✅ 成功找到 ${rows.length} 个对话`);
    } catch (error) {
      console.error('❌ 原始SQL失败:', error.message);
      console.error('错误代码:', error.code);
    }
    
    // 测试2: 分别测试每个参数
    console.log('\n测试2: 分别测试参数');
    const [result1] = await pool.execute(
      'SELECT * FROM conversations WHERE user_id = ?',
      [userId]
    );
    console.log(`✅ WHERE查询成功: ${result1.length} 个对话`);
    
    const [result2] = await pool.execute(
      'SELECT * FROM conversations LIMIT ?',
      [10]
    );
    console.log(`✅ LIMIT查询成功: ${result2.length} 个对话`);
    
    // 测试3: 尝试不同的参数类型
    console.log('\n测试3: 不同的参数类型');
    
    // 字符串参数
    const [result3] = await pool.execute(
      'SELECT * FROM conversations WHERE user_id = ? LIMIT ?',
      [userId.toString(), '10']
    );
    console.log(`✅ 字符串参数成功: ${result3.length} 个对话`);
    
    // 数字参数
    const [result4] = await pool.execute(
      'SELECT * FROM conversations WHERE user_id = ? LIMIT ?',
      [parseInt(userId), 10]
    );
    console.log(`✅ 数字参数成功: ${result4.length} 个对话`);
    
    console.log('✅ 参数绑定测试完成！');
    
  } catch (error) {
    console.error('❌ 参数绑定测试失败:', error.message);
    console.error('错误代码:', error.code);
    console.error('SQL状态:', error.sqlState);
    console.error('错误堆栈:', error.stack);
  }
}

testParamBinding();