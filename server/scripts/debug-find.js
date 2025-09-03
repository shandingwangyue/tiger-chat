#!/usr/bin/env node
const { pool } = require('../config/database');
const Conversation = require('../models/Conversation');

async function debugFind() {
  console.log('🔍 调试 findByUserId 方法...\n');

  try {
    // 创建测试用户
    const User = require('../models/User');
    const timestamp = Date.now();
    const testUserId = await User.create(`debuguser_${timestamp}`, `debug_${timestamp}@example.com`, 'testpassword');
    console.log('✅ 测试用户创建成功，ID:', testUserId);

    // 创建测试对话
    const conversationId = await Conversation.create(testUserId, '调试对话');
    console.log('✅ 对话创建成功，ID:', conversationId);

    // 直接测试 findByUserId 方法
    console.log('\n🔍 直接测试 findByUserId 方法...');
    console.log('用户ID类型:', typeof testUserId, '值:', testUserId);
    
    const [rows] = await pool.execute(
      `SELECT id, user_id as userId, title, created_at as createdAt, updated_at as updatedAt 
       FROM conversations 
       WHERE user_id = ? 
       ORDER BY updated_at DESC 
       LIMIT ?`,
      [testUserId, 10]
    );
    
    console.log('✅ 直接SQL查询成功');
    console.log('返回行数:', rows.length);
    console.log('结果:', rows);

    // 测试模型方法
    console.log('\n🔍 测试 Conversation.findByUserId 方法...');
    const conversations = await Conversation.findByUserId(testUserId, 10);
    console.log('✅ 模型方法调用成功');
    console.log('返回对话:', conversations);

  } catch (error) {
    console.error('❌ 调试失败:', error.message);
    console.error('错误堆栈:', error.stack);
    
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

// 运行调试
debugFind().catch(console.error);