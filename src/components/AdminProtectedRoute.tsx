
import React from 'react';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import AdminLogin from '@/components/AdminLogin';

interface AdminProtectedRouteProps {
  children: React.ReactNode;
}

const AdminProtectedRoute: React.FC<AdminProtectedRouteProps> = ({ children }) => {
  // Check for admin session in localStorage
  const isAdminLoggedIn = localStorage.getItem('temanly_admin_session') === 'true';

  console.log('🛡️ AdminProtectedRoute - isAdminLoggedIn:', isAdminLoggedIn);

  if (!isAdminLoggedIn) {
    console.log('🔐 No admin session, showing login');
    try {
      return <AdminLogin />;
    } catch (error) {
      console.error('❌ Error rendering AdminLogin:', error);
      return (
        <div className="min-h-screen bg-red-100 flex items-center justify-center">
          <div className="text-center p-8 bg-white rounded-lg shadow-lg">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Error in AdminLogin</h1>
            <p className="text-gray-600">There was an error rendering the AdminLogin component</p>
            <p className="text-sm text-gray-500 mt-4">Check the console for details</p>
          </div>
        </div>
      );
    }
  }

  console.log('✅ Admin session found, showing dashboard');
  return <>{children}</>;

  // Original logic (commented out for debugging)
  /*
  const { isAdmin, loading } = useAdminAuth();

  console.log('🛡️ AdminProtectedRoute - loading:', loading, 'isAdmin:', isAdmin);

  if (loading) {
    console.log('⏳ Showing loading screen');
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    console.log('🔐 Showing admin login');
    return <AdminLogin />;
  }

  console.log('✅ Showing admin dashboard');
  return <>{children}</>;
  */
};

export default AdminProtectedRoute;
