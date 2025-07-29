
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Clock, Shield } from 'lucide-react';
import Header from '@/components/Header';

const TalentRegisterSuccess = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      <Header 
        title="Registrasi Berhasil!" 
        subtitle="Selamat bergabung dengan komunitas talent Temanly"
        showLogo={false}
      />

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className="shadow-lg">
          <CardHeader className="text-center space-y-4">
            <img 
              src="/lovable-uploads/2b715270-d5ae-4f6c-be60-2dfaf1662139.png" 
              alt="Temanly Logo"
              className="h-12 mx-auto"
            />
            <div className="flex justify-center">
              <CheckCircle className="w-16 h-16 text-green-500" />
            </div>
            <CardTitle className="text-2xl text-green-600">
              Registrasi Berhasil!
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="text-center space-y-4">
              <p className="text-lg text-gray-700">
                Terima kasih telah mendaftar sebagai talent di Temanly!
              </p>
              <p className="text-gray-600">
                Data Anda telah berhasil diterima dan sedang dalam proses verifikasi.
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-3 mb-3">
                <Clock className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-blue-800">Proses Verifikasi</h3>
              </div>
              <p className="text-blue-700 text-sm">
                Tim kami akan memverifikasi dokumen identitas Anda dalam waktu 1-2 hari kerja. 
                Kami akan mengirimkan notifikasi melalui email dan WhatsApp setelah verifikasi selesai.
              </p>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center space-x-3 mb-3">
                <Shield className="w-5 h-5 text-purple-600" />
                <h3 className="font-semibold text-purple-800">Langkah Selanjutnya</h3>
              </div>
              <ul className="text-purple-700 text-sm space-y-1">
                <li>• Pastikan WhatsApp Anda aktif untuk notifikasi</li>
                <li>• Siapkan foto profil terbaik Anda</li>
                <li>• Pelajari tips menjadi talent sukses di komunitas kami</li>
              </ul>
            </div>

            <div className="space-y-3">
              <Button asChild className="w-full bg-purple-500 hover:bg-purple-600">
                <Link to="/">
                  Kembali ke Beranda
                </Link>
              </Button>
              
              <Button asChild variant="outline" className="w-full">
                <Link to="/how-it-works">
                  Pelajari Cara Kerja Temanly
                </Link>
              </Button>
            </div>

            <div className="text-center text-sm text-gray-500">
              <p>
                Ada pertanyaan? Hubungi kami di{' '}
                <Link to="/contact" className="text-purple-600 hover:underline">
                  halaman kontak
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TalentRegisterSuccess;
