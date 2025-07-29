
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Footer from '@/components/Footer';

const Privacy = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <img 
                src="/lovable-uploads/a8b92c73-b6d3-423f-9e71-b61f792f8a7a.png" 
                alt="Temanly Logo"
                className="h-10 w-auto"
              />
            </Link>
            <Link to="/">
              <Button variant="ghost">← Kembali ke Beranda</Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 mb-8 text-center">
            Kebijakan Privasi
          </h1>
          
          <div className="bg-white rounded-lg shadow-lg p-8 space-y-8">
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Informasi yang Kami Kumpulkan</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Kami mengumpulkan informasi yang Anda berikan secara langsung kepada kami, seperti saat Anda membuat akun, melengkapi profil, atau menghubungi kami.
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>Informasi pribadi (nama, email, nomor telepon)</li>
                <li>Informasi profil (foto, deskripsi, preferensi)</li>
                <li>Informasi lokasi untuk mencocokkan layanan</li>
                <li>Riwayat transaksi dan komunikasi</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Bagaimana Kami Menggunakan Informasi</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Informasi yang kami kumpulkan digunakan untuk:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>Menyediakan dan meningkatkan layanan kami</li>
                <li>Memfasilitasi koneksi antar pengguna</li>
                <li>Memproses pembayaran dan transaksi</li>
                <li>Komunikasi terkait layanan</li>
                <li>Keamanan dan pencegahan penipuan</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Berbagi Informasi</h2>
              <p className="text-gray-700 leading-relaxed">
                Kami tidak menjual, menyewakan, atau membagikan informasi pribadi Anda kepada pihak ketiga untuk tujuan pemasaran tanpa persetujuan eksplisit Anda. Kami hanya membagikan informasi dalam situasi berikut:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 mt-4">
                <li>Dengan persetujuan Anda</li>
                <li>Untuk memenuhi kewajiban hukum</li>
                <li>Dengan penyedia layanan terpercaya</li>
                <li>Untuk melindungi hak dan keamanan</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Keamanan Data</h2>
              <p className="text-gray-700 leading-relaxed">
                Kami menerapkan langkah-langkah keamanan teknis dan organisasi yang sesuai untuk melindungi informasi pribadi Anda dari akses tidak sah, perubahan, pengungkapan, atau penghancuran.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Hak Anda</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Anda memiliki hak untuk:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>Mengakses dan memperbarui informasi pribadi</li>
                <li>Menghapus akun dan data pribadi</li>
                <li>Membatasi pemrosesan data</li>
                <li>Meminta salinan data Anda</li>
                <li>Mengajukan keluhan terkait privasi</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Cookies dan Teknologi Pelacakan</h2>
              <p className="text-gray-700 leading-relaxed">
                Kami menggunakan cookies dan teknologi serupa untuk meningkatkan pengalaman pengguna, menganalisis penggunaan platform, dan menyediakan konten yang relevan.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Perubahan Kebijakan</h2>
              <p className="text-gray-700 leading-relaxed">
                Kami dapat memperbarui kebijakan privasi ini dari waktu ke waktu. Perubahan akan diberitahukan melalui platform atau email.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Hubungi Kami</h2>
              <p className="text-gray-700 leading-relaxed">
                Jika Anda memiliki pertanyaan tentang kebijakan privasi ini, silakan hubungi kami di privacy@temanly.com
              </p>
            </section>
          </div>

          <p className="text-center text-gray-500 mt-8">
            Terakhir diperbarui: Desember 2024
          </p>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Privacy;
