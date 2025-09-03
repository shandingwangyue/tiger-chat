#!/usr/bin/env node
const { pool } = require('../config/database');
const Conversation = require('../models/Conversation');

async function debugTest() {
  console.log('🔍 开始调试测试...\n');

  try {
    // 1. 测试数据库连接
    console.log('1. 测试数据库连接...');
    const connection = await pool.getConnection();
    console.log('✅ 数据库连接成功');
    connection.release();

    // 2. 检查 conversations 表结构
    console.log('\n2. 检查 conversations 表结构...');
    const [tableInfo] = await pool.execute('DESCRIBE conversations');
    console.log('conversations 表结构:');
    tableInfo.forEach(row => {
      console.log(`  ${row.Field}: ${row.Type} ${row.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${row.Default ? `DEFAULT ${row.Default}` : ''}`);
    });

    // 3. 创建测试用户
    console.log('\n3. 创建测试用户...');
    const User = require('../models/User');
    const testUserId = await User.create('testuser', 'test@example.com', 'testpassword');
    console.log('✅ 测试用户创建成功，ID:', testUserId);

    // 4. 测试创建对话
    console.log('\n4. 测试创建对话...');
    const conversationId = await Conversation.create(testUserId, '调试测试对话');
    console.log('✅ 对话创建成功，ID:', conversationId);

    // 4. 检查新创建的对话
    console.log('\n4. 检查新创建的对话...');
    const conversation = await Conversation.findById(conversationId);
    console.log('对话详情:', conversation);

    console.log('\n🎉 调试测试完成！');

  } catch (error) {
    console.error('❌ 调试测试失败:', error.message);
    console.error('错误堆栈:', error.stack);
    
    // 如果是MySQL错误，显示更多详细信息
    if (error.code) {
      console.error('错误代码:', error.code);
      console.error('SQL状态:', error.sqlState);
      console.error('SQL语句:', error.sql);
    }
    
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// 运行调试测试
debugTest().catch(console.error);