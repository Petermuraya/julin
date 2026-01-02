import React from 'react';
import { Bot } from 'lucide-react';

interface Props {
  userRole: 'admin' | 'user' | null;
  userInfo: { name?: string } | null;
}

const ChatHeader: React.FC<Props> = ({ userRole, userInfo }) => (
  <div className="mb-4">
    <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
      <Bot className="h-6 w-6 text-blue-600" />
      AI Property Assistant
    </h1>
    <p className="text-slate-600 dark:text-slate-400 mt-1">
      {userRole === 'admin'
        ? `Welcome back, ${userInfo?.name}! You have admin access to enhanced features.`
        : `Hi ${userInfo?.name || ''}! How can I help you find your perfect property today?`}
    </p>
  </div>
);

export default ChatHeader;
