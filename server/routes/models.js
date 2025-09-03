const express = require('express');
const router = express.Router();
const ollamaAPI = require('../config/ollama');

// 获取所有可用模型
router.get('/models', async (req, res) => {
  try {
    const models = await ollamaAPI.getModels();
    res.json(models);
  } catch (error) {
    console.error('获取模型列表失败:', error);
    res.status(500).json({ error: '获取模型列表失败' });
  }
});

// 检查模型是否可用
router.get('/models/:name/check', async (req, res) => {
  try {
    const { name } = req.params;
    const isAvailable = await ollamaAPI.checkModel(name);
    res.json({ 
      name, 
      available: isAvailable 
    });
  } catch (error) {
    console.error('检查模型失败:', error);
    res.status(500).json({ error: '检查模型失败' });
  }
});

// 拉取模型
router.post('/models/pull', async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: '模型名称不能为空' });
    }

    // 设置响应头以支持流式响应
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    });

    try {
      const response = await ollamaAPI.pullModel(name);
      
      // 发送拉取结果
      res.write(`data: ${JSON.stringify({ 
        type: 'success', 
        message: `模型 ${name} 拉取成功`,
        model: name 
      })}\n\n`);
      
      res.end();
    } catch (pullError) {
      res.write(`data: ${JSON.stringify({ 
        type: 'error', 
        message: pullError.message 
      })}\n\n`);
      res.end();
    }
  } catch (error) {
    console.error('拉取模型失败:', error);
    res.status(500).json({ error: '拉取模型失败' });
  }
});

// 删除模型
router.delete('/models/:name', async (req, res) => {
  try {
    const { name } = req.params;
    
    if (!name) {
      return res.status(400).json({ error: '模型名称不能为空' });
    }

    await ollamaAPI.deleteModel(name);
    res.json({ 
      message: `模型 ${name} 已删除`,
      model: name 
    });
  } catch (error) {
    console.error('删除模型失败:', error);
    res.status(500).json({ error: '删除模型失败' });
  }
});

// 获取模型信息
router.get('/models/:name/info', async (req, res) => {
  try {
    const { name } = req.params;
    const models = await ollamaAPI.getModels();
    const model = models.find(m => m.name === name);
    
    if (!model) {
      return res.status(404).json({ error: '模型不存在' });
    }
    
    res.json(model);
  } catch (error) {
    console.error('获取模型信息失败:', error);
    res.status(500).json({ error: '获取模型信息失败' });
  }
});

module.exports = router; 