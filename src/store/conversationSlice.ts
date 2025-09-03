// src/store/conversationSlice.ts
import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { Conversation, Message } from '../types';

interface ConversationState {
  currentConversation: Conversation | null;
  conversations: Conversation[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: ConversationState = {
  currentConversation: null,
  conversations: [],
  status: 'idle',
  error: null
};

export const fetchConversations = createAsyncThunk(
  'conversations/fetchConversations',
  async () => {
    const response = await fetch('/api/conversations');
    return (await response.json()) as Conversation[];
  }
);

export const conversationSlice = createSlice({
  name: 'conversations',
  initialState,
  reducers: {
    setCurrentConversation: (state, action: PayloadAction<Conversation | null>) => {
      state.currentConversation = action.payload;
    },
    addMessage: (state, action: PayloadAction<Message>) => {
      if (state.currentConversation) {
        // 创建新的消息数组
        const newMessages = [...(state.currentConversation.messages || []), action.payload];
        
        // 更新当前会话
        state.currentConversation = {
          ...state.currentConversation,
          messages: newMessages
        };
        
        // 同时更新 conversations 数组中的对应会话
        const conversationIndex = state.conversations.findIndex(
          conv => conv.id === state.currentConversation!.id
        );
        if (conversationIndex !== -1) {
          state.conversations = state.conversations.map((conv, index) =>
            index === conversationIndex ? state.currentConversation! : conv
          );
        }
      }
    },
    createNewConversation: (state, action: PayloadAction<{ id: string; title: string }>) => {
      const newConversation: Conversation = {
        id: action.payload.id,
        title: action.payload.title,
        createdAt: new Date(),
        messages: []
      };
      state.currentConversation = newConversation;
      state.conversations = [newConversation, ...state.conversations];
    },
    deleteConversation: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      state.conversations = state.conversations.filter(conv => conv.id !== id);
      if (state.currentConversation?.id === id) {
        state.currentConversation = state.conversations[0] || null;
      }
    },
    updateMessageContent: (state, action: PayloadAction<{ messageId: string; content: string; append?: boolean }>) => {
      console.log('更新消息内容:', action.payload);
      if (state.currentConversation) {
        console.log('当前会话:', state.currentConversation.id);
        const messageIndex = (state.currentConversation.messages || []).findIndex(m => m.id === action.payload.messageId);
        console.log('找到消息索引:', messageIndex);
        if (messageIndex !== -1) {
          const message = state.currentConversation.messages[messageIndex];
          console.log('更新前的消息:', message);
          
          const updatedMessages = (state.currentConversation.messages || []).map((msg, index) =>
            index === messageIndex
              ? {
                  ...msg,
                  content: action.payload.append
                    ? msg.content + action.payload.content
                    : action.payload.content
                }
              : msg
          );
          
          state.currentConversation = {
            ...state.currentConversation,
            messages: updatedMessages
          };
          
          // 同时更新 conversations 数组中的对应会话
          const conversationIndex = state.conversations.findIndex(
            conv => conv.id === state.currentConversation!.id
          );
          if (conversationIndex !== -1) {
            state.conversations = state.conversations.map((conv, index) =>
              index === conversationIndex ? state.currentConversation! : conv
            );
          }
        }
      }
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchConversations.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchConversations.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.conversations = action.payload;
        if (!state.currentConversation && action.payload.length > 0) {
          // 只设置基本信息，不设置 messages（因为列表API不返回消息）
          state.currentConversation = {
            ...action.payload[0],
            messages: []
          };
        }
      })
      .addCase(fetchConversations.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message || 'Failed to fetch conversations';
      });
  }
});

export const { 
  addMessage, 
  createNewConversation, 
  deleteConversation, 
  setCurrentConversation,
  updateMessageContent 
} = conversationSlice.actions;
export default conversationSlice.reducer;