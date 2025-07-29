
import React from 'react';
import ServiceSelector from '@/components/ServiceSelector';
import Footer from '@/components/Footer';
import MainHeader from '@/components/MainHeader';

const Services = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <MainHeader />

      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <section className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Our Services
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Choose the perfect service for your needs
          </p>
        </section>

        {/* Service Overview */}
        <section className="mb-12">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Layanan Temanly
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Dari chat virtual hingga pengalaman offline yang tak terlupakan,
              kami menyediakan berbagai layanan untuk kebutuhan sosial Anda.
            </p>
          </div>
        </section>

        {/* Services Grid */}
        <section className="mb-12">
          <ServiceSelector />
        </section>

        {/* Additional Info */}
        <section className="bg-white rounded-xl p-8 shadow-sm">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Informasi Penting</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h4 className="font-bold text-lg text-gray-900 mb-3">Biaya Platform</h4>
              <p className="text-gray-600 mb-4">
                Biaya aplikasi sebesar 10% dari total harga akan dibebankan kepada pengguna 
                untuk memastikan keamanan dan kualitas layanan.
              </p>
              
              <h4 className="font-bold text-lg text-gray-900 mb-3">Verifikasi</h4>
              <ul className="text-gray-600 space-y-2">
                <li>• Verifikasi KTP, email, dan WhatsApp diperlukan</li>
                <li>• User non-verified hanya bisa akses chat dan call</li>
                <li>• Offline date dan party buddy butuh verifikasi penuh</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold text-lg text-gray-900 mb-3">Keamanan</h4>
              <ul className="text-gray-600 space-y-2">
                <li>• Semua talent telah diverifikasi</li>
                <li>• Sistem rating dan review transparan</li>
                <li>• Customer support 24/7</li>
                <li>• Kebijakan zero tolerance untuk pelecehan</li>
              </ul>
              
              <h4 className="font-bold text-lg text-gray-900 mb-3 mt-6">Payment</h4>
              <ul className="text-gray-600 space-y-2">
                <li>• Pembayaran aman melalui berbagai metode</li>
                <li>• Refund policy berlaku untuk kasus tertentu</li>
                <li>• Transparansi biaya tanpa hidden fee</li>
              </ul>
            </div>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
};

export default Services;
