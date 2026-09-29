import { useContext } from 'react';

import { ChatContext, type ChatContextValue } from './chatContext';

export function useChat(): ChatContextValue {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used inside a ChatProvider');
  }
  return context;
}
