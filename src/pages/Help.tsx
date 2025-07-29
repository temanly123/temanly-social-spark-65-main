
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, MessageCircle, BookOpen, Video, Mail, Phone } from 'lucide-react';
import Footer from '@/components/Footer';

const Help = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const helpCategories = [
    {
      title: 'Memulai',
      icon: BookOpen,
      topics: [
        'Cara mendaftar akun',
        'Melengkapi profil',
        'Verifikasi identitas',
        'Mengatur preferensi'
      ]
    },
    {
      title: 'Booking & Pembayaran',
      icon: MessageCircle,
      topics: [
        'Cara booking companion',
        'Metode pembayaran',
        'Kebijakan pembatalan',
        'Pengembalian dana'
      ]
    },
    {
      title: 'Menjadi Partner',
      icon: Video,
      topics: [
        'Syarat menjadi partner',
        'Cara setting tarif',
        'Mengelola jadwal',
        'Tips sukses'
      ]
    }
  ];

  const popularQuestions = [
    'Bagaimana cara mengubah foto profil?',
    'Apa yang harus dilakukan jika pembayaran gagal?',
    'Bagaimana cara menghubungi customer service?',
    'Bisakah saya membatalkan booking?',
    'Bagaimana sistem rating bekerja?',
    'Apa itu verifikasi identitas?'
  ];

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
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Pusat Bantuan
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Temukan jawaban untuk pertanyaan Anda
          </p>
          
          {/* Search Bar */}
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Cari bantuan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 py-3 text-lg"
            />
          </div>
        </div>

        <div className="max-w-6xl mx-auto">
          {/* Help Categories */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {helpCategories.map((category, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <category.icon className="w-12 h-12 text-blue-500 mx-auto mb-4" />
                  <CardTitle className="text-xl text-center">{category.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {category.topics.map((topic, topicIndex) => (
                      <li key={topicIndex} className="text-gray-600 hover:text-blue-600 cursor-pointer">
                        • {topic}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Popular Questions */}
          <Card className="mb-12">
            <CardHeader>
              <CardTitle className="text-2xl text-center">Pertanyaan Populer</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {popularQuestions.map((question, index) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors">
                    <p className="text-gray-700">{question}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Contact Support */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="text-center p-6">
              <CardHeader>
                <MessageCircle className="w-12 h-12 text-blue-500 mx-auto mb-4" />
                <CardTitle className="text-lg">Live Chat</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">Chat langsung dengan tim support</p>
                <Button className="w-full">Mulai Chat</Button>
              </CardContent>
            </Card>

            <Card className="text-center p-6">
              <CardHeader>
                <Mail className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <CardTitle className="text-lg">Email Support</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">Kirim email untuk bantuan detail</p>
                <Button variant="outline" className="w-full">Kirim Email</Button>
              </CardContent>
            </Card>

            <Card className="text-center p-6">
              <CardHeader>
                <Phone className="w-12 h-12 text-purple-500 mx-auto mb-4" />
                <CardTitle className="text-lg">Telepon</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">Hubungi langsung via telepon</p>
                <Button variant="outline" className="w-full">+62 123 456 7890</Button>
              </CardContent>
            </Card>
          </div>

          {/* Operating Hours */}
          <Card className="mt-12">
            <CardHeader>
              <CardTitle className="text-xl text-center">Jam Operasional Support</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Live Chat</h4>
                  <p className="text-gray-600">24/7 - Selalu online</p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Email Support</h4>
                  <p className="text-gray-600">Respon dalam 2-4 jam</p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Telepon</h4>
                  <p className="text-gray-600">Senin-Jumat, 09:00-18:00</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Help;
