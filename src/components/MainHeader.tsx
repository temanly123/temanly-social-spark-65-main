
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Globe, User, LogOut, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const MainHeader = () => {
  const { isAuthenticated, user, logout, switchUserType } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [canSwitchToTalent, setCanSwitchToTalent] = useState(false);
  const [canSwitchToUser, setCanSwitchToUser] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Check user capabilities on mount
  useEffect(() => {
    if (user?.email) {
      checkUserCapabilities();
    }
  }, [user?.email]);

  const checkUserCapabilities = async () => {
    if (!user?.id && !user?.email) return;

    try {
      // First try by user ID, then by email as fallback
      let profiles, error;

      if (user.id) {
        const result = await supabase
          .from('profiles')
          .select('user_type, verification_status, status, id, email')
          .eq('id', user.id);
        profiles = result.data;
        error = result.error;
      }

      // If no profiles found by ID, try by email
      if ((!profiles || profiles.length === 0) && user.email) {
        const result = await supabase
          .from('profiles')
          .select('user_type, verification_status, status, id, email')
          .eq('email', user.email);
        profiles = result.data;
        error = result.error;
      }

      if (error) {
        console.error('Error checking user capabilities:', error);
        return;
      }

      if (profiles && profiles.length > 0) {
        // Be more flexible with status - allow active or pending profiles
        const hasUserProfile = profiles.some(p =>
          p.user_type === 'user' && (p.status === 'active' || p.status === 'pending')
        );
        const hasCompanionProfile = profiles.some(p =>
          p.user_type === 'companion' && (p.status === 'active' || p.status === 'pending')
        );

        setCanSwitchToTalent(hasCompanionProfile);
        setCanSwitchToUser(hasUserProfile);
      }
    } catch (error) {
      console.error('Error checking user capabilities:', error);
    }
  };

  const handleDashboardNavigation = async (targetType: 'user' | 'companion') => {
    if (targetType === 'user') {
      if (canSwitchToUser) {
        const success = await switchUserType('user');
        if (success) {
          navigate('/user-dashboard');
        } else {
          toast({
            title: "Switch Failed",
            description: "Unable to switch to user account. Please try again.",
            variant: "destructive"
          });
        }
      } else {
        toast({
          title: "Access Not Available",
          description: "You don't have a regular user account. To access the user dashboard, you need to register as a regular user.",
          variant: "destructive"
        });
      }
    } else {
      if (canSwitchToTalent) {
        const success = await switchUserType('companion');
        if (success) {
          navigate('/talent-dashboard');
        } else {
          toast({
            title: "Switch Failed",
            description: "Unable to switch to talent account. Please try again.",
            variant: "destructive"
          });
        }
      } else {
        toast({
          title: "Access Not Available",
          description: "You don't have a talent account. To access the talent dashboard, you need to register as a talent.",
          variant: "destructive"
        });
      }
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2">
              <img 
                src="/lovable-uploads/2b715270-d5ae-4f6c-be60-2dfaf1662139.png" 
                alt="Temanly Logo"
                className="h-10 w-auto"
              />
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              <Link to="/services" className="text-gray-700 hover:text-gray-900 font-medium">Services</Link>
              <Link to="/talents" className="text-gray-700 hover:text-gray-900 font-medium">Browse Talents</Link>
              <Link to="/how-it-works" className="text-gray-700 hover:text-gray-900 font-medium">How It Works</Link>
              <Link to="/safety" className="text-gray-700 hover:text-gray-900 font-medium">Safety</Link>
              <Link to="/faq" className="text-gray-700 hover:text-gray-900 font-medium">FAQ</Link>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <Globe className="w-4 h-4" />
              <span className="text-gray-700">ID</span>
            </div>
            
            <Link to="/talent-register">
              <Button className="bg-pink-500 text-white hover:bg-pink-600 rounded-full px-6">
                ⭐ Jadi Talent
              </Button>
            </Link>

            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    {user?.name}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {canSwitchToUser ? (
                    <DropdownMenuItem onClick={() => handleDashboardNavigation('user')}>
                      <User className="mr-2 h-4 w-4" />
                      User Dashboard
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem
                      onClick={() => handleDashboardNavigation('user')}
                      className="text-gray-500"
                    >
                      <User className="mr-2 h-4 w-4" />
                      User Dashboard (Not Available)
                    </DropdownMenuItem>
                  )}

                  {canSwitchToTalent ? (
                    <DropdownMenuItem onClick={() => handleDashboardNavigation('companion')}>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Talent Dashboard
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem
                      onClick={() => handleDashboardNavigation('companion')}
                      className="text-gray-500"
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Talent Dashboard (Not Available)
                    </DropdownMenuItem>
                  )}

                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex gap-2">
                <Link to="/login">
                  <Button variant="ghost">Masuk</Button>
                </Link>
                <Link to="/simple-signup">
                  <Button>Daftar</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default MainHeader;
