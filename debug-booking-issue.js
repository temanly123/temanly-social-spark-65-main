// Debug script to check booking issue
// Run this in browser console on the talent dashboard page

console.log('🔍 Debug: Checking booking issue...');

// Check current user
const currentUser = JSON.parse(localStorage.getItem('sb-enyrffgedfvgunokpmqk-auth-token') || '{}');
console.log('👤 Current user from localStorage:', currentUser);

// Check if we can access supabase
if (typeof supabase !== 'undefined') {
  console.log('✅ Supabase client available');
  
  // Get current session
  supabase.auth.getSession().then(({ data: { session } }) => {
    console.log('🔐 Current session:', session);
    
    if (session?.user) {
      const userId = session.user.id;
      console.log('👤 Current user ID:', userId);
      
      // Check if this user exists in profiles
      supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
        .then(({ data: profile, error }) => {
          console.log('👤 User profile:', profile, error);
          
          if (profile) {
            // Check bookings for this companion
            supabase
              .from('bookings')
              .select('*')
              .eq('companion_id', userId)
              .then(({ data: bookings, error }) => {
                console.log('📋 Bookings for this companion:', bookings, error);
              });
            
            // Check ALL bookings
            supabase
              .from('bookings')
              .select('*')
              .limit(10)
              .then(({ data: allBookings, error }) => {
                console.log('📋 All recent bookings:', allBookings, error);
              });
          }
        });
    }
  });
} else {
  console.log('❌ Supabase client not available');
}
