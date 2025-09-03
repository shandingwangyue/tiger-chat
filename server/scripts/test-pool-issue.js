const mysql = require('mysql2/promise');
require('dotenv').config();

async function testPoolIssue() {
  try {
    console.log('🔍 测试连接池问题...');
    
    // 创建新的连接（不使用连接池）
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'ollama_chat',
      port: process.env.DB_PORT || 3306
    });
    
    console.log('✅ 直接连接成功');
    
    // 测试LIMIT参数
    console.log('测试LIMIT参数...');
    const [result] = await connection.execute(
      'SELECT * FROM conversations LIMIT ?',
      [5]
    );
    console.log(`✅ 直接连接LIMIT成功: ${result.length} 个对话`);
    
    await connection.end();
    
    // 现在测试连接池
    console.log('\n测试连接池...');
    const pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'ollama_chat',
      port: process.env.DB_PORT || 3306,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
    
    try {
      const [result2] = await pool.execute(
        'SELECT * FROM conversations LIMIT ?',
        [5]
      );
      console.log(`✅ 连接池LIMIT成功: ${result2.length} 个对话`);
    } catch (error) {
      console.error('❌ 连接池LIMIT失败:', error.message);
      console.error('错误代码:', error.code);
    }
    
    await pool.end();
    
  } catch (error) {
    console.error('测试失败:', error.message);
  }
}

testPoolIssue();