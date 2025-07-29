
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Phone, Video, Heart, Users, Star, Clock, Info } from 'lucide-react';

const ServiceSelector = () => {
  const services = [

    {
      id: 'call',
      name: 'Voice Call',
      icon: <Phone className="w-6 h-6" />,
      price: '40k/jam',
      description: 'Panggilan suara dengan kualitas jernih',
      color: 'bg-green-500',
      features: ['HD voice quality', 'Private conversation', 'Flexible duration']
    },
    {
      id: 'video',
      name: 'Video Call',
      icon: <Video className="w-6 h-6" />,
      price: '65k/jam',
      description: 'Video call menggunakan platform pilihan Anda',
      color: 'bg-purple-500',
      features: ['HD video quality', 'Screen sharing', 'Any platform']
    },
    {
      id: 'offline-date',
      name: 'Offline Date',
      icon: <Heart className="w-6 h-6" />,
      price: '285k/3jam',
      description: 'Kencan offline dengan pengalaman tak terlupakan',
      color: 'bg-red-500',
      features: ['3 hours minimum', '+90k/jam overtime', 'Transport +20%'],
      requirements: ['Verified users only', 'Public places only']
    },
    {
      id: 'party-buddy',
      name: 'Party Buddy',
      icon: <Users className="w-6 h-6" />,
      price: '1M/event',
      description: 'Teman pesta untuk acara malam (21+ only)',
      color: 'bg-orange-500',
      features: ['8 PM - 4 AM', 'Transport included', 'Professional companion'],
      requirements: ['21+ only', 'Verified users only', 'Night events only']
    },
    {
      id: 'rent-a-lover',
      name: 'Rent a Lover',
      icon: <Star className="w-6 h-6" />,
      price: 'up to 85k/hari',
      description: 'Pengalaman pacar virtual yang romantis',
      color: 'bg-pink-500',
      features: ['Good morning/night texts', 'Pet names', 'Romantic experience'],
      note: 'Talent can set their own rates and packages'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {services.map((service) => (
        <Card key={service.id} className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 border-0">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3 mb-2">
              <div className={`${service.color} text-white p-2 rounded-lg`}>
                {service.icon}
              </div>
              <div>
                <CardTitle className="text-lg">{service.name}</CardTitle>
                <p className="text-2xl font-bold text-gray-900">{service.price}</p>
              </div>
            </div>
            <p className="text-gray-600 text-sm">{service.description}</p>
          </CardHeader>

          <CardContent className="pt-0">
            {/* Features */}
            <div className="mb-4">
              <h4 className="font-medium text-sm text-gray-900 mb-2">Features:</h4>
              <ul className="space-y-1">
                {service.features.map((feature, index) => (
                  <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                    <span className="text-green-500 mt-1">•</span>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            {/* Requirements */}
            {service.requirements && (
              <div className="mb-4">
                <h4 className="font-medium text-sm text-gray-900 mb-2">Requirements:</h4>
                <ul className="space-y-1">
                  {service.requirements.map((req, index) => (
                    <li key={index} className="text-sm text-amber-600 flex items-start gap-2">
                      <Info className="w-3 h-3 mt-1 flex-shrink-0" />
                      {req}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Note */}
            {service.note && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs text-gray-600">{service.note}</p>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ServiceSelector;
