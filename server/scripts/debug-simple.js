const { pool } = require('../config/database');

async function testSimpleQuery() {
  try {
    console.log('🔍 测试简单查询...');
    
    // 测试1: 直接查询所有对话
    console.log('1. 查询所有对话:');
    const [allConversations] = await pool.execute('SELECT * FROM conversations');
    console.log(`找到 ${allConversations.length} 个对话`);
    
    // 测试2: 使用字符串参数
    console.log('2. 使用字符串参数查询:');
    const [rows1] = await pool.execute(
      'SELECT * FROM conversations WHERE user_id = ?',
      ['6']  // 使用字符串
    );
    console.log(`找到 ${rows1.length} 个对话 (字符串参数)`);
    
    // 测试3: 使用数字参数
    console.log('3. 使用数字参数查询:');
    const [rows2] = await pool.execute(
      'SELECT * FROM conversations WHERE user_id = ?',
      [6]  // 使用数字
    );
    console.log(`找到 ${rows2.length} 个对话 (数字参数)`);
    
    // 测试4: 测试LIMIT参数
    console.log('4. 测试LIMIT参数:');
    const [rows3] = await pool.execute(
      'SELECT * FROM conversations LIMIT ?',
      [5]  // 数字参数
    );
    console.log(`找到 ${rows3.length} 个对话 (LIMIT测试)`);
    
    console.log('✅ 简单查询测试完成');
    
  } catch (error) {
    console.error('❌ 简单查询测试失败:', error.message);
    console.error('错误堆栈:', error.stack);
    if (error.code) console.error('错误代码:', error.code);
    if (error.sqlState) console.error('SQL状态:', error.sqlState);
    if (error.sql) console.error('SQL语句:', error.sql);
  }
}

testSimpleQuery();