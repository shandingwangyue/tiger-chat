const mysql = require('mysql2/promise');
require('dotenv').config();

async function testConnection() {
  try {
    console.log('🔍 测试MySQL连接...');
    
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'ollama_chat',
      port: process.env.DB_PORT || 3306
    });
    
    console.log('✅ MySQL连接成功');
    
    // 测试简单查询
    const [result] = await connection.execute('SELECT 1 + 1 as result');
    console.log('简单查询结果:', result[0].result);
    
    // 测试表查询
    const [tables] = await connection.execute('SHOW TABLES');
    console.log('数据库表:', tables);
    
    await connection.end();
    console.log('✅ 连接测试完成');
    
  } catch (error) {
    console.error('❌ MySQL连接失败:', error.message);
    console.error('错误代码:', error.code);
    console.error('错误堆栈:', error.stack);
  }
}

testConnection();