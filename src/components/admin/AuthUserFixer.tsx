import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Users, 
  UserPlus, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  Key,
  Mail
} from 'lucide-react';
import { createMissingAuthUsers, createAuthUserForEmail } from '@/utils/adminSetup';
import { useToast } from '@/hooks/use-toast';

const AuthUserFixer = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [singleEmail, setSingleEmail] = useState('');
  const [singlePassword, setSinglePassword] = useState('TempPassword123!');
  const [singleResult, setSingleResult] = useState<any>(null);
  const { toast } = useToast();

  const handleFixAllUsers = async () => {
    setIsLoading(true);
    setResults(null);
    
    try {
      const result = await createMissingAuthUsers();
      setResults(result);
      
      if (result.success) {
        toast({
          title: "Proses Selesai",
          description: result.message,
          className: "bg-green-50 border-green-200"
        });
      } else {
        toast({
          title: "Proses Gagal",
          description: result.error,
          variant: "destructive"
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFixSingleUser = async () => {
    if (!singleEmail.trim()) {
      toast({
        title: "Error",
        description: "Email harus diisi",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    setSingleResult(null);
    
    try {
      const result = await createAuthUserForEmail(singleEmail.trim(), singlePassword);
      setSingleResult(result);
      
      if (result.success) {
        toast({
          title: "Berhasil",
          description: `Auth user berhasil dibuat untuk ${singleEmail}`,
          className: "bg-green-50 border-green-200"
        });
      } else {
        toast({
          title: "Gagal",
          description: result.error,
          variant: "destructive"
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Auth User Fixer
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Tool ini mengatasi masalah user yang ada di database profiles tapi tidak bisa login karena tidak ada di Supabase Auth.
              Ini akan membuat auth user dengan password default untuk user yang belum punya akun auth.
            </AlertDescription>
          </Alert>

          {/* Fix All Users */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium">Perbaiki Semua User</h3>
                <p className="text-sm text-gray-600">
                  Scan semua profiles dan buat auth user untuk yang belum punya
                </p>
              </div>
              <Button 
                onClick={handleFixAllUsers}
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <UserPlus className="w-4 h-4 mr-2" />
                )}
                Perbaiki Semua
              </Button>
            </div>

            {results && (
              <div className="space-y-3">
                <div className="flex gap-4">
                  <Badge variant="outline" className="bg-blue-50">
                    Total: {results.stats?.total || 0}
                  </Badge>
                  <Badge variant="outline" className="bg-green-50">
                    Dibuat: {results.stats?.created || 0}
                  </Badge>
                  <Badge variant="outline" className="bg-yellow-50">
                    Dilewati: {results.stats?.skipped || 0}
                  </Badge>
                  <Badge variant="outline" className="bg-red-50">
                    Error: {results.stats?.errors || 0}
                  </Badge>
                </div>

                {results.results && results.results.length > 0 && (
                  <div className="max-h-60 overflow-y-auto border rounded-lg p-3 bg-gray-50">
                    <h4 className="font-medium mb-2">Detail Hasil:</h4>
                    {results.results.map((result: any, index: number) => (
                      <div key={index} className="flex items-center gap-2 text-sm py-1">
                        {result.success ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-600" />
                        )}
                        <span className="flex-1">{result.email}</span>
                        {result.success && result.password && (
                          <Badge variant="outline" className="text-xs">
                            Password: {result.password}
                          </Badge>
                        )}
                        {!result.success && (
                          <span className="text-red-600 text-xs">{result.error}</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <Separator />

          {/* Fix Single User */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium">Perbaiki User Tertentu</h3>
              <p className="text-sm text-gray-600">
                Buat auth user untuk email tertentu yang sudah ada di profiles
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    type="email"
                    placeholder="user@example.com"
                    value={singleEmail}
                    onChange={(e) => setSingleEmail(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Password</label>
                <div className="relative">
                  <Key className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Password default"
                    value={singlePassword}
                    onChange={(e) => setSinglePassword(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">&nbsp;</label>
                <Button 
                  onClick={handleFixSingleUser}
                  disabled={isLoading || !singleEmail.trim()}
                  className="w-full"
                >
                  {isLoading ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <UserPlus className="w-4 h-4 mr-2" />
                  )}
                  Buat Auth User
                </Button>
              </div>
            </div>

            {singleResult && (
              <Alert className={singleResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                {singleResult.success ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600" />
                )}
                <AlertDescription>
                  {singleResult.success ? (
                    <div>
                      <p>✅ Auth user berhasil dibuat untuk {singleEmail}</p>
                      <p className="text-sm mt-1">
                        <strong>User ID:</strong> {singleResult.userId}<br />
                        <strong>Password:</strong> {singleResult.password}
                      </p>
                    </div>
                  ) : (
                    <p>❌ {singleResult.error}</p>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </div>

          <Separator />

          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Catatan Penting:</strong>
              <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                <li>Password default yang dibuat adalah: <code>TempPassword123!</code></li>
                <li>User harus mengganti password setelah login pertama kali</li>
                <li>Tool ini hanya membuat auth user, tidak mengubah data profiles</li>
                <li>Pastikan email yang dimasukkan sudah ada di tabel profiles</li>
              </ul>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthUserFixer;
