import React from 'react';
import { 
  List, 
  ListItem, 
  ListItemText, 
  ListItemButton, 
  Typography, 
  Box,
  CircularProgress,
  IconButton,
  Tooltip
} from '@mui/material';
import { Delete, Add } from '@mui/icons-material';
import { format } from 'date-fns';
import { Conversation } from '../types';

interface ConversationListProps {
  conversations: Conversation[];
  loading: boolean;
  onSelectConversation?: (conversation: Conversation) => void;
  onDeleteConversation?: (conversationId: string) => void;
  onCreateConversation?: () => void;
}

const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  loading,
  onSelectConversation,
  onDeleteConversation,
  onCreateConversation
}) => {
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2, borderBottom: '1px solid #eee' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">对话列表</Typography>
          <Tooltip title="新建对话">
            <IconButton color="primary" onClick={onCreateConversation}>
              <Add/>
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
      
      <List sx={{ flex: 1, overflow: 'auto' }}>
        {conversations.length === 0 ? (
          <ListItem>
            <ListItemText 
              primary="暂无对话" 
              secondary="点击 + 按钮开始新对话"
            />
          </ListItem>
        ) : (
          conversations.map((conversation) => (
            <ListItem
              key={conversation.id}
              disablePadding
              secondaryAction={
                onDeleteConversation && (
                  <IconButton 
                    edge="end" 
                    onClick={() => onDeleteConversation(conversation.id)}
                  >
                    <Delete />
                  </IconButton>
                )
              }
            >
              <ListItemButton onClick={() => onSelectConversation?.(conversation)}>
                <ListItemText
                  primary={conversation.title}
                  secondary={format(new Date(conversation.createdAt), 'MM/dd HH:mm')}
                />
              </ListItemButton>
            </ListItem>
          ))
        )}
      </List>
    </Box>
  );
};

export default ConversationList; 