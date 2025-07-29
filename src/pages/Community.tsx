
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, MessageCircle, Calendar, Star, Award, Heart } from 'lucide-react';
import Footer from '@/components/Footer';

const Community = () => {
  const communityStats = [
    { icon: Users, label: 'Total Member', value: '10,000+', color: 'text-blue-500' },
    { icon: MessageCircle, label: 'Diskusi Aktif', value: '500+', color: 'text-green-500' },
    { icon: Calendar, label: 'Event Bulanan', value: '20+', color: 'text-purple-500' },
    { icon: Star, label: 'Rating Rata-rata', value: '4.8/5', color: 'text-yellow-500' }
  ];

  const communityFeatures = [
    {
      icon: MessageCircle,
      title: 'Forum Diskusi',
      description: 'Berbagi pengalaman dan tips dengan member lain',
      badge: 'Populer'
    },
    {
      icon: Calendar,
      title: 'Event & Meetup',
      description: 'Ikuti acara offline dan online yang menarik',
      badge: 'Baru'
    },
    {
      icon: Award,
      title: 'Program Reward',
      description: 'Dapatkan poin dan hadiah dari aktivitas komunitas',
      badge: 'Eksklusif'
    },
    {
      icon: Users,
      title: 'Grup Khusus',
      description: 'Bergabung dengan grup sesuai minat dan hobi',
      badge: 'Trending'
    }
  ];

  const recentPosts = [
    {
      user: 'Sarah_Jakarta',
      title: 'Tips OOTD untuk dinner date yang sempurna',
      comments: 24,
      likes: 89,
      time: '2 jam lalu'
    },
    {
      user: 'RyanGaming',
      title: 'Review tempat gaming terbaru di Senayan City',
      comments: 15,
      likes: 56,
      time: '4 jam lalu'
    },
    {
      user: 'FoodieAnna',
      title: 'Rekomendasi restoran untuk first date',
      comments: 31,
      likes: 102,
      time: '6 jam lalu'
    }
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
            Komunitas Temanly
          </h1>
          <p className="text-xl text-gray-600">
            Tempat bertemu, berbagi, dan tumbuh bersama
          </p>
        </div>

        <div className="max-w-6xl mx-auto">
          {/* Community Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
            {communityStats.map((stat, index) => (
              <Card key={index} className="text-center p-6">
                <stat.icon className={`w-8 h-8 ${stat.color} mx-auto mb-2`} />
                <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </Card>
            ))}
          </div>

          {/* Community Features */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {communityFeatures.map((feature, index) => (
              <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <feature.icon className="w-8 h-8 text-blue-500" />
                    <Badge variant="secondary">{feature.badge}</Badge>
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Recent Community Posts */}
          <Card className="mb-12">
            <CardHeader>
              <CardTitle className="text-2xl text-center">Diskusi Terbaru</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentPosts.map((post, index) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-1">{post.title}</h4>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>oleh {post.user}</span>
                          <span>{post.time}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Heart className="w-4 h-4" />
                          {post.likes}
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageCircle className="w-4 h-4" />
                          {post.comments}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="text-center mt-6">
                <Button variant="outline">Lihat Semua Diskusi</Button>
              </div>
            </CardContent>
          </Card>

          {/* Join Community CTA */}
          <Card className="text-center p-8 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
            <CardContent>
              <h3 className="text-2xl font-bold mb-4">Bergabung dengan Komunitas</h3>
              <p className="text-blue-100 mb-6">
                Jadilah bagian dari komunitas yang supportif dan dapatkan akses ke fitur eksklusif
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" variant="secondary">
                  Gabung Discord
                </Button>
                <Button size="lg" variant="outline" className="text-white border-white hover:bg-white hover:text-blue-600">
                  Gabung Telegram
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Community;
