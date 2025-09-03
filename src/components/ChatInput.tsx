// src/components/ChatInput.tsx
import React, { useState, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { useDispatch } from 'react-redux';
import { addMessage, createNewConversation, fetchConversations, updateMessageContent } from '../store/conversationSlice';
import { AppDispatch } from '../store';
import { 
  Box, 
  TextField, 
  IconButton, 
  Stack, 
  Paper,
  Avatar,
  Badge
} from '@mui/material';
import { Send, AttachFile, Image, Token } from '@mui/icons-material';
import { chatDbAPI} from '../services/chatDbAPI';

interface ChatInputProps {
  conversationId: string;
}

const ChatInput: React.FC<ChatInputProps> = ({ conversationId }) => {
  const [message, setMessage] = useState('');
  const dispatch = useDispatch<AppDispatch>();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      'image/*': ['.jpeg', '.png', '.jpg']
    },
    maxFiles: 1,
    onDrop: acceptedFiles => {
      handleImageUpload(acceptedFiles[0]);
    }
  });

  const handleSendMessage = async () => {
    if (message.trim()) {
      const messageContent = message;
      setMessage(''); // 立即清空输入框
      
      try {
        let currentId = conversationId;
        let responseContent = '';
        
        // 如果是新会话，先创建会话
        if (currentId === 'new') {
          console.log('创建新会话');
          const res = await chatDbAPI.createConversation(messageContent.slice(0, 30) + '...');
          currentId = res.id;
          dispatch(createNewConversation({ id: res.id, title: messageContent.slice(0, 30) + '...' }));
          // 等待一下以确保状态更新
          await new Promise(resolve => setTimeout(resolve, 100));
          console.log('新会话已创建:', currentId);
        }
        
        // 添加用户消息到本地状态
        const userMessageId = Date.now().toString();
        const userMessage = {
          id: userMessageId,
          role: 'user' as 'user',
          content: messageContent,
          timestamp: new Date()
        };
        console.log('添加用户消息:', userMessage);
        dispatch(addMessage(userMessage));

        // 创建一个空的AI消息用于流式更新
        const aiMessageId = (Date.now() + 1).toString();
        const aiMessage = {
          id: aiMessageId,
          role: 'assistant' as 'assistant',
          content: '',
          timestamp: new Date()
        };
        console.log('添加AI消息:', aiMessage);
        dispatch(addMessage(aiMessage));

        // 使用流式API
        console.log('开始流式请求，会话ID:', currentId);
            await chatDbAPI.sendMessageStream(
              currentId,
              messageContent,
              {},
              (token) => {
                console.log('收到token:', token);
                responseContent += token;
                dispatch(updateMessageContent({
                  messageId: aiMessageId,
                  content: token, // 只传递本次 token
                  append: true // 关键：使用 append 模式
                }));
              }
            );
            console.log('流式请求完成, 完整响应:', responseContent);
        
        // 如果是新会话，获取更新后的会话列表
        if (conversationId === 'new') {
          await dispatch(fetchConversations());
        }
      } catch (error) {
        console.error('发送消息失败:', error);
      }
    }
  };

  const handleImageUpload = async (file: File) => {
    // TODO: Implement image upload and processing
    console.log('Uploading image:', file);
  };

  return (
    <Paper elevation={3} sx={{ p: 2 }}>
      <Stack direction="row" spacing={1} alignItems="center">
        <Box {...getRootProps()} sx={{ cursor: 'pointer' }}>
          <input {...getInputProps()} />
          <Badge overlap="circular" badgeContent={<Image fontSize="small" />}>
            <Avatar sx={{ bgcolor: 'secondary.main' }}>
              <AttachFile />
            </Avatar>
          </Badge>
        </Box>
        <TextField
          fullWidth
          multiline
          maxRows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
          placeholder="Type your message..."
          variant="outlined"
        />
        <IconButton 
          color="primary" 
          onClick={handleSendMessage}
          disabled={!message.trim()}
        >
          <Send />
        </IconButton>
      </Stack>
    </Paper>
  );
};

export default ChatInput;