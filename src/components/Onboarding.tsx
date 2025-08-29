import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import FirebaseService from '../services/firebaseService';
import { 
  MapPin, 
  User, 
  Loader2,
  ArrowRight
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface Constituency {
  id: number;
  area_name: string;
  area_name_hi: string;
  district: string | null;
}

const Onboarding: React.FC = () => {
  const { isEnglish } = useLanguage();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [constituencies, setConstituencies] = useState<Constituency[]>([]);
  const [selectedConstituency, setSelectedConstituency] = useState<number | null>(null);
  const [gender, setGender] = useState<string>('');
  const [ageGroup, setAgeGroup] = useState<string>('');
  const [area, setArea] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');

  // Load constituencies on component mount and check if user already has constituency
  useEffect(() => {
    loadConstituencies();
    
    // Check if user already has constituency set
    const checkExistingConstituency = async () => {
      if (currentUser) {
        try {
          const userProfile = await FirebaseService.getUserProfile(currentUser.uid);
          if (userProfile && userProfile.constituency_id) {
            // User already has constituency, redirect to home
            navigate('/');
            return;
          }
        } catch (err) {
          console.error('Error checking existing constituency:', err);
        }
      }
    };
    
    checkExistingConstituency();
  }, [currentUser, navigate]);

  // Load constituencies from JSON (derived from candidates data)
  const loadConstituencies = async () => {
    try {
      const [enRes, hiRes] = await Promise.all([
        fetch('/data/candidates_en.json'),
        fetch('/data/candidates.json')
      ]);
      const enData: any[] = await enRes.json();
      const hiData: any[] = await hiRes.json();
      const list: Constituency[] = enData.map((c, idx) => ({
        id: idx + 1,
        area_name: c.area_name,
        area_name_hi: hiData[idx]?.area_name || c.area_name,
        district: null
      }));
      setConstituencies(list);
    } catch (err) {
      console.error('Error loading constituencies:', err);
      setError('Failed to load constituencies');
    }
  };

  // Handle constituency selection
  const handleConstituencySelect = (constituencyId: number) => {
    setSelectedConstituency(constituencyId);
  };

  // Save onboarding data
  const saveOnboardingData = async () => {
    if (!currentUser || !selectedConstituency || !gender || !ageGroup || !area) {
      setError('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Get display name from Google account
      const displayName = currentUser.displayName || currentUser.email?.split('@')[0] || 'User';
      
      await FirebaseService.createUserProfile(currentUser.uid, {
        display_name: displayName,
        constituency_id: selectedConstituency,
        tier_level: 1,
        engagement_score: 0,
        // Add new fields
        gender: gender,
        age_group: ageGroup,
        area: area
      });

      // Show success message before redirecting
      setMessage('✅ Profile created successfully! Redirecting to portal...');
      setMessageType('success');
      
      // Redirect to home page after a short delay
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (err) {
      console.error('Error saving onboarding data:', err);
      setError('Failed to save your information. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Check if all required fields are filled
  const canProceed = () => {
    return selectedConstituency !== null && gender !== '' && ageGroup !== '' && area !== '';
  };

  if (!currentUser) {
    navigate('/signin');
    return null;
  }

  // If user already has constituency, redirect to home
  if (isLoading && !message) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-6 w-6 animate-spin mx-auto mb-3 text-green-600" />
          <p className="text-gray-600 text-sm">
            {isEnglish ? 'Checking your setup...' : 'आपकी सेटअप की जांच कर रहे हैं...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#9ca8b4] flex items-center justify-center p-2 lg:p-4">
      <div className="max-w-xl w-full bg-white rounded-xl shadow-xl p-4 lg:p-6">
        {/* Header */}
        <div className="text-center mb-4 lg:mb-6">
          <div className="w-12 h-12 lg:w-14 lg:h-14 bg-[#014e5c] rounded-full flex items-center justify-center mx-auto mb-3">
            <User className="h-6 w-6 lg:h-7 lg:w-7 text-white" />
          </div>
          <h1 className="text-lg lg:text-2xl font-bold text-gray-900 mb-2">
            {isEnglish ? 'Welcome to Charcha Manch!' : 'चर्चा मंच में आपका स्वागत है!'}
          </h1>
          <p className="text-gray-600 text-xs lg:text-sm">
            {isEnglish ? 'Let\'s get to know you better' : 'आइए आपको बेहतर तरीके से जानें'}
          </p>
          <div className="mt-2 p-2 lg:p-3 bg-[#d3dae0] border border-blue-200 rounded-lg">
            <p className="text-xs lg:text-sm text-black">
              {isEnglish ? 'Setting your constituency helps personalize your experience (optional)' : 'अपना क्षेत्र सेट करने से आपका अनुभव व्यक्तिगत हो जाता है (वैकल्पिक)'}
            </p>
          </div>
        </div>

        {/* Single Form Screen */}
        <div className="space-y-4">
          {/* Constituency Selection */}
          <div className="space-y-3">
            <div className="text-center">
              <MapPin className="h-6 w-6 lg:h-8 lg:w-8 text-[#014e5c] mx-auto mb-2" />
              <h2 className="text-sm lg:text-lg font-semibold text-gray-900 mb-1">
                {isEnglish ? 'Select Your Constituency (Optional)' : 'अपना निर्वाचन क्षेत्र चुनें (वैकल्पिक)'}
              </h2>
              <p className="text-gray-600 text-xs lg:text-sm">
                {isEnglish ? 'Choose the constituency where you vote (you can change this later)' : 'वह निर्वाचन क्षेत्र चुनें जहां आप वोट करते हैं (आप इसे बाद में बदल सकते हैं)'}
              </p>
            </div>
            
            {/* Enhanced Scrollable Constituency List */}
            <div className="max-h-48 lg:max-h-56 overflow-y-auto border border-gray-200 rounded-lg p-2 bg-gray-50">
              <div className="space-y-1">
                {constituencies.map((constituency) => (
                  <button
                    key={constituency.id}
                    onClick={() => handleConstituencySelect(constituency.id)}
                    className={`w-full p-2 lg:p-3 text-left rounded-md border transition-all duration-200 text-sm ${
                      selectedConstituency === constituency.id
                        ? 'border-[#014e5c] bg-[#014e5c] text-white shadow-md'
                        : 'border-gray-200 hover:border-[#014e5c]/30 hover:bg-white'
                    }`}
                  >
                    <div className={`font-medium ${selectedConstituency === constituency.id ? 'text-white' : 'text-gray-900'}`}>
                      {isEnglish ? constituency.area_name : constituency.area_name_hi}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Personal Information */}
          <div className="space-y-3">
            <h3 className="text-sm lg:text-base font-semibold text-gray-900 text-center">
              {isEnglish ? 'Personal Information (Optional)' : 'व्यक्तिगत जानकारी (वैकल्पिक)'}
            </h3>
            
            {/* Gender Selection */}
            <div>
              <label className="block text-xs lg:text-sm font-medium text-gray-700 mb-2">
                {isEnglish ? 'Gender' : 'लिंग'} <span className="text-gray-400">({isEnglish ? 'Optional' : 'वैकल्पिक'})</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'male', label: isEnglish ? 'Male' : 'पुरुष' },
                  { value: 'female', label: isEnglish ? 'Female' : 'महिला' },
                  { value: 'other', label: isEnglish ? 'Other' : 'अन्य' }
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setGender(option.value)}
                    className={`p-2 rounded-md border transition-all duration-200 text-xs ${
                      gender === option.value
                        ? 'border-[#014e5c] bg-[#014e5c] text-white'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Age Group Selection */}
            <div>
              <label className="block text-xs lg:text-sm font-medium text-gray-700 mb-2">
                {isEnglish ? 'Age Group' : 'आयु समूह'} <span className="text-gray-400">({isEnglish ? 'Optional' : 'वैकल्पिक'})</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: '18-25', label: '18-25' },
                  { value: '26-35', label: '26-35' },
                  { value: '36-45', label: '36-45' },
                  { value: '46-55', label: '46-55' },
                  { value: '56-65', label: '56-65' },
                  { value: '65+', label: '65+' }
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setAgeGroup(option.value)}
                    className={`p-2 rounded-md border transition-all duration-200 text-xs ${
                      ageGroup === option.value
                        ? 'border-[#014e5c] bg-[#014e5c] text-white'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Area Selection */}
            <div>
              <label className="block text-xs lg:text-sm font-medium text-gray-700 mb-2">
                {isEnglish ? 'Area Type' : 'क्षेत्र का प्रकार'} <span className="text-gray-400">({isEnglish ? 'Optional' : 'वैकल्पिक'})</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'urban', label: isEnglish ? 'Urban' : 'शहरी' },
                  { value: 'rural', label: isEnglish ? 'Rural' : 'ग्रामीण' },
                  { value: 'semi-urban', label: isEnglish ? 'Semi-Urban' : 'अर्ध-शहरी' }
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setArea(option.value)}
                    className={`p-2 rounded-md border transition-all duration-200 text-xs ${
                      area === option.value
                        ? 'border-[#014e5c] bg-[#014e5c] text-white'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-xs">{error}</p>
          </div>
        )}

        {/* Success Message */}
        {message && (
          <div className={`mt-4 p-3 rounded-lg border ${
            messageType === 'success' 
              ? 'bg-[#014e5c] text-white border-[#014e5c]' 
              : 'bg-blue-50 text-blue-800 border-blue-200'
          }`}>
            <p className="text-xs">{message}</p>
          </div>
        )}

        {/* Complete Button */}
        <div className="mt-6 flex justify-center">
          <button
            onClick={saveOnboardingData}
            disabled={!canProceed() || isLoading}
            className="px-6 py-3 bg-[#014e5c] text-white rounded-lg font-medium hover:bg-[#014e5c]/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 text-sm"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{isEnglish ? 'Saving...' : 'सहेज रहे हैं...'}</span>
              </>
            ) : (
              <>
                <span>{isEnglish ? 'Complete Setup' : 'सेटअप पूरा करें'}</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Onboarding; 