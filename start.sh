#!/bin/bash

echo "========================================"
echo "Ollama Chat Web Interface 启动脚本"
echo "========================================"

echo ""
echo "正在检查Node.js..."
if ! command -v node &> /dev/null; then
    echo "错误: 未找到Node.js，请先安装Node.js"
    exit 1
fi

echo ""
echo "正在检查Ollama服务..."
if ! curl -s http://localhost:11434/api/tags &> /dev/null; then
    echo "警告: Ollama服务可能未运行，请确保Ollama已启动"
    echo "启动命令: ollama serve"
    echo ""
fi

echo ""
echo "正在安装前端依赖..."
npm install
if [ $? -ne 0 ]; then
    echo "错误: 前端依赖安装失败"
    exit 1
fi

echo ""
echo "正在安装后端依赖..."
cd server
npm install
if [ $? -ne 0 ]; then
    echo "错误: 后端依赖安装失败"
    exit 1
fi

echo ""
echo "正在启动后端服务器..."
gnome-terminal --title="Ollama Chat API" -- bash -c "npm run dev; exec bash" &
# 如果gnome-terminal不可用，尝试其他终端
if [ $? -ne 0 ]; then
    xterm -title "Ollama Chat API" -e "npm run dev; bash" &
fi

echo ""
echo "等待后端服务器启动..."
sleep 3

echo ""
echo "正在启动前端应用..."
cd ..
gnome-terminal --title="Ollama Chat Frontend" -- bash -c "npm start; exec bash" &
# 如果gnome-terminal不可用，尝试其他终端
if [ $? -ne 0 ]; then
    xterm -title "Ollama Chat Frontend" -e "npm start; bash" &
fi

echo ""
echo "========================================"
echo "启动完成！"
echo "========================================"
echo "前端地址: http://localhost:3000"
echo "后端API: http://localhost:3001"
echo "API文档: http://localhost:3001/api"
echo "========================================"
echo "" 