#!/usr/bin/env node
const { pool } = require('../config/database');
const ChatService = require('../services/chatService');
const User = require('../models/User');

async function testDatabaseChat() {
  console.log('🚀 开始测试数据库聊天功能...\n');

  try {
    // 1. 创建测试用户（使用唯一用户名）
    console.log('1. 创建测试用户...');
    const timestamp = Date.now();
    const testUserId = await User.create(`testuser_${timestamp}`, `test_${timestamp}@example.com`, 'testpassword');
    console.log('✅ 测试用户创建成功，ID:', testUserId);

    // 2. 测试创建对话
    console.log('\n2. 测试创建对话...');
    const conversationId = await ChatService.createConversation(testUserId, '测试对话');
    console.log('✅ 对话创建成功，ID:', conversationId);

    // 3. 测试保存消息
    console.log('\n3. 测试保存消息...');
    const userMessageId = await ChatService.saveMessage(conversationId, 'user', '你好，这是一个测试消息');
    const aiMessageId = await ChatService.saveMessage(conversationId, 'assistant', '你好！这是一个测试回复');
    console.log('✅ 消息保存成功，用户消息ID:', userMessageId, 'AI消息ID:', aiMessageId);

    // 4. 测试获取对话列表
    console.log('\n4. 测试获取对话列表...');
    const conversations = await ChatService.getUserConversations(testUserId);
    console.log('✅ 获取对话列表成功，数量:', conversations.length);
    console.log('对话列表:', conversations);

    // 5. 测试获取完整对话
    console.log('\n5. 测试获取完整对话...');
    const fullConversation = await ChatService.getFullConversation(conversationId);
    console.log('✅ 获取完整对话成功');
    console.log('对话标题:', fullConversation.title);
    console.log('消息数量:', fullConversation.messages.length);

    // 6. 测试会话限制功能
    console.log('\n6. 测试会话限制功能...');
    // 创建多个对话来测试限制
    for (let i = 0; i < 12; i++) {
      await ChatService.createConversation(testUserId, `测试对话 ${i + 1}`);
    }
    
    const limitedConversations = await ChatService.getUserConversations(testUserId);
    console.log('✅ 会话限制测试完成');
    console.log('当前对话数量 (应该为10):', limitedConversations.length);
    
    if (limitedConversations.length === 10) {
      console.log('✅ 会话限制功能正常工作');
    } else {
      console.log('❌ 会话限制功能异常');
    }

    // 7. 测试对话所有权检查
    console.log('\n7. 测试对话所有权检查...');
    const ownsConversation = await ChatService.checkConversationOwnership(conversationId, testUserId);
    console.log('✅ 所有权检查完成');
    console.log('用户拥有该对话:', ownsConversation);

    // 8. 测试删除对话
    console.log('\n8. 测试删除对话...');
    const deleted = await ChatService.deleteConversation(conversationId);
    console.log('✅ 删除对话完成');
    console.log('删除成功:', deleted);

    // 9. 清理测试用户
    console.log('\n9. 清理测试数据...');
    await pool.execute('DELETE FROM users WHERE id = ?', [testUserId]);
    console.log('✅ 测试数据清理完成');

    console.log('\n🎉 所有测试完成！数据库聊天功能正常工作');

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// 运行测试
testDatabaseChat().catch(console.error);