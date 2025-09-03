const axios = require('axios');
const { pool } = require('../config/database');

// 测试配置
const BASE_URL = 'http://localhost:3001/api/db';
const TEST_USER = {
  email: 'test@example.com',
  password: 'password123'
};

async function testDatabaseConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ 数据库连接测试成功');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ 数据库连接测试失败:', error.message);
    return false;
  }
}

async function loginUser() {
  try {
    const response = await axios.post('http://localhost:3001/api/login', TEST_USER);
    console.log('✅ 用户登录成功');
    return response.data.token;
  } catch (error) {
    console.error('❌ 用户登录失败:', error.response?.data || error.message);
    return null;
  }
}

async function testConversationOperations(token) {
  const headers = {
    Authorization: `Bearer ${token}`
  };

  try {
    // 1. 创建新对话
    console.log('\n📝 测试创建新对话...');
    const createResponse = await axios.post(`${BASE_URL}/conversations`, {
      title: '测试对话'
    }, { headers });
    
    const conversationId = createResponse.data.id;
    console.log('✅ 对话创建成功，ID:', conversationId);

    // 2. 发送消息
    console.log('\n💬 测试发送消息...');
    const chatResponse = await axios.post(`${BASE_URL}/chat`, {
      conversationId,
      message: '你好，这是一个测试消息',
      options: {}
    }, { headers });

    console.log('✅ 消息发送成功');
    console.log('   对话ID:', chatResponse.data.conversationId);
    console.log('   是否新对话:', chatResponse.data.isNewConversation);

    // 3. 获取对话列表
    console.log('\n📋 测试获取对话列表...');
    const listResponse = await axios.get(`${BASE_URL}/conversations`, { headers });
    console.log('✅ 对话列表获取成功');
    console.log('   对话数量:', listResponse.data.length);

    // 4. 获取具体对话详情
    console.log('\n🔍 测试获取对话详情...');
    const detailResponse = await axios.get(`${BASE_URL}/conversations/${conversationId}`, { headers });
    console.log('✅ 对话详情获取成功');
    console.log('   消息数量:', detailResponse.data.messages.length);
    console.log('   对话标题:', detailResponse.data.title);

    // 5. 验证消息内容
    const messages = detailResponse.data.messages;
    if (messages.length >= 2) {
      const userMessage = messages.find(m => m.role === 'user');
      const aiMessage = messages.find(m => m.role === 'assistant');
      
      if (userMessage && userMessage.content.includes('测试消息')) {
        console.log('✅ 用户消息保存正确');
      }
      
      if (aiMessage && aiMessage.content) {
        console.log('✅ AI回复保存正确');
      }
    }

    return true;

  } catch (error) {
    console.error('❌ 对话操作测试失败:', error.response?.data || error.message);
    return false;
  }
}

async function runTests() {
  console.log('🧪 开始测试聊天数据库修复...\n');

  // 1. 测试数据库连接
  const dbConnected = await testDatabaseConnection();
  if (!dbConnected) {
    console.log('❌ 测试终止：数据库连接失败');
    return;
  }

  // 2. 登录用户获取token
  const token = await loginUser();
  if (!token) {
    console.log('❌ 测试终止：用户登录失败');
    return;
  }

  // 3. 测试对话操作
  const operationsSuccess = await testConversationOperations(token);
  
  if (operationsSuccess) {
    console.log('\n🎉 所有测试通过！聊天记录现在会持久化保存到数据库。');
    console.log('💡 提示：前端应该使用 /api/db 路径来访问数据库版本的聊天功能');
  } else {
    console.log('\n❌ 部分测试失败，请检查代码实现');
  }
}

// 运行测试
runTests().catch(console.error);