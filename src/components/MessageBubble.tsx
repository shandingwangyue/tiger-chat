// src/components/MessageBubble.tsx
import React from 'react';
import { Box, Typography, Paper, IconButton, Tooltip } from '@mui/material';
import { format } from 'date-fns';
import { CopyAll, Delete } from '@mui/icons-material';

interface MessageBubbleProps {
  message: {
    content: string;
    role: 'user' | 'assistant';
    timestamp: Date;
  };
  onCopy?: () => void;
  onDelete?: () => void;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, onCopy, onDelete }) => {
  const isUser = message.role === 'user';
  
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        mb: 2,
      }}
    >
      <Paper
        elevation={2}
        sx={{
          p: 2,
          maxWidth: '80%',
          backgroundColor: isUser ? 'primary.light' : 'background.paper',
          color: isUser ? 'primary.contrastText' : 'text.primary',
          borderRadius: isUser 
            ? '18px 18px 4px 18px' 
            : '18px 18px 18px 4px',
        }}
      >
        <Typography variant="body1">{message.content}</Typography>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mt: 1,
          }}
        >
          <Typography variant="caption" sx={{ opacity: 0.7 }}>
            {format(message.timestamp instanceof Date ? message.timestamp : new Date(message.timestamp), 'HH:mm')}
          </Typography>
          <Box>
            {onCopy && (
              <Tooltip title="Copy">
                <IconButton size="small" onClick={onCopy}>
                  <CopyAll fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {onDelete && (
              <Tooltip title="Delete">
                <IconButton size="small" onClick={onDelete}>
                  <Delete fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default MessageBubble;