import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import FirebaseService from '../services/firebaseService';
import { 
  ArrowLeft, 
  Calendar, 
  GraduationCap, 
  MessageCircle, 
  Scale, 
  CircleQuestionMark, 
  IndianRupee,
  BanknoteArrowUp
} from 'lucide-react';
import SignInPopup from '../components/SignInPopup';

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
  other_candidates: Array<{
    candidate_name: string;
    candidate_image_url: string | null;
    candidate_party: string;
    vote_share: number;
  }>;
  latest_news: Array<{
    title: string;
    date?: string;
  }>;
}

interface ConstituencyData {
  id: number;
  area_name: string;
  area_name_hi: string;
  district: string | null;
  candidates: Array<{
    id: number;
    name: string;
    name_hi: string;
    image_url: string | null;
    age: number | null;
    party_name: string;
    party_name_hi: string;
    party_icon_url: string | null;
    experience: string | null;
    education: string | null;
    net_worth: number | null;
    criminal_cases: number;
    attendance_percentage: number | null;
    questions_asked: string;
    funds_utilisation: string | null;
    manifesto_score: number;
    last_election_vote_percentage: number | null;
    manifesto_link: string | null;
    is_current_representative: boolean;
  }>;
  news: Array<{
    id: number;
    title: string;
    title_hi: string;
    content: string | null;
    published_date: string | null;
  }>;
}



const ConstituencyDetails: React.FC = () => {
  const { isEnglish } = useLanguage();
  const { currentUser } = useAuth();
  const { constituencyId } = useParams<{ constituencyId: string }>();
  const navigate = useNavigate();
  
  const [constituencyData, setConstituencyData] = useState<ConstituencyData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [satisfactionAnswer, setSatisfactionAnswer] = useState<boolean | null>(null);
  const [satisfactionResults, setSatisfactionResults] = useState({ yesCount: 0, noCount: 0 });
  const [englishData, setEnglishData] = useState<CandidateData[]>([]);
  const [hindiData, setHindiData] = useState<CandidateData[]>([]);
  const [showSignInPopup, setShowSignInPopup] = useState(false);
  const [manifestoScore, setManifestoScore] = useState<number>(0);

  // Load constituency data
  useEffect(() => {
    if (constituencyId) {
      loadConstituencyData();
      // Load Firebase data with error handling
      Promise.allSettled([
        loadSatisfactionResults(),
        fetchManifestoScore(parseInt(constituencyId)),
        checkUserSatisfactionVote()
      ]).then(() => {
        // All Firebase calls completed (success or failure)
        console.log('Firebase data loading completed');
      });
    }
  }, [constituencyId, currentUser]);

  // Load English and Hindi data from JSON files
  useEffect(() => {
    loadJsonData();
  }, []);

  // Retry loading constituency data when JSON data is available
  useEffect(() => {
    console.log('JSON data effect triggered:', {
      englishDataLength: englishData.length,
      hindiDataLength: hindiData.length,
      constituencyId,
      hasConstituencyData: !!constituencyData
    });
    
    if (englishData.length > 0 && hindiData.length > 0 && constituencyId && !constituencyData) {
      // If we have JSON data but no constituency data, try loading from JSON
      console.log('Triggering loadFromJsonFiles from effect');
      loadFromJsonFiles();
    }
  }, [englishData, hindiData, constituencyId, constituencyData]);

  const loadJsonData = async () => {
    try {
      // Load both English and Hindi data from JSON files
      const [englishResponse, hindiResponse] = await Promise.all([
        fetch('/data/candidates_en.json'),
        fetch('/data/candidates.json')
      ]);

      const englishData: CandidateData[] = await englishResponse.json();
      const hindiData: CandidateData[] = await hindiResponse.json();

      setEnglishData(englishData);
      setHindiData(hindiData);
      console.log('Loaded English data:', englishData.length);
      console.log('Loaded Hindi data:', hindiData.length);
    } catch (err) {
      console.error('Error loading JSON data:', err);
    }
  };

  const loadFromJsonFiles = async () => {
    try {
      if (englishData.length === 0 || hindiData.length === 0) {
        console.log('JSON data not loaded yet, waiting...');
        return;
      }

      console.log('Loading constituency with ID:', constituencyId);
      const constituencyIndex = parseInt(constituencyId!);
      console.log('Parsed constituency index:', constituencyIndex);
      
      if (isNaN(constituencyIndex) || constituencyIndex < 0 || constituencyIndex >= englishData.length) {
        console.error('Invalid constituency index:', constituencyIndex, 'Data length:', englishData.length);
        setError('Constituency not found');
        return;
      }

      const englishConstituency = englishData[constituencyIndex];
      const hindiConstituency = hindiData[constituencyIndex];

      // Transform JSON data to match our interface
      const transformedData: ConstituencyData = {
        id: constituencyIndex,
        area_name: englishConstituency.area_name,
        area_name_hi: hindiConstituency.area_name,
        district: null,
        candidates: [{
          id: constituencyIndex,
          name: englishConstituency.vidhayak_info.name,
          name_hi: hindiConstituency.vidhayak_info.name,
          image_url: hindiConstituency.vidhayak_info.image_url,
          age: englishConstituency.vidhayak_info.age,
          party_name: englishConstituency.vidhayak_info.party_name,
          party_name_hi: hindiConstituency.vidhayak_info.party_name,
          party_icon_url: englishConstituency.vidhayak_info.party_icon_url,
          experience: englishConstituency.vidhayak_info.experience,
          education: englishConstituency.vidhayak_info.metadata.education,
          net_worth: englishConstituency.vidhayak_info.metadata.net_worth,
          criminal_cases: englishConstituency.vidhayak_info.metadata.criminal_cases,
          attendance_percentage: null,
          questions_asked: englishConstituency.vidhayak_info.metadata.questions_asked,
          funds_utilisation: englishConstituency.vidhayak_info.metadata.funds_utilisation,
          manifesto_score: englishConstituency.vidhayak_info.manifesto_score,
          last_election_vote_percentage: englishConstituency.vidhayak_info.last_election_vote_percentage,
          manifesto_link: englishConstituency.vidhayak_info.manifesto_link,
          is_current_representative: true
        }],
        news: englishConstituency.latest_news?.map((news: { title: string }, index: number) => ({
          id: index,
          title: news.title || 'No news available',
          title_hi: hindiConstituency.latest_news?.[index]?.title || 'कोई समाचार उपलब्ध नहीं',
          content: null,
          published_date: null
        })) || []
      };

      setConstituencyData(transformedData);
      setManifestoScore(englishConstituency.vidhayak_info.manifesto_score || 0);
      console.log('Loaded constituency data from JSON files:', transformedData);
    } catch (err) {
      console.error('Error loading from JSON files:', err);
      setError('Failed to load constituency data');
    }
  };

  const loadConstituencyData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('Starting to load constituency data for ID:', constituencyId);
      // Use JSON files as the primary source for now
      await loadFromJsonFiles();
      console.log('Constituency data loading completed');
    } catch (err) {
      console.error('Error loading constituency data:', err);
      setError('Failed to load constituency data');
    } finally {
      setIsLoading(false);
    }
  };

  const loadSatisfactionResults = async () => {
    try {
      const { yesCount, noCount } = await FirebaseService.getSatisfactionResults(parseInt(constituencyId!));
      setSatisfactionResults({ yesCount, noCount });
    } catch (err) {
      console.error('Error loading satisfaction results:', err);
      // Set default values when Firebase fails
      setSatisfactionResults({ yesCount: 0, noCount: 0 });
    }
  };

  const fetchManifestoScore = async (constituencyId: number) => {
    try {
      const constituencyData = await FirebaseService.getConstituencyDataWithSatisfaction();
      const constituencyScore = constituencyData.find(data => data.constituency_id === constituencyId);
      if (constituencyScore) {
        setManifestoScore(constituencyScore.manifesto_average || 0);
      }
    } catch (error) {
      console.error('Error fetching manifesto score:', error);
      setManifestoScore(0);
    }
  };

  const checkUserSatisfactionVote = async () => {
    if (!currentUser || !constituencyId) return;
    try {
      // For now, we'll rely on the satisfactionAnswer state
      // which gets set when the user submits a survey
      // This function can be enhanced later when more Firebase methods are available
      console.log('User satisfaction vote check completed');
    } catch (err) {
      console.error('Error checking user satisfaction vote:', err);
    }
  };



  const submitSatisfactionSurvey = async (answer: boolean) => {
    if (!currentUser || !constituencyId) return;
    try {
      await FirebaseService.submitSatisfactionSurvey({
        user_id: currentUser.uid,
        constituency_id: parseInt(constituencyId),
        candidate_id: constituencyData?.candidates[0]?.id || 0,
        question: 'Are you satisfied with your tenure of last 5 years?',
        answer
      });
      setSatisfactionAnswer(answer);
      loadSatisfactionResults();
    } catch (err) {
      console.error('Error submitting satisfaction survey:', err);
    }
  };





  // Get party color
  const getPartyColor = (partyName: string): string => {
    const partyColors: Record<string, string> = {
      'Bharatiya Janata Party': 'bg-amber-600',
      'Janata Dal (United)': 'bg-emerald-600',
      'Rashtriya Janata Dal': 'bg-green-600',
      'Indian National Congress': 'bg-blue-600',
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
      'NOTA': 'bg-gray-800'
    };
    return partyColors[partyName] || 'bg-slate-600';
  };

  // Format currency
  const formatCurrency = (amount: number | null | undefined, isEnglish: boolean): string => {
    if (amount === null || amount === undefined || isNaN(amount)) {
      return isEnglish ? "₹0" : "₹0";
    }
    
    if (amount >= 10000000) {
      return isEnglish ? `₹${(amount / 10000000).toFixed(2)} Cr` : `₹${(amount / 10000000).toFixed(2)} करोड़`;
    } else if (amount >= 100000) {
      return isEnglish ? `₹${(amount / 100000).toFixed(2)} L` : `₹${(amount / 100000).toFixed(2)} लाख`;
    } else {
      return isEnglish ? `₹${amount.toLocaleString()}` : `₹${amount.toLocaleString()}`;
    }
  };

  const fetchPartyIcon = (partyName: string) => {
    const partyIcons: Record<string, string> = {
      'Bharatiya Janata Party': '/images/party_logo/bjp.png',
      'Janata Dal (United)': '/images/party_logo/jdu.png',
      'Rashtriya Janata Dal': '/images/party_logo/rjd.png',
      'Indian National Congress': '/images/party_logo/inc.png',
      'Communist Party of India': '/images/party_logo/cpi.png',
      'Hindustani Awam Front (Secular)': '/images/party_logo/HAM.png',
      'Communist Party of India (Marxist)': '/images/party_logo/cpim.png',
      'Communist Party of India (Marxist-Leninist) (Liberation)': '/images/party_logo/cpiml.png',
      'All India Majlis-e-Itihadul Muslimeen': '/images/party_logo/aimim.png',
      'Independent': '/images/party_logo/independent.png',
      'NOTA': '/images/party_logo/nota.png',
    };
    return partyIcons[partyName] || '/images/party_logo/independent.png';
  };

  const handleCharchaManchClick = () => {
    if (constituencyData) {
      navigate(`/discussion?constituency=${constituencyData.area_name}&name=${encodeURIComponent(constituencyData.area_name)}`);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#c1cbd1] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">{isEnglish ? 'Loading constituency data...' : 'निर्वाचन क्षेत्र डेटा लोड हो रहा है...'}</p>
        </div>
      </div>
    );
  }

  if (error || !constituencyData) {
    return (
      <div className="min-h-screen bg-[#c1cbd1] flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">
            {isEnglish ? 'Constituency Not Found' : 'निर्वाचन क्षेत्र नहीं मिला'}
          </h1>
          <p className="text-slate-600 mb-6">
            {isEnglish ? 'The constituency you are looking for could not be found.' : 'आप जिस निर्वाचन क्षेत्र की तलाश कर रहे हैं वह नहीं मिला।'}
          </p>
          <Link
            to="/"
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            {isEnglish ? 'Back to Home' : 'होम पर वापस जाएं'}
          </Link>
        </div>
      </div>
    );
  }

  const currentCandidate = constituencyData.candidates.find(c => c.is_current_representative);

  return (
    <div className="min-h-screen bg-[#c1cbd1] py-2">
      {/* Header Section with Flyer */}
      <div className="bg-[#273F4F] shadow-sm border-b border-gray-200 text-center relative overflow-hidden px-4">
        <div className="relative z-10 pt-8 px-2 pb-12">
          <button
            onClick={() => navigate(-1)}
            className="absolute top-4 left-4 flex items-center space-x-2 text-white hover:text-gray-200 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>{isEnglish ? 'Back' : 'वापस'}</span>
          </button>
          
          <h1 className="lg:text-4xl text-2xl font-bold text-white mt-1 mb-1">
            {isEnglish ? constituencyData.area_name : constituencyData.area_name_hi}
          </h1>
          <p className="aapke-kshetra-ki" style={{fontWeight: 600, fontSize: '1.5rem', letterSpacing: 0}}>
            <span style={{color: '#a4abb6ff'}}>{isEnglish ? 'Information about' : 'आपके क्षेत्र की'}</span>
            <span style={{color: '#DC3C22'}}>{isEnglish ? ' Your Area' : ' जानकारी'}</span>
          </p>
        </div>
      </div>

      <div className="px-4 py-3">
        {/* MLA Profile Card */}
        {currentCandidate && (
          <div className="bg-white rounded-lg p-3 lg:p-5 mb-2 shadow-sm">
            <div className="flex items-start space-x-4">
              <div className="relative">
                <img 
                  src={currentCandidate.image_url || '/images/logo.png'} 
                  alt={currentCandidate.name}
                  className="w-15 h-15 lg:w-25 lg:h-25 rounded-full object-cover border-2 border-gray-200"
                  onError={(e) => {
                    e.currentTarget.src = '/images/logo.png';
                  }}
                />
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <h2 className="text-xl font-bold text-black">{isEnglish ? currentCandidate.name : currentCandidate.name_hi}</h2>
                  <span className="bg-gray-200 text-black text-xs px-3 py-1 rounded-full">
                    {isEnglish ? 'MLA' : 'विधायक'}
                  </span>
                </div>
                <p className="text-gray-600 text-sm mb-3">
                  {isEnglish ? `Age: ${currentCandidate.age || 'N/A'} years` : `उम्र: ${currentCandidate.age || 'N/A'} वर्ष`}
                </p>
                <div className="flex items-center space-x-3 mb-3">
                  <span className={`px-2 py-1 rounded-full text-white text-xs font-medium ${getPartyColor(currentCandidate.party_name)}`}>
                    {isEnglish ? currentCandidate.party_name : currentCandidate.party_name_hi}
                  </span>
                  <div className="w-10 h-10 lg:w-10 lg:h-10 ml-10 lg:ml-320 rounded-full flex items-center justify-center border border-gray-200">
                    <img 
                      className="w-10 h-10 lg:w-10 lg:h-10 font-thin object-contain" 
                      src={fetchPartyIcon(currentCandidate.party_name)} 
                      alt={`${currentCandidate.party_name} logo`}
                      onError={(e) => {
                        e.currentTarget.src = '/images/party_logo/independent.png';
                      }}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between space-x-2">
                  <span className="bg-[#e2ebf3] justify-left text-black text-xs px-2 py-[0.5px] rounded-full">
                    {isEnglish ? `Last election: ${currentCandidate.last_election_vote_percentage || 'N/A'}% votes` : `अंतिम चुनाव: ${currentCandidate.last_election_vote_percentage || 'N/A'}% वोट`}
                  </span>
                  <div className="text-center">
                    <div className="text-sm font-bold text-black">{currentCandidate.experience || 'N/A'}</div>
                    <div className="text-xs text-gray-600">{isEnglish ? 'Post experience' : 'पद अनुभव'}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Public Satisfaction Card */}
        {currentCandidate && (
          <div className="bg-white rounded-lg p-4 lg:p-6 mb-2 lg:mb-4 shadow-sm">
            <h3 className="text-xs lg:text-lg font-medium text-black mb-2">
              {isEnglish ? 'Are you satisfied with the last five years of tenure?' : 'क्या आप पिछले पांच साल के कार्यकाल से संतुष्ट हैं?'}
            </h3>
            
            {/* Show voting buttons - always visible but handle authentication */}
            {satisfactionAnswer === null ? (
              <div className="flex items-center space-x-2 mb-2">
                <button 
                  onClick={() => {
                    if (!currentUser) {
                      setShowSignInPopup(true);
                    } else {
                      submitSatisfactionSurvey(true);
                    }
                  }}
                  className="px-3 py-1 text-xs rounded-full transition-colors bg-white text-gray-700 border border-gray-300 hover:bg-green-50 hover:border-green-300"
                >
                  {isEnglish ? "Yes" : "हाँ"}
                </button>
                <button 
                  onClick={() => {
                    if (!currentUser) {
                      setShowSignInPopup(true);
                    } else {
                      submitSatisfactionSurvey(false);
                    }
                  }}
                  className="px-3 py-1 text-xs rounded-full transition-colors bg-white text-gray-700 border border-gray-300 hover:bg-red-50 hover:border-red-300"
                >
                  {isEnglish ? "No" : "ना"}
                </button>
              </div>
            ) : satisfactionAnswer !== null ? (
              /* Show vote counts and user's vote if they have already voted */
              <div className="mb-2">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-600">
                      {isEnglish ? "Your vote:" : "आपका वोट:"}
                    </span>
                    {satisfactionAnswer === true ? (
                      <span className="px-2 py-1 text-xs rounded-full bg-[#014e5c] text-white">
                        {isEnglish ? "Yes" : "हाँ"}
                      </span>
                    ) : satisfactionAnswer === false ? (
                      <span className="px-2 py-1 text-xs rounded-full bg-red-500 text-white">
                        {isEnglish ? "No" : "ना"}
                      </span>
                    ) : null}
                  </div>
                  <div className="text-sm font-bold text-green-600">
                    {satisfactionResults.yesCount + satisfactionResults.noCount > 0 ? (
                      Math.round(
                        (satisfactionResults.yesCount /
                          (satisfactionResults.yesCount + satisfactionResults.noCount)) *
                          100,
                      )
                    ) : (
                      0
                    )}
                    % {isEnglish ? "Satisfied" : "संतुष्ट"}
                  </div>
                </div>
                

              </div>
            ) : null}
          </div>
        )}

        {/* Key Metrics Grid */}
        {currentCandidate && (
          <div className="grid grid-cols-2 gap-3 mb-4 bg-white px-2 py-2">
            {/* Education */}
            <div className="bg-white rounded-lg p-4 lg:p-6 shadow-sm flex items-center min-h-[80px] lg:min-h-[100px]">
              <div className="w-10 h-10 lg:w-12 lg:h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                <GraduationCap className="w-5 h-5 lg:w-7 lg:h-7 text-blue-600" />
              </div>
              <div>
                <p className="text-sm lg:text-base text-black mb-1">{isEnglish ? 'Education level' : 'शिक्षा स्तर'}</p>
                <p className="text-blue-600 font-semibold text-sm lg:text-base">
                  {isEnglish ? currentCandidate.education : currentCandidate.education}
                </p>
              </div>
            </div>

            {/* Net Worth */}
            <div className="bg-white rounded-lg p-4 lg:p-6 shadow-sm flex items-center min-h-[80px] lg:min-h-[100px]">
              <div className="w-10 h-10 lg:w-12 lg:h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                <IndianRupee className="w-5 h-5 lg:w-7 lg:h-7 text-blue-600" />
              </div>
              <div className="flex-1 items-center">
                <p className="text-sm lg:text-base text-black mb-1">{isEnglish ? 'Net Worth' : 'संपत्ति'}</p>
                <p className="text-blue-600 font-semibold text-sm lg:text-base">
                  {formatCurrency(currentCandidate.net_worth, isEnglish)}
                </p>
              </div>
            </div>

            {/* Criminal Cases */}
            <div className="bg-white rounded-lg p-4 lg:p-6 shadow-sm flex items-center min-h-[80px] lg:min-h-[100px]">
              <div className="w-10 h-10 lg:w-12 lg:h-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
                <Scale className="w-5 h-5 lg:w-7 lg:h-7 text-red-600" />
              </div>
              <div>
                <p className="text-sm lg:text-base text-black mb-1">{isEnglish ? 'Criminal cases' : 'आपराधिक मामले'}</p>
                <p className="text-blue-600 font-semibold text-sm lg:text-base">
                  {currentCandidate.criminal_cases}
                </p>
              </div>
            </div>

            {/* Assembly Attendance */}
            <div className="bg-white rounded-lg p-4 lg:p-6 shadow-sm flex items-center min-h-[80px] lg:min-h-[100px]">
              <div className="w-10 h-10 lg:w-12 lg:h-12 bg-purple-100 rounded-full flex items-center justify-center mr-4">
                <Calendar className="w-5 h-5 lg:w-7 lg:h-7 text-purple-600" />
              </div>
              <div>
                <p className="text-sm lg:text-base text-black mb-1">{isEnglish ? 'Assembly attendance' : 'विधानसभा उपस्थिति'}</p>
                <p className="text-blue-600 font-semibold text-sm lg:text-base">
                  {currentCandidate.attendance_percentage || '0%'}
                </p>
              </div>
            </div>

            {/* Questions Asked */}
            <div className="bg-white rounded-lg p-4 lg:p-6 shadow-sm flex items-center min-h-[80px] lg:min-h-[100px]">
              <div className="w-10 h-10 lg:w-12 lg:h-12 bg-orange-100 rounded-full flex items-center justify-center mr-4">
                <CircleQuestionMark className="w-5 h-5 lg:w-7 lg:h-7 text-orange-600" />
              </div>
              <div>
                <p className="text-sm lg:text-base text-black mb-1">{isEnglish ? 'Questions asked' : 'सवाल पूछे'}</p>
                <p className="text-blue-600 font-semibold text-sm lg:text-base">
                  {currentCandidate.questions_asked || '0'}
                </p>
              </div>
            </div>

            {/* Fund Utilization */}
            <div className="bg-white rounded-lg p-4 lg:p-6 shadow-sm flex items-center min-h-[80px] lg:min-h-[100px]">
              <div className="w-10 h-10 lg:w-12 lg:h-12 bg-orange-100 rounded-full flex items-center justify-center mr-4">
                <BanknoteArrowUp className="w-5 h-5 lg:w-7 lg:h-7 text-orange-600" />
              </div>
              <div>
                <p className="text-sm lg:text-base text-black mb-1">{isEnglish ? 'Fund utilization' : 'निधि उपयोग'}</p>
                <p className="text-blue-600 font-semibold text-sm lg:text-base">
                  {currentCandidate.funds_utilisation || '0%'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Manifesto Link */}
        {currentCandidate && currentCandidate.manifesto_link && (
          <div className="bg-white rounded-lg p-4 mb-2 shadow-sm text-center">
            <a 
              href={currentCandidate.manifesto_link} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <span className="text-lg">📜</span>
              <span className="text-sm font-medium">
                {isEnglish ? 'View Previous Manifesto' : 'पूर्व घोषणापत्र देखें'}
              </span>
            </a>
          </div>
        )}

        {/* Manifesto Score Display */}
        {currentCandidate && (
          <div className="bg-white rounded-lg p-4 mb-2 shadow-sm">
            <h3 className="text-lg font-medium text-black mb-4 text-center">
              {isEnglish ? 'Manifesto Promise Score' : 'घोषणापत्र वादा स्कोर'}
            </h3>
            
            <div className="text-center">
              <div className="text-4xl font-bold text-[#273F4F] mb-2">
                {manifestoScore * 20}%
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
                <div 
                  className="bg-[#273F4F] h-4 rounded-full transition-all duration-300"
                  style={{ width: `${manifestoScore * 20}%` }}
                ></div>
              </div>
              <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
                <div className="text-center">
                  <div className="font-semibold text-gray-700">{isEnglish ? 'Score' : 'स्कोर'}</div>
                  <div className="text-lg font-bold text-[#273F4F]">{manifestoScore}/5</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-gray-700">{isEnglish ? 'Percentage' : 'प्रतिशत'}</div>
                  <div className="text-lg font-bold text-[#273F4F]">{manifestoScore * 20}%</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-gray-700">{isEnglish ? 'Rating' : 'रेटिंग'}</div>
                  <div className="text-lg font-bold text-[#273F4F]">
                    {manifestoScore >= 4 ? (isEnglish ? 'Excellent' : 'उत्कृष्ट') :
                     manifestoScore >= 3 ? (isEnglish ? 'Good' : 'अच्छा') :
                     manifestoScore >= 2 ? (isEnglish ? 'Average' : 'औसत') :
                     (isEnglish ? 'Poor' : 'खराब')}
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                {isEnglish 
                  ? 'Based on public feedback and performance metrics' 
                  : 'जनता की प्रतिक्रिया और प्रदर्शन मापदंडों के आधार पर'
                }
              </p>
            </div>
          </div>
        )}



        {/* Charcha Manch Button */}
        <div className="bg-white rounded-lg p-4 mb-2 shadow-sm text-center">
          <button
            onClick={handleCharchaManchClick}
            className="inline-flex items-center space-x-2 bg-[#DEAF13] text-white px-6 py-3 rounded-lg hover:bg-[#C49F11] transition-colors font-medium"
          >
            <MessageCircle className="w-5 h-5" />
            <span>{isEnglish ? 'Join Discussion' : 'चर्चा में शामिल हों'}</span>
          </button>
        </div>
      </div>

      {/* Sign In Popup */}
      {showSignInPopup && (
        <SignInPopup
          isOpen={showSignInPopup}
          onClose={() => setShowSignInPopup(false)}
          customMessage={isEnglish ? "Please sign in to submit your satisfaction survey" : "कृपया अपनी संतुष्टि सर्वेक्षण जमा करने के लिए साइन इन करें"}
        />
      )}
    </div>
  );
};

export default ConstituencyDetails; 