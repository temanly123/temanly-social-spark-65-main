
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, Users, User } from 'lucide-react';

interface VerificationRequiredBannerProps {
  userType: 'user' | 'companion';
}

const VerificationRequiredBanner: React.FC<VerificationRequiredBannerProps> = ({ userType }) => {
  return (
    <Card className="border-blue-200 bg-blue-50 mb-6">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <AlertTriangle className="w-6 h-6 text-blue-600 mt-1" />
          <div className="flex-1">
            <h3 className="font-semibold text-blue-800 mb-4">
              ℹ️ Kriteria Pengguna Platform
            </h3>
            
            <div className="space-y-4">
              <div className="bg-white rounded-lg p-4 border border-blue-200">
                <div className="flex items-center gap-3 mb-3">
                  <Users className="w-5 h-5 text-blue-600" />
                  <h4 className="font-semibold text-blue-800">User (Client)</h4>
                </div>
                <p className="text-blue-700">
                  • Pria & wanita usia <strong>21–45 tahun</strong>
                </p>
              </div>
              
              <div className="bg-white rounded-lg p-4 border border-blue-200">
                <div className="flex items-center gap-3 mb-3">
                  <User className="w-5 h-5 text-purple-600" />
                  <h4 className="font-semibold text-purple-800">Talent (Talent)</h4>
                </div>
                <p className="text-purple-700">
                  • Perempuan atau Laki-laki usia <strong>21–30 tahun</strong>
                </p>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600">
                💡 Pastikan Anda memenuhi kriteria usia yang sesuai sebelum melakukan registrasi.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default VerificationRequiredBanner;
