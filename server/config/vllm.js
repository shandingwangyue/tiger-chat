const axios = require('axios');
const { PassThrough } = require('stream');

class vLLMAPI {
  constructor() {
    this.baseURL = process.env.VLLM_BASE_URL || 'http://localhost:8000/v1'; // vLLM 默认端口
    this.defaultModel = process.env.VLLM_DEFAULT_MODEL || 'gpt-3.5-turbo';
    
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 60000,
      headers: {
        'Accept': 'application/json',
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
        // 关键：返回 { data: stream } 以匹配 Ollama 结构
        const response = await this.client.post('/chat/completions', payload, {
          responseType: 'stream',
          headers: {
            'Accept': 'text/event-stream',
            'Cache-Control': 'no-cache'
          }
        });

        const transformedStream = new PassThrough();
        let buffer = '';

        response.data.on('data', (chunk) => {
          buffer += chunk.toString();
          const lines = buffer.split('\n');
          buffer = lines.pop(); // 处理可能的分块

          lines.forEach(line => {
            if (!line.trim() || line === 'data: [DONE]') return;
            try {
              const data = JSON.parse(line.replace('data: ', ''));
              if (data.choices?.[0]?.delta?.content) {
                // 转换为 Ollama 格式
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
              console.warn('解析 vLLM 末尾数据失败:', buffer);
            }
          }
          transformedStream.end();
        });

        return { data: transformedStream }; // 统一结构
      } else {
        // 非流式响应适配
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
      console.error('vLLM API 请求失败:', error.message);
      throw error;
    }
  }

  // 其他必要方法（如 getModels, healthCheck 等）
  async getModels() {
    try {
      const response = await this.client.get('/models');
      return response.data.data || [];
    } catch (error) {
      console.error('获取 vLLM 模型列表失败:', error.message);
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

module.exports = new vLLMAPI();