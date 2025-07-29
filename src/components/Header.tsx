
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  showBackButton?: boolean;
  backTo?: string;
  showLogo?: boolean;
}

const Header = ({ 
  title, 
  subtitle, 
  showBackButton = true, 
  backTo = "/", 
  showLogo = true 
}: HeaderProps) => {
  return (
    <header className="bg-white border-b border-gray-200">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {showLogo && (
              <Link to="/">
                <img 
                  src="/lovable-uploads/2b715270-d5ae-4f6c-be60-2dfaf1662139.png" 
                  alt="Temanly Logo"
                  className="h-10 w-auto"
                />
              </Link>
            )}
            {title && (
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
                {subtitle && <p className="text-gray-600">{subtitle}</p>}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {showBackButton && (
              <Link to={backTo}>
                <Button variant="ghost" className="flex items-center gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Kembali
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
