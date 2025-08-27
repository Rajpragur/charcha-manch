import { useLanguage } from "../contexts/LanguageContext";
import PopupCard from "./PopupCard";
import { useNavigate } from "react-router-dom";
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
    "राष्ट्रिया जनता दल": "bg-green-600",
    "भारतीय राष्ट्रीय कांग्रेस": "bg-sky-600",
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
  handleShare,
  popup,
  closePopup,
  currentUser,
  userSurveys,
}: CharchitVidhanSabhaProps) {
  const { isEnglish } = useLanguage();
  const navigate = useNavigate();
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

  return (
    <div className="min-h-screen bg-[#c5ced4]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
            <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-2 lg:py-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredAndSortedConstituencies
                  .slice(0, 2)
                  .map((constituency) => (
                    <div
                      key={constituency.id}
                      className="bg-white rounded-xl shadow-lg p-6 border border-gray-100"
                    >
                      {/* Candidate Profile Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                            {constituency.profileImage ? (
                              <img
                                src={constituency.profileImage}
                                alt={
                                  isEnglish
                                    ? constituency.candidateName.en
                                    : constituency.candidateName.hi
                                }
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                                {(isEnglish
                                  ? constituency.candidateName.en
                                  : constituency.candidateName.hi
                                ).charAt(0)}
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="text-lg font-bold text-gray-900">
                              {isEnglish
                                ? constituency.constituencyName.en
                                : constituency.constituencyName.hi}
                            </div>
                            <div className="text-sm font-medium text-gray-700">
                              {isEnglish
                                ? constituency.candidateName.en
                                : constituency.candidateName.hi}
                            </div>
                            <div className="flex items-center space-x-2 mt-1">
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium text-white ${getPartyColor(constituency.partyName.name)}`}
                              >
                                {isEnglish
                                  ? constituency.partyName.name
                                  : constituency.partyName.nameHi}
                              </span>
                              <div className="w-6 h-6 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center">
                                <img
                                  src={fetchPartyIcon(
                                    constituency.partyName.name,
                                  )}
                                  alt="Party"
                                  className="w-6 h-6 object-contain"
                                  onError={(e) => {
                                    e.currentTarget.src =
                                      "/images/party_logo/independent.png";
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleCharchaManch(constituency.constituencyName.en)}
                          className="bg-yellow-400 text-gray-900 px-3 py-1 rounded-full text-xs font-medium hover:bg-yellow-500 transition-colors"
                        >
                          {constituency.activePostCount || 0}+{" "}
                          {isEnglish ? "Active Discussion" : "सक्रिय चर्चा"}
                        </button>
                      </div>

                      {/* Candidate Details */}
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="text-center">
                          <div className="text-lg font-bold text-gray-900">
                            {constituency.age || "N/A"}
                          </div>
                          <div className="text-xs text-gray-600">
                            {isEnglish ? "Age" : "आयु"}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm font-medium text-gray-900 leading-tight">
                            {isEnglish
                              ? constituency.education.en
                              : constituency.education.hi}
                          </div>
                          <div className="text-xs text-gray-600">
                            {isEnglish ? "Education" : "शिक्षा"}
                          </div>
                        </div>
                      </div>

                      {/* Public Satisfaction Section */}
                      <div className="mb-4">
                        <div className="text-sm text-gray-700 mb-2">
                          {isEnglish
                            ? "Are you satisfied with the last five years of tenure?"
                            : "क्या आप पिछले पाँच साल के कार्यकाल से संतुष्ट है ?"}
                        </div>
                        
                        {/* Show voting buttons only if user hasn't voted */}
                        {currentUser && !userSurveys.has(`${constituency.id}:true`) && !userSurveys.has(`${constituency.id}:false`) ? (
                          <div className="flex items-center space-x-2 mb-2">
                            <button 
                              onClick={() => submitSatisfactionSurvey(constituency.id, true)}
                              className="px-3 py-1 text-xs rounded-full transition-colors bg-white text-gray-700 border border-gray-300 hover:bg-green-50 hover:border-green-300"
                            >
                              {isEnglish ? "Yes" : "हाँ"}
                            </button>
                            <button 
                              onClick={() => submitSatisfactionSurvey(constituency.id, false)}
                              className="px-3 py-1 text-xs rounded-full transition-colors bg-white text-gray-700 border border-gray-300 hover:bg-red-50 hover:border-red-300"
                            >
                              {isEnglish ? "No" : "ना"}
                            </button>
                          </div>
                        ) : (
                          /* Show vote counts and user's vote if they have already voted */
                          <div className="mb-2">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <span className="text-xs text-gray-600">
                                  {isEnglish ? "Your vote:" : "आपका वोट:"}
                                </span>
                                {userSurveys.has(`${constituency.id}:true`) ? (
                                  <span className="px-2 py-1 text-xs rounded-full bg-green-500 text-white">
                                    {isEnglish ? "Yes" : "हाँ"}
                                  </span>
                                ) : userSurveys.has(`${constituency.id}:false`) ? (
                                  <span className="px-2 py-1 text-xs rounded-full bg-red-500 text-white">
                                    {isEnglish ? "No" : "ना"}
                                  </span>
                                ) : null}
                              </div>
                              <div className="text-sm font-bold text-green-600">
                                {constituency.satisfactionTotal > 0
                                  ? Math.round(
                                      (constituency.satisfactionYes /
                                        constituency.satisfactionTotal) *
                                        100,
                                    )
                                  : 0}
                                % {isEnglish ? "Satisfied" : "संतुष्ट"}
                              </div>
                            </div>
                            <div className="flex items-center justify-between text-xs text-gray-600">
                              <span>
                                {isEnglish ? "Yes:" : "हाँ:"} {constituency.satisfactionYes || 0}
                              </span>
                              <span>
                                {isEnglish ? "No:" : "ना:"} {constituency.satisfactionNo || 0}
                              </span>
                              <span>
                                {isEnglish ? "Total:" : "कुल:"} {constituency.satisfactionTotal || 0}
                              </span>
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

                      {/* Manifesto Score Section */}
                      <div className="mb-4">
                        <div className="text-sm text-gray-700 mb-2">
                          {isEnglish
                            ? "Manifesto Promise Score:"
                            : "घोषणापत्र वादा स्कोर:"} {constituency.manifestoScore || 0}/5
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{
                              width: `${constituency.manifestoScore*20 || 0}%`,
                            }}
                          ></div>
                        </div>
                      </div>

                      {/* Recent Activity */}
                      <div className="flex items-center space-x-2 mb-4">
                        <div className="w-4 h-4 bg-blue-600 rounded-full"></div>
                        <div className="flex-1">
                          <div className="text-sm text-gray-700">
                            {isEnglish
                              ? constituency.news.title.en
                              : constituency.news.title.hi}
                          </div>
                          <div className="text-xs text-gray-500">
                            {constituency.news.date
                              ? isEnglish
                                ? "2 days ago"
                                : "2 दिन पहले"
                              : isEnglish
                                ? "Recent"
                                : "हाल ही में"}
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleConstituencySelect(constituency)}
                          className="flex-1 bg-gray-800 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
                        >
                          {isEnglish ? "View Details" : "विस्तार से देखे"}
                        </button>
                        <button
                          onClick={() => handleShare(constituency)}
                          className="w-10 h-10 bg-white text-gray-600 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors flex items-center justify-center"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
            {/* Load More Button */}
            <div className="flex items-center justify-center mb-2 lg:mb-4">
              <button
                className="bg-[#7b8a95] text-white px-4 py-2 rounded-md flex items-center gap-2"
                onClick={() =>
                  navigate("/constituency/all-constituencies?showAll=true")
                }
              >
                {isEnglish ? "See All Candidates" : "सभी उम्मीदवार देखे"}{" "}
                <ArrowRight className="h-4 w-4" />
              </button>
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
        showCloseButton={popup.type !== "success"}
      />
    </div>
  );
}
