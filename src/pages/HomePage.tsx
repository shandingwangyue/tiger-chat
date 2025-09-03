// src/pages/HomePage.tsx
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { fetchConversations, deleteConversation, setCurrentConversation } from '../store/conversationSlice';
import { AppDispatch, RootState } from '../store';
import { Box, Container, Drawer, IconButton, Toolbar, Divider, Avatar, Typography, Button } from '@mui/material';
import { Settings, Add, Logout, History } from '@mui/icons-material';
import ConversationList from '../components/ConversationList';
import MessageBubble from '../components/MessageBubble';
import ChatInput from '../components/ChatInput';
import ModelConfigPanel from '../components/ModelConfigPanel';
import type { Conversation } from '../types';
import { authService } from '../services/authAPI';
import { logout } from '../store/slices/authSlice';
import HistorySearch from '../components/HistorySearch';
import { chatDbAPI } from '../services/chatDbAPI';
const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
   
  const dispatch = useDispatch<AppDispatch>();
  const { currentConversation, conversations, status } = useSelector(
    (state: RootState) => state.conversations
  );
  const { user } = useSelector((state: RootState) => state.auth);
  const [configDrawerOpen, setConfigDrawerOpen] = useState(false);
  const [modelConfig, setModelConfig] = useState({
    temperature: 0.7,
    maxTokens: 256,
    topP: 0.9,
    frequencyPenalty: 0
  });
  const [historySearchOpen, setHistorySearchOpen] = useState(false);

  const handleSelectConversation = async (conversation: Conversation) => {
    try {
      // 如果对话没有消息，加载完整对话信息
      if (!conversation.messages) {
        const fullConversation = await chatDbAPI.getConversation(conversation.id);
        dispatch(setCurrentConversation(fullConversation));
      } else {
        dispatch(setCurrentConversation(conversation));
      }
    } catch (error) {
      console.error('加载对话详情失败:', error);
      // 如果加载失败，仍然设置当前对话（没有消息）
      dispatch(setCurrentConversation(conversation));
    }
  };

  const handleCreateConversation = () => {
    dispatch(setCurrentConversation(null));
  };

  useEffect(() => {
    dispatch(fetchConversations());
  }, []);

  useEffect(() => {
    if (currentConversation && currentConversation.messages && currentConversation.messages.length > 0) {
      dispatch(fetchConversations());
    }
  }, [currentConversation?.messages?.length]);

  const messagesKey = currentConversation ? `${currentConversation.id}-${currentConversation.messages?.length || 0}` : 'no-conversation';

  return (
    <Box sx={{ display: 'flex', height: '100vh', bgcolor: 'background.default' }}>
      {/* 左侧边栏 */}
      <Box sx={{ 
        width: 260, 
        bgcolor: 'background.paper',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        borderRight: '1px solid',
        borderColor: 'divider'
      }}>
        {/* 顶部应用标题 */}
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Ollama Chat</Typography>
        </Box>
        
        {/* 新建对话按钮 */}
        <Box sx={{ px: 2, pb: 2 }}>
          <Button
            fullWidth
            variant="contained"
            startIcon={<Add />}
            onClick={handleCreateConversation}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              py: 1
            }}
          >
            新建对话
          </Button>
        </Box>

        {/* 历史记录查询按钮 */}
        <Box sx={{ px: 2, pb: 2 }}>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<History />}
            onClick={() => setHistorySearchOpen(true)}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              py: 1,
              borderColor: 'primary.main',
              color: 'primary.main',
              '&:hover': {
                borderColor: 'primary.dark',
                backgroundColor: 'primary.light',
                color: 'primary.dark'
              }
            }}
          >
            查询历史记录
          </Button>
        </Box>
        
        {/* 对话列表 */}
        <Box sx={{ flex: 1, overflow: 'auto' }}>
          <ConversationList
            conversations={conversations}
            loading={status === 'loading'}
            onSelectConversation={handleSelectConversation}
            onDeleteConversation={(id) => dispatch(deleteConversation(id))}
          />
        </Box>
        
        {/* 底部用户信息 */}
        <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
              {user?.username?.[0]?.toUpperCase()}
            </Avatar>
            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
              {user?.username}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              size="small"
              startIcon={<Settings fontSize="small" />}
              onClick={() => setConfigDrawerOpen(true)}
              sx={{ 
                textTransform: 'none',
                fontSize: '0.75rem',
                color: 'text.secondary'
              }}
            >
              设置
            </Button>
            <Button
              size="small"
              startIcon={<Logout fontSize="small" />}
              onClick={() => {
                authService.logout();
                dispatch(logout());
                navigate('/login');
              }}
              sx={{ 
                textTransform: 'none',
                fontSize: '0.75rem',
                color: 'text.secondary'
              }}
            >
              退出
            </Button>
          </Box>
        </Box>
      </Box>
      
      {/* 主聊天区域 */}
      <Box sx={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column',
        height: '100%'
      }}>
        {/* 消息区域 */}
        <Box 
          key={messagesKey}
          sx={{ 
            flex: 1, 
            overflow: 'auto', 
            p: 3,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            bgcolor: 'background.default'
          }}
        >
          {currentConversation?.messages?.map((message) => (
            <MessageBubble
              key={`${message.id}-${message.content?.length || 0}`}
              message={{
                ...message,
                content: message.content || '...'
              }}
              onCopy={() => navigator.clipboard.writeText(message.content)}
            />
          ))}
        </Box>
        
        {/* 输入区域 */}
        <Box sx={{ 
          p: 2,
          borderTop: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper'
        }}>
          <ChatInput 
            conversationId={currentConversation?.id || 'new'} 
          />
        </Box>
      </Box>
      
      {/* 配置抽屉 */}
      <Drawer
        anchor="right"
        open={configDrawerOpen}
        onClose={() => setConfigDrawerOpen(false)}
      >
        <Box sx={{ width: 350, p: 2 }}>
          <ModelConfigPanel
            initialConfig={modelConfig}
            onConfigChange={setModelConfig}
          />
        </Box>
      </Drawer>

      {/* 历史记录搜索对话框 */}
      <HistorySearch
        open={historySearchOpen}
        onClose={() => setHistorySearchOpen(false)}
        onConversationSelect={(conversation) => {
          handleSelectConversation(conversation);
          setHistorySearchOpen(false);
        }}
      />
    </Box>
  );
};

export default HomePage;