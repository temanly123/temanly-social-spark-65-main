
interface ServiceSelection {
  id: string;
  duration: number;
  durationUnit: string;
  datePlan?: string;
  location?: string;
}

interface ServicePricing {
  [key: string]: {
    basePrice: number;
    unit: string;
  };
}

const servicePricing: ServicePricing = {
  'chat': { basePrice: 25000, unit: 'per day' },
  'call': { basePrice: 40000, unit: 'per hour' },
  'video-call': { basePrice: 65000, unit: 'per hour' },
  'rent-a-lover': { basePrice: 85000, unit: 'per day' },
  'offline-date': { basePrice: 285000, unit: 'per 3 hours' },
  'party-buddy': { basePrice: 1000000, unit: 'per event' }
};

export const calculateServicePrice = (service: ServiceSelection): number => {
  const pricing = servicePricing[service.id];
  if (!pricing) return 0;

  let multiplier = service.duration;

  // Handle different duration units
  if (service.id === 'offline-date') {
    // Offline date base price is for 3 hours
    if (service.durationUnit === 'hours') {
      multiplier = Math.ceil(service.duration / 3);
    }
  } else if (service.id === 'rent-a-lover') {
    if (service.durationUnit === 'weeks') {
      multiplier = service.duration * 7;
    } else if (service.durationUnit === 'months') {
      multiplier = service.duration * 30;
    }
  }

  return pricing.basePrice * multiplier;
};

export const calculateTotalPrice = (services: ServiceSelection[]): number => {
  return services.reduce((total, service) => {
    return total + calculateServicePrice(service);
  }, 0);
};

export const getServiceRestrictions = (isVerified: boolean): string[] => {
  if (isVerified) return [];
  return ['Offline Date', 'Party Buddy'];
};

export const hasRestrictedServices = (services: ServiceSelection[], isVerified: boolean): boolean => {
  if (isVerified) return false;
  return services.some(service => ['offline-date', 'party-buddy'].includes(service.id));
};

export const getRestrictedServicesFromSelection = (services: ServiceSelection[], isVerified: boolean): ServiceSelection[] => {
  if (isVerified) return [];
  return services.filter(service => ['offline-date', 'party-buddy'].includes(service.id));
};

export const validateServiceAccess = (serviceId: string, isVerified: boolean): { allowed: boolean; message?: string } => {
  const restrictedServices = ['offline-date', 'party-buddy'];
  
  if (!isVerified && restrictedServices.includes(serviceId)) {
    return {
      allowed: false,
      message: `Layanan ${serviceId === 'offline-date' ? 'Offline Date' : 'Party Buddy'} memerlukan verifikasi identitas (KTP, Email, dan WhatsApp).`
    };
  }
  
  return { allowed: true };
};

export const formatServiceName = (serviceId: string): string => {
  const nameMap: Record<string, string> = {
    'chat': 'Chat',
    'call': 'Voice Call',
    'video-call': 'Video Call',
    'rent-a-lover': 'Rent a Lover',
    'offline-date': 'Offline Date',
    'party-buddy': 'Party Buddy'
  };
  
  return nameMap[serviceId] || serviceId;
};

export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price);
};

export const getServiceDescription = (serviceId: string): string => {
  const descriptions: Record<string, string> = {
    'chat': 'Chatting harian dengan talent pilihan Anda',
    'call': 'Panggilan suara dengan talent per jam',
    'video-call': 'Video call dengan talent per jam',
    'rent-a-lover': 'Layanan pendamping virtual untuk berbagai kebutuhan',
    'offline-date': 'Kencan offline dengan talent untuk berbagai aktivitas',
    'party-buddy': 'Pendamping acara atau pesta khusus'
  };
  
  return descriptions[serviceId] || '';
};
