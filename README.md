#Tiger Chat Web Interface

基于Ollama， lmstudio， vllm， lln-engine AI后端的Web前端聊天界面，提供直观友好的用户交互体验，支持多轮对话、气泡提示、模型参数配置和图片上传处理等功能。

## 项目概述

### 项目背景
本项目旨在开发一个基于Ollama， lmstudio， vllm， lln-engine AI后端的Web前端聊天界面，提供直观友好的用户交互体验，支持多轮对话、气泡提示、模型参数配置和图片上传处理等功能。

### 项目目标
- 构建响应式Web界面，适配不同设备
- 实现与Ollama 等API的无缝集成
- 提供丰富的交互功能和个性化配置
- 确保系统性能和用户体验

## 系统架构

### 总体架构
采用前后端分离架构：
- **前端**: React + Material UI
- **后端**: Node.js/Express中间层
- **AI服务**: Ollama API

### 技术栈

| 组件 | 技术选择 |
|------|----------|
| 前端框架 | React 18 |
| UI组件库 | Material UI 5 |
| 状态管理 | Redux Toolkit |
| HTTP客户端 | Axios |
| 路由管理 | React Router 6 |
| 富文本编辑 | Draft.js |
| 文件上传 | react-dropzone |
| 后端框架 | Express.js |
| 文件处理 | Multer |
| 安全 | Helmet, CORS |

## 功能特性

### 聊天功能
- ✅ 多轮对话支持
- ✅ 实时消息显示
- ✅ 流式响应（Server-Sent Events）
- ✅ 消息历史记录
- ✅ 对话管理（创建、删除、切换）

### 模型管理
- ✅ 模型列表查看
- ✅ 模型状态检查
- ✅ 模型拉取/下载
- ✅ 模型删除
- ✅ 模型参数配置

### 文件处理
- ✅ 图片上传
- ✅ 文件上传
- ✅ 多种文件格式支持
- ✅ 文件大小限制
- ✅ 文件管理

### 用户界面
- ✅ 响应式设计
- ✅ 现代化UI
- ✅ 深色/浅色主题
- ✅ 移动端适配
- ✅ 实时反馈

## 快速开始

### 前置要求

1. **Node.js** (版本 16 或更高)
2. **Ollama** (已安装并运行)
3. **Git**

### 安装步骤

#### 1. 克隆项目
```bash
git clone <repository-url>
cd ollama-chat
```

#### 2. 安装前端依赖
```bash
npm install
```

#### 3. 安装后端依赖
```bash
cd server
npm install
```

#### 4. 配置环境变量

创建 `server/.env` 文件：
```env
# Ollama API配置
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_DEFAULT_MODEL=llama2

# 服务器配置
PORT=3001
NODE_ENV=development

# 文件上传配置
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads

# 安全配置
CORS_ORIGIN=http://localhost:3000
```

#### 5. 启动Ollama等服务
确保Ollama等服务正在运行：
```bash
ollama serve
```

#### 6. 启动后端服务器
```bash
cd server
npm run dev
```

#### 7. 启动前端应用
```bash
# 在项目根目录
npm start
```

### 访问应用

- **前端**: http://localhost:3000
- **后端API**: http://localhost:3001
- **API文档**: http://localhost:3001/api

## API接口文档

### 聊天相关接口

#### 发送消息
```http
POST /api/chat
Content-Type: application/json

{
  "conversationId": "string",
  "message": "string",
  "options": {
    "model": "llama2",
    "temperature": 0.7,
    "max_tokens": 2048
  }
}
```

#### 流式聊天
```http
POST /api/chat/stream
Content-Type: application/json

{
  "conversationId": "string",
  "message": "string",
  "options": {}
}
```

#### 获取对话列表
```http
GET /api/conversations
```

#### 创建对话
```http
POST /api/conversations
Content-Type: application/json

{
  "title": "新对话"
}
```

### 模型管理接口

#### 获取模型列表
```http
GET /api/models
```

#### 检查模型状态
```http
GET /api/models/{name}/check
```

#### 拉取模型
```http
POST /api/models/pull
Content-Type: application/json

{
  "name": "llama2"
}
```

### 文件上传接口

#### 上传图片
```http
POST /api/upload/image
Content-Type: multipart/form-data

Form Data:
- image: File
```

#### 上传文件
```http
POST /api/upload/file
Content-Type: multipart/form-data

Form Data:
- file: File
```

## 项目结构

```
ollama-chat/
├── src/                    # 前端源码
│   ├── components/         # React组件
│   ├── pages/             # 页面组件
│   ├── services/          # API服务
│   ├── store/             # Redux状态管理
│   └── types/             # TypeScript类型定义
├── server/                # 后端源码
│   ├── config/            # 配置文件
│   ├── routes/            # API路由
│   └── server.js          # 主服务器文件
├── public/                # 静态资源
└── package.json           # 前端依赖配置
```

## 开发指南

### 前端开发

#### 添加新组件
1. 在 `src/components/` 目录下创建新组件
2. 使用TypeScript和Material UI
3. 遵循现有的代码风格

#### 状态管理
- 使用Redux Toolkit进行状态管理
- 在 `src/store/` 目录下添加新的slice
- 使用TypeScript定义状态类型

#### API调用
- 在 `src/services/api.ts` 中添加新的API方法
- 使用Axios进行HTTP请求
- 处理错误和加载状态

### 后端开发

#### 添加新路由
1. 在 `server/routes/` 目录下创建新路由文件
2. 在 `server/server.js` 中注册路由
3. 添加适当的错误处理

#### 数据库集成
当前使用内存存储，生产环境建议：
- 使用MongoDB或PostgreSQL
- 添加数据持久化
- 实现用户认证

#### 安全考虑
- 添加请求速率限制
- 实现用户认证和授权
- 验证文件上传
- 添加API密钥管理

## 部署指南

### 生产环境部署

#### 1. 构建前端
```bash
npm run build
```

#### 2. 配置生产环境变量
```env
NODE_ENV=production
PORT=3001
OLLAMA_BASE_URL=http://your-ollama-server:11434
CORS_ORIGIN=https://your-domain.com
```

#### 3. 使用PM2启动后端
```bash
cd server
npm install -g pm2
pm2 start server.js --name "ollama-chat-api"
```

#### 4. 配置Nginx反向代理
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        root /path/to/ollama-chat/build;
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 故障排除

### 常见问题

#### 1. Ollama连接失败
- 确保Ollama服务正在运行
- 检查 `OLLAMA_BASE_URL` 配置
- 验证网络连接

#### 2. 前端无法连接后端
- 检查CORS配置
- 验证端口设置
- 确认防火墙设置

#### 3. 文件上传失败
- 检查上传目录权限
- 验证文件大小限制
- 确认文件类型支持

#### 4. 模型拉取失败
- 检查网络连接
- 验证模型名称
- 确认磁盘空间

## 贡献指南

1. Fork项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建Pull Request

## 许可证

MIT License

## 联系方式

如有问题或建议，请提交Issue或联系开发团队。
