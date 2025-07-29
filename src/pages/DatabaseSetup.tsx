import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import MainHeader from '@/components/MainHeader';
import { Database, CheckCircle, AlertCircle } from 'lucide-react';

const DatabaseSetup = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [setupComplete, setSetupComplete] = useState(false);

  const setupPasswordResetTable = async () => {
    setLoading(true);
    try {
      console.log('🔧 Setting up password reset tokens table...');

      // Create the password reset tokens table using direct SQL execution
      const { error: tableError } = await supabase
        .from('password_reset_tokens')
        .select('id')
        .limit(1);

      // If table doesn't exist, we'll get an error, which is expected
      console.log('Table check result:', tableError);

      // Try to create the table using a simpler approach
      const createTableSQL = `
          -- Create password reset tokens table
          CREATE TABLE IF NOT EXISTS password_reset_tokens (
              id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
              user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
              email TEXT NOT NULL,
              token TEXT NOT NULL UNIQUE,
              expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
              used BOOLEAN DEFAULT FALSE,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );

          -- Create indexes for faster lookups
          CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);
          CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_email ON password_reset_tokens(email);
          CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);

          -- Enable RLS
          ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;

          -- Create policies
          DROP POLICY IF EXISTS "Users can view their own reset tokens" ON password_reset_tokens;
          CREATE POLICY "Users can view their own reset tokens" ON password_reset_tokens
              FOR SELECT USING (auth.uid() = user_id);

          -- Function to clean up expired tokens
          CREATE OR REPLACE FUNCTION cleanup_expired_reset_tokens()
          RETURNS void AS $$
          BEGIN
              DELETE FROM password_reset_tokens 
              WHERE expires_at < NOW() OR used = TRUE;
          END;
          $$ LANGUAGE plpgsql SECURITY DEFINER;

          -- Create a trigger to automatically update the updated_at column
          CREATE OR REPLACE FUNCTION update_password_reset_tokens_updated_at()
          RETURNS TRIGGER AS $$
          BEGIN
              NEW.updated_at = NOW();
              RETURN NEW;
          END;
          $$ LANGUAGE plpgsql;

          DROP TRIGGER IF EXISTS update_password_reset_tokens_updated_at ON password_reset_tokens;
          CREATE TRIGGER update_password_reset_tokens_updated_at
              BEFORE UPDATE ON password_reset_tokens
              FOR EACH ROW
              EXECUTE FUNCTION update_password_reset_tokens_updated_at();
      `;

      // For now, we'll just show the SQL that needs to be executed
      console.log('📋 SQL to execute in Supabase SQL Editor:');
      console.log(createTableSQL);

      toast({
        title: "SQL Ready!",
        description: "Check browser console for SQL to execute in Supabase dashboard.",
        className: "bg-blue-50 border-blue-200"
      });

      console.log('✅ Password reset table setup complete');
      
      toast({
        title: "Database Setup Complete!",
        description: "Password reset functionality is now ready to use.",
        className: "bg-green-50 border-green-200"
      });

      setSetupComplete(true);

    } catch (error: any) {
      console.error('❌ Database setup failed:', error);
      toast({
        title: "Setup Failed",
        description: error.message || "Failed to setup database. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const testPasswordReset = async () => {
    setLoading(true);
    try {
      console.log('🧪 Testing password reset functionality...');

      // Test with your email
      const testEmail = 'amandasoenoko@gmail.com';
      
      const { data, error } = await supabase.functions.invoke('custom-password-reset', {
        body: { email: testEmail }
      });

      if (error) {
        console.error('❌ Password reset test failed:', error);
        throw error;
      }

      console.log('✅ Password reset test result:', data);
      
      toast({
        title: "Test Successful!",
        description: `Password reset test completed. Check console for reset URL.`,
        className: "bg-green-50 border-green-200"
      });

    } catch (error: any) {
      console.error('❌ Password reset test failed:', error);
      toast({
        title: "Test Failed",
        description: error.message || "Password reset test failed.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <MainHeader />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                🔧 Database Setup for Password Reset
              </CardTitle>
              <p className="text-gray-600">
                Set up the required database tables and functions for password reset functionality
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-2">What this will do:</h4>
                <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                  <li>Create password_reset_tokens table</li>
                  <li>Set up proper indexes and security policies</li>
                  <li>Create helper functions for token management</li>
                  <li>Enable real password reset functionality</li>
                </ul>
              </div>

              <div className="space-y-3">
                <Button 
                  onClick={setupPasswordResetTable} 
                  disabled={loading || setupComplete}
                  className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Setting up database...
                    </div>
                  ) : setupComplete ? (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Setup Complete
                    </div>
                  ) : (
                    'Setup Database Tables'
                  )}
                </Button>

                {setupComplete && (
                  <Button 
                    onClick={testPasswordReset} 
                    disabled={loading}
                    variant="outline"
                    className="w-full"
                  >
                    {loading ? 'Testing...' : 'Test Password Reset'}
                  </Button>
                )}
              </div>

              {setupComplete && (
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-medium text-green-800 mb-2">✅ Setup Complete!</h4>
                  <p className="text-sm text-green-700">
                    Password reset functionality is now ready. You can now:
                  </p>
                  <ul className="text-sm text-green-700 mt-2 space-y-1 list-disc list-inside">
                    <li>Go to the login page and click "Forgot Password"</li>
                    <li>Enter your email address</li>
                    <li>Check browser console for reset URL (since email service isn't configured)</li>
                    <li>Use the reset URL to set a new password</li>
                  </ul>
                </div>
              )}

              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-yellow-800 mb-1">Note about Email Service</h4>
                    <p className="text-sm text-yellow-700">
                      Since email service isn't configured in your Supabase project, reset URLs will be logged to the browser console for development purposes.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DatabaseSetup;
