import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MessageCircle, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { chatService, Conversation } from '@/services/chatService';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface ConversationListProps {
  onConversationSelect: (conversation: Conversation) => void;
  selectedConversationId?: string;
  className?: string;
}

const ConversationList: React.FC<ConversationListProps> = ({
  onConversationSelect,
  selectedConversationId,
  className = ''
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!user?.id) {
      console.log('❌ ConversationList: No user ID, skipping subscription');
      return;
    }

    console.log('🔄 ConversationList: Setting up for user:', user.id);
    loadConversations();

    // Subscribe to conversation updates
    console.log('🔔 ConversationList: About to subscribe to conversations');
    const unsubscribe = chatService.subscribeToConversations(
      user.id,
      (updatedConversation) => {
        console.log('🔔 ConversationList: Received conversation update:', updatedConversation);
        setConversations(prev => {
          const index = prev.findIndex(c => c.id === updatedConversation.id);
          if (index >= 0) {
            const updated = [...prev];
            updated[index] = updatedConversation;
            // Sort by last message time
            return updated.sort((a, b) =>
              new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
            );
          } else {
            return [updatedConversation, ...prev];
          }
        });
      },
      (error) => {
        console.error('❌ ConversationList subscription error:', error);
      }
    );

    console.log('✅ ConversationList: Subscription setup complete');

    return () => {
      console.log('🧹 ConversationList: Cleaning up subscription');
      unsubscribe();
    };
  }, [user?.id]);

  const loadConversations = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      console.log('📥 ConversationList: Loading conversations for user:', user.id);
      const fetchedConversations = await chatService.getConversations(user.id);
      console.log('📥 ConversationList: Loaded conversations:', fetchedConversations);
      setConversations(fetchedConversations);
    } catch (error) {
      console.error('❌ ConversationList: Error loading conversations:', error);
      toast({
        title: "Error",
        description: "Failed to load conversations",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredConversations = conversations.filter(conversation =>
    conversation.other_participant?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getUnreadCount = (conversation: Conversation) => {
    const isCurrentUserTalent = conversation.talent_id === user?.id;
    return isCurrentUserTalent ? conversation.talent_unread_count : conversation.user_unread_count;
  };

  const formatLastMessageTime = (timestamp: string) => {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  };

  const truncateMessage = (message: string, maxLength: number = 50) => {
    return message.length > maxLength ? `${message.substring(0, maxLength)}...` : message;
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Conversations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5" />
          Conversations
          {conversations.length > 0 && (
            <Badge variant="secondary">{conversations.length}</Badge>
          )}
        </CardTitle>
        {conversations.length > 0 && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        )}
      </CardHeader>
      <CardContent className="p-0">
        {filteredConversations.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            {conversations.length === 0 ? (
              <div>
                <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium mb-2">No conversations yet</p>
                <p className="text-sm">Start chatting with talents to see conversations here</p>
              </div>
            ) : (
              <p>No conversations match your search</p>
            )}
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            {filteredConversations.map((conversation) => {
              const unreadCount = getUnreadCount(conversation);
              const isSelected = conversation.id === selectedConversationId;
              
              return (
                <div
                  key={conversation.id}
                  className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                    isSelected ? 'bg-pink-50 border-pink-200' : ''
                  }`}
                  onClick={() => onConversationSelect(conversation)}
                >
                  <div className="flex items-start gap-3">
                    <div className="relative">
                      <Avatar className="w-12 h-12">
                        <AvatarImage 
                          src={conversation.other_participant?.avatar} 
                          alt={conversation.other_participant?.name} 
                        />
                        <AvatarFallback>
                          {conversation.other_participant?.name?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      {unreadCount > 0 && (
                        <Badge 
                          variant="destructive" 
                          className="absolute -top-1 -right-1 text-xs min-w-[20px] h-5 flex items-center justify-center"
                        >
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className={`text-sm font-medium truncate ${
                          unreadCount > 0 ? 'font-semibold' : ''
                        }`}>
                          {conversation.other_participant?.name}
                        </h4>
                        <span className="text-xs text-gray-500 flex-shrink-0">
                          {formatLastMessageTime(conversation.last_message_at)}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <p className={`text-sm text-gray-600 truncate ${
                          unreadCount > 0 ? 'font-medium' : ''
                        }`}>
                          {conversation.last_message 
                            ? truncateMessage(conversation.last_message)
                            : 'No messages yet'
                          }
                        </p>
                        {conversation.other_participant?.is_talent && (
                          <Badge variant="outline" className="text-xs ml-2 flex-shrink-0">
                            Talent
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ConversationList;
