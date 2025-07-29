import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageCircle } from 'lucide-react';
import { chatService } from '@/services/chatService';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { ensureChatTablesExist } from '@/utils/setupChatTables';

interface ChatButtonProps {
  talentId?: string;
  userId?: string;
  onChatStart?: (conversationId: string) => void;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'default' | 'lg';
  className?: string;
  showUnreadCount?: boolean;
}

const ChatButton: React.FC<ChatButtonProps> = ({
  talentId,
  userId,
  onChatStart,
  variant = 'default',
  size = 'default',
  className = '',
  showUnreadCount = false
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (showUnreadCount && user?.id) {
      loadUnreadCount();
      
      // Subscribe to conversation updates to update unread count
      const unsubscribe = chatService.subscribeToConversations(
        user.id,
        () => {
          loadUnreadCount();
        }
      );

      return () => {
        unsubscribe();
      };
    }
  }, [showUnreadCount, user?.id]);

  const loadUnreadCount = async () => {
    if (!user?.id) return;
    
    try {
      const count = await chatService.getUnreadCount(user.id);
      setUnreadCount(count);
    } catch (error) {
      console.error('Error loading unread count:', error);
    }
  };

  const handleChatClick = async () => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "You need to login to start a chat",
        variant: "destructive"
      });
      return;
    }

    // If no specific talent/user is provided, this is a general chat button
    if (!talentId && !userId) {
      onChatStart?.('');
      return;
    }

    try {
      setLoading(true);

      // Ensure chat tables exist
      console.log('🔧 Ensuring chat tables exist...');
      const tablesReady = await ensureChatTablesExist();
      if (!tablesReady) {
        throw new Error('Chat system is not ready. Please contact support.');
      }

      // Determine the other participant
      const otherParticipantId = talentId || userId;
      if (!otherParticipantId) {
        throw new Error('No participant specified');
      }

      // Get or create conversation
      const conversationId = await chatService.getOrCreateConversation(
        user.id,
        otherParticipantId
      );

      onChatStart?.(conversationId);

    } catch (error) {
      console.error('Error starting chat:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to start chat",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleChatClick}
      disabled={loading}
      className={`relative ${className}`}
    >
      <MessageCircle className="w-4 h-4 mr-2" />
      {loading ? 'Starting...' : 'Chat'}
      {showUnreadCount && unreadCount > 0 && (
        <Badge 
          variant="destructive" 
          className="absolute -top-2 -right-2 text-xs min-w-[20px] h-5 flex items-center justify-center"
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </Badge>
      )}
    </Button>
  );
};

export default ChatButton;
