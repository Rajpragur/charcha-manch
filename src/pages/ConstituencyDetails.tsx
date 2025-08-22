import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase } from '../configs/supabase';
import { 
  ArrowLeft, 
  MapPin, 
  User, 
  Award, 
  FileText, 
  Share2, 
  TrendingUp,
  Users,
  Building,
  Star,
  BarChart3,
  DollarSign,
  Heart,
  MessageCircle,
  ThumbsUp,
  ThumbsDown,
  Calendar,
  BookOpen,
  Shield,
  GraduationCap,
  Activity,
  Coins
} from 'lucide-react';
import PlaceholderImages from '../components/PlaceholderImages';

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
    questions_asked: number;
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

interface DepartmentRating {
  department: string;
  rating: number;
  totalRatings: number;
  userRating?: number;
}

const ConstituencyDetails: React.FC = () => {
  const { isEnglish } = useLanguage();
  const { currentUser } = useAuth();
  const { constituencyId } = useParams<{ constituencyId: string }>();
  const navigate = useNavigate();
  
  const [constituencyData, setConstituencyData] = useState<ConstituencyData | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [satisfactionAnswer, setSatisfactionAnswer] = useState<boolean | null>(null);
  const [satisfactionResults, setSatisfactionResults] = useState({ yesCount: 0, noCount: 0 });
  const [departmentRatings, setDepartmentRatings] = useState<DepartmentRating[]>([]);
  const [userRatings, setUserRatings] = useState<Record<string, number>>({});
  const [englishData, setEnglishData] = useState<any[]>([]);
  const [hindiData, setHindiData] = useState<any[]>([]);

  // Load constituency data
  useEffect(() => {
    if (constituencyId) {
      loadConstituencyData();
      loadSatisfactionResults();
      loadDepartmentRatings();
      if (currentUser) {
        loadUserRatings();
      }
    }
  }, [constituencyId, currentUser]);

  // Load English and Hindi data from JSON files
  useEffect(() => {
    loadJsonData();
  }, []);

  const loadJsonData = async () => {
    try {
      // Load both English and Hindi data from JSON files
      const [englishResponse, hindiResponse] = await Promise.all([
        fetch('/data/candidates_en.json'),
        fetch('/data/candidates.json')
      ]);

      const englishData: any[] = await englishResponse.json();
      const hindiData: any[] = await hindiResponse.json();

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

      const constituencyIndex = parseInt(constituencyId!);
      if (isNaN(constituencyIndex) || constituencyIndex < 0 || constituencyIndex >= englishData.length) {
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
          questions_asked: 0,
          funds_utilisation: englishConstituency.vidhayak_info.metadata.funds_utilisation,
          manifesto_score: englishConstituency.vidhayak_info.manifesto_score,
          last_election_vote_percentage: englishConstituency.vidhayak_info.last_election_vote_percentage,
          manifesto_link: englishConstituency.vidhayak_info.manifesto_link,
          is_current_representative: true
        }],
        news: englishConstituency.latest_news?.map((news: any, index: number) => ({
          id: index,
          title: news.title || 'No news available',
          title_hi: hindiConstituency.latest_news?.[index]?.title || 'कोई समाचार उपलब्ध नहीं',
          content: null,
          published_date: null
        })) || []
      };

      setConstituencyData(transformedData);
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

      // Try to get constituency data from Supabase first
      const { data: constituency, error: constituencyError } = await supabase
        .from('constituencies')
        .select(`
          *,
          candidates (*),
          news (*)
        `)
        .eq('id', constituencyId)
        .single();

      if (constituencyError) {
        console.error('Error loading constituency from Supabase:', constituencyError);
        // Fallback: try to load from JSON files
        await loadFromJsonFiles();
        return;
      }

      if (constituency) {
        setConstituencyData(constituency);
      } else {
        setError('Constituency not found');
      }
    } catch (err) {
      console.error('Error loading constituency data:', err);
      setError('Failed to load constituency data');
    } finally {
      setIsLoading(false);
    }
  };

  const loadSatisfactionResults = async () => {
    try {
      const { data, error } = await supabase
        .from('satisfaction_surveys')
        .select('answer')
        .eq('constituency_id', parseInt(constituencyId!));

      if (error) throw error;
      
      const yesCount = data?.filter(s => s.answer === true).length || 0;
      const noCount = data?.filter(s => s.answer === false).length || 0;
      setSatisfactionResults({ yesCount, noCount });
    } catch (err) {
      console.error('Error loading satisfaction results:', err);
    }
  };

  const loadDepartmentRatings = async () => {
    try {
      const { data, error } = await supabase
        .from('department_ratings')
        .select('department, rating')
        .eq('constituency_id', parseInt(constituencyId!));

      if (error) throw error;

      // Group by department and calculate averages
      const departmentMap = new Map<string, { total: number; count: number }>();
      data?.forEach(rating => {
        const existing = departmentMap.get(rating.department) || { total: 0, count: 0 };
        existing.total += rating.rating;
        existing.count += 1;
        departmentMap.set(rating.department, existing);
      });

      const ratings: DepartmentRating[] = [
        { department: 'Health', rating: 0, totalRatings: 0 },
        { department: 'Education', rating: 0, totalRatings: 0 },
        { department: 'Crime', rating: 0, totalRatings: 0 },
        { department: 'Infrastructure', rating: 0, totalRatings: 0 }
      ];

      ratings.forEach(rating => {
        const deptData = departmentMap.get(rating.department);
        if (deptData) {
          rating.rating = Math.round((deptData.total / deptData.count) * 10) / 10;
          rating.totalRatings = deptData.count;
        }
      });

      setDepartmentRatings(ratings);
    } catch (err) {
      console.error('Error loading department ratings:', err);
    }
  };

  const loadUserRatings = async () => {
    try {
      const { data, error } = await supabase
        .from('department_ratings')
        .select('department, rating')
        .eq('constituency_id', parseInt(constituencyId!))
        .eq('user_id', currentUser!.uid);

      if (error) throw error;

      const ratings: Record<string, number> = {};
      data?.forEach(rating => {
        ratings[rating.department] = rating.rating;
      });

      setUserRatings(ratings);
    } catch (err) {
      console.error('Error loading user ratings:', err);
    }
  };

  const submitSatisfactionSurvey = async (answer: boolean) => {
    if (!currentUser || !constituencyId) return;

    try {
      const { error } = await supabase
        .from('satisfaction_surveys')
        .upsert({
          user_id: currentUser.uid,
          constituency_id: parseInt(constituencyId),
          candidate_id: constituencyData?.candidates[0]?.id || 0,
          question: 'Are you satisfied with your tenure of last 5 years?',
          answer
        });

      if (error) throw error;

      setSatisfactionAnswer(answer);
      loadSatisfactionResults(); // Refresh results
    } catch (err) {
      console.error('Error submitting satisfaction survey:', err);
    }
  };

  const submitDepartmentRating = async (department: string, rating: number) => {
    if (!currentUser || !constituencyId) return;

    try {
      const { error } = await supabase
        .from('department_ratings')
        .upsert({
          user_id: currentUser.uid,
          constituency_id: parseInt(constituencyId),
          department,
          rating,
          created_at: new Date().toISOString()
        });

      if (error) throw error;

      setUserRatings(prev => ({ ...prev, [department]: rating }));
      loadDepartmentRatings(); // Refresh averages
    } catch (err) {
      console.error('Error submitting department rating:', err);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${constituencyData?.area_name} - Charcha Manch`,
          url: url
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        alert(isEnglish ? 'Link copied to clipboard!' : 'लिंक क्लिपबोर्ड पर कॉपी हो गया!');
      } catch (err) {
        console.log('Error copying to clipboard:', err);
      }
    }
  };

  // Get party color
  const getPartyColor = (partyName: string): string => {
    const partyColors: Record<string, string> = {
      'Bharatiya Janata Party': 'bg-amber-600',
      'Janata Dal (United)': 'bg-emerald-600',
      'Rashtriya Janata Dal': 'bg-green-600',
      'Indian national Congress': 'bg-blue-600',
      'Communist Party of India': 'bg-red-500',
      'Lok Janshakti Party': 'bg-purple-600',
      'Hindustani Awam front (secular)': 'bg-green-600',
      'Rashtriya Lok Samta Party': 'bg-blue-600',
      'Bahujan Samaj Party': 'bg-blue-500',
      'Jan Adhikar Party (democratic)': 'bg-orange-600',
      'Communist Party of India (Marxist)': 'bg-rose-500',
      'Communist Party of India (Marxist-Leninist) (Liberation)':'bg-red-600',
      'All India Majlis-e-Itihadul Muslimeen':'bg-emerald-600',
      'Independent': 'bg-yellow-600',
      'NOTA': 'bg-gray-800'
    };
    return partyColors[partyName] || 'bg-slate-600';
  };

  // Format currency
  const formatCurrency = (amount: number): string => {
    if (amount >= 10000000) {
      return `₹${(amount / 10000000).toFixed(2)} Cr`;
    } else if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(2)} L`;
    } else {
      return `₹${amount.toLocaleString()}`;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading constituency data...</p>
        </div>
      </div>
    );
  }

  if (error || !constituencyData) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
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
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center space-x-2 text-slate-600 hover:text-slate-800 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>{isEnglish ? 'Back' : 'वापस'}</span>
            </button>
            
            <div className="text-center">
              <h1 className="text-xl font-semibold text-slate-800">
                {constituencyData.area_name}
              </h1>
              <p className="text-sm text-slate-500">
                {isEnglish ? 'Constituency Details' : 'निर्वाचन क्षेत्र विवरण'}
              </p>
            </div>
            
            <button 
              onClick={handleShare}
              className="p-2 text-slate-600 hover:text-slate-800 transition-colors"
            >
              <Share2 className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Candidate Overview Card */}
        {currentCandidate && (
          <div className="bg-white rounded-xl shadow-lg border border-slate-200 mb-8 overflow-hidden">
            <div className={`${getPartyColor(currentCandidate.party_name)} h-2`}></div>
            
            <div className="p-6 lg:p-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Candidate Photo and Basic Info */}
                <div className="lg:col-span-1 text-center lg:text-left">
                  {currentCandidate.image_url ? (
                    <img 
                      src={currentCandidate.image_url} 
                      alt={currentCandidate.name}
                      className="w-32 h-32 lg:w-40 lg:h-40 rounded-full object-cover mx-auto lg:mx-0 mb-4 border-4 border-slate-100"
                    />
                  ) : (
                    <PlaceholderImages type="profile" size="xl" className="mx-auto lg:mx-0 mb-4" />
                  )}
                  
                  <h2 className="text-2xl lg:text-3xl font-bold text-slate-800 mb-2">
                    {isEnglish ? currentCandidate.name : currentCandidate.name_hi}
                  </h2>
                  
                  <div className={`inline-block px-4 py-2 rounded-full text-sm font-medium text-white mb-4 ${getPartyColor(currentCandidate.party_name)}`}>
                    {isEnglish ? currentCandidate.party_name : currentCandidate.party_name_hi}
                  </div>
                  
                  <div className="space-y-2 text-sm text-slate-600">
                    <div className="flex items-center justify-center lg:justify-start space-x-2">
                      <MapPin className="h-4 w-4" />
                      <span>{isEnglish ? constituencyData.area_name : constituencyData.area_name_hi}</span>
                    </div>
                    <div className="flex items-center justify-center lg:justify-start space-x-2">
                      <User className="h-4 w-4" />
                      <span>{currentCandidate.age || 'Not specified'} years old</span>
                    </div>
                    <div className="flex items-center justify-center lg:justify-start space-x-2">
                      <Award className="h-4 w-4" />
                      <span>{currentCandidate.last_election_vote_percentage || 0}% votes</span>
                    </div>
                  </div>
                </div>

                {/* Key Metrics */}
                <div className="lg:col-span-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    
                    <div className="bg-slate-50 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-emerald-600 mb-1">
                        {currentCandidate.criminal_cases || 0}
                      </div>
                      <div className="text-sm text-slate-600">
                        {isEnglish ? 'Criminal Cases' : 'आपराधिक मामले'}
                      </div>
                    </div>
                    
                    <div className="bg-slate-50 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-amber-600 mb-1">
                        {formatCurrency(currentCandidate.net_worth || 0)}
                      </div>
                      <div className="text-sm text-slate-600">
                        {isEnglish ? 'Net Worth' : 'कुल संपत्ति'}
                      </div>
                    </div>
                  </div>

                  {/* Satisfaction Survey */}
                  <div className="bg-slate-50 rounded-lg p-4">
                    <h3 className="font-semibold text-slate-800 mb-3">
                      {isEnglish ? 'Are you satisfied with your tenure of last 5 years?' : 'क्या आप पिछले 5 वर्षों के कार्यकाल से संतुष्ट हैं?'}
                    </h3>
                    
                    {currentUser ? (
                      <div className="space-y-3">
                        <div className="flex items-center space-x-4">
                          <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="radio"
                              name="satisfaction"
                              value="yes"
                              checked={satisfactionAnswer === true}
                              onChange={() => submitSatisfactionSurvey(true)}
                              className="text-green-600"
                            />
                            <span className="text-slate-700">
                              {isEnglish ? 'Yes' : 'हाँ'} ({satisfactionResults.yesCount})
                            </span>
                          </label>
                          <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="radio"
                              name="satisfaction"
                              value="no"
                              checked={satisfactionAnswer === false}
                              onChange={() => submitSatisfactionSurvey(false)}
                              className="text-red-600"
                            />
                            <span className="text-slate-700">
                              {isEnglish ? 'No' : 'नहीं'} ({satisfactionResults.noCount})
                            </span>
                          </label>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-slate-600 mb-3">
                          {isEnglish ? 'Sign in to participate in the survey' : 'सर्वेक्षण में भाग लेने के लिए साइन इन करें'}
                        </p>
                        <Link
                          to="/signin"
                          className="inline-block bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                        >
                          {isEnglish ? 'Sign In' : 'साइन इन'}
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tabs Navigation */}
        <div className="bg-white rounded-lg shadow-md border border-slate-200 mb-8">
          <div className="border-b border-slate-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'overview', label: isEnglish ? 'Overview' : 'अवलोकन', icon: BarChart3 },
                { id: 'departments', label: isEnglish ? 'Departments' : 'विभाग', icon: Building },
                { id: 'candidates', label: isEnglish ? 'Candidates' : 'उम्मीदवार', icon: Users },
                { id: 'news', label: isEnglish ? 'News' : 'समाचार', icon: FileText },
                { id: 'charcha', label: isEnglish ? 'Charcha Manch' : 'चर्चा मंच', icon: MessageCircle }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors ${
                      activeTab === tab.id
                        ? 'border-green-500 text-green-600'
                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && currentCandidate && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Personal Information */}
                  <div className="bg-slate-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                      <User className="h-5 w-5 mr-2 text-sky-600" />
                      {isEnglish ? 'Personal Information' : 'व्यक्तिगत जानकारी'}
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-slate-600">{isEnglish ? 'Age' : 'आयु'}</span>
                        <span className="font-medium">{currentCandidate.age || 'Not specified'} years</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">{isEnglish ? 'Education' : 'शिक्षा'}</span>
                        <span className="font-medium">{currentCandidate.education || 'Not specified'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">{isEnglish ? 'Experience' : 'अनुभव'}</span>
                        <span className="font-medium">{currentCandidate.experience || 'Not specified'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Financial Information */}
                  <div className="bg-slate-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                      <DollarSign className="h-5 w-5 mr-2 text-emerald-600" />
                      {isEnglish ? 'Financial Information' : 'वित्तीय जानकारी'}
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-slate-600">{isEnglish ? 'Net Worth' : 'कुल संपत्ति'}</span>
                        <span className="font-medium">{formatCurrency(currentCandidate.net_worth || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">{isEnglish ? 'Funds Utilisation' : 'धन उपयोग'}</span>
                        <span className="font-medium">{currentCandidate.funds_utilisation || 'Not specified'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Performance Metrics */}
                <div className="bg-slate-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2 text-amber-600" />
                    {isEnglish ? 'Performance Metrics' : 'कार्य प्रदर्शन मापदंड'}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-sky-600 mb-1">
                        {currentCandidate.last_election_vote_percentage || 0}%
                      </div>
                      <div className="text-sm text-slate-600">
                        {isEnglish ? 'Vote Share' : 'वोट शेयर'}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-emerald-600 mb-1">
                        {currentCandidate.attendance_percentage || 'N/A'}%
                      </div>
                      <div className="text-sm text-slate-600">
                        {isEnglish ? 'Attendance' : 'उपस्थिति'}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-amber-600 mb-1">
                        {currentCandidate.questions_asked || 'N/A'}
                      </div>
                      <div className="text-sm text-slate-600">
                        {isEnglish ? 'Questions Asked' : 'पूछे गए प्रश्न'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Manifesto Link */}
                {currentCandidate.manifesto_link && (
                  <div className="bg-slate-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                      <BookOpen className="h-5 w-5 mr-2 text-purple-600" />
                      {isEnglish ? 'Manifesto' : 'घोषणापत्र'}
                    </h3>
                    <a
                      href={currentCandidate.manifesto_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      <FileText className="h-4 w-4" />
                      <span>{isEnglish ? 'View Manifesto' : 'घोषणापत्र देखें'}</span>
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Departments Tab */}
            {activeTab === 'departments' && (
              <div className="space-y-6">
                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-slate-800 mb-2">
                    {isEnglish ? 'Department Performance & Ratings' : 'विभाग प्रदर्शन और रेटिंग'}
                  </h3>
                  <p className="text-slate-600">
                    {isEnglish ? 'Rate the performance of different departments and provide your feedback' : 'विभिन्न विभागों के प्रदर्शन को रेट करें और अपनी प्रतिक्रिया दें'}
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {departmentRatings.map((dept) => (
                    <div key={dept.department} className="bg-white rounded-lg border border-slate-200 p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-semibold text-slate-800 flex items-center">
                          {dept.department === 'Health' && <Heart className="h-5 w-5 mr-2 text-red-500" />}
                          {dept.department === 'Education' && <GraduationCap className="h-5 w-5 mr-2 text-blue-500" />}
                          {dept.department === 'Crime' && <Shield className="h-5 w-5 mr-2 text-amber-500" />}
                          {dept.department === 'Infrastructure' && <Building className="h-5 w-5 mr-2 text-green-500" />}
                          {dept.department}
                        </h4>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-slate-700">
                            {dept.rating}/5
                          </div>
                          <div className="text-sm text-slate-500">
                            {dept.totalRatings} {isEnglish ? 'ratings' : 'रेटिंग'}
                          </div>
                        </div>
                      </div>
                      
                      {currentUser ? (
                        <div className="space-y-3">
                          <div className="flex items-center justify-center space-x-2">
                            {[1, 2, 3, 4, 5].map((rating) => (
                              <button
                                key={rating}
                                onClick={() => submitDepartmentRating(dept.department, rating)}
                                className={`w-10 h-10 rounded-lg border-2 transition-all duration-200 flex items-center justify-center text-sm font-semibold ${
                                  userRatings[dept.department] === rating
                                    ? 'border-green-500 bg-green-50 text-green-600'
                                    : 'border-slate-300 hover:border-green-400 hover:bg-green-50 text-slate-600 hover:text-green-600'
                                }`}
                              >
                                {rating}
                              </button>
                            ))}
                          </div>
                          <div className="flex items-center justify-center text-xs text-slate-500">
                            <span className="mr-4">1 = {isEnglish ? 'Poor' : 'खराब'}</span>
                            <span className="mr-4">3 = {isEnglish ? 'Average' : 'औसत'}</span>
                            <span>5 = {isEnglish ? 'Excellent' : 'उत्कृष्ट'}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-4">
                          <p className="text-slate-600 mb-3">
                            {isEnglish ? 'Sign in to rate this department' : 'इस विभाग को रेट करने के लिए साइन इन करें'}
                          </p>
                          <Link
                            to="/signin"
                            className="inline-block bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                          >
                            {isEnglish ? 'Sign In' : 'साइन इन'}
                          </Link>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Candidates Tab */}
            {activeTab === 'candidates' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">
                  {isEnglish ? 'All Candidates' : 'सभी उम्मीदवार'}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {constituencyData.candidates.map((candidate) => (
                    <div key={candidate.id} className="bg-slate-50 rounded-lg p-4">
                      <div className="flex items-center space-x-3">
                        {candidate.image_url ? (
                          <img 
                            src={candidate.image_url} 
                            alt={candidate.name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <PlaceholderImages type="profile" size="sm" />
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-slate-800 truncate">
                            {candidate.name}
                          </h4>
                          <p className="text-sm text-slate-600 truncate">
                            {candidate.party_name}
                          </p>
                          <div className="flex items-center space-x-1 mt-1">
                            <TrendingUp className="h-3 w-3 text-emerald-500" />
                            <span className="text-xs text-slate-500">
                              {candidate.last_election_vote_percentage || 0}% votes
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* News Tab */}
            {activeTab === 'news' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">
                  {isEnglish ? 'Latest News' : 'ताजा समाचार'}
                </h3>
                {constituencyData.news && constituencyData.news.length > 0 ? (
                  <div className="space-y-4">
                    {constituencyData.news.map((news) => (
                      <div key={news.id} className="bg-slate-50 rounded-lg p-4">
                        <div className="flex items-start space-x-3">
                          <FileText className="h-5 w-5 text-sky-600 mt-1 flex-shrink-0" />
                          <div>
                            <p className="text-slate-700 font-medium">
                          {isEnglish ? news.title : news.title_hi}
                        </p>
                            {news.published_date && (
                              <p className="text-sm text-slate-500 mt-1">
                                {new Date(news.published_date).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    <FileText className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                    <p>{isEnglish ? 'No recent news available' : 'कोई ताजा समाचार उपलब्ध नहीं'}</p>
                  </div>
                )}
              </div>
            )}

            {/* Charcha Manch Tab */}
            {activeTab === 'charcha' && (
              <div className="space-y-6">
                <div className="text-center py-8">
                  <MessageCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-slate-800 mb-2">
                    {isEnglish ? 'Charcha Manch' : 'चर्चा मंच'}
                  </h3>
                  <p className="text-slate-600 mb-6">
                    {isEnglish ? 'Join the discussion about your constituency' : 'अपने निर्वाचन क्षेत्र के बारे में चर्चा में शामिल हों'}
                  </p>
                  {currentUser ? (
                    <Link
                      to={`/charcha/${constituencyData.id}`}
                      className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
                    >
                      {isEnglish ? 'Join Discussion' : 'चर्चा में शामिल हों'}
                    </Link>
                  ) : (
                    <Link
                      to="/signin"
                      className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
                    >
                      {isEnglish ? 'Sign In to Join' : 'शामिल होने के लिए साइन इन करें'}
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConstituencyDetails; 