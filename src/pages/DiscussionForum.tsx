import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  MessageSquare, 
  Clock, 
  TrendingUp, 
  User, 
  MapPin, 
  AlertTriangle, 
  Shield, 
  Filter,
  Plus,
  ChevronDown,
  Flame,
  Share2,
  Award,
  Heart,
  Menu,
  Home,
  MessageSquare as ChatBubble
} from 'lucide-react';
import Fuse from 'fuse.js';
import toast from 'react-hot-toast';
import FirebaseService from '../services/firebaseService';
import CreatePost from '../components/CreatePost';

interface DiscussionPost {
  id: string;
  title: string;
  content: string;
  constituency: number;
  constituencyName: string;
  userId: string;
  status: 'published' | 'under_review' | 'removed';
  createdAt: any;
  updatedAt?: any;
  likesCount: number;
  dislikesCount: number;
  commentsCount: number;
  interactionsCount?: number;
  userName?: string;
  tags: string[];
  media: {
    type: 'image' | 'video';
    url: string;
    thumbnail?: string;
  }[];
}



interface Constituency {
  id: number;
  name: string;
  area_name?: string;
  district?: string;
}

const DiscussionForum: React.FC = () => {
  const { isEnglish } = useLanguage();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<DiscussionPost[]>([]);
  const [constituencies, setConstituencies] = useState<Constituency[]>([]);
  const [selectedConstituency, setSelectedConstituency] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'trending' | 'interactions' | 'top'>('recent');
  const [isLoading, setIsLoading] = useState(false);

  const [showCreatePost, setShowCreatePost] = useState(false);
  const [showConstituencyFilter, setShowConstituencyFilter] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [activeTab, setActiveTab] = useState<'home' | 'discussion' | 'area'>('discussion');
  const [commentText, setCommentText] = useState<{ [postId: string]: string }>({});
  const [showComments, setShowComments] = useState<{ [postId: string]: boolean }>({});
  const [userReactions, setUserReactions] = useState<{ [postId: string]: { liked: boolean } }>({});

  const content = {
    title: isEnglish ? 'CharchaManch' : 'चर्चा मंच',
    subtitle: isEnglish ? 'Platform for Dialogue and Community Cooperation' : 'संवाद और सामुदायिक सहयोग का मंच',
    createPost: isEnglish ? 'New Discussion' : 'नई चर्चा',
    searchPlaceholder: isEnglish ? 'Search discussions, issues, candidates...' : 'चर्चा, मुद्दे, उम्मीदवार खोजें...',
    allConstituencies: isEnglish ? 'All Constituencies' : 'सभी निर्वाचन क्षेत्र',
    selectConstituency: isEnglish ? 'Select Constituency' : 'निर्वाचन क्षेत्र चुनें',
    noPosts: isEnglish ? 'No discussions found' : 'कोई चर्चा नहीं मिली',
    noPostsDescription: isEnglish ? 'Be the first to start a discussion in your constituency!' : 'अपने निर्वाचन क्षेत्र में चर्चा शुरू करने वाले पहले व्यक्ति बनें!',
    underReview: isEnglish ? 'Under Review' : 'समीक्षा के तहत',
    postRemoved: isEnglish ? 'This post was removed due to violation of forum rules.' : 'यह पोस्ट फोरम नियमों के उल्लंघन के कारण हटा दी गई थी।',
    loading: isEnglish ? 'Loading discussions...' : 'चर्चाएं लोड हो रही हैं...',
    writeComment: isEnglish ? 'Write your comment...' : 'अपनी टिप्पणी लिखें...',
    comment: isEnglish ? 'Comment' : 'टिप्पणी करे',
    share: isEnglish ? 'Share' : 'साझा',
    home: isEnglish ? 'Home' : 'होम',
    discussion: isEnglish ? 'Discussion Forum' : 'चर्चा मंच',
    area: isEnglish ? 'Your Area' : 'आपका क्षेत्र',
    reply: isEnglish ? 'Reply' : 'जवाब दें',
    save: isEnglish ? 'Save' : 'सहेजें'
  };

  // Fuse.js instance for fuzzy search
  const fuse = useMemo(() => {
    return new Fuse(posts, {
      keys: ['title', 'content', 'tags'],
      threshold: 0.3,
      includeScore: true
    });
  }, [posts]);

  // Filtered and sorted posts
  const filteredPosts = useMemo(() => {
    let filtered = posts;

    // Filter by constituency
    if (selectedConstituency) {
      filtered = filtered.filter(post => post.constituency === selectedConstituency);
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const searchResults = fuse.search(searchTerm);
      filtered = searchResults.map(result => result.item);
    }

    // Sort posts
    switch (sortBy) {
      case 'recent':
        filtered.sort((a, b) => {
          const dateA = a.createdAt?.toDate?.() || a.createdAt;
          const dateB = b.createdAt?.toDate?.() || b.createdAt;
          return new Date(dateB).getTime() - new Date(dateA).getTime();
        });
        break;
      case 'trending':
        filtered.sort((a, b) => (a.likesCount || 0) - (b.likesCount || 0));
        break;
      case 'interactions':
        filtered.sort((a, b) => (b.interactionsCount || 0) - (a.interactionsCount || 0));
        break;
      case 'top':
        filtered.sort((a, b) => {
          const scoreA = (a.likesCount || 0) + (a.commentsCount || 0) * 2;
          const scoreB = (b.likesCount || 0) + (b.commentsCount || 0) * 2;
          return scoreB - scoreA;
        });
        break;
    }

    return filtered;
  }, [posts, selectedConstituency, searchTerm, sortBy, fuse]);

  // Fetch posts and constituencies
  useEffect(() => {
    fetchData();
  }, [currentUser?.uid]);

  // Handle constituency selection
  const handleConstituencyChange = (constituencyId: number | null) => {
    setSelectedConstituency(constituencyId);
  };

  // Handle post creation
  const handlePostCreated = () => {
    fetchData();
  };

  // Handle comment submission
  const handleCommentSubmit = async (postId: string) => {
    if (!currentUser?.uid) {
      toast.error('Please sign in to comment');
      return;
    }

    const commentContent = commentText[postId]?.trim();
    if (!commentContent) {
      toast.error('Please write a comment');
      return;
    }

    try {
      console.log('Submitting comment:', { postId, commentContent, currentUser });
      
      const currentPost = posts.find(p => p.id === postId);
      console.log('Current post:', currentPost);
      
      await FirebaseService.addComment(postId, {
        userId: currentUser.uid,
        userName: currentUser.displayName || 'Anonymous',
        content: commentContent,
        constituencyName: currentPost?.constituencyName || 'Unknown'
      });
      
      setCommentText(prev => ({ ...prev, [postId]: '' }));
      toast.success('Comment posted successfully!');
      
      // Refresh posts to show new comment count
      fetchData();
    } catch (error) {
      console.error('Error posting comment:', error);
      toast.error('Failed to post comment');
    }
  };

  // Fetch data function
  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch posts
      const fetchedPosts = await FirebaseService.getDiscussionPosts();
      setPosts(fetchedPosts);
      
      // Fetch constituencies
      const fetchedConstituencies = await FirebaseService.getAllConstituencies();
      setConstituencies(fetchedConstituencies);
      
      // Fetch user reactions for all posts if logged in
      if (currentUser?.uid) {
        const reactions: { [postId: string]: { liked: boolean } } = {};
        for (const post of fetchedPosts) {
          const hasLiked = await FirebaseService.hasUserLikedPost(post.id, currentUser.uid);
          reactions[post.id] = { liked: hasLiked };
        }
        setUserReactions(reactions);
      }
      
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load discussions');
    } finally {
      setIsLoading(false);
    }
  };

  // Format relative time
  const formatRelativeTime = (date: any) => {
    const now = new Date();
    const postDate = date?.toDate?.() || new Date(date);
    const diffInSeconds = Math.floor((now.getTime() - postDate.getTime()) / 1000);
    
    if (diffInSeconds < 60) return isEnglish ? 'just now' : 'अभी';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} ${isEnglish ? 'min ago' : 'मिनट पहले'}`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} ${isEnglish ? 'hours ago' : 'घंटे पहले'}`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} ${isEnglish ? 'days ago' : 'दिन पहले'}`;
    return postDate.toLocaleDateString();
  };

  // Toggle comments visibility
  const toggleComments = (postId: string) => {
    setShowComments(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  };

  // Handle like/dislike
  const handleLike = async (postId: string) => {
    if (!currentUser?.uid) {
      toast.error('Please sign in to like posts');
      return;
    }

    try {
      console.log('Liking post:', { postId, currentUser: currentUser.uid, currentLikeState: userReactions[postId]?.liked });
      
      await FirebaseService.likePost(postId, currentUser.uid);
      
      // Get current like state
      const currentLikeState = userReactions[postId]?.liked || false;
      
      console.log('Like successful, updating state:', { currentLikeState, newState: !currentLikeState });
      
      // Update local state
      setUserReactions(prev => ({
        ...prev,
        [postId]: { liked: !currentLikeState }
      }));
      
      setPosts(prev => prev.map(post => 
        post.id === postId 
          ? { ...post, likesCount: (post.likesCount || 0) + (currentLikeState ? -1 : 1) }
          : post
      ));
      
      toast.success(!currentLikeState ? 'Post liked!' : 'Post unliked');
    } catch (error) {
      console.error('Error updating like:', error);
      toast.error('Failed to update like');
    }
  };



  // Navigate to post detail page
  const handlePostClick = (postId: string) => {
    navigate(`/post/${postId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="lg:hidden bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-red-500 rounded-lg flex items-center justify-center">
              <span className="text-white text-xs font-bold">CM</span>
            </div>
            <span className="text-lg font-bold text-gray-900">CHARCHAGRAM</span>
          </div>
          <div className="flex items-center space-x-3">
            <button className="p-2 hover:bg-gray-100 rounded-full">
              <User className="w-5 h-5 text-gray-600" />
            </button>
            <button 
              className="p-2 hover:bg-gray-100 rounded-full"
              onClick={() => setShowMobileMenu(!showMobileMenu)}
            >
              <Menu className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden lg:block bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-red-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm font-bold">CM</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">CHARCHAGRAM</h1>
                <p className="text-gray-600">{content.subtitle}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowCreatePost(true)}
                className="bg-gradient-to-r from-green-500 to-red-500 text-white px-6 py-2 rounded-full hover:from-green-600 hover:to-red-600 transition-all duration-200 font-medium flex items-center space-x-2 shadow-lg"
              >
                <Plus className="w-4 h-4" />
                <span>{content.createPost}</span>
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {showMobileMenu && (
        <div className="lg:hidden bg-white border-b border-gray-200">
          <div className="px-4 py-3 space-y-3">
            <button className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded-lg">
              Profile
            </button>
            <button className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded-lg">
              Settings
            </button>
            <button className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded-lg">
              Help
            </button>
          </div>
        </div>
      )}

      {/* Main Title Card - Mobile */}
      <div className="lg:hidden bg-white mx-4 mt-4 rounded-xl shadow-sm border border-gray-200 p-6">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-green-500 to-red-500 bg-clip-text text-transparent mb-2">
          {content.title}
        </h1>
        <p className="text-gray-600 text-lg">{content.subtitle}</p>
      </div>

      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-4 lg:py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar - Desktop Only */}
          <div className="hidden lg:block lg:col-span-1 space-y-6">
            {/* Constituency Filter */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <Filter className="w-5 h-5 text-gray-600" />
                <span>{content.selectConstituency}</span>
              </h3>
              <div className="space-y-2">
                <button
                  onClick={() => handleConstituencyChange(null)}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                    selectedConstituency === null
                      ? 'bg-green-100 text-green-700 border border-green-200'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {content.allConstituencies}
                </button>
                {constituencies.map((constituency) => (
                  <button
                    key={constituency.id}
                    onClick={() => handleConstituencyChange(constituency.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                      selectedConstituency === constituency.id
                        ? 'bg-green-100 text-green-700 border border-green-200'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {constituency.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort Options */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Sort by</h3>
              <div className="space-y-2">
                {[
                  { key: 'recent', label: 'Latest', icon: Clock },
                  { key: 'trending', label: 'Trending', icon: Flame },
                  { key: 'interactions', label: 'Most Active', icon: TrendingUp },
                  { key: 'top', label: 'Top', icon: Award }
                ].map((option) => (
                  <button
                    key={option.key}
                    onClick={() => setSortBy(option.key as any)}
                    className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 ${
                      sortBy === option.key
                        ? 'bg-green-100 text-green-700 border border-green-200'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <option.icon className={`w-4 h-4 ${sortBy === option.key ? 'text-green-600' : 'text-gray-500'}`} />
                    <span className="font-medium">{option.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-4 lg:space-y-6">
            {/* Constituency Filter - Mobile */}
            <div className="lg:hidden bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <button
                onClick={() => setShowConstituencyFilter(!showConstituencyFilter)}
                className="w-full flex items-center justify-between px-4 py-3 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <MapPin className="w-5 h-5 text-gray-600" />
                  <span className="text-gray-700">
                    {selectedConstituency 
                      ? constituencies.find(c => c.id === selectedConstituency)?.name 
                      : content.allConstituencies
                    }
                  </span>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-600 transition-transform ${showConstituencyFilter ? 'rotate-180' : ''}`} />
              </button>
              
              {showConstituencyFilter && (
                <div className="mt-3 space-y-2">
                  <button
                    onClick={() => handleConstituencyChange(null)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                      selectedConstituency === null
                        ? 'bg-green-100 text-green-700 border border-green-200'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {content.allConstituencies}
                  </button>
                  {constituencies.map((constituency) => (
                    <button
                      key={constituency.id}
                      onClick={() => handleConstituencyChange(constituency.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                        selectedConstituency === constituency.id
                          ? 'bg-green-100 text-green-700 border border-green-200'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {constituency.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Search Bar */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder={content.searchPlaceholder}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-lg"
                />
              </div>
            </div>

            {/* Posts List */}
            <div className="space-y-4">
              {isLoading ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">{content.loading}</p>
                </div>
              ) : filteredPosts.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                  <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{content.noPosts}</h3>
                  <p className="text-gray-600 mb-6">{content.noPostsDescription}</p>
                  <button
                    onClick={() => setShowCreatePost(true)}
                    className="bg-gradient-to-r from-green-500 to-red-500 text-white px-6 py-3 rounded-lg hover:from-green-600 hover:to-red-600 transition-all duration-200 font-medium"
                  >
                    {content.createPost}
                  </button>
                </div>
              ) : (
                <AnimatePresence>
                  {filteredPosts.map((post, index) => (
                    <motion.div
                      key={post.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200 cursor-pointer"
                      onClick={() => handlePostClick(post.id)}
                    >
                      {post.status === 'removed' ? (
                        <div className="p-8 text-center">
                          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                          <p className="text-gray-600 text-lg">{content.postRemoved}</p>
                        </div>
                      ) : (
                        <div className="p-4 lg:p-6">
                          {/* Post Header */}
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-red-500 rounded-full flex items-center justify-center">
                                <User className="h-5 w-5 text-white" />
                              </div>
                              <div>
                                <h3 className="font-semibold text-gray-900">{post.userName || 'Anonymous'}</h3>
                                <div className="flex items-center space-x-2 text-sm text-gray-500">
                                  <MapPin className="h-4 w-4" />
                                  <span>{post.constituencyName || `Constituency ${post.constituency}`}</span>
                                  <span>•</span>
                                  <span>{formatRelativeTime(post.createdAt)}</span>
                                </div>
                              </div>
                            </div>
                            
                            {/* Status Badge */}
                            {post.status === 'under_review' && (
                              <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full flex items-center">
                                <Shield className="h-3 w-3 mr-1" />
                                {content.underReview}
                              </span>
                            )}
                          </div>

                          {/* Post Content */}
                          <div className="mb-4">
                            <h2 
                              className="text-lg lg:text-xl font-bold text-gray-900 mb-3 hover:text-green-600 transition-colors cursor-pointer"
                              onClick={() => handlePostClick(post.id)}
                            >
                              {post.title}
                            </h2>
                            <p className="text-gray-700 leading-relaxed mb-4">{post.content}</p>
                            
                            {/* Tags */}
                            {post.tags && post.tags.length > 0 && (
                              <div className="flex flex-wrap gap-2 mb-4">
                                {post.tags.map((tag, tagIndex) => (
                                  <span
                                    key={tagIndex}
                                    className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                                  >
                                    #{tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Engagement Section */}
                          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                            <div className="flex items-center space-x-6">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleLike(post.id);
                                }}
                                className={`flex items-center space-x-2 p-2 rounded-lg transition-colors ${
                                  userReactions[post.id]?.liked 
                                    ? 'text-red-500 bg-red-50' 
                                    : 'text-gray-500 hover:text-red-500 hover:bg-red-50'
                                }`}
                              >
                                <Heart className={`h-5 w-5 ${userReactions[post.id]?.liked ? 'fill-current' : ''}`} />
                                <span className="text-sm font-medium">{post.likesCount || 0}</span>
                              </button>

                              <button 
                                onClick={(e) => e.stopPropagation()}
                                className="flex items-center space-x-2 text-gray-500 hover:text-green-500 hover:bg-green-50 p-2 rounded-lg transition-colors"
                              >
                                <Share2 className="h-5 w-5" />
                                <span className="text-sm font-medium">{content.share}</span>
                              </button>
                            </div>
                            
                            <button
                              onClick={() => toggleComments(post.id)}
                              className="text-sm text-gray-500 hover:text-green-600 transition-colors"
                            >
                              {showComments[post.id] ? 'Hide Comments' : `Show ${post.commentsCount || 0} Comments`}
                            </button>
                          </div>

                          {/* Comment Input */}
                          <div className="mt-4 pt-4 border-t border-gray-100">
                            <div className="flex space-x-3">
                              <div className="flex-1">
                                <input
                                  type="text"
                                  placeholder={content.writeComment}
                                  value={commentText[post.id] || ''}
                                  onChange={(e) => setCommentText(prev => ({
                                    ...prev,
                                    [post.id]: e.target.value
                                  }))}
                                  onClick={(e) => e.stopPropagation()}
                                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                />
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCommentSubmit(post.id);
                                }}
                                className="px-6 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
                              >
                                {content.comment}
                              </button>
                            </div>
                          </div>

                          {/* Comments Section */}
                          {showComments[post.id] && (
                            <div className="mt-4 pt-4 border-t border-gray-100">
                              <div className="space-y-3">
                                {/* Comments will be loaded from Firebase here */}
                                <div className="text-center text-gray-500 py-4">
                                  No comments yet. Be the first to comment!
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Floating Action Button - Mobile */}
      <div className="lg:hidden fixed bottom-6 right-6 z-30">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowCreatePost(true)}
          className="w-16 h-16 bg-gray-800 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center"
        >
          <Plus className="w-6 h-6" />
        </motion.button>
        <div className="absolute -top-2 -right-2 bg-white text-gray-800 text-xs px-2 py-1 rounded-full border border-gray-200 whitespace-nowrap">
          {content.createPost}
        </div>
      </div>

      {/* Bottom Navigation - Mobile */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-20">
        <div className="flex items-center justify-around py-2">
          <button
            onClick={() => setActiveTab('home')}
            className={`flex flex-col items-center space-y-1 p-2 rounded-lg transition-colors ${
              activeTab === 'home' ? 'text-green-600 bg-green-50' : 'text-gray-500'
            }`}
          >
            <Home className="w-5 h-5" />
            <span className="text-xs">{content.home}</span>
          </button>
          <button
            onClick={() => setActiveTab('discussion')}
            className={`flex flex-col items-center space-y-1 p-2 rounded-lg transition-colors ${
              activeTab === 'discussion' ? 'text-green-600 bg-green-50' : 'text-gray-500'
            }`}
          >
            <ChatBubble className="w-5 h-5" />
            <span className="text-xs">{content.discussion}</span>
          </button>
          <button
            onClick={() => setActiveTab('area')}
            className={`flex flex-col items-center space-y-1 p-2 rounded-lg transition-colors ${
              activeTab === 'area' ? 'text-green-600 bg-green-50' : 'text-gray-500'
            }`}
          >
            <MapPin className="w-5 h-5" />
            <span className="text-xs">{content.area}</span>
          </button>
        </div>
      </div>

      {/* Create Post Modal */}
      <CreatePost
        isOpen={showCreatePost}
        onClose={() => setShowCreatePost(false)}
        onPostCreated={handlePostCreated}
      />
    </div>
  );
};

export default DiscussionForum;