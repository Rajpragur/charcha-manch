import { useLanguage } from "../contexts/LanguageContext";
import PopupCard from "./PopupCard";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  Loader2,
  ArrowRight,
} from "lucide-react";

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

const getPartyColor = (partyName: string): string => {
  const partyColors: Record<string, string> = {
    "भारतीय जनता पार्टी": "bg-amber-600",
    "जनता दल (यूनाइटेड)": "bg-emerald-600",
    'भारतीय राष्ट्रीय कांग्रेस': 'bg-sky-600',
    "राष्ट्रिया जनता दल": "bg-green-600",
    "कम्युनिस्ट पार्टी ऑफ इंडिया": "bg-red-500",
    "लोक जनशक्ति पार्टी": "bg-purple-600",
    "हिंदुस्तानी अवाम मोर्चा": "bg-green-600",
    "राष्ट्रीय लोक समता पार्टी": "bg-blue-600",
    "बहूजन समाज पार्टी": "bg-blue-500",
    "जन अधीकर पार्टी (लोकतांत्रिक)": "bg-orange-600",
    "कम्युनिस्ट पार्टी ऑफ इंडिया (मार्क्सवादी)": "bg-rose-500",
    "कम्युनिस्ट पार्टी ऑफ इंडिया (मार्क्सवादी-लेनिनवादी) (मुक्ति)":
      "bg-red-600",
    "हिंदुस्तानी अवाम मोर्चा (धर्मनिरपेक्ष)": "bg-zinc-800",
    "अखिल भारतीय मजलिस-ए-इटिहादुल मुस्लिमीन": "bg-emerald-900",
    "नोटा": "bg-gray-600",
    "Bharatiya Janata Party": "bg-amber-600",
    "Janata Dal (United)": "bg-emerald-600",
    "Rashtriya Janata Dal": "bg-green-600",
    "Indian National Congress": "bg-sky-600",
    "Communist Party of India": "bg-red-500",
    "Lok Janshakti Party": "bg-purple-600",
    "Hindustani Awam Front (Secular)": "bg-green-600",
    "Rashtriya Lok Samta Party": "bg-blue-600",
    "Bahujan Samaj Party": "bg-blue-500",
    "Jan Adhikar Party (Democratic)": "bg-orange-600",
    "Communist Party of India (Marxist)": "bg-rose-500",
    "Communist Party of India (Marxist-Leninist) (Liberation)": "bg-red-600",
    "All India Majlis-e-Itihadul Muslimeen": "bg-emerald-900",
    "Independent": "bg-yellow-600",
    "NOTA": "bg-gray-600",
  };

  return partyColors[partyName] || "bg-slate-600";
};

interface CharchitVidhanSabhaProps {
  constituencies: ConstituencyData[];
  isLoading: boolean;
  submitSatisfactionSurvey: (constituencyId: string, answer: boolean) => void;
  handleShare: (constituency: ConstituencyData) => Promise<void>;
  popup: {
    isOpen: boolean;
    title: string;
    message: string;
    type: "success" | "error" | "info";
  };
  closePopup: () => void;
  currentUser: any;
  userSurveys: Set<string>;
}

export default function CharchitVidhanSabha({
  constituencies,
  isLoading,
  submitSatisfactionSurvey,
  popup,
  closePopup,
  currentUser,
  userSurveys,
}: CharchitVidhanSabhaProps) {
  const { isEnglish } = useLanguage();
  const navigate = useNavigate();
  const [visibleCount, setVisibleCount] = useState(2);
  // Filter and sort constituencies
  const filteredAndSortedConstituencies = constituencies.sort((a, b) => {
    // First sort by interaction count (descending)
    if (b.interactionCount !== a.interactionCount) {
      return b.interactionCount - a.interactionCount;
    }
    // If tied, sort alphabetically by English constituency name
    return a.constituencyName.en.localeCompare(b.constituencyName.en);
  });

  // Handle constituency selection from dropdown
  const handleConstituencySelect = (constituency: ConstituencyData) => {
    navigate(
      `/constituency/${constituency.constituencyName.en.toLowerCase().replace(/\s+/g, "-")}-${constituency.id}?id=${constituency.id}`,
    );
  };
  const handleCharchaManch = (area: string) => {
    navigate(`/discussion?constituency=${area}&name=${encodeURIComponent(area)}`);
  };

  const handleShowMore = () => {
    setVisibleCount(prev => prev + 12);
  };

  return (
    <div 
      className="min-h-screen bg-[#c5ced4]"
      style={{
        fontFamily: 'Noto Sans Devanagari',
        letterSpacing: '0',
        textAlign: 'center',
        verticalAlign: 'middle'
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 lg:py-8">
        {/* Header Section */}
        <div className="text-center mb-2 lg:mb-5">
          <h1 className="text-2xl md:text-5xl font-bold mb-4 bg-black bg-clip-text text-transparent">
            {isEnglish ? "Charchit Vidhansabha" : "चर्चित विधानसभा"}
          </h1>
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
                {isEnglish
                  ? "Loading constituencies..."
                  : "निर्वाचन क्षेत्र लोड हो रहे हैं..."}
              </p>
              <p className="text-slate-500 dark:text-slate-400">
                {isEnglish
                  ? "Please wait while we fetch the latest data"
                  : "कृपया प्रतीक्षा करें जब तक हम नवीनतम डेटा प्राप्त कर रहे हैं"}
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Constituency Grid Section */}
            <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-3 lg:py-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredAndSortedConstituencies
                  .slice(0, visibleCount)
                  .map((constituency) => (
                    <div
                      key={constituency.id}
                      className="bg-white rounded-lg p-4 px-6 shadow-sm border border-gray-200 relative"
                    >
                      {/* Active Discussion Badge */}
                      <div 
                        className="absolute top-2 right-2 bg-[#DEAF13] px-4 py-2 rounded-xl cursor-pointer hover:bg-[#C49F11] transition-colors"
                        onClick={() => handleCharchaManch(isEnglish ? constituency.constituencyName.en : constituency.constituencyName.hi)}
                      >
                        <div className="text-center">
                          <div 
                            className="candidate-profile-sakriya-charcha-text"
                            style={{ fontSize: '12px', lineHeight: '16px' }}
                          >
                            {isEnglish ? "Active Discussion" : "सक्रिय चर्चा"}
                          </div>
                        </div>
                      </div>

                      {/* Candidate Profile Header */}
                      <div className="mb-4 flex items-start space-x-3 pr-20">
                        <div className="flex-shrink-0">
                          <img 
                            alt={isEnglish ? constituency.candidateName.en : constituency.candidateName.hi}
                            className="w-16 h-16 rounded-full border-2 border-gray-300 object-cover"
                            src={constituency.profileImage || "https://via.placeholder.com/64x64"}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="mb-1 candidate-profile-heading text-left">
                            {isEnglish ? constituency.constituencyName.en : constituency.constituencyName.hi}
                          </div>
                          <div className="text-xl font-bold candidate-profile-subheading mb-2 text-left">
                            {isEnglish ? constituency.candidateName.en : constituency.candidateName.hi}
                          </div>
                          <div className="flex items-center space-x-2 mb-2">
                            <button 
                              className={`${getPartyColor(constituency.partyName.name)} text-white px-3 py-2 rounded-lg text-sm font-medium min-w-fit flex-shrink-0 text-center leading-tight`}
                            >
                              {isEnglish ? constituency.partyName.name : constituency.partyName.nameHi}
                            </button>
                            <div className="w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center p-2">
                              <img 
                                alt={isEnglish ? constituency.partyName.name : constituency.partyName.nameHi}
                                className="w-full h-full rounded-full object-contain"
                                src={fetchPartyIcon(constituency.partyName.name)}
                                onError={(e) => {
                                  e.currentTarget.src = "/images/party_logo/independent.png";
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Candidate Info */}
                      <div className="flex space-x-6 mb-4 justify-between mx-auto">
                        <div className="text-center">
                          <div className="vidhayak-info-text">
                            {constituency.experience?.en || "1"}
                          </div>
                          <div className="text-sm text-gray-600 vidhayak-info-text-subheading">
                            {isEnglish ? "" : ""}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="vidhayak-info-text">
                            {isEnglish ? constituency.education?.en : constituency.education?.hi || "स्नातक"}
                          </div>
                          <div className="text-sm text-gray-600">
                            {isEnglish ? "Education" : "शिक्षा"}
                          </div>
                        </div>
                      </div>

                      {/* Satisfaction Survey */}
                      <div className="mb-4">
                        <div className="text-sm text-gray-600 mb-3 text-center mx-auto">
                          {isEnglish 
                            ? "Are you satisfied with the last five years of tenure?"
                            : "क्या आप पिछले पांच साल के कार्यकाल से खुश हैं?"
                          }
                        </div>
                        
                        {/* Show voting buttons only if user hasn't voted */}
                        {currentUser && !userSurveys.has(`${constituency.id}:true`) && !userSurveys.has(`${constituency.id}:false`) ? (
                          <div className="flex items-center justify-center">
                            <div 
                              className="flex bg-[#f6f6f6] w-[90px] h-[40px] pt-[3px] pb-[10px] pr-[6px] pl-[3px] rounded-full gap-0"
                              style={{ boxShadow: 'rgba(0, 0, 0, 0.15) 0px 4px 8px 0px, rgba(0, 0, 0, 0.1) 0px 2px 4px 0px' }}
                            >
                              <button 
                                onClick={() => submitSatisfactionSurvey(constituency.id, true)}
                                className="text-center w-[40px] h-[34px] pl-[10px] pr-[10px] rounded-full text-base font-medium mx-auto transition-colors bg-[#f6f6f6] text-[#026A00]"
                              >
                                {isEnglish ? "Yes" : "हाँ"}
                              </button>
                              <button 
                                onClick={() => submitSatisfactionSurvey(constituency.id, false)}
                                className="text-center w-[40px] h-[34px] rounded-full text-base pr-[9px] pl-[3px] font-medium transition-colors bg-[#f6f6f6] text-[#026A00]"
                              >
                                {isEnglish ? "No" : "ना"}
                              </button>
                            </div>
                          </div>
                        ) : (
                          /* Show vote counts when user has already voted */
                          <div className="flex items-center justify-center space-x-6">
                            <div className="text-center">
                              <div className="text-lg font-bold text-green-600">
                                {constituency.satisfactionYes || 0}
                              </div>
                              <div className="text-xs text-gray-600">
                                {isEnglish ? "Yes" : "हाँ"}
                              </div>
                            </div>
                            <div className="text-center">
                              <div className="text-lg font-bold text-red-600">
                                {constituency.satisfactionNo || 0}
                              </div>
                              <div className="text-xs text-gray-600">
                                {isEnglish ? "No" : "ना"}
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {/* Show sign in message if not logged in */}
                        {!currentUser && (
                          <div className="text-xs text-gray-500 text-center mt-1">
                            {isEnglish ? 'Sign in to vote' : 'मतदान के लिए साइन इन करें'}
                          </div>
                        )}
                      </div>

                      {/* Manifesto Score */}
                      <div className="mb-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm text-gray-600 manifesto-score-text">
                            {isEnglish 
                              ? `Manifesto Promise Score: ${constituency.manifestoScore || 53}%`
                              : `घोषणापत्र वादा स्कोर: ${constituency.manifestoScore || 53}%`
                            }
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-[#273F4F] h-2 rounded-full"
                            style={{ width: `${constituency.manifestoScore*20 || 53}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* News Icon */}
                      <div className="flex items-center space-x-2 mb-4">
                        <div className="w-5 h-5 rounded flex items-center justify-center">
                          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12.8332 7H11.3865C11.1316 6.99946 10.8835 7.08243 10.6802 7.23623C10.4768 7.39003 10.3295 7.6062 10.2607 7.85167L8.88984 12.7283C8.881 12.7586 8.86258 12.7852 8.83734 12.8042C8.81209 12.8231 8.78139 12.8333 8.74984 12.8333C8.71828 12.8333 8.68758 12.8231 8.66234 12.8042C8.63709 12.7852 8.61867 12.7586 8.60984 12.7283L5.38984 1.27167C5.381 1.24138 5.36258 1.21477 5.33734 1.19583C5.31209 1.1769 5.28139 1.16667 5.24984 1.16667C5.21828 1.16667 5.18758 1.1769 5.16234 1.19583C5.13709 1.21477 5.11867 1.24138 5.10984 1.27167L3.739 6.14833C3.67044 6.39284 3.52398 6.6083 3.32184 6.76201C3.11971 6.91572 2.87294 6.99927 2.619 7H1.1665" stroke="#191970" strokeWidth="1.16667" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm text-gray-600"></span>
                        </div>
                      </div>

                      {/* Action Button */}
                      <div className="flex items-center space-x-3">
                        <button 
                          onClick={() => handleConstituencySelect(constituency)}
                          className="flex-1 bg-[#273F4F] text-white py-3 px-4 rounded-lg text-sm font-medium"
                        >
                          {isEnglish ? "View Details" : "विस्तार से देखे"}
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
            {/* Show More Button */}
            {visibleCount < filteredAndSortedConstituencies.length && (
              <div className="flex items-center justify-center mb-2 lg:mb-4">
                <button
                  className="bg-[#7b8a95] text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-[#6a7984] transition-colors"
                  onClick={handleShowMore}
                >
                  {isEnglish ? `Show More Constituencies` : `और क्षेत्र दिखाएं`}{" "}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            )}
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
        showCloseButton={popup.type !== "success"}
      />
    </div>
  );
}
