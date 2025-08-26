import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import FirebaseService from '../services/firebaseService';
import { House ,MapPin, MessageCircle } from 'lucide-react';

interface CandidateData {
  area_name: string;
  vidhayak_info: {
    name: string;
    image_url: string;
    age: number;
    last_election_vote_percentage: number;
    experience: string;
    party_name: string;
    party_icon_url: string;
    manifesto_link: string;
    manifesto_score: number;
    metadata: {
      education: string;
      net_worth: number;
      criminal_cases: number;
      attendance: string;
      questions_asked: string;
      funds_utilisation: string;
    };
    survey_score: Array<{
      question: string;
      yes_votes: number;
      no_votes: number;
      score: number;
    }>;
  };
  dept_info: Array<{
    dept_name: string;
    work_info: string;
    survey_score: Array<{
      question: string;
      ratings: Record<string, number>;
      score: number;
    }>;
    average_score: number;
  }>;
}

const AapkaKshetra: React.FC = () => {
  const { isEnglish } = useLanguage();
  const { currentUser } = useAuth();
  
  const [constituencies, setConstituencies] = useState<string[]>([]);
  const [selectedConstituency, setSelectedConstituency] = useState<string>('');
  const [candidateData, setCandidateData] = useState<CandidateData | null>(null);
  const [satisfactionVote, setSatisfactionVote] = useState<'yes' | 'no' | null>(null);
  const [departmentRatings, setDepartmentRatings] = useState<Record<string, number>>({});
  const [showCharchaManch, setShowCharchaManch] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showConstituencySelector, setShowConstituencySelector] = useState(true);

  const [hasSubmittedQuestionnaire, setHasSubmittedQuestionnaire] = useState(false);
  const [constituencyId, setConstituencyId] = useState<number | null>(null);
  const [currentInteractionCount, setCurrentInteractionCount] = useState<number>(0);
  const [currentManifestoScore, setCurrentManifestoScore] = useState<number>(0);
  const [currentSatisfactionYes, setCurrentSatisfactionYes] = useState<number>(0);
  const [currentSatisfactionNo, setCurrentSatisfactionNo] = useState<number>(0);

  const translations = {
    titlefirst: {
      en: "Your",
      hi: "आपका"
    },
    titlesecond: {
      en: "Constituency",
      hi: "क्षेत्र"
    },
    selectConstituency: {
      en: "Select Your Constituency",
      hi: "अपना क्षेत्र चुनें"
    },
    candidateInfo: {
      en: "Candidate Information",
      hi: "उम्मीदवार की जानकारी"
    },
    constituency: {
      en: "Constituency",
      hi: "क्षेत्र"
    },
    name: {
      en: "Name",
      hi: "नाम"
    },
    party: {
      en: "Party",
      hi: "पार्टी"
    },
    experience: {
      en: "Experience",
      hi: "अनुभव"
    },
    education: {
      en: "Education",
      hi: "शिक्षा"
    },
    netWorth: {
      en: "Net Worth",
      hi: "कुल संपत्ति"
    },
    criminalCases: {
      en: "Criminal Cases",
      hi: "आपराधिक मामले"
    },
    attendance: {
      en: "Assembly Attendance",
      hi: "विधानसभा उपस्थिति"
    },
    questionsAsked: {
      en: "Questions Asked",
      hi: "पूछे गए प्रश्न"
    },
    fundsUtilization: {
      en: "Funds Utilization",
      hi: "धन का उपयोग"
    },
    manifesto: {
      en: "Manifesto",
      hi: "घोषणापत्र"
    },
    satisfactionQuestion: {
      en: "Are you satisfied with your tenure of last 5 years?",
      hi: "क्या आप पिछले 5 वर्षों के कार्यकाल से संतुष्ट हैं?"
    },
    yes: {
      en: "Yes",
      hi: "हाँ"
    },
    no: {
      en: "No",
      hi: "नहीं"
    },
    totalVotes: {
      en: "Total Votes",
      hi: "कुल वोट"
    },
    departmentRatings: {
      en: "Department Ratings",
      hi: "विभाग रेटिंग"
    },
    rateThis: {
      en: "Rate this",
      hi: "इसे रेट करें"
    },
    averageRating: {
      en: "Average Rating",
      hi: "औसत रेटिंग"
    },
    charchaManch: {
      en: "Charcha Manch",
      hi: "चर्चा मंच"
    },
    backToInfo: {
      en: "Back to Information",
      hi: "जानकारी पर वापस जाएं"
    },
    notLoggedIn: {
      en: "Please log in to rate and vote",
      hi: "रेटिंग और वोटिंग के लिए कृपया लॉगिन करें"
    },
    selectConstituencyOnce: {
      en: "Select your constituency (this cannot be changed later)",
      hi: "अपना क्षेत्र चुनें (इसे बाद में नहीं बदला जा सकता)"
    },
    constituencyLocked: {
      en: "Your constituency is locked",
      hi: "आपका क्षेत्र लॉक है"
    },
    changeConstituency: {
      en: "Change Constituency",
      hi: "क्षेत्र बदलें"
    },
    confirmConstituency: {
      en: "Confirm Selection",
      hi: "चयन की पुष्टि करें"
    },
    constituencyConfirmed: {
      en: "Constituency confirmed! This cannot be changed.",
      hi: "क्षेत्र की पुष्टि हो गई! इसे नहीं बदला जा सकता।"
    },
    totalInteractions: {
      en: "Total Interactions",
      hi: "कुल इंटरैक्शन"
    },
    manifestoScore: {
      en: "Manifesto Score",
      hi: "घोषणापत्र स्कोर"
    }
  };

  useEffect(() => {
    fetchConstituencies();
    if (currentUser) {
      checkUserConstituency();
    }
  }, [currentUser]);

  useEffect(() => {
    if (selectedConstituency) {
      fetchCandidateData(selectedConstituency);
    }
  }, [selectedConstituency, isEnglish]);

  useEffect(() => {
    if (constituencies.length > 0 && selectedConstituency) {
      fetchCandidateData(selectedConstituency);
    }
  }, [isEnglish]);

  const fetchConstituencies = async () => {
    try {
      const dataFile = isEnglish ? '/data/candidates_en.json' : '/data/candidates.json';
      const response = await fetch(dataFile);
      const data: CandidateData[] = await response.json();
      const uniqueConstituencies = [...new Set(data.map((item: CandidateData) => item.area_name))];
      setConstituencies(uniqueConstituencies);
      
      // If user is logged in and has a default constituency, set it
      if (currentUser && uniqueConstituencies.length > 0) {
        setSelectedConstituency(uniqueConstituencies[0]);
      }
    } catch (error) {
      console.error('Error fetching constituencies:', error);
    }
  };

  const checkUserConstituency = async () => {
    if (!currentUser) return;
    
    try {
      const userProfile = await FirebaseService.getUserProfile(currentUser.uid);
      if (userProfile?.constituency_id) {
        // User has already selected a constituency
        // setIsConstituencyLocked(true);
        setShowConstituencySelector(false);
        
        // Find constituency name by ID and set it
        const dataFile = isEnglish ? '/data/candidates_en.json' : '/data/candidates.json';
        const response = await fetch(dataFile);
        const data: CandidateData[] = await response.json();
        const constituency = data.find((_: CandidateData, index: number) => index + 1 === userProfile.constituency_id);
        if (constituency) {
          setSelectedConstituency(constituency.area_name);
          setCandidateData(constituency);
        }
      }
    } catch (error) {
      console.error('Error checking user constituency:', error);
    }
  };

  const fetchCandidateData = async (constituency: string) => {
    try {
      const dataFile = isEnglish ? '/data/candidates_en.json' : '/data/candidates.json';
      const response = await fetch(dataFile);
      const data: CandidateData[] = await response.json();
      const candidate = data.find((item: CandidateData) => item.area_name === constituency);
      if (candidate) {
        setCandidateData(candidate);
        // Initialize department ratings
        const initialRatings: Record<string, number> = {};
        candidate.dept_info.forEach((dept) => {
          initialRatings[dept.dept_name] = 0;
        });
        setDepartmentRatings(initialRatings);
        const idx = data.findIndex((item: CandidateData) => item.area_name === constituency);
        if (idx !== -1) {
          setConstituencyId(idx + 1);
        }
      }
    } catch (error) {
      console.error('Error fetching candidate data:', error);
    }
  };

  const handleSatisfactionVote = async (vote: 'yes' | 'no') => {
    if (currentUser && constituencyId) {
      try {
        setSatisfactionVote(vote);
        
        // Immediately update the constituency scores in Firebase
        await FirebaseService.updateSatisfactionVote(constituencyId, vote);
        
        // Update local state immediately for better UX
        if (vote === 'yes') {
          setCurrentSatisfactionYes(prev => prev + 1);
        } else {
          setCurrentSatisfactionNo(prev => prev + 1);
        }
        
        // Refresh the constituency scores to show updated values
        try {
          const constituencyScores = await FirebaseService.getConstituencyScores(constituencyId);
          if (constituencyScores) {
            setCurrentInteractionCount(constituencyScores.interaction_count || 0);
            setCurrentManifestoScore(constituencyScores.manifesto_average || 0);
            setCurrentSatisfactionYes(constituencyScores.satisfaction_yes || 0);
            setCurrentSatisfactionNo(constituencyScores.satisfaction_no || 0);
          }
        } catch (error) {
          console.error('Error refreshing constituency scores after vote:', error);
        }
        
        console.log(`✅ Satisfaction vote '${vote}' recorded for constituency ${constituencyId}`);
      } catch (error) {
        console.error('Error recording satisfaction vote:', error);
        // Revert the local state if Firebase update fails
        setSatisfactionVote(null);
        alert(isEnglish ? 'Failed to record vote. Please try again.' : 'वोट रिकॉर्ड करने में विफल। कृपया पुनः प्रयास करें।');
      }
    }
  };

  const handleDepartmentRating = (deptName: string, rating: number) => {
    if (currentUser) {
      setDepartmentRatings(prev => ({
        ...prev,
        [deptName]: rating
      }));
    }
  };

  useEffect(() => {
    const checkSubmission = async () => {
      if (!currentUser || !constituencyId) return;
      const submitted = await FirebaseService.hasSubmittedQuestionnaire(currentUser.uid, constituencyId);
      setHasSubmittedQuestionnaire(submitted);
      
      try {
        const constituencyScores = await FirebaseService.getConstituencyScores(constituencyId);
        if (constituencyScores) {
          setCurrentInteractionCount(constituencyScores.interaction_count || 0);
          setCurrentManifestoScore(constituencyScores.manifesto_average || 0);
          setCurrentSatisfactionYes(constituencyScores.satisfaction_yes || 0);
          setCurrentSatisfactionNo(constituencyScores.satisfaction_no || 0);
        }
      } catch (error) {
        console.error('Error fetching constituency scores:', error);
      }
    };
    checkSubmission();
  }, [currentUser, constituencyId]);

  const canSubmitQuestionnaire = () => {
    if (!currentUser || hasSubmittedQuestionnaire) return false;
    if (satisfactionVote === null) return false;
    // ensure all department ratings selected (non-zero)
    const deptValues = Object.values(departmentRatings);
    if (deptValues.length === 0) return false;
    if (deptValues.some(v => v === 0)) return false;
    return true;
  };

  const handleQuestionnaireSubmit = async () => {
    if (!currentUser || !constituencyId) return;
    if (!canSubmitQuestionnaire()) return;
    
    try {
      // Calculate new manifesto score based on department ratings
      const deptValues = Object.values(departmentRatings);
      const newManifestoScore = deptValues.reduce((sum, rating) => sum + rating, 0) / deptValues.length;
      
      // Submit questionnaire with calculated manifesto score
      await FirebaseService.submitQuestionnaire({
        user_id: currentUser.uid,
        constituency_id: constituencyId,
        satisfaction_vote: satisfactionVote === 'yes',
        department_ratings: departmentRatings,
        manifesto_score: newManifestoScore,
      });
      
      // Update constituency scores with new average calculation
      await FirebaseService.updateManifestoAverageIncrement(constituencyId, newManifestoScore);
      
      // Refresh constituency scores to show updated values
      try {
        const constituencyScores = await FirebaseService.getConstituencyScores(constituencyId);
        if (constituencyScores) {
          setCurrentInteractionCount(constituencyScores.interaction_count || 0);
          setCurrentManifestoScore(constituencyScores.manifesto_average || 0);
          setCurrentSatisfactionYes(constituencyScores.satisfaction_yes || 0);
          setCurrentSatisfactionNo(constituencyScores.satisfaction_no || 0);
        }
      } catch (error) {
        console.error('Error refreshing constituency scores:', error);
      }
      
      setHasSubmittedQuestionnaire(true);
      alert(isEnglish ? 'Thank you! Your responses have been submitted.' : 'धन्यवाद! आपकी प्रतिक्रियाएं सबमिट कर दी गई हैं।');
    } catch (e) {
      console.error('Error submitting questionnaire', e);
      alert(isEnglish ? 'Failed to submit. Please try again.' : 'सबमिट करने में विफल। कृपया पुनः प्रयास करें।');
    }
  };

  const handleConstituencyConfirm = async () => {
    if (!currentUser || !selectedConstituency) return;
    
    setIsLoading(true);
    try {
      // Find constituency ID by name
      const dataFile = isEnglish ? '/data/candidates_en.json' : '/data/candidates.json';
      const response = await fetch(dataFile);
      const data: CandidateData[] = await response.json();
      const constituencyIndex = data.findIndex((item: CandidateData) => item.area_name === selectedConstituency);
      
      if (constituencyIndex !== -1) {
        const constituencyId = constituencyIndex + 1;
        
        // Update user profile with constituency
        await FirebaseService.updateUserProfile(currentUser.uid, {
          constituency_id: constituencyId
        });
        
        // setIsConstituencyLocked(true);
        setShowConstituencySelector(false);
        
        // Show success message
        alert(translations.constituencyConfirmed[isEnglish ? 'en' : 'hi']);
      }
    } catch (error) {
      console.error('Error confirming constituency:', error);
      alert('Failed to confirm constituency. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getPartyColor = (partyName: string) => {
    const partyColors: Record<string, string> = {
    'भारतीय जनता पार्टी': 'bg-amber-600',
    'जनता दल (यूनाइटेड)': 'bg-emerald-600',
    'राष्ट्रिया जनता दल': 'bg-green-600',
    'भारतीय राष्ट्रीय कांग्रेस': 'bg-sky-600',
    'कम्युनिस्ट पार्टी ऑफ इंडिया': 'bg-red-500',
    'लोक जनशक्ति पार्टी': 'bg-purple-600',
    'हिंदुस्तानी अवाम मोर्चा': 'bg-green-600',
    'राष्ट्रीय लोक समता पार्टी': 'bg-blue-600',
    'बहूजन समाज पार्टी': 'bg-blue-500',
    'जन अधीकर पार्टी (लोकतांत्रिक)': 'bg-orange-600',
    'कम्युनिस्ट पार्टी ऑफ इंडिया (मार्क्सवादी)': 'bg-rose-500',
    'कम्युनिस्ट पार्टी ऑफ इंडिया (मार्क्सवादी-लेनिनवादी) (मुक्ति)': 'bg-red-600',
    'हिंदुस्तानी अवाम मोर्चा (धर्मनिरपेक्ष)': 'bg-zinc-800',
    'अखिल भारतीय मजलिस-ए-इटिहादुल मुस्लिमीन': 'bg-emerald-900',
    'नोटा': 'bg-gray-600',

    'Bharatiya Janata Party': 'bg-amber-600',
    'Janata Dal (United)': 'bg-emerald-600',
    'Rashtriya Janata Dal': 'bg-green-600',
    'Indian National Congress': 'bg-sky-600',
    'Communist Party of India': 'bg-red-500',
    'Lok Janshakti Party': 'bg-purple-600',
    'Hindustani Awam Front (Secular)': 'bg-green-600',
    'Rashtriya Lok Samta Party': 'bg-blue-600',
    'Bahujan Samaj Party': 'bg-blue-500',
    'Jan Adhikar Party (Democratic)': 'bg-orange-600',
    'Communist Party of India (Marxist)': 'bg-rose-500',
    'Communist Party of India (Marxist-Leninist) (Liberation)': 'bg-red-600',
    'All India Majlis-e-Itihadul Muslimeen': 'bg-emerald-900',
    'Independent': 'bg-yellow-600',
    'NOTA': 'bg-gray-600',
    };
    return partyColors[partyName] || '#6C5CE7';
  };

  const formatNumber = (num: number) => {
    if (num >= 10000000) {
      return (num / 10000000).toFixed(2) + ' Cr';
    } else if (num >= 100000) {
      return (num / 100000).toFixed(2) + ' Lakh';
    }
    return num.toLocaleString();
  };

  if (showCharchaManch) {
    return (
    currentUser && (
      <div className="min-h-screen bg-slate-50 py-8 pb-24 lg:pb-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-xl shadow-lg p-6 text-center border border-slate-200">
            <h1 className="text-2xl font-semibold text-slate-800 mb-2">{translations.charchaManch[isEnglish ? 'en' : 'hi']}</h1>
            <p className="text-sm text-slate-600 mb-4">{translations.constituency[isEnglish ? 'en' : 'hi']}: <span className="font-medium text-emerald-700">{selectedConstituency}</span></p>
            <div className="bg-slate-50 rounded-lg p-4 mb-6 text-left border border-slate-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="bg-white rounded-lg p-3 border border-slate-200">
                  <div className="text-sm text-slate-600 mb-1">{translations.totalInteractions[isEnglish ? 'en' : 'hi']}</div>
                  <div className="text-2xl font-bold text-emerald-600">{currentInteractionCount}</div>
                </div>
                <div className="bg-white rounded-lg p-3 border border-slate-200">
                  <div className="text-sm text-slate-600 mb-1">{translations.manifestoScore[isEnglish ? 'en' : 'hi']}</div>
                  <div className="text-2xl font-bold text-purple-600">{currentManifestoScore.toFixed(1)}/5</div>
                </div>
              </div>
              <p className="text-slate-700 text-sm">चर्चा मंच सामग्री यहाँ दिखाई जाएगी...</p>
            </div>
            <button 
              className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors"
              onClick={() => setShowCharchaManch(false)}
            >
              ← {translations.backToInfo[isEnglish ? 'en' : 'hi']}
            </button>
          </div>
        </div>
      </div>
    )
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 pb-24 lg:pb-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header Section */}
        <div className="bg-white rounded-xl shadow-md border border-slate-200 p-8 mb-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-[#004e5c] mb-3">{translations.titlefirst[isEnglish ? 'en' : 'hi']} <span className="text-[#dc3b21]">{translations.titlesecond[isEnglish ? 'en' : 'hi']}</span></h1>
            {!selectedConstituency && (
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                {isEnglish ? 'Select your constituency to view detailed information about your representative and their performance' : 'अपने प्रतिनिधि और उनके प्रदर्शन के बारे में विस्तृत जानकारी देखने के लिए अपना क्षेत्र चुनें'}
              </p>
            )}
          </div>
        </div>
        
        {/* Constituency Selection */}
        {showConstituencySelector && (
          <div className="bg-white rounded-xl shadow-md border border-slate-200 p-8 mb-8">
            <div className="max-w-2xl mx-auto">
              <div className="text-center mb-6">
                <h2 className="text-xl font-semibold text-slate-800 mb-2">
                  {translations.selectConstituencyOnce[isEnglish ? 'en' : 'hi']}
                </h2>
                <p className="text-slate-600">
                  {isEnglish ? 'Choose carefully - this selection cannot be changed later' : 'सावधानी से चुनें - यह चयन बाद में नहीं बदला जा सकता'}
                </p>
              </div>
              
              <div className="space-y-4">
                <label htmlFor="constituency-select" className="block text-sm font-medium text-slate-700">
                  {translations.selectConstituency[isEnglish ? 'en' : 'hi']}
                </label>
                <select
                  id="constituency-select"
                  value={selectedConstituency}
                  onChange={(e) => setSelectedConstituency(e.target.value)}
                  disabled={isLoading}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed text-base"
                >
                  <option value="">{translations.selectConstituency[isEnglish ? 'en' : 'hi']}</option>
                  {constituencies.map((constituency) => (
                    <option key={constituency} value={constituency}>
                      {constituency}
                    </option>
                  ))}
                </select>
                
                {selectedConstituency && currentUser && (
                  <div className="text-center pt-4">
                    <button
                      className="bg-green-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-60 text-base"
                      onClick={handleConstituencyConfirm}
                      disabled={isLoading}
                    >
                      {isLoading ? 'Processing...' : translations.confirmConstituency[isEnglish ? 'en' : 'hi']}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Not Logged In Warning */}
        {!currentUser && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-8 text-center">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
              <h3 className="text-lg font-semibold text-amber-800">
                {translations.notLoggedIn[isEnglish ? 'en' : 'hi']}
              </h3>
            </div>
            <p className="text-amber-700">
              {isEnglish ? 'You can view constituency information without logging in, but you\'ll need to sign in to rate and vote.' : 'आप बिना लॉगिन किए क्षेत्र की जानकारी देख सकते हैं, लेकिन रेटिंग और वोटिंग के लिए आपको साइन इन करना होगा।'}
            </p>
          </div>
        )}

        {candidateData && (
          <>
            {/* Candidate Profile Card */}
            <div className="bg-white rounded-xl shadow-md border border-slate-200 mb-8 overflow-hidden">
              <div className={`${getPartyColor(candidateData.vidhayak_info.party_name)} h-2`}></div>
              <div className="p-8">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-slate-800 mb-2">
                    {translations.candidateInfo[isEnglish ? 'en' : 'hi']}
                  </h2>
                  <div className="w-20 h-1 bg-emerald-500 mx-auto rounded-full"></div>
                </div>
            
                {/* Candidate Profile */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8 items-start">
                  <div className="lg:col-span-1 text-center lg:text-left">
                    <div className="relative inline-block">
                      <img 
                        src={candidateData.vidhayak_info.image_url} 
                        alt={candidateData.vidhayak_info.name}
                        className="w-40 h-40 lg:w-48 lg:h-48 rounded-full object-cover mx-auto lg:mx-0 mb-6 border-4 border-slate-100 shadow-lg"
                        onError={(e) => {
                          e.currentTarget.src = '/images/logo.png';
                        }}
                      />
                      <div className={`absolute -bottom-2 left-1/2 lg:left-auto lg:right-0 transform -translate-x-1/2 lg:translate-x-0 px-4 py-2 rounded-full text-sm font-medium text-white ${getPartyColor(candidateData.vidhayak_info.party_name)} shadow-lg`}>
                        {candidateData.vidhayak_info.party_name}
                      </div>
                    </div>
                    <h3 className="text-2xl font-bold text-slate-800 mb-4">{candidateData.vidhayak_info.name}</h3>
                  </div>
                  
                  <div className="lg:col-span-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
                        <div className="text-sm text-slate-600 mb-2">{translations.constituency[isEnglish ? 'en' : 'hi']}</div>
                        <div className="text-xl font-semibold text-slate-800">{candidateData.area_name}</div>
                      </div>
                      <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
                        <div className="text-sm text-slate-600 mb-2">{translations.experience[isEnglish ? 'en' : 'hi']}</div>
                        <div className="text-xl font-semibold text-slate-800">{candidateData.vidhayak_info.experience}</div>
                      </div>
                      <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
                        <div className="text-sm text-slate-600 mb-2">{translations.education[isEnglish ? 'en' : 'hi']}</div>
                        <div className="text-xl font-semibold text-slate-800">{candidateData.vidhayak_info.metadata.education}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
                  <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-6 text-center border border-red-200">
                    <div className="text-3xl font-bold text-red-600 mb-2">{candidateData.vidhayak_info.metadata.criminal_cases}</div>
                    <div className="text-sm text-red-700 font-medium">{translations.criminalCases[isEnglish ? 'en' : 'hi']}</div>
                  </div>
                  <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-6 text-center border border-amber-200">
                    <div className="text-3xl font-bold text-amber-600 mb-2">₹{formatNumber(candidateData.vidhayak_info.metadata.net_worth)}</div>
                    <div className="text-sm text-amber-700 font-medium">{translations.netWorth[isEnglish ? 'en' : 'hi']}</div>
                  </div>
                  <div className="bg-gradient-to-br from-sky-50 to-sky-100 rounded-xl p-6 text-center border border-sky-200">
                    <div className="text-3xl font-bold text-sky-600 mb-2">{candidateData.vidhayak_info.metadata.attendance}</div>
                    <div className="text-sm text-sky-700 font-medium">{translations.attendance[isEnglish ? 'en' : 'hi']}</div>
                  </div>
                  <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-6 text-center border border-emerald-200">
                    <div className="text-3xl font-bold text-emerald-600 mb-2">{candidateData.vidhayak_info.metadata.questions_asked}</div>
                    <div className="text-sm text-emerald-700 font-medium">{translations.questionsAsked[isEnglish ? 'en' : 'hi']}</div>
                  </div>
                  <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 rounded-xl p-6 text-center border border-cyan-200">
                    <div className="text-3xl font-bold text-cyan-600 mb-2">{candidateData.vidhayak_info.metadata.funds_utilisation}</div>
                    <div className="text-sm text-cyan-700 font-medium">{translations.fundsUtilization[isEnglish ? 'en' : 'hi']}</div>
                  </div>
                </div>

                {/* Manifesto Link */}
                {candidateData.vidhayak_info.manifesto_link && (
                  <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-8 border border-purple-200 text-center">
                    <h3 className="text-xl font-semibold text-purple-800 mb-4">{translations.manifesto[isEnglish ? 'en' : 'hi']}</h3>
                    <a 
                      href={candidateData.vidhayak_info.manifesto_link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-3 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    >
                      <span className="text-xl">📜</span>
                      <span className="font-medium">{isEnglish ? 'View Manifesto' : 'घोषणापत्र देखें'}</span>
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Satisfaction Survey + Manifesto rating + Submit (hidden after submission) */}
            {!hasSubmittedQuestionnaire && (
            <div className="bg-white rounded-xl shadow-md border border-slate-200 p-8 mb-8">
              <div className="max-w-3xl mx-auto">
                <div className="text-center mb-6">
                  <h3 className="text-xl font-semibold text-slate-800 mb-3">{translations.satisfactionQuestion[isEnglish ? 'en' : 'hi']}</h3>
                  <div className="w-16 h-1 bg-emerald-500 mx-auto rounded-full"></div>
                </div>
                
                {currentUser ? (
                  <>
                    <div className="flex items-center justify-center space-x-8 mb-6">
                      <label className={`flex items-center space-x-3 cursor-pointer group ${satisfactionVote ? 'opacity-50' : ''}`}>
                        <input
                          type="radio"
                          name="satisfaction"
                          value="yes"
                          checked={satisfactionVote === 'yes'}
                          onChange={() => handleSatisfactionVote('yes')}
                          disabled={satisfactionVote !== null}
                          className="text-green-600 w-5 h-5"
                        />
                        <span className="text-slate-700 font-medium group-hover:text-green-600 transition-colors">{translations.yes[isEnglish ? 'en' : 'hi']}</span>
                      </label>
                      <label className={`flex items-center space-x-3 cursor-pointer group ${satisfactionVote ? 'opacity-50' : ''}`}>
                        <input
                          type="radio"
                          name="satisfaction"
                          value="no"
                          checked={satisfactionVote === 'no'}
                          onChange={() => handleSatisfactionVote('no')}
                          disabled={satisfactionVote !== null}
                          className="text-red-600 w-5 h-5"
                        />
                        <span className="text-slate-700 font-medium group-hover:text-red-600 transition-colors">{translations.no[isEnglish ? 'en' : 'hi']}</span>
                      </label>
                    </div>
                    {satisfactionVote && (
                      <div className="text-center mb-4">
                        <p className="text-sm text-emerald-600 font-medium">
                          {isEnglish ? `You voted: ${satisfactionVote === 'yes' ? 'Yes' : 'No'}` : `आपने वोट किया: ${satisfactionVote === 'yes' ? 'हाँ' : 'नहीं'}`}
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-slate-600">{translations.notLoggedIn[isEnglish ? 'en' : 'hi']}</p>
                  </div>
                )}
                
                <div className="flex items-center justify-center space-x-8 text-sm">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                    <span className="text-emerald-600 font-medium">{translations.yes[isEnglish ? 'en' : 'hi']}: {currentSatisfactionYes || 0}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-rose-500 rounded-full"></div>
                    <span className="text-rose-600 font-medium">{translations.no[isEnglish ? 'en' : 'hi']}: {currentSatisfactionNo || 0}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-sky-500 rounded-full"></div>
                    <span className="text-sky-600 font-medium">{translations.totalVotes[isEnglish ? 'en' : 'hi']}: {(currentSatisfactionYes || 0) + (currentSatisfactionNo || 0)}</span>
                  </div>
                </div>
              </div>
            </div>
            )}

            {/* Department Ratings (hidden after submission) */}
            {!hasSubmittedQuestionnaire && (
            <div className="bg-white rounded-xl shadow-md border border-slate-200 p-8 mb-8">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-semibold text-slate-800 mb-3">{translations.departmentRatings[isEnglish ? 'en' : 'hi']}</h3>
                <div className="w-20 h-1 bg-emerald-500 mx-auto rounded-full"></div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {candidateData.dept_info.map((dept) => (
                  <div key={dept.dept_name} className="bg-slate-50 rounded-xl border border-slate-200 p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-semibold text-slate-800">{dept.dept_name}</h4>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-emerald-600">{dept.average_score.toFixed(1)}/5</div>
                        <div className="text-xs text-slate-500">{translations.averageRating[isEnglish ? 'en' : 'hi']}</div>
                      </div>
                    </div>
                    <p className="text-slate-600 text-sm leading-relaxed mb-6 whitespace-pre-line">{dept.work_info}</p>
                    
                    {currentUser ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-center space-x-2">
                          {[1, 2, 3, 4, 5].map((rating) => (
                            <button
                              key={rating}
                              onClick={() => handleDepartmentRating(dept.dept_name, rating)}
                              className={`w-12 h-12 rounded-lg border-2 transition-all duration-200 flex items-center justify-center text-sm font-semibold ${
                                departmentRatings[dept.dept_name] === rating
                                  ? 'border-emerald-500 bg-emerald-50 text-emerald-600 shadow-md'
                                  : 'border-slate-300 hover:border-emerald-400 hover:bg-emerald-50 text-slate-600 hover:text-emerald-600 hover:shadow-sm'
                              }`}
                            >
                              {rating}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-slate-600 text-sm">{translations.notLoggedIn[isEnglish ? 'en' : 'hi']}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              {/* Submit button - moved here after department ratings */}
              {currentUser && (
                <div className="text-center mt-8">
                  <button
                    onClick={handleQuestionnaireSubmit}
                    disabled={!canSubmitQuestionnaire()}
                    className="bg-emerald-600 text-white px-8 py-4 rounded-lg font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 text-lg"
                  >
                    {isEnglish ? 'Submit Responses' : 'प्रतिक्रियाएं सबमिट करें'}
                  </button>
                </div>
              )}
            </div>
            )}

            {/* Charcha Manch Button */}
            <div className="text-center">
              <button 
                className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-8 py-4 rounded-xl font-medium hover:from-green-700 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1 text-lg"
                onClick={() => setShowCharchaManch(true)}
              >
                {translations.charchaManch[isEnglish ? 'en' : 'hi']}
              </button>
            </div>
          </>
        )}
      </div>

      {/* Bottom Navigation - Mobile */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-20 shadow-lg">
        <div className="flex items-center justify-around py-3 px-2">
          <button
            onClick={() => window.location.href = '/'}
            className="flex flex-col items-center space-y-1 p-2 rounded-lg transition-colors text-gray-500 hover:text-[#014e5c]"
          >
            <House className="w-5 h-5 rounded" />
            <span className="text-xs font-medium">{isEnglish ? 'Home' : 'होम'}</span>
          </button>
          <button
            onClick={() => window.location.href = '/discussion'}
            className="flex flex-col items-center space-y-1 p-2 rounded-lg transition-colors text-gray-500 hover:text-[#014e5c]"
          >
            <MessageCircle className="w-5 h-5 rounded" />
            <span className="text-xs font-medium">{isEnglish ? 'Discussion' : 'चर्चा'}</span>
          </button>
          <button
            onClick={() => window.location.href = '/aapka-kshetra'}
            className="flex flex-col items-center space-y-1 p-2 rounded-lg transition-colors text-[#014e5c] bg-[#014e5c]/10"
          >
            <MapPin className="w-5 h-5 rounded" />
            <span className="text-xs font-medium">{isEnglish ? 'Area' : 'क्षेत्र'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AapkaKshetra;