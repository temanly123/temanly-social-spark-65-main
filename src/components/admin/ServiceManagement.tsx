
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Settings,
  DollarSign,
  Phone,
  Video,
  MapPin,
  PartyPopper,
  Heart,
  Edit,
  Save,
  X
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ServiceRate {
  id: string;
  service_type: 'call' | 'video_call' | 'offline_date' | 'party_buddy' | 'rent_lover';
  base_rate: number;
  additional_rate?: number;
  unit: string;
  created_at: string;
  updated_at: string;
}

interface CommissionRate {
  id: string;
  talent_level: 'fresh' | 'elite' | 'vip';
  commission_percentage: number;
  created_at: string;
  updated_at: string;
}

const ServiceManagement = () => {
  const [serviceRates, setServiceRates] = useState<ServiceRate[]>([]);
  const [commissionRates, setCommissionRates] = useState<CommissionRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingService, setEditingService] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<ServiceRate>>({});
  const { toast } = useToast();

  const appFeePercentage = 10; // Fixed 10% app fee

  useEffect(() => {
    fetchServiceData();
  }, []);

  const fetchServiceData = async () => {
    try {
      setLoading(true);
      
      // Fetch service rates
      const { data: rates, error: ratesError } = await supabase
        .from('service_rates')
        .select('*')
        .order('service_type');

      if (ratesError) throw ratesError;

      // Fetch commission rates
      const { data: commissions, error: commissionsError } = await supabase
        .from('commission_rates')
        .select('*')
        .order('talent_level');

      if (commissionsError) throw commissionsError;

      // Map commission data to include updated_at
      const mappedCommissions = commissions?.map(commission => ({
        ...commission,
        updated_at: commission.created_at // Use created_at as fallback for updated_at
      })) || [];

      setServiceRates(rates || []);
      setCommissionRates(mappedCommissions);

      // Initialize default service rates if none exist
      if (!rates || rates.length === 0) {
        await initializeDefaultServiceRates();
      }

      // Initialize default commission rates if none exist
      if (!commissions || commissions.length === 0) {
        await initializeDefaultCommissionRates();
      }

    } catch (error: any) {
      console.error('Error fetching service data:', error);
      toast({
        title: "Error",
        description: "Failed to load service configurations",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const initializeDefaultServiceRates = async () => {
    const defaultRates = [

      {
        service_type: 'call' as const,
        base_rate: 40000,
        additional_rate: 40000,
        unit: 'hour'
      },
      {
        service_type: 'video_call' as const,
        base_rate: 65000,
        additional_rate: 65000,
        unit: 'hour'
      },
      {
        service_type: 'offline_date' as const,
        base_rate: 285000,
        additional_rate: 90000,
        unit: '3 hours'
      },
      {
        service_type: 'party_buddy' as const,
        base_rate: 1000000,
        unit: 'event'
      },
      {
        service_type: 'rent_lover' as const,
        base_rate: 85000,
        unit: 'day'
      }
    ];

    try {
      const { data, error } = await supabase
        .from('service_rates')
        .insert(defaultRates)
        .select();

      if (error) throw error;
      
      setServiceRates(data || []);
    } catch (error: any) {
      console.error('Error initializing service rates:', error);
    }
  };

  const initializeDefaultCommissionRates = async () => {
    const defaultCommissions = [
      {
        talent_level: 'fresh' as const,
        commission_percentage: 20
      },
      {
        talent_level: 'elite' as const,
        commission_percentage: 18
      },
      {
        talent_level: 'vip' as const,
        commission_percentage: 15
      }
    ];

    try {
      const { data, error } = await supabase
        .from('commission_rates')
        .insert(defaultCommissions)
        .select();

      if (error) throw error;
      
      const mappedData = data?.map(commission => ({
        ...commission,
        updated_at: commission.created_at
      })) || [];
      
      setCommissionRates(mappedData);
    } catch (error: any) {
      console.error('Error initializing commission rates:', error);
    }
  };

  const handleEdit = (service: ServiceRate) => {
    setEditingService(service.id);
    setEditForm(service);
  };

  const handleSave = async () => {
    if (!editingService || !editForm) return;

    try {
      const updateData = {
        base_rate: editForm.base_rate,
        additional_rate: editForm.additional_rate,
        unit: editForm.unit
      };

      const { error } = await supabase
        .from('service_rates')
        .update(updateData)
        .eq('id', editingService);

      if (error) throw error;

      setServiceRates(prev => 
        prev.map(service => 
          service.id === editingService 
            ? { ...service, ...editForm }
            : service
        )
      );

      setEditingService(null);
      setEditForm({});

      toast({
        title: "Service Updated",
        description: "Service rate has been updated successfully.",
      });
    } catch (error: any) {
      console.error('Error updating service:', error);
      toast({
        title: "Error",
        description: "Failed to update service rate",
        variant: "destructive"
      });
    }
  };

  const handleCancel = () => {
    setEditingService(null);
    setEditForm({});
  };

  const getServiceIcon = (serviceType: string) => {
    switch (serviceType) {
      case 'call': return <Phone className="w-4 h-4" />;
      case 'video_call': return <Video className="w-4 h-4" />;
      case 'offline_date': return <MapPin className="w-4 h-4" />;
      case 'party_buddy': return <PartyPopper className="w-4 h-4" />;
      case 'rent_lover': return <Heart className="w-4 h-4" />;
      default: return <Settings className="w-4 h-4" />;
    }
  };

  const getCommissionForLevel = (level: string) => {
    const commission = commissionRates.find(c => c.talent_level === level);
    return commission?.commission_percentage || 0;
  };

  const calculateTalentEarnings = (basePrice: number, commissionPercentage: number) => {
    return basePrice * (100 - commissionPercentage) / 100;
  };

  const getServiceDescription = (serviceType: string, baseRate: number, additionalRate?: number) => {
    switch (serviceType) {
      case 'chat':
        return `Chat service - Rp ${baseRate.toLocaleString('id-ID')} per day`;
      case 'call':
        return `Voice call service - Rp ${baseRate.toLocaleString('id-ID')} per hour`;
      case 'video_call':
        return `Video call service - Rp ${baseRate.toLocaleString('id-ID')} per hour`;
      case 'offline_date':
        return `Offline date - Rp ${baseRate.toLocaleString('id-ID')} for 3 hours, additional Rp ${additionalRate?.toLocaleString('id-ID')} per hour`;
      case 'party_buddy':
        return `Party Buddy (21+ only) - Rp ${baseRate.toLocaleString('id-ID')} per event (8PM-4AM)`;
      case 'rent_lover':
        return `Rent a Lover - up to Rp ${baseRate.toLocaleString('id-ID')} per day (talent can set own rate)`;
      default:
        return 'Service description';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Loading service configurations...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Service Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Services</CardTitle>
            <Settings className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{serviceRates.length}</div>
            <p className="text-xs text-muted-foreground">Available services</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">App Fee</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{appFeePercentage}%</div>
            <p className="text-xs text-muted-foreground">Platform fee</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Base Price</CardTitle>
            <DollarSign className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              Rp {Math.round(serviceRates.reduce((sum, s) => sum + s.base_rate, 0) / serviceRates.length).toLocaleString('id-ID')}
            </div>
            <p className="text-xs text-muted-foreground">Average service price</p>
          </CardContent>
        </Card>
      </div>

      {/* Commission Rates Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Commission Rates by Talent Level
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {commissionRates.map((commission) => (
              <div key={commission.id} className="p-4 border rounded-lg">
                <div className="text-lg font-semibold capitalize">{commission.talent_level} Talent</div>
                <div className="text-2xl font-bold text-blue-600">{commission.commission_percentage}%</div>
                <div className="text-sm text-gray-600">Commission rate</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Service Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Temanly Service Rates Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {serviceRates.map((service) => (
              <Card key={service.id} className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {getServiceIcon(service.service_type)}
                    <div>
                      <h3 className="font-semibold capitalize">
                        {service.service_type.replace('_', ' ')}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {getServiceDescription(service.service_type, service.base_rate, service.additional_rate)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {editingService === service.id ? (
                      <div className="flex gap-1">
                        <Button size="sm" onClick={handleSave}>
                          <Save className="w-3 h-3 mr-1" />
                          Save
                        </Button>
                        <Button size="sm" variant="outline" onClick={handleCancel}>
                          <X className="w-3 h-3 mr-1" />
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => handleEdit(service)}>
                        <Edit className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Base Price */}
                  <div>
                    <label className="text-sm font-medium text-gray-700">Base Price</label>
                    {editingService === service.id ? (
                      <Input
                        type="number"
                        value={editForm.base_rate || 0}
                        onChange={(e) => setEditForm({...editForm, base_rate: parseInt(e.target.value)})}
                        className="mt-1"
                      />
                    ) : (
                      <div className="text-lg font-semibold text-green-600">
                        Rp {service.base_rate.toLocaleString('id-ID')}
                      </div>
                    )}
                  </div>

                  {/* Additional Rate */}
                  {service.additional_rate && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">Per Hour</label>
                      {editingService === service.id ? (
                        <Input
                          type="number"
                          value={editForm.additional_rate || 0}
                          onChange={(e) => setEditForm({...editForm, additional_rate: parseInt(e.target.value)})}
                          className="mt-1"
                        />
                      ) : (
                        <div className="text-lg font-semibold text-blue-600">
                          Rp {service.additional_rate?.toLocaleString('id-ID')}
                        </div>
                      )}
                    </div>
                  )}

                  {/* App Fee */}
                  <div>
                    <label className="text-sm font-medium text-gray-700">App Fee</label>
                    <div className="text-lg font-semibold text-purple-600">
                      {appFeePercentage}%
                    </div>
                  </div>

                  {/* Commission Rates */}
                  <div>
                    <label className="text-sm font-medium text-gray-700">Commission Rates</label>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Fresh:</span>
                        <span className="font-medium">{getCommissionForLevel('fresh')}%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Elite:</span>
                        <span className="font-medium">{getCommissionForLevel('elite')}%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>VIP:</span>
                        <span className="font-medium">{getCommissionForLevel('vip')}%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Talent Earnings Preview */}
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-800 mb-2">Talent Earnings (after commission)</h4>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Fresh Talent:</span>
                      <div className="font-semibold text-green-600">
                        Rp {calculateTalentEarnings(service.base_rate, getCommissionForLevel('fresh')).toLocaleString('id-ID')}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-600">Elite Talent:</span>
                      <div className="font-semibold text-green-600">
                        Rp {calculateTalentEarnings(service.base_rate, getCommissionForLevel('elite')).toLocaleString('id-ID')}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-600">VIP Talent:</span>
                      <div className="font-semibold text-green-600">
                        Rp {calculateTalentEarnings(service.base_rate, getCommissionForLevel('vip')).toLocaleString('id-ID')}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ServiceManagement;
