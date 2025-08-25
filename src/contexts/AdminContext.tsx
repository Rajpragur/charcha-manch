import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../configs/firebase';

interface AdminContextType {
  isAdmin: boolean;
  isSuperAdmin: boolean;
  adminLevel: 'none' | 'moderator' | 'admin' | 'super_admin';
  loading: boolean;
  checkAdminStatus: () => Promise<void>;
}

const AdminContext = createContext<AdminContextType | null>(null);

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) throw new Error('useAdmin must be used within AdminProvider');
  return context;
};

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [adminLevel, setAdminLevel] = useState<'none' | 'moderator' | 'admin' | 'super_admin'>('none');
  const [loading, setLoading] = useState(true);

  const checkAdminStatus = async () => {
    if (!currentUser) {
      setIsAdmin(false);
      setIsSuperAdmin(false);
      setAdminLevel('none');
      setLoading(false);
      return;
    }

    try {
      // Use user_profiles collection instead of users collection
      const userDoc = await getDoc(doc(db, 'user_profiles', currentUser.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        // Check for admin role in user profile data
        const role = userData.role || userData.admin_level || 'none';
        
        setAdminLevel(role);
        setIsAdmin(role === 'moderator' || role === 'admin' || role === 'super_admin');
        setIsSuperAdmin(role === 'super_admin');
      } else {
        // No profile found, check if user is admin by email (temporary solution)
        const adminEmails = [
          'rajpratapsinghgurjar@gmail.com',
          'admin@charchagram.com'
        ];
        
        if (currentUser.email && adminEmails.includes(currentUser.email)) {
          setAdminLevel('admin');
          setIsAdmin(true);
          setIsSuperAdmin(false);
        } else {
          setIsAdmin(false);
          setIsSuperAdmin(false);
          setAdminLevel('none');
        }
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
      // Fallback: check if user is admin by email
      if (currentUser.email) {
        const adminEmails = [
          'rajpratapsinghgurjar@gmail.com',
          'admin@charchagram.com'
        ];
        
        if (adminEmails.includes(currentUser.email)) {
          setAdminLevel('admin');
          setIsAdmin(true);
          setIsSuperAdmin(false);
        } else {
          setIsAdmin(false);
          setIsSuperAdmin(false);
          setAdminLevel('none');
        }
      } else {
        setIsAdmin(false);
        setIsSuperAdmin(false);
        setAdminLevel('none');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAdminStatus();
  }, [currentUser]);

  const value = {
    isAdmin,
    isSuperAdmin,
    adminLevel,
    loading,
    checkAdminStatus
  };

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  );
};
