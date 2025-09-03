import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Divider
} from '@mui/material';
import { History } from '@mui/icons-material';
import { chatDbAPI } from '../services/chatDbAPI';
import { Conversation } from '../types';

interface HistorySearchProps {
  open: boolean;
  onClose: () => void;
  onConversationSelect?: (conversation: Conversation) => void;
}

const HistorySearch: React.FC<HistorySearchProps> = ({ open, onClose, onConversationSelect }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      loadConversations();
    }
  }, [open]);

  const loadConversations = async () => {
    setLoading(true);
    setError(null);

    try {
      // 获取对话列表，限制前10条
      const allConversations = await chatDbAPI.getConversations();
      // 按创建时间降序排序并取前10条
      const sortedConversations = allConversations
        .sort((a: Conversation, b: Conversation) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        .slice(0, 10);
      setConversations(sortedConversations);
    } catch (err) {
      console.error('加载历史会话失败:', err);
      setError('加载失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { height: '80vh' }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <History />
          历史会话记录
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {error && (
          <Typography color="error" variant="body2" sx={{ mt: 1 }}>
            {error}
          </Typography>
        )}

        <Divider sx={{ my: 2 }} />

        <Box sx={{ height: 'calc(100% - 60px)', overflow: 'auto' }}>
          {conversations.length === 0 && !loading && (
            <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
              <History sx={{ fontSize: 48, mb: 1 }} />
              <Typography variant="h6">暂无历史会话</Typography>
              <Typography variant="body2">
                开始新的对话后，这里会显示您的历史记录
              </Typography>
            </Box>
          )}

          {conversations.length > 0 && (
            <List>
              {conversations.map((conversation, index) => (
                <React.Fragment key={conversation.id}>
                  <ListItem
                    alignItems="flex-start"
                    onClick={() => onConversationSelect && onConversationSelect(conversation)}
                    sx={{
                      cursor: onConversationSelect ? 'pointer' : 'default',
                      '&:hover': onConversationSelect ? {
                        backgroundColor: 'action.hover',
                      } : {}
                    }}
                  >
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                            {conversation.title}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatDate(conversation.createdAt)}
                          </Typography>
                        </Box>
                      }
                      secondary={
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            wordBreak: 'break-word',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          }}
                        >
                          {conversation.messages && conversation.messages.length > 0
                            ? conversation.messages[conversation.messages.length - 1].content
                            : '暂无消息内容'
                          }
                        </Typography>
                      }
                    />
                  </ListItem>
                  {index < conversations.length - 1 && <Divider variant="inset" component="li" />}
                </React.Fragment>
              ))}
            </List>
          )}

          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          )}
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>关闭</Button>
      </DialogActions>
    </Dialog>
  );
};

export default HistorySearch;