import React, { useState, useEffect, useMemo } from 'react';
import { Search, Users, MessageCircle, Award, Share2, ChevronDown, MapPin, Copy, CheckCircle } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface PartyData {
  name: string;
  nameHi: string;
  color: string;
}

interface BilingualText {
  en: string;
  hi: string;
}

interface NewsData {
  title: BilingualText;
  date: string;
}

interface ConstituencyData {
  id: string;
  profileImage: string;
  constituencyName: BilingualText;
  candidateName: BilingualText;
  partyName: PartyData;
  experience: BilingualText;
  education: BilingualText;
  satisfactionYes: number;
  satisfactionNo: number;
  news: NewsData;
  manifestoScore: number;
  activePostCount: number;
  interactionCount: number;
}

interface HomeProps {
  // Remove isEnglish prop since we'll use context
}

const generateConstituencyData = (): ConstituencyData[] => {
  const constituencies = [];
  const parties = [
    { name: 'BJP', nameHi: 'भाजपा', color: 'bg-orange-500' },
    { name: 'JDU', nameHi: 'जदयू', color: 'bg-green-500' },
    { name: 'RJD', nameHi: 'राजद', color: 'bg-red-500' },
    { name: 'Congress', nameHi: 'कांग्रेस', color: 'bg-blue-500' },
    { name: 'CPI', nameHi: 'सीपीआई', color: 'bg-yellow-500' }
  ];
  for (let i = 1; i <= 243; i++) {
    const party = parties[Math.floor(Math.random() * parties.length)];
    constituencies.push({
      id: i.toString(),
      profileImage: ``,
      constituencyName: {
        en: `Constituency ${i}`,
        hi: `विधानसभा क्षेत्र ${i}`
      },
      candidateName: {
        en: `Candidate ${i}`,
        hi: `उम्मीदवार ${i}`
      },
      partyName: party,
      experience: {
        en: `${Math.floor(Math.random() * 10) + 1} years`,
        hi: `${Math.floor(Math.random() * 10) + 1} वर्ष`
      },
      education: {
        en: 'M.A. Political Science',
        hi: 'एम.ए. राजनीति विज्ञान'
      },
      satisfactionYes: Math.floor(Math.random() * 40) + 50,
      satisfactionNo: 0,
      news: {
        title: {
          en: `Development project announced for Constituency ${i}`,
          hi: `विधानसभा क्षेत्र ${i} के लिए विकास परियोजना की घोषणा`
        },
        date: '2025-08-15'
      },
      manifestoScore: Math.floor(Math.random() * 30) + 70,
      activePostCount: Math.floor(Math.random() * 50) + 10,
      interactionCount: Math.floor(Math.random() * 1000) + 100 // For sorting
    });
  }
  return constituencies;
};

const Home: React.FC<HomeProps> = () => {
  const { isEnglish } = useLanguage();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [visibleConstituencies, setVisibleConstituencies] = useState<number>(2);
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [selectedConstituency, setSelectedConstituency] = useState<ConstituencyData | null>(null);
  const [shareStatus, setShareStatus] = useState<string>('');

  const allConstituencies = useMemo(() => generateConstituencyData(), []);

  const content = {
    title: isEnglish ? 'Citizen Forum' : 'नागरिक मंच',
    subtitle: isEnglish 
      ? 'Your Voice, Your Right - Digital Platform for Democratic Participation'
      : 'आपकी आवाज़, आपका अधिकार - लोकतंत्र में भागीदारी के लिए डिजिटल प्लेटफॉर्म',
    searchPlaceholder: isEnglish ? 'Search your constituency...' : 'अपना निर्वाचन क्षेत्र खोजें...',
    nagrikYogdan: isEnglish ? 'Citizen Contribution' : 'नागरिक योगदान',
    achievements: isEnglish ? 'Achievements' : 'उपलब्धियां',
    charchitVidhanSabha: isEnglish ? 'Featured Constituencies' : 'चर्चित विधान सभा',
    loadMore: isEnglish ? 'Load More' : 'और देखें',
    moreDetails: isEnglish ? 'More Details' : 'और जानकारी',
    share: isEnglish ? 'Share' : 'शेयर',
    satisfactionQuestion: isEnglish 
      ? 'Satisfied with last 5 years tenure?' 
      : 'पिछले 5 वर्षों के कार्यकाल से संतुष्ट हैं?',
    manifestoScore: isEnglish ? 'Manifesto Score' : 'घोषणापत्र स्कोर',
    activePosts: isEnglish ? 'Active Posts' : 'सक्रिय पोस्ट',
    experience: isEnglish ? 'Experience' : 'अनुभव',
    education: isEnglish ? 'Education' : 'शिक्षा'
  };

  // Tier data
  const tiers = [
    { 
      name: isEnglish ? 'Tier 1' : 'स्तर 1', 
      activeUsers: 1250, 
      percentage: 45 
    },
    { 
      name: isEnglish ? 'Tier 2' : 'स्तर 2', 
      activeUsers: 890, 
      percentage: 32 
    },
    { 
      name: isEnglish ? 'Tier 3' : 'स्तर 3', 
      activeUsers: 640, 
      percentage: 23 
    },
  ];

  // Achievement data
  const achievements = [
    { 
      title: isEnglish ? 'First Vote' : 'पहला वोट', 
      count: 2024, 
      icon: <Award className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-500" /> 
    },
    { 
      title: isEnglish ? 'Discussion Participation' : 'चर्चाओं में भागीदारी', 
      count: 156, 
      icon: <MessageCircle className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500" /> 
    },
    { 
      title: isEnglish ? 'New Discussion Initiative' : 'नई चर्चा की पहल', 
      count: 23, 
      icon: <Users className="h-6 w-6 sm:h-8 sm:w-8 text-green-500" /> 
    },
    { 
      title: isEnglish ? 'Citizen Motivator' : 'नागरिक प्रेरक', 
      count: 12, 
      icon: <Users className="h-6 w-6 sm:h-8 sm:w-8 text-purple-500" /> 
    },
  ];

  // Filter and sort constituencies
  const filteredAndSortedConstituencies = useMemo(() => {
    let filtered = allConstituencies;
    
    if (searchQuery.trim()) {
      filtered = allConstituencies.filter(constituency =>
        constituency.constituencyName.en.toLowerCase().includes(searchQuery.toLowerCase()) ||
        constituency.constituencyName.hi.includes(searchQuery) ||
        constituency.candidateName.en.toLowerCase().includes(searchQuery.toLowerCase()) ||
        constituency.candidateName.hi.includes(searchQuery)
      );
    }

    // Sort by interaction count (descending), then alphabetically
    return filtered.sort((a, b) => {
      if (b.interactionCount !== a.interactionCount) {
        return b.interactionCount - a.interactionCount;
      }
      const nameA = isEnglish ? a.constituencyName.en : a.constituencyName.hi;
      const nameB = isEnglish ? b.constituencyName.en : b.constituencyName.hi;
      return nameA.localeCompare(nameB);
    });
  }, [allConstituencies, searchQuery, isEnglish]);

  // Handle constituency selection from dropdown
  const handleConstituencySelect = (constituency: ConstituencyData): void => {
    setSelectedConstituency(constituency);
    setSearchQuery(isEnglish ? constituency.constituencyName.en : constituency.constituencyName.hi);
    setIsDropdownOpen(false);
  };

  // Share functionality
  const handleShare = async (constituency: ConstituencyData): Promise<void> => {
    const url = `${window.location.origin}/aapka-shetra?constituency=${constituency.id}`;
    
    try {
      await navigator.clipboard.writeText(url);
      setShareStatus('copied');
      setTimeout(() => setShareStatus(''), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
      setShareStatus('error');
      setTimeout(() => setShareStatus(''), 2000);
    }
  };

  const loadMore = () => {
    setVisibleConstituencies(prev => Math.min(prev + 2, filteredAndSortedConstituencies.length));
  };

  // Update satisfaction No percentage
  const constituenciesToShow = filteredAndSortedConstituencies.slice(0, visibleConstituencies).map(c => ({
    ...c,
    satisfactionNo: 100 - c.satisfactionYes
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-slate-700 to-slate-800 text-white py-12 sm:py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold mb-4 sm:mb-6">
              {content.title}
            </h1>
            <p className="text-base sm:text-xl md:text-2xl mb-6 sm:mb-8 max-w-3xl mx-auto px-4">
              {content.subtitle}
            </p>
            
            {/* Search Dropdown */}
            <div className="relative max-w-sm sm:max-w-md mx-auto">
              <div className="flex">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder={content.searchPlaceholder}
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setIsDropdownOpen(true);
                    }}
                    onFocus={() => setIsDropdownOpen(true)}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-l-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-300 text-sm sm:text-base"
                  />
                  <MapPin className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
                <button 
                  className="bg-blue-500 hover:bg-blue-600 px-4 sm:px-6 py-2 sm:py-3 rounded-r-lg transition-colors"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                >
                  <Search className="h-4 w-4 sm:h-5 sm:w-5" />
                </button>
              </div>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-60 overflow-y-auto z-50">
                  {filteredAndSortedConstituencies.slice(0, 10).map((constituency) => (
                    <button
                      key={constituency.id}
                      onClick={() => handleConstituencySelect(constituency)}
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 text-sm text-gray-900"
                    >
                      <div className="font-medium">
                        {isEnglish ? constituency.constituencyName.en : constituency.constituencyName.hi}
                      </div>
                      <div className="text-xs text-gray-500">
                        {isEnglish ? constituency.candidateName.en : constituency.candidateName.hi} - {isEnglish ? constituency.partyName.name : constituency.partyName.nameHi}
                      </div>
                    </button>
                  ))}
                  {filteredAndSortedConstituencies.length === 0 && (
                    <div className="px-4 py-2 text-sm text-gray-500">
                      {isEnglish ? 'No constituencies found' : 'कोई निर्वाचन क्षेत्र नहीं मिला'}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Nagrik Yogdan Section */}
        <section className="mb-12 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-6 sm:mb-8 text-gray-800">
            {content.nagrikYogdan}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {tiers.map((tier, index) => (
              <div key={index} className="bg-white rounded-lg shadow-md p-4 sm:p-6 hover:shadow-lg transition-shadow">
                <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-center text-gray-800">
                  {tier.name}
                </h3>
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-blue-600 mb-2">
                    {tier.activeUsers}
                  </div>
                  <div className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">
                    {isEnglish ? 'Active Users' : 'सक्रिय उपयोगकर्ता'}
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 sm:h-3">
                    <div 
                      className="bg-blue-500 h-2 sm:h-3 rounded-full transition-all duration-500"
                      style={{ width: `${tier.percentage}%` }}
                    ></div>
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600 mt-2">
                    {tier.percentage}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Achievement Section */}
        <section className="mb-12 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-6 sm:mb-8 text-gray-800">
            {content.achievements}
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            {achievements.map((achievement, index) => (
              <div key={index} className="bg-white rounded-lg shadow-md p-3 sm:p-6 text-center hover:shadow-lg transition-shadow">
                <div className="flex justify-center mb-2 sm:mb-4">
                  {achievement.icon}
                </div>
                <h3 className="text-xs sm:text-lg font-semibold mb-1 sm:mb-2 text-gray-800 leading-tight">
                  {achievement.title}
                </h3>
                <div className="text-lg sm:text-2xl font-bold text-blue-600">
                  {achievement.count}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Charchit Vidhan Sabha Section */}
        <section className="mb-12 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-6 sm:mb-8 text-gray-800">
            {content.charchitVidhanSabha}
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {constituenciesToShow.map((constituency) => (
              <div key={constituency.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                {/* Header with Party Color */}
                <div className={`${constituency.partyName.color} h-2`}></div>
                
                <div className="p-4 sm:p-6">
                  <div className="flex items-start space-x-3 sm:space-x-4 mb-4">
                    <img 
                      src={constituency.profileImage} 
                      alt={isEnglish ? constituency.candidateName.en : constituency.candidateName.hi}
                      className="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover flex-shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-800 truncate">
                        {isEnglish ? constituency.constituencyName.en : constituency.constituencyName.hi}
                      </h3>
                      <p className="text-sm sm:text-base text-gray-600 truncate">
                        {isEnglish ? constituency.candidateName.en : constituency.candidateName.hi}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-500">
                        {isEnglish ? constituency.partyName.name : constituency.partyName.nameHi}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 mb-4 text-xs sm:text-sm">
                    <div>
                      <span className="font-medium">{content.experience}:</span> {isEnglish ? constituency.experience.en : constituency.experience.hi}
                    </div>
                    <div>
                      <span className="font-medium">{content.education}:</span> {isEnglish ? constituency.education.en : constituency.education.hi}
                    </div>
                  </div>

                  {/* Satisfaction Survey */}
                  <div className="mb-4">
                    <p className="font-medium mb-2 text-xs sm:text-sm">
                      {content.satisfactionQuestion}
                    </p>
                    <div className="flex space-x-4 text-xs sm:text-sm mb-2">
                      <span>Yes: {constituency.satisfactionYes}%</span>
                      <span>No: {constituency.satisfactionNo}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-l-full transition-all duration-500"
                        style={{ width: `${constituency.satisfactionYes}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* News */}
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs sm:text-sm font-medium line-clamp-2">
                      {isEnglish ? constituency.news.title.en : constituency.news.title.hi}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {constituency.news.date}
                    </p>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4 text-center">
                    <div>
                      <div className="text-base sm:text-lg font-bold text-blue-600">
                        {constituency.manifestoScore}%
                      </div>
                      <div className="text-xs text-gray-500">
                        {content.manifestoScore}
                      </div>
                    </div>
                    <div>
                      <div className="text-base sm:text-lg font-bold text-green-600">
                        {constituency.activePostCount}
                      </div>
                      <div className="text-xs text-gray-500">
                        {content.activePosts}
                      </div>
                    </div>
                    <div>
                      <button 
                        onClick={() => handleShare(constituency)}
                        className="text-blue-600 hover:text-blue-700 transition-colors"
                      >
                        {shareStatus === 'copied' ? (
                          <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 mx-auto text-green-600" />
                        ) : (
                          <Share2 className="h-4 w-4 sm:h-5 sm:w-5 mx-auto" />
                        )}
                        <div className="text-xs mt-1">
                          {shareStatus === 'copied' ? (isEnglish ? 'Copied!' : 'कॉपी हो गया!') : content.share}
                        </div>
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={() => window.location.href = `/aapka-shetra?constituency=${constituency.id}`}
                    className="block w-full bg-blue-600 text-white text-center py-2 sm:py-3 rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base font-medium"
                  >
                    {content.moreDetails}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {visibleConstituencies < filteredAndSortedConstituencies.length && (
            <div className="text-center mt-6 sm:mt-8">
              <button
                onClick={loadMore}
                className="bg-blue-600 text-white px-6 sm:px-8 py-2 sm:py-3 rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base font-medium"
              >
                {content.loadMore}
              </button>
            </div>
          )}

          {filteredAndSortedConstituencies.length === 0 && searchQuery && (
            <div className="text-center py-12">
              <p className="text-gray-500">
                {isEnglish ? 'No constituencies found matching your search.' : 'आपकी खोज से मेल खाने वाला कोई निर्वाचन क्षेत्र नहीं मिला।'}
              </p>
            </div>
          )}
        </section>
      </div>

      {/* Click outside to close dropdown */}
      {isDropdownOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsDropdownOpen(false)}
        />
      )}
    </div>
  );
};

export default Home;