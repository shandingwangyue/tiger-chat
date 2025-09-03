const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

class ChatService {
  // 创建新对话并检查会话限制
  static async createConversation(userId, title = '新对话') {
    // 检查用户当前的对话数量
    const conversationCount = await Conversation.countByUserId(userId);
    
    // 如果超过10个对话，删除最旧的对话
    if (conversationCount >= 10) {
      await Conversation.deleteOldestConversation(userId);
    }
    
    // 创建新对话
    const conversationId = await Conversation.create(userId, title);
    return conversationId;
  }

  // 保存消息到数据库
  static async saveMessage(conversationId, role, content) {
    const messageId = await Message.create(conversationId, role, content);
    return messageId;
  }

  // 批量保存消息
  static async saveMessages(messages) {
    if (messages.length === 0) return 0;
    return await Message.createBatch(messages);
  }

  // 获取用户的所有对话（最近10个）
  static async getUserConversations(userId) {
    return await Conversation.findByUserId(userId, 10);
  }

  // 获取对话的所有消息
  static async getConversationMessages(conversationId) {
    return await Message.findByConversationId(conversationId);
  }

  // 获取完整的对话信息（包含消息）
  static async getFullConversation(conversationId) {
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) return null;

    const messages = await this.getConversationMessages(conversationId);
    return {
      ...conversation,
      messages
    };
  }

  // 更新对话标题
  static async updateConversationTitle(conversationId, title) {
    return await Conversation.updateTitle(conversationId, title);
  }

  // 删除对话（包括所有消息）
  static async deleteConversation(conversationId) {
    // 先删除所有消息
    await Message.deleteByConversationId(conversationId);
    // 再删除对话
    return await Conversation.delete(conversationId);
  }

  // 检查用户是否拥有该对话
  static async checkConversationOwnership(conversationId, userId) {
    return await Conversation.belongsToUser(conversationId, userId);
  }

  // 处理完整的聊天流程（创建对话、保存消息、检查限制）
  static async processChatMessage(userId, conversationId, userMessage, aiResponse) {
    let currentConversationId = conversationId;
    let isNewConversation = false;

    // 如果 conversationId 不存在，创建新对话
    if (!conversationId || conversationId === 'new') {
      const title = userMessage.slice(0, 30) + (userMessage.length > 30 ? '...' : '');
      currentConversationId = await this.createConversation(userId, title);
      isNewConversation = true;
    } else {
      // 检查用户是否拥有该对话
      const ownsConversation = await this.checkConversationOwnership(conversationId, userId);
      if (!ownsConversation) {
        throw new Error('无权访问此对话');
      }
    }

    // 保存用户消息
    await this.saveMessage(currentConversationId, 'user', userMessage);

    // 保存AI回复
    await this.saveMessage(currentConversationId, 'assistant', aiResponse);

    return {
      conversationId: currentConversationId,
      isNewConversation
    };
  }

  // 流式聊天消息处理
  static async processStreamMessage(userId, conversationId, userMessage, onTokenCallback) {
    let currentConversationId = conversationId;
    let isNewConversation = false;
    let fullResponse = '';

    // 如果 conversationId 不存在，创建新对话
    if (!conversationId || conversationId === 'new') {
      const title = userMessage.slice(0, 30) + (userMessage.length > 30 ? '...' : '');
      currentConversationId = await this.createConversation(userId, title);
      isNewConversation = true;
    } else {
      // 检查用户是否拥有该对话
      const ownsConversation = await this.checkConversationOwnership(conversationId, userId);
      if (!ownsConversation) {
        throw new Error('无权访问此对话');
      }
    }

    // 保存用户消息
    await this.saveMessage(currentConversationId, 'user', userMessage);

    // 返回一个对象，用于在流式响应完成后保存AI回复
    return {
      conversationId: currentConversationId,
      isNewConversation,
      saveAIResponse: async (responseContent) => {
        await this.saveMessage(currentConversationId, 'assistant', responseContent);
      }
    };
  }

  // 搜索用户的消息
  static async searchMessages(userId, query, limit = 10, offset = 0) {
    // 这里需要根据实际数据库结构实现搜索逻辑
    // 暂时返回空数组作为示例
    return [];
  }

  // 获取用户的所有消息（分页）
  static async getAllUserMessages(userId, limit = 50, offset = 0) {
    // 这里需要根据实际数据库结构实现获取逻辑
    // 暂时返回空数组作为示例
    return [];
  }
}

module.exports = ChatService;