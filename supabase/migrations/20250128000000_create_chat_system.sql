-- Chat System Migration
-- Creates comprehensive chat functionality with conversations, messages, and real-time features

-- Create conversations table
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    talent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_message TEXT,
    user_unread_count INTEGER DEFAULT 0,
    talent_unread_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique conversation between user and talent
    CONSTRAINT unique_user_talent_conversation UNIQUE(user_id, talent_id)
);

-- Create messages table
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file')),
    file_url TEXT,
    file_name TEXT,
    file_size INTEGER,
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON public.conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_talent_id ON public.conversations(talent_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at ON public.conversations(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created ON public.messages(conversation_id, created_at DESC);

-- Enable RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for conversations
CREATE POLICY "Users can view their own conversations" ON public.conversations
    FOR SELECT USING (
        auth.uid() = user_id OR auth.uid() = talent_id
    );

CREATE POLICY "Users can create conversations" ON public.conversations
    FOR INSERT WITH CHECK (
        auth.uid() = user_id OR auth.uid() = talent_id
    );

CREATE POLICY "Users can update their own conversations" ON public.conversations
    FOR UPDATE USING (
        auth.uid() = user_id OR auth.uid() = talent_id
    );

-- RLS Policies for messages
CREATE POLICY "Users can view messages in their conversations" ON public.messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.conversations 
            WHERE id = conversation_id 
            AND (user_id = auth.uid() OR talent_id = auth.uid())
        )
    );

CREATE POLICY "Users can create messages in their conversations" ON public.messages
    FOR INSERT WITH CHECK (
        auth.uid() = sender_id AND
        EXISTS (
            SELECT 1 FROM public.conversations 
            WHERE id = conversation_id 
            AND (user_id = auth.uid() OR talent_id = auth.uid())
        )
    );

CREATE POLICY "Users can update their own messages" ON public.messages
    FOR UPDATE USING (
        auth.uid() = sender_id OR
        EXISTS (
            SELECT 1 FROM public.conversations 
            WHERE id = conversation_id 
            AND (user_id = auth.uid() OR talent_id = auth.uid())
        )
    );

-- Function to update conversation last_message and timestamp
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.conversations 
    SET 
        last_message = NEW.content,
        last_message_at = NEW.created_at,
        updated_at = NOW(),
        -- Increment unread count for the recipient
        user_unread_count = CASE 
            WHEN NEW.sender_id != user_id THEN user_unread_count + 1 
            ELSE user_unread_count 
        END,
        talent_unread_count = CASE 
            WHEN NEW.sender_id != talent_id THEN talent_unread_count + 1 
            ELSE talent_unread_count 
        END
    WHERE id = NEW.conversation_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update conversation when new message is added
CREATE TRIGGER trigger_update_conversation_last_message
    AFTER INSERT ON public.messages
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_last_message();

-- Function to mark messages as read
CREATE OR REPLACE FUNCTION mark_messages_as_read(
    conversation_uuid UUID,
    reader_uuid UUID
)
RETURNS void AS $$
BEGIN
    -- Mark messages as read
    UPDATE public.messages 
    SET 
        is_read = true,
        read_at = NOW(),
        updated_at = NOW()
    WHERE 
        conversation_id = conversation_uuid 
        AND sender_id != reader_uuid 
        AND is_read = false;
    
    -- Reset unread count for the reader
    UPDATE public.conversations 
    SET 
        user_unread_count = CASE 
            WHEN user_id = reader_uuid THEN 0 
            ELSE user_unread_count 
        END,
        talent_unread_count = CASE 
            WHEN talent_id = reader_uuid THEN 0 
            ELSE talent_unread_count 
        END,
        updated_at = NOW()
    WHERE id = conversation_uuid;
END;
$$ LANGUAGE plpgsql;

-- Function to get or create conversation
CREATE OR REPLACE FUNCTION get_or_create_conversation(
    user_uuid UUID,
    talent_uuid UUID
)
RETURNS UUID AS $$
DECLARE
    conversation_uuid UUID;
BEGIN
    -- Try to find existing conversation
    SELECT id INTO conversation_uuid
    FROM public.conversations
    WHERE (user_id = user_uuid AND talent_id = talent_uuid)
       OR (user_id = talent_uuid AND talent_id = user_uuid);
    
    -- If no conversation exists, create one
    IF conversation_uuid IS NULL THEN
        INSERT INTO public.conversations (user_id, talent_id)
        VALUES (user_uuid, talent_uuid)
        RETURNING id INTO conversation_uuid;
    END IF;
    
    RETURN conversation_uuid;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT ALL ON public.conversations TO authenticated;
GRANT ALL ON public.messages TO authenticated;
GRANT EXECUTE ON FUNCTION mark_messages_as_read TO authenticated;
GRANT EXECUTE ON FUNCTION get_or_create_conversation TO authenticated;
