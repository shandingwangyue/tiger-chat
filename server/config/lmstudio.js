const axios = require('axios');
const { PassThrough } = require('stream');

class LMStudioAPI {
  constructor() {
    this.baseURL = process.env.LMSTUDIO_BASE_URL || 'http://localhost:11234/v1';
    this.defaultModel = process.env.LMSTUDIO_DEFAULT_MODEL || 'google/gemma-3n-e4b';
    
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
        // 关键修改：返回一个包含 `data` 属性的对象，模仿 Ollama 的响应结构
        const response = await this.client.post('/chat/completions', payload, {
          responseType: 'stream',
          headers: {
            'Accept': 'text/event-stream',
            'Cache-Control': 'no-cache'
          }
        });

        // 创建一个 PassThrough 流来转换数据格式
        const transformedStream = new PassThrough();
        let buffer = '';

        response.data.on('data', (chunk) => {
          buffer += chunk.toString();
          const lines = buffer.split('\n');
          buffer = lines.pop(); // 剩余部分放回 buffer

          lines.forEach(line => {
            if (!line.trim()) return;
            try {
              const data = JSON.parse(line.replace('data: ', ''));
              if (data.choices?.[0]?.delta?.content) {
                // 转换为 Ollama 的格式：{ message: { content: "..." } }
                const ollamaFormat = JSON.stringify({
                  message: { role: 'assistant', content: data.choices[0].delta.content }
                });
                transformedStream.write(ollamaFormat + '\n');
              }
            } catch (err) {
              console.warn('解析 LMStudio 数据失败:', err.message);
            }
          });
        });

        response.data.on('end', () => {
          if (buffer.trim()) {
            try {
              const data = JSON.parse(buffer.replace('data: ', ''));
              if (data.choices?.[0]?.delta?.content) {
                const ollamaFormat = JSON.stringify({
                  message: { role: 'assistant', content: data.choices[0].delta.content }
                });
                transformedStream.write(ollamaFormat + '\n');
              }
            } catch (err) {
              console.warn('解析 LMStudio 末尾数据失败:', err.message);
            }
          }
          transformedStream.end();
        });

        // 返回与 Ollama 一致的结构：{ data: stream }
        return { data: transformedStream };
      } else {
        const response = await this.client.post('/chat/completions', payload);
        // 非流式响应也适配 Ollama 的格式
        return {
          message: {
            role: 'assistant',
            content: response.data.choices?.[0]?.message?.content || ''
          },
          response: response.data.choices?.[0]?.message?.content || ''
        };
      }
    } catch (error) {
      console.error('LMStudio API 请求失败:', error.message);
      throw error;
    }
  }

  // 其他方法保持不变...
}

module.exports = new LMStudioAPI();