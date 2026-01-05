import React from 'react';
import { Bot, Sparkles } from 'lucide-react';

interface Props {
  userRole: 'admin' | 'user' | null;
  userInfo: { name?: string } | null;
}

const ChatHeader: React.FC<Props> = ({ userRole, userInfo }) => {
  const displayName = userInfo?.name || '';
  const isAdmin = userRole === 'admin';

  return (
    <div className="mb-4 pb-4 border-b border-border">
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg">
          <Bot className="h-6 w-6 text-primary-foreground" />
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            Mary — AI Property Assistant
            {isAdmin && (
              <span className="inline-flex items-center gap-1 text-xs font-medium bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                <Sparkles className="h-3 w-3" /> Admin
              </span>
            )}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isAdmin
              ? `Welcome back${displayName ? `, ${displayName}` : ''}! You have access to enhanced admin features.`
              : displayName
                ? `Hi ${displayName}! How can I help you find your perfect property today?`
                : 'How can I help you find your perfect property today?'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChatHeader;
