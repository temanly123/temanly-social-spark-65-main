
import { supabase } from '@/integrations/supabase/client';

export interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  full_name: string | null;
  phone: string | null;
  user_type: 'user' | 'companion' | 'admin';
  verification_status: 'pending' | 'verified' | 'rejected';
  status: string;
  created_at: string;
  updated_at?: string;
  has_profile: boolean;
  auth_only: boolean;
  // Additional profile fields
  age?: number | null;
  location?: string | null;
  bio?: string | null;
  hourly_rate?: number | null;
  profile_data?: string | null;
  // Additional fields for comprehensive user management
  rating?: number | null;
  total_bookings?: number;
  total_earnings?: number;
  raw_user_meta_data?: any;
  // Missing fields that are used in TalentApprovalSystem
  profile_image?: string | null;
  city?: string | null;
  zodiac?: string | null;
  love_language?: string | null;
  party_buddy_eligible?: boolean | null;
}

export const adminUserService = {
  async getAllUsers(): Promise<{ users: AdminUser[], error: string | null }> {
    try {
      console.log('🔍 [AdminUserService] Starting comprehensive data fetch...');

      let authUsers: any[] = [];
      let profileUsers: any[] = [];

      // Try to get Auth users via function first, but don't fail if it doesn't work
      try {
        console.log('🔍 [AdminUserService] Attempting to fetch Auth users via function...');
        const { data: authData, error: functionError } = await supabase.functions.invoke('admin-get-users', {
          body: {}
        });

        if (functionError) {
          console.warn('⚠️ [AdminUserService] Admin function error:', functionError.message);
        } else if (!authData?.success) {
          console.warn('⚠️ [AdminUserService] Admin function returned unsuccessful:', authData?.error);
        } else {
          authUsers = authData.users || [];
          console.log('✅ [AdminUserService] Auth users fetched via function:', authUsers.length);

          // Enhanced logging of Auth users
          authUsers.forEach((user, index) => {
            console.log(`🔐 [AdminUserService] Auth User ${index + 1}:`, {
              id: user.id.slice(0, 8) + '...',
              email: user.email,
              email_confirmed: !!user.email_confirmed_at,
              user_metadata: user.user_metadata,
              created_at: user.created_at
            });
          });
        }
      } catch (functionError) {
        console.warn('⚠️ [AdminUserService] Edge function not available, continuing with profiles only:', functionError);
      }

      // Always get profiles data with fresh fetch
      console.log('📊 [AdminUserService] Fetching profiles data...');
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select(`
          id,
          email,
          name,
          full_name,
          phone,
          user_type,
          verification_status,
          status,
          created_at,
          updated_at,
          age,
          location,
          bio,
          hourly_rate,
          profile_data,
          profile_image,
          city,
          zodiac,
          love_language,
          party_buddy_eligible
        `)
        .order('created_at', { ascending: false });

      if (profileError) {
        console.error('❌ [AdminUserService] Error fetching profiles:', profileError);
        throw profileError;
      }

      profileUsers = profiles || [];
      console.log('✅ [AdminUserService] Profile users fetched:', profileUsers.length);

      // If no auth users but we have profiles, that's still okay for basic functionality
      if (authUsers.length === 0 && profileUsers.length > 0) {
        console.log('ℹ️ [AdminUserService] Working with profiles only (Auth function unavailable)');
      }
      
      // Enhanced logging of Profile users
      profileUsers.forEach((user, index) => {
        console.log(`👤 [AdminUserService] Profile User ${index + 1}:`, {
          id: user.id.slice(0, 8) + '...',
          email: user.email,
          user_type: user.user_type,
          verification_status: user.verification_status,
          status: user.status,
          age: user.age,
          location: user.location,
          hourly_rate: user.hourly_rate,
          profile_data: user.profile_data ? 'Has data' : 'No data',
          created_at: user.created_at
        });
      });

      // Merge and deduplicate users
      const mergedUsers = this.mergeAuthAndProfileUsers(authUsers, profileUsers);
      
      console.log('🎯 [AdminUserService] Final merged results:');
      console.log('Total merged users:', mergedUsers.length);
      
      // Status breakdown
      const statusBreakdown = mergedUsers.reduce((acc: any, user) => {
        acc[user.verification_status] = (acc[user.verification_status] || 0) + 1;
        return acc;
      }, {});
      console.log('📊 [AdminUserService] Verification status breakdown:', statusBreakdown);
      
      // Type breakdown
      const typeBreakdown = mergedUsers.reduce((acc: any, user) => {
        acc[user.user_type] = (acc[user.user_type] || 0) + 1;
        return acc;
      }, {});
      console.log('📊 [AdminUserService] User type breakdown:', typeBreakdown);
      
      // Auth vs Profile breakdown
      const sourceBreakdown = mergedUsers.reduce((acc: any, user) => {
        if (user.auth_only) acc.authOnly++;
        else if (user.has_profile) acc.hasProfile++;
        return acc;
      }, { authOnly: 0, hasProfile: 0 });
      console.log('📊 [AdminUserService] Source breakdown:', sourceBreakdown);
      
      // Companion user specific logging
      const companionUsers = mergedUsers.filter(u => u.user_type === 'companion');
      console.log('🎯 [AdminUserService] Companion users found:', companionUsers.length);
      companionUsers.forEach((user, index) => {
        console.log(`👨‍💼 [AdminUserService] Companion ${index + 1}:`, {
          id: user.id.slice(0, 8),
          name: user.name || user.full_name,
          email: user.email,
          verification_status: user.verification_status,
          auth_only: user.auth_only,
          has_profile: user.has_profile
        });
      });
      
      return { users: mergedUsers, error: null };

    } catch (error: any) {
      console.error('❌ [AdminUserService] error:', error);
      return { users: [], error: error.message };
    }
  },

  mergeAuthAndProfileUsers(authUsers: any[], profileUsers: any[]): AdminUser[] {
    const userMap = new Map<string, AdminUser>();
    
    console.log('🔄 [AdminUserService] Starting merge process...');
    console.log('Auth users to merge:', authUsers.length);
    console.log('Profile users to merge:', profileUsers.length);

    // Add profile users first
    profileUsers.forEach((profile, index) => {
      console.log(`📝 [AdminUserService] Processing profile user ${index + 1}:`, {
        id: profile.id.slice(0, 8) + '...',
        email: profile.email,
        verification_status: profile.verification_status,
        user_type: profile.user_type,
        status: profile.status,
        age: profile.age,
        location: profile.location,
        hourly_rate: profile.hourly_rate,
        has_profile_data: !!profile.profile_data
      });
      
      userMap.set(profile.id, {
        id: profile.id,
        email: profile.email || '',
        name: profile.name || profile.full_name || 'No name',
        full_name: profile.full_name,
        phone: profile.phone,
        user_type: profile.user_type || 'user',
        verification_status: profile.verification_status || 'pending',
        status: profile.status || 'active',
        created_at: profile.created_at,
        updated_at: profile.updated_at,
        has_profile: true,
        auth_only: false,
        // Include additional profile fields
        age: profile.age,
        location: profile.location,
        bio: profile.bio,
        hourly_rate: profile.hourly_rate,
        profile_data: profile.profile_data,
        profile_image: profile.profile_image,
        city: profile.city,
        zodiac: profile.zodiac,
        love_language: profile.love_language,
        party_buddy_eligible: profile.party_buddy_eligible
      });
    });

    // Add or merge auth users
    authUsers.forEach((authUser, index) => {
      console.log(`🔐 [AdminUserService] Processing auth user ${index + 1}:`, {
        id: authUser.id.slice(0, 8) + '...',
        email: authUser.email,
        email_confirmed: !!authUser.email_confirmed_at,
        user_metadata: authUser.user_metadata
      });
      
      const existingUser = userMap.get(authUser.id);
      
      if (existingUser) {
        // Update existing profile user with auth data
        console.log('🔄 [AdminUserService] Merging with existing profile user');
        existingUser.email = authUser.email || existingUser.email;
        existingUser.created_at = authUser.created_at || existingUser.created_at;
        existingUser.auth_only = false; // Has both auth and profile
        existingUser.raw_user_meta_data = authUser.user_metadata;
      } else {
        // Add auth-only user
        console.log('➕ [AdminUserService] Adding auth-only user');
        
        // Determine user type from metadata or default to user
        const userType = authUser.user_metadata?.user_type || 'user';
        
        // Determine verification status based on email confirmation
        // For new auth-only users, they should be pending by default
        const verificationStatus = 'pending'; // Default to pending for approval workflow
        
        console.log('🔍 [AdminUserService] Auth user metadata analysis:', {
          user_metadata: authUser.user_metadata,
          app_metadata: authUser.app_metadata,
          email_confirmed_at: authUser.email_confirmed_at,
          determined_user_type: userType,
          determined_verification_status: verificationStatus
        });
        
        userMap.set(authUser.id, {
          id: authUser.id,
          email: authUser.email || '',
          name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User',
          full_name: authUser.user_metadata?.full_name || authUser.user_metadata?.name,
          phone: authUser.user_metadata?.phone,
          user_type: userType as any,
          verification_status: verificationStatus as any,
          status: 'active',
          created_at: authUser.created_at,
          has_profile: false,
          auth_only: true,
          // Auth-only users don't have these fields yet
          age: null,
          location: null,
          bio: null,
          hourly_rate: null,
          profile_data: null,
          raw_user_meta_data: authUser.user_metadata
        });
      }
    });

    const finalUsers = Array.from(userMap.values()).sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    
    console.log('🎯 [AdminUserService] Final user breakdown by verification status:');
    const finalBreakdown = finalUsers.reduce((acc: any, user) => {
      acc[user.verification_status] = (acc[user.verification_status] || 0) + 1;
      return acc;
    }, {});
    console.log('Final status breakdown:', finalBreakdown);
    
    console.log('🎯 [AdminUserService] Final users summary:');
    finalUsers.forEach((user, index) => {
      if (index < 5) { // Show first 5 users
        console.log(`Final User ${index + 1}:`, {
          id: user.id.slice(0, 8) + '...',
          email: user.email,
          user_type: user.user_type,
          verification_status: user.verification_status,
          auth_only: user.auth_only,
          has_profile: user.has_profile,
          has_profile_data: !!user.profile_data
        });
      }
    });
    
    return finalUsers;
  },

  async createMissingProfiles(authOnlyUsers: AdminUser[]): Promise<void> {
    if (authOnlyUsers.length === 0) return;

    console.log('🔧 [AdminUserService] Creating missing profiles for', authOnlyUsers.length, 'users');
    
    try {
      const profilesData = authOnlyUsers.map(user => {
        console.log('📝 [AdminUserService] Preparing profile data for user:', {
          id: user.id.slice(0, 8),
          email: user.email,
          user_type: user.user_type,
          verification_status: user.verification_status
        });
        
        return {
          id: user.id,
          email: user.email,
          name: user.name || user.email?.split('@')[0] || 'User',
          full_name: user.full_name || user.name,
          phone: user.phone,
          user_type: user.user_type,
          verification_status: user.verification_status,
          status: user.verification_status === 'verified' ? 'active' as const : 'pending' as const,
          created_at: user.created_at,
          updated_at: new Date().toISOString()
        };
      });

      console.log('🚀 [AdminUserService] Inserting profiles:', profilesData);

      const { error } = await supabase
        .from('profiles')
        .upsert(profilesData, { onConflict: 'id' });

      if (error) {
        console.error('❌ [AdminUserService] Error creating missing profiles:', error);
        throw error;
      }

      console.log('✅ [AdminUserService] Successfully created missing profiles');
    } catch (error) {
      console.error('❌ [AdminUserService] Failed to create missing profiles:', error);
      throw error;
    }
  }
};
