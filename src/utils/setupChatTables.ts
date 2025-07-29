import { supabase } from '@/integrations/supabase/client';

export async function fixChatTables() {
  try {
    console.log('🔧 Fixing chat tables...');

    // Add is_read column if it doesn't exist
    console.log('🔧 Adding is_read column if missing...');
    const addColumnSQL = `
      ALTER TABLE messages
      ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT false;
    `;

    const { error: columnError } = await supabase.rpc('exec_sql', { sql: addColumnSQL });
    if (columnError) {
      console.log('⚠️ Adding is_read column may have failed:', columnError.message);
    }

    // Create the mark_messages_as_read function
    console.log('🔧 Creating mark_messages_as_read function...');
    const functionSQL = `
      CREATE OR REPLACE FUNCTION mark_messages_as_read(conversation_uuid UUID, reader_uuid UUID)
      RETURNS void AS $$
      BEGIN
        UPDATE messages
        SET is_read = true, read_at = NOW()
        WHERE conversation_id = conversation_uuid
          AND sender_id != reader_uuid
          AND is_read = false;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `;

    const { error: funcError } = await supabase.rpc('exec_sql', { sql: functionSQL });
    if (funcError) {
      console.log('⚠️ Function creation may have failed:', funcError.message);
    }

    // Fix RLS policies
    console.log('🔧 Fixing RLS policies...');
    const rlsSQL = `
      -- Drop existing policies
      DROP POLICY IF EXISTS "Users can create messages in their conversations" ON messages;
      DROP POLICY IF EXISTS "Users can view messages in their conversations" ON messages;
      DROP POLICY IF EXISTS "Users can update messages in their conversations" ON messages;

      -- Create new policies with correct references
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

      CREATE POLICY "Users can update messages in their conversations" ON messages
        FOR UPDATE USING (
          EXISTS (
            SELECT 1 FROM conversations
            WHERE conversations.id = messages.conversation_id
            AND (conversations.participant1_id = auth.uid() OR conversations.participant2_id = auth.uid())
          )
        );
    `;

    const { error: rlsError } = await supabase.rpc('exec_sql', { sql: rlsSQL });
    if (rlsError) {
      console.log('⚠️ RLS policy update may have failed:', rlsError.message);
    }

    console.log('✅ Chat tables fixed successfully!');
    return true;
  } catch (error) {
    console.error('❌ Error fixing chat tables:', error);
    return false;
  }
}

export async function setupChatTables() {
  try {
    console.log('🚀 Setting up chat tables...');

    // Check if tables exist
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['conversations', 'messages']);

    if (tablesError) {
      console.log('⚠️ Could not check existing tables, proceeding with setup...');
    } else {
      const existingTables = tables?.map(t => t.table_name) || [];
      console.log('📋 Existing tables:', existingTables);
      
      if (existingTables.includes('conversations') && existingTables.includes('messages')) {
        console.log('✅ Chat tables already exist!');
        return true;
      }
    }

    // Create conversations table
    console.log('📝 Creating conversations table...');
    const conversationsSQL = `
      CREATE TABLE IF NOT EXISTS conversations (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        participant1_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
        participant2_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(participant1_id, participant2_id)
      );
    `;

    const { error: convError } = await supabase.rpc('exec_sql', { sql: conversationsSQL });
    if (convError) {
      console.log('⚠️ Conversations table creation may have failed:', convError.message);
    }

    // Create messages table
    console.log('📝 Creating messages table...');
    const messagesSQL = `
      CREATE TABLE IF NOT EXISTS messages (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
        sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        read_at TIMESTAMP WITH TIME ZONE,
        is_read BOOLEAN DEFAULT false,
        message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file'))
      );
    `;

    const { error: msgError } = await supabase.rpc('exec_sql', { sql: messagesSQL });
    if (msgError) {
      console.log('⚠️ Messages table creation may have failed:', msgError.message);
    }

    // Add is_read column if it doesn't exist
    console.log('🔧 Adding is_read column if missing...');
    const addColumnSQL = `
      ALTER TABLE messages
      ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT false;
    `;

    const { error: columnError } = await supabase.rpc('exec_sql', { sql: addColumnSQL });
    if (columnError) {
      console.log('⚠️ Adding is_read column may have failed:', columnError.message);
    }

    // Create the mark_messages_as_read function
    console.log('🔧 Creating mark_messages_as_read function...');
    const functionSQL = `
      CREATE OR REPLACE FUNCTION mark_messages_as_read(conversation_uuid UUID, reader_uuid UUID)
      RETURNS void AS $$
      BEGIN
        UPDATE messages
        SET is_read = true, read_at = NOW()
        WHERE conversation_id = conversation_uuid
          AND sender_id != reader_uuid
          AND is_read = false;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `;

    const { error: funcError } = await supabase.rpc('exec_sql', { sql: functionSQL });
    if (funcError) {
      console.log('⚠️ Function creation may have failed:', funcError.message);
    }

    // Create indexes
    console.log('📝 Creating indexes...');
    const indexesSQL = `
      CREATE INDEX IF NOT EXISTS idx_conversations_participant1 ON conversations(participant1_id);
      CREATE INDEX IF NOT EXISTS idx_conversations_participant2 ON conversations(participant2_id);
      CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations(updated_at DESC);
      CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
      CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
    `;

    const { error: indexError } = await supabase.rpc('exec_sql', { sql: indexesSQL });
    if (indexError) {
      console.log('⚠️ Index creation may have failed:', indexError.message);
    }

    // Enable RLS
    console.log('🔒 Enabling RLS...');
    const rlsSQL = `
      ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
      ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
    `;

    const { error: rlsError } = await supabase.rpc('exec_sql', { sql: rlsSQL });
    if (rlsError) {
      console.log('⚠️ RLS enabling may have failed:', rlsError.message);
    }

    console.log('✅ Chat tables setup completed!');
    return true;

  } catch (error) {
    console.error('❌ Error setting up chat tables:', error);
    return false;
  }
}

// Function to test if chat system is working
export async function testChatSystem() {
  try {
    console.log('🧪 Testing chat system...');

    // Test if we can query conversations table
    const { data, error } = await supabase
      .from('conversations')
      .select('id')
      .limit(1);

    if (error) {
      console.error('❌ Chat system test failed:', error);
      return false;
    }

    console.log('✅ Chat system is working!');
    return true;
  } catch (error) {
    console.error('❌ Chat system test error:', error);
    return false;
  }
}

// Function to recreate chat tables with correct foreign keys
export async function recreateChatTables() {
  try {
    console.log('🔧 Recreating chat tables with correct foreign keys...');

    // Drop existing tables
    console.log('🗑️ Dropping existing tables...');
    const dropSQL = `
      DROP TABLE IF EXISTS messages CASCADE;
      DROP TABLE IF EXISTS conversations CASCADE;
    `;

    const { error: dropError } = await supabase.rpc('exec_sql', { sql: dropSQL });
    if (dropError) {
      console.log('⚠️ Drop tables may have failed:', dropError.message);
    }

    // Now run the setup with correct foreign keys
    await setupChatTables();

    console.log('✅ Chat tables recreated successfully!');
    return true;
  } catch (error) {
    console.error('❌ Error recreating chat tables:', error);
    return false;
  }
}

// Auto-setup function that can be called from anywhere
export async function ensureChatTablesExist() {
  const isWorking = await testChatSystem();
  if (!isWorking) {
    console.log('🔧 Chat system not working, attempting setup...');
    await setupChatTables();
    const stillNotWorking = !(await testChatSystem());
    if (stillNotWorking) {
      console.log('🔧 Setup failed, trying to fix existing tables...');
      await recreateChatTables();
      return await testChatSystem();
    }
  }
  return true;
}
