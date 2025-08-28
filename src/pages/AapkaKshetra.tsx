import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import FirebaseService from '../services/firebaseService';
import { Calendar, GraduationCap, MessageCircle,Scale, CircleQuestionMark, IndianRupee,BanknoteArrowUp,Hospital } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../configs/firebase';
import SignInPopup from '../components/SignInPopup';

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
  other_candidates?: Array<{
    candidate_name: string;
    candidate_image_url: string;
    candidate_party: string;
    vote_share: number;
  }>;
}

const AapkaKshetra: React.FC = () => {
  const { isEnglish } = useLanguage();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [constituencies, setConstituencies] = useState<string[]>([]);
  const [selectedConstituency, setSelectedConstituency] = useState<string>('');
  const [englishConstituencyName, setEnglishConstituencyName] = useState<string>('');
  const [candidateData, setCandidateData] = useState<CandidateData | null>(null);
  const [satisfactionVote, setSatisfactionVote] = useState<'yes' | 'no' | null>(null);
  const [showConstituencySelector, setShowConstituencySelector] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [constituencyId, setConstituencyId] = useState<number | null>(null);
  const [currentSatisfactionYes, setCurrentSatisfactionYes] = useState<number>(0);
  const [currentSatisfactionNo, setCurrentSatisfactionNo] = useState<number>(0);
  const [scoresLoaded, setScoresLoaded] = useState<boolean>(false);
  const [departmentRatings, setDepartmentRatings] = useState<Record<string, number>>({});
  const [hasSubmittedQuestionnaire, setHasSubmittedQuestionnaire] = useState(false);
  const [, setOtherCandidates] = useState<Array<{
    candidate_name: string;
    candidate_image_url: string;
    candidate_party: string;
    vote_share: number;
  }>>([]);
  const checkedConstituencies = useRef<Set<string>>(new Set());
  const [initialLoadComplete, setInitialLoadComplete] = useState<boolean>(false);
  const [showSignInPopup, setShowSignInPopup] = useState(false);

  useEffect(() => {
    const initializeComponent = async () => {
      await fetchConstituencies();
      if (currentUser) {
        await checkUserConstituency();
      }
      
      // After constituencies are loaded, check URL parameters
      const constituencyParam = searchParams.get('constituency');
      const constituencyNameParam = searchParams.get('name');
      
      if (constituencyParam || constituencyNameParam) {
        // URL parameters exist, so we need to wait for constituencies to load
        // The other useEffect will handle this once constituencies are available
      }
      
      // Note: Satisfaction vote status will be checked by the useEffect when constituencyId changes
      setInitialLoadComplete(true);
    };
    
    initializeComponent();
  }, [currentUser, searchParams]);

  // Single useEffect to check satisfaction vote status when constituencyId changes
  useEffect(() => {
    if (currentUser && constituencyId) {
      setScoresLoaded(false); // Reset loading state for new constituency
      checkSatisfactionVoteStatus();
    }
  }, [currentUser, constituencyId]);

  // Clear checked constituencies when user changes
  useEffect(() => {
    if (currentUser) {
      checkedConstituencies.current.clear();

    }
  }, [currentUser]);

  // Debug useEffect to show when satisfaction vote status is checked
  useEffect(() => {
  }, [hasSubmittedQuestionnaire, satisfactionVote, constituencyId]);

  useEffect(() => {
    if (selectedConstituency) {
      fetchCandidateData(selectedConstituency);
      
      // Also set the English constituency name when selectedConstituency changes
      const setEnglishName = async () => {
        try {
          const response = await fetch('/data/candidates_en.json');
          const englishData: CandidateData[] = await response.json();
          const constituencyIndex = englishData.findIndex((item: CandidateData) => item.area_name === selectedConstituency);
          if (constituencyIndex !== -1) {
            setEnglishConstituencyName(selectedConstituency);
          } else {
            // If not found in English data, try to find by index in current data
            const currentDataFile = isEnglish ? '/data/candidates_en.json' : '/data/candidates.json';
            const currentResponse = await fetch(currentDataFile);
            const currentData: CandidateData[] = await currentResponse.json();
            const currentIndex = currentData.findIndex((item: CandidateData) => item.area_name === selectedConstituency);
            if (currentIndex !== -1) {
              const englishConstituency = englishData[currentIndex];
              if (englishConstituency) {
                setEnglishConstituencyName(englishConstituency.area_name);
              }
            }
          }
        } catch (error) {
          console.error('Error setting English constituency name:', error);
          setEnglishConstituencyName(selectedConstituency);
        }
        
        // Check if user has already voted on satisfaction survey for this constituency
        if (currentUser) {
          try {
            const dataFile = isEnglish ? '/data/candidates_en.json' : '/data/candidates.json';
            const response = await fetch(dataFile);
            const data: CandidateData[] = await response.json();
            const constituencyIndex = data.findIndex((item: CandidateData) => item.area_name === selectedConstituency);
            if (constituencyIndex !== -1) {
              const constituencyId = constituencyIndex + 1;
              // Set the constituency ID temporarily to check satisfaction vote status
              setConstituencyId(constituencyId);
              // The useEffect will automatically call checkSatisfactionVoteStatus when constituencyId changes
            }
          } catch (error) {
            console.error('Error checking user satisfaction vote:', error);
          }
        }
      };
      setEnglishName();
    }
  }, [selectedConstituency, isEnglish]);

  useEffect(() => {
    const checkSubmission = async () => {
      if (!currentUser || !constituencyId) return;
      const submitted = await FirebaseService.hasSubmittedQuestionnaire(currentUser.uid, constituencyId);
      setHasSubmittedQuestionnaire(submitted);
      
      try {
        const constituencyScores = await FirebaseService.getConstituencyScores(constituencyId);
        if (constituencyScores) {
          setCurrentSatisfactionYes(constituencyScores.satisfaction_yes || 0);
          setCurrentSatisfactionNo(constituencyScores.satisfaction_no || 0);
        }
      } catch (error) {
        console.error('Error fetching constituency scores:', error);
      }
    };
    checkSubmission();
  }, [currentUser, constituencyId]);

  useEffect(() => {
    const handleConstituencyParams = async () => {
      const constituencyParam = searchParams.get('constituency');
      const constituencyNameParam = searchParams.get('name');
      
      if (constituencies.length > 0) {
        if (constituencyParam && !isNaN(Number(constituencyParam))) {
          const constituencyId = Number(constituencyParam);
          const constituency = constituencies.find((_, index) => index + 1 === constituencyId);
          
          if (constituency) {
            setSelectedConstituency(constituency);
            setConstituencyId(constituencyId);
            setShowConstituencySelector(false);
            
            // Also set the English constituency name
            try {
              const englishResponse = await fetch('/data/candidates_en.json');
              const englishData: CandidateData[] = await englishResponse.json();
              const englishConstituency = englishData[constituencyId - 1];
              if (englishConstituency) {
                setEnglishConstituencyName(englishConstituency.area_name);
              }
            } catch (error) {
              console.error('Error fetching English constituency name:', error);
              setEnglishConstituencyName(constituency);
            }
            
            // Check if user has already voted on satisfaction survey for this constituency
            if (currentUser) {
              await checkSatisfactionVoteStatus();
            }
            
            const newSearchParams = new URLSearchParams(searchParams);
            newSearchParams.delete('constituency');
            newSearchParams.delete('name');
            navigate(`/aapka-kshetra?${newSearchParams.toString()}`, { replace: true });
          }
        } else if (constituencyNameParam) {
          const decodedName = decodeURIComponent(constituencyNameParam);
          if (constituencies.includes(decodedName)) {
            setSelectedConstituency(decodedName);
            setShowConstituencySelector(false);
            
            // Get the constituency ID and set it properly
            try {
              const dataFile = isEnglish ? '/data/candidates_en.json' : '/data/candidates.json';
              const response = await fetch(dataFile);
              const data: CandidateData[] = await response.json();
              const constituencyIndex = data.findIndex((item: CandidateData) => item.area_name === decodedName);
              if (constituencyIndex !== -1) {
                const constituencyId = constituencyIndex + 1;
                setConstituencyId(constituencyId);
                
                // Check if user has already voted on satisfaction survey for this constituency
                if (currentUser) {
                  await checkSatisfactionVoteStatus();
                }
              }
            } catch (error) {
              console.error('Error checking user satisfaction vote:', error);
            }
            
            const newSearchParams = new URLSearchParams(searchParams);
            newSearchParams.delete('constituency');
            newSearchParams.delete('name');
            navigate(`/aapka-kshetra?${newSearchParams.toString()}`, { replace: true });
          }
        }
      }
    };
    
    handleConstituencyParams();
  }, [searchParams, constituencies, navigate, currentUser]);

  const fetchConstituencies = async () => {
    try {
      const dataFile = isEnglish ? '/data/candidates_en.json' : '/data/candidates.json';
      const response = await fetch(dataFile);
      const data: CandidateData[] = await response.json();
      const uniqueConstituencies = [...new Set(data.map((item: CandidateData) => item.area_name))];
      setConstituencies(uniqueConstituencies);
      
      if (currentUser && uniqueConstituencies.length > 0) {
        setSelectedConstituency(uniqueConstituencies[0]);
      }
    } catch (error) {
      console.error('Error fetching constituencies:', error);
    }
  };

  const checkUserConstituency = async () => {
    if (!currentUser) return;
    
    try {
      const userProfile = await FirebaseService.getUserProfile(currentUser.uid);
      if (userProfile?.constituency_id) {
        setShowConstituencySelector(false);
        
        const dataFile = isEnglish ? '/data/candidates_en.json' : '/data/candidates.json';
        const response = await fetch(dataFile);
        const data: CandidateData[] = await response.json();
        const constituency = data.find((_: CandidateData, index: number) => index + 1 === userProfile.constituency_id);
        if (constituency) {
          setSelectedConstituency(constituency.area_name);
          setCandidateData(constituency);
          
          // Also set the English constituency name
          try {
            const englishResponse = await fetch('/data/candidates_en.json');
            const englishData: CandidateData[] = await englishResponse.json();
            const englishConstituency = englishData[userProfile.constituency_id - 1];
            if (englishConstituency) {
              setEnglishConstituencyName(englishConstituency.area_name);
            }
          } catch (error) {
            console.error('Error fetching English constituency name:', error);
            setEnglishConstituencyName(constituency.area_name);
          }
          
          // Check if user has already voted on satisfaction survey
          try {
            const constituencyScores = await FirebaseService.getConstituencyScores(userProfile.constituency_id);
            if (constituencyScores) {
              setCurrentSatisfactionYes(constituencyScores.satisfaction_yes || 0);
              setCurrentSatisfactionNo(constituencyScores.satisfaction_no || 0);
            }
            
            // Check if user has already submitted questionnaire
            const hasSubmitted = await FirebaseService.hasSubmittedQuestionnaire(currentUser.uid, userProfile.constituency_id);
            if (hasSubmitted) {
              setHasSubmittedQuestionnaire(true);
            }
            
            // Check if user has already voted on satisfaction survey by checking if they have a satisfaction vote
            // We'll check this by looking at the constituency scores and user's previous interactions
            // For now, we'll assume if they have submitted questionnaire, they have also voted on satisfaction
          } catch (error) {
            console.error('Error checking user satisfaction vote:', error);
          }
        }
      }
    } catch (error) {
      console.error('Error checking user constituency:', error);
    }
  };

  const checkSatisfactionVoteStatus = async () => {
    if (!currentUser || !constituencyId) return;
    
    const constituencyKey = `${currentUser.uid}-${constituencyId}`;
    
    // Prevent multiple calls for the same constituency
    if (checkedConstituencies.current.has(constituencyKey)) {
      return;
    }
    
    try {      
      // Check if user has already voted on satisfaction survey for this constituency
      const hasSubmitted = await FirebaseService.hasSubmittedQuestionnaire(currentUser.uid, constituencyId);      
      if (hasSubmitted) {
        setHasSubmittedQuestionnaire(true);        
        // Try to get the user's specific vote from the questionnaire submission
        try {
          const submissionsRef = collection(db, 'questionnaire_submissions');
          const q = query(
            submissionsRef,
            where('user_id', '==', currentUser.uid),
            where('constituency_id', '==', constituencyId)
          );
          const snapshot = await getDocs(q);
          
          if (!snapshot.empty) {
            const submission = snapshot.docs[0].data();
            if (submission.satisfaction_vote !== undefined) {
              const userVote = submission.satisfaction_vote ? 'yes' : 'no';
              setSatisfactionVote(userVote);
            }
          }
        } catch (error) {
          console.error('Error retrieving user vote:', error);
        }
      } else {
        setHasSubmittedQuestionnaire(false);
        setSatisfactionVote(null);
      }
      
      // Also refresh the constituency scores
      const constituencyScores = await FirebaseService.getConstituencyScores(constituencyId);
      if (constituencyScores) {
        setCurrentSatisfactionYes(constituencyScores.satisfaction_yes || 0);
        setCurrentSatisfactionNo(constituencyScores.satisfaction_no || 0);
        setScoresLoaded(true);
      }
      
      // Mark this constituency as checked
      checkedConstituencies.current.add(constituencyKey);
      
    } catch (error) {
      console.error('Error checking satisfaction vote status:', error);
      // If there's an error, assume user hasn't voted to be safe
      setHasSubmittedQuestionnaire(false);
      setSatisfactionVote(null);
    }
  };

  const fetchCandidateData = async (constituency: string) => {
    try {
      const dataFile = isEnglish ? '/data/candidates_en.json' : '/data/candidates.json';
      const response = await fetch(dataFile);
      const data: CandidateData[] = await response.json();
      
      const candidate = data.find((item: CandidateData) => item.area_name === constituency);
      if (candidate) {
        setCandidateData(candidate);
        const idx = data.findIndex((item: CandidateData) => item.area_name === constituency);
        if (idx !== -1) {
          setConstituencyId(idx + 1);
          
          // Also fetch the English constituency name for navigation purposes
          try {
            const englishResponse = await fetch('/data/candidates_en.json');
            const englishData: CandidateData[] = await englishResponse.json();
            const englishConstituency = englishData[idx];
            if (englishConstituency) {
              setEnglishConstituencyName(englishConstituency.area_name);
            }
          } catch (error) {
            console.error('Error fetching English constituency name:', error);
            // Fallback to current constituency name
            setEnglishConstituencyName(constituency);
          }
        }
        
        // Fetch other candidates from the same constituency using other_candidates
        if (candidate.other_candidates && Array.isArray(candidate.other_candidates)) {
          setOtherCandidates(candidate.other_candidates);
        } else {
          // Fallback: filter candidates from the same constituency if other_candidates is not available
          const otherCands = data.filter((item: CandidateData) => 
            item.area_name === constituency && item.vidhayak_info.name !== candidate.vidhayak_info.name
          );
          setOtherCandidates(otherCands.map(cand => ({
            candidate_name: cand.vidhayak_info.name,
            candidate_image_url: cand.vidhayak_info.image_url,
            candidate_party: cand.vidhayak_info.party_name,
            vote_share: cand.vidhayak_info.last_election_vote_percentage,
          })));
        }
        
        // Initialize department ratings
        const initialRatings: Record<string, number> = {};
        candidate.dept_info.forEach((dept) => {
          initialRatings[dept.dept_name] = 0;
        });
        setDepartmentRatings(initialRatings);
        
        // Check if user has already voted on satisfaction survey for this constituency
        if (currentUser && constituencyId) {
          await checkSatisfactionVoteStatus();
        }
      }
    } catch (error) {
      console.error('Error fetching candidate data:', error);
    }
  };

  const handleSatisfactionVote = async (vote: 'yes' | 'no') => {
    if (currentUser && constituencyId && !hasSubmittedQuestionnaire) {
      try {
        
        setSatisfactionVote(vote);
        
        // First, update the constituency satisfaction vote counts
        await FirebaseService.updateSatisfactionVote(constituencyId, vote);
        
        // Then, store the user's individual vote in Firebase
        await FirebaseService.submitQuestionnaire({
          user_id: currentUser.uid,
          constituency_id: constituencyId,
          satisfaction_vote: vote === 'yes',
          department_ratings: {}, // Empty for now since this is just satisfaction vote
          manifesto_score: 0, // Default value for satisfaction vote only
        });
        
        if (vote === 'yes') {
          setCurrentSatisfactionYes(prev => prev + 1);
        } else {
          setCurrentSatisfactionNo(prev => prev + 1);
        }
        
        try {
          const constituencyScores = await FirebaseService.getConstituencyScores(constituencyId);
          if (constituencyScores) {
            setCurrentSatisfactionYes(constituencyScores.satisfaction_yes || 0);
            setCurrentSatisfactionNo(constituencyScores.satisfaction_no || 0);
          }
        } catch (error) {
          console.error('Error refreshing constituency scores after vote:', error);
        }
        
        // Mark that the user has submitted their satisfaction vote
        setHasSubmittedQuestionnaire(true);
        
        // Force a re-check to ensure state consistency
        setTimeout(() => {
          checkSatisfactionVoteStatus();
        }, 100);
        
        // Show success message
        alert(isEnglish ? 'Your vote has been recorded successfully!' : 'आपका वोट सफलतापूर्वक दर्ज किया गया है!');
      } catch (error) {
        console.error('Error recording satisfaction vote:', error);
        setSatisfactionVote(null);
        alert(isEnglish ? 'Failed to record vote. Please try again.' : 'वोट रिकॉर्ड करने में विफल। कृपया पुनः प्रयास करें।');
      }
    } else {
      if (hasSubmittedQuestionnaire) {
        alert(isEnglish ? 'You have already voted on this question!' : 'आपने इस प्रश्न पर पहले ही वोट कर दिया है!');
      }
    }
  };

  const handleDepartmentRating = (deptName: string, rating: number) => {
    if (currentUser) {
      setDepartmentRatings(prev => ({
        ...prev,
        [deptName]: rating
      }));
    }
  };

  const canSubmitQuestionnaire = () => {
    if (!currentUser || hasSubmittedQuestionnaire) return false;
    const deptValues = Object.values(departmentRatings);
    if (deptValues.length === 0) return false;
    if (deptValues.some(v => v === 0)) return false;
    return true;
  };

  const handleQuestionnaireSubmit = async () => {
    if (!currentUser || !constituencyId) return;
    if (!canSubmitQuestionnaire()) return;
    
    try {
      // Calculate new manifesto score based on department ratings
      const deptValues = Object.values(departmentRatings);
      const newManifestoScore = deptValues.reduce((sum, rating) => sum + rating, 0) / deptValues.length;
      
      // Submit questionnaire with calculated manifesto score (satisfaction vote is handled separately)
      await FirebaseService.submitQuestionnaire({
        user_id: currentUser.uid,
        constituency_id: constituencyId,
        satisfaction_vote: false, // Default value since satisfaction vote is handled separately
        department_ratings: departmentRatings,
        manifesto_score: newManifestoScore,
      });
      
      // Update constituency scores with new average calculation
      await FirebaseService.updateManifestoAverageIncrement(constituencyId, newManifestoScore);
      
      setHasSubmittedQuestionnaire(true);
      alert(isEnglish ? 'Thank you! Your responses have been submitted.' : 'धन्यवाद! आपकी प्रतिक्रियाएं सबमिट कर दी गई हैं।');
    } catch (e) {
      console.error('Error submitting questionnaire', e);
      alert(isEnglish ? 'Failed to submit. Please try again.' : 'सबमिट करने में विफल। कृपया पुनः प्रयास करें।');
    }
  };

  const getPartyColor = (partyName: string) => {
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
    return partyColors[partyName] || 'bg-green-600';
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

  const handleCharchaManchClick = () => {
    if (constituencyId && englishConstituencyName) {
      // Always use English constituency name for navigation, similar to CharchitVidhanSabha
      navigate(`/discussion?constituency=${englishConstituencyName}&name=${encodeURIComponent(englishConstituencyName)}`);
    } else if (constituencyId && candidateData) {
      // Fallback: if English name is not available, use current constituency name
      // This ensures the button still works even if there's an issue fetching English data
      navigate(`/discussion?constituency=${candidateData.area_name}&name=${encodeURIComponent(candidateData.area_name)}`);
    }
  };
  const formatCurrency = (amount: number, isEnglish: boolean): string => {
    if (amount >= 10000000) {
      return isEnglish ? `₹${(amount / 10000000).toFixed(2)} Cr` : `₹${(amount / 10000000).toFixed(2)} करोड़`;
    } else if (amount >= 100000) {
      return isEnglish ? `₹${(amount / 100000).toFixed(2)} L` : `₹${(amount / 100000).toFixed(2)} लाख`;
    } else {
      return isEnglish ? `₹${amount.toLocaleString()}` : `₹${amount.toLocaleString()}`;
    }
  };

  const handleConstituencyConfirm = async () => {
    if (!currentUser || !selectedConstituency) return;
    
    setIsLoading(true);
    try {
      const dataFile = isEnglish ? '/data/candidates_en.json' : '/data/candidates.json';
      const response = await fetch(dataFile);
      const data: CandidateData[] = await response.json();
      const constituencyIndex = data.findIndex((item: CandidateData) => item.area_name === selectedConstituency);
      
      if (constituencyIndex !== -1) {
        const constituencyId = constituencyIndex + 1;
        
        // Also set the English constituency name for navigation purposes
        try {
          const englishResponse = await fetch('/data/candidates_en.json');
          const englishData: CandidateData[] = await englishResponse.json();
          const englishConstituency = englishData[constituencyIndex];
          if (englishConstituency) {
            setEnglishConstituencyName(englishConstituency.area_name);
          }
        } catch (error) {
          console.error('Error fetching English constituency name:', error);
          setEnglishConstituencyName(selectedConstituency);
        }
        
        await FirebaseService.updateUserProfile(currentUser.uid, {
          constituency_id: constituencyId
        });
        
        // Check if user has already voted on satisfaction survey for this constituency
        await checkSatisfactionVoteStatus();
        
        setShowConstituencySelector(false);
        alert(isEnglish ? 'Constituency confirmed! This cannot be changed.' : 'क्षेत्र की पुष्टि हो गई! इसे नहीं बदला जा सकता।');
      }
    } catch (error) {
      console.error('Error confirming constituency:', error);
      alert('Failed to confirm constituency. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#9ca8b4]">
      <div className="px-4 py-3">
        {/* Constituency Information Card */}
        <div className="bg-white rounded-lg p-1 mb-4 shadow-sm text-center">
          <h1 className="lg:text-2xl text-xl font-bold text-black mb-1">
            {candidateData ? candidateData.area_name + ' ' + 'विधानसभा क्षेत्र' : (isEnglish ? 'Your Constituency' : 'आपका क्षेत्र')}
          </h1>
          <p className="text-gray-600 text-sm">
            {isEnglish ? 'Information about your area' : 'आपके क्षेत्र की जानकारी'}
          </p>
        </div>

        {/* MLA Profile Card */}
        {candidateData && (
          <div className="bg-white rounded-lg p-3 lg:p-5 mb-2 shadow-sm">
            <div className="flex items-start space-x-4">
              <div className="relative">
                <img 
                  src={candidateData.vidhayak_info.image_url} 
                  alt={candidateData.vidhayak_info.name}
                  className="w-15 h-15 lg:w-25 lg:h-25 rounded-full object-cover border-2 border-gray-200"
                  onError={(e) => {
                    e.currentTarget.src = '/images/logo.png';
                  }}
                />
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <h2 className="text-xl font-bold text-black">{candidateData.vidhayak_info.name}</h2>
                  <span className="bg-gray-200 text-black text-xs px-3 py-1 rounded-full">
                    {isEnglish ? 'MLA' : 'विधायक'}
                  </span>
                </div>
                <p className="text-gray-600 text-sm mb-3">
                  {isEnglish ? `Age: ${candidateData.vidhayak_info.age} years` : `उम्र: ${candidateData.vidhayak_info.age} वर्ष`}
                </p>
                <div className="flex items-center space-x-3 mb-3">
                  <span className={`px-2 py-1 rounded-full text-white text-xs font-medium ${getPartyColor(candidateData.vidhayak_info.party_name)}`}>
                    {candidateData.vidhayak_info.party_name}
                  </span>
                  <div className="w-10 h-10 lg:w-10 lg:h-10 ml-10 lg:ml-320 rounded-full flex items-center justify-center border border-gray-200">
                    <img 
                      className="w-10 h-10 lg:w-10 lg:h-10 font-thin object-contain" 
                      src={fetchPartyIcon(candidateData.vidhayak_info.party_name)} 
                      alt={`${candidateData.vidhayak_info.party_name} logo`}
                      onError={(e) => {
                        e.currentTarget.src = '/images/party_logo/independent.png';
                      }}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between space-x-2">
                  <span className="bg-[#e2ebf3] justify-left text-black text-xs px-2 py-[0.5px] rounded-full">
                    {isEnglish ? `Last election: ${candidateData.vidhayak_info.last_election_vote_percentage}% votes` : `अंतिम चुनाव: ${candidateData.vidhayak_info.last_election_vote_percentage}% वोट`}
                  </span>
                  <div className="text-center">
                    <div className="text-sm font-bold text-black">{candidateData.vidhayak_info.experience}</div>
                    <div className="text-xs text-gray-600">{isEnglish ? 'Post experience' : 'पद अनुभव'}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Public Satisfaction Card */}
        {candidateData && (
          <div className="bg-white rounded-lg p-4 lg:p-6 mb-2 lg:mb-4 shadow-sm">
            <h3 className="text-xs lg:text-lg font-medium text-black mb-2">
              {isEnglish ? 'Are you satisfied with the last five years of tenure?' : 'क्या आप पिछले पांच साल के कार्यकाल से संतुष्ट हैं?'}
            </h3>
            
            {/* Show voting buttons - always visible but handle authentication */}
            {!hasSubmittedQuestionnaire ? (
              <div className="flex items-center space-x-2 mb-2">
                <button 
                  onClick={() => {
                    if (!currentUser) {
                      setShowSignInPopup(true);
                    } else {
                      handleSatisfactionVote('yes');
                    }
                  }}
                  className="px-3 py-1 text-xs rounded-full transition-colors bg-white text-gray-700 border border-gray-300 hover:bg-green-50 hover:border-green-300"
                >
                  {isEnglish ? "Yes" : "हाँ"}
                </button>
                <button 
                  onClick={() => {
                    if (!currentUser) {
                      setShowSignInPopup(true);
                    } else {
                      handleSatisfactionVote('no');
                    }
                  }}
                  className="px-3 py-1 text-xs rounded-full transition-colors bg-white text-gray-700 border border-gray-300 hover:bg-red-50 hover:border-red-300"
                >
                  {isEnglish ? "No" : "ना"}
                </button>
              </div>
            ) : currentUser && hasSubmittedQuestionnaire ? (
              /* Show vote counts and user's vote if they have already voted */
              <div className="mb-2">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-600">
                      {isEnglish ? "Your vote:" : "आपका वोट:"}
                    </span>
                    {hasSubmittedQuestionnaire && satisfactionVote === 'yes' ? (
                      <span className="px-2 py-1 text-xs rounded-full bg-[#014e5c] text-white">
                        {isEnglish ? "Yes" : "हाँ"}
                      </span>
                    ) : hasSubmittedQuestionnaire && satisfactionVote === 'no' ? (
                      <span className="px-2 py-1 text-xs rounded-full bg-red-500 text-white">
                        {isEnglish ? "No" : "ना"}
                      </span>
                    ) : null}
                  </div>
                  <div className="text-sm font-bold text-green-600">
                    {!initialLoadComplete || !scoresLoaded ? (
                      <span className="text-gray-400">Loading...</span>
                    ) : currentSatisfactionYes + currentSatisfactionNo > 0 ? (
                      Math.round(
                        (currentSatisfactionYes /
                          (currentSatisfactionYes + currentSatisfactionNo)) *
                          100,
                      )
                    ) : (
                      0
                    )}
                    {initialLoadComplete && scoresLoaded && "% "}
                    {initialLoadComplete && scoresLoaded && (isEnglish ? "Satisfied" : "संतुष्ट")}
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-600">
                  <span>
                    {isEnglish ? "Yes:" : "हाँ:"} {!initialLoadComplete || !scoresLoaded ? "..." : currentSatisfactionYes || 0}
                  </span>
                  <span>
                    {isEnglish ? "No:" : "ना:"} {!initialLoadComplete || !scoresLoaded ? "..." : currentSatisfactionNo || 0}
                  </span>
                  <span>
                    {isEnglish ? "Total:" : "कुल:"} {!initialLoadComplete || !scoresLoaded ? "..." : currentSatisfactionYes + currentSatisfactionNo || 0}
                  </span>
                </div>
              </div>
            ) : null}
            

          </div>
        )}

        {/* Key Metrics Grid */}
        {candidateData && (
          <div className="grid grid-cols-2 gap-3 mb-4">
            {/* Education */}
            <div className="bg-white rounded-lg p-2 lg:p-3 shadow-sm flex items-center">
              <div className="w-8 h-8 lg:w-10 lg:h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                <GraduationCap className="w-4 h-4 lg:w-6 lg:h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-xs lg:text-sm text-black mb-0.5">{isEnglish ? 'Education level' : 'शिक्षा स्तर'}</p>
                <p className="text-blue-600 font-semibold text-xs lg:text-sm">
                  {candidateData.vidhayak_info.metadata.education}
                </p>
              </div>
            </div>

            {/* Net Worth */}
            <div className="bg-white rounded-lg p-2 lg:p-3 shadow-sm flex items-center">
              <div className="w-8 h-8 lg:w-10 lg:h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                <IndianRupee className="w-4 h-4 lg:w-6 lg:h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-xs lg:text-sm text-black mb-0.5">{isEnglish ? 'Education level' : 'शिक्षा स्तर'}</p>
                <p className="text-blue-600 font-semibold text-xs lg:text-sm">
                  {formatCurrency(candidateData.vidhayak_info.metadata.net_worth, isEnglish)}
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
                  {candidateData.vidhayak_info.metadata.criminal_cases}
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
                  {candidateData.vidhayak_info.metadata.attendance || '0%'}
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
                  {candidateData.vidhayak_info.metadata.questions_asked || '0'}
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
                  {candidateData.vidhayak_info.metadata.funds_utilisation || '0%'}
                </p>
              </div>
            </div>
          </div>
        )}


        {/* Manifesto Link */}
        {candidateData && candidateData.vidhayak_info.manifesto_link && (
          <div className="bg-white rounded-lg p-4 mb-2 shadow-sm text-center">
            <a 
              href={candidateData.vidhayak_info.manifesto_link} 
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

        {/* Department Quiz Section */}
        {candidateData && !hasSubmittedQuestionnaire && (
          <div className="bg-white rounded-lg p-4 mb-2 shadow-sm">
            <h3 className="text-lg font-medium text-black mb-4 text-center">
              {isEnglish ? 'Rate Government Performance by Department' : 'विभाग के अनुसार सरकार के प्रदर्शन को रेट करें'}
            </h3>
            
            <div className="space-y-4">
              {candidateData.dept_info.map((dept) => (
                <div key={dept.dept_name} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 text-lg">
                        {dept.dept_name === 'स्वास्थ्य' || dept.dept_name === 'Health' ? <Hospital /> : '📚'}
                      </span>
                    </div>
                    <h4 className="text-lg font-semibold text-black">{dept.dept_name}</h4>
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-4 leading-relaxed">
                    {dept.work_info}
                  </p>
                  
                  <div className="mb-4">
                    <p className="text-sm text-gray-700 mb-2">
                      {isEnglish ? 'How satisfied are you with the government\'s work on this subject?' : 'इस विषय पर सरकार के कार्य से आप कितने संतुष्ट हैं ?'}
                    </p>
                    
                    {currentUser ? (
                      <div className="flex items-center justify-center space-x-1 mb-3">
                        {[1, 2, 3, 4, 5].map((rating) => (
                          <button
                            key={rating}
                            onClick={() => handleDepartmentRating(dept.dept_name, rating)}
                            className={`w-8 h-8 rounded-full border-2 transition-all duration-200 flex items-center justify-center text-sm font-semibold ${
                              departmentRatings[dept.dept_name] === rating
                                ? 'border-yellow-500 bg-yellow-100 text-yellow-600'
                                : 'border-gray-300 hover:border-yellow-400 hover:bg-yellow-50 text-gray-600 hover:text-yellow-600'
                            }`}
                          >
                            {rating}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-2">
                        <p className="text-gray-500 text-sm">
                          {isEnglish ? 'Please log in to rate' : 'रेटिंग के लिए कृपया लॉगिन करें'}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <div className="text-right">
                      <div className="flex items-center space-x-4">
                        <div className="text-center">
                          <div className="flex space-x-1">
                            <span className="text-yellow-500">⭐</span>
                          </div>
                          <p className="text-xs text-gray-600">
                            {isEnglish ? 'Very Bad' : 'बहुत खराब'}
                          </p>
                        </div>
                        <div className="text-center">
                          <div className="flex space-x-1">
                            <span className="text-xs text-gray-600">
                              {isEnglish ? 'Very Good' : 'बहुत अच्छा'}
                            </span>
                            <div className="flex space-x-1">
                              <span className="text-yellow-500">⭐⭐⭐⭐⭐</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Submit Button */}
              {currentUser && (
                <div className="text-center pt-4">
                  <button
                    onClick={handleQuestionnaireSubmit}
                    disabled={!canSubmitQuestionnaire()}
                    className="bg-[#014e5c] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#014e5c]/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isEnglish ? 'Submit Ratings' : 'रेटिंग सबमिट करें'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Other Candidates Section */}
        {candidateData && candidateData.other_candidates && candidateData.other_candidates.length > 0 && (
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
                {candidateData.other_candidates.map((candidate, index) => (
                  <div key={index} className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm min-w-[220px] flex-shrink-0">
                    <div className="flex items-start space-x-3">
                      <div className="relative">
                        <img 
                          src={candidate.candidate_party.toUpperCase() == 'NOTA' || candidate.candidate_party == 'नोटा' ? '/images/party_logo/nota.png' : candidate.candidate_image_url} 
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
                          <span className={`px-3 py-1 rounded-full text-white text-xs font-medium ${getPartyColor(candidate.candidate_party)}`}>
                            {candidate.candidate_party}
                          </span>
                          <div className="w-8 h-8 rounded-full flex items-center justify-center border border-gray-200">
                            <img 
                              className="w-6 h-6 object-contain" 
                              src={fetchPartyIcon(candidate.candidate_party)} 
                              alt={`${candidate.candidate_party} logo`}
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

        {/* Constituency Selection */}
        {showConstituencySelector && (
          <div className="bg-white rounded-lg p-6 mb-4 shadow-sm">
            <div className="text-center mb-4">
              <h2 className="text-lg font-semibold text-black mb-2">
                {isEnglish ? 'Select your constituency (this cannot be changed later)' : 'अपना क्षेत्र चुनें (इसे बाद में नहीं बदला जा सकता)'}
              </h2>
            </div>
            <div className="space-y-4">
              <select
                value={selectedConstituency}
                onChange={(e) => setSelectedConstituency(e.target.value)}
                disabled={isLoading}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:opacity-60 disabled:cursor-not-allowed text-base"
              >
                <option value="">{isEnglish ? 'Select Your Constituency' : 'अपना क्षेत्र चुनें'}</option>
                {constituencies.map((constituency) => (
                  <option key={constituency} value={constituency}>
                    {constituency}
                  </option>
                ))}
              </select>
              
              {selectedConstituency && currentUser && (
                <div className="text-center pt-4">
                  <button
                    className="bg-[#014e5c] text-white px-8 py-3 rounded-lg font-medium hover:[#014e5c]/80 transition-colors disabled:opacity-60 text-base"
                    onClick={handleConstituencyConfirm}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Processing...' : (isEnglish ? 'Confirm Selection' : 'चयन की पुष्टि करें')}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Not Logged In Warning */}
        {!currentUser && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4 text-center">
            <p className="text-amber-700 text-sm">
              {isEnglish ? 'Please log in to rate and vote' : 'रेटिंग और वोटिंग के लिए कृपया लॉगिन करें'}
            </p>
          </div>
        )}
        {/* Charcha Manch Button */}
        {candidateData && constituencyId && (
          <div className="text-center mt-4 sm:mt-6 mb-3 sm:mb-4">
            <button 
              className={`px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-medium transition-all duration-200 shadow-lg text-base sm:text-lg flex items-center justify-center space-x-2 sm:space-x-3 mx-auto ${
                englishConstituencyName 
                  ? 'bg-gray-700 text-white hover:bg-[#014e5c]/80 hover:shadow-xl transform hover:-translate-y-1' 
                  : 'bg-gray-400 text-gray-600 cursor-not-allowed'
              }`}
              onClick={handleCharchaManchClick}
              disabled={!englishConstituencyName}
            >
              <MessageCircle className="w-4 h-4 lg:w-6 lg:h-6" />
              <span className="text-sm lg:text-base">                  
                {isEnglish ? 'Go to your area\'s Charcha Manch' : 'आपके क्षेत्र के चर्चा मंच पर जाएं'}
              </span>
            </button>
            {!englishConstituencyName && (
              <p className="text-xs text-gray-500 mt-2">
                {isEnglish ? 'Loading constituency data...' : 'क्षेत्र डेटा लोड हो रहा है...'}
              </p>
            )}
          </div>
        )}
      </div>
      
      {/* Sign In Popup */}
      {showSignInPopup && (
        <SignInPopup 
          isOpen={showSignInPopup} 
          onClose={() => setShowSignInPopup(false)}
          customMessage={isEnglish ? 'You need to be signed in to vote on satisfaction surveys. Please sign in or create an account to continue.' : 'संतुष्टि सर्वेक्षणों पर वोट करने के लिए आपको साइन इन करना होगा। कृपया जारी रखने के लिए साइन इन करें या खाता बनाएं।'}
        />
      )}
    </div>
  );
};

export default AapkaKshetra;