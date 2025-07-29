import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';

const AmandaDiagnostic = () => {
  const [results, setResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const addResult = (message: string) => {
    setResults(prev => [...prev, message]);
    console.log(message);
  };

  const runDiagnostic = async () => {
    setLoading(true);
    setResults([]);

    try {
      addResult('🔍 Starting Amanda diagnostic...');

      // 1. Check if Amanda exists by email
      addResult('📧 Checking for Amanda by email...');
      const { data: amandaByEmail, error: emailError } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', 'angela.soenoko@gmail.com');

      if (emailError) {
        addResult(`❌ Email query error: ${emailError.message}`);
      } else {
        addResult(`📊 Found ${amandaByEmail?.length || 0} profiles with email angela.soenoko@gmail.com`);
        if (amandaByEmail && amandaByEmail.length > 0) {
          amandaByEmail.forEach((profile, index) => {
            addResult(`  ${index + 1}. ID: ${profile.id}`);
            addResult(`     Name: ${profile.name}`);
            addResult(`     User Type: ${profile.user_type}`);
            addResult(`     Verification Status: ${profile.verification_status}`);
            addResult(`     Status: ${profile.status}`);
            addResult(`     Available Services: ${JSON.stringify(profile.profile_data?.available_services)}`);
            addResult(`     Interests: ${JSON.stringify(profile.profile_data?.interests)}`);
          });
        }
      }

      // 2. Check by specific ID
      addResult('🆔 Checking for Amanda by specific ID...');
      const { data: amandaById, error: idError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', '9153fe0a-6b65-4011-b894-f7568b8abe44');

      if (idError) {
        addResult(`❌ ID query error: ${idError.message}`);
      } else {
        addResult(`📊 Found ${amandaById?.length || 0} profiles with ID 9153fe0a-6b65-4011-b894-f7568b8abe44`);
        if (amandaById && amandaById.length > 0) {
          const profile = amandaById[0];
          addResult(`✅ Amanda found:`);
          addResult(`   Name: ${profile.name}`);
          addResult(`   Email: ${profile.email}`);
          addResult(`   User Type: ${profile.user_type}`);
          addResult(`   Verification Status: ${profile.verification_status}`);
          addResult(`   Status: ${profile.status}`);
          addResult(`   Is Available: ${profile.is_available}`);
          addResult(`   Profile Data: ${JSON.stringify(profile.profile_data, null, 2)}`);
        }
      }

      // 3. Test the exact Browse Talents query
      addResult('🔍 Testing exact Browse Talents query...');
      const { data: browseQuery, error: browseError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_type', 'companion')
        .eq('verification_status', 'verified')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (browseError) {
        addResult(`❌ Browse query error: ${browseError.message}`);
      } else {
        addResult(`📊 Browse query returned: ${browseQuery?.length || 0} results`);
        if (browseQuery && browseQuery.length > 0) {
          browseQuery.forEach((talent, index) => {
            addResult(`  ${index + 1}. ${talent.name} (${talent.email})`);
            addResult(`     Services: ${JSON.stringify(talent.profile_data?.available_services)}`);
          });
        }
      }

      // 4. Check all companions regardless of status
      addResult('👥 Checking all companions...');
      const { data: allCompanions, error: allError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_type', 'companion');

      if (allError) {
        addResult(`❌ All companions query error: ${allError.message}`);
      } else {
        addResult(`📊 Total companions in database: ${allCompanions?.length || 0}`);
        if (allCompanions && allCompanions.length > 0) {
          allCompanions.forEach((companion, index) => {
            addResult(`  ${index + 1}. ${companion.name} - Status: ${companion.status}, Verified: ${companion.verification_status}`);
          });
        }
      }

      addResult('🎉 Diagnostic completed!');
    } catch (error) {
      addResult(`💥 Unexpected error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🔍 Amanda Database Diagnostic
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button 
                onClick={runDiagnostic} 
                disabled={loading}
                className="w-full"
              >
                {loading ? 'Running Diagnostic...' : 'Run Amanda Diagnostic'}
              </Button>

              {results.length > 0 && (
                <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm max-h-96 overflow-y-auto">
                  {results.map((result, index) => (
                    <div key={index} className="mb-1">
                      {result}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AmandaDiagnostic;
