import React from 'react';
import { useAuth } from '@/contexts/AuthContextValue';
import AdminChat from './AdminChat';
import CustomerChat from './CustomerChat';

const ChatContainer: React.FC = () => {
  const { isAdmin } = useAuth();
  return isAdmin ? <AdminChat /> : <CustomerChat />;
};

export default ChatContainer;
