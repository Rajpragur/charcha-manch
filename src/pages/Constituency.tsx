import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom';
import { 
  MapPin, 
  GraduationCap,
  IndianRupee,
  Scale,
  Calendar,
  CircleQuestionMark,
  BanknoteArrowUp,
  MessageCircle,
  House
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import AllConstituencies from '../components/AllConstituencies';

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

interface ConstituencyData {
  id: string;
  profileImage: string | undefined;
  age: number;
  constituencyName: { en: string; hi: string };
  candidateName: { en: string; hi: string };
  partyName: { name: string; nameHi: string; color: string };
  experience: { en: string; hi: string };
  education: { en: string; hi: string };
  satisfactionYes: number;
  satisfactionNo: number;
  satisfactionTotal: number;
  news: { title: { en: string; hi: string }; date: string };
  manifestoScore: number;
  interactionCount: number;
  activePostCount: number;
  criminalCases: number;
  netWorth: number;
  attendance: string;
  questionsAsked: string;
  fundsUtilization: string;
  rawData: CandidateData;
}

const Constituency: React.FC = () => {
  const { isEnglish } = useLanguage();
  const { constituencySlug } = useParams<{ constituencySlug: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const constituencyId = searchParams.get('id');
  const showAll = searchParams.get('showAll') === 'true';
  const encodedData = searchParams.get('data');
  
  // Debug: Log the parameters we receive
  console.log('=== COMPONENT PARAMS ===');
  console.log('constituencySlug from useParams:', constituencySlug);
  console.log('constituencyId from searchParams:', constituencyId);
  console.log('showAll from searchParams:', showAll);
  console.log('encodedData from searchParams:', encodedData);
  console.log('========================');
  

  
  const [constituencyData, setConstituencyData] = useState<CandidateData | null>(null);
  const [allConstituencies, setAllConstituencies] = useState<CandidateData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [, setEnglishData] = useState<CandidateData[]>([]);
  const [, setHindiData] = useState<CandidateData[]>([]);
  const [transformedConstituencies, setTransformedConstituencies] = useState<ConstituencyData[]>([]);



  // Clear constituency data when constituency changes
  useEffect(() => {
    setConstituencyData(null);
    setError(null);
    setIsLoading(true);
  }, [constituencyId, constituencySlug]);

    // Load all candidates data first
  useEffect(() => {
    const loadAllCandidates = async () => {
      try {
        // Load both English and Hindi data
        const [englishResponse, hindiResponse] = await Promise.all([
          fetch('/data/candidates_en.json'),
          fetch('/data/candidates.json')
        ]);

        const englishData: CandidateData[] = await englishResponse.json();
        const hindiData: CandidateData[] = await hindiResponse.json();

        setEnglishData(englishData);
        setHindiData(hindiData);
        
        // Use Hindi data for display (for correct image URLs) but maintain English data for search
        setAllConstituencies(hindiData);
        console.log('Loaded English candidates:', englishData.length);
        console.log('Loaded Hindi candidates:', hindiData.length);
        
        // Transform data into ConstituencyData format for AllConstituencies component
        const transformedData: ConstituencyData[] = englishData.map((candidate, index) => {
          const hindiCandidate = hindiData[index];
          const constituencyId = index.toString();
          
          return {
            id: constituencyId,
            profileImage: candidate.vidhayak_info.image_url,
            constituencyName: {
              en: candidate.area_name,
              hi: hindiCandidate?.area_name || candidate.area_name
            },
            candidateName: {
              en: candidate.vidhayak_info.name,
              hi: hindiCandidate?.vidhayak_info.name || candidate.vidhayak_info.name
            },
            partyName: {
              name: candidate.vidhayak_info.party_name,
              nameHi: hindiCandidate?.vidhayak_info.party_name || candidate.vidhayak_info.party_name,
              color: getPartyColor(candidate.vidhayak_info.party_name)
            },
            experience: {
              en: candidate.vidhayak_info.experience,
              hi: hindiCandidate?.vidhayak_info.experience || candidate.vidhayak_info.experience
            },
            education: {
              en: candidate.vidhayak_info.metadata.education,
              hi: hindiCandidate?.vidhayak_info.metadata.education || candidate.vidhayak_info.metadata.education
            },
            satisfactionYes: 0,
            satisfactionNo: 0,
            satisfactionTotal: 0,
            news: {
              title: {
                en: candidate.latest_news?.[0]?.title || 'No news available',
                hi: 'कोई समाचार उपलब्ध नहीं'
              },
              date: 'No date available'
            },
            age: candidate.vidhayak_info.age,
            manifestoScore: candidate.vidhayak_info.manifesto_score || 0,
            interactionCount: 0,
            activePostCount: 0,
            criminalCases: candidate.vidhayak_info.metadata.criminal_cases,
            netWorth: candidate.vidhayak_info.metadata.net_worth,
            attendance: candidate.vidhayak_info.metadata.attendance,
            questionsAsked: candidate.vidhayak_info.metadata.questions_asked,
            fundsUtilization: candidate.vidhayak_info.metadata.funds_utilisation,
            rawData: candidate
          };
        });
        
        setTransformedConstituencies(transformedData);
      } catch (err) {
        console.error('Error loading candidates data:', err);
        setError('Failed to load candidates data');
      }
    };

    loadAllCandidates();
  }, []); // Only run once on component mount

  // Find and load specific constituency data after candidates are loaded
  useEffect(() => {
    if (allConstituencies.length === 0) {
      return; // Wait for candidates to load
    }

    const findConstituency = () => {
      try {
        setIsLoading(true);
        setError(null);
        
        console.log('=== LOADING CONSTITUENCY DATA ===');
        console.log('constituencyId:', constituencyId);
        console.log('constituencySlug:', constituencySlug);
        console.log('showAll:', showAll);
        console.log('encodedData:', encodedData);
        console.log('Total candidates available:', allConstituencies.length);
        console.log('================================');
        
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
        
        // Clear localStorage when loading a new constituency to avoid stale data
        localStorage.removeItem('selectedConstituency');
        
        // Find the specific constituency by ID or slug
        let foundConstituency: CandidateData | null = null;
        
        console.log('Looking for constituency with ID:', constituencyId, 'or slug:', constituencySlug);
        console.log('Total candidates loaded:', allConstituencies.length);
        
        // First priority: Use the ID query parameter if available
        if (constituencyId && allConstituencies.length > 0) {
          const id = parseInt(constituencyId);
          console.log('Parsed ID from query param:', id, 'Total candidates:', allConstituencies.length);
          if (!isNaN(id) && id >= 0 && id < allConstituencies.length) {
            foundConstituency = allConstituencies[id];
            console.log('✅ Found constituency by ID query param:', foundConstituency.area_name);
          } else {
            console.log('❌ Invalid ID or out of range:', id);
          }
        } 
        // Second priority: Extract ID from slug if no query param
        else if (constituencySlug && constituencySlug !== 'all-constituencies' && allConstituencies.length > 0) {
          // Try to find by slug (area name) - new format includes ID
          // Extract ID from slug (last part after the last dash)
          const slugParts = constituencySlug.split('-');
          const possibleId = slugParts[slugParts.length - 1];
          const id = parseInt(possibleId);
          
          console.log('Extracted ID from slug:', possibleId, 'Parsed as:', id);
          
          if (!isNaN(id) && id >= 0 && id < allConstituencies.length) {
            // Use the ID from the slug to find the constituency
            foundConstituency = allConstituencies[id];
            console.log('✅ Found constituency by ID from slug:', foundConstituency.area_name);
          } else {
            console.log('❌ Invalid ID from slug or out of range:', id);
            // Fallback: try to find by area name
            const areaNameFromSlug = slugParts.slice(0, -1).join('-');
            console.log('Fallback: trying to find by area name:', areaNameFromSlug);
            
            foundConstituency = allConstituencies.find(candidate => 
              candidate.area_name.toLowerCase().replace(/\s+/g, '-') === areaNameFromSlug
            ) || null;
            console.log('Fallback result:', foundConstituency ? foundConstituency.area_name : 'Not found');
          }
        }
        
        if (!foundConstituency && !showAll && allConstituencies.length > 0) {
          console.log('❌ No constituency found with current logic');
          console.log('Available constituencies:', allConstituencies.map((c, i) => `${i}: ${c.area_name}`));
        }
        
        if (foundConstituency) {
          console.log('=== CONSTITUENCY DATA LOADED ===');
          console.log('Found constituency:', foundConstituency.area_name);
          console.log('Candidate name:', foundConstituency.vidhayak_info.name);
          console.log('Party:', foundConstituency.vidhayak_info.party_name);
          console.log('Array index:', allConstituencies.indexOf(foundConstituency));
          console.log('URL ID parameter:', constituencyId);
          console.log('URL slug parameter:', constituencySlug);
          console.log('Full constituency data:', foundConstituency);
          console.log('================================');
          
          // Verify this is the correct constituency by checking the ID
          const expectedIndex = parseInt(constituencyId || '0');
          if (allConstituencies.indexOf(foundConstituency) === expectedIndex) {
            console.log('✅ CORRECT CONSTITUENCY LOADED - Index matches URL ID');
          } else {
            console.log('❌ WRONG CONSTITUENCY LOADED - Index mismatch!');
            console.log('Expected index:', expectedIndex, 'but got:', allConstituencies.indexOf(foundConstituency));
          }
          
          setConstituencyData(foundConstituency);
          // Store in localStorage for future reference
          localStorage.setItem('selectedConstituency', JSON.stringify(foundConstituency));
        } else if (!showAll) {
          console.log('No constituency found, setting error');
          setError('Constituency not found');
        }
        
        setIsLoading(false);
      } catch (err) {
        console.error('Error finding constituency:', err);
        setError('Failed to find constituency');
        setIsLoading(false);
      }
    };

    findConstituency();
  }, [constituencyId, constituencySlug, showAll, encodedData, allConstituencies]); // Now allConstituencies is available

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
      'कम्युनिस्ट पार्टी ऑफ इंडिया (मार्क्सवादी-लेनिनवादी) (मुक्ति)': 'bg-red-600',
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
      'NOTA': 'bg-gray-600'
    };
    return partyColors[partyName] || 'bg-slate-600';
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
      'भारतीय जनता पार्टी': '/images/party_logo/bjp.png',
      'जनता दल (यूनाइटेड)': '/images/party_logo/jdu.png',
      'राष्ट्रिया जनता दल': '/images/party_logo/rjd.png',
      'भारतीय राष्ट्रीय कांग्रेस': '/images/party_logo/inc.png',
      'कम्युनिस्ट पार्टी ऑफ इंडिया': '/images/party_logo/cpi.png',
      'हिंदुस्तानी अवाम मोर्चा': '/images/party_logo/HAM.png',
      'कम्युनिस्ट पार्टी ऑफ इंडिया (मार्क्सवादी)': '/images/party_logo/cpim.png',
      'कम्युनिस्ट पार्टी ऑफ इंडिया (मार्क्सवादी-लेनिनवादी) (मुक्ति)': '/images/party_logo/cpiml.png',
      'हिंदुस्तानी अवाम मोर्चा (धर्मनिरपेक्ष)': '/images/party_logo/HAM.png',
      'अखिल भारतीय मजलिस-ए-इटिहादुल मुस्लिमीन': '/images/party_logo/aimim.png',
      'नोटा': '/images/party_logo/nota.png',
    };
    return partyIcons[partyName] || '/images/party_logo/independent.png';
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


  console.log(constituencyData);
  // If showing all constituencies, render the all constituencies view
  if (showAll) {
    return (
      <AllConstituencies 
        constituencies={transformedConstituencies}
        isLoading={isLoading}
      />
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
    <div className="min-h-screen bg-[#9ca8b4]">
      <div className="px-4 py-3">
        {/* Constituency Information Card */}
        <div className="bg-white rounded-lg p-1 mb-4 shadow-sm text-center">
          <h1 className="lg:text-2xl text-xl font-bold text-black mb-1">
            {constituencyData ? constituencyData.area_name + ' ' + (isEnglish ? 'Vidhan Sabha Constituency' : 'विधानसभा क्षेत्र') : (isEnglish ? 'Constituency Details' : 'निर्वाचन क्षेत्र विवरण')}
          </h1>
          <p className="text-gray-600 text-sm">
            {isEnglish ? 'Information about this constituency' : 'इस निर्वाचन क्षेत्र की जानकारी'}
          </p>
        </div>

        {/* MLA Profile Card */}
        {constituencyData && (
          <div className="bg-white rounded-lg p-3 lg:p-5 mb-2 shadow-sm">
            <div className="flex items-start space-x-4">
              <div className="relative">
                <img 
                  src={constituencyData.vidhayak_info.image_url} 
                  alt={constituencyData.vidhayak_info.name}
                  className="w-15 h-15 lg:w-25 lg:h-25 rounded-full object-cover border-2 border-gray-200"
                  onError={(e) => {
                    e.currentTarget.src = '/images/logo.png';
                  }}
                />
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <h2 className="text-xl font-bold text-black">{constituencyData.vidhayak_info.name}</h2>
                  <span className="bg-gray-200 text-black text-xs px-3 py-1 rounded-full">
                    {isEnglish ? 'MLA' : 'विधायक'}
                  </span>
                </div>
                <p className="text-gray-600 text-sm mb-3">
                  {isEnglish ? `Age: ${constituencyData.vidhayak_info.age} years` : `उम्र: ${constituencyData.vidhayak_info.age} वर्ष`}
                </p>
                <div className="flex items-center space-x-3 mb-3">
                  <span className={`px-2 py-1 rounded-full text-white text-xs font-medium ${getPartyColor(constituencyData.vidhayak_info.party_name)}`}>
                    {constituencyData.vidhayak_info.party_name}
                  </span>
                  <div className="w-10 h-10 lg:w-10 lg:h-10 ml-10 lg:ml-320 rounded-full flex items-center justify-center border border-gray-200">
                    <img 
                      className="w-10 h-10 lg:w-10 lg:h-10 font-thin object-contain" 
                      src={fetchPartyIcon(constituencyData.vidhayak_info.party_name)} 
                      alt={`${constituencyData.vidhayak_info.party_name} logo`}
                      onError={(e) => {
                        e.currentTarget.src = '/images/party_logo/independent.png';
                      }}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between space-x-2">
                  <span className="bg-[#e2ebf3] justify-left text-black text-xs px-2 py-[0.5px] rounded-full">
                    {isEnglish ? `Last election: ${constituencyData.vidhayak_info.last_election_vote_percentage}% votes` : `अंतिम चुनाव: ${constituencyData.vidhayak_info.last_election_vote_percentage}% वोट`}
                  </span>
                  <div className="text-center">
                    <div className="text-sm font-bold text-black">{constituencyData.vidhayak_info.experience}</div>
                    <div className="text-xs text-gray-600">{isEnglish ? 'Post experience' : 'पद अनुभव'}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Key Metrics Grid */}
        {constituencyData && (
          <div className="grid grid-cols-2 gap-3 mb-4">
            {/* Education */}
            <div className="bg-white rounded-lg p-2 lg:p-3 shadow-sm flex items-center">
              <div className="w-8 h-8 lg:w-10 lg:h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                <GraduationCap className="w-4 h-4 lg:w-6 lg:h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-xs lg:text-sm text-black mb-0.5">{isEnglish ? 'Education level' : 'शिक्षा स्तर'}</p>
                <p className="text-blue-600 font-semibold text-xs lg:text-sm">
                  {constituencyData.vidhayak_info.metadata.education}
                </p>
              </div>
            </div>

            {/* Net Worth */}
            <div className="bg-white rounded-lg p-2 lg:p-3 shadow-sm flex items-center">
              <div className="w-8 h-8 lg:w-10 lg:h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                <IndianRupee className="w-4 h-4 lg:w-6 lg:h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-xs lg:text-sm text-black mb-0.5">{isEnglish ? 'Net Worth' : 'कुल संपत्ति'}</p>
                <p className="text-blue-600 font-semibold text-xs lg:text-sm">
                  {formatCurrency(constituencyData.vidhayak_info.metadata.net_worth)}
                </p>
              </div>
            </div>

            {/* Criminal Cases */}
            <div className="bg-white rounded-lg p-2 lg:p-3 shadow-sm flex items-center">
              <div className="w-8 h-8 lg:w-10 lg:h-10 bg-red-100 rounded-full flex items-center justify-center mr-3">
                <Scale className="w-5 h-5 lg:w-6 lg:h-6 text-red-600" />
              </div>
              <div>
                <p className="text-xs lg:text-sm text-black mb-0.5">{isEnglish ? 'Criminal cases' : 'आपराधिक मामले'}</p>
                <p className="text-blue-600 font-semibold text-xs lg:text-sm">
                  {constituencyData.vidhayak_info.metadata.criminal_cases}
                </p>
              </div>
            </div>

            {/* Assembly Attendance */}
            <div className="bg-white rounded-lg p-2 lg:p-3 shadow-sm flex items-center">
              <div className="w-8 h-8 lg:w-10 lg:h-10 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                <Calendar className="w-5 h-5 lg:w-6 lg:h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-xs lg:text-sm text-black mb-0.5">{isEnglish ? 'Assembly attendance' : 'विधानसभा उपस्थिति'}</p>
                <p className="text-blue-600 font-semibold text-xs lg:text-sm">
                  {constituencyData.vidhayak_info.metadata.attendance || '0%'}
                </p>
              </div>
            </div>

            {/* Questions Asked */}
            <div className="bg-white rounded-lg p-2 lg:p-3 shadow-sm flex items-center">
              <div className="w-8 h-8 lg:w-10 lg:h-10 bg-orange-100 rounded-full flex items-center justify-center mr-3">
                <CircleQuestionMark className="w-5 h-5 lg:w-6 lg:h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-xs lg:text-sm text-black mb-0.5">{isEnglish ? 'Questions asked' : 'सवाल पूछे'}</p>
                <p className="text-blue-600 font-semibold text-xs lg:text-sm">
                  {constituencyData.vidhayak_info.metadata.questions_asked || '0'}
                </p>
              </div>
            </div>

            {/* Fund Utilization */}
            <div className="bg-white rounded-lg p-2 lg:p-3 shadow-sm flex items-center">
              <div className="w-8 h-8 lg:w-10 lg:h-10 bg-teal-100 rounded-full flex items-center justify-center mr-3">
                <BanknoteArrowUp className="text-teal-600 text-base lg:text-xl" />
              </div>
              <div>
                <p className="text-xs lg:text-sm text-black mb-0.5">{isEnglish ? 'Fund utilization' : 'निधि उपयोग'}</p>
                <p className="text-blue-600 font-semibold text-xs lg:text-sm">
                  {constituencyData.vidhayak_info.metadata.funds_utilisation || '0%'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Manifesto Link */}
        {constituencyData && constituencyData.vidhayak_info.manifesto_link && (
          <div className="bg-white rounded-lg p-4 mb-2 shadow-sm text-center">
            <a 
              href={constituencyData.vidhayak_info.manifesto_link} 
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

        {/* Other Candidates Section */}
        {constituencyData && constituencyData.other_candidates && constituencyData.other_candidates.length > 0 && (
          <div className="bg-white rounded-lg p-4 mb-2 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-black">
                {isEnglish ? 'Other Major Candidates' : 'अन्य प्रमुख उम्मीदवार'}
              </h3>
              <span className="text-sm text-gray-500">
                {isEnglish ? '(Previous Election)' : '(पिछला चुनाव)'}
              </span>
            </div>
            {/* Navigation Arrows and Candidates Container */}
            <div className="relative">
              {/* Candidates Row - Show All */}
              <div className="flex space-x-4 overflow-x-auto px-4 md:px-8 pb-2">
                {constituencyData.other_candidates.map((candidate, index) => (
                  <div key={index} className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm min-w-[220px] flex-shrink-0">
                    <div className="flex items-start space-x-3">
                      <div className="relative">
                                                 <img 
                           src={(candidate.candidate_party && candidate.candidate_party.toUpperCase() == 'NOTA') || candidate.candidate_party == 'नोटा' ? '/images/party_logo/nota.png' : (candidate.candidate_image_url || '/images/party_logo/independent.png')} 
                           alt={candidate.candidate_name}
                           className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                           onError={(e) => {
                             e.currentTarget.src = '/images/party_logo/nota.png';
                           }}
                         />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-black text-base mb-2">
                          {candidate.candidate_name}
                        </h4>
                        <div className="flex items-center space-x-2 mb-2">
                          <span className={`px-3 py-1 rounded-full text-white text-xs font-medium ${getPartyColor(candidate.candidate_party || 'Independent')}`}>
                            {candidate.candidate_party || 'Independent'}
                          </span>
                          <div className="w-8 h-8 rounded-full flex items-center justify-center border border-gray-200">
                            <img 
                              className="w-6 h-6 object-contain" 
                              src={fetchPartyIcon(candidate.candidate_party || 'Independent')} 
                              alt={`${candidate.candidate_party || 'Independent'} logo`}
                              onError={(e) => {
                                e.currentTarget.src = '/images/party_logo/independent.png';
                              }}
                            />
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="bg-gray-100 text-black text-xs px-2 py-1 rounded-full">
                            {isEnglish ? `Vote Share: ${candidate.vote_share}%` : `वोट शेयर: ${candidate.vote_share}%`}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Charcha Manch Button */}
        {constituencyData && (
          <div className="text-center mt-4 sm:mt-6 mb-3 sm:mb-4">
            <button 
              className="px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-medium transition-all duration-200 shadow-lg text-base sm:text-lg flex items-center justify-center space-x-2 sm:space-x-3 mx-auto bg-gray-700 text-white hover:bg-[#014e5c]/80 hover:shadow-xl transform hover:-translate-y-1"
              onClick={() => navigate(`/discussion?constituency=${constituencyData.area_name}&name=${encodeURIComponent(constituencyData.area_name)}`)}
            >
              <MessageCircle className="w-4 h-4 lg:w-6 lg:h-6" />
              <span className="text-sm lg:text-base">                  
                {isEnglish ? 'Go to this area\'s Charcha Manch' : 'इस क्षेत्र के चर्चा मंच पर जाएं'}
              </span>
            </button>
          </div>
        )}
      </div>
      
      {/* Bottom Navigation - Mobile */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-20 shadow-lg">
        <div className="flex items-center justify-around py-2 sm:py-3 px-2">
          <button
            onClick={() => navigate('/')}
            className="flex flex-col items-center space-y-1 p-2 rounded-lg transition-colors text-gray-400"
          >
            <House className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-xs font-medium">{isEnglish ? 'Home' : 'होम'}</span>
          </button>
          <button
            onClick={() => navigate('/discussion')}
            className="flex flex-col items-center space-y-1 p-2 rounded-lg transition-colors text-gray-400"
          >
            <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-xs font-medium">{isEnglish ? 'Discussion Forum' : 'चर्चा मंच'}</span>
          </button>
          <button
            onClick={() => navigate('/aapka-kshetra')}
            className="flex flex-col items-center space-y-1 p-2 rounded-lg transition-colors text-gray-400"
          >
            <MapPin className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-xs font-medium">{isEnglish ? 'Your Area' : 'आपका क्षेत्र'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Constituency;
