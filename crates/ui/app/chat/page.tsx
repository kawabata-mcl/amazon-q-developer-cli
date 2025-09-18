'use client';

import { AuthGuard } from '@/components/auth/auth-guard';
import { MainLayout } from '@/components/layout';
import { ChatWindow } from '@/components/chat/chat-window';
import { useChatStore } from '@/stores/chat-store';

function ChatPageContent() {
  const { startNewConversation } = useChatStore();

  const handleNewChat = async () => {
    try {
      await startNewConversation();
    } catch (error) {
      console.error('Failed to start new conversation:', error);
    }
  };

  const handleSettingsClick = () => {
    window.location.href = '/settings';
  };

  return (
    <MainLayout
      title="Amazon Q Developer"
      connectionStatus="connected"
      onNewChat={handleNewChat}
      onSettingsClick={handleSettingsClick}
    >
      <ChatWindow />
    </MainLayout>
  );
}

export default function ChatPage() {
  return (
    <AuthGuard>
      <ChatPageContent />
    </AuthGuard>
  );
}