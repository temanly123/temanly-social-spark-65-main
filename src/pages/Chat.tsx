import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ArrowLeft, Send, Paperclip, Smile } from 'lucide-react';
import { chatService, Message, Conversation } from '@/services/chatService';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

const Chat = () => {
  const { conversationId } = useParams<{ conversationId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get talent/user ID from URL params for creating new conversation
  const talentId = searchParams.get('talentId');
  const userId = searchParams.get('userId');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    initializeChat();
  }, [conversationId, talentId, userId, user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const initializeChat = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);

      let currentConversationId = conversationId;

      // If no conversation ID but we have talent/user ID, create conversation
      if (!currentConversationId && (talentId || userId)) {
        const otherParticipantId = talentId || userId;
        if (otherParticipantId) {
          currentConversationId = await chatService.getOrCreateConversation(
            user.id,
            otherParticipantId
          );
          // Navigate to the conversation URL
          navigate(`/chat/${currentConversationId}`, { replace: true });
          return;
        }
      }

      if (!currentConversationId) {
        toast({
          title: "Error",
          description: "No conversation specified",
          variant: "destructive"
        });
        navigate('/user-dashboard');
        return;
      }

      // Load conversation details
      const conversations = await chatService.getConversations(user.id);
      const currentConversation = conversations.find(c => c.id === currentConversationId);
      
      if (!currentConversation) {
        toast({
          title: "Error",
          description: "Conversation not found",
          variant: "destructive"
        });
        navigate('/user-dashboard');
        return;
      }

      setConversation(currentConversation);

      // Load messages
      const fetchedMessages = await chatService.getMessages(currentConversationId);
      setMessages(fetchedMessages);

      // Mark messages as read
      await chatService.markMessagesAsRead(currentConversationId, user.id);

      // Subscribe to new messages
      const unsubscribe = chatService.subscribeToMessages(
        currentConversationId,
        (message) => {
          setMessages(prev => [...prev, message]);
          if (message.sender_id !== user.id) {
            chatService.markMessagesAsRead(currentConversationId!, user.id);
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

      // Cleanup subscription on unmount
      return () => {
        unsubscribe();
      };

    } catch (error) {
      console.error('Error initializing chat:', error);
      toast({
        title: "Error",
        description: "Failed to load chat",
        variant: "destructive"
      });
      navigate('/user-dashboard');
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !conversation?.id || !user?.id || sending) return;

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

  const handleBack = () => {
    const userType = user?.user_metadata?.user_type || 'user';
    if (userType === 'companion') {
      navigate('/talent-dashboard');
    } else {
      navigate('/user-dashboard');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading chat...</p>
        </div>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Conversation not found</p>
          <Button onClick={handleBack}>Go Back</Button>
        </div>
      </div>
    );
  }

  const otherParticipant = conversation.other_participant;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Chat Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <Avatar className="w-10 h-10">
            <AvatarImage src={otherParticipant?.avatar} alt={otherParticipant?.name} />
            <AvatarFallback>{otherParticipant?.name?.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold text-gray-900">{otherParticipant?.name}</h3>
            <p className="text-sm text-gray-500">
              {otherParticipant?.is_talent ? 'Talent' : 'User'}
            </p>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => {
            const isOwnMessage = message.sender_id === user?.id;
            return (
              <div
                key={message.id}
                className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    isOwnMessage
                      ? 'bg-pink-500 text-white'
                      : 'bg-white text-gray-900 border border-gray-200'
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                  <p className={`text-xs mt-1 ${
                    isOwnMessage ? 'text-pink-100' : 'text-gray-500'
                  }`}>
                    {formatMessageTime(message.created_at)}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" disabled>
            <Paperclip className="w-5 h-5" />
          </Button>
          <div className="flex-1 relative">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="pr-12"
              disabled={sending}
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 transform -translate-y-1/2"
              disabled
            >
              <Smile className="w-5 h-5" />
            </Button>
          </div>
          <Button 
            onClick={handleSendMessage} 
            disabled={!newMessage.trim() || sending}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Chat;
