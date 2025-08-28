import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import FirebaseService from '../services/firebaseService';
import CharchitVidhanSabha from '../components/CharchitVidhanSabha';
import { 
  Search, 
  MapPin,
  House,
  MessageCircle,
  Database
} from 'lucide-react';

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

interface UserProfile {
  id: string;
  display_name: string;
  bio: string;
  first_vote_year?: number | null;
  referral_code: string;
  level: string;
  participation_score: number;
  tier_level: number; // 0, 1, 2, 3, 4
  constituency_id?: number;
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
  const [selectedParty, ] = useState<string>('all');
  const [constituencies, setConstituencies] = useState<ConstituencyData[]>([]);
  const [, setGlobalStats] = useState<GlobalStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitializing, setIsInitializing] = useState(false);

  const [, setUserProfile] = useState<UserProfile | null>(null);
  const [, setUserAchievements] = useState<any>(null);
  const [, setEnglishData] = useState<CandidateData[]>([]);
  const [, setHindiData] = useState<CandidateData[]>([]);
  const [userSurveys, setUserSurveys] = useState<Set<string>>(new Set());




  // Ref for dropdown to handle click outside
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Handle click outside dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const [popup, setPopup] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info'
  });

  // Initialize constituency scores on every component mount (including refresh)
  useEffect(() => {
    const initializeDatabase = async () => {
      try {
        await initializeConstituencyScores();
      } catch (error) {
        console.error('Error initializing constituency scores:', error);
      }
    };

    initializeDatabase();
  }, []); // Empty dependency array - runs on every mount

  // Load data on component mount - completely automatic database initialization
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        
        // Load other data
        await Promise.all([
          loadGlobalStats(),
          loadConstituencyData(),
          loadUserProfile(),
          loadUserAchievements()
        ]);
        
        // Load user votes from Firebase if user is authenticated
        if (currentUser) {
          await loadUserVotesFromFirebase();
        }
        
      } catch (error) {
        console.error('Error loading data:', error);
        
        // If there's an error, log it but don't re-initialize (could cause infinite loop)
        console.error('Error in data loading, skipping database re-initialization to prevent infinite loop');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [currentUser]);

  // One-time cleanup function - can be called manually to fix database
  const performDatabaseCleanup = async () => {
    try {
      setIsLoading(true);
      
      // Clean up duplicates first
      await FirebaseService.cleanupDuplicateConstituencyScores();
      
      // Then initialize any missing constituencies
      await FirebaseService.initializeConstituencyScores();
      
      // Clear cache and reload
      localStorage.removeItem('constituencyScoresCache');
      await loadConstituencyScoresFromDatabase();
      
      showPopup(
        isEnglish ? 'Database Cleaned' : 'डेटाबेस साफ किया गया',
        isEnglish ? 'Database has been cleaned up and optimized.' : 'डेटाबेस साफ और अनुकूलित किया गया है।',
        'success'
      );
    } catch (error) {
      console.error('Error during database cleanup:', error);
      showPopup(
        isEnglish ? 'Cleanup Failed' : 'सफाई विफल',
        isEnglish ? 'Failed to clean up database. Please try again.' : 'डेटाबेस साफ करने में विफल। कृपया पुनः प्रयास करें।',
        'error'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Make cleanup function available globally for manual console execution
  useEffect(() => {
    // @ts-ignore
    window.cleanupDatabase = performDatabaseCleanup;
    // @ts-ignore
    window.FirebaseService = FirebaseService;
   }, []);

  // Load user votes when currentUser changes (login/logout)
  useEffect(() => {
    if (currentUser) {
      loadUserVotesFromFirebase();
    } else {
      // Clear user votes when user logs out
      setUserSurveys(new Set());
    }
  }, [currentUser]);

  // Popup helper functions
  const showPopup = (title: string, message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setPopup({
      isOpen: true,
      title,
      message,
      type
    });
  };

  const closePopup = () => {
    setPopup(prev => ({ ...prev, isOpen: false }));
  };

  // Auto-close success popups after 3 seconds
  useEffect(() => {
    if (popup.isOpen && popup.type === 'success') {
      const timer = setTimeout(() => {
        closePopup();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [popup.isOpen, popup.type]);

  // Load global statistics (cached daily to minimize egress)
  const loadGlobalStats = async () => {
    try {
      const stats = await FirebaseService.getGlobalStats();
      if (stats) {
        setGlobalStats({
          total_users: stats.total_users || 0,
          level1_users: stats.level1_users || 0,
          level2_users: stats.level2_users || 0,
          level3_users: stats.level3_users || 0,
          level4_users: stats.level4_users || 0,
          total_constituencies: stats.total_constituencies || 243
        });
      } else {
        // No data in Firebase, use 0 values
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
      setEnglishData(englishData);
      setHindiData(hindiData);

      // Load constituency scores from Firebase database
      await loadConstituencyScoresFromDatabase();

      // Transform data into ConstituencyData format
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
              en: 'No news available',
              hi: 'कोई समाचार उपलब्ध नहीं'
            },
            date: 'No date available'
          },
          age: candidate.vidhayak_info.age,
          manifestoScore: 0, // Set to 0 as per requirement - will be developed later
          interactionCount: 0, // Will be updated from database
          activePostCount: 0, // Set to 0 as per requirement - will be developed later
          criminalCases: candidate.vidhayak_info.metadata.criminal_cases,
          netWorth: candidate.vidhayak_info.metadata.net_worth,
          attendance: candidate.vidhayak_info.metadata.attendance,
          questionsAsked: candidate.vidhayak_info.metadata.questions_asked,
          fundsUtilization: candidate.vidhayak_info.metadata.funds_utilisation,
          rawData: candidate
        };
      });

      setConstituencies(transformedData);
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading constituency data:', error);
      setIsLoading(false);
    }
  };

  // Initialize constituency scores in database if they don't exist
  const initializeConstituencyScores = async () => {
    // Prevent multiple simultaneous initializations
    if (isInitializing) {
      return;
    }
    
    try {
      setIsInitializing(true);
      
      // Try to load scores first
      const scores = await FirebaseService.getAllConstituencyScores();
      
      // Check if we have valid constituency scores (1-243)
      const validConstituencies = scores.filter(score => 
        score.constituency_id >= 1 && 
        score.constituency_id <= 243 && 
        score.constituency_id === Math.floor(score.constituency_id) // Ensure it's an integer
      );
      
      
      // If we have more than 243 scores, there are duplicates - clean them up first
      if (scores.length > 243) {
        await FirebaseService.cleanupDuplicateConstituencyScores();
        
        // Reload scores after cleanup
        const cleanedScores = await FirebaseService.getAllConstituencyScores();
        const cleanedValidConstituencies = cleanedScores.filter(score => 
          score.constituency_id >= 1 && 
          score.constituency_id <= 243 && 
          score.constituency_id === Math.floor(score.constituency_id)
        );
        
        
        if (cleanedValidConstituencies.length < 243) {
          await FirebaseService.initializeConstituencyScores();
        }
      } else if (validConstituencies.length < 243) {
        await FirebaseService.initializeConstituencyScores();
      } else {
      }
      
      // Clear cache and reload scores
      localStorage.removeItem('constituencyScoresCache');
      await loadConstituencyScoresFromDatabase();
      
      if (scores.length > 243) {
        // Don't show popup for automatic cleanup - it's seamless
      }
    } catch (error) {
      console.error('❌ Error initializing constituency scores:', error);
      
      // Only try to initialize if there's a real error, not just permission issues
      if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string' && !error.message.includes('permission')) {
        try {
          await FirebaseService.initializeConstituencyScores();
          localStorage.removeItem('constituencyScoresCache');
          await loadConstituencyScoresFromDatabase();
        } catch (retryError) {
          console.error('❌ Failed to initialize database on retry:', retryError);
          // Don't show error popup for automatic initialization - just log it
        }
              } else {
          // Try to load existing data anyway
          await loadConstituencyScoresFromDatabase();
        }
      } finally {
        setIsInitializing(false);
      }
    };

  // Load constituency scores from Firebase database with local caching
  const loadConstituencyScoresFromDatabase = async () => {
    try {
      
      // Check cache first
      const cacheKey = 'constituencyScoresCache';
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        try {
          const cacheData = JSON.parse(cached);
          const now = Date.now();
          
          // Cache is valid for 5 minutes
          if (now < cacheData.expiresAt) {
            
            // Update constituencies with cached scores
            setConstituencies(prev => {
              const updated = prev.map((constituency) => {
                const score = cacheData.scores.find((s: any) => s.constituency_id === parseInt(constituency.id) + 1);
                if (score) {
                  return {
                    ...constituency,
                    satisfactionYes: score.satisfaction_yes || 0,
                    satisfactionNo: score.satisfaction_no || 0,
                    satisfactionTotal: score.satisfaction_total || 0,
                    interactionCount: score.interaction_count || 0,
                    manifestoScore: score.manifesto_average || 0
                  };
                }
                return constituency;
              });
              return updated;
            });
            
            return; // Use cached data, don't fetch from Firebase
          }
        } catch (cacheError) {
          console.warn('⚠️ Cache corrupted, clearing and fetching fresh data:', cacheError);
          localStorage.removeItem(cacheKey);
        }
      }
      
      // Load constituency data including satisfaction votes for Charchit Vidhan Sabha
      const constituencyData = await FirebaseService.getConstituencyDataWithSatisfaction();
      // Try to cache the data (but don't fail if storage is full)
      try {
        const cacheData = {
          scores: constituencyData,
          timestamp: Date.now(),
          expiresAt: Date.now() + (5 * 60 * 1000) // Cache for 5 minutes
        };
        localStorage.setItem(cacheKey, JSON.stringify(cacheData));
      } catch (storageError) {
        console.warn('⚠️ Failed to cache constituency data (storage full):', storageError);
        // Continue without caching
      }
      
      // Update constituencies with data from database including satisfaction votes
      setConstituencies(prev => {
        const updated = prev.map((constituency) => {
          // Find data for this constituency
          const data = constituencyData.find(d => d.constituency_id === parseInt(constituency.id) + 1);
          if (data) {
            return {
              ...constituency,
              satisfactionYes: data.satisfaction_yes || 0,
              satisfactionNo: data.satisfaction_no || 0,
              satisfactionTotal: data.satisfaction_total || 0,
              interactionCount: data.interaction_count || 0,
              manifestoScore: data.manifesto_average || 0
            };
          }
          return constituency;
        });
        
        // Sort constituencies by interaction count immediately after updating
        const sorted = updated.sort((a, b) => {
          // Primary sort: by total interactions (highest first)
          if (b.interactionCount !== a.interactionCount) {
            return b.interactionCount - a.interactionCount;
          }
          // Secondary sort: alphabetically by English constituency name
          return a.constituencyName.en.localeCompare(b.constituencyName.en);
        });
        
        
        return sorted;
      });
      
    } catch (error) {
      console.error('❌ Error loading constituency scores from database:', error);
      // Continue with default values if database loading fails
    }
  };


  // Load user profile
  const loadUserProfile = async () => {
    try {
      if (!currentUser?.uid) return;
      
      const profile = await FirebaseService.getUserProfile(currentUser.uid);
      if (profile) {
        // Calculate current engagement score based on achievements
        const { surveys } = await FirebaseService.loadUserInteractions(currentUser.uid);
        const posts = await FirebaseService.getUserPosts(currentUser.uid);
        const referrals = await FirebaseService.getUserReferrals(currentUser.uid);
        
        // Calculate engagement score: surveys (5 points each) + posts (10 points each) + referrals (15 points each)
        const engagementScore = (surveys.length * 5) + (posts.length * 10) + (referrals.length * 15);
        
        // Update user tier in database if score has changed
        if (profile.engagement_score !== engagementScore) {
          await FirebaseService.updateUserTier(currentUser.uid, engagementScore);
        }
        
        // Get updated profile with new tier
        const updatedProfile = await FirebaseService.getUserProfile(currentUser.uid);
        const currentTier = updatedProfile?.tier_level || 1;
        
        setUserProfile({
          id: profile.id,
          display_name: profile.display_name || currentUser?.displayName || 'User',
          bio: profile.bio || 'Active member of Charcha Manch',
          first_vote_year: profile.first_vote_year,
          referral_code: profile.referral_code || 'CHM' + Math.random().toString(36).substr(2, 6).toUpperCase(),
          level: `Tier ${currentTier}`,
          participation_score: engagementScore,
          tier_level: currentTier
        });
      } else {
        // No profile data, create basic info
        const engagementScore = 0;
        const tierLevel = 0; // Start at tier 0
        
        // Create user profile in database
        await FirebaseService.createUserProfile(currentUser.uid, {
          display_name: currentUser?.displayName || 'User',
          bio: 'Active member of Charcha Manch',
          tier_level: tierLevel,
          engagement_score: engagementScore
        });
        
        setUserProfile({
          id: currentUser?.uid || 'mock-user',
          display_name: currentUser?.displayName || 'User',
          bio: 'Active member of Charcha Manch',
          first_vote_year: null,
          referral_code: 'CHM' + Math.random().toString(36).substr(2, 6).toUpperCase(),
          level: `Tier ${tierLevel}`,
          participation_score: engagementScore,
          tier_level: tierLevel
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
        level: 'Tier 0',
        participation_score: 0,
        tier_level: 0
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

      // Load from Firebase
      const { surveys } = await FirebaseService.loadUserInteractions(currentUser.uid);
      const posts = await FirebaseService.getUserPosts(currentUser.uid);
      const referrals = await FirebaseService.getUserReferrals(currentUser.uid);

      // Calculate achievements from real data
      const charchaonBhagidari = surveys.length; // For now, just count surveys

      const naiCharchaPehel = posts.length;
      const nagrikPrerak = referrals.length;

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
      
      // Search in English data but maintain the same order
      filtered = filtered.filter(constituency => {
        const constituencyMatch = constituency.constituencyName.en.toLowerCase().includes(searchLower);
        const candidateMatch = constituency.candidateName.en.toLowerCase().includes(searchLower);
        const partyMatch = constituency.partyName.name.toLowerCase().includes(searchLower);

        
        return constituencyMatch || candidateMatch || partyMatch;
      });
      
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
      }
    } else {
      // Show custom share options
      showShareOptions(url, title);
    }
  };

  // Show custom share options (Facebook, WhatsApp, Copy, Twitter)
  const showShareOptions = (url: string, title: string) => {
    const shareData = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(title + ' ' + url)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
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
          <button onclick="window.open('${shareData.twitter}', '_blank')" class="w-full bg-sky-500 text-white py-2 px-4 rounded-lg hover:bg-sky-600 transition-colors">
            Twitter
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


// Fixed submitSatisfactionSurvey function - properly saves to Firebase
const submitSatisfactionSurvey = async (constituencyId: string, answer: boolean) => {  
  if (!currentUser) {
    showPopup(
      isEnglish ? 'Authentication Required' : 'प्रमाणीकरण आवश्यक है',
      isEnglish ? 'Please sign in to submit your response' : 'कृपया अपनी प्रतिक्रिया देने के लिए साइन इन करें',
      'info'
    );
    return;
  }

  try {
    const constituencyIndex = parseInt(constituencyId);
    const constituencyIdForFirebase = constituencyIndex + 1; // Convert to 1-based index
    const userId = currentUser.uid;

    // Check if user has already submitted a survey for this constituency
    const existingSurvey = await FirebaseService.checkExistingSurvey(userId, constituencyIdForFirebase);

    if (existingSurvey) {
      showPopup(
        isEnglish ? 'Already Submitted' : 'पहले से जमा किया गया',
        isEnglish ? 'You have already submitted a response for this constituency.' : 'आपने पहले ही इस निर्वाचन क्षेत्र के लिए प्रतिक्रिया दी है।',
        'info'
      );
      return;
    }
    
    await FirebaseService.submitSatisfactionSurvey({
      constituency_id: constituencyIdForFirebase,
      user_id: userId,
      question: 'Are you satisfied with your tenure of last 5 years?',
      answer: answer
    });


    // Get current scores first, then increment them
    const currentScores = await FirebaseService.getConstituencyScores(constituencyIdForFirebase);
    const currentYes = currentScores?.satisfaction_yes || 0;
    const currentNo = currentScores?.satisfaction_no || 0;
    const currentTotal = currentScores?.satisfaction_total || 0;
    
    // Update constituency scores in Firebase with incremented values
    await FirebaseService.updateConstituencyScores(constituencyIdForFirebase, {
      satisfaction_yes: currentYes + (answer ? 1 : 0),
      satisfaction_no: currentNo + (answer ? 0 : 1),
      satisfaction_total: currentTotal + 1,
      interaction_count: currentScores?.interaction_count || 0
    });
    
    // Clear cache to ensure fresh data
    localStorage.removeItem('constituencyScoresCache');
    
    // Refresh constituency scores from database to get accurate counts
    await loadConstituencyScoresFromDatabase();

    // Update local state to reflect the new vote
    setConstituencies(prev => prev.map(c => {
      if (c.id === constituencyId) {
        const newSatisfactionYes = c.satisfactionYes + (answer ? 1 : 0);
        const newSatisfactionNo = c.satisfactionNo + (answer ? 0 : 1);
        const newTotal = newSatisfactionYes + newSatisfactionNo;
        
        return {
          ...c,
          satisfactionYes: newSatisfactionYes,
          satisfactionNo: newSatisfactionNo,
          satisfactionTotal: newTotal
        };
      }
      return c;
    }));

    // Update user surveys tracking with vote answer
    setUserSurveys(prev => new Set([...prev, `${constituencyId}:${answer}`]));

    // Show success message
    showPopup(
      isEnglish ? 'Success!' : 'सफलता!',
      isEnglish ? 'Thank you for your response!' : 'आपकी प्रतिक्रिया के लिए धन्यवाद!',
      'success'
    );

  } catch (err) {
    console.error('Error submitting satisfaction survey:', err);
    showPopup(
      isEnglish ? 'Error' : 'त्रुटि',
      isEnglish ? 'Error submitting response. Please try again.' : 'प्रतिक्रिया जमा करने में त्रुटि। कृपया पुनः प्रयास करें।',
      'error'
    );
  }
};

  // Load user votes from Firebase
  const loadUserVotesFromFirebase = async () => {
    if (!currentUser) return;
    
    // Check cache first to prevent repeated Firebase calls
    const cacheKey = `userVotes_${currentUser.uid}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const cacheData = JSON.parse(cached);
        const now = Date.now();
        
        // Cache is valid for 10 minutes
        if (now < cacheData.expiresAt) {
          setUserSurveys(new Set(cacheData.votes));
          return;
        }
      } catch (cacheError) {
        console.warn('⚠️ User votes cache corrupted, clearing:', cacheError);
        localStorage.removeItem(cacheKey);
      }
    }
    
    try {
      const { surveys } = await FirebaseService.loadUserInteractions(currentUser.uid);
      
      
      // Create a set of constituency IDs with their vote answers
      const userVotedConstituencies = new Set(
        surveys.map(s => `${(s.constituency_id - 1).toString()}:${s.answer}`)
      );
      
      
      // Update userSurveys state
      setUserSurveys(userVotedConstituencies);
      
      // Cache the user votes
      try {
        const cacheData = {
          votes: Array.from(userVotedConstituencies),
          timestamp: Date.now(),
          expiresAt: Date.now() + (10 * 60 * 1000) // Cache for 10 minutes
        };
        localStorage.setItem(cacheKey, JSON.stringify(cacheData));
      } catch (storageError) {
        console.warn('⚠️ Failed to cache user votes:', storageError);
      }
      
    } catch (err) {
      console.error('❌ Error loading user votes from Firebase:', err);
      // Initialize with empty set on error
      setUserSurveys(new Set());
    }
  };
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
    'कम्युनिस्ट पार्टी ऑफ इंडिया (मार्क्सवादी)': 'bg-rose-500',
    'कम्युनिस्ट पार्टी ऑफ इंडिया (मार्क्सवादी-लेनिनवादी) (मुक्ति)': 'bg-red-600',
    'हिंदुस्तानी अवाम मोर्चा (धर्मनिरपेक्ष)': 'bg-zinc-800',
    'अखिल भारतीय मजलिस-ए-इटिहादुल मुस्लिमीन': 'bg-emerald-900',
    'नोटा': 'bg-gray-600',

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
    'NOTA': 'bg-gray-600',
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
    <div className="min-h-screen bg-[#c5ced4] mb-0">
        {/* Hero Section */}
       <div className="bg-gradient-to-r from-[#273F4F] to-[#1a2b36] px-4 py-10 pb-30 text-white relative overflow-visible">
         {/* Top Left Image */}
         <img 
           className='h-16 w-auto absolute top-10 left-5 lg:h-35 lg:w-auto lg:top-10 lg:left-30 z-10 opacity-80' 
           src="/images/IMG_5509.PNG" 
           alt="Decorative Asset"
         />
         {/* Top Right Image */}
         <img 
           className='h-16 w-auto absolute top-10 right-10 lg:h-35 lg:w-auto lg:top-10 lg:right-50 z-10 opacity-80' 
           src="/images/IMG_5509.PNG" 
           alt="Decorative Asset"
         />
         {/* Bottom Left Image */}
         <img 
           className='h-16 w-auto absolute bottom-10 left-10 lg:h-35 lg:w-auto lg:bottom-10 lg:left-50 z-10 opacity-80' 
           src="/images/IMG_5509.PNG" 
           alt="Decorative Asset"
         />
         {/* Bottom Right Image */}
         <img 
           className='h-40 w-auto absolute bottom-5 right-5 lg:h-80 lg:w-auto lg:bottom-10 lg:right-20 z-10 opacity-80' 
           src="/images/IMG_5510.PNG" 
           alt="Decorative Asset"
         />
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
                <h1 className="text-3xl max-[340px]:text-2xl sm:text-4xl md:text-6xl font-light leading-tight text-left">{isEnglish ? 'Your Electoral' : 'जनता का'}</h1>
                <h1 className="text-3xl max-[340px]:text-2xl sm:text-4xl md:text-6xl font-light leading-tight text-left">{isEnglish ? '' : 'चुनावी'} <span className="text-red-400">{isEnglish ? 'Companion' : 'साथी'}</span></h1>
              </div>
              <div className="text-center">
                <p className="text-base max-[400px]:text-sm max-[330px]:text-[8px] sm:text-lg md:text-xl font-bold text-right">{isEnglish ? 'Who has done what work' : 'किसने किया है कैसा काम'}</p>
                <p className="text-base max-[400px]:text-sm max-[330px]:text-[8px] sm:text-lg md:text-xl font-bold text-right">{isEnglish ? 'Let\'s discuss' : 'आओ करें चर्चाग्राम'}</p>
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
            <div className="relative max-w-lg sm:max-w-lg mx-auto" ref={dropdownRef}>
              <div className="flex">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder={content.searchPlaceholder[isEnglish ? 'en' : 'hi']}
                    value={searchQuery}
                    onChange={handleSearchChange}
                    onFocus={() => setShowDropdown(true)}
                    onClick={() => setShowDropdown(true)}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-l-lg text-slate-900 bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#273f4f] text-sm sm:text-base placeholder-slate-500 cursor-pointer"
                  />
                  <MapPin className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                </div>
                <button 
                  className="bg-[#014e5c] hover:bg-[#014e5c]/80 px-4 sm:px-6 py-2 sm:py-3 rounded-r-lg transition-colors border border-[#014e5c] hover:border-[#014e5c]/80"
                  onClick={() => setShowDropdown(!showDropdown)}
                >
                  <Search className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </button>
              </div>

              {/* Enhanced Dropdown Menu - Always show when there's content */}
              {(showDropdown && (searchQuery.trim() || constituencies.length > 0)) && (
                <div className="absolute top-full left-0 right-0 bg-white border border-slate-200 rounded-lg shadow-lg mt-1 max-h-60 overflow-y-auto z-50">
                  {filteredAndSortedConstituencies.length > 0 ? (
                    filteredAndSortedConstituencies.slice(0, 243).map((constituency) => (
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
                    constituencies.slice(0, 243).map((constituency) => (
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
            </div>
            
            <div className="text-center space-y-3 mt-6 max-w-4xl px-4">
              <p className="flex justify-center items-center gap-2">
                <span className="text-md lg:text-xl sm:text-2xl font-bold text-slate-50">
                  {!isEnglish ? "जाने" : "Know"}
                </span>
                <span className="text-xs lg:text-sm sm:text-base text-slate-200">
                  {!isEnglish
                    ? "- उम्मीदवारों की सम्पत्ति, आपराधिक मामले और संसद में भागीदारी"
                    : "- The candidates' assets, criminal cases and participation in Parliament"}
                </span>
              </p>

              <p className="flex justify-center items-center gap-2">
                <span className="text-md lg:text-xl sm:text-2xl font-bold text-slate-50">
                  {!isEnglish ? "रखें" : "Share"}
                </span>
                <span className="text-xs lg:text-sm sm:text-base text-slate-200">
                  {!isEnglish
                    ? "- वर्तमान और पूर्व उम्मीदवारों पर अपनी राय"
                    : "- Your views on current and past candidates"}
                </span>
              </p>

              <p className="flex justify-center items-center gap-2">
                <span className="text-md lg:text-xl sm:text-2xl font-bold text-slate-50">
                  {!isEnglish ? "करें" : "Do"}
                </span>
                <span className="text-xs lg:text-sm sm:text-base text-slate-200">
                  {!isEnglish
                    ? "- जनसंवाद, सवाल-जवाब और जवाबदेही तय"
                    : "- Public dialogue, questions and answers, and fix accountability"}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Nagrik Yogdan Section - Show Current User's Tier */}
      {/*{currentUser && userProfile && (
        <div className="max-w-full mx-auto bg-[#9ca8b4] px-4 sm:px-6 lg:px-8 py-3 sm:py-8">
          <div className="text-center mb-5 sm:mb-8">
            <h2 className="text-xl sm:text-3xl font-bold text-gray-900 mb-4">
              {isEnglish ? 'Your Nagrik Yogdan' : 'आपका नागरिक योगदान'}
            </h2>
            <p className="text-sm sm:text-base text-gray-600">
              {isEnglish ? 'Your current engagement level and tier' : 'आपका वर्तमान जुड़ाव स्तर और टियर'}
            </p>
          </div>

          <div className="grid grid-cols-1 items-center justify-center gap-6">
              {[
                { level: 1, name: '1', color: 'from-blue-500 to-blue-600', description: 'Beginner', descriptionhi: 'शुरुआती' },
                { level: 2, name: '2', color: 'from-green-500 to-green-600', description: 'Active', descriptionhi: 'सक्रिय' },
                { level: 3, name: '3', color: 'from-yellow-500 to-yellow-600', description: 'Engaged', descriptionhi: 'जुड़ा' },
                { level: 4, name: '4', color: 'from-purple-500 to-purple-600', description: 'Leader', descriptionhi: 'नेता' }
              ]
                .filter((tier) => tier.level === userProfile.tier_level)
                .map((tier) => (
                  <div
                    key={tier.level}
                    className="bg-white rounded-xl shadow-lg p-6 text-center items-center justify-center"
                  >
                    <div
                      className={`w-12 h-12 lg:w-16 lg:h-16 bg-[#014e5c] rounded-full flex items-center justify-center mx-auto mb-4`}
                    >
                      <span className="h-8 w-8 font-bold text-white text-center">{tier.name}</span>
                    </div>
                    <div className="text-sm text-gray-600 mb-1">{isEnglish ? tier.description : tier.descriptionhi}</div>
                    <div className="text-lg font-bold text-[#014e5c]">
                      {isEnglish ? 'Current Tier' : 'वर्तमान टियर'}
                    </div>
                  </div>
                ))}
            </div>
          {/* User's Current Stats */}
          {/*<div className="mt-4 lg:mt-8 bg-white rounded-xl shadow-lg p-2 lg:p-6">
            <div className="text-center">
              <h3 className="text-md lg:text-xl font-semibold text-gray-900 mb-2">
                {isEnglish ? 'Your Progress' : 'आपकी प्रगति'}
              </h3>
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center">
                  <div className="text-sm lg:text-3xl font-bold text-blue-600 mb-2">{userProfile.participation_score}</div>
                  <div className="text-xs lg:text-sm text-gray-600">{isEnglish ? 'Engagement Score' : 'जुड़ाव स्कोर'}</div>
                </div>
                <div className="text-center">
                  <div className="text-sm lg:text-3xl font-bold text-purple-600 mb-2">
                    {userProfile.tier_level < 4 ? 
                      (userProfile.tier_level === 1 ? 20 : 
                       userProfile.tier_level === 2 ? 50 :
                       userProfile.tier_level === 3 ? 100 : 150) - userProfile.participation_score
                      : 0}
                  </div>
                  <div className="text-xs lg:text-sm text-gray-600">
                    {isEnglish ? 
                      (userProfile.tier_level < 4 ? 'Points to Next Tier' : 'Max Tier Reached') :
                      (userProfile.tier_level < 4 ? 'अगले टियर तक अंक' : 'अधिकतम टियर पहुंचा')
                    }
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Achievement Section for Authenticated Users */}
          {/*{currentUser && userAchievements && (
            <div className="mt-4 lg:mt-8 bg-white rounded-xl shadow-lg p-2 lg:p-6">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 lg:py-8">
                <div className="text-center mb-4 lg:mb-8">
                  <h2 className="text-sm lg:text-3xl font-bold text-gray-900 mb-2 lg:mb-4">
                    {isEnglish ? 'Your Achievements' : 'आपकी उपलब्धियां'}
                  </h2>
                  <p className="text-xs lg:text-sm text-gray-600">
                    {isEnglish ? 'Track your engagement and contributions' : 'अपने जुड़ाव और योगदान को ट्रैक करें'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 lg:gap-6">
                  {[
                    { 
                      title: isEnglish ? 'Pehla Vote' : 'पहला वोट', 
                      value: userProfile?.first_vote_year || 'Not set',
                      icon: Calendar,
                      color: 'bg-[#014e5c]',
                      description: isEnglish ? 'First voting year' : 'पहली बार मतदान किया'
                    },
                    { 
                      title: isEnglish ? 'Charchaon me Bhagidari' : 'चर्चा में भागीदारी', 
                      value: userAchievements.charchaonBhagidari,
                      icon: MessageCircle,
                      color: 'bg-[#014e5c]',
                      description: isEnglish ? 'Engagement in discussions' : userAchievements.charchaonBhagidari > 0 ? userAchievements.charchaonBhagidari + ' बार चर्चा में भागीदारी ली' : 'चर्चा में भागीदारी नहीं ली'
                    },
                    { 
                      title: isEnglish ? 'Nai Charcha ki Pehel' : 'नया चर्चा की पहली', 
                      value: userAchievements.naiCharchaPehel,
                      icon: TrendingUp,
                      color: 'bg-[#014e5c]',
                      description: isEnglish ? 'New posts initiated' : 'नया पोस्ट शुरू किया'
                    },
                    { 
                      title: isEnglish ? 'Nagrik Prerak' : 'नागरिक प्रेरक', 
                      value: userAchievements.nagrikPrerak,
                      icon: Users,
                      color: 'bg-[#014e5c]',
                      description: isEnglish ? 'People referred' : 'लोगों को सुझाया'
                    }
                  ].map((achievement, index) => (
                    <div key={index} className="bg-white rounded-xl shadow-lg p-2 lg:p-6 text-center">
                      <div className={`w-10 h-10 lg:w-16 lg:h-16 bg-gradient-to-r ${achievement.color} rounded-full flex items-center justify-center mx-auto mb-2 lg:mb-4`}>
                        <achievement.icon className="h-3 w-3 lg:h-8 lg:w-8 text-white" />
                      </div>
                      <h3 className="text-xs lg:text-xl font-semibold text-gray-900 mb-1 lg:mb-2">{achievement.title}</h3>
                      <div className="text-xs lg:text-3xl font-bold text-gray-900 mb-1 lg:mb-2">{achievement.value}</div>
                      <div className="text-xs lg:text-sm text-gray-600">{achievement.description}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )} 
      
      
      
      {/* Loading State for Database Initialization */}
      {isLoading && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <div className="bg-white rounded-xl shadow-lg p-12 border border-slate-200">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full mb-6 shadow-lg">
              <Database className="h-10 w-10 text-white animate-pulse" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">
              {isEnglish ? 'Initializing Database...' : 'डेटाबेस प्रारंभ हो रहा है...'}
            </h2>
            <p className="text-slate-600 mb-6 max-w-md mx-auto">
              {isEnglish ? 'Setting up constituency data and ensuring everything is ready. This may take a few moments.' : 'निर्वाचन क्षेत्र डेटा सेट कर रहा है और सब कुछ तैयार कर रहा है। इसमें कुछ क्षण लग सकते हैं।'}
            </p>
            <div className="flex items-center justify-center space-x-2">
              <div className="w-3 h-3 bg-[#014e5c] rounded-full animate-bounce"></div>
              <div className="w-3 h-3 bg-[#014e5c] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-3 h-3 bg-[#014e5c] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </div>
        </div>
      )}
      
      {/* Main Content - Only show when not loading */}
      {!isLoading && (
        <CharchitVidhanSabha 
          constituencies={filteredAndSortedConstituencies}
          isLoading={isLoading}
          submitSatisfactionSurvey={submitSatisfactionSurvey}
          handleShare={handleShare}
          popup={popup}
          closePopup={closePopup}
          currentUser={currentUser}
          userSurveys={userSurveys}
        />
      )}
      {/* Bottom Navigation - Mobile */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-20 shadow-lg">
        <div className="flex items-center justify-around py-3 px-2">
          <button
            onClick={() => navigate('/')}
            className="flex flex-col items-center space-y-1 p-2 rounded-lg transition-colors text-[#014e5c] bg-[#014e5c]/10"
          >
            <House className="w-5 h-5" />
            <span className="text-xs font-medium">{isEnglish ? 'Home' : 'होम'}</span>
          </button>
          <button
            onClick={() => navigate('/discussion')}
            className="flex flex-col items-center space-y-1 p-2 rounded-lg transition-colors text-gray-500 hover:text-[#014e5c]"
          >
            <MessageCircle className="w-5 h-5" />
            <span className="text-xs font-medium">{isEnglish ? 'Charcha Manch' : 'चर्चा मंच'}</span>
          </button>
          <button
            onClick={() => navigate('/aapka-kshetra')}
            className="flex flex-col items-center space-y-1 p-2 rounded-lg transition-colors text-gray-500 hover:text-[#014e5c]"
          >
            <MapPin className="w-5 h-5" />
            <span className="text-xs font-medium">{isEnglish ? 'Aapka Kshetra' : 'आपका क्षेत्र'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
export default Home;