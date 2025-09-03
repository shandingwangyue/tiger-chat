//npm install openai
const axios = require('axios');
const { PassThrough } = require('stream');

class openaiAPI {
  constructor() {
    this.baseURL = process.env.OPENAI_BASE_URL || 'https://api.deepseek.com/v1';
    this.defaultModel = process.env.OPENAI_DEFAULT_MODEL || 'deepseek-chat';
    this.apiKey = process.env.OPENAI_API_KEY || '';
   
    if (!this.apiKey) {
      console.error('警告: OPENAI_API_KEY 环境变量未设置');
    }

    this.client = axios.create({
          baseURL: this.baseURL,
          timeout: 60000,
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
    });
  }

  async generateChat(messages, options = {}) {
    const { stream = false } = options;

    const payload = {
      messages,
      model: options.model || this.defaultModel,
      stream,
      temperature: options.temperature,
      top_p: options.top_p,
      max_tokens: options.max_tokens
    };

    try {
      if (stream) {
        const response = await this.client.post('/chat/completions', payload, {
          responseType: 'stream',
          headers: {
            'Accept': 'text/event-stream',
            'Authorization': `Bearer ${this.apiKey}`
          }
        });

        const transformedStream = new PassThrough();
        let buffer = '';

        response.data.on('data', (chunk) => {
          buffer += chunk.toString();
          const lines = buffer.split('\n');
          buffer = lines.pop();

          lines.forEach(line => {
            if (!line.trim() || line === 'data: [DONE]') return;
            try {
              const data = JSON.parse(line.replace('data: ', ''));
              if (data.choices[0]?.delta?.content) {
                transformedStream.write(JSON.stringify({
                  message: { role: 'assistant', content: data.choices[0].delta.content }
                }) + '\n');
              }
            } catch (err) {
              console.warn('解析 vLLM 数据失败:', line, err.message);
            }
          });
        });

        response.data.on('end', () => {
          if (buffer.trim()) {
            try {
              const data = JSON.parse(buffer.replace('data: ', ''));
              if (data.choices?.[0]?.delta?.content) {
                transformedStream.write(JSON.stringify({
                  message: { role: 'assistant', content: data.choices[0].delta.content }
                }) + '\n');
              }
            } catch (err) {
              console.warn('解析 openai 末尾数据失败:', buffer);
            }
          }
          transformedStream.end();
        });

        return { data: transformedStream };
      } else {
        const response = await this.client.post('/chat/completions', payload);
        return {
          message: {
            role: 'assistant',
            content: response.data.choices?.[0]?.message?.content || ''
          },
          response: response.data.choices?.[0]?.message?.content || ''
        };
      }
    } catch (error) {
      console.error('openai API 请求失败:', error.message);
      if (error.response?.status === 401) {
        console.error('认证失败，请检查 OPENAI_API_KEY 是否正确设置');
      }
      throw error;
    }
  }

  async getModels() {
    try {
      const response = await this.client.get('/models');
      return response.data.data || [];
    } catch (error) {
      console.error('获取 openai 模型列表失败:', error.message);
      return [];
    }
  }

  async healthCheck() {
    try {
      await this.client.get('/health');
      return true;
    } catch (error) {
      return false;
    }
  }
}

module.exports = new openaiAPI();
