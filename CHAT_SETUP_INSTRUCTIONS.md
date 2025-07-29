# Chat System Setup Instructions

## Quick Fix for "Failed to start chat" Error

The chat system requires database tables to be created with correct foreign key references. Here are multiple ways to fix them:

### Method 1: Browser Console Fix (Easiest)

If you're getting foreign key constraint errors, run this fix:

1. Open your browser's Developer Tools (F12)
2. Go to the Console tab
3. Run this command to fix the tables:
   ```javascript
   await window.fixChatTables()
   ```
4. Test the chat system with:
   ```javascript
   await window.testChatSystem()
   ```

### Method 1b: Browser Console Setup (For New Installations)

1. Open your browser's Developer Tools (F12)
2. Go to the Console tab
3. Run this command:
   ```javascript
   await window.setupChatTables()
   ```
4. You should see messages indicating the tables are being created
5. Test the chat system with:
   ```javascript
   await window.testChatSystem()
   ```

### Method 2: Supabase SQL Editor (Recommended for Fixing)

1. Go to your Supabase dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `fix-chat-tables.sql` (this fixes foreign key issues)
4. Click "Run" to execute the SQL

### Method 2b: Supabase SQL Editor (For New Installations)

1. Go to your Supabase dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `setup-chat-tables.sql`
4. Click "Run" to execute the SQL

### Method 3: Manual SQL Execution

If you have direct database access, run the following SQL:

```sql
-- Create conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  participant1_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  participant2_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(participant1_id, participant2_id)
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE,
  message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file'))
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_conversations_participant1 ON conversations(participant1_id);
CREATE INDEX IF NOT EXISTS idx_conversations_participant2 ON conversations(participant2_id);
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);

-- Enable RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for conversations
CREATE POLICY "Users can view their own conversations" ON conversations
  FOR SELECT USING (
    auth.uid() = participant1_id OR auth.uid() = participant2_id
  );

CREATE POLICY "Users can create conversations" ON conversations
  FOR INSERT WITH CHECK (
    auth.uid() = participant1_id OR auth.uid() = participant2_id
  );

CREATE POLICY "Users can update their own conversations" ON conversations
  FOR UPDATE USING (
    auth.uid() = participant1_id OR auth.uid() = participant2_id
  );

-- RLS Policies for messages
CREATE POLICY "Users can view messages in their conversations" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE conversations.id = messages.conversation_id 
      AND (conversations.participant1_id = auth.uid() OR conversations.participant2_id = auth.uid())
    )
  );

CREATE POLICY "Users can create messages in their conversations" ON messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE conversations.id = messages.conversation_id 
      AND (conversations.participant1_id = auth.uid() OR conversations.participant2_id = auth.uid())
    )
  );

CREATE POLICY "Users can update their own messages" ON messages
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE conversations.id = messages.conversation_id 
      AND (conversations.participant1_id = auth.uid() OR conversations.participant2_id = auth.uid())
    )
  );

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
```

## Verification

After running any of the above methods, test the chat system:

1. Go to any talent profile page
2. Click the "Chat" button
3. You should be redirected to the chat page
4. Try sending a message

## Troubleshooting

If you still get errors:

1. Check browser console for detailed error messages
2. Verify you're logged in
3. Check Supabase dashboard for table creation
4. Ensure RLS policies are properly set

## Features Available After Setup

- ✅ Real-time messaging
- ✅ Chat from talent profiles
- ✅ Chat tabs in user/talent dashboards
- ✅ Conversation history
- ✅ Unread message counts
- ✅ Mobile-responsive design
