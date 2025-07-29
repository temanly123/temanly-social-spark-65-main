import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Send, X, Minimize2, Maximize2 } from 'lucide-react';
import { chatService, Message, Conversation } from '@/services/chatService';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface ChatBoxProps {
  conversation: Conversation;
  onClose: () => void;
  isMinimized?: boolean;
  onToggleMinimize?: () => void;
  className?: string;
}

const ChatBox: React.FC<ChatBoxProps> = ({
  conversation,
  onClose,
  isMinimized = false,
  onToggleMinimize,
  className = ''
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const otherParticipant = conversation.other_participant;
  const isCurrentUserTalent = conversation.talent_id === user?.id;

  useEffect(() => {
    if (!conversation.id || !user?.id) return;

    loadMessages();
    markAsRead();

    // Subscribe to new messages
    const unsubscribe = chatService.subscribeToMessages(
      conversation.id,
      (message) => {
        setMessages(prev => [...prev, message]);
        if (message.sender_id !== user.id) {
          markAsRead();
        }
      },
      (error) => {
        console.error('Chat subscription error:', error);
        toast({
          title: "Connection Error",
          description: "Failed to maintain chat connection",
          variant: "destructive"
        });
      }
    );

    return () => {
      unsubscribe();
    };
  }, [conversation.id, user?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!isMinimized && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isMinimized]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const fetchedMessages = await chatService.getMessages(conversation.id);
      setMessages(fetchedMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async () => {
    if (!user?.id) return;
    try {
      await chatService.markMessagesAsRead(conversation.id, user.id);
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user?.id || sending) return;

    try {
      setSending(true);
      await chatService.sendMessage(conversation.id, user.id, newMessage.trim());
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      });
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatMessageTime = (timestamp: string) => {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  };

  const getUnreadCount = () => {
    return isCurrentUserTalent ? conversation.talent_unread_count : conversation.user_unread_count;
  };

  if (isMinimized) {
    return (
      <Card className={`w-80 ${className}`}>
        <CardHeader className="p-3 cursor-pointer" onClick={onToggleMinimize}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Avatar className="w-8 h-8">
                <AvatarImage src={otherParticipant?.avatar} alt={otherParticipant?.name} />
                <AvatarFallback>{otherParticipant?.name?.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{otherParticipant?.name}</p>
                {getUnreadCount() > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    {getUnreadCount()} new
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onToggleMinimize?.(); }}>
                <Maximize2 className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onClose(); }}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className={`w-80 h-96 flex flex-col ${className}`}>
      {/* Header */}
      <CardHeader className="p-3 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Avatar className="w-8 h-8">
              <AvatarImage src={otherParticipant?.avatar} alt={otherParticipant?.name} />
              <AvatarFallback>{otherParticipant?.name?.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">{otherParticipant?.name}</p>
              <p className="text-xs text-gray-500">
                {otherParticipant?.is_talent ? 'Talent' : 'User'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {onToggleMinimize && (
              <Button variant="ghost" size="sm" onClick={onToggleMinimize}>
                <Minimize2 className="w-4 h-4" />
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      {/* Messages */}
      <CardContent className="flex-1 p-3 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-pink-500"></div>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((message) => {
              const isOwnMessage = message.sender_id === user?.id;
              return (
                <div
                  key={message.id}
                  className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] px-3 py-2 rounded-lg text-sm ${
                      isOwnMessage
                        ? 'bg-pink-500 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <p>{message.content}</p>
                    <p className={`text-xs mt-1 ${
                      isOwnMessage ? 'text-pink-100' : 'text-gray-500'
                    }`}>
                      {formatMessageTime(message.created_at)}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </CardContent>

      {/* Input */}
      <div className="p-3 border-t">
        <div className="flex items-center gap-2">
          <Input
            ref={inputRef}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1 text-sm"
            disabled={sending}
          />
          <Button 
            onClick={handleSendMessage} 
            disabled={!newMessage.trim() || sending}
            size="sm"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default ChatBox;
