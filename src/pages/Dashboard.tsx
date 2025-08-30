import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAdmin } from '../contexts/AdminContext';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  LogOut, 
  ArrowRight, 
  Shield,
  Edit3, 
  Trash2, 
  MessageSquare, 
  Users, 
  Calendar,
  Eye,
  Heart,
  MessageCircle,
  Share2,
  Plus
} from 'lucide-react';
import FirebaseService from '../services/firebaseService';
import toast from 'react-hot-toast';

interface UserPost {
  id: string;
  title: string;
  content: string;
  constituency: number;
  constituencyName: string;
  status: 'published' | 'under_review' | 'removed';
  createdAt: any;
  updatedAt?: any;
  likesCount: number;
  dislikesCount: number;
  commentsCount: number;
  interactionsCount?: number;
}

interface UserReferral {
  id: string;
  referred_user_email: string;
  referred_user_name?: string;
  status: 'pending' | 'completed' | 'active';
  created_at: any;
  referral_code: string;
}

interface UserProfile {
  id: string;
  display_name?: string;
  bio?: string;
  phone_number?: string;
  first_vote_year?: number;
  referral_code?: string;
  referred_by?: string;
  tier_level: number;
  engagement_score: number;
  constituency_id?: number;
  created_at: any;
  updated_at: any;
}

const Dashboard: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const { isAdmin, adminLevel } = useAdmin();
  const navigate = useNavigate();
  
  const [userPosts, setUserPosts] = useState<UserPost[]>([]);
  const [userReferrals, setUserReferrals] = useState<UserReferral[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'posts' | 'referrals'>('overview');

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Load user data
  useEffect(() => {
    if (currentUser) {
      loadUserData();
    }
  }, [currentUser]);

  const loadUserData = async () => {
    if (!currentUser?.uid) return;
    
    try {
      setIsLoading(true);
      console.log('🔄 Loading user data for:', currentUser.uid);
      
      // Load posts with better error handling
      let posts: any[] = [];
      try {
        posts = await FirebaseService.getUserPosts(currentUser.uid);
        console.log('✅ Loaded posts:', posts);
        
        // Transform posts to match the expected interface
        const transformedPosts = posts.map(post => ({
          id: post.id,
          title: post.title || post.titlefirst || 'Untitled',
          content: post.content || '',
          constituency: post.constituency || 0,
          constituencyName: post.constituencyName || 'Unknown',
          status: post.status || 'published',
          createdAt: post.createdAt,
          updatedAt: post.updatedAt,
          likesCount: post.likesCount || 0,
          dislikesCount: post.dislikesCount || 0,
          commentsCount: post.commentsCount || 0,
          interactionsCount: post.interactionsCount || 0
        }));
        
        console.log('🔄 Transformed posts:', transformedPosts);
        setUserPosts(transformedPosts);
      } catch (error) {
        console.error('❌ Error loading posts:', error);
        setUserPosts([]);
      }

      // Load referrals
      let referrals: any[] = [];
      try {
        referrals = await FirebaseService.getUserReferrals(currentUser.uid);
        console.log('✅ Loaded referrals:', referrals);
        setUserReferrals(referrals);
      } catch (error) {
        console.error('❌ Error loading referrals:', error);
        referrals = [];
      }

      // Load profile
      let profile = null;
      try {
        profile = await FirebaseService.getUserProfile(currentUser.uid, true);
        console.log('✅ Loaded profile:', profile);
        setUserProfile(profile);
      } catch (error) {
        console.error('❌ Error loading profile:', error);
        profile = null;
      }
      
    } catch (error) {
      console.error('❌ Error loading user data:', error);
      toast.error('Failed to load user data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!currentUser?.uid) {
      toast.error('Please sign in to delete posts');
      return;
    }

    if (window.confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      try {
        await FirebaseService.deleteDiscussionPost(postId, currentUser.uid);
        toast.success('Post deleted successfully');
        loadUserData(); // Refresh the posts
      } catch (error: any) {
        console.error('Error deleting post:', error);
        toast.error(error.message || 'Failed to delete post');
      }
    }
  };

  const handleEditPost = (postId: string) => {
    navigate(`/discussion?edit=${postId}`);
  };

  const getReferralStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-white bg-[#014e5c]';
      case 'active': return 'text-white bg-[#014e5c]/80';
      case 'pending': return 'text-white bg-[#014e5c]/60';
      default: return 'text-white bg-[#014e5c]/40';
    }
  };

  const getReferralStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Completed';
      case 'active': return 'Active';
      case 'pending': return 'Pending';
      default: return 'Unknown';
    }
  };

  const copyReferralCode = async () => {
    if (userProfile?.referral_code) {
      try {
        await navigator.clipboard.writeText(userProfile.referral_code);
        toast.success('Referral code copied to clipboard!');
      } catch (error) {
        console.error('Failed to copy referral code:', error);
        toast.error('Failed to copy referral code');
      }
    }
  };

  // Function to render formatted text
  const renderFormattedText = (text: string) => {
    if (!text) return '';
    
    // Simple markdown-like formatting
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/__(.*?)__/g, '<u>$1</u>')
      .replace(/^•\s/gm, '• ')
      .replace(/^\d+\.\s/gm, (match) => match);
  };

  if (!currentUser) {
    navigate('/signin');
    return null;
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-[#014e5c] shadow-sm border-b border-[#014e5c]/20">
        <div className="max-w-5xl mx-auto px-2 sm:px-3 lg:px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-white">Dashboard</h1>
              <p className="text-white/80 mt-1 text-xs">Welcome back, {currentUser.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 bg-white text-[#014e5c] px-2 py-1.5 rounded-md hover:bg-white/90 transition-colors text-xs"
            >
              <LogOut className="h-3 w-3" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-2 sm:px-3 lg:px-4 py-4">
        
        {/* Navigation Tabs */}
        <div className="bg-white rounded-md shadow-sm border border-[#014e5c]/20 p-3 mb-4">
          <div className="flex space-x-1 bg-[#014e5c]/10 p-1 rounded-md">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex-1 py-1.5 px-2 rounded-md text-xs font-medium transition-colors ${
                activeTab === 'overview'
                  ? 'bg-white text-[#014e5c] shadow-sm'
                  : 'text-[#014e5c]/70 hover:text-[#014e5c]'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('posts')}
              className={`flex-1 py-1.5 px-2 rounded-md text-xs font-medium transition-colors ${
                activeTab === 'posts'
                  ? 'bg-white text-[#014e5c] shadow-sm'
                  : 'text-[#014e5c]/70 hover:text-[#014e5c]'
              }`}
            >
              My Posts ({userPosts.length})
            </button>
            <button
              onClick={() => setActiveTab('referrals')}
              className={`flex-1 py-1.5 px-2 rounded-md text-xs font-medium transition-colors ${
                activeTab === 'referrals'
                  ? 'bg-white text-[#014e5c] shadow-sm'
                  : 'text-[#014e5c]/70 hover:text-[#014e5c]'
              }`}
            >
              Referrals ({userReferrals.length})
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
              <div className="bg-white rounded-md shadow-sm border border-[#014e5c]/20 p-3">
                <div className="flex items-center">
                  <div className="p-1.5 bg-[#014e5c]/10 rounded-md">
                    <User className="h-4 w-4 text-[#014e5c]" />
                  </div>
                  <div className="ml-2">
                    <p className="text-xs font-medium text-[#014e5c]/70">Profile Status</p>
                    <p className="text-sm font-bold text-[#014e5c]">Complete</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-md shadow-sm border border-[#014e5c]/20 p-3">
                <div className="flex items-center">
                  <div className="p-1.5 bg-[#014e5c]/10 rounded-md">
                    <Shield className="h-4 w-4 text-[#014e5c]" />
                  </div>
                  <div className="ml-2">
                    <p className="text-xs font-medium text-[#014e5c]/70">Account Type</p>
                    <p className="text-sm font-bold text-[#014e5c]">
                      {isAdmin ? adminLevel : 'User'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-md shadow-sm border border-[#014e5c]/20 p-3">
                <div className="flex items-center">
                  <div className="p-1.5 bg-[#014e5c]/10 rounded-md">
                    <MessageSquare className="h-4 w-4 text-[#014e5c]" />
                  </div>
                  <div className="ml-2">
                    <p className="text-xs font-medium text-[#014e5c]/70">Total Posts</p>
                    <p className="text-sm font-bold text-[#014e5c]">{userPosts.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-md shadow-sm border border-[#014e5c]/20 p-3">
                <div className="flex items-center">
                  <div className="p-1.5 bg-[#014e5c]/10 rounded-md">
                    <Users className="h-4 w-4 text-[#014e5c]" />
                  </div>
                  <div className="ml-2">
                    <p className="text-xs font-medium text-[#014e5c]/70">Referrals</p>
                    <p className="text-sm font-bold text-[#014e5c]">{userReferrals.length}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
              <div className="bg-white rounded-md shadow-sm border border-[#014e5c]/20 p-3">
                <h3 className="text-sm font-semibold text-[#014e5c] mb-2">Quick Actions</h3>
                <div className="space-y-1.5">
                  <button
                    onClick={() => navigate('/discussion')}
                    className="w-full flex items-center justify-between p-1.5 bg-[#014e5c]/5 rounded-md hover:bg-[#014e5c]/10 transition-colors"
                  >
                    <span className="text-[#014e5c] text-xs">Create New Post</span>
                    <Plus className="h-3 w-3 text-[#014e5c]" />
                  </button>
                  <button
                    onClick={() => navigate('/constituency/all-constituencies?showAll=true')}
                    className="w-full flex items-center justify-between p-1.5 bg-[#014e5c]/5 rounded-md hover:bg-[#014e5c]/10 transition-colors"
                  >
                    <span className="text-[#014e5c] text-xs">Browse Constituencies</span>
                    <ArrowRight className="h-3 w-3 text-[#014e5c]" />
                  </button>
                  <button
                    onClick={() => navigate('/profile')}
                    className="w-full flex items-center justify-between p-1.5 bg-[#014e5c]/5 rounded-md hover:bg-[#014e5c]/10 transition-colors"
                  >
                    <span className="text-[#014e5c] text-xs">Edit Profile</span>
                    <ArrowRight className="h-3 w-3 text-[#014e5c]" />
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-md shadow-sm border border-[#014e5c]/20 p-3">
                <h3 className="text-sm font-semibold text-[#014e5c] mb-2">Account Information</h3>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-[#014e5c]/70">Email:</span>
                    <span className="text-[#014e5c] font-medium">{currentUser.email}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-[#014e5c]/70">Email Verified:</span>
                    <span className={`font-medium ${currentUser.emailVerified ? 'text-[#014e5c]' : 'text-red-500'}`}>
                      {currentUser.emailVerified ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-[#014e5c]/70">Account Created:</span>
                    <span className="text-[#014e5c] font-medium">
                      {currentUser.metadata?.creationTime ? 
                        new Date(currentUser.metadata.creationTime).toLocaleDateString() : 
                        'Unknown'
                      }
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-[#014e5c]/70">Role:</span>
                    <span className="text-[#014e5c] font-medium">
                      {isAdmin ? adminLevel : 'User'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'posts' && (
          <div className="bg-white rounded-md shadow-sm border border-[#014e5c]/20 p-3">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-[#014e5c]">My Posts</h3>
              <div className="flex items-center space-x-1.5">
                <button
                  onClick={loadUserData}
                  className="flex items-center space-x-1.5 bg-[#014e5c] text-white px-2 py-1 rounded-md hover:bg-[#014e5c]/90 transition-colors text-xs"
                >
                  <span>Refresh</span>
                </button>
                <button
                  onClick={() => navigate('/discussion')}
                  className="flex items-center space-x-1.5 bg-[#014e5c] text-white px-2 py-1 rounded-md hover:bg-[#014e5c]/90 transition-colors text-xs"
                >
                  <Plus className="h-3 w-3" />
                  <span className="hidden sm:inline">Create Post</span>
                </button>
              </div>
            </div>
            
            {isLoading ? (
              <div className="text-center py-3">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#014e5c] mx-auto"></div>
                <p className="text-[#014e5c]/70 mt-1 text-xs">Loading posts...</p>
              </div>
            ) : userPosts.length === 0 ? (
              <div className="text-center py-3">
                <MessageSquare className="h-6 w-6 text-[#014e5c]/40 mx-auto mb-1.5" />
                <p className="text-[#014e5c]/70 mb-1.5 text-xs">You haven't created any posts yet.</p>
                <div className="text-xs text-[#014e5c]/50 mb-2">
                  Debug: User ID: {currentUser?.uid}
                </div>
                <button
                  onClick={() => navigate('/discussion')}
                  className="bg-[#014e5c] text-white px-2 py-1 rounded-md hover:bg-[#014e5c]/90 transition-colors text-xs"
                >
                  Create Your First Post
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {userPosts.map((post) => (
                  <div key={post.id} className="border border-[#014e5c]/20 rounded-md p-2 hover:shadow-sm transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-[#014e5c] mb-1 text-xs truncate">{post.title}</h4>
                        <p 
                          className="text-[#014e5c]/70 text-xs mb-1.5 line-clamp-2"
                          dangerouslySetInnerHTML={{ __html: renderFormattedText(post.content) }}
                        />
                        
                        <div className="flex items-center space-x-3 text-xs text-[#014e5c]/60 mb-1.5">
                          <span className="flex items-center">
                            <Eye className="h-2.5 w-2.5 mr-1" />
                            {post.interactionsCount || 0}
                          </span>
                          <span className="flex items-center">
                            <Heart className="h-2.5 w-2.5 mr-1" />
                            {post.likesCount || 0}
                          </span>
                          <span className="flex items-center">
                            <MessageCircle className="h-2.5 w-2.5 mr-1" />
                            {post.commentsCount || 0}
                          </span>
                          <span className="flex items-center">
                            <Share2 className="h-2.5 w-2.5 mr-1" />
                            <span className="truncate">{post.constituencyName || 'Unknown'}</span>
                          </span>
                        </div>
                        
                        <div className="flex items-center text-xs text-[#014e5c]/50">
                          <Calendar className="h-2.5 w-2.5 mr-1" />
                          {post.createdAt ? 
                            (post.createdAt.toDate ? new Date(post.createdAt.toDate()).toLocaleDateString() : new Date(post.createdAt).toLocaleDateString()) 
                            : 'Unknown date'
                          }
                          {post.status !== 'published' && (
                            <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-xs ${
                              post.status === 'under_review' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {post.status === 'under_review' ? 'Under Review' : 'Removed'}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-1 ml-2">
                        <button
                          onClick={() => handleEditPost(post.id)}
                          className="p-1 text-[#014e5c] hover:bg-[#014e5c]/10 rounded-md transition-colors"
                          title="Edit Post"
                        >
                          <Edit3 className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => handleDeletePost(post.id)}
                          className="p-1 text-red-500 hover:bg-red-50 rounded-md transition-colors"
                          title="Delete Post"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'referrals' && (
          <div className="bg-white rounded-md shadow-sm border border-[#014e5c]/20 p-3">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-[#014e5c]">My Referrals</h3>
              <div className="text-xs text-[#014e5c]/70">
                Total Referrals: <span className="font-semibold">{userReferrals.length}</span>
              </div>
            </div>

            {/* User's Own Referral Code */}
            {userProfile?.referral_code && (
              <div className="bg-[#014e5c]/5 border border-[#014e5c]/20 rounded-md p-3 mb-3">
                <h4 className="text-sm font-semibold text-[#014e5c] mb-1.5">Your Referral Code</h4>
                <div className="flex items-center space-x-2">
                  <div className="flex-1">
                    <div className="text-xs text-[#014e5c]/70 mb-1">Share this code with friends and family:</div>
                    <div className="font-mono text-sm font-bold text-[#014e5c] bg-white px-2 py-1.5 rounded-md border border-[#014e5c]/30">
                      {userProfile.referral_code}
                    </div>
                  </div>
                  <button
                    onClick={copyReferralCode}
                    className="bg-[#014e5c] text-white px-2 py-1.5 rounded-md hover:bg-[#014e5c]/90 transition-colors flex items-center space-x-1.5 text-xs"
                  >
                    <Share2 className="h-3 w-3" />
                    <span>Copy</span>
                  </button>
                </div>
                <p className="text-xs text-[#014e5c]/70 mt-1.5">
                  When someone signs up using your referral code, you'll both get benefits!
                </p>
              </div>
            )}
            
            {isLoading ? (
              <div className="text-center py-3">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#014e5c] mx-auto"></div>
                <p className="text-[#014e5c]/70 mt-1 text-xs">Loading referrals...</p>
              </div>
            ) : userReferrals.length === 0 ? (
              <div className="text-center py-3">
                <Users className="h-6 w-6 text-[#014e5c]/40 mx-auto mb-1.5" />
                <p className="text-[#014e5c]/70 mb-1.5 text-xs">You haven't referred anyone yet.</p>
                <p className="text-[#014e5c]/50 text-xs mb-1.5">Share your referral code with friends and family!</p>
                {userProfile?.referral_code && (
                  <div className="bg-[#014e5c]/5 rounded-md p-2">
                    <p className="text-xs text-[#014e5c]/70 mb-1">Your referral code:</p>
                    <div className="font-mono text-xs bg-white px-1.5 py-1 rounded border border-[#014e5c]/30">
                      {userProfile.referral_code}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {userReferrals.map((referral) => (
                  <div key={referral.id} className="border border-[#014e5c]/20 rounded-md p-2 hover:shadow-sm transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-1.5 mb-1">
                          <h4 className="font-semibold text-[#014e5c] text-xs">
                            {referral.referred_user_name || referral.referred_user_email}
                          </h4>
                          <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${getReferralStatusColor(referral.status)}`}>
                            {getReferralStatusText(referral.status)}
                          </span>
                        </div>
                        
                        <p className="text-[#014e5c]/70 text-xs mb-1">{referral.referred_user_email}</p>
                        
                        <div className="flex items-center text-xs text-[#014e5c]/50">
                          <Calendar className="h-2.5 w-2.5 mr-1" />
                          {referral.created_at ? 
                            (referral.created_at.toDate ? new Date(referral.created_at.toDate()).toLocaleDateString() : new Date(referral.created_at).toLocaleDateString()) 
                            : 'Unknown date'
                          }
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-xs text-[#014e5c]/50 mb-0.5">Referral Code</div>
                        <div className="font-mono text-xs bg-[#014e5c]/5 px-1.5 py-0.5 rounded border border-[#014e5c]/20">
                          {referral.referral_code}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Referral Stats */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-2">
              <div className="bg-[#014e5c]/5 rounded-md p-2 text-center">
                <div className="text-sm font-bold text-[#014e5c]">
                  {userReferrals.filter(r => r.status === 'completed').length}
                </div>
                <div className="text-xs text-[#014e5c]/70">Completed</div>
              </div>
              <div className="bg-[#014e5c]/5 rounded-md p-2 text-center">
                <div className="text-sm font-bold text-[#014e5c]">
                  {userReferrals.filter(r => r.status === 'active').length}
                </div>
                <div className="text-xs text-[#014e5c]/70">Active</div>
              </div>
              <div className="bg-[#014e5c]/5 rounded-md p-2 text-center">
                <div className="text-sm font-bold text-[#014e5c]">
                  {userReferrals.filter(r => r.status === 'pending').length}
                </div>
                <div className="text-xs text-[#014e5c]/70">Pending</div>
              </div>
            </div>
          </div>
        )}

        {/* Recent Activity */}
        <div className="bg-white rounded-md shadow-sm border border-[#014e5c]/20 p-3">
          <h3 className="text-sm font-semibold text-[#014e5c] mb-2">Recent Activity</h3>
          <div className="space-y-1.5">
            <div className="flex items-center p-1.5 bg-[#014e5c]/5 rounded-md">
              <div className="w-1.5 h-1.5 bg-[#014e5c] rounded-full mr-1.5"></div>
              <span className="text-[#014e5c] text-xs">Successfully signed in to your account</span>
              <span className="ml-auto text-xs text-[#014e5c]/50">Just now</span>
            </div>
            {userPosts.length > 0 && (
              <div className="flex items-center p-1.5 bg-[#014e5c]/5 rounded-md">
                <div className="w-1.5 h-1.5 bg-[#014e5c] rounded-full mr-1.5"></div>
                <span className="text-[#014e5c] text-xs">You have {userPosts.length} active posts</span>
                <span className="ml-auto text-xs text-[#014e5c]/50">Today</span>
              </div>
            )}
            {userReferrals.length > 0 && (
              <div className="flex items-center p-1.5 bg-[#014e5c]/5 rounded-md">
                <div className="w-1.5 h-1.5 bg-[#014e5c] rounded-full mr-1.5"></div>
                <span className="text-[#014e5c] text-xs">You have referred {userReferrals.length} users</span>
                <span className="ml-auto text-xs text-[#014e5c]/50">Today</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 