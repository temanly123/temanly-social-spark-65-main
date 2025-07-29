import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { Search, Database, Eye } from 'lucide-react';

const DatabaseInspector = () => {
  const [userId, setUserId] = useState('');
  const [userData, setUserData] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const inspectUser = async () => {
    if (!userId.trim()) return;
    
    try {
      setLoading(true);
      console.log('🔍 [DatabaseInspector] Inspecting user:', userId);

      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.error('❌ Profile error:', profileError);
      }

      // Get user documents
      const { data: docs, error: docsError } = await supabase
        .from('verification_documents')
        .select('*')
        .eq('user_id', userId);

      if (docsError) {
        console.error('❌ Documents error:', docsError);
      }

      console.log('📊 [DatabaseInspector] Results:', {
        profile,
        documents: docs,
        documentCount: docs?.length || 0
      });

      setUserData(profile);
      setDocuments(docs || []);

    } catch (error) {
      console.error('❌ [DatabaseInspector] Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const inspectByEmail = async (email: string) => {
    try {
      setLoading(true);
      console.log('🔍 [DatabaseInspector] Finding user by email:', email);

      // Get user by email
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email)
        .single();

      if (profileError) {
        console.error('❌ Profile error:', profileError);
        return;
      }

      if (profile) {
        setUserId(profile.id);
        await inspectUser();
      }

    } catch (error) {
      console.error('❌ [DatabaseInspector] Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="w-5 h-5" />
          Database Inspector
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Enter User ID or Email"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
          />
          <Button onClick={inspectUser} disabled={loading}>
            <Search className="w-4 h-4 mr-2" />
            Inspect
          </Button>
        </div>

        <div className="flex gap-2">
          <Button 
            onClick={() => inspectByEmail('angela.soenoko@gmail.com')} 
            disabled={loading}
            variant="outline"
            size="sm"
          >
            Check Amanda
          </Button>
          <Button 
            onClick={() => inspectByEmail('haryis.prasetya@gmail.com')} 
            disabled={loading}
            variant="outline"
            size="sm"
          >
            Check Test User
          </Button>
        </div>

        {userData && (
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded">
              <h3 className="font-semibold mb-2">User Profile:</h3>
              <pre className="text-xs overflow-auto">
                {JSON.stringify(userData, null, 2)}
              </pre>
            </div>

            <div className="bg-green-50 p-4 rounded">
              <h3 className="font-semibold mb-2">Documents ({documents.length}):</h3>
              {documents.length === 0 ? (
                <p className="text-red-600">No documents found in verification_documents table</p>
              ) : (
                documents.map((doc, index) => (
                  <div key={index} className="mb-4 p-3 bg-white rounded border">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div><strong>Type:</strong> {doc.document_type}</div>
                      <div><strong>Status:</strong> {doc.status}</div>
                      <div><strong>File Name:</strong> {doc.file_name}</div>
                      <div><strong>File Size:</strong> {doc.file_size}</div>
                      <div><strong>Content Type:</strong> {doc.content_type}</div>
                      <div><strong>Created:</strong> {new Date(doc.created_at).toLocaleString()}</div>
                    </div>
                    <div className="mt-2">
                      <strong>Document URL:</strong>
                      <div className="text-xs bg-gray-100 p-2 rounded mt-1">
                        {doc.document_url ? (
                          <>
                            <div>Length: {doc.document_url.length}</div>
                            <div>Starts with: {doc.document_url.substring(0, 50)}...</div>
                            <div>Is Base64: {doc.document_url.startsWith('data:image/') ? '✅ YES' : '❌ NO'}</div>
                            {doc.document_url.startsWith('data:image/') && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  const newWindow = window.open();
                                  if (newWindow) {
                                    newWindow.document.write(`<img src="${doc.document_url}" style="max-width: 100%; height: auto;" />`);
                                  }
                                }}
                                className="mt-2"
                              >
                                <Eye className="w-3 h-3 mr-1" />
                                View Image
                              </Button>
                            )}
                          </>
                        ) : (
                          <span className="text-red-600">NULL or empty</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DatabaseInspector;
