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
import AdminDashboardWidget from '../components/AdminDashboardWidget';
import AdminAccessChecker from '../components/AdminAccessChecker';
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
      const [posts, referrals, profile] = await Promise.all([
        FirebaseService.getUserPosts(currentUser.uid),
        FirebaseService.getUserReferrals(currentUser.uid),
        FirebaseService.getUserProfile(currentUser.uid)
      ]);
      
      setUserPosts(posts);
      setUserReferrals(referrals);
      setUserProfile(profile);
    } catch (error) {
      console.error('Error loading user data:', error);
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
    navigate(`/discussion-forum?edit=${postId}`);
  };

  const getReferralStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'active': return 'text-blue-600 bg-blue-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
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

  if (!currentUser) {
    navigate('/signin');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-800">Dashboard</h1>
              <p className="text-slate-600 mt-1">Welcome back, {currentUser.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2 rounded-lg hover:from-green-700 hover:to-emerald-700 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Admin Access Checker - Only show if user is admin */}
        {isAdmin && <AdminAccessChecker />}
        
        {/* Admin Widget - Only show if user is admin */}
        {isAdmin && <AdminDashboardWidget />}
        
        {/* Navigation Tabs */}
        <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6 mb-8">
          <div className="flex space-x-1 bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'overview'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('posts')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'posts'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              My Posts ({userPosts.length})
            </button>
            <button
              onClick={() => setActiveTab('referrals')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'referrals'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <User className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-slate-600">Profile Status</p>
                    <p className="text-2xl font-bold text-slate-800">Complete</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <Shield className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-slate-600">Account Type</p>
                    <p className="text-2xl font-bold text-slate-800">
                      {isAdmin ? adminLevel : 'User'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <MessageSquare className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-slate-600">Total Posts</p>
                    <p className="text-2xl font-bold text-slate-800">{userPosts.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-amber-100 rounded-lg">
                    <Users className="h-6 w-6 text-amber-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-slate-600">Referrals</p>
                    <p className="text-2xl font-bold text-slate-800">{userReferrals.length}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <button
                    onClick={() => navigate('/discussion-forum')}
                    className="w-full flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    <span className="text-slate-700">Create New Post</span>
                    <Plus className="h-4 w-4 text-slate-500" />
                  </button>
                  <button
                    onClick={() => navigate('/constituency/all-constituencies?showAll=true')}
                    className="w-full flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    <span className="text-slate-700">Browse Constituencies</span>
                    <ArrowRight className="h-4 w-4 text-slate-500" />
                  </button>
                  <button
                    onClick={() => navigate('/profile')}
                    className="w-full flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    <span className="text-slate-700">Edit Profile</span>
                    <ArrowRight className="h-4 w-4 text-slate-500" />
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Account Information</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Email:</span>
                    <span className="text-slate-800 font-medium">{currentUser.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Email Verified:</span>
                    <span className={`font-medium ${currentUser.emailVerified ? 'text-green-600' : 'text-red-600'}`}>
                      {currentUser.emailVerified ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Account Created:</span>
                    <span className="text-slate-800 font-medium">
                      {currentUser.metadata?.creationTime ? 
                        new Date(currentUser.metadata.creationTime).toLocaleDateString() : 
                        'Unknown'
                      }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Role:</span>
                    <span className="text-slate-800 font-medium">
                      {isAdmin ? adminLevel : 'User'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'posts' && (
          <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-slate-800">My Posts</h3>
              <button
                onClick={() => navigate('/discussion-forum')}
                className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Create Post</span>
              </button>
            </div>
            
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                <p className="text-slate-600 mt-2">Loading posts...</p>
              </div>
            ) : userPosts.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-600 mb-4">You haven't created any posts yet.</p>
                <button
                  onClick={() => navigate('/discussion-forum')}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Create Your First Post
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {userPosts.map((post) => (
                  <div key={post.id} className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-slate-800 mb-2">{post.title}</h4>
                        <p className="text-slate-600 text-sm mb-3 line-clamp-2">{post.content}</p>
                        
                        <div className="flex items-center space-x-6 text-sm text-slate-500 mb-3">
                          <span className="flex items-center">
                            <Eye className="h-4 w-4 mr-1" />
                            {post.interactionsCount || 0}
                          </span>
                          <span className="flex items-center">
                            <Heart className="h-4 w-4 mr-1" />
                            {post.likesCount}
                          </span>
                          <span className="flex items-center">
                            <MessageCircle className="h-4 w-4 mr-1" />
                            {post.commentsCount}
                          </span>
                          <span className="flex items-center">
                            <Share2 className="h-4 w-4 mr-1" />
                            {post.constituencyName}
                          </span>
                        </div>
                        
                        <div className="flex items-center text-xs text-slate-400">
                          <Calendar className="h-3 w-3 mr-1" />
                          {post.createdAt ? new Date(post.createdAt.toDate()).toLocaleDateString() : 'Unknown date'}
                          {post.status !== 'published' && (
                            <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                              post.status === 'under_review' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {post.status === 'under_review' ? 'Under Review' : 'Removed'}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={() => handleEditPost(post.id)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit Post"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeletePost(post.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Post"
                        >
                          <Trash2 className="h-4 w-4" />
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
          <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-slate-800">My Referrals</h3>
              <div className="text-sm text-slate-600">
                Total Referrals: <span className="font-semibold">{userReferrals.length}</span>
              </div>
            </div>

            {/* User's Own Referral Code */}
            {userProfile?.referral_code && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6 mb-6">
                <h4 className="text-lg font-semibold text-green-800 mb-3">Your Referral Code</h4>
                <div className="flex items-center space-x-3">
                  <div className="flex-1">
                    <div className="text-sm text-green-600 mb-2">Share this code with friends and family:</div>
                    <div className="font-mono text-2xl font-bold text-green-800 bg-white px-4 py-3 rounded-lg border-2 border-green-300">
                      {userProfile.referral_code}
                    </div>
                  </div>
                  <button
                    onClick={copyReferralCode}
                    className="bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                  >
                    <Share2 className="h-4 w-4" />
                    <span>Copy</span>
                  </button>
                </div>
                <p className="text-sm text-green-600 mt-3">
                  When someone signs up using your referral code, you'll both get benefits!
                </p>
              </div>
            )}
            
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                <p className="text-slate-600 mt-2">Loading referrals...</p>
              </div>
            ) : userReferrals.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-600 mb-4">You haven't referred anyone yet.</p>
                <p className="text-slate-500 text-sm mb-4">Share your referral code with friends and family!</p>
                {userProfile?.referral_code && (
                  <div className="bg-slate-50 rounded-lg p-4">
                    <p className="text-sm text-slate-600 mb-2">Your referral code:</p>
                    <div className="font-mono text-lg bg-white px-3 py-2 rounded border">
                      {userProfile.referral_code}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {userReferrals.map((referral) => (
                  <div key={referral.id} className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="font-semibold text-slate-800">
                            {referral.referred_user_name || referral.referred_user_email}
                          </h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getReferralStatusColor(referral.status)}`}>
                            {getReferralStatusText(referral.status)}
                          </span>
                        </div>
                        
                        <p className="text-slate-600 text-sm mb-2">{referral.referred_user_email}</p>
                        
                        <div className="flex items-center text-xs text-slate-400">
                          <Calendar className="h-3 w-3 mr-1" />
                          {referral.created_at ? new Date(referral.created_at.toDate()).toLocaleDateString() : 'Unknown date'}
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-xs text-slate-500 mb-1">Referral Code</div>
                        <div className="font-mono text-sm bg-slate-100 px-2 py-1 rounded border">
                          {referral.referral_code}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Referral Stats */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-slate-800">
                  {userReferrals.filter(r => r.status === 'completed').length}
                </div>
                <div className="text-sm text-slate-600">Completed</div>
              </div>
              <div className="bg-slate-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-slate-800">
                  {userReferrals.filter(r => r.status === 'active').length}
                </div>
                <div className="text-sm text-slate-600">Active</div>
              </div>
              <div className="bg-slate-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-slate-800">
                  {userReferrals.filter(r => r.status === 'pending').length}
                </div>
                <div className="text-sm text-slate-600">Pending</div>
              </div>
            </div>
          </div>
        )}

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Recent Activity</h3>
          <div className="space-y-3">
            <div className="flex items-center p-3 bg-slate-50 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
              <span className="text-slate-700">Successfully signed in to your account</span>
              <span className="ml-auto text-xs text-slate-500">Just now</span>
            </div>
            {userPosts.length > 0 && (
              <div className="flex items-center p-3 bg-slate-50 rounded-lg">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                <span className="text-slate-700">You have {userPosts.length} active posts</span>
                <span className="ml-auto text-xs text-slate-500">Today</span>
              </div>
            )}
            {userReferrals.length > 0 && (
              <div className="flex items-center p-3 bg-slate-50 rounded-lg">
                <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                <span className="text-slate-700">You have referred {userReferrals.length} users</span>
                <span className="ml-auto text-xs text-slate-500">Today</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 