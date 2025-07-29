
import React from 'react';
import TalentRegistrationForm from '@/components/TalentRegistrationForm';

const TalentRegister = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-pink-50 py-8 px-4">
      <div className="container mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Bergabung dengan Temanly
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto mb-4">
            Platform hybrid rental talent & pengalaman sosial fleksibel. 
            Dapatkan penghasilan dengan menjadi teman virtual maupun offline untuk berbagai kebutuhan sosial.
          </p>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border max-w-4xl mx-auto mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">💰 Potensi Penghasilan</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="text-center p-3 bg-blue-50 rounded">
                <div className="font-semibold text-blue-900">Chat & Call</div>
                <div className="text-blue-700">Rp 25k - 65k/hari</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded">
                <div className="font-semibold text-green-900">Offline Date</div>
                <div className="text-green-700">Rp 285k/3 jam</div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded">
                <div className="font-semibold text-purple-900">Party Buddy</div>
                <div className="text-purple-700">Rp 1jt/event</div>
              </div>
            </div>
            <div className="mt-4 text-sm text-gray-600">
              <strong>Komisi:</strong> Fresh 20% • Elite 18% • VIP 15% | <strong>Target:</strong> Usia 21-30 tahun, aktif di sosial media
            </div>
          </div>
        </div>
        
        <TalentRegistrationForm />
        
        <div className="text-center mt-8 text-sm text-gray-600">
          <p>
            Sudah punya akun? {' '}
            <a href="/login" className="text-blue-600 hover:underline">
              Login di sini
            </a>
          </p>
          <p className="mt-2 text-xs text-gray-500">
            Dengan mendaftar, Anda menyetujui bahwa Anda berusia minimal 21 tahun dan menyetujui syarat & ketentuan Temanly.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TalentRegister;
