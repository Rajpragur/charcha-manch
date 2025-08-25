import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import PlaceholderImages from './PlaceholderImages';
import PopupCard from './PopupCard';
import {
  TrendingUp, 
  Share2,
  Loader2,
  Database,
  CheckCircle2,
  XCircle,
  ChevronDown,
  BookOpen,
  Award,
  MessageSquare,
  Calendar,
  Users,
  BarChart3
} from 'lucide-react';

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
  rawData: any;
}

interface CharchitVidhanSabhaProps {
  constituencies: ConstituencyData[];
  isLoading: boolean;
  visibleCount: number;
  hasUserSubmittedSurvey: (constituencyId: string) => boolean;
  submitSatisfactionSurvey: (constituencyId: string, answer: boolean) => void;
  loadMoreConstituencies: () => void;
  initializeConstituencyScores: () => void;
  handleShare: (constituency: ConstituencyData) => Promise<void>;
  popup: {
    isOpen: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'info';
  };
  closePopup: () => void;
  refreshConstituencyData: () => Promise<void>;
}

export default function CharchitVidhanSabha({
  constituencies,
  isLoading,
  visibleCount,
  hasUserSubmittedSurvey,
  submitSatisfactionSurvey,
  loadMoreConstituencies,
  initializeConstituencyScores,
  handleShare,
  popup,
  closePopup
}: CharchitVidhanSabhaProps) {
  const { isEnglish } = useLanguage();

  // Filter and sort constituencies
  const filteredAndSortedConstituencies = constituencies
    .sort((a, b) => {
      // First sort by interaction count (descending)
      if (b.interactionCount !== a.interactionCount) {
        return b.interactionCount - a.interactionCount;
      }
      // If tied, sort alphabetically by English constituency name
      return a.constituencyName.en.localeCompare(b.constituencyName.en);
    });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full mb-6 shadow-lg">
            <Users className="h-10 w-10 text-white" />
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-green-600 via-emerald-600 to-blue-600 bg-clip-text text-transparent">
            {isEnglish ? 'Charchit Vidhan Sabha' : 'चर्चित विधान सभा'}
          </h1>
          
          <p className="text-lg md:text-xl text-slate-600 dark:text-slate-300 mb-6 max-w-3xl mx-auto leading-relaxed">
            {isEnglish ? 'Explore constituencies and their representatives with detailed insights and community feedback' : 'निर्वाचन क्षेत्रों और उनके प्रतिनिधियों का विस्तृत अंतर्दृष्टि और सामुदायिक प्रतिक्रिया के साथ अन्वेषण करें'}
          </p>
          
          {/* Info Badges */}
          <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 text-blue-700 dark:text-blue-300 px-4 py-2.5 rounded-full text-sm font-medium border border-blue-200 dark:border-blue-700/50 shadow-sm">
              <TrendingUp className="h-4 w-4" />
              <span>
                {isEnglish ? 'Sorted by interaction count' : 'बातचीत की संख्या के अनुसार क्रमबद्ध'}
              </span>
            </div>

            <button
              onClick={initializeConstituencyScores}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/30 dark:to-green-900/30 text-emerald-700 dark:text-emerald-300 px-4 py-2.5 rounded-full text-sm font-medium border border-emerald-200 dark:border-emerald-700/50 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105"
            >
              <Database className="h-4 w-4" />
              <span>{isEnglish ? 'Initialize Database' : 'डेटाबेस प्रारंभ करें'}</span>
            </button>
          </div>
          
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-6">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-green-200 to-emerald-200 dark:from-green-900/30 dark:to-emerald-900/30 blur-2xl opacity-60 animate-pulse"></div>
              <div className="relative w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg">
                <Loader2 className="h-10 w-10 animate-spin text-white" />
              </div>
            </div>
            <div className="text-center">
              <p className="text-xl text-slate-600 dark:text-slate-300 font-medium mb-2">
                {isEnglish ? 'Loading constituencies...' : 'निर्वाचन क्षेत्र लोड हो रहे हैं...'}
              </p>
              <p className="text-slate-500 dark:text-slate-400">
                {isEnglish ? 'Please wait while we fetch the latest data' : 'कृपया प्रतीक्षा करें जब तक हम नवीनतम डेटा प्राप्त कर रहे हैं'}
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Constituencies Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {filteredAndSortedConstituencies.slice(0, visibleCount).map((constituency) => (
                <div key={constituency.id} className="group bg-white dark:bg-slate-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-slate-200 dark:border-slate-700 hover:scale-[1.02] hover:-translate-y-1">
                  {/* Party Color Header */}
                  <div className={`${constituency.partyName.color} h-2`}></div>
                  
                  <div className="p-6">
                    {/* Candidate Profile Section */}
                    <div className="flex items-start gap-4 mb-6">
                      <div className="relative flex-shrink-0">
                        {constituency.profileImage ? (
                          <img 
                            src={constituency.profileImage} 
                            alt={isEnglish ? constituency.candidateName.en : constituency.candidateName.hi}
                            className="w-20 h-20 rounded-full object-cover border-4 border-white dark:border-slate-700 shadow-lg"
                          />
                        ) : (
                          <div className="w-20 h-20 rounded-full border-4 border-white dark:border-slate-700 shadow-lg overflow-hidden">
                            <PlaceholderImages type="profile" size="lg" />
                          </div>
                        )}
                        {/* Age Badge */}
                        <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center border-2 border-white dark:border-slate-700 shadow-md">
                          <span className="text-[10px] text-white font-bold">{constituency.age}</span>
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-1 truncate">
                          {isEnglish ? constituency.constituencyName.en : constituency.constituencyName.hi}
                        </h3>
                        <p className="text-slate-600 dark:text-slate-300 mb-2 truncate">
                          {isEnglish ? constituency.candidateName.en : constituency.candidateName.hi}
                        </p>
                        <div className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold text-white shadow-sm ${constituency.partyName.color}`}>
                          {isEnglish ? constituency.partyName.name : constituency.partyName.nameHi}
                        </div>
                      </div>
                    </div>

                    {/* Key Details Grid */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                          <BarChart3 className="h-4 w-4" />
                          <span className="text-xs font-medium uppercase tracking-wide">{isEnglish ? 'Age' : 'उम्र'}</span>
                        </div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">
                          {constituency.age}
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                          <BookOpen className="h-4 w-4" />
                          <span className="text-xs font-medium uppercase tracking-wide">{isEnglish ? 'Education' : 'शिक्षा'}</span>
                        </div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">
                          {isEnglish ? constituency.education.en : constituency.education.hi}
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                          <Award className="h-4 w-4" />
                          <span className="text-xs font-medium uppercase tracking-wide">{isEnglish ? 'Manifesto' : 'घोषणापत्र'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${constituency.manifestoScore / 5 * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-bold text-slate-900 dark:text-white">{constituency.manifestoScore} / 5</span>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                          <MessageSquare className="h-4 w-4" />
                          <span className="text-xs font-medium uppercase tracking-wide">{isEnglish ? 'Active Posts' : 'सक्रिय पोस्ट'}</span>
                        </div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{constituency.activePostCount}</p>
                      </div>
                    </div>

                    {/* Satisfaction Survey Section */}
                    <div className="bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-700/50 dark:to-slate-600/50 rounded-xl p-4 mb-6 border border-slate-200 dark:border-slate-600">
                      <div className="flex items-center gap-2 mb-3">
                        <Award className="h-5 w-5 text-amber-500" />
                        <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                          {isEnglish ? 'Satisfaction Survey' : 'संतुष्टि सर्वेक्षण'}
                        </h4>
                      </div>
                      
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
                        {isEnglish ? 'Are you satisfied with your tenure of last 5 years?' : 'क्या आप पिछले 5 वर्षों के कार्यकाल से संतुष्ट हैं?'}
                      </p>
                      
                      {/* Satisfaction Progress */}
                      {constituency.satisfactionTotal > 0 ? (
                        <div className="space-y-3 mb-4">
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-1.5">
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                              <span className="text-green-600 dark:text-green-400 font-medium">
                                {isEnglish ? 'Yes' : 'हाँ'}: {constituency.satisfactionYes}
                              </span>
                            </div>
                            <span className="font-bold text-green-600 dark:text-green-400">
                              {Math.round((constituency.satisfactionYes / constituency.satisfactionTotal) * 100)}%
                            </span>
                          </div>
                          
                          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
                            <div 
                              className="bg-gradient-to-r from-green-500 to-emerald-500 h-2.5 rounded-full transition-all duration-700 ease-out shadow-sm"
                              style={{ 
                                width: `${constituency.satisfactionTotal > 0 ? (constituency.satisfactionYes / constituency.satisfactionTotal) * 100 : 0}%` 
                              }}
                            ></div>
                          </div>
                          
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-1.5">
                              <XCircle className="h-4 w-4 text-red-500" />
                              <span className="text-red-600 dark:text-red-400 font-medium">
                                {isEnglish ? 'No' : 'नहीं'}: {constituency.satisfactionNo}
                              </span>
                            </div>
                            <span className="font-bold text-red-600 dark:text-red-400">
                              {Math.round((constituency.satisfactionNo / constituency.satisfactionTotal) * 100)}%
                            </span>
                          </div>
                          
                          <div className="text-xs text-center text-slate-500 dark:text-slate-400 pt-1 font-medium">
                            {isEnglish ? 'Total responses' : 'कुल प्रतिक्रियाएं'}: {constituency.satisfactionTotal}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-4 bg-white dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600">
                          <div className="text-sm text-slate-500 dark:text-slate-400 mb-2">
                            {isEnglish ? 'No responses yet' : 'अभी तक कोई प्रतिक्रिया नहीं'}
                          </div>
                          <div className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                            {isEnglish ? 'Be the first to vote!' : 'पहले वोट करने वाले बनें!'}
                          </div>
                        </div>
                      )}
                      
                      {/* Voting Buttons */}
                      {!hasUserSubmittedSurvey(constituency.id) ? (
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            onClick={() => submitSatisfactionSurvey(constituency.id, true)}
                            className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-medium text-sm transition-all duration-200 hover:shadow-lg hover:scale-105"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                            <span>{isEnglish ? 'Yes' : 'हाँ'}</span>
                          </button>
                          <button
                            onClick={() => submitSatisfactionSurvey(constituency.id, false)}
                            className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-medium text-sm transition-all duration-200 hover:shadow-lg hover:scale-105"
                          >
                            <XCircle className="h-4 w-4" />
                            <span>{isEnglish ? 'No' : 'नहीं'}</span>
                          </button>
                        </div>
                      ) : (
                        <div className="bg-white dark:bg-slate-700 rounded-lg p-3 text-center border border-slate-200 dark:border-slate-600">
                          <div className="text-sm text-slate-600 dark:text-slate-300 mb-3 font-medium">
                            {isEnglish ? 'You have already voted!' : 'आपने पहले ही वोट कर दिया है!'}
                          </div>
                          <div className="grid grid-cols-2 gap-3 text-xs">
                            <div className="text-center p-2 rounded-md bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                              <div className="text-green-600 dark:text-green-400 font-bold text-lg">{constituency.satisfactionYes}</div>
                              <div className="text-green-700 dark:text-green-500 font-medium">{isEnglish ? 'Yes' : 'हाँ'}</div>
                            </div>
                            <div className="text-center p-2 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                              <div className="text-red-600 dark:text-red-400 font-bold text-lg">{constituency.satisfactionNo}</div>
                              <div className="text-red-700 dark:text-red-500 font-medium">{isEnglish ? 'No' : 'नहीं'}</div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Latest News Section */}
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-xl p-4 mb-6 border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse"></div>
                        <p className="text-sm font-semibold text-blue-700 dark:text-blue-400">
                          {isEnglish ? 'Latest News' : 'ताजा समाचार'}
                        </p>
                      </div>
                      <p className="text-sm text-blue-700 dark:text-blue-400 mb-2 leading-relaxed">
                        {isEnglish ? constituency.news.title.en : constituency.news.title.hi}
                      </p>
                      <div className="flex items-center gap-1 text-xs text-blue-600/70 dark:text-blue-500/70">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {constituency.news.date !== 'No date available' ? constituency.news.date : 'Date not available'}
                        </span>
                      </div>
                    </div>

                    {/* Interaction Stats */}
                    <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400 mb-6">
                      <span className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-blue-500" />
                        {isEnglish ? 'Total interactions' : 'कुल बातचीत'}: 
                        <span className="font-bold text-slate-900 dark:text-white">{constituency.interactionCount || 0}</span>
                      </span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                      <Link
                        to={`/constituency/${constituency.constituencyName.en.toLowerCase().replace(/\s+/g, '-')}-${constituency.id}?id=${constituency.id}`}
                        className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white text-center py-3 px-4 rounded-xl font-semibold transition-all duration-200 hover:shadow-lg hover:scale-105 flex items-center justify-center gap-2"
                      >
                        <span>{isEnglish ? 'More Details' : 'अधिक विवरण'}</span>
                        <ChevronDown className="h-4 w-4 rotate-[-90deg]" />
                      </Link>
                      <button
                        onClick={() => handleShare(constituency)}
                        className="w-12 h-12 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-all duration-200 hover:shadow-md flex items-center justify-center group"
                        title={isEnglish ? 'Share constituency' : 'निर्वाचन क्षेत्र शेयर करें'}
                      >
                        <Share2 className="h-5 w-5 group-hover:scale-110 transition-transform" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Load More Button */}
            {visibleCount < filteredAndSortedConstituencies.length && (
              <div className="text-center mb-8">
                <button
                  onClick={loadMoreConstituencies}
                  className="group relative overflow-hidden bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 hover:from-slate-200 hover:to-slate-300 dark:hover:from-slate-600 dark:hover:to-slate-500 text-slate-700 dark:text-slate-300 px-8 py-4 rounded-2xl font-semibold text-lg transition-all duration-300 hover:shadow-xl hover:scale-105 border border-slate-300 dark:border-slate-600"
                >
                  <span className="relative flex items-center gap-3">
                    {isEnglish ? `Load More Constituencies` : `और निर्वाचन क्षेत्र लोड करें`}
                    <ChevronDown className="h-5 w-5 text-slate-500 group-hover:translate-y-1 transition-transform" />
                  </span>
                </button>
              </div>
            )}

            {/* Footer Info */}
            <div className="text-center space-y-3">
              <div className="inline-flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <BarChart3 className="h-5 w-5 text-slate-500" />
                <p className="text-slate-600 dark:text-slate-400 font-medium">
                  {isEnglish 
                    ? `Showing ${visibleCount} of ${filteredAndSortedConstituencies.length} constituencies (Total: 243)`
                    : `${filteredAndSortedConstituencies.length} में से ${visibleCount} निर्वाचन क्षेत्र दिखा रहे हैं (कुल: 243)`
                  }
                </p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Popup Card */}
      <PopupCard
        isOpen={popup.isOpen}
        onClose={closePopup}
        title={popup.title}
        message={popup.message}
        type={popup.type}
        showCloseButton={popup.type !== 'success'}
      />
    </div>
  );
}