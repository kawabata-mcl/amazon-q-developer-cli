'use client';

import { AuthGuard } from '@/components/auth/auth-guard';
import { MainLayout } from '@/components/layout';
import { ChatWindow } from '@/components/chat/chat-window';
import { useChatStore } from '@/stores/chat-store';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';

function ChatPageContent() {
  const { startNewConversation } = useChatStore();
  const { logout } = useAuth();
  const router = useRouter();

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

  const handleLogoutClick = async () => {
    try {
      await logout();
      router.push('/auth');
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  };

  return (
    <MainLayout
      title="Amazon Q Developer"
      connectionStatus="connected"
      onNewChat={handleNewChat}
      onSettingsClick={handleSettingsClick}
      onLogoutClick={handleLogoutClick}
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