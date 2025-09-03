const { pool } = require('../config/database');

async function testParameterBinding() {
  try {
    console.log('🔍 测试MySQL参数绑定...');
    
    // 先创建一些测试数据
    console.log('1. 创建测试数据...');
    await pool.execute('INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)', 
      ['testuser', 'test@example.com', 'hashedpassword']);
    
    const [users] = await pool.execute('SELECT id FROM users WHERE username = ?', ['testuser']);
    const userId = users[0].id;
    console.log(`✅ 测试用户创建成功，ID: ${userId}`);
    
    // 创建对话
    await pool.execute(
      'INSERT INTO conversations (id, user_id, title) VALUES (?, ?, ?)',
      ['test-conv-1', userId, '测试对话1']
    );
    console.log('✅ 测试对话创建成功');
    
    // 测试不同的参数绑定方式
    console.log('2. 测试参数绑定方式...');
    
    // 方式1: 直接使用数字参数
    console.log('方式1 - 数字参数:');
    const [result1] = await pool.execute(
      'SELECT * FROM conversations WHERE user_id = ? LIMIT ?',
      [userId, 5]
    );
    console.log(`✅ 找到 ${result1.length} 个对话 (数字参数)`);
    
    // 方式2: 转换为字符串
    console.log('方式2 - 字符串参数:');
    const [result2] = await pool.execute(
      'SELECT * FROM conversations WHERE user_id = ? LIMIT ?',
      [userId.toString(), '5']
    );
    console.log(`✅ 找到 ${result2.length} 个对话 (字符串参数)`);
    
    // 方式3: 分别测试每个参数
    console.log('方式3 - 分别测试:');
    const [result3] = await pool.execute(
      'SELECT * FROM conversations WHERE user_id = ?',
      [userId]
    );
    console.log(`✅ 找到 ${result3.length} 个对话 (只有user_id)`);
    
    const [result4] = await pool.execute(
      'SELECT * FROM conversations LIMIT ?',
      [5]
    );
    console.log(`✅ 找到 ${result4.length} 个对话 (只有LIMIT)`);
    
    console.log('✅ 参数绑定测试完成！');
    
  } catch (error) {
    console.error('❌ 参数绑定测试失败:', error.message);
    console.error('错误堆栈:', error.stack);
    if (error.code) console.error('错误代码:', error.code);
    if (error.sqlState) console.error('SQL状态:', error.sqlState);
    if (error.sql) console.error('SQL语句:', error.sql);
  }
}

testParameterBinding();