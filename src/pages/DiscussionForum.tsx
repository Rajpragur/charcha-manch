import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MessageSquare, ThumbsUp, Clock, TrendingUp, User, MapPin, AlertTriangle, Shield, Trash2, Eye } from 'lucide-react';
import Fuse from 'fuse.js';
import toast from 'react-hot-toast';
import FirebaseService from '../services/firebaseService';
import CreatePost from '../components/CreatePost';

interface DiscussionPost {
  id: string;
  title: string;
  content: string;
  constituency: number;
  constituencyName?: string;
  userId: string;
  userName?: string;
  userConstituency?: number;
  createdAt: any;
  interactionsCount: number;
  likesCount: number;
  commentsCount: number;
  status: 'published' | 'under_review' | 'removed';
  isLiked?: boolean;
  isCommented?: boolean;
}

interface Constituency {
  id: number;
  name: string;
  postCount: number;
}

const DiscussionForum: React.FC = () => {
  const { isEnglish } = useLanguage();
  const { currentUser } = useAuth();
  const [posts, setPosts] = useState<DiscussionPost[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<DiscussionPost[]>([]);
  const [constituencies, setConstituencies] = useState<Constituency[]>([]);
  const [selectedConstituencies, setSelectedConstituencies] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'interactions' | 'recent'>('interactions');
  const [isLoading, setIsLoading] = useState(true);
  const [showLowResultsButton, setShowLowResultsButton] = useState(false);
  const [showAllPostsButton, setShowAllPostsButton] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const content = {
    title: isEnglish ? 'Discussion Forum' : 'चर्चा मंच',
    subtitle: isEnglish ? 'Share your thoughts and engage with citizens across Bihar' : 'बिहार भर के नागरिकों के साथ अपने विचार साझा करें',
    filterByConstituency: isEnglish ? 'Filter by Constituency' : 'निर्वाचन क्षेत्र द्वारा फ़िल्टर करें',
    allConstituencies: isEnglish ? 'All Constituencies' : 'सभी निर्वाचन क्षेत्र',
    searchPlaceholder: isEnglish ? 'Search discussions...' : 'चर्चाएं खोजें...',
    sortBy: isEnglish ? 'Sort by' : 'इसके अनुसार क्रमबद्ध करें',
    mostInteractions: isEnglish ? 'Most Interactions' : 'सबसे अधिक इंटरैक्शन',
    recentPosts: isEnglish ? 'Recent Posts' : 'हाल के पोस्ट',
    createPost: isEnglish ? 'Create Post' : 'पोस्ट बनाएं',
    noPosts: isEnglish ? 'No posts found' : 'कोई पोस्ट नहीं मिला',
    loading: isEnglish ? 'Loading discussions...' : 'चर्चाएं लोड हो रही हैं...',
    viewAllConstituencies: isEnglish ? 'View All Constituencies' : 'सभी निर्वाचन क्षेत्र देखें',
    seeAllPosts: isEnglish ? 'See all posts' : 'सभी पोस्ट देखें',
    postRemoved: isEnglish ? 'This post was removed due to violation of forum rules.' : 'यह पोस्ट फोरम नियमों के उल्लंघन के कारण हटा दिया गया था।',
    underReview: isEnglish ? 'Under Review' : 'समीक्षा के तहत',
    published: isEnglish ? 'Published' : 'प्रकाशित',
    removed: isEnglish ? 'Removed' : 'हटाया गया'
  };

  // Threshold for low results
  const LOW_RESULTS_THRESHOLD = 10;

  // Fuse.js configuration for fuzzy search
  const fuse = useMemo(() => new Fuse(posts, {
    keys: ['title', 'content'],
    threshold: 0.3,
    includeScore: true
  }), [posts]);

  // Fetch posts and constituencies
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch posts
        const fetchedPosts = await FirebaseService.getDiscussionPosts();
        setPosts(fetchedPosts);
        
        // Fetch constituencies with post counts
        const fetchedConstituencies = await FirebaseService.getConstituenciesWithPostCounts();
        setConstituencies(fetchedConstituencies);
        
        // Check if user is admin
        if (currentUser?.uid) {
          // For now, we'll check if user has admin privileges through other means
          // This can be enhanced later with proper role-based access control
          setIsAdmin(false); // Default to false, can be enhanced
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load discussions');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [currentUser?.uid]);

  // Set default constituency selection
  useEffect(() => {
    if (constituencies.length > 0 && posts.length > 0) {
      if (!currentUser?.uid) {
        // Not logged in - select all constituencies
        setSelectedConstituencies(constituencies.map(c => c.id));
      } else {
        // Logged in - check user's constituency
        const userConstituency = posts.find(p => p.userId === currentUser.uid)?.userConstituency;
        if (userConstituency) {
          const constituencyPosts = posts.filter(p => p.constituency === userConstituency);
          if (constituencyPosts.length >= LOW_RESULTS_THRESHOLD) {
            setSelectedConstituencies([userConstituency]);
          } else {
            setSelectedConstituencies(constituencies.map(c => c.id));
          }
        } else {
          setSelectedConstituencies(constituencies.map(c => c.id));
        }
      }
    }
  }, [constituencies, posts, currentUser?.uid]);

  // Filter and search posts
  useEffect(() => {
    let filtered = posts;

    // Filter by constituency
    if (selectedConstituencies.length > 0 && !selectedConstituencies.includes(-1)) {
      filtered = filtered.filter(post => selectedConstituencies.includes(post.constituency));
    }

    // Search
    if (searchTerm.trim()) {
      const searchResults = fuse.search(searchTerm);
      filtered = searchResults.map(result => result.item);
    }

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === 'interactions') {
        return b.interactionsCount - a.interactionsCount;
      } else {
        return new Date(b.createdAt?.toDate?.() || b.createdAt).getTime() - 
               new Date(a.createdAt?.toDate?.() || a.createdAt).getTime();
      }
    });

    setFilteredPosts(filtered);

    // Check if we should show low results buttons
    if (selectedConstituencies.length === 1 && filtered.length < LOW_RESULTS_THRESHOLD) {
      setShowLowResultsButton(true);
    } else {
      setShowLowResultsButton(false);
    }

    if (searchTerm.trim() && filtered.length < LOW_RESULTS_THRESHOLD) {
      setShowAllPostsButton(true);
    } else {
      setShowAllPostsButton(false);
    }
  }, [posts, selectedConstituencies, searchTerm, sortBy, fuse]);



  // Handle view all constituencies
  const handleViewAllConstituencies = () => {
    setSelectedConstituencies(constituencies.map(c => c.id));
    setShowLowResultsButton(false);
  };

  // Handle see all posts
  const handleSeeAllPosts = () => {
    setSearchTerm('');
    setShowAllPostsButton(false);
  };

  // Handle post removal (admin only)
  const handleRemovePost = async (postId: string) => {
    if (!isAdmin) return;

    try {
      await FirebaseService.removeDiscussionPost(postId);
      setPosts(prev => prev.map(post => 
        post.id === postId ? { ...post, status: 'removed' } : post
      ));
      toast.success('Post removed successfully');
    } catch (error) {
      console.error('Error removing post:', error);
      toast.error('Failed to remove post');
    }
  };

  // Handle post approval (admin only)
  const handleApprovePost = async (postId: string) => {
    if (!isAdmin) return;

    try {
      await FirebaseService.approveDiscussionPost(postId);
      setPosts(prev => prev.map(post => 
        post.id === postId ? { ...post, status: 'published' } : post
      ));
      toast.success('Post approved successfully');
    } catch (error) {
      console.error('Error approving post:', error);
      toast.error('Failed to approve post');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">{content.loading}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-700 via-slate-800 to-slate-900 text-white py-12 sm:py-16 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4 sm:mb-6">
            {content.title}
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl mb-8 max-w-4xl mx-auto text-slate-200">
            {content.subtitle}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Constituency Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {content.filterByConstituency}
              </label>
              <div className="relative">
                <select
                  multiple
                  value={selectedConstituencies.map(String)}
                  onChange={(e) => {
                    const values = Array.from(e.target.selectedOptions, option => Number(option.value));
                    setSelectedConstituencies(values);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                >
                  <option value={-1}>{content.allConstituencies}</option>
                  {constituencies.map(constituency => (
                    <option key={constituency.id} value={constituency.id}>
                      {constituency.name} ({constituency.postCount})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder={content.searchPlaceholder}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Sort */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {content.sortBy}
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'interactions' | 'recent')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              >
                <option value="interactions">{content.mostInteractions}</option>
                <option value="recent">{content.recentPosts}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex space-x-3">
            {showLowResultsButton && (
              <motion.button
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={handleViewAllConstituencies}
                className="bg-sky-600 text-white px-4 py-2 rounded-lg hover:bg-sky-700 transition-colors"
              >
                {content.viewAllConstituencies}
              </motion.button>
            )}
            {showAllPostsButton && (
              <motion.button
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={handleSeeAllPosts}
                className="bg-slate-600 text-white px-4 py-2 rounded-lg hover:bg-slate-700 transition-colors"
              >
                {content.seeAllPosts}
              </motion.button>
            )}
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-sky-600 text-white px-6 py-3 rounded-lg hover:bg-sky-700 transition-colors font-medium"
          >
            {content.createPost}
          </motion.button>
        </div>

        {/* Posts List */}
        <div className="space-y-6">
          <AnimatePresence>
            {filteredPosts.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-lg shadow-md p-12 text-center"
              >
                <div className="text-gray-400 text-6xl mb-4">💬</div>
                <h3 className="text-xl font-semibold text-gray-600 mb-2">{content.noPosts}</h3>
                <p className="text-gray-500">
                  {searchTerm 
                    ? `No posts found matching "${searchTerm}"`
                    : selectedConstituencies.length < constituencies.length 
                      ? 'No posts found in selected constituencies'
                      : 'No posts available at the moment.'
                  }
                </p>
              </motion.div>
            ) : (
              filteredPosts.map((post, index) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-lg shadow-md overflow-hidden"
                >
                  {post.status === 'removed' ? (
                    <div className="p-6 text-center">
                      <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                      <p className="text-gray-600">{content.postRemoved}</p>
                    </div>
                  ) : (
                    <div className="p-6">
                      {/* Post Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-sky-100 rounded-full flex items-center justify-center">
                            <User className="h-5 w-5 text-sky-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{post.userName || 'Anonymous'}</h3>
                            <div className="flex items-center space-x-2 text-sm text-gray-500">
                              <MapPin className="h-4 w-4" />
                              <span>{post.constituencyName || `Constituency ${post.constituency}`}</span>
                              <Clock className="h-4 w-4" />
                              <span>{new Date(post.createdAt?.toDate?.() || post.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Status Badge */}
                        <div className="flex items-center space-x-2">
                          {post.status === 'under_review' && (
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full flex items-center">
                              <Shield className="h-3 w-3 mr-1" />
                              {content.underReview}
                            </span>
                          )}
                          
                          {/* Admin Controls */}
                          {isAdmin && (
                            <div className="flex items-center space-x-1">
                              {post.status === 'under_review' && (
                                <button
                                  onClick={() => handleApprovePost(post.id)}
                                  className="p-1 text-green-600 hover:text-green-700 hover:bg-green-50 rounded"
                                  title="Approve post"
                                >
                                  <Eye className="h-4 w-4" />
                                </button>
                              )}
                              <button
                                onClick={() => handleRemovePost(post.id)}
                                className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded"
                                title="Remove post"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Post Content */}
                      <div className="mb-4">
                        <h2 className="text-xl font-bold text-gray-900 mb-2">{post.title}</h2>
                        <p className="text-gray-700 leading-relaxed">{post.content}</p>
                      </div>

                      {/* Post Footer */}
                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <div className="flex items-center space-x-6 text-sm text-gray-500">
                          <span className="flex items-center">
                            <ThumbsUp className="h-4 w-4 mr-2" />
                            {post.likesCount || 0}
                          </span>
                          <span className="flex items-center">
                            <MessageSquare className="h-4 w-4 mr-2" />
                            {post.commentsCount || 0}
                          </span>
                          <span className="flex items-center">
                            <TrendingUp className="h-4 w-4 mr-2" />
                            {post.interactionsCount || 0} total
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default DiscussionForum;
