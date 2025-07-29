import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://enyrffgedfvgunokpmqk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVueXJmZmdlZGZ2Z3Vub2twbXFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5NzMwMTIsImV4cCI6MjA2NTU0OTAxMn0.Wz--lkPdrmaT6nO7_JMRfC7oWJQqhajjcNNQThV1DD8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDocumentRetrieval() {
  console.log('🔍 Testing document retrieval...');
  
  try {
    // 1. Check all verification documents
    console.log('\n1. Checking all verification documents:');
    const { data: allDocs, error: allDocsError } = await supabase
      .from('verification_documents')
      .select('*');
    
    if (allDocsError) {
      console.error('❌ Error fetching all documents:', allDocsError);
    } else {
      console.log(`✅ Found ${allDocs?.length || 0} total documents`);
      allDocs?.forEach(doc => {
        console.log(`  - ${doc.document_type} for user ${doc.user_id} (${doc.status})`);
      });
    }

    // 2. Check Amanda's documents specifically
    console.log('\n2. Checking Amanda\'s documents:');
    const amandaId = '9153fe0a-6b65-4011-b894-f7568b8abe44';
    const { data: amandaDocs, error: amandaError } = await supabase
      .from('verification_documents')
      .select('*')
      .eq('user_id', amandaId);
    
    if (amandaError) {
      console.error('❌ Error fetching Amanda\'s documents:', amandaError);
    } else {
      console.log(`✅ Found ${amandaDocs?.length || 0} documents for Amanda`);
      amandaDocs?.forEach(doc => {
        console.log(`  - ${doc.document_type}: ${doc.status} (URL length: ${doc.document_url?.length || 0})`);
      });
    }

    // 3. Check Amanda's profile
    console.log('\n3. Checking Amanda\'s profile:');
    const { data: amandaProfile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', amandaId)
      .single();
    
    if (profileError) {
      console.error('❌ Error fetching Amanda\'s profile:', profileError);
    } else {
      console.log('✅ Amanda\'s profile:', {
        id: amandaProfile.id,
        email: amandaProfile.email,
        name: amandaProfile.name,
        verification_status: amandaProfile.verification_status,
        user_type: amandaProfile.user_type
      });
    }

    // 4. Check all companion profiles
    console.log('\n4. Checking all companion profiles:');
    const { data: companions, error: companionsError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_type', 'companion');
    
    if (companionsError) {
      console.error('❌ Error fetching companions:', companionsError);
    } else {
      console.log(`✅ Found ${companions?.length || 0} companion profiles`);
      companions?.forEach(profile => {
        console.log(`  - ${profile.name} (${profile.email}) - ${profile.verification_status}`);
      });
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testDocumentRetrieval();
