require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const path = require('path');

// 导入路由
const chatRoutes = require('./routes/chat');
const chatDbRoutes = require('./routes/chat-db');
const modelRoutes = require('./routes/models');
const uploadRoutes = require('./routes/upload');
const authRoutes = require('./routes/auth');
const { testConnection } = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件

// 首先启用 CORS，确保预检请求能被正确处理
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Cache-Control', 'Connection']
}));

// 显式处理 OPTIONS 请求
app.options('*', cors());

app.use(helmet({
  crossOriginResourcePolicy: false, // 允许跨域资源
  crossOriginOpenerPolicy: false   // 允许跨域窗口
}));

// 只对非流式接口启用 compression
app.use((req, res, next) => {
  if (req.url.startsWith('/api/chat/stream')) {
    return next(); // 不压缩流式接口
  }
  compression()(req, res, next);
});

app.use(morgan('combined'));

// 解析JSON和URL编码的请求体
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 静态文件服务
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API路由
//app.use('/api', chatRoutes); // 原有的内存存储路由（保持兼容性）
app.use('/api', chatDbRoutes); // 新的数据库存储路由
app.use('/api', modelRoutes);
app.use('/api', uploadRoutes);
app.use('/api', authRoutes);

// 健康检查端点
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API信息端点
app.get('/api', (req, res) => {
  res.json({
    name: 'Tiger Chat API',
    version: '1.2.0',
    description: '基于Ollama,LmStudio,LLM-ENGINE,VLLM等的WEB聊天API服务',
    endpoints: {
      chat: '/api/chat',
      conversations: '/api/conversations',
      models: '/api/models',
      upload: '/api/upload'
    }
  });
});

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: '接口不存在',
    path: req.originalUrl 
  });
});

// 全局错误处理中间件
app.use((error, req, res, next) => {
  console.error('服务器错误:', error);
  if (error.message) {
    return res.status(500).json({ 
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
  res.status(500).json({ 
    error: '服务器内部错误',
    timestamp: new Date().toISOString()
  });
});

// 启动服务器
async function startServer() {
  try {
    // 测试数据库连接
    await testConnection();
    console.log('✅ 数据库连接测试成功');
    
    app.listen(PORT, () => {
      console.log(`🚀 Tiger Chat API 服务器已启动`);
      console.log(`📍 端口: ${PORT}`);
      console.log(`🌐 环境: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 AiServer : ${process.env.AI_SERVICE || 'ollama'}`);
      if (process.env.AI_SERVICE === 'ollama') {
        console.log(`🔗 Ollama URL: ${process.env.OLLAMA_BASE_URL || 'http://localhost:11434'}`);
      }
      if (process.env.AI_SERVICE === 'lmstudio') {
        console.log(`🔗 LM Studio URL: ${process.env.LMSTUDIO_BASE_URL || 'http://localhost:11234/v1'}`);
      }
      if (process.env.AI_SERVICE === 'vllm') {
        console.log(`🔗 vllm or llm-engine URL: ${process.env.VLLM_BASE_URL || 'http://localhost:11234/v1'}`);
      }
      if (process.env.AI_SERVICE === 'llme') {
        console.log(`🔗 MANNUL LLM-ENGINE URL: ${process.env.LLM_ENGINE_BASE_URL || 'http://localhost:11234/v1'}`);
      } 
      console.log(`📁 上传目录: ${process.env.UPLOAD_PATH || './uploads'}`);
      console.log(`💾 数据库存储: 已启用 (最多10个会话/用户)`);
      console.log(`⏰ 启动时间: ${new Date().toLocaleString()}`);
    });
  } catch (error) {
    console.error('❌ 服务器启动失败:', error.message);
    process.exit(1);
  }
}

startServer();

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('收到 SIGTERM 信号，正在关闭服务器...');
  process.exit(0);
});
process.on('SIGINT', () => {
  console.log('收到 SIGINT 信号，正在关闭服务器...');
  process.exit(0);
});

module.exports = app; 