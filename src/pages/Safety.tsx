
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, AlertTriangle, Phone, MessageSquare, CheckCircle, Users } from 'lucide-react';
import Footer from '@/components/Footer';
import MainHeader from '@/components/MainHeader';

const Safety = () => {
  const safetyFeatures = [
    {
      icon: <Shield className="w-12 h-12 text-blue-500" />,
      title: "Verifikasi Identitas",
      description: "Semua talent diverifikasi dengan KTP dan foto selfie untuk memastikan keaslian identitas"
    },
    {
      icon: <Users className="w-12 h-12 text-green-500" />,
      title: "Sistem Rating & Review",
      description: "Rating dan review dari pengguna membantu membangun kepercayaan dan transparansi"
    },
    {
      icon: <Phone className="w-12 h-12 text-red-500" />,
      title: "Dukungan 24/7",
      description: "Tim customer service siap membantu Anda kapan saja melalui WhatsApp dan email"
    },
    {
      icon: <MessageSquare className="w-12 h-12 text-purple-500" />,
      title: "Chat Monitoring",
      description: "Sistem monitoring otomatis untuk mendeteksi konten yang tidak pantas"
    },
    {
      icon: <CheckCircle className="w-12 h-12 text-teal-500" />,
      title: "Background Check",
      description: "Pemeriksaan latar belakang untuk talent level VIP dan Elite"
    },
    {
      icon: <AlertTriangle className="w-12 h-12 text-orange-500" />,
      title: "Sistem Pelaporan",
      description: "Fitur pelaporan cepat untuk melaporkan perilaku yang mencurigakan"
    }
  ];

  const safetyGuidelines = [
    {
      category: "Sebelum Bertemu",
      items: [
        "Selalu verifikasi identitas talent melalui video call terlebih dahulu",
        "Baca review dan rating dari pengguna lain dengan teliti",
        "Diskusikan ekspektasi dan batasan dengan jelas sebelum booking",
        "Jangan pernah memberikan informasi pribadi seperti alamat rumah di awal",
        "Gunakan fitur chat dalam aplikasi untuk komunikasi awal"
      ]
    },
    {
      category: "Saat Bertemu",
      items: [
        "Pilih tempat pertemuan yang aman dan ramai untuk pertemuan pertama",
        "Beri tahu teman atau keluarga tentang rencana pertemuan Anda",
        "Bawa uang tunai secukupnya, hindari membawa barang berharga berlebihan",
        "Percayai insting Anda - jika merasa tidak nyaman, segera tinggalkan",
        "Jangan mengonsumsi alkohol berlebihan atau zat terlarang"
      ]
    },
    {
      category: "Batasan Layanan",
      items: [
        "Temanly TIDAK menyediakan layanan seksual dalam bentuk apapun",
        "Semua interaksi harus dalam batas kesopanan dan hukum yang berlaku",
        "Talent berhak menolak permintaan yang tidak sesuai dengan layanan",
        "Pelecehan dalam bentuk apapun akan mengakibatkan banned permanen",
        "Laporkan segera jika ada talent yang menawarkan layanan terlarang"
      ]
    },
    {
      category: "Keamanan Digital",
      items: [
        "Jangan bagikan password atau informasi login Anda",
        "Gunakan metode pembayaran yang aman melalui aplikasi",
        "Hindari transfer uang di luar sistem Temanly",
        "Laporkan jika ada yang meminta pembayaran di luar aplikasi",
        "Aktifkan notifikasi untuk mendapat update keamanan terbaru"
      ]
    }
  ];

  const emergencyContacts = [
    { service: "Customer Service", contact: "+62 858-9003-3683", available: "24/7" },
    { service: "Emergency Hotline", contact: "110", available: "24/7" },
    { service: "Email Support", contact: "safety@temanly.com", available: "24/7" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <MainHeader />

      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Panduan Keamanan Temanly
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Keamanan dan kenyamanan Anda adalah prioritas utama kami. Ikuti panduan ini untuk pengalaman yang aman dan menyenangkan.
          </p>
        </div>

        {/* Safety Features */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Fitur Keamanan Kami</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {safetyFeatures.map((feature, index) => (
              <Card key={index} className="text-center p-6 hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-center mb-4">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Safety Guidelines */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Panduan Keamanan</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {safetyGuidelines.map((guideline, index) => (
              <Card key={index} className="p-6">
                <CardHeader>
                  <CardTitle className="text-xl text-gray-900">{guideline.category}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {guideline.items.map((item, itemIndex) => (
                      <li key={itemIndex} className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-600">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Emergency Contacts */}
        <section className="mb-16">
          <Card className="p-8 bg-red-50 border-red-200">
            <CardHeader>
              <CardTitle className="text-2xl text-red-800 flex items-center gap-3 justify-center">
                <Phone className="w-8 h-8" />
                Kontak Darurat
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                {emergencyContacts.map((contact, index) => (
                  <div key={index} className="bg-white p-4 rounded-lg border border-red-200">
                    <h4 className="font-semibold text-red-800 mb-2">{contact.service}</h4>
                    <p className="text-red-700 font-mono text-lg">{contact.contact}</p>
                    <p className="text-red-600 text-sm mt-1">Tersedia {contact.available}</p>
                  </div>
                ))}
              </div>
              <div className="mt-6 text-center">
                <p className="text-red-700 font-medium">
                  Dalam situasi darurat, segera hubungi nomor di atas atau pihak berwajib terdekat
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Safety Commitment */}
        <section className="text-center bg-white rounded-xl p-8 shadow-sm">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">Komitmen Keamanan Temanly</h3>
          <p className="text-lg text-gray-600 max-w-4xl mx-auto mb-6">
            Kami berkomitmen untuk menciptakan lingkungan yang aman dan nyaman bagi semua pengguna.
            Keamanan adalah tanggung jawab bersama, dan kami terus mengembangkan fitur-fitur keamanan
            terbaru untuk melindungi komunitas Temanly.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                <Shield className="w-8 h-8 text-blue-600" />
              </div>
              <h4 className="font-semibold text-gray-900">Perlindungan Data</h4>
              <p className="text-gray-600 text-sm">Enkripsi end-to-end untuk semua data pribadi</p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                <Users className="w-8 h-8 text-green-600" />
              </div>
              <h4 className="font-semibold text-gray-900">Komunitas Terpercaya</h4>
              <p className="text-gray-600 text-sm">Verifikasi ketat untuk semua anggota</p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                <MessageSquare className="w-8 h-8 text-purple-600" />
              </div>
              <h4 className="font-semibold text-gray-900">Support Responsif</h4>
              <p className="text-gray-600 text-sm">Tim support siap membantu 24/7</p>
            </div>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
};

export default Safety;
