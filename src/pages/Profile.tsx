import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit3, Save, X, Phone, User, Calendar } from 'lucide-react';
import FirebaseService from '../services/firebaseService';

interface UserStats {
  totalInteractions: number;
  satisfactionVotes: number;
  shares: number;
  views: number;
  likes: number;
  posts: number;
  comments: number;
}

interface CitizenshipLevel {
  id: string;
  shortName: string;
  fullName: string;
  fullNameEn: string;
  description: string;
  requirements: string[];
}

const Profile: React.FC = () => {
  const [isEnglish,] = useState(false);
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [userStats, setUserStats] = useState<UserStats>({
    totalInteractions: 0,
    satisfactionVotes: 0,
    shares: 0,
    views: 0,
    likes: 0,
    posts: 0,
    comments: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [userConstituency, setUserConstituency] = useState<string>('');
  const [, setUserConstituencyId] = useState<number | null>(null);
  const [userAge, setUserAge] = useState<string>('25-35 वर्ष');
  const [userGender, setUserGender] = useState<string>('पुरुष');
  const [userPhone, setUserPhone] = useState<string>('');
  const [userVotingYear, setUserVotingYear] = useState<string>('');
  const [editingField, setEditingField] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState<string>('');
  const [currentLevel, setCurrentLevel] = useState<number>(0); // 0-4 tiers (same as Home.tsx)
  const [participationScore, setParticipationScore] = useState<number>(65);
  const [progressToNextLevel, setProgressToNextLevel] = useState<number>(40);
  const [constituencies, setConstituencies] = useState<{ id: number; name: string; area_name?: string; area_name_hi?: string; district?: string }[]>([]);

  const citizenshipLevels: CitizenshipLevel[] = [
    {
      id: '0',
      shortName: '0',
      fullName: 'शुरुआती',
      fullNameEn: 'Beginner',
      description: 'Basic citizen level',
      requirements: ['Complete profile', 'Verify phone number']
    },
    {
      id: '1',
      shortName: '1',
      fullName: 'शुरुआती',
      fullNameEn: 'Beginner',
      description: 'Basic citizen level',
      requirements: ['Complete profile', 'Verify phone number']
    },
    {
      id: '2',
      shortName: '2',
      fullName: 'सक्रिय',
      fullNameEn: 'Active',
      description: 'Active citizen level',
      requirements: ['Participate in discussions', 'Share content', 'Vote in surveys']
    },
    {
      id: '3',
      shortName: '3',
      fullName: 'जुड़ा',
      fullNameEn: 'Engaged',
      description: 'Engaged citizen level',
      requirements: ['Participate in at least 3 discussions', 'Start a new discussion', 'Complete your profile']
    },
    {
      id: '4',
      shortName: '4',
      fullName: 'नेता',
      fullNameEn: 'Leader',
      description: 'Leader citizen level',
      requirements: ['Help other users', 'Create quality content', 'Maintain high engagement']
    }
  ];

  // Load user data on component mount
  useEffect(() => {
    if (currentUser) {
      loadUserData();
      loadConstituencies();
    }
  }, [currentUser]);

  // Load constituencies for dropdown
  const loadConstituencies = async () => {
    try {
      const constituenciesList = await FirebaseService.getAllConstituencies();
      setConstituencies(constituenciesList);
    } catch (error) {
      console.error('Error loading constituencies:', error);
    }
  };

  if (!currentUser) {
    navigate('/signin');
    return null;
  }

  // Load user data from Firebase
  const loadUserData = async () => {
    try {
      setIsLoading(true);
      
      // Get user profile
      let profile = await FirebaseService.getUserProfile(currentUser.uid);
      
              // If no profile exists, create a default one
        if (!profile) {
          await FirebaseService.createUserProfile(currentUser.uid, {
            display_name: currentUser.displayName || 'User',
            bio: 'Active member of Charcha Manch',
            first_vote_year: null as any,
            tier_level: 0, // Start at tier 0 - same as Home.tsx
            engagement_score: 0
          });
          profile = await FirebaseService.getUserProfile(currentUser.uid);
        }
      
      if (profile) {
        // Fetch actual constituency name from database
        if (profile.constituency_id) {
          const constituencyName = await FirebaseService.getConstituencyName(profile.constituency_id);
          setUserConstituency(constituencyName || `Constituency ${profile.constituency_id}`);
          setUserConstituencyId(profile.constituency_id);
        } else {
          setUserConstituency('लौरिया');
          setUserConstituencyId(null);
        }
        
        setParticipationScore(profile.engagement_score || 0);
        setUserVotingYear(profile.first_vote_year ? String(profile.first_vote_year) : '');
        setUserPhone(profile.phone_number || '');
        
        // Ensure tier_level is within valid range (0-4) - same as Home.tsx
        const dbTierLevel = profile.tier_level || 0;
        const validTierLevel = Math.max(0, Math.min(4, dbTierLevel));
        setCurrentLevel(validTierLevel);
      }

      // Get user interactions (we'll use dedicated methods instead)
      await FirebaseService.loadUserInteractions(currentUser.uid);
      
      // Get user's discussion posts
      const userPosts = await FirebaseService.getUserPosts(currentUser.uid);
      
      // Get user's liked posts
      const userLikedPosts = await FirebaseService.getUserLikedDiscussionPosts(currentUser.uid);
      
      // Get user's viewed posts
      const userViewedPosts = await FirebaseService.getUserViewedDiscussionPosts(currentUser.uid);
      
      // Get user's comment count
      const userCommentCount = await FirebaseService.getUserCommentCount(currentUser.uid);
      
      // Get user's share count
      const userShareCount = await FirebaseService.getUserShareCount(currentUser.uid);
      
      // Get user's satisfaction survey count
      const userSatisfactionSurveyCount = await FirebaseService.getUserSatisfactionSurveyCount(currentUser.uid);
      
      // Get user's total interaction count
      const userTotalInteractionCount = await FirebaseService.getUserTotalInteractionCount(currentUser.uid);
      
      // Calculate statistics
      const totalInteractions = userTotalInteractionCount; // Use the dedicated total method
      const satisfactionVotes = userSatisfactionSurveyCount; // Use the dedicated survey method
      const shares = userShareCount; // Use the dedicated share method
      const views = userViewedPosts.length; // Use the dedicated view method
      const posts = userPosts.length;
      const likes = userLikedPosts.length;
      const comments = userCommentCount; // Use the dedicated comment method

      setUserStats({
        totalInteractions,
        satisfactionVotes,
        shares,
        views,
        likes,
        posts,
        comments
      });

      // Calculate progress based on level requirements - same as Home.tsx
      let progress = 0;
      if (currentLevel < 4) { // Not at max level (4 is max)
        // Use the same logic as Home.tsx for points to next tier
        const pointsToNextTier = currentLevel === 0 ? 20 : 
                                currentLevel === 1 ? 50 :
                                currentLevel === 2 ? 100 : 150;
        
        // Calculate progress as percentage of points needed
        progress = Math.min(100, Math.round((participationScore / pointsToNextTier) * 100));
      } else {
        progress = 100; // Max level reached
      }
      
      setProgressToNextLevel(progress);

      // Check if user should level up
      await checkAndUpdateLevel();

    } catch (err) {
      console.error('Error loading user data:', err);
    } finally {
      setIsLoading(false);
    }
  };



  const handleEditField = (field: string, currentValue: string) => {
    setEditingField(field);
    setTempValue(currentValue);
  };

  const handleSaveField = async (field: string) => {
    try {
      let updateData: any = {};
      
      switch (field) {
        case 'phone':
          setUserPhone(tempValue);
          updateData.phone_number = tempValue;
          break;
        case 'gender':
          setUserGender(tempValue);
          updateData.gender = tempValue;
          break;
        case 'age':
          setUserAge(tempValue);
          updateData.age = tempValue;
          break;
        case 'constituency':
          if (tempValue) {
            const constituencyId = parseInt(tempValue);
            const selectedConstituency = constituencies.find(c => c.id === constituencyId);
            if (selectedConstituency) {
              const constituencyName = isEnglish ? selectedConstituency.name : (selectedConstituency.area_name_hi || selectedConstituency.name);
              setUserConstituency(constituencyName);
              setUserConstituencyId(constituencyId);
              updateData.constituency_id = constituencyId;
            }
          }
          break;
        case 'votingYear':
          setUserVotingYear(tempValue);
          updateData.first_vote_year = parseInt(tempValue);
          break;
      }

      if (Object.keys(updateData).length > 0) {
        await FirebaseService.updateUserProfile(currentUser.uid, updateData);
      }
      
      setEditingField(null);
      setTempValue('');
      alert('Field updated successfully!');
    } catch (err) {
      console.error('Error updating field:', err);
      alert('Failed to update field');
    }
  };

  const handleCancelEdit = () => {
    setEditingField(null);
    setTempValue('');
  };

  // Function to check and update user level based on achievements - same as Home.tsx
  const checkAndUpdateLevel = async () => {
    try {
      // Use the same tier progression logic as Home.tsx
      const tierThresholds = {
        0: 20,   // 0 -> 1: need 20 points
        1: 50,   // 1 -> 2: need 50 points
        2: 100,  // 2 -> 3: need 100 points
        3: 150   // 3 -> 4: need 150 points
      };

      let newLevel = currentLevel;
      
      // Check if user qualifies for next level based on participation score
      if (currentLevel < 4 && participationScore >= (tierThresholds[currentLevel as keyof typeof tierThresholds] || 0)) {
        newLevel = currentLevel + 1;
      }

      // Update level if it changed
      if (newLevel !== currentLevel) {
        await FirebaseService.updateUserProfile(currentUser.uid, {
          tier_level: newLevel
        });
        setCurrentLevel(newLevel);
      }
    } catch (error) {
      console.error('Error updating user level:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-[#014e5c] text-white">
        <div className="flex items-center p-4">
          <button
            onClick={() => navigate('/')}
            className="p-2 text-white hover:bg-blue-700 rounded-full transition-colors"
          >
            <ArrowLeft className="h-4 w-4 lg:h-5 lg:w-5" />
          </button>
          <h1 className="text-md lg:text-xl ml-3">{isEnglish ? "Citizen Profile" : "नागरिक प्रोफ़ाइल"}</h1>
        </div>
      </div>

      {/* Profile Section */}
      <div className="bg-[#014e5c] text-white pb-6">
        <div className="text-center">
          <div className="w-12 h-12 lg:w-24 lg:h-24 mx-auto bg-white rounded-full flex items-center justify-center mb-3">
            {currentUser.displayName ? (
              <span className="text-md lg:text-2xl font-bold text-[#014e5c]">
                {currentUser.displayName.charAt(0).toUpperCase()}
              </span>
            ) : (
              <User className="h-6 w-6 lg:h-12 lg:w-12 text-gray-600" />
            )}
          </div>
          <h2 className="text-md lg:text-xl font-semibold">
            {currentUser.displayName || 'XXXXXX'}
          </h2>
          <p className="text-blue-100 text-xs lg:text-sm mt-1">
            {userConstituency}
          </p>
          {currentUser.email && (
            <p className="text-blue-100 text-xs lg:text-sm mt-1">{currentUser.email}</p>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="px-3 py-4 space-y-5">
                {/* Citizenship Level Section */}
        <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
          <h3 className="text-xs lg:text-sm font-semibold text-gray-800 mb-3 text-center">{isEnglish ? "Citizenship Level" : "नागरिकता स्तर"}</h3>
          <div className="flex justify-center items-center gap-2"> 
            {citizenshipLevels.map((level) => (
              <button
                key={level.id}
                className={`flex flex-col items-center p-2 rounded-lg min-w-[45px] transition-all duration-200 ${
                  parseInt(level.id) === currentLevel
                    ? 'bg-[#014e5c] text-white shadow-md transform scale-105'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <span className="text-xs font-bold mb-1">{level.shortName}</span>
                <span className="text-xs text-center leading-tight">
                  {isEnglish ? level.fullNameEn : level.fullName}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Personal Information Section */}
        <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
          <h3 className="text-xs lg:text-sm font-semibold text-gray-800 mb-3">व्यक्तिगत जानकारी</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                  <Phone className="h-4 w-4 text-gray-600" />
                  {editingField === 'phone' ? (
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={tempValue}
                        onChange={(e) => setTempValue(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded text-sm"
                        placeholder="Enter phone number"
                      />
                      <button
                        onClick={() => handleSaveField('phone')}
                        className="p-1 text-green-600 hover:bg-green-50 rounded"
                      >
                        <Save className="h-3 w-3" />
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                                  ) : (
                  <span className="text-gray-700 text-xs">
                    {userPhone || 'फोन नंबर निर्धारित नहीं'}
                  </span>
                )}
                </div>
              {!editingField && (
                <button 
                  onClick={() => handleEditField('phone', userPhone)}
                  className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                >
                  <Edit3 className="h-3 w-3" />
                </button>
              )}
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <User className="h-4 w-4 text-gray-600" />
                {editingField === 'gender' ? (
                  <div className="flex items-center space-x-2">
                    <select
                      value={tempValue}
                      onChange={(e) => setTempValue(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded text-sm"
                    >
                      <option value="पुरुष">पुरुष</option>
                      <option value="महिला">महिला</option>
                      <option value="अन्य">अन्य</option>
                    </select>
                    <button
                      onClick={() => handleSaveField('gender')}
                      className="p-1 text-green-600 hover:bg-green-50 rounded"
                    >
                      <Save className="h-3 w-3" />
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <span className="text-gray-700 text-xs">{userGender}</span>
                )}
              </div>
              {!editingField && (
                <button 
                  onClick={() => handleEditField('gender', userGender)}
                  className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                >
                  <Edit3 className="h-3 w-3" />
                </button>
              )}
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Calendar className="h-4 w-4 text-gray-600" />
                {editingField === 'age' ? (
                  <div className="flex items-center space-x-2">
                    <select
                      value={tempValue}
                      onChange={(e) => setTempValue(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded text-sm"
                    >
                      <option value="18-24 वर्ष">18-24 वर्ष</option>
                      <option value="25-35 वर्ष">25-35 वर्ष</option>
                      <option value="36-45 वर्ष">36-45 वर्ष</option>
                      <option value="46-55 वर्ष">46-55 वर्ष</option>
                      <option value="56+ वर्ष">56+ वर्ष</option>
                    </select>
                    <button
                      onClick={() => handleSaveField('age')}
                      className="p-1 text-green-600 hover:bg-green-50 rounded"
                    >
                      <Save className="h-3 w-3" />
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <span className="text-gray-700 text-xs">{userAge}</span>
                )}
              </div>
              {!editingField && (
                <button 
                  onClick={() => handleEditField('age', userAge)}
                  className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                >
                  <Edit3 className="h-3 w-3" />
                </button>
              )}
            </div>
            
            {/* Voting Year Field */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Calendar className="h-4 w-4 text-gray-600" />
                {editingField === 'votingYear' ? (
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      value={tempValue}
                      onChange={(e) => setTempValue(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded text-sm"
                      placeholder="Enter voting year"
                      min="1950"
                      max={new Date().getFullYear()}
                    />
                    <button
                      onClick={() => handleSaveField('votingYear')}
                      className="p-1 text-green-600 hover:bg-green-50 rounded"
                    >
                      <Save className="h-3 w-3" />
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <span className="text-gray-700 text-xs">
                    {userVotingYear ? `${userVotingYear} में पहली बार मतदान` : 'मतदान वर्ष निर्धारित नहीं'}
                  </span>
                )}
              </div>
              {!editingField && (
                <button 
                  onClick={() => handleEditField('votingYear', userVotingYear)}
                  className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                >
                  <Edit3 className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>
          
          <div className="mt-3 text-center">
            <p className="text-xs text-gray-500">
              Click the edit icons to modify individual fields
            </p>
          </div>
        </div>

        {/* Citizen Activity Score */}
        <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
          <h3 className="text-xs lg:text-sm font-semibold text-gray-800 mb-3">नागरिक सक्रियता स्कोर</h3>
          <div className="mb-3">
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-[#014e5c] to-blue-800 h-3 rounded-full transition-all duration-500 shadow-sm"
                style={{ width: `${participationScore/(currentLevel === 0 ? 20 : 
                  currentLevel === 1 ? 50 :
                  currentLevel === 2 ? 100 : 150)*100}%` }}
              ></div>
            </div>
          </div>
          <div className="text-center">
            <span className="text-lg lg:text-3xl font-bold text-gray-800">{participationScore/(currentLevel === 0 ? 20 : 
                  currentLevel === 1 ? 50 :
                  currentLevel === 2 ? 100 : 150)*100}%</span>
          </div>
        </div>

        {/* Current Level Progress */}
        <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
          <h3 className="text-xs lg:text-sm font-semibold text-gray-800 mb-3">वर्तमान स्तर</h3>
          <div className="flex items-center justify-between mb-3">
            <div className="text-center">
              <div className="w-12 h-12 bg-[#014e5c] rounded-full flex items-center justify-center text-white font-bold text-lg mx-auto mb-2">
                {citizenshipLevels[currentLevel]?.shortName}
              </div>
              <span className="text-sm text-[#014e5c] font-medium">
                {isEnglish ? citizenshipLevels[currentLevel]?.fullNameEn : citizenshipLevels[currentLevel]?.fullName}
              </span>
            </div>
            
            <div className="text-blue-800 text-2xl">→</div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-bold text-lg mx-auto mb-2">
                {currentLevel < 4 ? citizenshipLevels[currentLevel + 1]?.shortName : '✓'}
              </div>
              <span className="text-sm text-gray-600 font-medium">
                {currentLevel < 4 ? 
                  (isEnglish ? citizenshipLevels[currentLevel + 1]?.fullNameEn : citizenshipLevels[currentLevel + 1]?.fullName) : 
                  (isEnglish ? 'Max Tier Reached' : 'अधिकतम टियर पहुंचा')
                }
              </span>
            </div>
          </div>
          
          <div className="mb-3">
            <p className="text-xs text-gray-600 mb-2">अगले स्तर तक प्रगति</p>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-2 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-blue-600 to-blue-800 h-2 rounded-full transition-all duration-500 shadow-sm"
                style={{ width: `${progressToNextLevel}%` }}
              ></div>
            </div>
            <div className="text-right">
              <span className="text-xs text-gray-600 font-medium">{progressToNextLevel}%</span>
            </div>
          </div>
          
          <div>
            {currentLevel < 4 ? (
              <>
                <p className="text-xs lg:text-2xl text-gray-600 mb-2">
                  {isEnglish ? 'Points to Next Tier:' : 'अगले टियर तक अंक:'}
                </p>
                <div className="text-center py-2">
                  <div className="text-sm lg:text-base font-bold text-[#014e5c]">
                    {
                      currentLevel === 0 ? 20 - participationScore : 
                      currentLevel === 1 ? 50 - participationScore :
                      currentLevel === 2 ? 100 - participationScore : 150 - participationScore
                    }
                  </div>
                  <div className="text-xs lg:text-2xl text-gray-600">
                    {isEnglish ? 'Points needed' : 'अंक आवश्यक'}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-3">
                <p className="text-xs text-green-600 font-medium">
                  {isEnglish ? 'Congratulations! You\'ve reached the maximum tier!' : 'बधाई हो! आपने अधिकतम टियर पहुंचा!'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {isEnglish ? 'Keep participating to maintain your status' : 'अपनी स्थिति बनाए रखने के लिए भागीदारी जारी रखें'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Activity Statistics */}
        <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
          <h3 className="text-xs lg:text-sm font-semibold text-gray-800 mb-3">Activity Statistics</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center p-3 bg-[#014e5c] rounded-lg border border-blue-200 shadow-sm">
              <div className="text-2xl lg:text-3xl font-bold text-white mb-1">{userStats.totalInteractions}</div>
              <div className="text-xs text-white font-medium">कुल इंटरैक्शन</div>
            </div>
            <div className="text-center p-3 bg-[#014e5c] rounded-lg border border-blue-200 shadow-sm">
              <div className="text-2xl lg:text-3xl font-bold text-white mb-1">{userStats.satisfactionVotes}</div>
              <div className="text-xs text-white font-medium">संतुष्टि वोट</div>
            </div>
            <div className="text-center p-3 bg-[#014e5c] rounded-lg border border-blue-200 shadow-sm">
              <div className="text-2xl lg:text-3xl font-bold text-white mb-1">{userStats.shares}</div>
              <div className="text-xs text-white font-medium">शेयर</div>
            </div>
            <div className="text-center p-3 bg-[#014e5c] rounded-lg border border-blue-200 shadow-sm">
              <div className="text-2xl lg:text-3xl font-bold text-white mb-1">{userStats.views}</div>
              <div className="text-xs text-white font-medium">दृश्य</div>
            </div>
            <div className="text-center p-3 bg-[#014e5c] rounded-lg border border-blue-200 shadow-sm">
              <div className="text-2xl lg:text-3xl font-bold text-white mb-1">{userStats.likes}</div>
              <div className="text-xs text-white font-medium">लाइक</div>
            </div>
            <div className="text-center p-3 bg-[#014e5c] rounded-lg border border-blue-200 shadow-sm">
              <div className="text-2xl lg:text-3xl font-bold text-white mb-1">{userStats.posts}</div>
              <div className="text-xs text-white font-medium">पोस्ट</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile; 