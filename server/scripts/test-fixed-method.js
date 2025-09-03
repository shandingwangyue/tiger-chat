const Conversation = require('../models/Conversation');

async function testFixedMethod() {
  try {
    console.log('🔍 测试修复后的findByUserId方法...');
    
    // 先创建测试数据
    const { pool } = require('../config/database');
    await pool.execute(
      'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
      ['test_fixed', 'test_fixed@example.com', 'hashedpassword']
    );
    
    const [users] = await pool.execute('SELECT id FROM users WHERE username = ?', ['test_fixed']);
    const userId = users[0].id;
    console.log(`✅ 测试用户创建成功，ID: ${userId}`);
    
    // 创建测试对话
    await Conversation.create(userId, '修复方法测试对话');
    console.log('✅ 测试对话创建成功');
    
    // 测试修复后的方法
    console.log('\n测试findByUserId方法...');
    const conversations = await Conversation.findByUserId(userId, 10);
    console.log(`✅ 方法调用成功: 找到 ${conversations.length} 个对话`);
    
    if (conversations.length > 0) {
      console.log('对话详情:', conversations[0]);
    }
    
    console.log('✅ 修复方法测试完成！');
    
  } catch (error) {
    console.error('❌ 修复方法测试失败:');
    console.error('错误消息:', error.message);
    console.error('错误堆栈:', error.stack);
    if (error.code) console.error('错误代码:', error.code);
    if (error.sqlState) console.error('SQL状态:', error.sqlState);
  }
}

testFixedMethod();