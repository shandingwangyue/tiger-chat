const { pool } = require('../config/database');

async function testSimple() {
  try {
    console.log('🔍 测试简单查询...');
    
    // 测试1: 查看当前表
    const [tables] = await pool.execute('SHOW TABLES');
    console.log('当前表:', tables);
    
    // 测试2: 简单查询
    const [result] = await pool.execute('SELECT 1 + 1 as result');
    console.log('简单计算:', result);
    
    console.log('✅ 简单测试完成');
    
  } catch (error) {
    console.error('❌ 简单测试失败:', error.message);
    console.error('错误堆栈:', error.stack);
  }
}

testSimple();