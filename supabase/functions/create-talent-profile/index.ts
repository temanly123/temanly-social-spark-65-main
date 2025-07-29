
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create a Supabase client with the service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const requestBody = await req.json()
    console.log('[CreateTalentProfile] Request body received:', JSON.stringify(requestBody, null, 2))

    // Handle both old and new data structures
    const {
      userId, email, name, phone, userType, comprehensiveData, // Old structure
      personalInfo, services, interests, availability, profile // New structure
    } = requestBody

    // Determine which structure we're using
    const isNewStructure = !!(personalInfo && personalInfo.email && personalInfo.name)

    console.log('[CreateTalentProfile] Using', isNewStructure ? 'NEW' : 'OLD', 'data structure')

    let authUserId = userId
    let profileEmail = email
    let profileName = name
    let profilePhone = phone
    let profileUserType = userType || 'companion'

    if (isNewStructure) {
      // New structure - create auth user first
      console.log('[CreateTalentProfile] Creating auth user for new structure...')

      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: personalInfo.email,
        password: 'TempPassword123!', // Temporary password
        email_confirm: true,
        user_metadata: {
          name: personalInfo.name,
          user_type: 'companion',
          ...personalInfo
        }
      })

      if (authError) {
        console.error('[CreateTalentProfile] Auth user creation failed:', authError)
        throw authError
      }

      authUserId = authUser.user!.id
      profileEmail = personalInfo.email
      profileName = personalInfo.name
      profilePhone = personalInfo.phone || null
      profileUserType = 'companion'

      console.log('[CreateTalentProfile] Auth user created:', authUserId)
    }

    console.log('🚀 Creating comprehensive talent profile for user:', authUserId)

    // Get city ID if city is provided
    let cityId = null;
    const cityName = isNewStructure ? personalInfo.city : comprehensiveData?.city;
    if (cityName) {
      const { data: cityData } = await supabaseAdmin
        .from('cities')
        .select('id')
        .ilike('name', cityName)
        .single();

      cityId = cityData?.id || null;
    }

    // Prepare comprehensive profile data based on structure
    let profileData;

    if (isNewStructure) {
      // New structure with comprehensive Temanly data
      profileData = {
        id: authUserId,
        email: profileEmail,
        name: profileName,
        full_name: profileName,
        phone: profilePhone,
        user_type: profileUserType,
        verification_status: 'verified',
        status: 'active',
        age: personalInfo.age || null,
        location: personalInfo.location || null,
        city: personalInfo.city || null,
        city_id: cityId,
        bio: personalInfo.bio || null,
        zodiac: personalInfo.zodiac || null,
        love_language: personalInfo.love_language || null,
        interests: interests || [],
        available_services: services?.available_services || [],
        is_available: true,
        featured_talent: profile?.featured_talent || false,
        is_newcomer: profile?.is_newcomer !== false,
        rent_lover_rate: services?.rent_lover_rate || null,
        rent_lover_description: services?.rent_lover_description || null,
        total_orders: profile?.total_orders || 0,
        average_rating: profile?.average_rating || 0.0,
        talent_level: profile?.talent_level || 'fresh',
        hourly_rate: 65000, // Default rate
        profile_data: {
          specialties: profile?.specialties || [],
          experience: profile?.experience || '',
          languages: profile?.languages || ['Bahasa Indonesia'],
          education: profile?.education || '',
          hobbies: profile?.hobbies || [],
          availability: availability || {},
          services: services || {}
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_active: new Date().toISOString()
      }
    } else {
      // Old structure for backward compatibility
      profileData = {
        id: authUserId,
        email: profileEmail,
        name: profileName,
        full_name: profileName,
        phone: profilePhone,
        user_type: profileUserType,
        verification_status: 'pending',
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),

        // Extract key fields for direct database access
        age: comprehensiveData?.age || null,
        location: comprehensiveData?.location || null,
        bio: comprehensiveData?.bio || null,
        zodiac: comprehensiveData?.zodiac || null,
        love_language: comprehensiveData?.loveLanguage || null,
        hourly_rate: comprehensiveData?.hourlyRate || null,

        // Store ALL comprehensive data in profile_data JSON field
        profile_data: {
          // Personal Information
          personalInfo: {
            age: comprehensiveData?.age,
            location: comprehensiveData?.location,
            bio: comprehensiveData?.bio,
            zodiac: comprehensiveData?.zodiac,
            loveLanguage: comprehensiveData?.loveLanguage
          },

          // Services & Pricing
          services: {
            availableServices: comprehensiveData?.availableServices || comprehensiveData?.services || [],
            hourlyRate: comprehensiveData?.hourlyRate || 0,
            rentLoverDetails: comprehensiveData?.rentLoverDetails || {}
          },

          // Availability & Scheduling
          availability: comprehensiveData?.availability || {},

          // Interests & Preferences
          preferences: {
            dateInterests: comprehensiveData?.dateInterests || [],
            languages: comprehensiveData?.languages || ['Bahasa Indonesia'],
            specialties: comprehensiveData?.specialties || []
          },

          // Additional Information
          additionalInfo: {
            transportationMode: comprehensiveData?.transportationMode || '',
            emergencyContact: comprehensiveData?.emergencyContact || '',
            emergencyPhone: comprehensiveData?.emergencyPhone || ''
          },

          // Document Status
          documents: {
            hasIdCard: comprehensiveData?.hasIdCard || false,
            hasProfilePhoto: comprehensiveData?.hasProfilePhoto || false,
            idCardUploaded: !!comprehensiveData?.idCardFile,
            profilePhotoUploaded: !!comprehensiveData?.profilePhotoFile
          },

          // Registration Metadata
          metadata: {
            registrationTimestamp: comprehensiveData?.registrationTimestamp || new Date().toISOString(),
            formVersion: comprehensiveData?.formVersion || '4.0-comprehensive',
            businessModel: comprehensiveData?.businessModel || 'temanly-hybrid',
            dataCompleteness: {
              personalInfo: !!(comprehensiveData?.age && comprehensiveData?.location && comprehensiveData?.bio),
              services: !!(comprehensiveData?.services?.length),
              availability: !!(comprehensiveData?.availability),
              documents: !!(comprehensiveData?.hasIdCard && comprehensiveData?.hasProfilePhoto),
              emergencyContact: !!(comprehensiveData?.emergencyContact && comprehensiveData?.emergencyPhone)
            }
          }
        }
      }
    }

    console.log('💾 Inserting comprehensive profile data into database...')
    console.log('📋 Profile data being inserted:', JSON.stringify(profileData, null, 2))
    
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert(profileData)
      .select()
      .single()

    if (profileError) {
      console.error('❌ Error creating comprehensive talent profile:', profileError)
      console.error('❌ Profile data that failed:', JSON.stringify(profileData, null, 2))
      throw profileError
    }

    console.log('✅ Comprehensive talent profile created successfully!')
    console.log('✅ Created profile data:', JSON.stringify(profile, null, 2))

    // Create talent services entries from availableServices
    const servicesToCreate = isNewStructure
      ? (services?.available_services || [])
      : (comprehensiveData?.availableServices || comprehensiveData?.services || []);

    if (servicesToCreate && servicesToCreate.length > 0) {
      console.log('📋 Creating talent services entries for:', servicesToCreate)

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
          talent_id: userId,
          service_type: serviceType,
          description: `${service} service by ${name}`,
          custom_rate: comprehensiveData.hourlyRate || null,
          is_available: true,
          created_at: new Date().toISOString()
        };
      })

      const { error: servicesError } = await supabaseAdmin
        .from('talent_services')
        .insert(talentServices)

      if (servicesError) {
        console.error('⚠️ Error creating talent services:', servicesError)
        // Don't throw error here, profile was created successfully
      } else {
        console.log('✅ Talent services created successfully')
      }
    }

    // Create talent interests entries if dateInterests are provided
    if (comprehensiveData?.dateInterests && comprehensiveData.dateInterests.length > 0) {
      console.log('💝 Creating talent interests entries...')
      
      const talentInterests = comprehensiveData.dateInterests.map((interest: string) => ({
        talent_id: userId,
        interest: interest,
        created_at: new Date().toISOString()
      }))

      const { error: interestsError } = await supabaseAdmin
        .from('talent_interests')
        .insert(talentInterests)

      if (interestsError) {
        console.error('⚠️ Error creating talent interests:', interestsError)
        // Don't throw error here, profile was created successfully
      } else {
        console.log('✅ Talent interests created successfully')
      }
    }

    console.log('🎉 All talent data successfully stored in database!')

    return new Response(
      JSON.stringify({
        success: true,
        profile: createdProfile,
        id: createdProfile.id,
        name: createdProfile.name,
        email: createdProfile.email,
        message: isNewStructure
          ? 'Comprehensive Temanly talent profile created successfully'
          : 'Comprehensive talent profile created successfully with all data stored',
        dataStored: {
          profile: true,
          services: isNewStructure
            ? !!(services?.available_services?.length)
            : !!(comprehensiveData?.services?.length),
          interests: isNewStructure
            ? !!(interests?.length)
            : !!(comprehensiveData?.dateInterests?.length),
          comprehensiveData: true,
          structure: isNewStructure ? 'new' : 'legacy'
        }
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    )

  } catch (error) {
    console.error('💥 Function error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      { 
        status: 400,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})
