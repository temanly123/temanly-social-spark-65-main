// Test script to check document approval functionality
// Run this with: node test-document-approval.js

import { createClient } from '@supabase/supabase-js';

// Use your actual Supabase credentials
const supabaseUrl = 'https://enyrffgedfvgunokpmqk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVueXJmZmdlZGZ2Z3Vub2twbXFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5NzMwMTIsImV4cCI6MjA2NTU0OTAxMn0.Wz--lkPdrmaT6nO7_JMRfC7oWJQqhajjcNNQThV1DD8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDocumentApproval() {
  console.log('🔍 Testing document approval functionality...');
  
  try {
    // 1. Get a pending document
    console.log('📋 Fetching pending documents...');
    const { data: documents, error: fetchError } = await supabase
      .from('verification_documents')
      .select('*')
      .eq('status', 'pending')
      .limit(1);
    
    if (fetchError) {
      console.error('❌ Error fetching documents:', fetchError);
      return;
    }
    
    if (!documents || documents.length === 0) {
      console.log('ℹ️ No pending documents found');
      return;
    }
    
    const testDoc = documents[0];
    console.log('📄 Found test document:', testDoc.id);
    
    // 2. Test admin function
    console.log('🔧 Testing admin function...');
    const { data: functionResult, error: functionError } = await supabase
      .rpc('admin_update_verification_document', {
        doc_id: testDoc.id,
        new_status: 'approved',
        notes: 'Test approval via script'
      });
    
    if (functionError) {
      console.log('❌ Admin function failed:', functionError);
      
      // 3. Test direct update with 'approved'
      console.log('🔄 Testing direct update with "approved"...');
      const { error: approvedError } = await supabase
        .from('verification_documents')
        .update({ status: 'approved' })
        .eq('id', testDoc.id);
      
      if (approvedError) {
        console.log('❌ Direct "approved" update failed:', approvedError);
        
        // 4. Test direct update with 'verified'
        console.log('🔄 Testing direct update with "verified"...');
        const { error: verifiedError } = await supabase
          .from('verification_documents')
          .update({ status: 'verified' })
          .eq('id', testDoc.id);
        
        if (verifiedError) {
          console.log('❌ Direct "verified" update failed:', verifiedError);
          console.log('💡 Possible solutions:');
          console.log('   1. Check database constraints');
          console.log('   2. Verify admin permissions');
          console.log('   3. Check RLS policies');
        } else {
          console.log('✅ Success with "verified" status!');
          console.log('💡 The database expects "verified" not "approved"');
        }
      } else {
        console.log('✅ Success with "approved" status!');
      }
    } else {
      console.log('✅ Admin function succeeded:', functionResult);
    }
    
    // 5. Check final status
    const { data: finalDoc } = await supabase
      .from('verification_documents')
      .select('status')
      .eq('id', testDoc.id)
      .single();
    
    console.log('📊 Final document status:', finalDoc?.status);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testDocumentApproval();
