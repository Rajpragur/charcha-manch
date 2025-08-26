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
  const { currentUser, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [adminLevel, setAdminLevel] = useState<'none' | 'moderator' | 'admin' | 'super_admin'>('none');
  const [loading, setLoading] = useState(true);

  const checkAdminStatus = async () => {
    console.log('🔍 Checking admin status for user:', currentUser?.uid);
    console.log('🔍 Auth loading state:', authLoading);
    
    // Wait for authentication to finish loading
    if (authLoading) {
      console.log('⏳ Waiting for authentication to finish loading...');
      return;
    }
    
    if (!currentUser) {
      console.log('❌ No current user, setting admin status to false');
      setIsAdmin(false);
      setIsSuperAdmin(false);
      setAdminLevel('none');
      setLoading(false);
      return;
    }

    // FIRST: Check if user is admin by email (immediate access)
    if (currentUser.email) {
      const adminEmails = [
        'rajpragur@gmail.com',
        'admin@charchagram.com',
        'harsh171517@gmail.com',
        'connect.charchagram@gmail.com',
        'rajpragur2@gmail.com'
      ];
      
      if (adminEmails.includes(currentUser.email)) {
        console.log('✅ User is admin by email (immediate access):', currentUser.email);
        setAdminLevel('admin');
        setIsAdmin(true);
        setIsSuperAdmin(false);
        setLoading(false);
        console.log('✅ Admin status set by email - Role: admin, isAdmin: true, isSuperAdmin: false');
        return;
      } else {
        console.log('❌ User email not in admin list:', currentUser.email);
      }
    }

    try {
      // SECOND: Check the users collection for admin status
      console.log('🔍 Checking users collection for UID:', currentUser.uid);
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        console.log('✅ User document found in users collection:', userData);
        
        // Check for admin role in users collection
        const role = userData.role || userData.admin_level || 'none';
        const isUserAdmin = userData.isAdmin || false;
        
        console.log('🔍 Role:', role, 'isAdmin:', isUserAdmin);
        
        if (isUserAdmin || role === 'moderator' || role === 'admin' || role === 'super_admin') {
          console.log('✅ User is admin, setting admin status');
          setAdminLevel(role);
          setIsAdmin(true);
          setIsSuperAdmin(role === 'super_admin');
          setLoading(false);
          console.log('✅ Admin status set successfully - Role:', role, 'isAdmin: true, isSuperAdmin:', role === 'super_admin');
          return;
        } else {
          console.log('❌ User document exists but user is not admin');
        }
      } else {
        console.log('❌ No user document found in users collection');
      }

      // Fallback: check user_profiles collection
      console.log('🔍 Checking user_profiles collection as fallback');
      const profileDoc = await getDoc(doc(db, 'user_profiles', currentUser.uid));
      if (profileDoc.exists()) {
        const profileData = profileDoc.data();
        const role = profileData.role || profileData.admin_level || 'none';
        const isProfileAdmin = profileData.isAdmin || false;
        
        console.log('🔍 Profile fields:', Object.keys(profileData));
        console.log('🔍 Role field:', profileData.role);
        console.log('🔍 Admin level field:', profileData.admin_level);
        console.log('🔍 IsAdmin field:', profileData.isAdmin);
        console.log('🔍 Final role determined:', role);
        console.log('🔍 IsProfileAdmin:', isProfileAdmin);
        
        console.log('✅ Profile document found:', profileData);
        setAdminLevel(role);
        setIsAdmin(isProfileAdmin || role === 'moderator' || role === 'admin' || role === 'super_admin');
        setIsSuperAdmin(role === 'super_admin');
        setLoading(false);
        console.log('✅ Admin status set from profile - Role:', role, 'isAdmin:', isProfileAdmin || role === 'moderator' || role === 'admin' || role === 'super_admin');
        return;
      } else {
        console.log('❌ No profile document found in user_profiles collection');
      }

      // No admin status found by any method
      console.log('❌ User is not admin by any method');
      setIsAdmin(false);
      setIsSuperAdmin(false);
      setAdminLevel('none');
    } catch (error) {
      console.error('❌ Error checking admin status:', error);
      // Fallback: check if user is admin by email
      if (currentUser.email) {
        const adminEmails = [
          'rajpratapsinghgurjar@gmail.com',
          'admin@charchagram.com',
          'rajpratapsinghgurjar@gmail.com' // Your email for admin access
        ];
        
        if (adminEmails.includes(currentUser.email)) {
          console.log('✅ User is admin by email fallback (error case)');
          setAdminLevel('admin');
          setIsAdmin(true);
          setIsSuperAdmin(false);
        } else {
          console.log('❌ User is not admin by email fallback (error case)');
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
    console.log('🔄 AdminContext useEffect triggered - authLoading:', authLoading, 'currentUser:', currentUser?.uid);
    
    // Only check admin status when authentication is not loading and we have a user
    if (!authLoading) {
      if (currentUser) {
        console.log('✅ Auth finished loading, user found, checking admin status...');
        checkAdminStatus();
      } else {
        console.log('❌ Auth finished loading, no user found, setting admin to false');
        setIsAdmin(false);
        setIsSuperAdmin(false);
        setAdminLevel('none');
        setLoading(false);
      }
    } else {
      console.log('⏳ Auth still loading, waiting...');
    }
  }, [authLoading, currentUser]);

  // Monitor admin status changes for debugging
  useEffect(() => {
    console.log('🔍 Admin status changed:', { isAdmin, isSuperAdmin, adminLevel, loading });
  }, [isAdmin, isSuperAdmin, adminLevel, loading]);

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
