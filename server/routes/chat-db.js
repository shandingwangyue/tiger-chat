const express = require('express');
const router = express.Router();
const aiService = require('../config/aiService');
const { v4: uuidv4 } = require('uuid');
const { authenticateToken } = require('../middleware/auth');
const ChatService = require('../services/chatService');

// 获取对话列表（需要认证）
router.get('/conversations', authenticateToken, async (req, res) => {
  try {
    const conversations = await ChatService.getUserConversations(req.user.id);
    res.json(conversations);
  } catch (error) {
    console.error('获取对话列表失败:', error);
    res.status(500).json({ error: '获取对话列表失败' });
  }
});

// 获取单个对话（需要认证）
router.get('/conversations/:id', authenticateToken, async (req, res) => {
  try {
    // 检查用户是否拥有该对话
    const ownsConversation = await ChatService.checkConversationOwnership(req.params.id, req.user.id);
    if (!ownsConversation) {
      return res.status(403).json({ error: '无权访问此对话' });
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

// 创建新对话（需要认证）
router.post('/conversations', authenticateToken, async (req, res) => {
  try {
    const { title = '新对话' } = req.body;
    const conversationId = await ChatService.createConversation(req.user.id, title);
    
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

// 删除对话（需要认证）
router.delete('/conversations/:id', authenticateToken, async (req, res) => {
  try {
    // 检查用户是否拥有该对话
    const ownsConversation = await ChatService.checkConversationOwnership(req.params.id, req.user.id);
    if (!ownsConversation) {
      return res.status(403).json({ error: '无权删除此对话' });
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

// 搜索历史聊天记录（需要认证）
router.get('/history/search', authenticateToken, async (req, res) => {
  try {
    const { query, limit = 10, offset = 0 } = req.query;
    
    if (!query || !query.trim()) {
      return res.status(400).json({ error: '搜索关键词不能为空' });
    }

    // 实现搜索逻辑 - 这里需要根据实际数据库结构实现
    const searchResults = await ChatService.searchMessages(req.user.id, query, parseInt(limit), parseInt(offset));
    res.json(searchResults);
  } catch (error) {
    console.error('搜索历史记录失败:', error);
    res.status(500).json({ error: '搜索历史记录失败' });
  }
});

// 获取所有历史消息（分页，需要认证）
router.get('/history/messages', authenticateToken, async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    
    const messages = await ChatService.getAllUserMessages(req.user.id, parseInt(limit), parseInt(offset));
    res.json(messages);
  } catch (error) {
    console.error('获取历史消息失败:', error);
    res.status(500).json({ error: '获取历史消息失败' });
  }
});

// 处理聊天消息（需要认证）
router.post('/chat', authenticateToken, async (req, res) => {
  try {
    const { conversationId, message, options = {} } = req.body;
    console.log('收到聊天请求:', { userId: req.user.id, conversationId, message });
    
    if (!message || !message.trim()) {
      return res.status(400).json({ error: '消息内容不能为空' });
    }

    // 准备发送给 Ollama 的消息历史
    let messageHistory = [];
    if (conversationId && conversationId !== 'new') {
      // 检查用户是否拥有该对话
      const ownsConversation = await ChatService.checkConversationOwnership(conversationId, req.user.id);
      if (!ownsConversation) {
        return res.status(403).json({ error: '无权访问此对话' });
      }
      
      // 获取历史消息
      const messages = await ChatService.getConversationMessages(conversationId);
      messageHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));
    }

    // 添加当前用户消息到历史
    messageHistory.push({ role: 'user', content: message });

    // 调用 AI 服务获取回复
    const aiResponse = await aiService.generateChat(messageHistory, options);

    // 处理消息存储
    const result = await ChatService.processChatMessage(
      req.user.id,
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

// 流式聊天（Server-Sent Events，需要认证）
router.post('/chat/stream', authenticateToken, async (req, res) => {
  try {
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

    console.log('开始处理流式消息:', { userId: req.user.id, conversationId, message });

    // 准备发送给 Ollama 的消息历史
    let messageHistory = [];
    if (conversationId && conversationId !== 'new') {
      // 检查用户是否拥有该对话
      const ownsConversation = await ChatService.checkConversationOwnership(conversationId, req.user.id);
      if (!ownsConversation) {
        res.write(`data: ${JSON.stringify({ error: '无权访问此对话' })}\n\n`);
        return res.end();
      }
      
      // 获取历史消息
      const messages = await ChatService.getConversationMessages(conversationId);
      messageHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));
    }

    // 添加当前用户消息到历史
    messageHistory.push({ role: 'user', content: message });

    // 处理消息存储
    const chatResult = await ChatService.processStreamMessage(
      req.user.id,
      conversationId,
      message
    );

    // 立即发送新会话ID（如果是新对话）
    if (chatResult.isNewConversation) {
      res.write(`data: ${JSON.stringify({ type: 'conversation', id: chatResult.conversationId })}\n\n`);
    }

    console.log('调用Tiger Chat API...');
    
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

        // 保存完整的AI回复到数据库
        try {
          await chatResult.saveAIResponse(fullResponse);
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