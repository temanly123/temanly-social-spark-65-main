
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Shield, AlertTriangle, Check } from 'lucide-react';

interface VerificationStatusProps {
  user: {
    verified: boolean;
    verification_status: 'pending' | 'verified' | 'rejected';
  } | null;
}

const VerificationStatus: React.FC<VerificationStatusProps> = ({ user }) => {
  if (!user) return null;

  const getStatusDisplay = () => {
    switch (user.verification_status) {
      case 'verified':
        return {
          icon: <Check className="w-4 h-4" />,
          text: 'Verified User',
          color: 'bg-green-100 text-green-700',
        };
      case 'pending':
        return {
          icon: <AlertTriangle className="w-4 h-4" />,
          text: 'Verification Pending',
          color: 'bg-yellow-100 text-yellow-700',
        };
      case 'rejected':
        return {
          icon: <AlertTriangle className="w-4 h-4" />,
          text: 'Verification Rejected',
          color: 'bg-red-100 text-red-700',
        };
      default:
        return {
          icon: <Shield className="w-4 h-4" />,
          text: 'Not Verified',
          color: 'bg-gray-100 text-gray-700',
        };
    }
  };

  const status = getStatusDisplay();

  return (
    <Badge className={`${status.color} flex items-center gap-1`}>
      {status.icon}
      {status.text}
    </Badge>
  );
};

export default VerificationStatus;
