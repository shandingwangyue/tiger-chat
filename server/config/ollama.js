const axios = require('axios');

class OllamaAPI {
  constructor() {
    this.baseURL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
    this.defaultModel = process.env.OLLAMA_DEFAULT_MODEL || 'gemma3:4b';
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 240000, // 增加到120秒超时
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  // 获取可用模型列表
  async getModels() {
    try {
      const response = await this.client.get('/api/tags');
      return response.data.models || [];
    } catch (error) {
      console.error('获取模型列表失败:', error.message);
      throw new Error('无法获取模型列表');
    }
  }

  // 延迟函数
  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // 生成聊天回复
  async generateChat(messages, options = {}, retryCount = 3) {
    try {
      if (!Array.isArray(messages)) {
        throw new Error('messages 参数必须是数组');
      }

      const {
        model = this.defaultModel,
        temperature = 0.7,
        top_p = 0.9,
        top_k = 40,
        repeat_penalty = 1.1,
        max_tokens = 2048,
        stream = false
      } = options;

      const payload = {
        model,
        messages: messages.map(msg => ({
          role: msg.role || 'user',
          content: msg.content
        })),
        options: {
          temperature,
          top_p,
          top_k,
          repeat_penalty,
          num_predict: max_tokens
        },
        stream
      };

      console.log('【OllamaAPI.generateChat】请求参数:', JSON.stringify(payload, null, 2));

      if (stream) {
        try {
          console.log('发送流式请求到Ollama:', {
            url: '/api/chat',
            payload
          });
          
          const response = await this.client.post('/api/chat', {
            ...payload,
            stream: true // 确保设置stream参数
          }, {
            responseType: 'stream',
            headers: {
              'Accept': 'text/event-stream',
              'Cache-Control': 'no-cache'
            }
          });
          console.log('【OllamaAPI.generateChat】收到流式响应对象:', !!response.data);
          return response;
        } catch (err) {
          console.error('【OllamaAPI.generateChat】流式请求异常:', err?.response?.data || err);
          throw err;
        }
      } else {
        try {
          const response = await this.client.post('/api/chat', payload);
          console.log('【OllamaAPI.generateChat】收到 Ollama 的原始响应:', response.data);

          // 适配响应格式
          const adaptedResponse = {
            message: {
              role: 'assistant',
              content: response.data.message?.content || response.data.response || ''
            },
            response: response.data.message?.content || response.data.response || ''
          };

          console.log('【OllamaAPI.generateChat】处理后的响应:', adaptedResponse);
          return adaptedResponse;
        } catch (err) {
          console.error('【OllamaAPI.generateChat】非流式请求异常:', err?.response?.data || err);
          throw err;
        }
      }
    } catch (error) {
      console.error('生成聊天回复失败:', error.message, error);
      throw new Error('无法生成回复');
    }
  }

  // 生成文本
  async generateText(prompt, options = {}) {
    try {
      const {
        model = this.defaultModel,
        temperature = 0.7,
        top_p = 0.9,
        top_k = 40,
        repeat_penalty = 1.1,
        max_tokens = 2048,
        stream = true
      } = options;

      const payload = {
        model,
        prompt,
        options: {
          temperature,
          top_p,
          top_k,
          repeat_penalty,
          num_predict: max_tokens
        },
        stream
      };

      if (stream) {
        return this.client.post('/api/generate', payload, {
          responseType: 'stream'
        });
      } else {
        const response = await this.client.post('/api/generate', payload);
        return response.data;
      }
    } catch (error) {
      console.error('生成文本失败:', error.message);
      throw new Error('无法生成文本');
    }
  }

  // 嵌入文本
  async embedText(text, model = this.defaultModel) {
    try {
      const payload = {
        model,
        prompt: text
      };

      const response = await this.client.post('/api/embeddings', payload);
      return response.data.embedding;
    } catch (error) {
      console.error('文本嵌入失败:', error.message);
      throw new Error('无法生成文本嵌入');
    }
  }

  // 检查模型是否可用
  async checkModel(model = this.defaultModel) {
    try {
      const models = await this.getModels();
      return models.some(m => m.name === model);
    } catch (error) {
      console.error('检查模型失败:', error.message);
      return false;
    }
  }

  // 拉取模型
  async pullModel(model) {
    try {
      const response = await this.client.post('/api/pull', { name: model });
      return response.data;
    } catch (error) {
      console.error('拉取模型失败:', error.message);
      throw new Error(`无法拉取模型: ${model}`);
    }
  }

  // 删除模型
  async deleteModel(model) {
    try {
      const response = await this.client.delete('/api/delete', { 
        data: { name: model } 
      });
      return response.data;
    } catch (error) {
      console.error('删除模型失败:', error.message);
      throw new Error(`无法删除模型: ${model}`);
    }
  }
}

module.exports = new OllamaAPI();