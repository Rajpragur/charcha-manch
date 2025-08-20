import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
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
  DollarSign,
  Star,
  BarChart3
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import PlaceholderImages from '../components/PlaceholderImages';

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
  }>;
}

const Constituency: React.FC = () => {
  const { isEnglish } = useLanguage();
  const { constituencySlug } = useParams<{ constituencySlug: string }>();
  const [searchParams] = useSearchParams();
  const constituencyId = searchParams.get('id');
  const showAll = searchParams.get('showAll') === 'true';
  const encodedData = searchParams.get('data');
  
  // Create a unique key for this constituency to force re-render
  const constituencyKey = `${constituencySlug}-${constituencyId}-${encodedData ? 'encoded' : 'none'}`;
  
  const [constituencyData, setConstituencyData] = useState<CandidateData | null>(null);
  const [allConstituencies, setAllConstituencies] = useState<CandidateData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedParty, setSelectedParty] = useState<string>('all');

  useEffect(() => {
    setConstituencyData(null);
    setError(null);
    setIsLoading(true);
  }, [constituencyKey]);

  // Load constituency data
  useEffect(() => {
    const loadConstituencyData = async () => {
      try {
        setIsLoading(true);
        setError(null); // Clear any previous errors
        console.log('Constituency page loading with params:', { constituencyId, constituencySlug, showAll, encodedData });
        
        // Load all candidates data
        const response = await fetch('/data/candidates.json');
        const allCandidates: CandidateData[] = await response.json();
        setAllConstituencies(allCandidates);
        console.log('Loaded all candidates:', allCandidates.length);
        
        if (showAll) {
          // If showing all constituencies, don't set specific constituency data
          setIsLoading(false);
          return;
        }
        
        // First try to get from URL encoded data (most reliable)
        if (encodedData) {
          try {
            const decodedData = JSON.parse(decodeURIComponent(encodedData));
            console.log('Successfully decoded data from URL:', decodedData);
            
            // Validate that the data has the required structure
            if (decodedData && decodedData.area_name && decodedData.vidhayak_info) {
              setConstituencyData(decodedData);
              setIsLoading(false);
              console.log('Set constituency data from URL encoded data');
              return;
            } else {
              console.log('URL encoded data is invalid');
            }
          } catch (decodeError) {
            console.error('Error decoding URL data:', decodeError);
          }
        }
        
        // Second try to get from localStorage (if navigated from home page)
        const storedData = localStorage.getItem('selectedConstituency');
        console.log('Stored constituency data from localStorage:', storedData);
        
        if (storedData) {
          try {
            const parsedData = JSON.parse(storedData);
            console.log('Successfully parsed constituency data:', parsedData);
            
            // Validate that the data has the required structure
            if (parsedData && parsedData.area_name && parsedData.vidhayak_info) {
              setConstituencyData(parsedData);
              setIsLoading(false);
              console.log('Set constituency data from localStorage');
              return;
            } else {
              console.log('Stored data is invalid, clearing localStorage');
              localStorage.removeItem('selectedConstituency');
            }
          } catch (parseError) {
            console.error('Error parsing stored constituency data:', parseError);
            localStorage.removeItem('selectedConstituency'); // Clear invalid data
          }
        }

        // Find the specific constituency by ID or slug
        let foundConstituency: CandidateData | null = null;
        
        console.log('Looking for constituency with ID:', constituencyId, 'or slug:', constituencySlug);
        
        if (constituencyId) {
          const id = parseInt(constituencyId);
          console.log('Parsed ID:', id, 'Total candidates:', allCandidates.length);
          if (!isNaN(id) && id >= 0 && id < allCandidates.length) {
            foundConstituency = allCandidates[id];
            console.log('Found constituency by ID:', foundConstituency);
          } else {
            console.log('Invalid ID or out of range');
          }
        } else if (constituencySlug && constituencySlug !== 'all-constituencies') {
          // Try to find by slug (area name) - new format includes ID
          // Extract area name from slug (remove the ID part)
          const areaNameFromSlug = constituencySlug.split('-').slice(0, -1).join('-');
          console.log('Extracted area name from slug:', areaNameFromSlug);
          
          foundConstituency = allCandidates.find(candidate => 
            candidate.area_name.toLowerCase().replace(/\s+/g, '-') === areaNameFromSlug
          ) || null;
          console.log('Found constituency by slug:', foundConstituency);
        }
        
        if (foundConstituency) {
          console.log('Setting constituency data from search:', foundConstituency);
          setConstituencyData(foundConstituency);
          // Store in localStorage for future reference
          localStorage.setItem('selectedConstituency', JSON.stringify(foundConstituency));
        } else if (!showAll) {
          console.log('No constituency found, setting error');
          setError('Constituency not found');
        }
        
        setIsLoading(false);
      } catch (err) {
        console.error('Error loading constituency data:', err);
        setError('Failed to load constituency data');
        setIsLoading(false);
      }
    };

    loadConstituencyData();
  }, [constituencyId, constituencySlug, showAll, encodedData]); // Added encodedData to dependencies

  // Get party color
  const getPartyColor = (partyName: string): string => {
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
      'कम्युनिस्ट पार्टी ऑफ इंडिया (मार्क्सवादी)':'bg-rose-500',
      'नोटा': 'bg-gray-600',
      'हिंदुस्तानी अवाम मोर्चा (धर्मनिरपेक्ष)':'bg-zinc-800',
      'अखिल भारतीय मजलिस-ए-इटिहादुल मुस्लिमीन': 'bg-emerald-900',
      'कम्युनिस्ट पार्टी ऑफ इंडिया (मार्क्सवादी-लेनिनवादी) (मुक्ति)': 'bg-red-600'
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

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-sky-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading constituency data...</p>
          <div className="mt-4 text-xs text-slate-400">
            <p>Debug Info:</p>
            <p>Key: {constituencyKey}</p>
            <p>ID: {constituencyId}</p>
            <p>Slug: {constituencySlug}</p>
            <p>Show All: {showAll ? 'Yes' : 'No'}</p>
            <p>Encoded Data: {encodedData ? 'Present' : 'None'}</p>
            <p>Current Data: {constituencyData ? constituencyData.area_name : 'None'}</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || (!constituencyData && !showAll)) {
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
            className="bg-sky-600 text-white px-6 py-3 rounded-lg hover:bg-sky-700 transition-colors font-medium"
          >
            {isEnglish ? 'Back to Home' : 'होम पर वापस जाएं'}
          </Link>
        </div>
      </div>
    );
  }

  const { vidhayak_info, dept_info, other_candidates, latest_news } = constituencyData || {};

  // If showing all constituencies, render the all constituencies view
  if (showAll) {
    return (
      <div className="min-h-screen bg-slate-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <Link
                to="/"
                className="flex items-center space-x-2 text-slate-600 hover:text-slate-800 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>{isEnglish ? 'Back to Home' : 'होम पर वापस जाएं'}</span>
              </Link>
              
              <div className="text-center">
                <h1 className="text-xl font-semibold text-slate-800">
                  {isEnglish ? 'All Constituencies' : 'सभी निर्वाचन क्षेत्र'}
                </h1>
                <p className="text-sm text-slate-500">
                  {isEnglish ? `${allConstituencies.length} constituencies in Bihar` : `बिहार के ${allConstituencies.length} निर्वाचन क्षेत्र`}
                </p>
              </div>
              
              <button className="p-2 text-slate-600 hover:text-slate-800 transition-colors">
                <Share2 className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Search and Filter Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="bg-white rounded-lg shadow-md border border-slate-200 p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  {isEnglish ? 'Search Constituencies' : 'निर्वाचन क्षेत्र खोजें'}
                </label>
                <input
                  type="text"
                  placeholder={isEnglish ? 'Search by name, candidate, or party...' : 'नाम, उम्मीदवार, या पार्टी से खोजें...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                />
              </div>
              
              {/* Party Filter */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  {isEnglish ? 'Filter by Party' : 'पार्टी से फ़िल्टर करें'}
                </label>
                <select
                  value={selectedParty}
                  onChange={(e) => setSelectedParty(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                >
                  <option value="all">{isEnglish ? 'All Parties' : 'सभी पार्टियां'}</option>
                  {Array.from(new Set(allConstituencies.map(c => c.vidhayak_info.party_name))).map(party => (
                    <option key={party} value={party}>{party}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Constituencies Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
            {allConstituencies
              .filter(constituency => {
                const matchesSearch = searchQuery === '' || 
                  constituency.area_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  constituency.vidhayak_info.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  constituency.vidhayak_info.party_name.toLowerCase().includes(searchQuery.toLowerCase());
                
                const matchesParty = selectedParty === 'all' || constituency.vidhayak_info.party_name === selectedParty;
                
                return matchesSearch && matchesParty;
              })
              .map((constituency, index) => (
                <Link
                  key={index}
                  to={`/constituency/${constituency.area_name.toLowerCase().replace(/\s+/g, '-')}?id=${index}`}
                  className="bg-white hover:bg-slate-50 rounded-lg p-4 text-left border border-slate-200 transition-all duration-200 hover:shadow-md hover:scale-105"
                >
                  <div className="flex items-center space-x-3">
                    {constituency.vidhayak_info.image_url ? (
                      <img 
                        src={constituency.vidhayak_info.image_url} 
                        alt={constituency.vidhayak_info.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <PlaceholderImages type="profile" size="sm" />
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-800 truncate text-sm">
                        {constituency.area_name}
                      </h3>
                      <p className="text-xs text-slate-600 truncate">
                        {constituency.vidhayak_info.name}
                      </p>
                      <div className={`inline-block px-2 py-1 rounded-full text-xs font-medium text-white mt-1 ${getPartyColor(constituency.vidhayak_info.party_name)}`}>
                        {constituency.vidhayak_info.party_name}
                      </div>
                      <div className="flex items-center space-x-1 mt-1 text-xs text-slate-500">
                        <Award className="h-3 w-3" />
                        <span>{constituency.vidhayak_info.last_election_vote_percentage}% votes</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
          </div>
        </div>
      </div>
    );
  }

  // If no constituency data, show error
  if (!constituencyData) {
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
            className="bg-sky-600 text-white px-6 py-3 rounded-lg hover:bg-sky-700 transition-colors font-medium"
          >
            {isEnglish ? 'Back to Home' : 'होम पर वापस जाएं'}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link
              to="/"
              className="flex items-center space-x-2 text-slate-600 hover:text-slate-800 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>{isEnglish ? 'Back to Home' : 'होम पर वापस जाएं'}</span>
            </Link>
            
            <div className="text-center">
              <h1 className="text-xl font-semibold text-slate-800">
                {constituencyData?.area_name || 'All Constituencies'}
              </h1>
              <p className="text-sm text-slate-500">
                {isEnglish ? 'Constituency Details' : 'निर्वाचन क्षेत्र विवरण'}
              </p>
            </div>
            
            <button className="p-2 text-slate-600 hover:text-slate-800 transition-colors">
              <Share2 className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Debug Info - Remove in production */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-semibold text-yellow-800 mb-2">Debug Info (Remove in Production)</h3>
          <div className="text-xs text-yellow-700 space-y-1">
            <p>Constituency Key: {constituencyKey}</p>
            <p>Area Name: {constituencyData?.area_name}</p>
            <p>Candidate Name: {constituencyData?.vidhayak_info?.name}</p>
            <p>Party: {constituencyData?.vidhayak_info?.party_name}</p>
            <p>ID from URL: {constituencyId}</p>
            <p>Slug from URL: {constituencySlug}</p>
            <p>Has Encoded Data: {encodedData ? 'Yes' : 'No'}</p>
          </div>
        </div>

        {/* Candidate Overview Card */}
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 mb-8 overflow-hidden">
          <div className={`${getPartyColor(vidhayak_info?.party_name || 'नोटा')} h-2`}></div>
          
          <div className="p-6 lg:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Candidate Photo and Basic Info */}
              <div className="lg:col-span-1 text-center lg:text-left">
                {vidhayak_info?.image_url ? (
                  <img 
                    src={vidhayak_info.image_url} 
                    alt={vidhayak_info.name}
                    className="w-32 h-32 lg:w-40 lg:h-40 rounded-full object-cover mx-auto lg:mx-0 mb-4 border-4 border-slate-100"
                  />
                ) : (
                  <PlaceholderImages type="profile" size="xl" className="mx-auto lg:mx-0 mb-4" />
                )}
                
                <h2 className="text-2xl lg:text-3xl font-bold text-slate-800 mb-2">
                  {vidhayak_info?.name || 'Not Specified'}
                </h2>
                
                <div className={`inline-block px-4 py-2 rounded-full text-sm font-medium text-white mb-4 ${getPartyColor(vidhayak_info?.party_name || 'नोटा')}`}>
                  {vidhayak_info?.party_name || 'Not Specified'}
                </div>
                
                <div className="space-y-2 text-sm text-slate-600">
                  <div className="flex items-center justify-center lg:justify-start space-x-2">
                    <MapPin className="h-4 w-4" />
                    <span>{constituencyData?.area_name || 'Not Specified'}</span>
                  </div>
                  <div className="flex items-center justify-center lg:justify-start space-x-2">
                    <User className="h-4 w-4" />
                    <span>{vidhayak_info?.age || 'Not Specified'} years old</span>
                  </div>
                  <div className="flex items-center justify-center lg:justify-start space-x-2">
                    <Award className="h-4 w-4" />
                    <span>{vidhayak_info?.last_election_vote_percentage || 0}% votes</span>
                  </div>
                </div>
              </div>

              {/* Key Metrics */}
              <div className="lg:col-span-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                  <div className="bg-slate-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-sky-600 mb-1">
                      {vidhayak_info?.manifesto_score || 0}%
                    </div>
                    <div className="text-sm text-slate-600">
                      {isEnglish ? 'Manifesto Score' : 'घोषणापत्र स्कोर'}
                    </div>
                  </div>
                  
                  <div className="bg-slate-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-emerald-600 mb-1">
                      {vidhayak_info?.metadata.criminal_cases || 0}
                    </div>
                    <div className="text-sm text-slate-600">
                      {isEnglish ? 'Criminal Cases' : 'आपराधिक मामले'}
                    </div>
                  </div>
                  
                  <div className="bg-slate-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-amber-600 mb-1">
                      {formatCurrency(vidhayak_info?.metadata.net_worth || 0)}
                    </div>
                    <div className="text-sm text-slate-600">
                      {isEnglish ? 'Net Worth' : 'कुल संपत्ति'}
                    </div>
                  </div>
                </div>

                {/* Satisfaction Survey */}
                {vidhayak_info?.survey_score && vidhayak_info.survey_score.length > 0 && (
                  <div className="bg-slate-50 rounded-lg p-4">
                    <h3 className="font-semibold text-slate-800 mb-3">
                      {isEnglish ? 'Public Satisfaction Survey' : 'जनता संतुष्टि सर्वेक्षण'}
                    </h3>
                    <div className="space-y-3">
                      {vidhayak_info.survey_score.map((survey: any, index: number) => (
                        <div key={index}>
                          <p className="text-sm text-slate-700 mb-2">{survey.question}</p>
                          <div className="flex items-center space-x-4 text-sm">
                            <span className="text-emerald-600">
                              {isEnglish ? 'Yes' : 'हाँ'}: {survey.yes_votes}
                            </span>
                            <span className="text-rose-600">
                              {isEnglish ? 'No' : 'नहीं'}: {survey.no_votes}
                            </span>
                            <span className="text-sky-600">
                              {isEnglish ? 'Score' : 'स्कोर'}: {survey.score}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="bg-white rounded-lg shadow-md border border-slate-200 mb-8">
          <div className="border-b border-slate-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'overview', label: isEnglish ? 'Overview' : 'अवलोकन', icon: BarChart3 },
                { id: 'departments', label: isEnglish ? 'Departments' : 'विभाग', icon: Building },
                { id: 'candidates', label: isEnglish ? 'Candidates' : 'उम्मीदवार', icon: Users },
                { id: 'news', label: isEnglish ? 'News' : 'समाचार', icon: FileText }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors ${
                      activeTab === tab.id
                        ? 'border-sky-500 text-sky-600'
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
            {activeTab === 'overview' && (
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
                        <span className="font-medium">{vidhayak_info?.age || 'Not Specified'} years</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">{isEnglish ? 'Education' : 'शिक्षा'}</span>
                        <span className="font-medium">{vidhayak_info?.metadata.education || 'Not specified'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">{isEnglish ? 'Experience' : 'अनुभव'}</span>
                        <span className="font-medium">{vidhayak_info?.experience || 'Not specified'}</span>
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
                        <span className="font-medium">{formatCurrency(vidhayak_info?.metadata.net_worth || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">{isEnglish ? 'Funds Utilisation' : 'धन उपयोग'}</span>
                        <span className="font-medium">{vidhayak_info?.metadata.funds_utilisation || 'Not specified'}</span>
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
                        {vidhayak_info?.last_election_vote_percentage || 0}%
                      </div>
                      <div className="text-sm text-slate-600">
                        {isEnglish ? 'Vote Share' : 'वोट शेयर'}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-emerald-600 mb-1">
                        {vidhayak_info?.metadata.attendance || 'N/A'}
                      </div>
                      <div className="text-sm text-slate-600">
                        {isEnglish ? 'Attendance' : 'उपस्थिति'}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-amber-600 mb-1">
                        {vidhayak_info?.metadata.questions_asked || 'N/A'}
                      </div>
                      <div className="text-sm text-slate-600">
                        {isEnglish ? 'Questions Asked' : 'पूछे गए प्रश्न'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Departments Tab */}
            {activeTab === 'departments' && (
              <div className="space-y-6">
                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-slate-800 mb-2">
                    {isEnglish ? 'Department Performance & Surveys' : 'विभाग प्रदर्शन और सर्वेक्षण'}
                  </h3>
                  <p className="text-slate-600">
                    {isEnglish ? 'Rate the performance of different departments and provide your feedback' : 'विभिन्न विभागों के प्रदर्शन को रेट करें और अपनी प्रतिक्रिया दें'}
                  </p>
                </div>
                
                {dept_info && dept_info.map((dept: any, index: number) => (
                  <div key={index} className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                    {/* Department Header */}
                    <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-slate-800 flex items-center">
                          <Building className="h-5 w-5 mr-2 text-sky-600" />
                          {dept.dept_name}
                        </h3>
                        <div className="flex items-center space-x-2">
                          <Star className="h-4 w-4 text-amber-500" />
                          <span className="text-sm font-medium text-slate-700">
                            {isEnglish ? 'Current Score' : 'वर्तमान स्कोर'}: {dept.average_score || 0}/5
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-6">
                      {/* Work Information */}
                      <div className="mb-6">
                        <h4 className="font-semibold text-slate-700 mb-3 flex items-center">
                          <FileText className="h-4 w-4 mr-2 text-emerald-600" />
                          {isEnglish ? 'Work Information & Achievements' : 'कार्य जानकारी और उपलब्धियां'}
                        </h4>
                        <div className="bg-slate-50 rounded-lg p-4">
                          <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-line">
                            {dept.work_info || 'No information available'}
                          </p>
                        </div>
                      </div>

                      {/* Interactive Survey */}
                      <div className="mb-6">
                        <h4 className="font-semibold text-slate-700 mb-3 flex items-center">
                          <BarChart3 className="h-4 w-4 mr-2 text-amber-600" />
                          {isEnglish ? 'Rate This Department' : 'इस विभाग को रेट करें'}
                        </h4>
                        
                        {dept.survey_score && dept.survey_score.length > 0 ? (
                          <div className="space-y-4">
                            {dept.survey_score.map((survey: any, surveyIndex: number) => (
                              <div key={surveyIndex} className="bg-slate-50 rounded-lg p-4">
                                <p className="text-slate-700 font-medium mb-3">{survey.question}</p>
                                
                                {/* Rating System */}
                                <div className="flex items-center justify-between mb-3">
                                  <span className="text-sm text-slate-600">
                                    {isEnglish ? 'Select your rating:' : 'अपनी रेटिंग चुनें:'}
                                  </span>
                                  <span className="text-sm text-slate-500">
                                    {isEnglish ? 'Current Score' : 'वर्तमान स्कोर'}: {survey.score}
                                  </span>
                                </div>
                                
                                <div className="flex items-center justify-center space-x-2">
                                  {[1, 2, 3, 4, 5].map((rating) => (
                                    <button
                                      key={rating}
                                      onClick={() => {
                                        // Here you would typically send this rating to your backend
                                        console.log(`Rating for ${dept.dept_name}: ${rating}`);
                                        alert(`${isEnglish ? 'Thank you for your rating!' : 'आपकी रेटिंग के लिए धन्यवाद!'} ${rating}/5`);
                                      }}
                                      className="w-12 h-12 rounded-lg border-2 border-slate-300 hover:border-sky-400 hover:bg-sky-50 transition-all duration-200 flex items-center justify-center text-lg font-semibold text-slate-600 hover:text-sky-600"
                                    >
                                      {rating}
                                    </button>
                                  ))}
                                </div>
                                
                                <div className="flex items-center justify-center mt-3 text-xs text-slate-500">
                                  <span className="mr-4">1 = {isEnglish ? 'Poor' : 'खराब'}</span>
                                  <span className="mr-4">3 = {isEnglish ? 'Average' : 'औसत'}</span>
                                  <span>5 = {isEnglish ? 'Excellent' : 'उत्कृष्ट'}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-6 text-slate-500">
                            <BarChart3 className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                            <p>{isEnglish ? 'No survey questions available for this department' : 'इस विभाग के लिए कोई सर्वेक्षण प्रश्न उपलब्ध नहीं'}</p>
                          </div>
                        )}
                      </div>

                      {/* Historical Ratings Display */}
                      {dept.survey_score && dept.survey_score.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-slate-700 mb-3 flex items-center">
                            <TrendingUp className="h-4 w-4 mr-2 text-purple-600" />
                            {isEnglish ? 'Public Ratings Distribution' : 'जनता रेटिंग वितरण'}
                          </h4>
                          <div className="grid grid-cols-5 gap-2">
                            {[1, 2, 3, 4, 5].map((rating) => {
                              const ratingCount = dept.survey_score[0]?.ratings?.[rating.toString()] || 0;
                              const ratings = dept.survey_score[0]?.ratings || {};
                              const totalRatings = Object.values(ratings).reduce((sum: number, value: any) => sum + (typeof value === 'number' ? value : 0), 0);
                              const percentage = totalRatings > 0 ? (ratingCount / totalRatings) * 100 : 0;
                              
                              return (
                                <div key={rating} className="text-center">
                                  <div className="text-lg font-bold text-slate-700">{rating}</div>
                                  <div className="w-full bg-slate-200 rounded-full h-20 mb-2 relative">
                                    <div 
                                      className="bg-sky-500 rounded-t-full absolute bottom-0 w-full transition-all duration-500"
                                      style={{ height: `${percentage}%` }}
                                    ></div>
                                  </div>
                                  <div className="text-xs text-slate-500">{ratingCount}</div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Candidates Tab */}
            {activeTab === 'candidates' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">
                  {isEnglish ? 'All Candidates' : 'सभी उम्मीदवार'}
                </h3>
                {other_candidates && other_candidates.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {other_candidates.map((candidate: any, index: number) => (
                      <div key={index} className="bg-slate-50 rounded-lg p-4">
                        <div className="flex items-center space-x-3">
                          {candidate.candidate_image_url ? (
                            <img 
                              src={candidate.candidate_image_url} 
                              alt={candidate.candidate_name}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          ) : (
                            <PlaceholderImages type="profile" size="sm" />
                          )}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-slate-800 truncate">
                              {candidate.candidate_name}
                            </h4>
                            <p className="text-sm text-slate-600 truncate">
                              {candidate.candidate_party}
                            </p>
                            <div className="flex items-center space-x-1 mt-1">
                              <TrendingUp className="h-3 w-3 text-emerald-500" />
                              <span className="text-xs text-slate-500">
                                {candidate.vote_share}% votes
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    <Users className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                    <p>{isEnglish ? 'No other candidates information available' : 'अन्य उम्मीदवारों की जानकारी उपलब्ध नहीं'}</p>
                  </div>
                )}
              </div>
            )}

            {/* News Tab */}
            {activeTab === 'news' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">
                  {isEnglish ? 'Latest News' : 'ताजा समाचार'}
                </h3>
                {latest_news && latest_news.length > 0 && latest_news[0].title ? (
                  <div className="space-y-4">
                    {latest_news.map((news: any, index: number) => (
                      <div key={index} className="bg-slate-50 rounded-lg p-4">
                        <div className="flex items-start space-x-3">
                          <FileText className="h-5 w-5 text-sky-600 mt-1 flex-shrink-0" />
                          <div>
                            <p className="text-slate-700 font-medium">{news.title}</p>
                            <p className="text-sm text-slate-500 mt-1">
                              {isEnglish ? 'Recent news from this constituency' : 'इस निर्वाचन क्षेत्र से ताजा समाचार'}
                            </p>
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default Constituency;
