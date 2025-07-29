
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Bell, Settings, User, LogOut, Menu, X, Home, Users, MessageSquare, Calendar, Shield, HelpCircle, Phone, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

interface DashboardHeaderProps {
  title: string;
  subtitle?: string;
  userType: 'user' | 'companion' | 'admin';
  notificationCount?: number;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  title,
  subtitle,
  userType,
  notificationCount = 0
}) => {
  const { user, logout, switchUserType } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [canSwitchToTalent, setCanSwitchToTalent] = useState(false);
  const [canSwitchToUser, setCanSwitchToUser] = useState(false);

  const handleLogout = async () => {
    console.log('DashboardHeader: Logout initiated');
    await logout();
    console.log('DashboardHeader: Logout complete, navigating to home');
    navigate('/');
  };

  const getProfilePath = () => {
    switch (userType) {
      case 'companion':
        return '/talent-dashboard';
      case 'admin':
        return '/admin';
      default:
        return '/user-dashboard';
    }
  };

  const handleSettingsClick = () => {
    switch (userType) {
      case 'companion':
        // Navigate to talent dashboard with profile tab parameter
        navigate('/talent-dashboard?tab=profile');
        toast({
          title: "Settings",
          description: "Navigating to profile settings...",
        });
        break;
      case 'admin':
        navigate('/admin');
        break;
      default:
        navigate('/user-dashboard');
        break;
    }
  };

  // Check user capabilities on mount and when user changes
  useEffect(() => {
    if (user?.email) {
      console.log('DashboardHeader: Checking capabilities for user:', user.email);
      checkUserCapabilities();
    }
  }, [user?.email, user?.id]); // Also depend on user ID changes

  // Add a periodic check for capability changes
  useEffect(() => {
    if (user?.email) {
      const interval = setInterval(() => {
        console.log('DashboardHeader: Periodic capability check...');
        checkUserCapabilities();
      }, 10000); // Check every 10 seconds

      return () => clearInterval(interval);
    }
  }, [user?.email]);

  const checkUserCapabilities = async () => {
    if (!user?.id && !user?.email) {
      console.log('No user ID or email for capability check');
      return;
    }

    try {
      console.log('Checking capabilities for user:', { id: user.id, email: user.email });

      // Query by email to find ALL profiles for this user (both user and companion)
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('user_type, verification_status, status, id, email')
        .eq('email', user.email);

      console.log('Query by email result:', { profiles, error });

      if (error) {
        console.error('Error checking user capabilities:', error);
        return;
      }

      console.log('Found profiles for capability check:', profiles);

      if (profiles && profiles.length > 0) {
        // Be more flexible with status - allow active or pending profiles
        const hasUserProfile = profiles.some(p =>
          p.user_type === 'user' && (p.status === 'active' || p.status === 'pending')
        );
        const hasCompanionProfile = profiles.some(p =>
          p.user_type === 'companion' && (p.status === 'active' || p.status === 'pending')
        );

        console.log('Profile capabilities result:', {
          hasUserProfile,
          hasCompanionProfile,
          totalProfiles: profiles.length,
          profiles: profiles.map(p => ({
            user_type: p.user_type,
            status: p.status,
            verification_status: p.verification_status,
            id: p.id,
            email: p.email
          }))
        });

        // Debug: Show detailed profile analysis
        console.log('Detailed profile analysis:');
        profiles.forEach((profile, index) => {
          console.log(`Profile ${index + 1}:`, {
            user_type: profile.user_type,
            email: profile.email,
            id: profile.id,
            isCompanion: profile.user_type === 'companion',
            isUser: profile.user_type === 'user'
          });
        });

        // User can switch to talent dashboard if they have a companion profile
        setCanSwitchToTalent(hasCompanionProfile);
        // User can switch to user dashboard if they have a user profile
        setCanSwitchToUser(hasUserProfile);

        console.log('DashboardHeader: Set canSwitchToTalent =', hasCompanionProfile, 'canSwitchToUser =', hasUserProfile);
      } else {
        console.log('No profiles found for user:', { id: user.id, email: user.email });
      }
    } catch (error) {
      console.error('Error checking user capabilities:', error);
    }
  };

  const handleAccountSwitch = async (targetType: 'user' | 'companion') => {
    console.log('DashboardHeader: handleAccountSwitch called with:', targetType);
    console.log('DashboardHeader: Current capabilities:', { canSwitchToUser, canSwitchToTalent });

    if (targetType === 'user') {
      if (canSwitchToUser) {
        const success = await switchUserType('user');
        if (success) {
          navigate('/user-dashboard');
          toast({
            title: "Switched to User Account",
            description: "You are now using your regular user account.",
          });
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
          toast({
            title: "Switched to Talent Account",
            description: "You are now using your talent account.",
          });
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

  const navigationItems = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Services', href: '/services', icon: MessageSquare },
    { name: 'Browse Talents', href: '/talents', icon: Users },
    { name: 'How It Works', href: '/how-it-works', icon: HelpCircle },
    { name: 'Safety', href: '/safety', icon: Shield },
    { name: 'Contact', href: '/contact', icon: Phone },
  ];

  const handleNotificationClick = () => {
    console.log('Notifications clicked');
    // Add notification functionality here
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo and Title Section */}
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2">
              <img 
                src="/lovable-uploads/2b715270-d5ae-4f6c-be60-2dfaf1662139.png" 
                alt="Temanly Logo"
                className="h-8 w-auto"
              />
            </Link>
            <div className="hidden md:block">
              <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
              {subtitle && <p className="text-gray-600 text-sm">{subtitle}</p>}
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-8">
            {navigationItems.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className="flex items-center gap-2 text-gray-700 hover:text-pink-600 transition-colors"
              >
                <item.icon className="w-4 h-4" />
                <span>{item.name}</span>
              </Link>
            ))}
          </nav>

          {/* Right Section - Actions */}
          <div className="flex items-center gap-4">
            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>

            {/* Notifications */}
            <Button 
              variant="ghost" 
              size="sm" 
              className="relative"
              onClick={handleNotificationClick}
            >
              <Bell className="w-5 h-5" />
              {notificationCount > 0 && (
                <Badge className="absolute -top-1 -right-1 px-1 py-0 text-xs bg-red-500 text-white">
                  {notificationCount > 99 ? '99+' : notificationCount}
                </Badge>
              )}
            </Button>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span className="hidden md:inline">{user?.name || 'User'}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-white">
                <DropdownMenuItem onClick={() => {
                  console.log('DashboardHeader: Profile clicked, navigating to:', getProfilePath());
                  navigate(getProfilePath());
                }}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  console.log('DashboardHeader: Settings clicked');
                  handleSettingsClick();
                }}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />

                {/* Debug: Manual capability refresh */}
                <DropdownMenuItem onClick={() => {
                  console.log('DashboardHeader: Manual capability refresh clicked');
                  checkUserCapabilities();
                  toast({
                    title: "Capabilities Refreshed",
                    description: "Account capabilities have been refreshed.",
                  });
                }}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  <span>Refresh Capabilities</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                {/* Account Switching */}
                {userType === 'user' && canSwitchToTalent && (
                  <DropdownMenuItem onClick={() => handleAccountSwitch('companion')}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    <span>Switch to Talent Dashboard</span>
                  </DropdownMenuItem>
                )}
                {userType === 'companion' && canSwitchToUser && (
                  <DropdownMenuItem onClick={() => handleAccountSwitch('user')}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    <span>Switch to User Dashboard</span>
                  </DropdownMenuItem>
                )}

                {/* Show info when switching is not available */}
                {userType === 'user' && !canSwitchToTalent && (
                  <DropdownMenuItem
                    onClick={() => {
                      console.log('DashboardHeader: Become a Talent clicked');
                      toast({
                        title: "Become a Talent",
                        description: "To access the talent dashboard, you need to register as a talent. You can use the same email address.",
                        variant: "default"
                      });
                    }}
                    className="text-gray-500"
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    <span>Become a Talent</span>
                  </DropdownMenuItem>
                )}
                {userType === 'companion' && !canSwitchToUser && (
                  <DropdownMenuItem
                    onClick={() => toast({
                      title: "Create User Account",
                      description: "To access the user dashboard, you need to register as a regular user. You can use the same email address.",
                      variant: "default"
                    })}
                    className="text-gray-500"
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    <span>Create User Account</span>
                  </DropdownMenuItem>
                )}

                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => {
                  console.log('DashboardHeader: Logout clicked');
                  handleLogout();
                }}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden mt-4 pb-4 border-t border-gray-200">
            <div className="pt-4 space-y-2">
              <div className="md:hidden mb-4">
                <h1 className="text-xl font-bold text-gray-900">{title}</h1>
                {subtitle && <p className="text-gray-600 text-sm">{subtitle}</p>}
              </div>
              {navigationItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:text-pink-600 hover:bg-gray-50 rounded-md transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default DashboardHeader;
