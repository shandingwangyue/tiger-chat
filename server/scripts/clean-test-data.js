const { pool } = require('../config/database');

async function cleanTestData() {
  try {
    console.log('🧹 清理测试数据...');
    
    // 删除测试用户
    await pool.execute('DELETE FROM users WHERE username LIKE ?', ['test%']);
    console.log('✅ 测试用户已清理');
    
    // 删除测试对话
    await pool.execute('DELETE FROM conversations WHERE title LIKE ?', ['%测试%']);
    console.log('✅ 测试对话已清理');
    
    console.log('✅ 数据清理完成');
    
  } catch (error) {
    console.error('❌ 清理失败:', error.message);
  }
}

cleanTestData();