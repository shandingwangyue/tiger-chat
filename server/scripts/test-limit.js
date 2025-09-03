const { pool } = require('../config/database');

async function testLimitParameter() {
  try {
    console.log('🔍 测试LIMIT参数绑定...');
    
    // 测试1: 直接使用数字
    console.log('测试1: 数字参数');
    const [result1] = await pool.execute(
      'SELECT * FROM conversations LIMIT ?',
      [5]
    );
    console.log(`✅ 找到 ${result1.length} 个对话 (数字参数)`);
    
    // 测试2: 使用字符串
    console.log('测试2: 字符串参数');
    const [result2] = await pool.execute(
      'SELECT * FROM conversations LIMIT ?',
      ['5']
    );
    console.log(`✅ 找到 ${result2.length} 个对话 (字符串参数)`);
    
    // 测试3: 测试WHERE和LIMIT组合
    console.log('测试3: WHERE + LIMIT 组合');
    // 先创建一个测试对话
    await pool.execute(
      'INSERT INTO conversations (id, user_id, title) VALUES (?, ?, ?)',
      ['test-limit-1', 1, '测试LIMIT对话']
    );
    
    const [result3] = await pool.execute(
      'SELECT * FROM conversations WHERE user_id = ? LIMIT ?',
      [1, 10]
    );
    console.log(`✅ 找到 ${result3.length} 个对话 (WHERE + LIMIT)`);
    
    console.log('✅ LIMIT参数测试完成！');
    
  } catch (error) {
    console.error('❌ LIMIT参数测试失败:', error.message);
    console.error('错误堆栈:', error.stack);
    if (error.code) console.error('错误代码:', error.code);
    if (error.sqlState) console.error('SQL状态:', error.sqlState);
    if (error.sql) console.error('SQL语句:', error.sql);
  }
}

testLimitParameter();