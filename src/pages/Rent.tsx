import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Star, Users, Gift } from 'lucide-react';
import Footer from '@/components/Footer';

const Rent = () => {
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
            Become a Temanly Partner
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Share your time, skills, and personality. Earn money while making meaningful connections.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Card className="text-center p-6 hover:shadow-lg transition-shadow">
            <CardHeader>
              <Clock className="w-12 h-12 text-blue-500 mx-auto mb-4" />
              <CardTitle className="text-lg">Flexible Hours</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Work on your own schedule and set your availability.</p>
            </CardContent>
          </Card>

          <Card className="text-center p-6 hover:shadow-lg transition-shadow">
            <CardHeader>
              <Star className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
              <CardTitle className="text-lg">Build Your Reputation</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Earn ratings and reviews to grow your profile.</p>
            </CardContent>
          </Card>

          <Card className="text-center p-6 hover:shadow-lg transition-shadow">
            <CardHeader>
              <Users className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <CardTitle className="text-lg">Meet New People</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Connect with interesting people from all walks of life.</p>
            </CardContent>
          </Card>

          <Card className="text-center p-6 hover:shadow-lg transition-shadow">
            <CardHeader>
              <Gift className="w-12 h-12 text-purple-500 mx-auto mb-4" />
              <CardTitle className="text-lg">Good Earnings</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Set your rates and earn money doing what you love.</p>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <Button size="lg" className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-4 text-lg">
            ⭐ Apply to Be a Partner
          </Button>
          <p className="text-gray-500 mt-4">
            Join thousands of partners earning money on Temanly
          </p>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Rent;
