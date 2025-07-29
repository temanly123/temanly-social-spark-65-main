import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  User,
  Phone,
  Mail,
  IdCard,
  AlertCircle,
  Loader2,
  Trash2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface VerificationItem {
  id: string;
  name: string;
  email: string;
  phone: string;
  user_type: 'user' | 'companion';
  verification_status: 'pending' | 'verified' | 'rejected';
  ktp_verified: boolean;
  email_verified: boolean;
  whatsapp_verified: boolean;
  ktp_document_url?: string;
  admin_notes?: string;
  created_at: string;
  verification_submitted_at?: string;
}

const VerificationManager = () => {
  const [verifications, setVerifications] = useState<VerificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVerification, setSelectedVerification] = useState<VerificationItem | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchVerifications();
  }, []);

  const fetchVerifications = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .in('verification_status', ['pending', 'verified', 'rejected'])
        .order('verification_submitted_at', { ascending: false });

      if (error) {
        console.error('Error fetching verifications:', error);
        toast({
          title: "Error",
          description: "Failed to load verification requests",
          variant: "destructive"
        });
        return;
      }

      setVerifications(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerificationAction = async (
    verificationId: string, 
    action: 'approve' | 'reject',
    notes: string = ''
  ) => {
    try {
      setProcessing(true);

      const updateData = {
        verification_status: action === 'approve' ? 'verified' : 'rejected',
        admin_notes: notes,
        verified_at: action === 'approve' ? new Date().toISOString() : null,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', verificationId);

      if (error) {
        throw error;
      }

      // Send notification to user
      await supabase.functions.invoke('send-verification-result', {
        body: {
          user_id: verificationId,
          status: action === 'approve' ? 'approved' : 'rejected',
          notes: notes
        }
      });

      toast({
        title: `Verification ${action === 'approve' ? 'Approved' : 'Rejected'}`,
        description: `User verification has been ${action === 'approve' ? 'approved' : 'rejected'} successfully.`,
      });

      // Refresh the list
      await fetchVerifications();
      setSelectedVerification(null);
      setAdminNotes('');

    } catch (error) {
      console.error('Error processing verification:', error);
      toast({
        title: "Error",
        description: "Failed to process verification",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  // Standalone delete function for any verification
  const handleDeleteVerification = async (verificationId: string, verificationName: string) => {
    try {
      console.log('🗑️ [VerificationManager] Deleting verification:', verificationId);

      // Use the admin-delete-user edge function for complete cleanup
      const { data: deleteResult, error: deleteError } = await supabase.functions.invoke('admin-delete-user', {
        body: { userId: verificationId }
      });

      if (deleteError) {
        console.error('❌ [VerificationManager] Edge function error:', deleteError);

        // Fallback: Try direct database deletion
        console.log('🔄 [VerificationManager] Attempting fallback deletion...');

        // Delete from profiles table directly
        const { error: profileDeleteError } = await supabase
          .from('profiles')
          .delete()
          .eq('id', verificationId);

        if (profileDeleteError) {
          console.error('❌ [VerificationManager] Fallback profile deletion failed:', profileDeleteError);
          throw new Error('Failed to delete verification data: ' + profileDeleteError.message);
        }

        console.log('✅ [VerificationManager] Fallback deletion completed');
      } else {
        console.log('✅ [VerificationManager] Edge function deletion completed:', deleteResult);
      }

      // Remove from local state immediately
      setVerifications(prev => prev.filter(verification => verification.id !== verificationId));

      toast({
        title: "🗑️ Verifikasi Dihapus",
        description: `${verificationName} dan semua data terkait telah dihapus dari sistem.`,
        className: "bg-red-50 border-red-200"
      });

      // Refresh data to ensure consistency
      setTimeout(() => fetchVerifications(), 1000);

    } catch (error: any) {
      console.error('❌ Error deleting verification:', error);
      toast({
        title: "Error",
        description: "Gagal menghapus verifikasi: " + error.message,
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'verified':
        return <Badge variant="outline" className="text-green-600 border-green-600"><CheckCircle className="w-3 h-3 mr-1" />Verified</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="text-red-600 border-red-600"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getVerificationSteps = (verification: VerificationItem) => {
    return [
      { name: 'KTP Upload', completed: verification.ktp_verified, icon: IdCard },
      { name: 'Email Verification', completed: verification.email_verified, icon: Mail },
      { name: 'WhatsApp Verification', completed: verification.whatsapp_verified, icon: Phone }
    ];
  };

  const pendingVerifications = verifications.filter(v => v.verification_status === 'pending');
  const processedVerifications = verifications.filter(v => v.verification_status !== 'pending');

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin mr-2" />
          <span>Loading verifications...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Verification Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="pending" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="pending">
                Pending ({pendingVerifications.length})
              </TabsTrigger>
              <TabsTrigger value="processed">
                Processed ({processedVerifications.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="space-y-4">
              {pendingVerifications.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No pending verifications
                </div>
              ) : (
                pendingVerifications.map((verification) => (
                  <Card key={verification.id} className="border-l-4 border-l-yellow-500">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{verification.name}</h3>
                            <Badge variant={verification.user_type === 'companion' ? 'default' : 'secondary'}>
                              {verification.user_type === 'companion' ? 'Talent' : 'User'}
                            </Badge>
                            {getStatusBadge(verification.verification_status)}
                          </div>
                          <div className="text-sm text-gray-600">
                            <p>Email: {verification.email}</p>
                            <p>Phone: {verification.phone}</p>
                            <p>Submitted: {new Date(verification.verification_submitted_at || verification.created_at).toLocaleDateString()}</p>
                          </div>
                          <div className="flex gap-2">
                            {getVerificationSteps(verification).map((step, index) => (
                              <div key={index} className="flex items-center gap-1 text-xs">
                                <step.icon className={`w-3 h-3 ${step.completed ? 'text-green-600' : 'text-gray-400'}`} />
                                <span className={step.completed ? 'text-green-600' : 'text-gray-400'}>
                                  {step.name}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedVerification(verification);
                                  setAdminNotes(verification.admin_notes || '');
                                }}
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                Review
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Review Verification - {verification.name}</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="text-sm font-medium">Name</label>
                                    <p className="text-sm text-gray-600">{verification.name}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Type</label>
                                    <p className="text-sm text-gray-600">
                                      {verification.user_type === 'companion' ? 'Talent' : 'User'}
                                    </p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Email</label>
                                    <p className="text-sm text-gray-600">{verification.email}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Phone</label>
                                    <p className="text-sm text-gray-600">{verification.phone}</p>
                                  </div>
                                </div>

                                <div>
                                  <label className="text-sm font-medium">Verification Steps</label>
                                  <div className="mt-2 space-y-2">
                                    {getVerificationSteps(verification).map((step, index) => (
                                      <div key={index} className="flex items-center gap-2">
                                        <step.icon className={`w-4 h-4 ${step.completed ? 'text-green-600' : 'text-gray-400'}`} />
                                        <span className={`text-sm ${step.completed ? 'text-green-600' : 'text-gray-400'}`}>
                                          {step.name}
                                        </span>
                                        {step.completed ? (
                                          <CheckCircle className="w-4 h-4 text-green-600" />
                                        ) : (
                                          <XCircle className="w-4 h-4 text-gray-400" />
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {verification.ktp_document_url && (
                                  <div>
                                    <label className="text-sm font-medium">KTP Document</label>
                                    <div className="mt-2">
                                      <img 
                                        src={verification.ktp_document_url} 
                                        alt="KTP Document" 
                                        className="max-w-full h-auto border rounded"
                                      />
                                    </div>
                                  </div>
                                )}

                                <div>
                                  <label className="text-sm font-medium">Admin Notes</label>
                                  <Textarea
                                    value={adminNotes}
                                    onChange={(e) => setAdminNotes(e.target.value)}
                                    placeholder="Add notes about this verification..."
                                    rows={3}
                                  />
                                </div>

                                <div className="flex gap-2 pt-4">
                                  <Button
                                    onClick={() => handleVerificationAction(verification.id, 'approve', adminNotes)}
                                    disabled={processing}
                                    className="flex-1"
                                  >
                                    {processing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                                    Approve
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    onClick={() => handleVerificationAction(verification.id, 'reject', adminNotes)}
                                    disabled={processing}
                                    className="flex-1"
                                  >
                                    {processing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <XCircle className="w-4 h-4 mr-2" />}
                                    Reject
                                  </Button>
                                </div>

                                {/* Standalone Delete Button */}
                                <div className="mt-4 pt-4 border-t">
                                  <Button
                                    onClick={() => {
                                      const confirmMessage = `⚠️ PERINGATAN: Anda akan menghapus PERMANEN verifikasi ini!\n\nNama: ${verification.name}\nEmail: ${verification.email}\nTipe: ${verification.user_type === 'companion' ? 'Talent' : 'User'}\nStatus: ${verification.verification_status}\n\nSemua data termasuk:\n- Profil user\n- Dokumen verifikasi\n- Riwayat booking\n- Data transaksi\n- Review dan rating\n\nAksi ini TIDAK DAPAT DIBATALKAN!\n\nApakah Anda yakin ingin melanjutkan?`;

                                      if (window.confirm(confirmMessage)) {
                                        handleDeleteVerification(verification.id, verification.name);
                                      }
                                    }}
                                    variant="destructive"
                                    className="w-full bg-red-600 hover:bg-red-700"
                                    disabled={processing}
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    🗑️ Hapus Verifikasi Permanen
                                  </Button>
                                  <p className="text-xs text-red-600 text-center mt-2">
                                    ⚠️ Berbeda dengan reject, ini hanya menghapus data tanpa mengubah status
                                  </p>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="processed" className="space-y-4">
              {processedVerifications.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No processed verifications
                </div>
              ) : (
                processedVerifications.map((verification) => (
                  <Card key={verification.id} className={`border-l-4 ${
                    verification.verification_status === 'verified' ? 'border-l-green-500' : 'border-l-red-500'
                  }`}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{verification.name}</h3>
                            <Badge variant={verification.user_type === 'companion' ? 'default' : 'secondary'}>
                              {verification.user_type === 'companion' ? 'Talent' : 'User'}
                            </Badge>
                            {getStatusBadge(verification.verification_status)}
                          </div>
                          <div className="text-sm text-gray-600">
                            <p>Email: {verification.email}</p>
                            <p>Phone: {verification.phone}</p>
                            <p>Processed: {new Date(verification.verified_at || verification.updated_at).toLocaleDateString()}</p>
                            {verification.admin_notes && (
                              <p className="text-xs bg-gray-100 p-2 rounded mt-2">
                                <strong>Admin Notes:</strong> {verification.admin_notes}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="ml-4">
                          <Button
                            size="sm"
                            variant="destructive"
                            className="bg-red-600 hover:bg-red-700"
                            onClick={() => {
                              const confirmMessage = `⚠️ PERINGATAN: Anda akan menghapus PERMANEN verifikasi ini!\n\nNama: ${verification.name}\nEmail: ${verification.email}\nTipe: ${verification.user_type === 'companion' ? 'Talent' : 'User'}\nStatus: ${verification.verification_status}\n\nSemua data termasuk:\n- Profil user\n- Dokumen verifikasi\n- Riwayat booking\n- Data transaksi\n- Review dan rating\n\nAksi ini TIDAK DAPAT DIBATALKAN!\n\nApakah Anda yakin ingin melanjutkan?`;

                              if (window.confirm(confirmMessage)) {
                                handleDeleteVerification(verification.id, verification.name);
                              }
                            }}
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Hapus
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default VerificationManager;
