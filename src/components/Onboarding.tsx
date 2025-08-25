import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import FirebaseService from '../services/firebaseService';
import { 
  MapPin, 
  Calendar, 
  User, 
  CheckCircle, 
  ArrowRight,
  Loader2
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
  
  const [step, setStep] = useState(1);
  const [constituencies, setConstituencies] = useState<Constituency[]>([]);
  const [selectedConstituency, setSelectedConstituency] = useState<number | null>(null);
  const [firstVoteYear, setFirstVoteYear] = useState<number | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load constituencies on component mount
  useEffect(() => {
    loadConstituencies();
  }, []);

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

  // Handle first vote year input
  const handleFirstVoteYearChange = (year: string) => {
    const numYear = parseInt(year);
    if (numYear >= 1950 && numYear <= new Date().getFullYear()) {
      setFirstVoteYear(numYear);
    }
  };

  // Generate current year options for first vote
  const generateYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let year = currentYear; year >= 1950; year--) {
      years.push(year);
    }
    return years;
  };

  // Save onboarding data
  const saveOnboardingData = async () => {
    if (!currentUser || !selectedConstituency) return;

    setIsLoading(true);
    setError(null);

    try {
      await FirebaseService.createUserProfile(currentUser.uid, {
        display_name: displayName || currentUser.displayName || currentUser.email?.split('@')[0],
        bio: bio,
        first_vote_year: firstVoteYear || undefined,
        constituency_id: selectedConstituency,
        tier_level: 1,
        engagement_score: 0
      });

      // Redirect to dashboard
      navigate('/dashboard');
    } catch (err) {
      console.error('Error saving onboarding data:', err);
      setError('Failed to save your information. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Update constituency user count (not needed in Firebase for now)

  // Next step validation
  const canProceedToNext = () => {
    switch (step) {
      case 1:
        return selectedConstituency !== null;
      case 2:
        return firstVoteYear !== null;
      case 3:
        return true; // Profile info is optional
      default:
        return false;
    }
  };

  // Next step handler
  const handleNext = () => {
    if (canProceedToNext()) {
      if (step === 3) {
        saveOnboardingData();
      } else {
        setStep(step + 1);
      }
    }
  };

  // Previous step handler
  const handlePrevious = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  // Skip profile step
  const handleSkipProfile = () => {
    saveOnboardingData();
  };

  if (!currentUser) {
    navigate('/signin');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {isEnglish ? 'Welcome to Charcha Manch!' : 'चर्चा मंच में आपका स्वागत है!'}
          </h1>
          <p className="text-gray-600">
            {isEnglish ? 'Let\'s get to know you better' : 'आइए आपको बेहतर तरीके से जानें'}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {[1, 2, 3].map((stepNumber) => (
              <div
                key={stepNumber}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= stepNumber
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {step > stepNumber ? <CheckCircle className="h-5 w-5" /> : stepNumber}
              </div>
            ))}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-green-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>

        {/* Step Content */}
        <div className="mb-8">
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center">
                <MapPin className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                  {isEnglish ? 'Select Your Constituency' : 'अपना निर्वाचन क्षेत्र चुनें'}
                </h2>
                <p className="text-gray-600">
                  {isEnglish ? 'Choose the constituency where you vote' : 'वह निर्वाचन क्षेत्र चुनें जहां आप वोट करते हैं'}
                </p>
              </div>

              <div className="max-h-96 overflow-y-auto">
                <div className="grid grid-cols-1 gap-3">
                  {constituencies.map((constituency) => (
                    <button
                      key={constituency.id}
                      onClick={() => handleConstituencySelect(constituency.id)}
                      className={`p-4 text-left rounded-lg border-2 transition-all duration-200 ${
                        selectedConstituency === constituency.id
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-green-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="font-medium text-gray-900">
                        {constituency.area_name}
                      </div>
                      <div className="text-sm text-gray-600">
                        {constituency.district} • Bihar
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center">
                <Calendar className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                  {isEnglish ? 'When Did You First Vote?' : 'आपने पहली बार कब वोट किया?'}
                </h2>
                <p className="text-gray-600">
                  {isEnglish ? 'This helps us understand your voting experience' : 'यह हमें आपके मतदान अनुभव को समझने में मदद करता है'}
                </p>
              </div>

              <div className="max-w-md mx-auto">
                <select
                  value={firstVoteYear || ''}
                  onChange={(e) => handleFirstVoteYearChange(e.target.value)}
                  className="w-full p-4 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:outline-none text-lg"
                >
                  <option value="">
                    {isEnglish ? 'Select year...' : 'वर्ष चुनें...'}
                  </option>
                  {generateYearOptions().map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>

              {firstVoteYear && (
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-green-800 font-medium">
                    {isEnglish 
                      ? `You first voted in ${firstVoteYear}`
                      : `आपने पहली बार ${firstVoteYear} में वोट किया`
                    }
                  </p>
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center">
                <User className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                  {isEnglish ? 'Tell Us About Yourself' : 'हमें अपने बारे में बताएं'}
                </h2>
                <p className="text-gray-600">
                  {isEnglish ? 'This information is optional but helps personalize your experience' : 'यह जानकारी वैकल्पिक है लेकिन आपके अनुभव को व्यक्तिगत बनाने में मदद करती है'}
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {isEnglish ? 'Display Name' : 'प्रदर्शन नाम'}
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder={isEnglish ? 'Enter your display name' : 'अपना प्रदर्शन नाम दर्ज करें'}
                    className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {isEnglish ? 'Bio' : 'जीवनी'}
                  </label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder={isEnglish ? 'Tell us about yourself...' : 'हमें अपने बारे में बताएं...'}
                    rows={3}
                    className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:outline-none resize-none"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between">
          <button
            onClick={handlePrevious}
            disabled={step === 1}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              step === 1
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {isEnglish ? 'Previous' : 'पिछला'}
          </button>

          <div className="flex space-x-3">
            {step === 3 && (
              <button
                onClick={handleSkipProfile}
                disabled={isLoading}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
              >
                {isEnglish ? 'Skip' : 'छोड़ें'}
              </button>
            )}

            <button
              onClick={handleNext}
              disabled={!canProceedToNext() || isLoading}
              className="px-6 py-3 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{isEnglish ? 'Saving...' : 'सहेज रहे हैं...'}</span>
                </>
              ) : (
                <>
                  <span>
                    {step === 3 
                      ? (isEnglish ? 'Complete' : 'पूरा करें')
                      : (isEnglish ? 'Next' : 'अगला')
                    }
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding; 