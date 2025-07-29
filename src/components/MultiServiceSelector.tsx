
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Phone, Video, Heart, Users, Crown } from 'lucide-react';

interface Service {
  id: string;
  name: string;
  price: number;
  unit: string;
  icon: React.ReactNode;
  requiresVerification: boolean;
}

interface ServiceSelection {
  id: string;
  duration: number;
  durationUnit: string;
  datePlan?: string;
  location?: string;
}

interface MultiServiceSelectorProps {
  selectedServices: ServiceSelection[];
  onServiceChange: (services: ServiceSelection[]) => void;
  isVerified: boolean;
}

const MultiServiceSelector: React.FC<MultiServiceSelectorProps> = ({
  selectedServices,
  onServiceChange,
  isVerified
}) => {
  const services: Service[] = [

    {
      id: 'call',
      name: 'Voice Call', 
      price: 40000,
      unit: 'per hour',
      icon: <Phone className="w-4 h-4" />,
      requiresVerification: false
    },
    {
      id: 'video-call',
      name: 'Video Call',
      price: 65000,
      unit: 'per hour', 
      icon: <Video className="w-4 h-4" />,
      requiresVerification: false
    },
    {
      id: 'rent-a-lover',
      name: 'Rent a Lover',
      price: 85000,
      unit: 'per day',
      icon: <Crown className="w-4 h-4" />,
      requiresVerification: false
    },
    {
      id: 'offline-date',
      name: 'Offline Date',
      price: 285000,
      unit: 'per 3 hours',
      icon: <Heart className="w-4 h-4" />,
      requiresVerification: true
    },
    {
      id: 'party-buddy',
      name: 'Party Buddy', 
      price: 1000000,
      unit: 'per event',
      icon: <Users className="w-4 h-4" />,
      requiresVerification: true
    }
  ];

  const handleServiceToggle = (serviceId: string, checked: boolean) => {
    if (checked) {
      const service = services.find(s => s.id === serviceId);
      if (!service) return;

      const newService: ServiceSelection = {
        id: serviceId,
        duration: 1,
        durationUnit: service.id === 'rent-a-lover' ? 'days' : 
                     service.id === 'offline-date' ? 'hours' : 
                     service.id === 'party-buddy' ? 'events' : 'hours'
      };

      onServiceChange([...selectedServices, newService]);
    } else {
      onServiceChange(selectedServices.filter(s => s.id !== serviceId));
    }
  };

  const handleServiceUpdate = (serviceId: string, updates: Partial<ServiceSelection>) => {
    onServiceChange(
      selectedServices.map(service =>
        service.id === serviceId ? { ...service, ...updates } : service
      )
    );
  };

  const isServiceSelected = (serviceId: string) => {
    return selectedServices.some(s => s.id === serviceId);
  };

  const getSelectedService = (serviceId: string) => {
    return selectedServices.find(s => s.id === serviceId);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Select Services</CardTitle>
        <p className="text-sm text-gray-600">
          Choose multiple services and customize duration
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {services.map((service) => {
          const isSelected = isServiceSelected(service.id);
          const selectedService = getSelectedService(service.id);
          const isRestricted = service.requiresVerification && !isVerified;

          return (
            <div key={service.id} className="space-y-4">
              <div className={`border rounded-lg p-4 ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'} ${isRestricted ? 'opacity-50' : ''}`}>
                
                {/* Service Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={(checked) => handleServiceToggle(service.id, checked === true)}
                      disabled={isRestricted}
                    />
                    <div className="flex items-center gap-2">
                      {service.icon}
                      <span className="font-medium">{service.name}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-blue-600">
                      Rp {service.price.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-500">{service.unit}</p>
                  </div>
                </div>

                {isRestricted && (
                  <p className="text-sm text-red-600 mt-2">
                    ⚠️ Requires verification to book this service
                  </p>
                )}

                {/* Service Details */}
                {isSelected && selectedService && (
                  <div className="mt-4 pt-4 border-t space-y-4">
                    
                    {/* Duration Selection */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Duration</Label>
                        <Input
                          type="number"
                          min="1"
                          value={selectedService.duration}
                          onChange={(e) => handleServiceUpdate(service.id, { 
                            duration: parseInt(e.target.value) || 1 
                          })}
                        />
                      </div>
                      <div>
                        <Label>Unit</Label>
                        <Select
                          value={selectedService.durationUnit}
                          onValueChange={(value) => handleServiceUpdate(service.id, { 
                            durationUnit: value 
                          })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {service.id === 'rent-a-lover' && (
                              <>
                                <SelectItem value="days">Days</SelectItem>
                                <SelectItem value="weeks">Weeks</SelectItem>
                              </>
                            )}
                            {service.id === 'offline-date' && (
                              <>
                                <SelectItem value="hours">Hours</SelectItem>
                              </>
                            )}
                            {service.id === 'party-buddy' && (
                              <SelectItem value="events">Events</SelectItem>
                            )}
                            {!['rent-a-lover', 'offline-date', 'party-buddy'].includes(service.id) && (
                              <>
                                <SelectItem value="hours">Hours</SelectItem>
                                <SelectItem value="days">Days</SelectItem>
                              </>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Date Plan for Offline Date */}
                    {service.id === 'offline-date' && (
                      <>
                        <div>
                          <Label>Date Plan</Label>
                          <Textarea
                            placeholder="e.g., Go to sushi restaurant, then watch a movie, visit art gallery..."
                            value={selectedService.datePlan || ''}
                            onChange={(e) => handleServiceUpdate(service.id, { 
                              datePlan: e.target.value 
                            })}
                            rows={3}
                          />
                        </div>
                        <div>
                          <Label>Meeting Location</Label>
                          <Input
                            placeholder="e.g., Starbucks Plaza Indonesia, Mall entrance, etc."
                            value={selectedService.location || ''}
                            onChange={(e) => handleServiceUpdate(service.id, { 
                              location: e.target.value 
                            })}
                          />
                        </div>
                      </>
                    )}

                  </div>
                )}
              </div>
            </div>
          );
        })}

      </CardContent>
    </Card>
  );
};

export default MultiServiceSelector;
