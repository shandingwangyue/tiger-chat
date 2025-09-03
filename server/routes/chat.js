const express = require('express');
const router = express.Router();
const aiService = require('../config/aiService');
const { v4: uuidv4 } = require('uuid');
const ChatService = require('../services/chatService');

// 不再使用内存存储，改为使用数据库

// 获取对话列表
router.get('/conversations', async (req, res) => {
  try {
    // 从认证中间件获取用户ID
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: '用户未认证' });
    }
    
    const conversationList = await ChatService.getUserConversations(userId);
    res.json(conversationList);
  } catch (error) {
    console.error('获取对话列表失败:', error);
    res.status(500).json({ error: '获取对话列表失败' });
  }
});

// 获取单个对话
router.get('/conversations/:id', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: '用户未认证' });
    }
    
    // 检查用户是否拥有该对话
    const ownsConversation = await ChatService.checkConversationOwnership(req.params.id, userId);
    if (!ownsConversation) {
      return res.status(404).json({ error: '对话不存在或无权访问' });
    }
    
    const conversation = await ChatService.getFullConversation(req.params.id);
    if (!conversation) {
      return res.status(404).json({ error: '对话不存在' });
    }
    res.json(conversation);
  } catch (error) {
    console.error('获取对话失败:', error);
    res.status(500).json({ error: '获取对话失败' });
  }
});

// 创建新对话
router.post('/conversations', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: '用户未认证' });
    }
    
    const { title = '新对话' } = req.body;
    const conversationId = await ChatService.createConversation(userId, title);
    
    res.status(201).json({
      id: conversationId,
      title,
      createdAt: new Date(),
      messages: []
    });
  } catch (error) {
    console.error('创建对话失败:', error);
    res.status(500).json({ error: '创建对话失败' });
  }
});

// 删除对话
router.delete('/conversations/:id', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: '用户未认证' });
    }
    
    // 检查用户是否拥有该对话
    const ownsConversation = await ChatService.checkConversationOwnership(req.params.id, userId);
    if (!ownsConversation) {
      return res.status(404).json({ error: '对话不存在或无权访问' });
    }
    
    const deleted = await ChatService.deleteConversation(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: '对话不存在' });
    }
    res.json({ message: '对话已删除' });
  } catch (error) {
    console.error('删除对话失败:', error);
    res.status(500).json({ error: '删除对话失败' });
  }
});

// 处理聊天消息
router.post('/chat', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: '用户未认证' });
    }
    
    const { conversationId, message, options = {} } = req.body;
    console.log('收到聊天请求:', { userId, conversationId, message });
    
    if (!message || !message.trim()) {
      return res.status(400).json({ error: '消息内容不能为空' });
    }

    // 准备发送给 Ollama 的消息历史
    let messageHistory = [];
    if (conversationId && conversationId !== 'new') {
      // 获取现有对话的消息
      const conversation = await ChatService.getFullConversation(conversationId);
      if (conversation) {
        messageHistory = conversation.messages.map(msg => ({
          role: msg.role,
          content: msg.content
        }));
      }
    }

    // 添加当前用户消息到历史
    messageHistory.push({ role: 'user', content: message });

    // 调用 AI 服务获取回复
    const aiResponse = await aiService.generateChat(messageHistory, options);

    // 使用 ChatService 处理完整的聊天流程
    const result = await ChatService.processChatMessage(
      userId,
      conversationId,
      message,
      aiResponse.response
    );

    // 返回响应
    res.json({
      conversationId: result.conversationId,
      isNewConversation: result.isNewConversation,
      userMessage: {
        role: 'user',
        content: message,
        timestamp: new Date()
      },
      aiMessage: {
        role: 'assistant',
        content: aiResponse.response,
        timestamp: new Date()
      }
    });

  } catch (error) {
    console.error('处理聊天消息失败:', error);
    res.status(500).json({ error: '处理聊天消息失败' });
  }
});

// 流式聊天（Server-Sent Events）
router.post('/chat/stream', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: '用户未认证' });
    }
    
    const { conversationId, message, options = {} } = req.body;
    
    if (!message || !message.trim()) {
      return res.status(400).json({ error: '消息内容不能为空' });
    }

    // 设置SSE头部
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Accept, Cache-Control, Connection',
      'Access-Control-Allow-Credentials': 'true'
    });

    console.log('开始处理流式消息:', { userId, conversationId, message });

    // 准备发送给 Ollama 的消息历史
    let messageHistory = [];
    if (conversationId && conversationId !== 'new') {
      // 检查用户是否拥有该对话
      const ownsConversation = await ChatService.checkConversationOwnership(conversationId, userId);
      if (!ownsConversation) {
        res.write(`data: ${JSON.stringify({ error: '对话不存在或无权访问' })}\n\n`);
        return res.end();
      }
      
      // 获取现有对话的消息
      const conversation = await ChatService.getFullConversation(conversationId);
      if (conversation) {
        messageHistory = conversation.messages.map(msg => ({
          role: msg.role,
          content: msg.content
        }));
      }
    }

    // 添加当前用户消息到历史
    messageHistory.push({ role: 'user', content: message });

    // 使用 ChatService 处理流式消息（先保存用户消息）
    const streamResult = await ChatService.processStreamMessage(
      userId,
      conversationId,
      message,
      (token) => {
        // 发送token到客户端
        const eventData = JSON.stringify({
          type: 'token',
          content: token
        });
        res.write(`data: ${eventData}\n\n`);
        
        // 确保立即发送数据
        if (typeof res.flush === 'function') {
          res.flush();
        }
      }
    );

    // 如果是新对话，发送对话ID
    if (streamResult.isNewConversation) {
      res.write(`data: ${JSON.stringify({ type: 'conversation', id: streamResult.conversationId })}\n\n`);
    }

    console.log('调用Ollama API...');
    
    try {
      // 使用流式API
      const stream = await aiService.generateChat(messageHistory, { ...options, stream: true });
      let fullResponse = '';
      
      res.write(`data: ${JSON.stringify({ type: 'start' })}\n\n`);

      // 处理数据流
      stream.data.on('data', chunk => {
        try {
          const text = chunk.toString();
          const lines = text.split('\n');
          
          for (const line of lines) {
            if (!line.trim()) continue;
            try {
              const data = JSON.parse(line);
              
              // 处理消息内容
              if (data.message && data.message.content) {
                const token = data.message.content;
                fullResponse += token;
                const eventData = JSON.stringify({
                  type: 'token',
                  content: token
                });
                res.write(`data: ${eventData}\n\n`);
                
                // 确保立即发送数据
                if (typeof res.flush === 'function') {
                  res.flush();
                }
              }
              // 处理增量响应
              else if ('response' in data) {
                const token = data.response;
                if (token !== undefined && token !== null) {
                  fullResponse += token;
                  const eventData = JSON.stringify({
                    type: 'token',
                    content: token
                  });
                  res.write(`data: ${eventData}\n\n`);
                  
                  // 确保立即发送数据
                  if (typeof res.flush === 'function') {
                    res.flush();
                  }
                }
              }
            } catch (e) {
              console.warn('无法解析行:', line, e);
            }
          }
        } catch (e) {
          console.error('处理数据块错误:', e);
        }
      });

      stream.data.on('end', async () => {
        console.log('流式响应完成，总响应:', fullResponse);

        // 保存AI回复到数据库
        try {
          await streamResult.saveAIResponse(fullResponse);
          res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
        } catch (saveError) {
          console.error('保存AI回复失败:', saveError);
          res.write(`data: ${JSON.stringify({ error: '保存回复失败' })}\n\n`);
        }
        res.end();
      });

    } catch (streamError) {
      console.error('Ollama API 流式处理错误:', streamError);
      res.write(`data: ${JSON.stringify({ error: '生成回复失败' })}\n\n`);
      res.end();
    }

  } catch (error) {
    console.error('流式聊天处理错误:', error);
    res.write(`data: ${JSON.stringify({ error: '处理请求失败' })}\n\n`);
    res.end();
  }
});

module.exports = router;