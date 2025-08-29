import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import FirebaseService from '../services/firebaseService';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireOnboarding?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireOnboarding = true 
}) => {
  const { currentUser, loading } = useAuth();
  const [onboardingStatus, setOnboardingStatus] = useState<'checking' | 'completed' | 'incomplete'>('checking');
  const [profileLoading, setProfileLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (!currentUser) {
        setOnboardingStatus('incomplete');
        setProfileLoading(false);
        return;
      }

      try {
        const userProfile = await FirebaseService.getUserProfile(currentUser.uid);
        
        if (userProfile && userProfile.constituency_id && userProfile.gender && userProfile.age_group && userProfile.area) {
          setOnboardingStatus('completed');
        } else {
          setOnboardingStatus('incomplete');
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error);
        setOnboardingStatus('incomplete');
      } finally {
        setProfileLoading(false);
      }
    };

    if (!loading) {
      checkOnboardingStatus();
    }
  }, [currentUser, loading]);

  // Show loading spinner while checking authentication and profile
  if (loading || profileLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-green-600" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If user is not authenticated, redirect to signin
  if (!currentUser) {
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  // If onboarding is required and user hasn't completed it, redirect to onboarding
  if (requireOnboarding && onboardingStatus === 'incomplete') {
    return <Navigate to="/onboarding" replace />;
  }

  // If user has completed onboarding and tries to access onboarding page, redirect to home
  if (location.pathname === '/onboarding' && onboardingStatus === 'completed') {
    return <Navigate to="/" replace />;
  }

  // User is authenticated and has completed onboarding (if required), render children
  return <>{children}</>;
};

export default ProtectedRoute;
