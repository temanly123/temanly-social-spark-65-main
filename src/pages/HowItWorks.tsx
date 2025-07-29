import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserCheck, Search, Calendar, MessageCircle, Star, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import Footer from '@/components/Footer';
import MainHeader from '@/components/MainHeader';

const HowItWorks = () => {
  const steps = [
    {
      icon: <UserCheck className="w-12 h-12 text-blue-500" />,
      title: "1. Buat Akun",
      description: "Daftar gratis dan verifikasi identitas Anda untuk keamanan bersama.",
      details: [
        "Isi data pribadi dengan lengkap dan benar",
        "Upload foto KTP untuk verifikasi identitas",
        "Verifikasi nomor WhatsApp dengan kode OTP",
        "Lengkapi profil dengan foto dan bio singkat"
      ]
    },
    {
      icon: <Search className="w-12 h-12 text-green-500" />,
      title: "2. Pilih Talent",
      description: "Browse talent berdasarkan lokasi, layanan, dan preferensi Anda.",
      details: [
        "Filter berdasarkan kota, layanan, dan level talent",
        "Lihat profil lengkap, foto, dan rating talent",
        "Baca review dari pengguna sebelumnya",
        "Cek ketersediaan jadwal talent"
      ]
    },
    {
      icon: <Calendar className="w-12 h-12 text-purple-500" />,
      title: "3. Book & Bayar",
      description: "Pilih layanan, tentukan waktu, dan lakukan pembayaran yang aman.",
      details: [
        "Pilih jenis layanan yang diinginkan",
        "Tentukan tanggal, waktu, dan durasi",
        "Isi detail permintaan khusus jika ada",
        "Bayar dengan metode pembayaran yang aman"
      ]
    },
    {
      icon: <MessageCircle className="w-12 h-12 text-pink-500" />,
      title: "4. Nikmati Layanan",
      description: "Talent akan menghubungi Anda dan layanan dimulai sesuai jadwal.",
      details: [
        "Talent akan konfirmasi booking melalui chat",
        "Koordinasi detail pertemuan atau layanan",
        "Nikmati layanan sesuai yang telah disepakati",
        "Hubungi customer service jika ada kendala"
      ]
    },
    {
      icon: <Star className="w-12 h-12 text-yellow-500" />,
      title: "5. Beri Rating",
      description: "Berikan rating dan review untuk membantu pengguna lain.",
      details: [
        "Beri rating 1-5 bintang untuk talent",
        "Tulis review yang jujur dan membantu",
        "Laporkan jika ada masalah atau pelanggaran",
        "Dapatkan poin reward untuk review berkualitas"
      ]
    }
  ];

  const serviceTypes = [
    {
      name: "Chat",
      price: "25k/hari",
      description: "Ngobrol santai via WhatsApp atau aplikasi chat lainnya",
      features: ["Chat unlimited", "Voice note", "Foto/video sharing", "Respon cepat"]
    },
    {
      name: "Voice Call",
      price: "40k/jam",
      description: "Telepon suara untuk curhat atau ngobrol lebih personal",
      features: ["Kualitas suara jernih", "Privasi terjamin", "Fleksibel waktu", "Konsultasi ringan"]
    },
    {
      name: "Video Call",
      price: "65k/jam",
      description: "Video call untuk interaksi yang lebih personal dan nyata",
      features: ["HD video quality", "Screen sharing", "Virtual background", "Recording (opsional)"]
    },
    {
      name: "Offline Date",
      price: "285k/3jam",
      description: "Bertemu langsung untuk makan, nonton, atau aktivitas lainnya",
      features: ["Teman makan/nonton", "City tour guide", "Event companion", "Flexible activities"]
    },
    {
      name: "Party Buddy",
      price: "1M/event",
      description: "Teman untuk acara pesta, wedding, atau event khusus",
      features: ["Professional appearance", "Social skills", "Event photography", "Plus one companion"]
    },
    {
      name: "Rent a Lover",
      price: "Up to 85k/hari",
      description: "Simulasi hubungan romantis untuk kebutuhan khusus",
      features: ["Romantic roleplay", "Couple activities", "Social media content", "Emotional support"]
    }
  ];

  const talentLevels = [
    {
      level: "Fresh",
      commission: "20%",
      requirements: "Talent baru dengan verifikasi dasar",
      benefits: ["Training gratis", "Support 24/7", "Flexible schedule"]
    },
    {
      level: "Elite",
      commission: "18%",
      requirements: "Rating 4.5+, 50+ completed bookings",
      benefits: ["Priority listing", "Higher rates", "Exclusive events"]
    },
    {
      level: "VIP",
      commission: "15%",
      requirements: "Rating 4.8+, 200+ completed bookings, background check",
      benefits: ["Premium features", "Personal manager", "Brand partnerships"]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <MainHeader />

      <div className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            How It Works
          </h1>
          <p className="text-xl text-gray-600 mb-8">Panduan lengkap menggunakan Temanly</p>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Cara Menggunakan Temanly
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Dalam 5 langkah mudah, Anda sudah bisa menikmati layanan social companion terbaik di Indonesia
          </p>
        </div>

        {/* Steps Overview */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Langkah-Langkah Mudah</h2>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 mb-12">
            {steps.map((step, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="mb-4 flex justify-center">
                    {step.icon}
                  </div>
                  <h3 className="text-lg font-bold mb-2">{step.title}</h3>
                  <p className="text-gray-600 text-sm mb-4">{step.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Detailed Steps */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Detail Langkah</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <Card key={index} className="p-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    {step.icon}
                    <span>{step.title}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">{step.description}</p>
                  <ul className="space-y-2">
                    {step.details.map((detail, detailIndex) => (
                      <li key={detailIndex} className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
                        <span className="text-gray-600 text-sm">{detail}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Service Types */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Jenis Layanan</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {serviceTypes.map((service, index) => (
              <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-xl text-gray-900">{service.name}</CardTitle>
                  <div className="text-2xl font-bold text-blue-600">{service.price}</div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">{service.description}</p>
                  <ul className="space-y-2">
                    {service.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-gray-600 text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Talent Levels */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Level Talent</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {talentLevels.map((level, index) => (
              <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-xl text-gray-900">{level.level}</CardTitle>
                  <div className="text-lg font-semibold text-purple-600">Komisi: {level.commission}</div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">{level.requirements}</p>
                  <h4 className="font-semibold text-gray-900 mb-2">Benefits:</h4>
                  <ul className="space-y-2">
                    {level.benefits.map((benefit, benefitIndex) => (
                      <li key={benefitIndex} className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-purple-500" />
                        <span className="text-gray-600 text-sm">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="text-center bg-white rounded-xl p-8 shadow-sm">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">Siap Memulai?</h3>
          <p className="text-lg text-gray-600 mb-6">
            Bergabunglah dengan ribuan pengguna yang sudah merasakan pengalaman terbaik bersama Temanly
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/signup">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                Daftar Sekarang
              </Button>
            </Link>
            <Link to="/talents">
              <Button size="lg" variant="outline">
                Browse Talents
              </Button>
            </Link>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
};

export default HowItWorks;
