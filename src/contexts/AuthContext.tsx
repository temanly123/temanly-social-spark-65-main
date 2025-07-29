
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  verified: boolean;
  user_type: 'user' | 'companion' | 'admin';
  verification_status: 'pending' | 'verified' | 'rejected';
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (userData: SignupData) => Promise<{ needsVerification: boolean }>;
  logout: () => void;
  switchUserType: (targetType: 'user' | 'companion') => Promise<boolean>;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface SignupData {
  name: string;
  email: string;
  phone: string;
  password: string;
  user_type?: 'user' | 'companion';
  additionalData?: {
    age?: number;
    location?: string;
    bio?: string;
    zodiac?: string;
    loveLanguage?: string;
    services?: string[];
    availableServices?: string[];
    rentLoverDetails?: {
      price: number;
      inclusions: string[];
      description: string;
    };
    hourlyRate?: number;
    experienceYears?: number;
    availability?: {
      offlineDate: {
        weekdays: string[];
        timeSlots: string[];
      };
      partyBuddy: {
        available: boolean;
        weekends: string[];
      };
      general: string[];
    } | string[];
    dateInterests?: string[];
    languages?: string[];
    specialties?: string[];
    transportationMode?: string;
    emergencyContact?: string;
    emergencyPhone?: string;
    hasIdCard?: boolean;
    hasProfilePhoto?: boolean;
    idCardFile?: File;
    profilePhotoFile?: File;
    interests?: string[];
    registrationTimestamp?: string;
    formVersion?: string;
    completionStatus?: string;
    businessModel?: string;
  };
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // Get initial session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Session error:', error);
          if (mounted) {
            setIsLoading(false);
          }
          return;
        }

        if (session?.user && mounted) {
          console.log('Found existing session for user:', session.user.id);
          await fetchUserProfile(session.user.id);
        } else if (mounted) {
          console.log('No existing session found');
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      console.log('Auth state changed:', event, session?.user?.id);
      
      if (event === 'SIGNED_IN' && session?.user) {
        // Defer profile fetching to avoid deadlocks
        setTimeout(() => {
          if (mounted) {
            fetchUserProfile(session.user.id);
          }
        }, 0);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setIsLoading(false);
      }
    });

    // Initialize auth
    initializeAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      console.log('Fetching profile for user:', userId);

      // Get the auth user's email first
      const { data: authUser } = await supabase.auth.getUser();
      const userEmail = authUser.user?.email;

      if (!userEmail) {
        console.error('No email found for auth user');
        setIsLoading(false);
        return;
      }

      // Query by email to get ALL profiles for this user (both user and companion)
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', userEmail);

      console.log('Fetching profiles by email:', userEmail, 'Found:', profiles?.length || 0);

      if (error) {
        console.error('Profile fetch error:', error);
        setIsLoading(false);
        return;
      }

      if (!profiles || profiles.length === 0) {
        console.log('No profiles found for email:', userEmail);

        // Create a basic user profile if none exists
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            email: userEmail,
            name: authUser.user?.user_metadata?.full_name || 'User',
            full_name: authUser.user?.user_metadata?.full_name || 'User',
            phone: authUser.user?.user_metadata?.phone || '',
            user_type: 'user',
            verification_status: 'verified',
            status: 'active'
          });

        if (!insertError) {
          // Retry fetching the profile
          setTimeout(() => fetchUserProfile(userId), 100);
          return;
        }

        setIsLoading(false);
        return;
      }

      console.log('Found profiles:', profiles.length, profiles.map(p => ({ user_type: p.user_type, status: p.status })));

      // Handle multiple profiles case
      let selectedProfile;

      // First, check if there's a persisted profile selection
      const persistedSelection = localStorage.getItem('selectedProfile');
      if (persistedSelection) {
        try {
          const { profileId, userType, email } = JSON.parse(persistedSelection);
          console.log('Found persisted profile selection:', { profileId, userType, email });

          // Find the persisted profile in the current profiles
          const persistedProfile = profiles.find(p => p.id === profileId && p.user_type === userType);
          if (persistedProfile) {
            selectedProfile = persistedProfile;
            console.log('Using persisted profile:', userType);
          } else {
            console.log('Persisted profile not found, clearing localStorage');
            localStorage.removeItem('selectedProfile');
          }
        } catch (error) {
          console.error('Error parsing persisted profile:', error);
          localStorage.removeItem('selectedProfile');
        }
      }

      // If no persisted profile or it wasn't found, use the original logic
      if (!selectedProfile) {
        if (profiles.length === 1) {
          selectedProfile = profiles[0];
          console.log('Single profile found:', selectedProfile.user_type);
        } else {
          // Multiple profiles - prioritize active companion profile, then active user profile
          const activeProfiles = profiles.filter(p => p.status === 'active');
          const companionProfile = activeProfiles.find(p => p.user_type === 'companion');
          const userProfile = activeProfiles.find(p => p.user_type === 'user');

          // Check current URL to determine preferred profile type
          const currentPath = window.location.pathname;
          if (currentPath.includes('talent-dashboard') && companionProfile) {
            selectedProfile = companionProfile;
            console.log('Selected companion profile for talent dashboard');
          } else if (currentPath.includes('user-dashboard') && userProfile) {
            selectedProfile = userProfile;
            console.log('Selected user profile for user dashboard');
          } else if (currentPath.includes('book-talent') && userProfile) {
            // For booking pages, prefer user profile
            selectedProfile = userProfile;
            console.log('Selected user profile for booking page');
          } else if (companionProfile) {
            selectedProfile = companionProfile;
            console.log('Defaulting to companion profile');
          } else if (userProfile) {
            selectedProfile = userProfile;
            console.log('Defaulting to user profile');
          } else {
            selectedProfile = profiles[0];
            console.log('Using first available profile');
          }
        }
      }

      console.log('Selected profile data:', selectedProfile);

      setUser({
        id: selectedProfile.id,
        name: selectedProfile.name || selectedProfile.full_name || 'User',
        email: selectedProfile.email || '',
        phone: selectedProfile.phone,
        verified: selectedProfile.verification_status === 'verified',
        user_type: selectedProfile.user_type || 'user',
        verification_status: selectedProfile.verification_status || 'verified'
      });
    } catch (error) {
      console.error('Error fetching user profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkExistingUser = async (email: string, phone: string, requestedUserType: 'user' | 'companion' = 'user') => {
    try {
      console.log('🔍 [AuthContext] Checking existing user for:', { email, phone, requestedUserType });

      // Check if email exists in profiles table (phone numbers can be reused)
      // Allow same email for different user types (user and companion)
      const { data: profilesData, error: profileError } = await supabase
        .from('profiles')
        .select('email, phone, verification_status, user_type, status, name')
        .eq('email', email);

      if (profileError) {
        console.error('❌ [AuthContext] Error checking existing users:', profileError);
        return { exists: false };
      }

      if (profilesData && profilesData.length > 0) {
        console.log('📧 [AuthContext] Found existing profiles for email:', profilesData.map(p => ({
          user_type: p.user_type,
          verification_status: p.verification_status,
          status: p.status
        })));

        // Find profile with the same user type
        const existingProfile = profilesData.find(profile => profile.user_type === requestedUserType);

        if (existingProfile) {
          console.log('🔍 [AuthContext] Found existing profile with same user type:', existingProfile);

          // Allow re-registration if user was rejected
          if (existingProfile.verification_status === 'rejected' || existingProfile.status === 'rejected') {
            console.log('🔄 [AuthContext] User was previously rejected for same role, allowing re-registration:', email);
            return {
              exists: false, // Allow registration to proceed
              wasRejected: true,
              previousProfile: existingProfile
            };
          }

          // Check if user is inactive (can re-register)
          if (existingProfile.status === 'inactive') {
            console.log('✅ [AuthContext] User is inactive, allowing re-registration');
            return { exists: false };
          }

          // Check if user is banned (cannot re-register)
          if (existingProfile.status === 'banned') {
            console.log('🚫 [AuthContext] User is banned, blocking registration');
            return {
              exists: true,
              type: 'email',
              status: existingProfile.verification_status,
              userType: existingProfile.user_type,
              message: `Akun dengan email ${email} telah diblokir. Silakan hubungi customer service untuk informasi lebih lanjut.`
            };
          }

          // Same user type - block if user is active or pending
          return {
            exists: true,
            type: 'email',
            status: existingProfile.verification_status,
            userType: existingProfile.user_type,
            message: `Email ${email} sudah terdaftar sebagai ${existingProfile.user_type === 'companion' ? 'Talent' : 'User Reguler'} dan ${existingProfile.verification_status === 'pending' ? 'sedang menunggu verifikasi' : 'sudah terverifikasi'}. Silakan login dengan akun yang sudah ada.`
          };
        } else {
          // No profile with the same user type found - allow registration
          console.log('✅ [AuthContext] No profile with same user type found, allowing registration for different user type');
        }

        // WhatsApp numbers can be reused - no phone validation needed
        console.log('✅ [AuthContext] WhatsApp numbers are allowed to be reused across different accounts');
      }

      return { exists: false };
    } catch (error) {
      console.error('Error checking existing users:', error);
      return { exists: false };
    }
  };

  const signup = async (userData: SignupData): Promise<{ needsVerification: boolean }> => {
    try {
      console.log('🚀 [AuthContext] Starting comprehensive signup process for:', userData.email, 'as', userData.user_type);

      // Check if user already exists
      console.log('🔍 [AuthContext] Checking for existing user...');
      const existingUser = await checkExistingUser(userData.email, userData.phone, userData.user_type || 'user');
      console.log('📊 [AuthContext] Existing user check result:', existingUser);

      if (existingUser.exists) {
        // Use the custom message if available (for cross-role attempts), otherwise use default
        const message = existingUser.message || (existingUser.type === 'email'
          ? `Email sudah terdaftar dengan status ${existingUser.status}. Silakan gunakan email lain atau login jika Anda sudah memiliki akun.`
          : `Nomor WhatsApp sudah terdaftar dengan status ${existingUser.status}. Silakan gunakan nomor lain atau login jika Anda sudah memiliki akun.`);

        const title = existingUser.crossRoleAttempt ? "❌ Email/Nomor Sudah Terdaftar" : "Pendaftaran Gagal";

        toast({
          title: title,
          description: message,
          variant: "destructive"
        });
        throw new Error(message);
      }

      // Handle re-registration after rejection
      if (existingUser.wasRejected && existingUser.previousProfile) {
        console.log('🔄 [AuthContext] Cleaning up previous rejected user data before re-registration');

        try {
          const oldUserId = existingUser.previousProfile.id;

          // Use the admin-delete-user edge function for thorough cleanup
          console.log('🗑️ [AuthContext] Calling admin-delete-user function for thorough cleanup...');
          const { data: deleteResult, error: deleteError } = await supabase.functions.invoke('admin-delete-user', {
            body: { userId: oldUserId }
          });

          if (deleteError) {
            console.warn('⚠️ [AuthContext] Edge function cleanup failed, trying manual cleanup:', deleteError);

            // Fallback to manual cleanup
            await supabase.from('verification_documents').delete().eq('user_id', oldUserId);
            await supabase.from('profiles').delete().eq('id', oldUserId);

            console.log('✅ [AuthContext] Manual cleanup completed');
          } else {
            console.log('✅ [AuthContext] Edge function cleanup completed:', deleteResult);
          }

          toast({
            title: "🔄 Re-registrasi Diizinkan",
            description: "Data lama telah dibersihkan. Anda dapat mendaftar ulang dengan email/nomor yang sama.",
            className: "bg-blue-50 border-blue-200"
          });

        } catch (cleanupError) {
          console.warn('⚠️ [AuthContext] Cleanup failed, but continuing with registration:', cleanupError);

          // Even if cleanup fails, allow registration to proceed
          toast({
            title: "⚠️ Cleanup Parsial",
            description: "Beberapa data lama mungkin masih ada, tapi registrasi akan dilanjutkan.",
            variant: "default"
          });
        }
      }
      
      // For talent registration, we'll use a comprehensive approach
      if (userData.user_type === 'companion') {
        console.log('🎯 Creating comprehensive talent user with detailed data');
        console.log('📊 AdditionalData received:', userData.additionalData);

        // Clean up any orphaned documents before creating new user (if function exists)
        console.log('🧹 [AuthContext] Attempting to clean up orphaned documents...');
        try {
          const { error: cleanupError } = await supabase.rpc('cleanup_orphaned_documents');
          if (cleanupError) {
            if (cleanupError.code === 'PGRST202') {
              console.log('ℹ️ [AuthContext] Cleanup function not available yet (normal for new setup)');
            } else {
              console.warn('⚠️ [AuthContext] Cleanup warning:', cleanupError);
            }
          } else {
            console.log('✅ [AuthContext] Orphaned documents cleaned up');
          }
        } catch (cleanupError) {
          console.log('ℹ️ [AuthContext] Cleanup function not available (non-critical)');
        }
        
        // Prepare comprehensive metadata
        const userMetadata = {
          name: userData.name,
          full_name: userData.name,
          user_type: userData.user_type,
          phone: userData.phone,
          // Include all additional data in metadata for easy access
          ...userData.additionalData
        };
        
        // First, create the auth user with comprehensive metadata
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: userData.email,
          password: userData.password,
          options: {
            data: userMetadata,
            emailRedirectTo: `${window.location.origin}/`
          }
        });

        if (authError) {
          console.error('❌ Auth signup error:', authError);
          throw authError;
        }

        if (authData.user) {
          console.log('✅ Talent user created in auth:', authData.user.id);
          
          // Wait a moment for the trigger to create the basic profile
          console.log('⏳ Waiting for trigger to create basic profile...');
          await new Promise(resolve => setTimeout(resolve, 1000));

          // Check if profile was created by trigger using direct query
          console.log('🔍 Checking if trigger created the profile...');
          const { data: existingProfile, error: checkError } = await supabase
            .from('profiles')
            .select('id, email, name, user_type')
            .eq('id', authData.user.id)
            .maybeSingle();

          if (checkError || !existingProfile) {
            console.log('⚠️ Trigger did not create profile, will create directly');

            // Create profile directly using INSERT
            console.log('🔧 Creating profile directly with comprehensive data...');

            const directProfileData = {
              id: authData.user.id,
              email: userData.email,
              name: userData.name,
              full_name: userData.name,
              phone: userData.phone,
              user_type: 'companion' as const,
              verification_status: 'pending' as const,
              status: 'active' as const,
              age: userData.additionalData?.age || null,
              location: userData.additionalData?.location || null,
              bio: userData.additionalData?.bio || null,
              zodiac: userData.additionalData?.zodiac || null,
              love_language: userData.additionalData?.loveLanguage || null,
              profile_data: userData.additionalData || {},
              city: userData.additionalData?.location || null,
              party_buddy_eligible: false,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };

            // Try using upsert instead of insert to handle conflicts better
            const { data: createdProfile, error: createError } = await supabase
              .from('profiles')
              .upsert(directProfileData, {
                onConflict: 'id',
                ignoreDuplicates: false
              })
              .select()
              .single();

            if (createError) {
              console.error('❌ Direct profile creation failed:', createError);
              throw createError;
            }

            console.log('✅ Profile created directly:', createdProfile);
          } else {
            console.log('✅ Trigger created profile successfully:', existingProfile);
          }

          // Update the profile with comprehensive data (either created by trigger or manually)
          console.log('🔄 Updating profile with comprehensive talent data...');

          const profileUpdateData = {
            // Update basic fields
            full_name: userData.name,
            phone: userData.phone,
            verification_status: 'pending' as const,
            status: 'pending' as const,
            updated_at: new Date().toISOString(),

            // Extract key fields for direct database access
            age: userData.additionalData?.age || null,
            location: userData.additionalData?.location || null,
            bio: userData.additionalData?.bio || null,
            zodiac: userData.additionalData?.zodiac || null,
            love_language: userData.additionalData?.loveLanguage || null,
            hourly_rate: userData.additionalData?.hourlyRate || null,

            // Store ALL comprehensive data in profile_data JSON field
            profile_data: {
              // Personal Information
              personalInfo: {
                age: userData.additionalData?.age,
                location: userData.additionalData?.location,
                bio: userData.additionalData?.bio,
                zodiac: userData.additionalData?.zodiac,
                loveLanguage: userData.additionalData?.loveLanguage
              },

              // Services & Pricing
              services: {
                availableServices: userData.additionalData?.availableServices || userData.additionalData?.services || [],
                hourlyRate: userData.additionalData?.hourlyRate || 0,
                rentLoverDetails: userData.additionalData?.rentLoverDetails || {}
              },

              // Availability & Scheduling
              availability: userData.additionalData?.availability || {},

              // Interests & Preferences
              preferences: {
                dateInterests: userData.additionalData?.dateInterests || [],
                languages: userData.additionalData?.languages || ['Bahasa Indonesia'],
                specialties: userData.additionalData?.specialties || []
              },

              // Additional Information
              additionalInfo: {
                transportationMode: userData.additionalData?.transportationMode || '',
                emergencyContact: userData.additionalData?.emergencyContact || '',
                emergencyPhone: userData.additionalData?.emergencyPhone || ''
              },

              // Document Status
              documents: {
                hasIdCard: userData.additionalData?.hasIdCard || false,
                hasProfilePhoto: userData.additionalData?.hasProfilePhoto || false,
                idCardUploaded: !!userData.additionalData?.idCardFile,
                profilePhotoUploaded: !!userData.additionalData?.profilePhotoFile
              },

              // Registration Metadata
              metadata: {
                registrationTimestamp: userData.additionalData?.registrationTimestamp || new Date().toISOString(),
                formVersion: userData.additionalData?.formVersion || '4.0-comprehensive',
                businessModel: userData.additionalData?.businessModel || 'temanly-hybrid',
                dataCompleteness: {
                  personalInfo: !!(userData.additionalData?.age && userData.additionalData?.location && userData.additionalData?.bio),
                  services: !!(userData.additionalData?.services?.length),
                  availability: !!(userData.additionalData?.availability),
                  documents: !!(userData.additionalData?.hasIdCard && userData.additionalData?.hasProfilePhoto),
                  emergencyContact: !!(userData.additionalData?.emergencyContact && userData.additionalData?.emergencyPhone)
                }
              }
            }
          };

          console.log('💾 Updating profile with comprehensive data...');

          let profile;
          const { data: updatedProfile, error: profileError } = await supabase
            .from('profiles')
            .update(profileUpdateData)
            .eq('id', authData.user.id)
            .select()
            .single();

          if (profileError) {
            console.error('❌ Error updating comprehensive talent profile:', profileError);
            console.error('❌ Profile update data that failed:', JSON.stringify(profileUpdateData, null, 2));

            // If update failed, the profile might not exist - try direct creation as last resort
            console.log('🔄 Profile update failed, trying direct creation as last resort...');

            const lastResortProfileData = {
              id: authData.user.id,
              email: userData.email,
              name: userData.name,
              full_name: userData.name,
              phone: userData.phone,
              user_type: 'companion' as const,
              verification_status: 'pending' as const,
              status: 'active' as const,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              ...profileUpdateData
            };

            const { data: lastResortProfile, error: lastResortError } = await supabase
              .from('profiles')
              .insert(lastResortProfileData)
              .select()
              .single();

            if (lastResortError) {
              console.error('❌ Last resort profile creation also failed:', lastResortError);
              throw lastResortError;
            }

            console.log('✅ Profile created as last resort:', lastResortProfile);

            profile = lastResortProfile;
          } else {
            profile = updatedProfile;
          }

          console.log('✅ Comprehensive talent profile created successfully!');
          console.log('✅ Created profile data:', JSON.stringify(profile, null, 2));

          // Create talent services entries from availableServices
          const servicesToCreate = userData.additionalData?.availableServices || userData.additionalData?.services || [];
          if (servicesToCreate && servicesToCreate.length > 0) {
            console.log('📋 Creating talent services entries for:', servicesToCreate);

            // Map service names to database enum values
            const serviceTypeMapping: { [key: string]: string } = {
              'chat': 'chat',
              'call': 'call',
              'video call': 'video_call',
              'video_call': 'video_call',
              'offline date': 'offline_date',
              'offline_date': 'offline_date',
              'party buddy': 'party_buddy',
              'party_buddy': 'party_buddy',
              'rent a lover': 'rent_lover',
              'rent_lover': 'rent_lover',
              'rent lover': 'rent_lover'
            };

            const talentServices = servicesToCreate.map((service: string) => {
              const normalizedService = service.toLowerCase().trim();
              const serviceType = serviceTypeMapping[normalizedService] || normalizedService.replace(/[\s-]/g, '_');

              console.log(`🔄 Mapping service "${service}" -> "${serviceType}"`);

              return {
                talent_id: authData.user.id,
                service_type: serviceType,
                description: `${service} service by ${userData.name}`,
                custom_rate: userData.additionalData?.hourlyRate || null,
                is_available: true,
                created_at: new Date().toISOString()
              };
            });

            const { error: servicesError } = await supabase
              .from('talent_services')
              .insert(talentServices);

            if (servicesError) {
              console.error('⚠️ Error creating talent services:', servicesError);
              // Don't throw error here, profile was created successfully
            } else {
              console.log('✅ Talent services created successfully');
            }
          }

          // Create talent interests entries if dateInterests are provided
          if (userData.additionalData?.dateInterests && userData.additionalData.dateInterests.length > 0) {
            console.log('💝 Creating talent interests entries...');

            const talentInterests = userData.additionalData.dateInterests.map((interest: string) => ({
              talent_id: authData.user.id,
              interest: interest,
              created_at: new Date().toISOString()
            }));

            const { error: interestsError } = await supabase
              .from('talent_interests')
              .insert(talentInterests);

            if (interestsError) {
              console.error('⚠️ Error creating talent interests:', interestsError);
              // Don't throw error here, profile was created successfully
            } else {
              console.log('✅ Talent interests created successfully');
            }
          }

          // Handle document uploads if files are provided - using base64 storage for admin compatibility
          if (userData.additionalData && (userData.additionalData.idCardFile || userData.additionalData.profilePhotoFile)) {
            console.log('📤 [AuthContext] Starting document upload for user:', authData.user.id);
            console.log('📤 [AuthContext] Files to upload:', {
              hasIdCard: !!userData.additionalData.idCardFile,
              hasProfilePhoto: !!userData.additionalData.profilePhotoFile,
              idCardName: userData.additionalData.idCardFile?.name,
              profilePhotoName: userData.additionalData.profilePhotoFile?.name
            });

            try {
              // Helper function to convert file to base64
              const fileToBase64 = (file: File): Promise<string> => {
                return new Promise((resolve, reject) => {
                  const reader = new FileReader();
                  reader.onload = () => {
                    const result = reader.result as string;
                    console.log('✅ [AuthContext] File converted to base64, length:', result.length);
                    resolve(result);
                  };
                  reader.onerror = (error) => {
                    console.error('❌ [AuthContext] FileReader error:', error);
                    reject(error);
                  };
                  reader.readAsDataURL(file);
                });
              };

              // Upload ID card
              if (userData.additionalData.idCardFile) {
                console.log('📄 [AuthContext] Converting ID card to base64...');
                const idCardBase64 = await fileToBase64(userData.additionalData.idCardFile);
                console.log('📄 [AuthContext] ID card base64 ready, length:', idCardBase64.length);

                console.log('💾 [AuthContext] Saving ID card to database...');
                const { data: idData, error: idInsertError } = await supabase
                  .from('verification_documents')
                  .upsert({
                    user_id: authData.user.id,
                    document_type: 'id_card',
                    document_url: idCardBase64,
                    file_name: userData.additionalData.idCardFile.name,
                    file_size: userData.additionalData.idCardFile.size,
                    content_type: userData.additionalData.idCardFile.type,
                    status: 'pending'
                  }, {
                    onConflict: 'user_id,document_type'
                  })
                  .select()
                  .single();

                if (idInsertError) {
                  console.error('❌ [AuthContext] ID card database error:', idInsertError);
                  throw new Error(`Failed to save ID card: ${idInsertError.message}`);
                }

                if (idData) {
                  console.log('✅ [AuthContext] ID card saved successfully:', {
                    id: idData.id,
                    user_id: idData.user_id,
                    document_type: idData.document_type,
                    status: idData.status,
                    file_name: idData.file_name,
                    url_length: idData.document_url?.length || 0
                  });
                } else {
                  console.error('❌ [AuthContext] ID card save returned no data');
                  throw new Error('ID card save returned no data');
                }
              }

              // Upload profile photo
              if (userData.additionalData.profilePhotoFile) {
                console.log('📸 [AuthContext] Converting profile photo to base64...');
                const profilePhotoBase64 = await fileToBase64(userData.additionalData.profilePhotoFile);
                console.log('📸 [AuthContext] Profile photo base64 ready, length:', profilePhotoBase64.length);

                console.log('💾 [AuthContext] Saving profile photo to database...');
                const { data: photoData, error: photoInsertError } = await supabase
                  .from('verification_documents')
                  .upsert({
                    user_id: authData.user.id,
                    document_type: 'profile_photo',
                    document_url: profilePhotoBase64,
                    file_name: userData.additionalData.profilePhotoFile.name,
                    file_size: userData.additionalData.profilePhotoFile.size,
                    content_type: userData.additionalData.profilePhotoFile.type,
                    status: 'pending'
                  }, {
                    onConflict: 'user_id,document_type'
                  })
                  .select()
                  .single();

                if (photoInsertError) {
                  console.error('❌ [AuthContext] Profile photo database error:', photoInsertError);
                  throw new Error(`Failed to save profile photo: ${photoInsertError.message}`);
                }

                if (photoData) {
                  console.log('✅ [AuthContext] Profile photo saved successfully:', {
                    id: photoData.id,
                    user_id: photoData.user_id,
                    document_type: photoData.document_type,
                    status: photoData.status,
                    file_name: photoData.file_name,
                    url_length: photoData.document_url?.length || 0
                  });
                } else {
                  console.error('❌ [AuthContext] Profile photo save returned no data');
                  throw new Error('Profile photo save returned no data');
                }
              }

              // Verify documents were saved with a small delay to ensure database consistency
              await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay

              const { data: verifyDocs, error: verifyError } = await supabase
                .from('verification_documents')
                .select('*')
                .eq('user_id', authData.user.id);

              if (verifyError) {
                console.warn('⚠️ [AuthContext] Could not verify document save:', verifyError);
              } else {
                console.log('✅ [AuthContext] Document verification:', verifyDocs?.length, 'documents saved');

                // Double-check that documents have valid base64 data
                const validDocs = verifyDocs?.filter(doc => doc.document_url?.startsWith('data:image/'));
                console.log('✅ [AuthContext] Valid base64 documents:', validDocs?.length || 0);
              }

            } catch (uploadError) {
              console.error('❌ [AuthContext] Document upload error:', uploadError);

              // If document upload fails, we should still allow the user to be created
              // but mark them as needing to re-upload documents
              toast({
                title: "Dokumen Gagal Diupload",
                description: `Akun berhasil dibuat, namun dokumen gagal diupload: ${uploadError instanceof Error ? uploadError.message : 'Unknown error'}. Silakan upload ulang melalui profil Anda.`,
                variant: "destructive"
              });

              // Don't throw the error - allow registration to continue
              console.log('⚠️ [AuthContext] Continuing registration despite document upload failure');
            }
          }

          toast({
            title: "Registrasi Talent Berhasil!",
            description: "Data lengkap dan dokumen Anda telah diterima. Admin akan memverifikasi dalam 1-2 hari kerja.",
            className: "bg-green-50 border-green-200"
          });

          return { needsVerification: true };
        } else {
        // Regular user signup
        console.log('🔵 [AuthContext] Starting regular user signup for:', userData.email);

        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: userData.email,
          password: userData.password,
          options: {
            data: {
              full_name: userData.name,
              user_type: userData.user_type || 'user',
              phone: userData.phone
            }
          }
        });

        if (authError) {
          console.error('❌ [AuthContext] Auth signup error:', authError);
          console.error('❌ [AuthContext] Auth error details:', JSON.stringify(authError, null, 2));
          throw new Error(`Registration failed: ${authError.message}`);
        }

        if (!authData.user) {
          console.error('❌ [AuthContext] No user data returned from signup');
          throw new Error('Registration failed: No user data returned');
        }

        console.log('✅ [AuthContext] User created in auth:', authData.user.id);

        // Wait a moment for the trigger to potentially create the profile
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Check if profile was created by trigger
        const { data: existingProfile, error: checkError } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', authData.user.id)
          .maybeSingle();

        if (checkError) {
          console.error('❌ [AuthContext] Error checking existing profile:', checkError);
        }

        if (!existingProfile) {
          console.log('📝 [AuthContext] Profile not created by trigger, creating manually...');

          // Create profile manually with direct insert
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: authData.user.id,
              email: userData.email,
              name: userData.name,
              full_name: userData.name,
              phone: userData.phone,
              user_type: (userData.user_type || 'user') as Database['public']['Enums']['user_type'],
              verification_status: 'verified' as Database['public']['Enums']['verification_status'],
              status: 'active' as Database['public']['Enums']['user_status'],
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .select()
            .single();

          if (profileError) {
            console.error('❌ [AuthContext] Manual profile creation error:', profileError);
            console.error('❌ [AuthContext] Profile error details:', JSON.stringify(profileError, null, 2));
            throw new Error(`Profile creation failed: ${profileError.message}`);
          }

          console.log('✅ [AuthContext] Profile created manually:', profileData);
        } else {
          console.log('✅ [AuthContext] Profile already exists from trigger');
        }

          // Handle document upload for regular users if provided
          if (userData.additionalData?.idCardFile) {
            console.log('📄 [AuthContext] Processing ID card upload for regular user...');

            try {
              // Helper function to convert file to base64
              const fileToBase64 = (file: File): Promise<string> => {
                return new Promise((resolve, reject) => {
                  const reader = new FileReader();
                  reader.onload = () => {
                    const result = reader.result as string;
                    console.log('✅ [AuthContext] File converted to base64, length:', result.length);
                    resolve(result);
                  };
                  reader.onerror = (error) => {
                    console.error('❌ [AuthContext] FileReader error:', error);
                    reject(error);
                  };
                  reader.readAsDataURL(file);
                });
              };

              const idCardBase64 = await fileToBase64(userData.additionalData.idCardFile);
              console.log('📄 [AuthContext] ID card base64 ready, length:', idCardBase64.length);

              console.log('💾 [AuthContext] Saving ID card to database...');
              const { data: idData, error: idInsertError } = await supabase
                .from('verification_documents')
                .upsert({
                  user_id: authData.user.id,
                  document_type: 'id_card',
                  document_url: idCardBase64,
                  file_name: userData.additionalData.idCardFile.name,
                  file_size: userData.additionalData.idCardFile.size,
                  content_type: userData.additionalData.idCardFile.type,
                  status: 'pending'
                }, {
                  onConflict: 'user_id,document_type'
                })
                .select()
                .single();

              if (idInsertError) {
                console.error('❌ [AuthContext] ID card database error:', idInsertError);
                console.error('❌ [AuthContext] ID card error details:', JSON.stringify(idInsertError, null, 2));
                // Don't fail the entire registration for document upload issues
                toast({
                  title: "⚠️ Peringatan",
                  description: "Registrasi berhasil, tetapi upload dokumen gagal. Anda dapat mengupload ulang nanti.",
                  variant: "default"
                });
              } else if (idData) {
                console.log('✅ [AuthContext] ID card saved successfully for regular user:', {
                  id: idData.id,
                  user_id: idData.user_id,
                  document_type: idData.document_type,
                  status: idData.status,
                  file_name: idData.file_name,
                  url_length: idData.document_url?.length || 0
                });
              }
            } catch (docError) {
              console.error('❌ [AuthContext] Document upload failed for regular user:', docError);
              console.error('❌ [AuthContext] Document error details:', JSON.stringify(docError, null, 2));
              // Don't fail the entire registration for document upload issues
              toast({
                title: "⚠️ Peringatan",
                description: "Registrasi berhasil, tetapi upload dokumen gagal. Anda dapat mengupload ulang nanti.",
                variant: "default"
              });
            }
          }

          toast({
            title: "Registrasi Berhasil!",
            description: "Akun Anda telah dibuat dan siap digunakan.",
            className: "bg-green-50 border-green-200"
          });

          return { needsVerification: false };
        }
      }
    } catch (error) {
      console.error('Signup error:', error);
      toast({
        title: "Registrasi Gagal",
        description: error instanceof Error ? error.message : "Terjadi kesalahan saat mendaftar.",
        variant: "destructive"
      });
      throw error;
    }
  };

  const login = async (email: string, password: string) => {
    try {
      console.log('Attempting login for:', email);



      // Clear any existing auth state first
      try {
        await supabase.auth.signOut();
      } catch (err) {
        // Ignore signout errors
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Login error:', error);
        throw error;
      }

      if (data.user) {
        console.log('Login successful for user:', data.user.id);

        toast({
          title: "Login berhasil!",
          description: "Selamat datang kembali di Temanly.",
          className: "bg-green-50 border-green-200"
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Login gagal",
        description: error instanceof Error ? error.message : "Email atau password salah.",
        variant: "destructive"
      });
      throw error;
    }
  };

  const switchUserType = async (targetType: 'user' | 'companion'): Promise<boolean> => {
    if (!user) {
      console.log('No user found for switching');
      return false;
    }

    try {
      console.log('Switching user type to:', targetType, 'for user email:', user.email);

      // Since the system creates separate auth users for each type,
      // we need to find profiles by email instead of user ID
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', user.email);

      if (error) {
        console.error('Error fetching profiles for switch:', error);
        return false;
      }

      if (!profiles || profiles.length === 0) {
        console.log('No profiles found for email:', user.email);
        return false;
      }

      console.log('Found profiles for switching:', profiles.map(p => ({
        id: p.id,
        user_type: p.user_type,
        status: p.status,
        verification_status: p.verification_status
      })));

      // Find the target profile - be more flexible with status
      let targetProfile = profiles.find(p => p.user_type === targetType && p.status === 'active');

      // If no active profile found, try pending (for talents waiting verification)
      if (!targetProfile) {
        targetProfile = profiles.find(p => p.user_type === targetType && p.status === 'pending');
        console.log('No active profile found, trying pending profile:', !!targetProfile);
      }

      // If still no profile, try any profile with the target type
      if (!targetProfile) {
        targetProfile = profiles.find(p => p.user_type === targetType);
        console.log('No active/pending profile found, trying any profile:', !!targetProfile);
      }

      if (!targetProfile) {
        console.log('Target profile not found for type:', targetType);
        console.log('Available profiles:', profiles.map(p => p.user_type));
        return false;
      }

      console.log('Selected target profile:', {
        id: targetProfile.id,
        user_type: targetProfile.user_type,
        status: targetProfile.status,
        verification_status: targetProfile.verification_status
      });

      // Update the user state with the target profile
      // This allows switching between account types with the same email
      const newUser = {
        id: targetProfile.id,
        name: targetProfile.name || targetProfile.full_name || 'User',
        email: targetProfile.email || '',
        phone: targetProfile.phone,
        verified: targetProfile.verification_status === 'verified',
        user_type: targetProfile.user_type || 'user',
        verification_status: targetProfile.verification_status || 'verified'
      };

      setUser(newUser);

      // Persist the selected profile to localStorage
      localStorage.setItem('selectedProfile', JSON.stringify({
        profileId: targetProfile.id,
        userType: targetProfile.user_type,
        email: targetProfile.email
      }));

      console.log('Successfully switched to:', targetType, 'and persisted to localStorage');
      return true;
    } catch (error) {
      console.error('Error switching user type:', error);
      return false;
    }
  };

  const logout = async () => {
    try {
      console.log('Logging out user');
      setUser(null);
      await supabase.auth.signOut();
      localStorage.removeItem('bookings');
      localStorage.removeItem('transactions');
      localStorage.removeItem('selectedProfile'); // Clear persisted profile selection

      toast({
        title: "Logout berhasil",
        description: "Anda telah keluar dari akun.",
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const isAuthenticated = !!user;

  const value = {
    user,
    login,
    signup,
    logout,
    switchUserType,
    isAuthenticated,
    isLoading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
