import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const useOnboardingRedirect = () => {
  const { currentUser, onboardingCompleted, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Only check after authentication is loaded and user is authenticated
    if (!loading && currentUser && !onboardingCompleted) {
      // User is authenticated but hasn't completed onboarding
      navigate('/onboarding', { replace: true });
    }
  }, [currentUser, onboardingCompleted, loading, navigate]);

  return { shouldRedirect: !loading && currentUser && !onboardingCompleted };
};
