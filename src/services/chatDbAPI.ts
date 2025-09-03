// src/services/chatDbAPI.ts
// 数据库存储版本的聊天API服务
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api/db';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 240000, // 增加到120秒
  headers: {
    'Content-Type': 'application/json',
  },
});

// 添加请求拦截器
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const chatDbAPI = {
  // 发送聊天消息（数据库版本）
  sendMessage: async (conversationId: string, message: string, options: any) => {
    const response = await api.post('/chat', {
      conversationId,
      message,
      options
    });
    if (response.status !== 200) {
      throw new Error(`Error: ${response.statusText}`);
    }
    return response.data;
  },

  // 流式发送消息（数据库版本）
  sendMessageStream: async (conversationId: string, message: string, options: any, onToken: (token: string) => void) => {
    try {
      console.log('开始发送流式请求（数据库版本）:', { conversationId, message });
      
      const response = await fetch(`${API_BASE_URL}/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify({
          conversationId,
          message,
          options
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (!response.body) {
        throw new Error('Response body is null');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.trim() && line.startsWith('data: ')) {
              try {
                const eventData = JSON.parse(line.slice(5));
                console.log('收到事件数据:', eventData);

                if (eventData.error) {
                  throw new Error(eventData.error);
                }

                if (eventData.type === 'token' && eventData.content) {
                  console.log('收到token:', eventData.content);
                  onToken(eventData.content);
                }

                // 处理新会话ID
                if (eventData.type === 'conversation' && eventData.id) {
                  console.log('收到新会话ID:', eventData.id);
                }
              } catch (e) {
                console.warn('解析事件数据失败:', e, '原始数据:', line);
              }
            }
          }
        }

        // 处理剩余的buffer
        if (buffer.trim() && buffer.startsWith('data: ')) {
          try {
            const eventData = JSON.parse(buffer.slice(5));
            if (eventData.type === 'token' && eventData.content) {
              onToken(eventData.content);
            }
          } catch (e) {
            console.warn('解析最后的事件数据失败:', e);
          }
        }
      } catch (e) {
        console.error('读取流数据失败:', e);
        throw e;
      }
    } catch (error) {
      console.error('流式请求失败:', error);
      throw error;
    }
  },
  
  // 获取对话列表（数据库版本）
  getConversations: async () => {
    const response = await api.get('/conversations');
    return response.data;
  },

  // 获取单个对话（数据库版本）
  getConversation: async (id: string) => {
    const response = await api.get(`/conversations/${id}`);
    return response.data;
  },

  // 创建新对话（数据库版本）
  createConversation: async (title: string) => {
    const response = await api.post('/conversations', { title });
    return response.data;
  },

  // 删除对话（数据库版本）
  deleteConversation: async (id: string) => {
    const response = await api.delete(`/conversations/${id}`);
    return response.data;
  },

  // 检查用户是否已认证
  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('token');
  },

  // 获取认证token
  getToken: (): string | null => {
    return localStorage.getItem('token');
  },

  // 搜索历史聊天记录
  searchHistory: async (query: string, limit: number = 10, offset: number = 0) => {
    const response = await api.get('/history/search', {
      params: { query, limit, offset }
    });
    return response.data;
  },

  // 获取所有历史消息（分页）
  getAllMessages: async (limit: number = 50, offset: number = 0) => {
    const response = await api.get('/history/messages', {
      params: { limit, offset }
    });
    return response.data;
  }
};

export default chatDbAPI;