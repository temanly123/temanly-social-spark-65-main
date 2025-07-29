
import React from 'react';
import { AdminAuthProvider } from '@/contexts/AdminAuthContext';
import AdminProtectedRoute from '@/components/AdminProtectedRoute';

interface AdminAppProps {
  children: React.ReactNode;
}

const AdminApp: React.FC<AdminAppProps> = ({ children }) => {
  return (
    <AdminAuthProvider>
      <AdminProtectedRoute>
        {children}
      </AdminProtectedRoute>
    </AdminAuthProvider>
  );
};

export default AdminApp;
