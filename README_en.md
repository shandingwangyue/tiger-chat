# Tiger Chat Web Interface

A web-based chat interface powered by Ollama, LMStudio, VLLM, and LLM-Engine AI backends, offering an intuitive and user-friendly interaction experience with support for multi-turn conversations, message bubbles, model parameter configuration, and image upload processing.

## Project Overview

### Background
This project aims to develop a web-based chat interface powered by Ollama, LMStudio, VLLM, and LLM-Engine AI backends, providing an intuitive and user-friendly interaction experience with support for multi-turn conversations, message bubbles, model parameter configuration, and image upload processing.

### Project Goals
- Build a responsive web interface that adapts to different devices
- Achieve seamless integration with Ollama and other APIs
- Provide rich interactive features and personalized configuration
- Ensure system performance and user experience

## System Architecture

### Overall Architecture
Adopts a front-end and back-end separation architecture:
- **Frontend**: React + Material UI
- **Backend**: Node.js/Express middleware
- **AI Service**: Ollama API

### Technology Stack

| Component | Technology Choice |
|-----------|------------------|
| Frontend Framework | React 18 |
| UI Component Library | Material UI 5 |
| State Management | Redux Toolkit |
| HTTP Client | Axios |
| Router Management | React Router 6 |
| Rich Text Editor | Draft.js |
| File Upload | react-dropzone |
| Backend Framework | Express.js |
| File Processing | Multer |
| Security | Helmet, CORS |

## Features

### Chat Functions
- ✅ Multi-turn conversation support
- ✅ Real-time message display
- ✅ Streaming response (Server-Sent Events)
- ✅ Message history
- ✅ Conversation management (create, delete, switch)

### Model Management
- ✅ Model list view
- ✅ Model status check
- ✅ Model pull/download
- ✅ Model deletion
- ✅ Model parameter configuration

### File Processing
- ✅ Image upload
- ✅ File upload
- ✅ Multiple file format support
- ✅ File size limit
- ✅ File management

### User Interface
- ✅ Responsive design
- ✅ Modern UI
- ✅ Dark/Light theme
- ✅ Mobile adaptation
- ✅ Real-time feedback

## Quick Start

### Prerequisites

1. **Node.js** (version 16 or higher)
2. **Ollama** (installed and running)
3. **Git**

### Installation Steps

#### 1. Clone the Project
```bash
git clone <repository-url>
cd ollama-chat
```

#### 2. Install Frontend Dependencies
```bash
npm install
```

#### 3. Install Backend Dependencies
```bash
cd server
npm install
```

#### 4. Configure Environment Variables

Create `server/.env` file:
```env
# Ollama API Configuration
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_DEFAULT_MODEL=llama2

# Server Configuration
PORT=3001
NODE_ENV=development

# File Upload Configuration
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads

# Security Configuration
CORS_ORIGIN=http://localhost:3000
```

#### 5. Start Ollama Services
Ensure Ollama services are running:
```bash
ollama serve
```

#### 6. Start Backend Server
```bash
cd server
npm run dev
```

#### 7. Start Frontend Application
```bash
# In project root directory
npm start
```

### Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **API Documentation**: http://localhost:3001/api

## API Documentation

### Chat-Related Endpoints

#### Send Message
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

#### Streaming Chat
```http
POST /api/chat/stream
Content-Type: application/json

{
  "conversationId": "string",
  "message": "string",
  "options": {}
}
```

#### Get Conversation List
```http
GET /api/conversations
```

#### Create Conversation
```http
POST /api/conversations
Content-Type: application/json

{
  "title": "New Conversation"
}
```

### Model Management Endpoints

#### Get Model List
```http
GET /api/models
```

#### Check Model Status
```http
GET /api/models/{name}/check
```

#### Pull Model
```http
POST /api/models/pull
Content-Type: application/json

{
  "name": "llama2"
}
```

### File Upload Endpoints

#### Upload Image
```http
POST /api/upload/image
Content-Type: multipart/form-data

Form Data:
- image: File
```

#### Upload File
```http
POST /api/upload/file
Content-Type: multipart/form-data

Form Data:
- file: File
```

## Project Structure

```
ollama-chat/
├── src/                    # Frontend source code
│   ├── components/         # React components
│   ├── pages/             # Page components
│   ├── services/          # API services
│   ├── store/             # Redux state management
│   └── types/             # TypeScript type definitions
├── server/                # Backend source code
│   ├── config/            # Configuration files
│   ├── routes/            # API routes
│   └── server.js          # Main server file
├── public/                # Static resources
└── package.json           # Frontend dependency configuration
```

## Development Guide

### Frontend Development

#### Adding New Components
1. Create new components in the `src/components/` directory
2. Use TypeScript and Material UI
3. Follow existing code style

#### State Management
- Use Redux Toolkit for state management
- Add new slices in the `src/store/` directory
- Define state types using TypeScript

#### API Calls
- Add new API methods in `src/services/api.ts`
- Use Axios for HTTP requests
- Handle errors and loading states

### Backend Development

#### Adding New Routes
1. Create new route files in `server/routes/` directory
2. Register routes in `server/server.js`
3. Add appropriate error handling

#### Database Integration
Currently using in-memory storage, recommended for production:
- Use MongoDB or PostgreSQL
- Add data persistence
- Implement user authentication

#### Security Considerations
- Add request rate limiting
- Implement user authentication and authorization
- Validate file uploads
- Add API key management

## Deployment Guide

### Production Environment Deployment

#### 1. Build Frontend
```bash
npm run build
```

#### 2. Configure Production Environment Variables
```env
NODE_ENV=production
PORT=3001
OLLAMA_BASE_URL=http://your-ollama-server:11434
CORS_ORIGIN=https://your-domain.com
```

#### 3. Start Backend Using PM2
```bash
cd server
npm install -g pm2
pm2 start server.js --name "ollama-chat-api"
```

#### 4. Configure Nginx Reverse Proxy
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

## Troubleshooting

### Common Issues

#### 1. Ollama Connection Failure
- Ensure Ollama service is running
- Check `OLLAMA_BASE_URL` configuration
- Verify network connection

#### 2. Frontend Cannot Connect to Backend
- Check CORS configuration
- Verify port settings
- Confirm firewall settings

#### 3. File Upload Failure
- Check upload directory permissions
- Verify file size limits
- Confirm file type support

#### 4. Model Pull Failure
- Check network connection
- Verify model name
- Confirm disk space

## Contribution Guide

1. Fork the project
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## License

MIT License

## Contact

For issues or suggestions, please submit an Issue or contact the development team.
