import { configureStore } from '@reduxjs/toolkit';
import conversationReducer from './conversationSlice';
import authReducer from './slices/authSlice';

export const store = configureStore({
  reducer: {
    conversations: conversationReducer,
    auth: authReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 