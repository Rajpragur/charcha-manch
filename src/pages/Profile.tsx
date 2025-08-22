import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Calendar, Shield, ArrowLeft, Edit3, Save, X, Vote, TrendingUp, MessageCircle, Star } from 'lucide-react';
import { supabase } from '../configs/supabase';

const Profile: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(currentUser?.displayName || '');
  const [bio, setBio] = useState('');
  const [firstVoteYear, setFirstVoteYear] = useState('');
  const [userStats, setUserStats] = useState({
    totalInteractions: 0,
    satisfactionVotes: 0,
    shares: 0,
    views: 0,
    level: 'Tier 1',
    participationScore: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  // Load user data on component mount
  useEffect(() => {
    if (currentUser) {
      loadUserData();
    }
  }, [currentUser]);

  if (!currentUser) {
    navigate('/signin');
    return null;
  }

  // Load user data from Supabase
  const loadUserData = async () => {
    try {
      setIsLoading(true);
      
      // Load user profile
      const { data: profileData } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', currentUser.uid)
        .single();

      if (profileData) {
        setDisplayName(profileData.display_name || '');
        setBio(profileData.bio || '');
        setFirstVoteYear(profileData.first_vote_year?.toString() || '');
        setUserStats({
          totalInteractions: profileData.total_interactions || 0,
          satisfactionVotes: profileData.satisfaction_votes || 0,
          shares: profileData.shares || 0,
          views: profileData.views || 0,
          level: 'Tier 1', // Everyone starts at Tier 1
          participationScore: profileData.participation_score || 0
        });
      } else {
        // Create a new profile if none exists
        const { error: createError } = await supabase
          .from('user_profiles')
          .insert({
            id: currentUser.uid,
            display_name: currentUser.displayName || 'User',
            bio: 'Active member of Charcha Manch',
            first_vote_year: null,
            level: 'Tier 1',
            participation_score: 0,
            total_interactions: 0,
            satisfaction_votes: 0,
            shares: 0,
            views: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (createError) {
          console.error('Error creating user profile:', createError);
        } else {
          // Set default values for new profile
          setDisplayName(currentUser.displayName || 'User');
          setBio('Active member of Charcha Manch');
          setFirstVoteYear('');
          setUserStats({
            totalInteractions: 0,
            satisfactionVotes: 0,
            shares: 0,
            views: 0,
            level: 'Tier 1',
            participationScore: 0
          });
        }
      }

      // Load user interactions
      const { data: interactions } = await supabase
        .from('constituency_interactions')
        .select('*')
        .eq('user_id', currentUser.uid);

      if (interactions) {
        const totalInteractions = interactions.length;
        const satisfactionVotes = interactions.filter(i => i.interaction_type === 'survey').length;
        const shares = interactions.filter(i => i.interaction_type === 'share').length;
        const views = interactions.filter(i => i.interaction_type === 'view').length;

        setUserStats(prev => ({
          ...prev,
          totalInteractions,
          satisfactionVotes,
          shares,
          views
        }));
      }

    } catch (err) {
      console.error('Error loading user data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      // Update user profile in Supabase
      const { error } = await supabase
        .from('user_profiles')
        .upsert({
          id: currentUser.uid,
          display_name: displayName,
          bio,
          first_vote_year: firstVoteYear ? parseInt(firstVoteYear) : null,
          level: 'Tier 1', // Always maintain Tier 1
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'id'
        });

      if (error) {
        console.error('Error updating profile:', error);
        alert('Failed to update profile');
        return;
      }

      // Refresh user data to show updated information
      await loadUserData();
      
      setIsEditing(false);
      alert('Profile updated successfully!');
    } catch (err) {
      console.error('Error saving profile:', err);
      alert('Failed to update profile');
    }
  };

  const handleResetProfile = async () => {
    if (window.confirm('Are you sure you want to reset your profile? This will clear all your custom information.')) {
      try {
        // Reset profile to defaults
        setDisplayName(currentUser.displayName || 'User');
        setBio('Active member of Charcha Manch');
        setFirstVoteYear('');
        
        // Update in Supabase
        const { error } = await supabase
          .from('user_profiles')
          .upsert({
            id: currentUser.uid,
            display_name: currentUser.displayName || 'User',
            bio: 'Active member of Charcha Manch',
            first_vote_year: null,
            level: 'Tier 1',
            participation_score: 0,
            total_interactions: 0,
            satisfaction_votes: 0,
            shares: 0,
            views: 0,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'id'
          });

        if (error) {
          console.error('Error resetting profile:', error);
          alert('Failed to reset profile');
          return;
        }

        // Refresh user data
        await loadUserData();
        alert('Profile reset successfully!');
      } catch (err) {
        console.error('Error resetting profile:', err);
        alert('Failed to reset profile');
      }
    }
  };

  const handleDeleteProfile = async () => {
    if (window.confirm('Are you sure you want to delete your profile? This action cannot be undone and will remove all your data.')) {
      try {
        // Delete profile from Supabase
        const { error } = await supabase
          .from('user_profiles')
          .delete()
          .eq('id', currentUser.uid);

        if (error) {
          console.error('Error deleting profile:', error);
          alert('Failed to delete profile');
          return;
        }

        // Reset local state
        setDisplayName(currentUser.displayName || 'User');
        setBio('');
        setFirstVoteYear('');
        setUserStats({
          totalInteractions: 0,
          satisfactionVotes: 0,
          shares: 0,
          views: 0,
          level: 'Tier 1',
          participationScore: 0
        });

        alert('Profile deleted successfully!');
      } catch (err) {
        console.error('Error deleting profile:', err);
        alert('Failed to delete profile');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                <button
                  onClick={() => navigate(-1)}
                  className="p-2 text-slate-600 hover:text-slate-800 transition-colors"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <div>
                  <h1 className="text-3xl font-bold text-slate-800">Profile</h1>
                  <p className="text-slate-600 mt-1">Manage your account information</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                    isEditing 
                      ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' 
                      : 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700'
                  }`}
                >
                  {isEditing ? <X className="h-4 w-4" /> : <Edit3 className="h-4 w-4" />}
                  <span>{isEditing ? 'Cancel' : 'Edit Profile'}</span>
                </button>
                
                {!isEditing && (
                  <>
                    <button
                      onClick={handleResetProfile}
                      className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-orange-100 text-orange-700 hover:bg-orange-200 transition-colors"
                    >
                      <X className="h-4 w-4" />
                      <span>Reset Profile</span>
                    </button>
                    
                    <button
                      onClick={handleDeleteProfile}
                      className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                    >
                      <X className="h-4 w-4" />
                      <span>Delete Profile</span>
                    </button>
                  </>
                )}
              </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
              <div className="text-center">
                <div className="w-32 h-32 mx-auto bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white text-4xl font-bold mb-4">
                  {currentUser.displayName?.charAt(0).toUpperCase() || currentUser.email?.charAt(0).toUpperCase() || 'U'}
                </div>
                <h2 className="text-xl font-semibold text-slate-800 mb-2">
                  {currentUser.displayName || 'User'}
                </h2>
                <p className="text-slate-600">{currentUser.email}</p>
                <div className="mt-4 inline-flex items-center px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                  <Shield className="h-3 w-3 mr-1" />
                  Verified Account
                </div>
              </div>
            </div>
          </div>

          {/* Profile Details */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-6">Profile Information</h3>
              
              <div className="space-y-6">
                {/* Display Name */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center">
                    <User className="h-4 w-4 mr-2" />
                    Display Name
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                      placeholder="Enter your display name"
                    />
                  ) : (
                    <p className="text-slate-800">{displayName || 'Not set'}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center">
                    <Mail className="h-4 w-4 mr-2" />
                    Email Address
                  </label>
                  <p className="text-slate-800">{currentUser.email}</p>
                  <p className="text-sm text-slate-500 mt-1">
                    {currentUser.emailVerified ? 'Email verified' : 'Email not verified'}
                  </p>
                </div>

                {/* Bio */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Bio
                  </label>
                  {isEditing ? (
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                      placeholder="Tell us about yourself..."
                    />
                  ) : (
                    <p className="text-slate-800">{bio || 'No bio added yet'}</p>
                  )}
                </div>

                {/* First Vote Year */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center">
                    <Vote className="h-4 w-4 mr-2" />
                    First Vote Year
                  </label>
                  {isEditing ? (
                    <input
                      type="number"
                      min="1950"
                      max={new Date().getFullYear()}
                      value={firstVoteYear}
                      onChange={(e) => setFirstVoteYear(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                      placeholder="Enter the year you first voted"
                    />
                  ) : (
                    <p className="text-slate-800">{firstVoteYear || 'Not set'}</p>
                  )}
                </div>

                {/* Account Created */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    Account Created
                  </label>
                  <p className="text-slate-800">
                    {currentUser.metadata?.creationTime ? 
                      new Date(currentUser.metadata.creationTime).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      }) : 
                      'Unknown'
                    }
                  </p>
                </div>

                {/* Save Button */}
                {isEditing && (
                  <div className="pt-4">
                    <button
                      onClick={handleSave}
                      className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-2 rounded-lg hover:from-green-700 hover:to-emerald-700 transition-colors flex items-center"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* User Stats Section */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-6 flex items-center">
                <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
                Your Activity & Engagement
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Total Interactions */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600 mb-1">
                    {userStats.totalInteractions}
                  </div>
                  <div className="text-sm text-blue-700">Total Interactions</div>
                </div>

                {/* Satisfaction Votes */}
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-600 mb-1">
                    {userStats.satisfactionVotes}
                  </div>
                  <div className="text-sm text-green-700">Satisfaction Votes</div>
                </div>

                {/* Shares */}
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-purple-600 mb-1">
                    {userStats.shares}
                  </div>
                  <div className="text-sm text-purple-700">Shares</div>
                </div>

                {/* Views */}
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-orange-600 mb-1">
                    {userStats.views}
                  </div>
                  <div className="text-sm text-orange-700">Views</div>
                </div>
              </div>

              {/* Level and Participation */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-emerald-700 mb-1">Current Level</div>
                      <div className="text-xl font-bold text-emerald-800">{userStats.level}</div>
                    </div>
                    <Star className="h-8 w-8 text-emerald-600" />
                  </div>
                </div>

                <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-teal-700 mb-1">Participation Score</div>
                      <div className="text-xl font-bold text-teal-800">{userStats.participationScore}%</div>
                    </div>
                    <MessageCircle className="h-8 w-8 text-teal-600" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile; 