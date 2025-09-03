@echo off
echo ========================================
echo Ollama Chat Web Interface 启动脚本
echo ========================================

echo.
echo 正在检查Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo 错误: 未找到Node.js，请先安装Node.js
    pause
    exit /b 1
)

echo.
echo 正在检查Ollama服务...
curl -s http://localhost:11434/api/tags >nul 2>&1
if errorlevel 1 (
    echo 警告: Ollama服务可能未运行，请确保Ollama已启动
    echo 启动命令: ollama serve
    echo.
)

echo.
echo 正在安装前端依赖...
call npm install
if errorlevel 1 (
    echo 错误: 前端依赖安装失败
    pause
    exit /b 1
)

echo.
echo 正在安装后端依赖...
cd server
call npm install
if errorlevel 1 (
    echo 错误: 后端依赖安装失败
    pause
    exit /b 1
)

echo.
echo 正在启动后端服务器...
start "Ollama Chat API" cmd /k "npm run dev"

echo.
echo 等待后端服务器启动...
timeout /t 3 /nobreak >nul

echo.
echo 正在启动前端应用...
cd ..
start "Ollama Chat Frontend" cmd /k "npm start"

echo.
echo ========================================
echo 启动完成！
echo ========================================
echo 前端地址: http://localhost:3000
echo 后端API: http://localhost:3001
echo API文档: http://localhost:3001/api
echo ========================================
echo.
pause 