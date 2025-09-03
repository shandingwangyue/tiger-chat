const { pool } = require('../config/database');
const mysql = require('mysql2');

async function testMySQLVersion() {
  try {
    console.log('🔍 测试MySQL版本和驱动信息...');
    
    // 获取MySQL版本
    const [versionResult] = await pool.execute('SELECT VERSION() as version');
    console.log('MySQL版本:', versionResult[0].version);
    
    // 获取mysql2版本
    console.log('mysql2版本:', mysql.version);
    
    // 测试不同的参数类型组合
    console.log('\n测试不同的参数类型组合:');
    
    // 测试1: 两个参数都是字符串
    console.log('测试1: 两个参数都是字符串');
    try {
      const [result1] = await pool.execute(
        'SELECT * FROM conversations WHERE user_id = ? LIMIT ?',
        ['1', '5']
      );
      console.log(`✅ 成功: ${result1.length} 个对话`);
    } catch (error) {
      console.error('❌ 失败:', error.message);
    }
    
    // 测试2: user_id数字，LIMIT字符串
    console.log('测试2: user_id数字，LIMIT字符串');
    try {
      const [result2] = await pool.execute(
        'SELECT * FROM conversations WHERE user_id = ? LIMIT ?',
        [1, '5']
      );
      console.log(`✅ 成功: ${result2.length} 个对话`);
    } catch (error) {
      console.error('❌ 失败:', error.message);
    }
    
    // 测试3: user_id字符串，LIMIT数字
    console.log('测试3: user_id字符串，LIMIT数字');
    try {
      const [result3] = await pool.execute(
        'SELECT * FROM conversations WHERE user_id = ? LIMIT ?',
        ['1', 5]
      );
      console.log(`✅ 成功: ${result3.length} 个对话`);
    } catch (error) {
      console.error('❌ 失败:', error.message);
    }
    
    // 测试4: 两个参数都是数字
    console.log('测试4: 两个参数都是数字');
    try {
      const [result4] = await pool.execute(
        'SELECT * FROM conversations WHERE user_id = ? LIMIT ?',
        [1, 5]
      );
      console.log(`✅ 成功: ${result4.length} 个对话`);
    } catch (error) {
      console.error('❌ 失败:', error.message);
    }
    
  } catch (error) {
    console.error('测试失败:', error.message);
  }
}

testMySQLVersion();