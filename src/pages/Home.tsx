import React, { useState, useMemo } from 'react';
import { Search, Users, MessageCircle, Award, Share2, MapPin, CheckCircle, MapPin as MapPinIcon, ThumbsUp, MessageSquare, FileText, Clock, Target, Zap } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import PlaceholderImages from '../components/PlaceholderImages';

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
    { name: 'BJP', nameHi: 'भाजपा', color: 'bg-amber-600' },
    { name: 'JDU', nameHi: 'जदयू', color: 'bg-emerald-600' },
    { name: 'RJD', nameHi: 'राजद', color: 'bg-rose-600' },
    { name: 'Congress', nameHi: 'कांग्रेस', color: 'bg-sky-600' },
    { name: 'CPI', nameHi: 'सीपीआई', color: 'bg-amber-500' }
  ];
  
  const biharConstituencies = [
    'Patna Sahib', 'Patna Central', 'Banka', 'Bhagalpur', 'Gaya', 'Nalanda', 'Vaishali', 'Muzaffarpur',
    'Darbhanga', 'Madhubani', 'Sitamarhi', 'Sheohar', 'East Champaran', 'West Champaran', 'Siwan', 'Gopalganj'
  ];
  const biharConstituenciesHindi = [
    'पटना साहिब',
    'पटना सेंट्रल',
    'बांका',
    'भागलपुर',
    'गया',
    'नालंदा',
    'वैशाली',
    'मुजफ्फरपुर',
    'दरभंगा',
    'मधुबनी',
    'सीतामढ़ी',
    'शिवहर',
    'पूर्वी चंपारण',
    'पश्चिमी चंपारण',
    'सिवान',
    'गोपालगंज'
  ];
  
  
  for (let i = 1; i <= 243; i++) {
    const party = parties[Math.floor(Math.random() * parties.length)];
    const constituencyIndex = (i - 1) % biharConstituencies.length;
    
    constituencies.push({
      id: i.toString(),
      profileImage: ``,
      constituencyName: {
        en: biharConstituencies[constituencyIndex] || `Constituency ${i}`,
        hi: biharConstituenciesHindi[constituencyIndex] ? `${biharConstituenciesHindi[constituencyIndex]} क्षेत्र` : `विधानसभा क्षेत्र ${i}`
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
          en: `Development project announced for ${biharConstituencies[constituencyIndex] || `Constituency ${i}`}`,
          hi: `${biharConstituenciesHindi[constituencyIndex] || `विधानसभा क्षेत्र ${i}`} के लिए विकास परियोजना की घोषणा`
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
  const [,setSelectedConstituency] = useState<ConstituencyData | null>(null);
  const [shareStatus, setShareStatus] = useState<string>('');

  const allConstituencies = useMemo(() => generateConstituencyData(), []);

  const content = {
    title: isEnglish ? 'Bihar Citizen Forum' : 'बिहार नागरिक मंच',
    subtitle: isEnglish ? 'जनता का चुनाव साथी' : 'जनता का चुनाव साथी',
    
    workDiscussion: isEnglish ? 'किसने किया है कितना काम आओ करे चर्चा' : 'किसने किया है कितना काम आओ करे चर्चा',
    searchPlaceholder: isEnglish ? 'Search your constituency in Bihar...' : 'बिहार में अपना निर्वाचन क्षेत्र खोजें...',
    nagrikYogdan: isEnglish ? 'Citizen Contribution' : 'नागरिक योगदान',
    achievements: isEnglish ? 'Our Achievements' : 'हमारी उपलब्धियां',
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
      name: isEnglish ? 'Active Citizens' : 'सक्रिय नागरिक', 
      activeUsers: 1250, 
      percentage: 45 
    },
    { 
      name: isEnglish ? 'Regular Participants' : 'नियमित भागीदार', 
      activeUsers: 890, 
      percentage: 32 
    },
    { 
      name: isEnglish ? 'New Members' : 'नए सदस्य', 
      activeUsers: 640, 
      percentage: 23 
    },
  ];

  // Achievement data
  const achievements = [
    { 
      title: isEnglish ? 'Bihar Voters' : 'बिहार मतदाता', 
      count: 526389, 
      icon: <Award className="h-6 w-6 sm:h-8 sm:w-8 text-amber-600" /> 
    },
    { 
      title: isEnglish ? 'Active Discussions' : 'सक्रिय चर्चाएं', 
      count: 1569, 
      icon: <MessageCircle className="h-6 w-6 sm:h-8 sm:w-8 text-sky-600" /> 
    },
    { 
      title: isEnglish ? 'Constituency Forums' : 'निर्वाचन क्षेत्र मंच', 
      count: 243, 
      icon: <Users className="h-6 w-6 sm:h-8 sm:w-8 text-emerald-600" /> 
    },
    { 
      title: isEnglish ? 'Citizen Leaders' : 'नागरिक नेता', 
      count: 26, 
      icon: <Users className="h-6 w-6 sm:h-8 sm:w-8 text-rose-600" /> 
    },
  ];

  // Quick Stats
  const quickStats = [
    { label: isEnglish ? 'Total Constituencies' : 'कुल निर्वाचन क्षेत्र', value: '243', icon: <MapPin className="h-5 w-5" />, color: 'text-sky-600' },
    { label: isEnglish ? 'Active Users' : 'सक्रिय उपयोगकर्ता', value: '2,780', icon: <Users className="h-5 w-5" />, color: 'text-emerald-600' },
    { label: isEnglish ? 'Discussions' : 'चर्चाएं', value: '1,245', icon: <MessageSquare className="h-5 w-5" />, color: 'text-amber-600' },
    { label: isEnglish ? 'Votes Cast' : 'डाले गए वोट', value: '15,890', icon: <Target className="h-5 w-5" />, color: 'text-rose-600' },
  ];

  // Recent Activities
  const recentActivities = [
    { 
      type: 'discussion', 
      text: isEnglish ? 'New discussion started in Patna Central' : 'पटना सेंट्रल में नई चर्चा शुरू', 
      time: '2 hours ago',
      icon: <MessageSquare className="h-4 w-4" />
    },
    { 
      type: 'vote', 
      text: isEnglish ? 'Voting completed in Gaya constituency' : 'गया निर्वाचन क्षेत्र में मतदान पूरा', 
      time: '5 hours ago',
      icon: <Target className="h-4 w-4" />
    },
    { 
      type: 'news', 
      text: isEnglish ? 'Development project announced in Banka' : 'बांका में विकास परियोजना की घोषणा', 
      time: '1 day ago',
      icon: <FileText className="h-4 w-4" />
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
    <div className="min-h-screen bg-slate-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-slate-700 via-slate-800 to-slate-900 text-white py-12 sm:py-16 px-4 w-full">
        <div className="w-full max-w-none mx-auto">
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold mb-4 sm:mb-6">
              {content.title}
            </h1>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold mb-3 sm:mb-4 text-amber-300">
              {content.subtitle}
            </h2>
           
            <p className="text-base sm:text-lg md:text-xl mb-6 sm:mb-8 max-w-3xl mx-auto px-4 text-amber-200 font-medium">
              {content.workDiscussion}
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
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-l-lg text-slate-900 bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-sm sm:text-base placeholder-slate-500"
                  />
                  <MapPinIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                </div>
                <button 
                  className="bg-sky-600 hover:bg-sky-700 px-4 sm:px-6 py-2 sm:py-3 rounded-r-lg transition-colors border border-sky-600 hover:border-sky-700"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                >
                  <Search className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </button>
              </div>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute top-full left-0 right-0 bg-white border border-slate-200 rounded-lg shadow-lg mt-1 max-h-60 overflow-y-auto z-50">
                  {filteredAndSortedConstituencies.slice(0, 10).map((constituency) => (
                    <button
                      key={constituency.id}
                      onClick={() => handleConstituencySelect(constituency)}
                      className="w-full text-left px-4 py-2 hover:bg-slate-50 border-b border-slate-100 last:border-b-0 text-sm text-slate-900"
                    >
                      <div className="font-medium">
                        {isEnglish ? constituency.constituencyName.en : constituency.constituencyName.hi}
                      </div>
                      <div className="text-xs text-slate-500">
                        {isEnglish ? constituency.candidateName.en : constituency.candidateName.hi} - {isEnglish ? constituency.partyName.name : constituency.partyName.nameHi}
                      </div>
                    </button>
                  ))}
                  {filteredAndSortedConstituencies.length === 0 && (
                    <div className="px-4 py-2 text-sm text-slate-500">
                      {isEnglish ? 'No constituencies found' : 'कोई निर्वाचन क्षेत्र नहीं मिला'}
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="text-center space-y-4 mt-6">
  <p className="max-w-4xl mx-auto px-4">
    <span className="block text-2xl sm:text-3xl font-bold text-slate-50">
      {!isEnglish ? "जाने" : "Know"}
    </span>
    <span className="block text-sm sm:text-base text-slate-200">
      {!isEnglish
        ? "उम्मीदवारों की सम्पत्ति, आपराधिक मामले और संसद में भागीदारी"
        : "The candidates' assets, criminal cases and participation in Parliament"}
    </span>
  </p>

  <p className="max-w-4xl mx-auto px-4">
    <span className="block text-2xl sm:text-3xl font-bold text-slate-50">
      {!isEnglish ? "रखें" : "Share"}
    </span>
    <span className="block text-sm sm:text-base text-slate-200">
      {!isEnglish
        ? "वर्तमान और पूर्व उम्मीदवारों पर अपनी राय"
        : "Your views on current and past candidates"}
    </span>
  </p>

  <p className="max-w-4xl mx-auto px-4">
    <span className="block text-2xl sm:text-3xl font-bold text-slate-50">
      {!isEnglish ? "करें" : "Do"}
    </span>
    <span className="block text-sm sm:text-base text-slate-200">
      {!isEnglish
        ? "जनसंवाद, सवाल-जवाब और जवाबदेही तय"
        : "Public dialogue, questions and answers, and fix accountability"}
    </span>
  </p>
</div>
          </div>
        </div>
      </div>

      {/* Trending Topics Section */}
      <div className="w-full bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-200">
        <div className="w-full max-w-none mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h3 className="text-lg font-semibold text-center mb-4 text-amber-800">
            {isEnglish ? '🔥 Trending Topics in Bihar' : '🔥 बिहार में चर्चित विषय'}
          </h3>
          <div className="flex flex-wrap justify-center gap-3">
            <span className="px-4 py-2 bg-amber-100 text-amber-800 rounded-full text-sm font-medium border border-amber-200">
              {isEnglish ? 'Road Development' : 'सड़क विकास'}
            </span>
            <span className="px-4 py-2 bg-amber-100 text-amber-800 rounded-full text-sm font-medium border border-amber-200">
              {isEnglish ? 'Education Reforms' : 'शिक्षा सुधार'}
            </span>
            <span className="px-4 py-2 bg-amber-100 text-amber-800 rounded-full text-sm font-medium border border-amber-200">
              {isEnglish ? 'Healthcare' : 'स्वास्थ्य सेवाएं'}
            </span>
            <span className="px-4 py-2 bg-amber-100 text-amber-800 rounded-full text-sm font-medium border border-amber-200">
              {isEnglish ? 'Agriculture' : 'कृषि'}
            </span>
            <span className="px-4 py-2 bg-amber-100 text-amber-800 rounded-full text-sm font-medium border border-amber-200">
              {isEnglish ? 'Employment' : 'रोजगार'}
            </span>
          </div>
        </div>
      </div>

      {/* Quick Stats Section */}
      <div className="w-full bg-white border-b border-slate-200">
        <div className="w-full max-w-none mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {quickStats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className={`${stat.color} mb-2 flex justify-center`}>
                  {stat.icon}
                </div>
                <div className="text-2xl font-bold text-slate-800 mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-slate-600">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="w-full max-w-none mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          {/* Left Sidebar */}
          <div className="xl:col-span-1 space-y-6">
            {/* Recent Activities */}
            <div className="bg-white rounded-lg shadow-md p-6 border border-slate-100 hover:shadow-lg transition-all duration-300 hover:scale-105 card-hover">
              <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                <Clock className="h-5 w-5 mr-2 text-sky-600" />
                {isEnglish ? 'Recent Activities' : 'हाल की गतिविधियां'}
              </h3>
              <div className="space-y-3">
                {recentActivities.map((activity, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 bg-slate-50 rounded-lg">
                    <div className="text-sky-600 mt-1">
                      {activity.icon}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-slate-800 font-medium">
                        {activity.text}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {activity.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-md p-6 border border-slate-100">
              <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                <Zap className="h-5 w-5 mr-2 text-amber-600" />
                {isEnglish ? 'Quick Actions' : 'त्वरित कार्य'}
              </h3>
              <div className="space-y-3">
                <button className="w-full bg-sky-600 text-white py-2 px-4 rounded-lg hover:bg-sky-700 transition-colors text-sm font-medium">
                  {isEnglish ? 'Start Discussion' : 'चर्चा शुरू करें'}
                </button>
                <button className="w-full bg-emerald-600 text-white py-2 px-4 rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium">
                  {isEnglish ? 'Report Issue' : 'समस्या रिपोर्ट करें'}
                </button>
                <button className="w-full bg-amber-600 text-white py-2 px-4 rounded-lg hover:bg-amber-700 transition-colors text-sm font-medium">
                  {isEnglish ? 'Join Forum' : 'मंच में शामिल हों'}
                </button>
              </div>
            </div>

            {/* Bihar Highlights */}
            
          </div>

          {/* Main Content */}
          <div className="xl:col-span-3 space-y-8">
            {/* Nagrik Yogdan Section */}
            <section>
              <div className="text-center mb-6 sm:mb-8">
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-3">
                  {content.nagrikYogdan}
                </h2>
                <div className="flex items-center justify-center space-x-4 text-sm text-slate-600">
                  <span className="flex items-center">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></div>
                    {isEnglish ? 'Active' : 'सक्रिय'}
                  </span>
                  <span className="flex items-center">
                    <div className="w-2 h-2 bg-sky-500 rounded-full mr-2"></div>
                    {isEnglish ? 'Engaged' : 'जुड़े हुए'}
                  </span>
                  <span className="flex items-center">
                    <div className="w-2 h-2 bg-amber-500 rounded-full mr-2"></div>
                    {isEnglish ? 'New' : 'नए'}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {tiers.map((tier, index) => (
                  <div key={index} className="bg-white rounded-lg shadow-md p-4 sm:p-6 hover:shadow-lg transition-all duration-300 hover:scale-105 hover:-translate-y-2 card-hover stagger-item border border-slate-100">
                    <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-center text-slate-800">
                      {tier.name}
                    </h3>
                    <div className="text-center">
                      <div className="text-2xl sm:text-3xl font-bold text-sky-600 mb-2">
                        {tier.activeUsers}
                      </div>
                      <div className="text-sm sm:text-base text-slate-600 mb-3 sm:mb-4">
                        {isEnglish ? 'Bihar Citizens' : 'बिहार के नागरिक'}
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2 sm:h-3">
                        <div 
                          className="bg-sky-500 h-2 sm:h-3 rounded-full transition-all duration-500"
                          style={{ width: `${tier.percentage}%` }}
                        ></div>
                      </div>
                      <div className="text-xs sm:text-sm text-slate-600 mt-2">
                        {tier.percentage}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Achievement Section */}
            <section>
              <h2 className="text-2xl sm:text-3xl font-bold text-center mb-6 sm:mb-8 text-slate-800">
                {content.achievements}
              </h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
                {achievements.map((achievement, index) => (
                  <div key={index} className="bg-white rounded-lg shadow-md p-3 sm:p-6 text-center hover:shadow-lg transition-all duration-300 hover:scale-105 hover:-translate-y-2 card-hover stagger-item border border-slate-100">
                    <div className="flex justify-center mb-2 sm:mb-4">
                      {achievement.icon}
                    </div>
                    <h3 className="text-xs sm:text-lg font-semibold mb-1 sm:mb-2 text-slate-800 leading-tight">
                      {achievement.title}
                    </h3>
                    <div className="text-lg sm:text-2xl font-bold text-sky-600">
                      {achievement.count}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Charchit Vidhan Sabha Section */}
            <section>
              <h2 className="text-2xl sm:text-3xl font-bold text-center mb-6 sm:mb-8 text-slate-800">
                {content.charchitVidhanSabha}
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {constituenciesToShow.map((constituency) => (
                  <div key={constituency.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-105 hover:-translate-y-2 card-hover stagger-item border border-slate-100">
                    {/* Header with Party Color */}
                    <div className={`${constituency.partyName.color} h-2`}></div>
                    
                    <div className="p-4 sm:p-6">
                      <div className="flex items-start space-x-3 sm:space-x-4 mb-4">
                        {/* Conditional rendering for profile image */}
                        {constituency.profileImage ? (
                          <img 
                            src={constituency.profileImage} 
                            alt={isEnglish ? constituency.candidateName.en : constituency.candidateName.hi}
                            className="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover flex-shrink-0"
                            onError={(e) => {
                              // Hide image on error and show placeholder
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                        ) : null}
                        {/* Always render placeholder, hidden if image exists */}
                        <PlaceholderImages 
                          type="profile" 
                          size="lg" 
                          className={constituency.profileImage ? 'hidden' : ''} 
                        />
                        
                        <div className="min-w-0 flex-1">
                          <h3 className="text-lg sm:text-xl font-semibold text-slate-800 truncate">
                            {isEnglish ? constituency.constituencyName.en : constituency.constituencyName.hi}
                          </h3>
                          <p className="text-sm sm:text-base text-slate-600 truncate">
                            {isEnglish ? constituency.candidateName.en : constituency.candidateName.hi}
                          </p>
                          <p className="text-xs sm:text-sm text-slate-500">
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
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div 
                            className="bg-emerald-500 h-2 rounded-l-full transition-all duration-500"
                            style={{ width: `${constituency.satisfactionYes}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* News */}
                      <div className="mb-4 p-3 bg-slate-50 rounded-lg">
                        <p className="text-xs sm:text-sm font-medium line-clamp-2">
                          {isEnglish ? constituency.news.title.en : constituency.news.title.hi}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          {constituency.news.date}
                        </p>
                      </div>

                                        {/* Stats */}
                  <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4 text-center">
                    <div>
                      <div className="text-base sm:text-lg font-bold text-sky-600">
                        {constituency.manifestoScore}%
                      </div>
                      <div className="text-xs text-slate-500">
                        {content.manifestoScore}
                      </div>
                    </div>
                    <div>
                      <div className="text-base sm:text-lg font-bold text-emerald-600">
                        {constituency.activePostCount}
                      </div>
                      <div className="text-xs text-slate-500">
                        {content.activePosts}
                      </div>
                    </div>
                    <div>
                      <button 
                        onClick={() => handleShare(constituency)}
                        className="text-sky-600 hover:text-sky-700 transition-colors"
                      >
                        {shareStatus === 'copied' ? (
                          <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 mx-auto text-emerald-600" />
                        ) : (
                          <Share2 className="h-4 w-4 sm:h-5 sm:w-5 mx-auto" />
                        )}
                        <div className="text-xs mt-1">
                          {shareStatus === 'copied' ? (isEnglish ? 'Copied!' : 'कॉपी हो गया!') : content.share}
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Engagement Actions */}
                  <div className="flex items-center justify-between mb-4 text-sm">
                    <button className="flex items-center space-x-1 text-slate-600 hover:text-sky-600 transition-colors">
                      <ThumbsUp className="h-4 w-4" />
                      <span>{isEnglish ? 'Like' : 'लाइक'}</span>
                    </button>
                    <button className="flex items-center space-x-1 text-slate-600 hover:text-sky-600 transition-colors">
                      <ThumbsUp className="h-4 w-4" />
                      <span>{isEnglish ? 'Dislike' : ' डिस्लाइक'}</span>
                    </button>
                    <button className="flex items-center space-x-1 text-slate-600 hover:text-sky-600 transition-colors">
                      <MessageSquare className="h-4 w-4" />
                      <span>{isEnglish ? 'Comment' : 'टिप्पणी'}</span>
                    </button>
                   
                  </div>

                      <button
                        onClick={() => window.location.href = `/aapka-shetra?constituency=${constituency.id}`}
                        className="block w-full bg-sky-600 text-white text-center py-2 sm:py-3 rounded-lg hover:bg-sky-700 transition-colors text-sm sm:text-base font-medium"
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
                    className="bg-sky-600 text-white px-6 sm:px-8 py-2 sm:py-3 rounded-lg hover:bg-sky-700 transition-colors text-sm sm:text-base font-medium"
                  >
                    {content.loadMore}
                  </button>
                </div>
              )}

              {filteredAndSortedConstituencies.length === 0 && searchQuery && (
                <div className="text-center py-12">
                  <p className="text-slate-500">
                    {isEnglish ? 'No constituencies found matching your search.' : 'आपकी खोज से मेल खाने वाला कोई निर्वाचन क्षेत्र नहीं मिला।'}
                  </p>
                </div>
              )}
            </section>
          </div>
        </div>
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
