import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import FirebaseService from '../services/firebaseService';
import { Loader2, MapPin, AlertCircle } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface ConstituencyCheckProps {
  children: React.ReactNode;
}

const ConstituencyCheck: React.FC<ConstituencyCheckProps> = ({ children }) => {
  const { currentUser, loading: authLoading } = useAuth();
  const { isEnglish } = useLanguage();
  const navigate = useNavigate();
  
  const [isChecking, setIsChecking] = useState(true);
  const [hasConstituency, setHasConstituency] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    const checkConstituency = async () => {
      if (authLoading) return; // Wait for auth to finish loading
      
      // Don't check constituency on onboarding page
      if (window.location.pathname === '/onboarding') {
        setIsChecking(false);
        return;
      }
      
      if (!currentUser) {
        // No user signed in, allow access (will be handled by auth guards)
        setIsChecking(false);
        return;
      }

      try {
        setIsChecking(true);
        setError(null);
        
        // Check if user has a profile with constituency
        const userProfile = await FirebaseService.getUserProfile(currentUser.uid);
        
        if (userProfile && userProfile.constituency_id) {
          // User has constituency set, allow access
          setHasConstituency(true);
        } else {
          // User doesn't have constituency set, redirect to onboarding
          setHasConstituency(false);
          // Only redirect if not already on onboarding page and not already redirecting
          if (window.location.pathname !== '/onboarding' && !isRedirecting) {
            setIsRedirecting(true);
            setTimeout(() => {
              navigate('/onboarding');
            }, 100);
          }
          return;
        }
      } catch (err) {
        console.error('Error checking constituency:', err);
        setError('Failed to check constituency status');
        // On error, allow access to avoid blocking users
        setHasConstituency(true);
      } finally {
        setIsChecking(false);
      }
    };

    checkConstituency();
  }, [currentUser, authLoading, navigate, isRedirecting]);

  // Show loading while checking
  if (authLoading || isChecking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {isEnglish ? 'Checking your constituency...' : 'आपका क्षेत्र जांच रहा है...'}
          </h2>
          <p className="text-gray-600">
            {isEnglish ? 'Please wait while we verify your setup' : 'कृपया प्रतीक्षा करें जब तक हम आपकी सेटअप की जांच कर रहे हैं'}
          </p>
          {!hasConstituency && currentUser && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg max-w-md mx-auto">
              <p className="text-sm text-yellow-700">
                {isEnglish ? 'You need to set your constituency to access the portal' : 'पोर्टल का उपयोग करने के लिए आपको अपना क्षेत्र सेट करना होगा'}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Show error if something went wrong
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {isEnglish ? 'Something went wrong' : 'कुछ गलत हो गया'}
          </h2>
          <p className="text-gray-600 mb-4">
            {isEnglish ? 'We encountered an error while checking your constituency. You can continue to the app.' : 'आपके क्षेत्र की जांच करते समय हमें एक त्रुटि का सामना करना पड़ा। आप ऐप में जारी रख सकते हैं।'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {isEnglish ? 'Try Again' : 'पुनः प्रयास करें'}
          </button>
        </div>
      </div>
    );
  }

  // If user has constituency or no user is signed in, render children
  if (hasConstituency || !currentUser) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-100 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto px-4">
        <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
          <MapPin className="h-8 w-8 text-yellow-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          {isEnglish ? 'Constituency Required' : 'क्षेत्र आवश्यक है'}
        </h2>
        <p className="text-gray-600 mb-4">
          {isEnglish ? 'You need to set your constituency before accessing the app.' : 'ऐप का उपयोग करने से पहले आपको अपना क्षेत्र सेट करना होगा।'}
        </p>
        <button
          onClick={() => navigate('/onboarding')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          {isEnglish ? 'Set Constituency' : 'क्षेत्र सेट करें'}
        </button>
      </div>
    </div>
  );
};

export default ConstituencyCheck;
