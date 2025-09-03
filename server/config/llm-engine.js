const axios = require('axios');
const { PassThrough } = require('stream');

class LLMEAPI {
  constructor() {
    this.baseURL = process.env.LLME_BASE_URL || 'http://localhost:8000/api/v1'; // vLLM 默认端口
    this.defaultModel = process.env.LLME_DEFAULT_MODEL || 'gpt-3.5-turbo';
    
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 60000,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
  }
  format_qwen_chat(messages) {
    
   /* 将消息列表转换为Qwen对话格式
    
    Args:
        messages: 消息列表，每个消息包含role和content
        
    Returns:
        str: 格式化后的Qwen对话文本
    */
    const formatted = "";
    for(const msg of messages) {
        role = msg.get('role', '');
        content = msg.get('content', '');
        
        if (role == 'system'){
            formatted += "<|im_start|>system\n{content}<|im_end|>\n";
        }
        else if (role == 'user'){
            formatted += "<|im_start|>user\n{content}<|im_end|>\n";
        }
        else if (role == 'assistant'){
            formatted += "<|im_start|>assistant\n{content}<|im_end|>\n" ;  
        }
           
        else if(role == 'assistant'){
            formatted += "<|im_start|>assistant\n{content}<|im_end|>\n";
        }
      else{
            formatted += "<|im_start|>user\n{content}<|im_end|>\n";
        }
        
      }
    //添加助手开始标记
    formatted += "<|im_start|>assistant\n";
    return formatted;
  }

  format_gemma_chat(messages) {
    /*
    将消息列表转换为Gemma对话格式
    
    Args:
        messages: 消息列表，每个消息包含role和content
        
    Returns:
        str: 格式化后的Gemma对话文本
    */
    const conversation = [];
    for( const msg of messages) {
        role = msg.get('role', '');
        content = msg.get('content', '');
        
        if (role == 'system'){
            conversation.append("<start_of_turn>system\n{content}<end_of_turn>");
        }
        else if (role == 'user'){
            conversation.append("<start_of_turn>user\n{content}<end_of_turn>");
        }
        else if(role == 'assistant'){
            conversation.append("<start_of_turn>model\n{content}<end_of_turn>");
        }
        else{
            // 未知角色，默认作为用户消息处理
            conversation.append("<start_of_turn>user\n{content}<end_of_turn>");
        }
      }
    // 添加模型开始标记
    conversation.append("<start_of_turn>model\n");
    return "\n".join(conversation);
  }


  format_llama_chat(messages) {
    /*
    将消息列表转换为LLaMA对话格式
    
    Args:
        messages: 消息列表，每个消息包含role和content
        
    Returns:
        str: 格式化后的LLaMA对话文本
    */
    const formatted = "";
    for (msg in messages){  
        role = msg.get('role', '');
        content = msg.get('content', '');
        
        if( role == 'system'){
            formatted += "<s>[INST] <<SYS>>\n{content}\n<</SYS>>\n\n";
        }
        else if(role == 'user'){
            formatted += "{content} [/INST] ";
        }
        else if (role == 'assistant'){
            formatted += "{content}</s>";
        }
        else{
            formatted += "{content} "
        }
    
      }
    return formatted;
  }


  async generateChat(messages, options = {}) {
   const { stream = false } = options;
   const prompt = "";
   if(this.defaultModel.startsWith('qwen')){
         prompt = this.format_qwen_chat(messages);
    }
    else if(this.defaultModel.startsWith('gemma')){ 
          prompt = this.format_gemma_chat(messages);
    }
    else{
          prompt = this.format_llama_chat(messages);
    } 
    const payload = {
      prompt: prompt,
     
      model: options.model || this.defaultModel,
      stream: options.stream || false,
      temperature: options.temperature,
      max_tokens: options.max_tokens
    };

    try {
      if (stream) {
        // 关键：返回 { data: stream } 以匹配 Ollama 结构
        const response = await this.client.post('/generate/stream', payload, {
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
              if (data.token && !data.finished) {
                // 转换为 Ollama 格式
                transformedStream.write(JSON.stringify({
                  message: { role: 'assistant', content: data.token }
                }) + '\n');
              }
            } catch (err) {
              console.warn('解析 LLME 数据失败:', line, err.message);
            }
          });
        });

        response.data.on('end', () => {
          if (buffer.trim()) {
            try {
              const data = JSON.parse(buffer.replace('data: ', ''));
              if (data.token && !data.finished) {
                transformedStream.write(JSON.stringify({
                  message: { role: 'assistant', content: data.token }
                }) + '\n');
              }
            } catch (err) {
              console.warn('解析 LLME 末尾数据失败:', buffer);
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
      console.error('LLME API 请求失败:', error.message);
      throw error;
    }
  }

  // 其他必要方法（如 getModels, healthCheck 等）
  async getModels() {
    try {
      const response = await this.client.get('/models');
      return response.data.data || [];
    } catch (error) {
      console.error('获取 LLME 模型列表失败:', error.message);
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

module.exports = new LLMEAPI();