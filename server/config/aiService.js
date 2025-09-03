const ollamaAPI = require('./ollama');
const lmstudioAPI = require('./lmstudio');
const vllmAPI = require('./vllm');
const llmeAPI = require('./llm-engine');
const openaiAPI = require('./openai');
class AIService {
  constructor() {
    this.currentService = process.env.AI_SERVICE || 'ollama';
    this.services = {
      ollama: ollamaAPI,
      lmstudio: lmstudioAPI,
      vllm: vllmAPI,
      llme: llmeAPI,
      openai: openaiAPI

    };
  }

  getService() {
    const service = this.services[this.currentService];
    if (!service) {
      throw new Error(`AI服务 ${this.currentService} 不可用`);
    }
    return service;
  }

  async checkService() {
    try {
      const service = this.getService();
      return await service.checkHealth();
    } catch (error) {
      console.error('AI服务检查失败:', error);
      return false;
    }
  }

  // 代理所有API方法
  async generateChat(messages, options) {
    const service = this.getService();
    return service.generateChat(messages, options);
  }

  async getModels() {
    const service = this.getService();
    return service.getModels();
  }
}

module.exports = new AIService();
