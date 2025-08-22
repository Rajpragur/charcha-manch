import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase } from '../configs/supabase';
import { 
  Search, 
  MapPin, 
  User, 
  TrendingUp, 
  Users, 
  Calendar,
  MessageCircle,
  Star,
  Share2,
  Loader2,
  RefreshCw
} from 'lucide-react';
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
    date?: string;
  }>;
}

interface ConstituencyData {
  id: string;
  profileImage: string | undefined;
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
  criminalCases: number;
  netWorth: number;
  attendance: string;
  questionsAsked: string;
  fundsUtilization: string;
  rawData: CandidateData;
}

interface GlobalStats {
  total_users: number;
  level1_users: number;
  level2_users: number;
  level3_users: number;
  level4_users: number;
  total_constituencies: number;
}

const Home: React.FC = () => {
  const { isEnglish } = useLanguage();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedParty, setSelectedParty] = useState<string>('all');
  const [constituencies, setConstituencies] = useState<ConstituencyData[]>([]);
  const [globalStats, setGlobalStats] = useState<GlobalStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [visibleConstituencies, setVisibleConstituencies] = useState(6);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [userAchievements, setUserAchievements] = useState<any>(null);
  const [, setEnglishData] = useState<CandidateData[]>([]);
  const [, setHindiData] = useState<CandidateData[]>([]);

  // Load data on component mount
  useEffect(() => {
    loadGlobalStats();
    loadConstituencyData();
    if (currentUser) {
      loadUserProfile();
      loadUserAchievements();
    }
  }, [currentUser]);

  // Load global statistics (cached daily to minimize egress)
  const loadGlobalStats = async () => {
    try {
      // Try to load from Supabase first
      const { data: supabaseStats, error } = await supabase
        .from('global_stats')
        .select('*')
        .order('last_calculated', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Error loading global stats from Supabase:', error);
        // Fallback to 0 values
        setGlobalStats({
          total_users: 0,
          level1_users: 0,
          level2_users: 0,
          level3_users: 0,
          level4_users: 0,
          total_constituencies: 243
        });
      } else if (supabaseStats && supabaseStats.length > 0) {
        // Use real data from Supabase
        setGlobalStats({
          total_users: supabaseStats[0].total_users || 0,
          level1_users: supabaseStats[0].level1_users || 0,
          level2_users: supabaseStats[0].level2_users || 0,
          level3_users: supabaseStats[0].level3_users || 0,
          level4_users: supabaseStats[0].level4_users || 0,
          total_constituencies: supabaseStats[0].total_constituencies || 243
        });
      } else {
        // No data in Supabase, use 0 values
        setGlobalStats({
          total_users: 0,
          level1_users: 0,
          level2_users: 0,
          level3_users: 0,
          level4_users: 0,
          total_constituencies: 243
        });
      }
    } catch (err) {
      console.error('Error loading global stats:', err);
      // Fallback to 0 values
      setGlobalStats({
        total_users: 0,
        level1_users: 0,
        level2_users: 0,
        level3_users: 0,
        level4_users: 0,
        total_constituencies: 243
      });
    }
  };



  // Refresh constituency data from Supabase
  const refreshConstituencyData = async () => {
    try {
      // Load real-time data from Supabase
      const [satisfactionData, newsData, interactionData] = await Promise.all([
        supabase.from('satisfaction_surveys').select('*'),
        supabase.from('constituency_news').select('*'),
        supabase.from('constituency_charcha_stats').select('*')
      ]);

      // Update constituencies with real data
      setConstituencies(prev => prev.map(constituency => {
        const constituencyIndex = parseInt(constituency.id);
        const constituencyIdForSupabase = constituencyIndex + 1;
        
        // Get satisfaction data
        const constituencySatisfaction = satisfactionData.data?.filter(s => s.constituency_id === constituencyIdForSupabase);
        const satisfactionYes = constituencySatisfaction?.filter(s => s.answer === true).length || 0;
        const satisfactionNo = constituencySatisfaction?.filter(s => s.answer === false).length || 0;
        const satisfactionTotal = satisfactionYes + satisfactionNo;
        
        // Get interaction data
        const constituencyStats = interactionData.data?.find(s => s.constituency_id === constituencyIdForSupabase);
        const interactionCount = constituencyStats?.total_interactions || 0;
        
        // Get news data
        const constituencyNews = newsData.data?.find(n => n.constituency_id === constituencyIdForSupabase);
        
        return {
          ...constituency,
          satisfactionYes,
          satisfactionNo,
          satisfactionTotal,
          interactionCount,
          news: {
            title: {
              en: constituencyNews?.title || 'No news available',
              hi: constituencyNews?.title_hi || 'कोई समाचार उपलब्ध नहीं'
            },
            date: constituencyNews?.published_date || 'No recent news'
          }
        };
      }));
    } catch (err) {
      console.error('Error refreshing constituency data:', err);
    }
  };

  // Load constituency data from JSON files
  const loadConstituencyData = async () => {
    try {
      setIsLoading(true);
      
      // Load both English and Hindi data
      const [englishResponse, hindiResponse] = await Promise.all([
        fetch('/data/candidates_en.json'),
        fetch('/data/candidates.json')
      ]);

      const englishData: CandidateData[] = await englishResponse.json();
      const hindiData: CandidateData[] = await hindiResponse.json();

      console.log('Data loading debug:', {
        englishDataLength: englishData.length,
        hindiDataLength: hindiData.length,
        englishSample: englishData.slice(0, 3).map(c => c.area_name),
        hindiSample: hindiData.slice(0, 3).map(c => c.area_name)
      });

      setEnglishData(englishData);
      setHindiData(hindiData);

      // Load real-time data from Supabase
      const [satisfactionData, interactionData, newsData] = await Promise.all([
        supabase.from('satisfaction_surveys').select('*'),
        supabase.from('constituency_charcha_stats').select('*'),
        supabase.from('constituency_news').select('*')
      ]);

      // Transform data to constituency format with real Supabase data
      const transformedConstituencies = englishData.map((candidate, index) => {
        // Find matching Hindi data by area name instead of index to ensure accuracy
        const hindiCandidate = hindiData.find(h => h.area_name === candidate.area_name) || candidate;
        
        // Debug matching process
        if (index < 3) {
          console.log(`Matching constituency ${index}:`, {
            englishArea: candidate.area_name,
            hindiArea: hindiCandidate.area_name,
            matched: hindiCandidate.area_name === candidate.area_name
          });
        }
        
        const constituencyIdForSupabase = index + 1;
        
        // Get real satisfaction data from Supabase
        const constituencySatisfaction = satisfactionData.data?.filter(s => s.constituency_id === constituencyIdForSupabase);
        const satisfactionYes = constituencySatisfaction?.filter(s => s.answer === true).length || 0;
        const satisfactionNo = constituencySatisfaction?.filter(s => s.answer === false).length || 0;
        const satisfactionTotal = satisfactionYes + satisfactionNo;
        
        // Get real interaction data from Supabase
        const constituencyStats = interactionData.data?.find(s => s.constituency_id === constituencyIdForSupabase);
        const interactionCount = constituencyStats?.total_interactions || 0;
        
        // Get real news data from Supabase
        const constituencyNews = newsData.data?.find(n => n.constituency_id === constituencyIdForSupabase);
        
        return {
          id: index.toString(),
          profileImage: hindiCandidate.vidhayak_info.image_url, // Always use Hindi data for images
          constituencyName: {
            en: candidate.area_name,
            hi: hindiCandidate.area_name
          },
          candidateName: {
            en: candidate.vidhayak_info.name,
            hi: hindiCandidate.vidhayak_info.name
          },
          partyName: {
            name: candidate.vidhayak_info.party_name,
            nameHi: hindiCandidate.vidhayak_info.party_name,
            color: getPartyColor(candidate.vidhayak_info.party_name)
          },
          experience: {
            en: candidate.vidhayak_info.experience,
            hi: hindiCandidate.vidhayak_info.experience
          },
          education: {
            en: candidate.vidhayak_info.metadata.education,
            hi: hindiCandidate.vidhayak_info.metadata.education
          },
          satisfactionYes,
          satisfactionNo,
          satisfactionTotal,
          news: {
            title: {
              en: constituencyNews?.title || 'No news available',
              hi: constituencyNews?.title_hi || 'कोई समाचार उपलब्ध नहीं'
            },
            date: constituencyNews?.published_date || 'No recent news'
          },
          manifestoScore: candidate.vidhayak_info.manifesto_score || 0,
          interactionCount,
          criminalCases: candidate.vidhayak_info.metadata.criminal_cases || 0,
          netWorth: candidate.vidhayak_info.metadata.net_worth || 0,
          attendance: candidate.vidhayak_info.metadata.attendance || 'N/A',
          questionsAsked: candidate.vidhayak_info.metadata.questions_asked || 'N/A',
          fundsUtilization: candidate.vidhayak_info.metadata.funds_utilisation || 'N/A',
          rawData: candidate
        };
      });

      setConstituencies(transformedConstituencies);
    } catch (err) {
      console.error('Error loading constituency data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Load user profile
  const loadUserProfile = async () => {
    try {
      // Try to load from Supabase first
      const { data: profileData, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', currentUser?.uid)
        .single();

      if (error) {
        console.error('Error loading user profile from Supabase:', error);
        // Fallback to basic user info
        setUserProfile({
          id: currentUser?.uid || 'mock-user',
          display_name: currentUser?.displayName || 'User',
          bio: 'Active member of Charcha Manch',
          first_vote_year: null,
          referral_code: 'CHM' + Math.random().toString(36).substr(2, 6).toUpperCase(),
          level: 'Tier 1',
          participation_score: 0
        });
      } else if (profileData) {
        // Use real data from Supabase
        setUserProfile({
          id: profileData.id,
          display_name: profileData.display_name || currentUser?.displayName || 'User',
          bio: profileData.bio || 'Active member of Charcha Manch',
          first_vote_year: profileData.first_vote_year,
          referral_code: profileData.referral_code || 'CHM' + Math.random().toString(36).substr(2, 6).toUpperCase(),
          level: 'Tier 1', // Everyone starts at Tier 1
          participation_score: profileData.participation_score || 0
        });
      } else {
        // No profile data, create basic info
        setUserProfile({
          id: currentUser?.uid || 'mock-user',
          display_name: currentUser?.displayName || 'User',
          bio: 'Active member of Charcha Manch',
          first_vote_year: null,
          referral_code: 'CHM' + Math.random().toString(36).substr(2, 6).toUpperCase(),
          level: 'Tier 1', // Everyone starts at Tier 1
          participation_score: 0
        });
      }
    } catch (err) {
      console.error('Error loading user profile:', err);
      // Fallback to basic user info
      setUserProfile({
        id: currentUser?.uid || 'mock-user',
        display_name: currentUser?.displayName || 'User',
        bio: 'Active member of Charcha Manch',
        first_vote_year: null,
        referral_code: 'CHM' + Math.random().toString(36).substr(2, 6).toUpperCase(),
        level: 'Tier 1', // Everyone starts at Tier 1
        participation_score: 0
      });
    }
  };

  // Load user achievements
  const loadUserAchievements = async () => {
    try {
      if (!currentUser?.uid) {
        setUserAchievements({
          charchaonBhagidari: 0,
          naiCharchaPehel: 0,
          nagrikPrerak: 0
        });
        return;
      }

      // Try to load from Supabase
      const [interactionsResult, postsResult, referralsResult] = await Promise.all([
        supabase.from('constituency_interactions').select('*').eq('user_id', currentUser.uid),
        supabase.from('discussion_posts').select('*').eq('user_id', currentUser.uid),
        supabase.from('referrals').select('*').eq('referred_by', currentUser.uid)
      ]);

      // Calculate achievements from real data
      const charchaonBhagidari = interactionsResult.data?.filter(i => 
        ['survey', 'view', 'share'].includes(i.interaction_type)
      ).length || 0;

      const naiCharchaPehel = postsResult.data?.length || 0;
      const nagrikPrerak = referralsResult.data?.length || 0;

      setUserAchievements({
        charchaonBhagidari,
        naiCharchaPehel,
        nagrikPrerak
      });
    } catch (err) {
      console.error('Error loading user achievements:', err);
      // Fallback to 0 values
      setUserAchievements({
        charchaonBhagidari: 0,
        naiCharchaPehel: 0,
        nagrikPrerak: 0
      });
    }
  };

  // Filtered and sorted constituencies - ALWAYS search in English data
  const filteredAndSortedConstituencies = useMemo(() => {
    let filtered = constituencies;
    
    // Apply party filter first
    if (selectedParty !== 'all') {
      filtered = filtered.filter(constituency => 
        constituency.partyName.nameHi === selectedParty
      );
    }
    
    if (searchQuery.trim()) {
      const searchLower = searchQuery.toLowerCase();
      console.log('Searching for:', searchLower);
      
      // Search in English data but maintain the same order
      filtered = filtered.filter(constituency => {
        const constituencyMatch = constituency.constituencyName.en.toLowerCase().includes(searchLower);
        const candidateMatch = constituency.candidateName.en.toLowerCase().includes(searchLower);
        const partyMatch = constituency.partyName.name.toLowerCase().includes(searchLower);
        
        if (constituencyMatch || candidateMatch || partyMatch) {
          console.log('Match found:', {
            constituency: constituency.constituencyName.en,
            candidate: constituency.candidateName.en,
            party: constituency.partyName.name,
            searchQuery: searchLower
          });
        }
        
        return constituencyMatch || candidateMatch || partyMatch;
      });
      
      console.log('Filtered results count:', filtered.length);
    }

    // Sort by real interaction count from Supabase (descending), then alphabetically by English name
    return filtered.sort((a, b) => {
      // Primary sort: by total interactions (highest first)
      if (b.interactionCount !== a.interactionCount) {
        return b.interactionCount - a.interactionCount;
      }
      // Secondary sort: alphabetically by English constituency name
      return a.constituencyName.en.localeCompare(b.constituencyName.en);
    });
  }, [constituencies, searchQuery, selectedParty]);

  // Handle search input
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    setShowDropdown(true);
    
    // Debug search input
    if (query.trim()) {
      console.log('Search input changed:', query);
      console.log('Available constituencies:', constituencies.slice(0, 5).map(c => ({
        en: c.constituencyName.en,
        hi: c.constituencyName.hi
      })));
    }
  };

  // Handle constituency selection from dropdown
  const handleConstituencySelect = (constituency: ConstituencyData) => {
    navigate(`/constituency/${constituency.constituencyName.en.toLowerCase().replace(/\s+/g, '-')}-${constituency.id}?id=${constituency.id}`);
    setShowDropdown(false);
    setSearchQuery('');
  };

  // Handle share with Facebook and WhatsApp options
  const handleShare = async (constituency: ConstituencyData) => {
    const url = `${window.location.origin}/constituency/${constituency.constituencyName.en.toLowerCase().replace(/\s+/g, '-')}-${constituency.id}?id=${constituency.id}`;
    const title = `Check out ${constituency.constituencyName.en} constituency on Charcha Manch`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          url: url
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      // Show custom share options
      showShareOptions(url, title);
    }
  };

  // Show custom share options (Facebook, WhatsApp, Copy)
  const showShareOptions = (url: string, title: string) => {
    const shareData = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(title + ' ' + url)}`,
      copy: url
    };

    // Create share modal
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
      <div class="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
        <h3 class="text-lg font-semibold mb-4">${isEnglish ? 'Share via' : 'शेयर करें'}</h3>
        <div class="space-y-3">
          <button onclick="window.open('${shareData.facebook}', '_blank')" class="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
            Facebook
          </button>
          <button onclick="window.open('${shareData.whatsapp}', '_blank')" class="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors">
            WhatsApp
          </button>
          <button onclick="navigator.clipboard.writeText('${url}'); alert('${isEnglish ? 'Link copied!' : 'लिंक कॉपी हो गया!'}'); this.parentElement.parentElement.parentElement.remove();" class="w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors">
            ${isEnglish ? 'Copy Link' : 'लिंक कॉपी करें'}
          </button>
          <button onclick="this.parentElement.parentElement.parentElement.remove()" class="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors">
            ${isEnglish ? 'Cancel' : 'रद्द करें'}
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  };

  // Track constituency interaction
  const trackInteraction = async (constituencyId: string, interactionType: string) => {
    if (!currentUser) return; // Only track for authenticated users
    
    try {
      const constituencyIndex = parseInt(constituencyId);
      const constituencyIdForSupabase = constituencyIndex + 1; // Convert to 1-based index

      // Generate a proper UUID for user_id if currentUser.uid is not valid
      let userId = currentUser.uid;
      if (!userId || userId.length !== 36) {
        // Generate a random UUID if the current one is invalid
        userId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          const r = Math.random() * 16 | 0;
          const v = c === 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
      }

      // Insert interaction into Supabase
      const { error: interactionError } = await supabase
        .from('constituency_interactions')
        .insert({
          constituency_id: constituencyIdForSupabase,
          interaction_type: interactionType,
          user_id: userId
        });

      if (interactionError) {
        console.error('Error inserting interaction:', interactionError);
        return;
      }

      // Update constituency_charcha_stats table
      const { error: statsError } = await supabase
        .from('constituency_charcha_stats')
        .upsert({
          constituency_id: constituencyIdForSupabase,
          total_interactions: 1, // Will be updated by trigger
          active_post_count: 0
        }, {
          onConflict: 'constituency_id'
        });

      if (statsError) {
        console.error('Error updating stats:', statsError);
      }

      // Update local interaction count
      setConstituencies(prev => prev.map(constituency => {
        if (constituency.id === constituencyId) {
          return {
            ...constituency,
            interactionCount: constituency.interactionCount + 1
          };
        }
        return constituency;
      }));

      console.log(`Interaction tracked: ${interactionType} for constituency ${constituencyIdForSupabase}`);
      
      // Refresh data to show real-time updates
      setTimeout(() => {
        refreshConstituencyData();
      }, 1000); // Small delay to ensure Supabase has processed the data
    } catch (err) {
      console.error('Error tracking interaction:', err);
    }
  };

  // Submit satisfaction survey
  const submitSatisfactionSurvey = async (constituencyId: string, answer: boolean) => {
    if (!currentUser) {
      alert(isEnglish ? 'Please sign in to submit your response' : 'कृपया अपनी प्रतिक्रिया देने के लिए साइन इन करें');
      return;
    }

    try {
      const constituencyIndex = parseInt(constituencyId);
      const constituencyIdForSupabase = constituencyIndex + 1; // Convert to 1-based index

      // Generate a proper UUID for user_id if currentUser.uid is not valid
      let userId = currentUser.uid;
      if (!userId || userId.length !== 36) {
        // Generate a random UUID if the current one is invalid
        userId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          const r = Math.random() * 16 | 0;
          const v = c === 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
      }

      // Insert into Supabase
      const { error } = await supabase
        .from('satisfaction_surveys')
        .upsert({
          constituency_id: constituencyIdForSupabase,
          user_id: userId,
          question: 'Are you satisfied with your tenure of last 5 years?',
          answer: answer
        });

      if (error) throw error;

      // Track interaction
      await trackInteraction(constituencyId, 'survey');

      // Update local state
      setConstituencies(prev => prev.map(constituency => {
        if (constituency.id === constituencyId) {
          const newSatisfactionYes = constituency.satisfactionYes + (answer ? 1 : 0);
          const newSatisfactionNo = constituency.satisfactionNo + (answer ? 0 : 1);
          const newTotal = newSatisfactionYes + newSatisfactionNo;
          
          return {
            ...constituency,
            satisfactionYes: newSatisfactionYes,
            satisfactionNo: newSatisfactionNo,
            satisfactionTotal: newTotal
          };
        }
        return constituency;
      }));



      // Show success message
      alert(isEnglish ? 'Thank you for your response!' : 'आपकी प्रतिक्रिया के लिए धन्यवाद!');
    } catch (err) {
      console.error('Error submitting satisfaction survey:', err);
      alert(isEnglish ? 'Error submitting response. Please try again.' : 'प्रतिक्रिया जमा करने में त्रुटि। कृपया पुनः प्रयास करें।');
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

  const content = {
    title: {
      en: 'Welcome to Charcha Manch',
      hi: 'चर्चा मंच में आपका स्वागत है'
    },
    subtitle: {
      en: 'Your voice matters in democracy. Join the conversation about your constituency.',
      hi: 'लोकतंत्र में आपकी आवाज मायने रखती है। अपने निर्वाचन क्षेत्र के बारे में बातचीत में शामिल हों।'
    },
    searchPlaceholder: {
      en: 'Search constituencies, candidates, or parties...',
      hi: 'निर्वाचन क्षेत्र, उम्मीदवार, या पार्टियां खोजें...'
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-slate-700 via-slate-800 to-slate-900 text-white py-12 sm:py-16 px-4 w-full">
        <div className="w-full max-w-none mx-auto">
          <div className="text-center">
            <div className="grid grid-cols-2 gap-6 md:gap-20 items-center mb-6 sm:mb-8">
              <div className="flex justify-end mx-">
                <img 
                  src="/images/biharmap.png" 
                  alt="Bihar Map"
                  className="w-15 h-15 lg:w-40 lg:h-40 md:w-30 md:h-30 sm:w-28 sm:h-28 rounded-full object-cover"
                />
              </div>
              <div className="text-center">
                <h1 className="text-3xl max-[340px]:text-2xl sm:text-4xl md:text-6xl font-bold leading-tight text-left">{isEnglish ? 'Your Electoral' : 'जनता का'}</h1>
                <h1 className="text-3xl max-[340px]:text-2xl sm:text-4xl md:text-6xl font-bold leading-tight text-left">{isEnglish ? '' : 'चुनावी'} <span className="text-red-400">{isEnglish ? 'Companion' : 'साथी'}</span></h1>
              </div>
              <div className="text-center">
                <p className="text-base max-[400px]:text-xs max-[330px]:text-[8px] sm:text-lg md:text-xl font-medium text-right">{isEnglish ? 'Who has done what work' : 'किसने किया है कैसा काम'}</p>
                <p className="text-base max-[400px]:text-xs max-[330px]:text-[8px] sm:text-lg md:text-xl font-medium text-right">{isEnglish ? 'Let\'s discuss' : 'आओ करें चर्चाग्राम'}</p>
              </div>
              <div className="flex justify-left">
                <img 
                  src="/images/golghar.png" 
                  alt="Golghar"
                  className="w-15 h-15 lg:w-40 lg:h-40 md:w-30 md:h-30 sm:w-28 sm:h-28 rounded-full object-cover"
                />
              </div>
            </div>
            
            {/* Enhanced Search Dropdown */}
            <div className="relative max-w-lg sm:max-w-lg mx-auto">
              <div className="flex">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder={content.searchPlaceholder[isEnglish ? 'en' : 'hi']}
                    value={searchQuery}
                    onChange={handleSearchChange}
                    onFocus={() => setShowDropdown(true)}
                    onClick={() => setShowDropdown(true)}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-l-lg text-slate-900 bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm sm:text-base placeholder-slate-500 cursor-pointer"
                  />
                  <MapPin className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                </div>
                <button 
                  className="bg-green-600 hover:bg-green-700 px-4 sm:px-6 py-2 sm:py-3 rounded-r-lg transition-colors border border-green-600 hover:border-green-700"
                  onClick={() => setShowDropdown(!showDropdown)}
                >
                  <Search className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </button>
              </div>

              {/* Enhanced Dropdown Menu - Always show when there's content */}
              {(showDropdown && (searchQuery.trim() || constituencies.length > 0)) && (
                <div className="absolute top-full left-0 right-0 bg-white border border-slate-200 rounded-lg shadow-lg mt-1 max-h-60 overflow-y-auto z-50">
                  {filteredAndSortedConstituencies.length > 0 ? (
                    filteredAndSortedConstituencies.slice(0, 20).map((constituency) => (
                      <button
                        key={constituency.id}
                        onClick={() => handleConstituencySelect(constituency)}
                        className="w-full text-left px-4 py-3 hover:bg-green-50 border-b border-slate-100 last:border-b-0 text-sm text-slate-900 transition-colors"
                      >
                        <div className="font-medium">
                          {isEnglish ? constituency.constituencyName.en : constituency.constituencyName.hi}
                        </div>
                        <div className="text-xs text-slate-500">
                          {isEnglish ? constituency.candidateName.en : constituency.candidateName.hi} - {isEnglish ? constituency.partyName.name : constituency.partyName.nameHi}
                        </div>
                      </button>
                    ))
                  ) : searchQuery.trim() ? (
                    <div className="px-4 py-3 text-sm text-slate-500">
                      {isEnglish ? 'No constituencies found' : 'कोई निर्वाचन क्षेत्र नहीं मिला'}
                    </div>
                  ) : (
                    // Show initial constituencies when no search query
                    constituencies.slice(0, 10).map((constituency) => (
                      <button
                        key={constituency.id}
                        onClick={() => handleConstituencySelect(constituency)}
                        className="w-full text-left px-4 py-3 hover:bg-green-50 border-b border-slate-100 last:border-b-0 text-sm text-slate-900 transition-colors"
                      >
                        <div className="font-medium">
                          {isEnglish ? constituency.constituencyName.en : constituency.constituencyName.hi}
                        </div>
                        <div className="text-xs text-slate-500">
                          {isEnglish ? constituency.candidateName.en : constituency.candidateName.hi} - {isEnglish ? constituency.partyName.name : constituency.partyName.nameHi}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
              
              {/* Party Filter */}
              <div className="mt-4 max-w-lg sm:max-w-lg mx-auto">
                <select
                  value={selectedParty}
                  onChange={(e) => setSelectedParty(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm bg-white text-slate-900"
                >
                  <option value="all">{isEnglish ? 'All Parties' : 'सभी पार्टियां'}</option>
                  {Array.from(new Set(
                    constituencies.map(c => c.partyName.nameHi).filter(Boolean)
                  )).sort().map(party => (
                    <option key={party} value={party}>{party}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="text-center space-y-3 mt-6 max-w-4xl px-4">
              <p className="flex justify-center items-center gap-2">
                <span className="text-xl sm:text-2xl font-bold text-slate-50">
                  {!isEnglish ? "जाने" : "Know"}
                </span>
                <span className="text-sm sm:text-base text-slate-200">
                  {!isEnglish
                    ? "- उम्मीदवारों की सम्पत्ति, आपराधिक मामले और संसद में भागीदारी"
                    : "- The candidates' assets, criminal cases and participation in Parliament"}
                </span>
              </p>

              <p className="flex justify-center items-center gap-2">
                <span className="text-xl sm:text-2xl font-bold text-slate-50">
                  {!isEnglish ? "रखें" : "Share"}
                </span>
                <span className="text-sm sm:text-base text-slate-200">
                  {!isEnglish
                    ? "- वर्तमान और पूर्व उम्मीदवारों पर अपनी राय"
                    : "- Your views on current and past candidates"}
                </span>
              </p>

              <p className="flex justify-center items-center gap-2">
                <span className="text-xl sm:text-2xl font-bold text-slate-50">
                  {!isEnglish ? "करें" : "Do"}
                </span>
                <span className="text-sm sm:text-base text-slate-200">
                  {!isEnglish
                    ? "- जनसंवाद, सवाल-जवाब और जवाबदेही तय"
                    : "- Public dialogue, questions and answers, and fix accountability"}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Welcome Section for Authenticated Users */}
      {currentUser && userProfile && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-6 text-white">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                <User className="h-8 w-8" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-2">
                  {isEnglish ? 'Welcome back!' : 'वापसी पर स्वागत है!'}
                </h2>
                <p className="text-blue-100">
                  {isEnglish ? 'Continue your journey in democracy' : 'लोकतंत्र में अपनी यात्रा जारी रखें'}
                </p>
              </div>
              <Link
                to="/dashboard"
                className="bg-white text-blue-600 px-6 py-3 rounded-lg font-medium hover:bg-blue-50 transition-colors"
              >
                {isEnglish ? 'Go to Dashboard' : 'डैशबोर्ड पर जाएं'}
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Nagrik Yogdan Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            {isEnglish ? 'Nagrik Yogdan' : 'नागरिक योगदान'}
          </h2>
          <p className="text-gray-600">
            {isEnglish ? 'User engagement levels across constituencies' : 'निर्वाचन क्षेत्रों में उपयोगकर्ता जुड़ाव के स्तर'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { level: 1, name: 'Tier 1', color: 'from-blue-500 to-blue-600', users: globalStats?.level1_users || 0 },
            { level: 2, name: 'Tier 2', color: 'from-green-500 to-green-600', users: globalStats?.level2_users || 0 },
            { level: 3, name: 'Tier 3', color: 'from-yellow-500 to-yellow-600', users: globalStats?.level3_users || 0 },
            { level: 4, name: 'Tier 4', color: 'from-purple-500 to-purple-600', users: globalStats?.level4_users || 0 }
          ].map((tier) => (
            <div key={tier.level} className="bg-white rounded-xl shadow-lg p-6 text-center">
              <div className={`w-16 h-16 bg-gradient-to-r ${tier.color} rounded-full flex items-center justify-center mx-auto mb-4`}>
                <Star className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{tier.name}</h3>
              <div className="text-3xl font-bold text-gray-900 mb-1">{tier.users}</div>
              <div className="text-sm text-gray-600">
                {globalStats?.total_users ? Math.round((tier.users / globalStats.total_users) * 100) : 0}% of total users
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Achievement Section for Authenticated Users */}
      {currentUser && userAchievements && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              {isEnglish ? 'Your Achievements' : 'आपकी उपलब्धियां'}
            </h2>
            <p className="text-gray-600">
              {isEnglish ? 'Track your engagement and contributions' : 'अपने जुड़ाव और योगदान को ट्रैक करें'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { 
                title: 'Pehla Vote', 
                value: userProfile?.first_vote_year || 'Not set',
                icon: Calendar,
                color: 'from-red-500 to-red-600',
                description: 'First voting year'
              },
              { 
                title: 'Charchaon me Bhagidari', 
                value: userAchievements.charchaonBhagidari,
                icon: MessageCircle,
                color: 'from-blue-500 to-blue-600',
                description: 'Engagement in discussions'
              },
              { 
                title: 'Nai Charcha ki Pehel', 
                value: userAchievements.naiCharchaPehel,
                icon: TrendingUp,
                color: 'from-green-500 to-green-600',
                description: 'New posts initiated'
              },
              { 
                title: 'Nagrik Prerak', 
                value: userAchievements.nagrikPrerak,
                icon: Users,
                color: 'from-purple-500 to-purple-600',
                description: 'People referred'
              }
            ].map((achievement, index) => (
              <div key={index} className="bg-white rounded-xl shadow-lg p-6 text-center">
                <div className={`w-16 h-16 bg-gradient-to-r ${achievement.color} rounded-full flex items-center justify-center mx-auto mb-4`}>
                  <achievement.icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{achievement.title}</h3>
                <div className="text-3xl font-bold text-gray-900 mb-1">{achievement.value}</div>
                <div className="text-sm text-gray-600">{achievement.description}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Charchit Vidhan Sabha Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            {isEnglish ? 'Charchit Vidhan Sabha' : 'चर्चित विधान सभा'}
          </h2>
          <p className="text-gray-600 mb-2">
            {isEnglish ? 'Explore constituencies and their representatives' : 'निर्वाचन क्षेत्रों और उनके प्रतिनिधियों का अन्वेषण करें'}
          </p>
                      <div className="flex items-center space-x-4">
              <div className="inline-flex items-center space-x-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm">
                <TrendingUp className="h-4 w-4" />
                <span>
                  {isEnglish ? 'Sorted by interaction count (highest first)' : 'बातचीत की संख्या के अनुसार क्रमबद्ध (सर्वोच्च पहले)'}
                </span>
              </div>
              <button
                onClick={refreshConstituencyData}
                className="inline-flex items-center space-x-2 bg-green-50 text-green-700 px-4 py-2 rounded-full text-sm hover:bg-green-100 transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                <span>
                  {isEnglish ? 'Refresh Data' : 'डेटा रिफ्रेश करें'}
                </span>
              </button>
            </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-green-500 mx-auto mb-4" />
            <p className="text-gray-600">Loading constituencies...</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {filteredAndSortedConstituencies.slice(0, visibleConstituencies).map((constituency) => (
                <div key={constituency.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                  {/* Party Color Header */}
                  <div className={`${constituency.partyName.color} h-2`}></div>
                  
                  <div className="p-6">
                    {/* Candidate Info */}
                    <div className="flex items-center space-x-4 mb-4">
                      {constituency.profileImage ? (
                        <img 
                          src={constituency.profileImage} 
                          alt={isEnglish ? constituency.candidateName.en : constituency.candidateName.hi}
                          className="w-16 h-16 rounded-full object-cover"
                          onError={(e) => {
                            // Fallback to placeholder if image fails to load
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                      ) : null}
                      {!constituency.profileImage && (
                        <PlaceholderImages type="profile" size="md" />
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {isEnglish ? constituency.constituencyName.en : constituency.constituencyName.hi}
                        </h3>
                        <p className="text-sm text-gray-600 truncate">
                          {isEnglish ? constituency.candidateName.en : constituency.candidateName.hi}
                        </p>
                        <div className={`inline-block px-2 py-1 rounded-full text-xs font-medium text-white mt-1 ${constituency.partyName.color}`}>
                          {isEnglish ? constituency.partyName.name : constituency.partyName.nameHi}
                        </div>
                      </div>
                    </div>

                    {/* Key Details */}
                    <div className="space-y-3 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">{isEnglish ? 'Experience' : 'अनुभव'}</span>
                        <span className="font-medium">{isEnglish ? constituency.experience.en : constituency.experience.hi}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">{isEnglish ? 'Education' : 'शिक्षा'}</span>
                        <span className="font-medium">{isEnglish ? constituency.education.en : constituency.education.hi}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">{isEnglish ? 'Manifesto Score' : 'घोषणापत्र स्कोर'}</span>
                        <span className="font-medium">{constituency.manifestoScore || 0}%</span>
                      </div>
                    </div>

                    {/* Satisfaction Survey */}
                    <div className="bg-gray-50 rounded-lg p-3 mb-4">
                      <p className="text-sm text-gray-700 mb-2">
                        {isEnglish ? 'Are you satisfied with your tenure of last 5 years?' : 'क्या आप पिछले 5 वर्षों के कार्यकाल से संतुष्ट हैं?'}
                      </p>
                      {constituency.satisfactionTotal > 0 ? (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-green-600">
                              {isEnglish ? 'Yes' : 'हाँ'}: {constituency.satisfactionYes}
                            </span>
                            <span className="text-green-600 font-medium">
                              {Math.round((constituency.satisfactionYes / constituency.satisfactionTotal) * 100)}%
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-red-600">
                              {isEnglish ? 'No' : 'नहीं'}: {constituency.satisfactionNo}
                            </span>
                            <span className="text-red-600 font-medium">
                              {Math.round((constituency.satisfactionNo / constituency.satisfactionTotal) * 100)}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-green-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${(constituency.satisfactionYes / constituency.satisfactionTotal) * 100}%` }}
                            ></div>
                          </div>
                          <div className="text-xs text-gray-500 text-center">
                            {isEnglish ? 'Total responses' : 'कुल प्रतिक्रियाएं'}: {constituency.satisfactionTotal}
                          </div>
                        </div>
                      ) : (
                        <div className="text-xs text-gray-500 text-center">
                          {isEnglish ? 'No responses yet' : 'अभी तक कोई प्रतिक्रिया नहीं'}
                        </div>
                      )}
                      
                      {/* Interactive Yes/No Buttons */}
                      <div className="flex space-x-2 mt-3">
                        <button
                          onClick={() => submitSatisfactionSurvey(constituency.id, true)}
                          className="flex-1 bg-green-500 text-white py-2 px-3 rounded-lg hover:bg-green-600 transition-colors text-xs font-medium"
                        >
                          {isEnglish ? 'Yes' : 'हाँ'}
                        </button>
                        <button
                          onClick={() => submitSatisfactionSurvey(constituency.id, false)}
                          className="flex-1 bg-red-500 text-white py-2 px-3 rounded-lg hover:bg-red-600 transition-colors text-xs font-medium"
                        >
                          {isEnglish ? 'No' : 'नहीं'}
                        </button>
                      </div>
                    </div>

                    {/* Latest News */}
                    <div className="bg-blue-50 rounded-lg p-3 mb-4">
                      <p className="text-sm text-blue-800 font-medium mb-1">
                        {isEnglish ? 'Latest News' : 'ताजा समाचार'}
                      </p>
                      <p className="text-xs text-blue-700">
                        {isEnglish ? constituency.news.title.en : constituency.news.title.hi}
                      </p>
                      <p className="text-xs text-blue-600 mt-1">{constituency.news.date}</p>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                      <span>{isEnglish ? 'Total interactions' : 'कुल बातचीत'}: {constituency.interactionCount || 0}</span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-2">
                      <Link
                        to={`/constituency/${constituency.constituencyName.en.toLowerCase().replace(/\s+/g, '-')}-${constituency.id}?id=${constituency.id}`}
                        onClick={() => trackInteraction(constituency.id, 'view')}
                        className="flex-1 bg-green-600 text-white text-center py-2 px-4 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                      >
                        {isEnglish ? 'More Details' : 'अधिक विवरण'}
                      </Link>
                      <button
                        onClick={() => {
                          handleShare(constituency);
                          trackInteraction(constituency.id, 'share');
                        }}
                        className="bg-gray-100 text-gray-700 p-2 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        <Share2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Load More Button */}
            {visibleConstituencies < filteredAndSortedConstituencies.length && (
              <div className="text-center">
                <button
                  onClick={() => setVisibleConstituencies(prev => prev + 6)}
                  className="bg-green-600 text-white px-8 py-4 rounded-lg hover:bg-green-700 transition-colors font-medium text-lg"
                >
                  {isEnglish ? `Load More (${visibleConstituencies + 6} of ${filteredAndSortedConstituencies.length})` : `और लोड करें (${visibleConstituencies + 6} में से ${filteredAndSortedConstituencies.length})`}
                </button>
                <p className="text-sm text-gray-500 mt-2">
                  {isEnglish ? 'Showing constituencies sorted by interaction count' : 'निर्वाचन क्षेत्रों को बातचीत की संख्या के अनुसार क्रमबद्ध किया गया है'}
                </p>
              </div>
            )}

            {/* Total Count */}
            <div className="text-center mt-8 text-gray-600">
              {isEnglish 
                ? `Showing ${Math.min(visibleConstituencies, filteredAndSortedConstituencies.length)} of ${filteredAndSortedConstituencies.length} constituencies`
                : `${filteredAndSortedConstituencies.length} में से ${Math.min(visibleConstituencies, filteredAndSortedConstituencies.length)} निर्वाचन क्षेत्र दिखा रहे हैं`
              }
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Home;
