
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, Shield, IdCard, Mail, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface ServiceRestrictionNoticeProps {
  isVerified: boolean;
  restrictedServices: string[];
  variant?: 'booking' | 'profile' | 'general';
}

const ServiceRestrictionNotice: React.FC<ServiceRestrictionNoticeProps> = ({ 
  isVerified, 
  restrictedServices,
  variant = 'general'
}) => {
  if (isVerified || restrictedServices.length === 0) return null;

  const getVariantContent = () => {
    switch (variant) {
      case 'booking':
        return {
          title: '🔒 Verifikasi Diperlukan untuk Booking',
          description: `Anda mencoba booking ${restrictedServices.join(' dan ')}, namun layanan ini memerlukan verifikasi identitas terlebih dahulu.`,
          buttonText: 'Verifikasi Sekarang'
        };
      case 'profile':
        return {
          title: '⚠️ Status Verifikasi Anda',
          description: `Akun Anda belum terverifikasi. Untuk mengakses ${restrictedServices.join(' dan ')}, lengkapi verifikasi identitas.`,
          buttonText: 'Lengkapi Verifikasi'
        };
      default:
        return {
          title: 'Verifikasi Identitas Diperlukan',
          description: `Untuk booking ${restrictedServices.join(' dan ')}, Anda perlu menyelesaikan verifikasi identitas.`,
          buttonText: 'Mulai Verifikasi'
        };
    }
  };

  const content = getVariantContent();

  return (
    <Card className="border-yellow-200 bg-yellow-50 shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h4 className="font-medium text-yellow-800 mb-2">
              {content.title}
            </h4>
            <p className="text-sm text-yellow-700 mb-4">
              {content.description}
            </p>
            
            <div className="bg-white rounded-lg p-3 mb-4 border border-yellow-200">
              <p className="text-sm font-medium text-yellow-800 mb-2">
                Dokumen yang diperlukan untuk verifikasi:
              </p>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-yellow-700">
                  <IdCard className="w-4 h-4" />
                  KTP/ID Card (untuk verifikasi identitas)
                </div>
                <div className="flex items-center gap-2 text-sm text-yellow-700">
                  <Mail className="w-4 h-4" />
                  Verifikasi email aktif
                </div>
                <div className="flex items-center gap-2 text-sm text-yellow-700">
                  <Phone className="w-4 h-4" />
                  Verifikasi nomor WhatsApp
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2">
              <Link to="/signup" className="flex-1">
                <Button size="sm" className="bg-yellow-600 hover:bg-yellow-700 w-full">
                  <Shield className="w-4 h-4 mr-2" />
                  {content.buttonText}
                </Button>
              </Link>
              {variant === 'booking' && (
                <Link to="/services" className="flex-1">
                  <Button size="sm" variant="outline" className="w-full border-yellow-300 text-yellow-700 hover:bg-yellow-100">
                    Lihat Layanan Lain
                  </Button>
                </Link>
              )}
            </div>
            
            <p className="text-xs text-yellow-600 mt-3">
              💡 Setelah verifikasi selesai, Anda dapat mengakses semua layanan Temanly termasuk Offline Date dan Party Buddy.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ServiceRestrictionNotice;
