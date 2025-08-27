import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useAdmin } from '../contexts/AdminContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
  X,
  ChevronDown,
  Flame,
  Share2,
  Award,
  Heart,
  Home,
  MessageCircle as ChatBubble,
  Trash2,
  MoreVertical,
  ThumbsDown,
  Check
} from 'lucide-react';
import Fuse from 'fuse.js';
import toast from 'react-hot-toast';
import FirebaseService from '../services/firebaseService';
import CreatePost from '../components/CreatePost';

interface DiscussionPost {
  id: string;
  titlefirst: string;
  titlesecond: string;
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
  const { isAdmin } = useAdmin();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [posts, setPosts] = useState<DiscussionPost[]>([]);
  const [constituencies, setConstituencies] = useState<Constituency[]>([]);
  const [selectedConstituencies, setSelectedConstituencies] = useState<number[]>([]);
  const [selectedConstituency, setSelectedConstituency] = useState<number | null>(null);
  const [showAllConstituencies, setShowAllConstituencies] = useState(false);
  const [constituencyThreshold] = useState(5); // Minimum posts threshold
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'trending' | 'interactions' | 'top'>('recent');
  const [isLoading, setIsLoading] = useState(false);

  const [showCreatePost, setShowCreatePost] = useState(false);
  const [showConstituencyFilter, setShowConstituencyFilter] = useState(false);
  const [editingPost, setEditingPost] = useState<DiscussionPost | null>(null);


  const [activeTab, setActiveTab] = useState<'home' | 'discussion' | 'area'>('discussion');

  const [showComments, setShowComments] = useState<{ [postId: string]: boolean }>({});
  const [userReactions, setUserReactions] = useState<{ [postId: string]: { liked: boolean; disliked: boolean } }>({});
  const [showPostMenu, setShowPostMenu] = useState<{ [postId: string]: boolean }>({});
  const [copiedPostId, setCopiedPostId] = useState<string | null>(null);

  const content = {
    titlefirst: isEnglish ? 'Charcha' : 'चर्चा',
    titlesecond: isEnglish ? 'Manch' : 'मंच',
    subtitle: isEnglish ? 'Platform for Dialogue and Community Cooperation' : 'संवाद और सामुदायिक सहयोग का मंच',
    createPost: isEnglish ? 'New Discussion' : 'नई चर्चा',
    searchPlaceholder: isEnglish ? 'Search discussions, issues, candidates...' : 'चर्चा, मुद्दे, उम्मीदवार खोजें...',
    allConstituencies: isEnglish ? 'All Constituencies' : 'All Constituencies',
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
    discussion: isEnglish ? 'Charcha Manch' : 'चर्चा मंच',
    area: isEnglish ? 'Your Area' : 'आपका क्षेत्र',
    reply: isEnglish ? 'Reply' : 'जवाब दें',
    save: isEnglish ? 'Save' : 'सहेजें',
    delete: isEnglish ? 'Delete' : 'हटाएं',
    deleteConfirm: isEnglish ? 'Are you sure you want to delete this post? This action cannot be undone.' : 'क्या आप वाकई इस पोस्ट को हटाना चाहते हैं? यह क्रिया पूर्ववत नहीं की जा सकती।',
    postDeleted: isEnglish ? 'Post deleted successfully' : 'पोस्ट सफलतापूर्वक हटा दी गई',
    deleteFailed: isEnglish ? 'Failed to delete post' : 'पोस्ट हटाने में विफल'
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
    if (!showAllConstituencies && selectedConstituencies.length > 0) {
      filtered = filtered.filter(post => selectedConstituencies.includes(post.constituency));
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
  }, [posts, selectedConstituencies, showAllConstituencies, searchTerm, sortBy, fuse]);
  const shouldShowAllConstituenciesOption = useMemo(() => {
    if (selectedConstituencies.length === 0) return false;
    
    const selectedConstituencyPosts = posts.filter(post => 
      selectedConstituencies.includes(post.constituency)
    );
    
    return selectedConstituencyPosts.length < constituencyThreshold;
  }, [posts, selectedConstituencies, constituencyThreshold]);
  
  const shouldShowAllResultsOption = useMemo(() => {
    if (!searchTerm.trim()) return false;
    
    const searchResults = fuse.search(searchTerm);
    return searchResults.length < 10; // Show option if less than 10 search results
  }, [searchTerm, fuse]);

  // Fetch posts and constituencies
  useEffect(() => {
    fetchData();
  }, [currentUser?.uid]);


  // Handle URL parameters for constituency selection
  useEffect(() => {
    const constituencyParam = searchParams.get('constituency');
    const constituencyNameParam = searchParams.get('name');
    
    if (constituencies.length > 0) {
      let constituencyId: number | null = null;
      
      // Try to find constituency by ID first
      if (constituencyParam && !isNaN(Number(constituencyParam))) {
        const id = Number(constituencyParam);
        const constituencyExists = constituencies.find(c => c.id === id);
        if (constituencyExists) {
          constituencyId = id;
        }
      }
      
      // If no ID found, try to find by name
      if (!constituencyId && constituencyNameParam) {
        const constituencyByName = constituencies.find(c => 
          c.name.toLowerCase().includes(constituencyNameParam.toLowerCase()) ||
          (c.area_name && c.area_name.toLowerCase().includes(constituencyNameParam.toLowerCase()))
        );
        if (constituencyByName) {
          constituencyId = constituencyByName.id;
        }
      }
      
      // Set the constituency if found
      if (constituencyId) {
        setSelectedConstituencies([constituencyId]);
        setSelectedConstituency(constituencyId);
        setShowAllConstituencies(false);
        
        // Clean up URL parameters after setting the constituency
        const newSearchParams = new URLSearchParams(searchParams);
        newSearchParams.delete('constituency');
        newSearchParams.delete('name');
        navigate(`/discussion?${newSearchParams.toString()}`, { replace: true });
      } else if (constituencyParam || constituencyNameParam) {
      }
    }
  }, [searchParams, navigate, constituencies]);

  // Handle edit parameter from URL - only after posts are loaded
  useEffect(() => {
    const editPostId = searchParams.get('edit');
    if (editPostId && posts.length > 0) {
      
      // Find the post to edit
      const postToEdit = posts.find(post => post.id === editPostId);
      if (postToEdit) {
        setEditingPost(postToEdit);
        setShowCreatePost(true);
      } else {
        // If post not found in current posts, fetch it
        fetchPostForEdit(editPostId);
      }
    }
  }, [searchParams, posts]);

  // Handle edit parameter immediately if available
  useEffect(() => {
    const editPostId = searchParams.get('edit');
    if (editPostId && !isLoading && posts.length === 0) {
      fetchPostForEdit(editPostId);
    }
  }, [searchParams, isLoading, posts.length]);

  // Handle constituency selection
  const handleConstituencyChange = (constituencyId: number | null) => {
    if (constituencyId === null) {
      setSelectedConstituencies([]);
      setSelectedConstituency(null);
      setShowAllConstituencies(false);
    } else {
      setSelectedConstituencies([constituencyId]);
      setSelectedConstituency(constituencyId);
      setShowAllConstituencies(false);
    }
  };
  
  // Handle multi-constituency selection
  const handleMultiConstituencyChange = (constituencyId: number) => {
    setSelectedConstituencies(prev => {
      if (prev.includes(constituencyId)) {
        const newSelection = prev.filter(id => id !== constituencyId);
        // Update selectedConstituency if it was the one removed
        if (selectedConstituency === constituencyId) {
          setSelectedConstituency(newSelection.length > 0 ? newSelection[0] : null);
        }
        return newSelection;
      } else {
        const newSelection = [...prev, constituencyId];
        // Update selectedConstituency to the first selected
        if (newSelection.length === 1) {
          setSelectedConstituency(constituencyId);
        }
        return newSelection;
      }
    });
    setShowAllConstituencies(false);
  };
  
  // Show all constituencies
  const handleShowAllConstituencies = () => {
    setShowAllConstituencies(true);
    setSelectedConstituencies([]);
    setSelectedConstituency(null);
  };

  // Handle post creation
  const handlePostCreated = () => {
    fetchData();
    // Clear editing state after post is created/updated
    setEditingPost(null);
    // Clean up URL parameters
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.delete('edit');
    navigate(`/discussion?${newSearchParams.toString()}`, { replace: true });
  };

  // Fetch post for editing if not found in current posts
  const fetchPostForEdit = async (postId: string) => {
    try {
      setIsLoading(true);
      
      
      // Try to fetch the post from Firebase
      const post = await FirebaseService.getDiscussionPost(postId);
      
      if (post) {
        setEditingPost(post);
        setShowCreatePost(true);
      } else {
        toast.error('Post not found for editing');
        // Clean up URL parameters
        const newSearchParams = new URLSearchParams(searchParams);
        newSearchParams.delete('edit');
        navigate(`/discussion?${newSearchParams.toString()}`, { replace: true });
      }
    } catch (error) {
      console.error('❌ Error fetching post for edit:', error);
      toast.error('Failed to load post for editing');
      // Clean up URL parameters
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete('edit');
      navigate(`/discussion?${newSearchParams.toString()}`, { replace: true });
    } finally {
      setIsLoading(false);
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

  // Function to sort constituencies with selected ones at the top
  const getSortedConstituencies = () => {
    if (!constituencies.length) return [];
    
    // Separate selected and unselected constituencies
    const selected = constituencies.filter(c => 
      selectedConstituencies.includes(c.id) || selectedConstituency === c.id
    );
    const unselected = constituencies.filter(c => 
      !selectedConstituencies.includes(c.id) && selectedConstituency !== c.id
    );
    
    // Return selected first, then unselected
    return [...selected, ...unselected];
  };

  // Function to check if a constituency is selected
  const isConstituencySelected = (constituencyId: number) => {
    return selectedConstituencies.includes(constituencyId) || selectedConstituency === constituencyId;
  };

  // Handle post deletion (user can only delete their own posts)
  const handleDeletePost = async (postId: string) => {
    if (!currentUser?.uid) {
      toast.error('Please sign in to delete posts');
      return;
    }

    if (window.confirm(content.deleteConfirm)) {
      try {
        await FirebaseService.deleteDiscussionPost(postId, currentUser.uid);
        toast.success(content.postDeleted);
        fetchData(); // Refresh the posts
      } catch (error: any) {
        console.error('Error deleting post:', error);
        toast.error(error.message || content.deleteFailed);
      }
    }
  };

  // Handle admin post removal
  const handleAdminRemovePost = async (postId: string) => {
    if (!isAdmin) {
      toast.error('Only admins can remove posts');
      return;
    }

    if (window.confirm('Are you sure you want to remove this post? This action cannot be undone.')) {
      try {
        await FirebaseService.removeDiscussionPost(postId);
        toast.success('Post removed successfully');
        fetchData(); // Refresh the posts
      } catch (error: any) {
        console.error('Error removing post:', error);
        toast.error('Failed to remove post');
      }
    }
  };

  // Toggle post menu
  const togglePostMenu = (postId: string) => {
    setShowPostMenu(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  };

  // Close post menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.post-menu')) {
        setShowPostMenu({});
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);



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
      
      // Check if there's a URL parameter for constituency selection
      const constituencyParam = searchParams.get('constituency');
      const constituencyNameParam = searchParams.get('name');
      const hasUrlConstituency = (constituencyParam && !isNaN(Number(constituencyParam))) || constituencyNameParam;
      
      if (!hasUrlConstituency) {
        // Auto-select constituencies based on threshold and user login status only if no URL parameter
        if (currentUser?.uid) {
          // If logged in, check if user's constituency has enough posts
          const userConstituencyPosts = fetchedPosts.filter(post => 
            post.userId === currentUser.uid
          );
          
          if (userConstituencyPosts.length > 0) {
            const userConstituency = userConstituencyPosts[0].constituency;
            const constituencyPostCount = fetchedPosts.filter(post => 
              post.constituency === userConstituency
            ).length;
            
            if (constituencyPostCount >= constituencyThreshold) {
              setSelectedConstituencies([userConstituency]);
              setSelectedConstituency(userConstituency);
              setShowAllConstituencies(false);
            } else {
              setSelectedConstituencies([]);
              setSelectedConstituency(null);
              setShowAllConstituencies(true);
            }
          } else {
            setSelectedConstituencies([]);
            setSelectedConstituency(null);
            setShowAllConstituencies(true);
          }
        } else {
          // If not logged in, show all constituencies by default
          setSelectedConstituencies([]);
          setSelectedConstituency(null);
          setShowAllConstituencies(true);
        }
      }
      
      // Fetch user reactions for all posts if logged in
      if (currentUser?.uid) {
        const reactions: { [postId: string]: { liked: boolean; disliked: boolean } } = {};
        for (const post of fetchedPosts) {
          const hasLiked = await FirebaseService.hasUserLikedPost(post.id, currentUser.uid);
          const hasDisliked = await FirebaseService.hasUserDislikedPost(post.id, currentUser.uid);
          reactions[post.id] = { liked: hasLiked, disliked: hasDisliked };
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
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} ${isEnglish ? 'hour ago' : 'घंटे पहले'}`;
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
      await FirebaseService.likePost(postId, currentUser.uid);
      
      // Get current like state
      const currentLikeState = userReactions[postId]?.liked || false;
      
      // Update local state
      setUserReactions(prev => ({
        ...prev,
        [postId]: { liked: !currentLikeState, disliked: false }
      }));
      
      setPosts(prev => prev.map(post => 
        post.id === postId 
          ? { ...post, likesCount: (post.likesCount || 0) + (currentLikeState ? -1 : 1) }
          : post
      ));
      
      toast.success(!currentLikeState ? 'Post liked!' : 'Post unliked');
    } catch (error: any) {
      console.error('Error updating like:', error);
      toast.error('Failed to update like');
    }
  };

  // Handle dislike
  const handleDislike = async (postId: string) => {
    if (!currentUser?.uid) {
      toast.error('Please sign in to dislike posts');
      return;
    }

    try {
      await FirebaseService.dislikePost(postId, currentUser.uid);
      
      // Get current dislike state
      const currentDislikeState = userReactions[postId]?.disliked || false;
      
      // Update local state
      setUserReactions(prev => ({
        ...prev,
        [postId]: { liked: false, disliked: !currentDislikeState }
      }));
      
      setPosts(prev => prev.map(post => 
        post.id === postId 
          ? { ...post, dislikesCount: (post.dislikesCount || 0) + (currentDislikeState ? -1 : 1) }
          : post
      ));
      
      toast.success(!currentDislikeState ? 'Post disliked!' : 'Post undisliked');
    } catch (error: any) {
      console.error('Error updating dislike:', error);
      toast.error('Failed to update dislike');
    }
  };

  // Handle share functionality
  const handleShare = async (postId: string) => {
    const postUrl = `${window.location.origin}/post/${postId}`;
    const postTitle = 'Check out this discussion on Charcha Manch';
    
    try {
      // Check if navigator.share is available and supported
      if (navigator.share && navigator.canShare) {
        const shareData = {
          title: postTitle,
          text: 'I found an interesting discussion on Charcha Manch',
          url: postUrl
        };
        
        if (navigator.canShare(shareData)) {
          await navigator.share(shareData);
          return;
        }
      }
      
      // Fallback to copying to clipboard
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(postUrl);
        setCopiedPostId(postId);
        toast.success('Post URL copied to clipboard!');
        
        // Reset copied state after 2 seconds
        setTimeout(() => setCopiedPostId(null), 2000);
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = postUrl;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        
        setCopiedPostId(postId);
        toast.success('Post URL copied to clipboard!');
        setTimeout(() => setCopiedPostId(null), 2000);
      }
    } catch (error) {
      console.error('Error sharing post:', error);
      
      // Final fallback - try to copy using execCommand
      try {
        const textArea = document.createElement('textarea');
        textArea.value = postUrl;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        
        setCopiedPostId(postId);
        toast.success('Post URL copied to clipboard!');
        setTimeout(() => setCopiedPostId(null), 2000);
      } catch (fallbackError) {
        console.error('Fallback copy failed:', fallbackError);
        toast.error('Failed to share post. Please copy the URL manually.');
      }
    }
  };



  const handlePostClick = (postId: string) => {
    navigate(`/post/${postId}`);
  };



  return (
    <div className="min-h-screen bg-[#c1cad1]">
      {/* Gap with background color - Mobile */}
      <div className="lg:hidden h-4 bg-[#c1cad1]"></div>
      
      {/* Main Title Card - Mobile */}
      <div className="text-center lg:hidden bg-white mx-2 rounded-lg shadow-sm border border-gray-200 p-2">
        <h1 className="text-xl font-bold bg-[#014e5c] bg-clip-text text-transparent mb-1">
          {content.titlefirst} <span className="text-[#dc3b21]">{content.titlesecond}</span>
        </h1>
        <p className="text-gray-600 text-sm">{content.subtitle}</p>
      </div>

      {/* Main Title Section */}
      <div className="hidden lg:block max-w-5xl mx-auto px-3 lg:px-4 py-4">
            <div className="flex items-center justify-center flex-col">
                <h1 className="text-2xl lg:text-3xl font-bold text-[#004030] mb-2">
                    {content.titlefirst} <span className="text-[#dc3b21]">{content.titlesecond}</span>
                </h1>
                <p className="text-base lg:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
                    {content.subtitle}
                </p>
            </div>
            <div className="mt-6 flex items-center justify-center flex-col">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowCreatePost(true)}
                className="bg-[#014e5c] text-white px-4 py-1.5 rounded-full hover:from-green-600 hover:to-red-600 transition-all duration-200 font-medium flex items-center space-x-2 shadow-md text-sm"
              >
                <Plus className="w-3 h-3" />
                <span>{content.createPost}</span>
              </motion.button>
            </div>
        {/* Search Bar Section */}
        <div className="max-w-4xl mx-auto mt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder={content.searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-500 text-base transition-all duration-200 bg-white shadow-sm"
            />
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-3 lg:px-4 py-3 lg:py-4 pb-20 lg:pb-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Left Sidebar - Desktop Only */}
          <div className="hidden lg:block lg:col-span-1 space-y-4">
            {/* Constituency Filter */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                <Filter className="w-4 h-4 text-gray-600" />
                <span>{content.selectConstituency}</span>
              </h3>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                <button
                  onClick={() => handleConstituencyChange(null)}
                  className={`w-full text-left px-2 py-1.5 rounded-md transition-colors text-sm ${
                    showAllConstituencies
                      ? 'bg-[#014e5c] text-white border border-green-200'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {content.allConstituencies}
                </button>
                
                {/* Selected Constituencies */}
                {getSortedConstituencies().filter(c => isConstituencySelected(c.id)).length > 0 && (
                  <>
                    {getSortedConstituencies().filter(c => isConstituencySelected(c.id)).map((constituency) => (
                      <button
                        key={constituency.id}
                        onClick={() => handleConstituencyChange(constituency.id)}
                        className="w-full text-left px-2 py-1.5 rounded-md transition-colors text-sm bg-[#014e5c] text-white"
                      >
                        {constituency.name}
                      </button>
                    ))}
                    
                    {/* Separator */}
                    <div className="border-t border-gray-200 my-2"></div>
                  </>
                )}
                
                {/* Unselected Constituencies */}
                {getSortedConstituencies().filter(c => !isConstituencySelected(c.id)).map((constituency) => (
                  <button
                    key={constituency.id}
                    onClick={() => handleConstituencyChange(constituency.id)}
                    className="w-full text-left px-2 py-1.5 rounded-md transition-colors text-sm text-gray-700 hover:bg-gray-50"
                  >
                    {constituency.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort Options */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h3 className="text-base font-semibold text-gray-900 mb-3">Sort by</h3>
              <div className="space-y-1.5">
                {[
                  { key: 'recent', label: 'Latest', icon: Clock },
                  { key: 'trending', label: 'Trending', icon: Flame },
                  { key: 'interactions', label: 'Most Active', icon: TrendingUp },
                  { key: 'top', label: 'Top', icon: Award }
                ].map((option) => (
                  <button
                    key={option.key}
                    onClick={() => setSortBy(option.key as any)}
                    className={`w-full flex items-center space-x-2 p-2 rounded-md transition-all duration-200 text-sm ${
                      sortBy === option.key
                        ? 'bg-[#014e5c] text-white border border-green-200'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <option.icon className={`w-3 h-3 ${sortBy === option.key ? 'text-white' : 'text-gray-500'}`} />
                    <span className="font-medium">{option.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-3 lg:space-y-4 mb-3">
            {/* Constituency Filter - Mobile */}
            <div className="lg:hidden bg-white rounded-lg shadow-sm border border-gray-200 p-3">
              <div className="flex items-center justify-between mb-3">
                <button
                onClick={() => setShowConstituencyFilter(!showConstituencyFilter)}
                className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-gray-900 flex items-center space-x-2">
                  <Filter className="w-4 h-4 text-gray-600" />
                  <span>{content.selectConstituency}</span>
                  {showConstituencyFilter ? (
                    <X className="w-4 h-4 text-gray-600" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-600" />
                  )}
                </h3>
                  
                </button>
              </div>
              
              {showConstituencyFilter && (
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  <button
                    onClick={() => handleConstituencyChange(null)}
                    className={`w-full text-left px-2 py-1.5 rounded-md transition-colors text-sm ${
                      selectedConstituencies.length === 0
                        ? 'bg-[#014e5c] text-white border border-green-200'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {content.allConstituencies}
                  </button>
                  
                  {/* Selected Constituencies */}
                  {getSortedConstituencies().filter(c => isConstituencySelected(c.id)).length > 0 && (
                    <>
                      {getSortedConstituencies().filter(c => isConstituencySelected(c.id)).map((constituency) => (
                        <button
                          key={constituency.id}
                          onClick={() => handleMultiConstituencyChange(constituency.id)}
                          className="w-full text-left px-2 py-1.5 rounded-md transition-colors text-sm bg-[#014e5c] text-white"
                        >
                          {constituency.name}
                        </button>
                      ))}
                      
                      {/* Separator */}
                      <div className="border-t border-gray-200 my-2"></div>
                    </>
                  )}
                  
                  {/* Unselected Constituencies */}
                  {getSortedConstituencies().filter(c => !isConstituencySelected(c.id)).map((constituency) => (
                    <button
                      key={constituency.id}
                      onClick={() => handleMultiConstituencyChange(constituency.id)}
                      className="w-full text-left px-2 py-1.5 rounded-md transition-colors text-sm text-gray-700 hover:bg-gray-50"
                    >
                      {constituency.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Search Bar */}
            <div className="lg:hidden bg-white rounded-lg shadow-sm border border-gray-200 p-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                <input
                  type="text"
                  placeholder={content.searchPlaceholder}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-2 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                />
              </div>
            </div>

            {/* Posts List */}
            <div className="space-y-3">
              {isLoading ? (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-3"></div>
                  <p className="text-gray-600 text-sm">{content.loading}</p>
                </div>
              ) : filteredPosts.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                  <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{content.noPosts}</h3>
                  <p className="text-gray-600 mb-4 text-sm">{content.noPostsDescription}</p>
                  <button
                    onClick={() => setShowCreatePost(true)}
                    className="bg-[#004e5c] text-white px-4 py-2 rounded-lg hover:from-green-600 hover:to-red-600 transition-all duration-200 font-medium text-sm"
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
                      className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200 cursor-pointer"
                      onClick={() => handlePostClick(post.id)}
                    >
                      {post.status === 'removed' ? (
                        <div className="p-6 text-center">
                          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-3" />
                          <p className="text-gray-600 text-base">{content.postRemoved}</p>
                        </div>
                      ) : (
                        <div className="p-3 lg:p-4">
                          {/* Post Header */}
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center space-x-2">
                              <div className="w-8 h-8 bg-[#014e5c] rounded-full flex items-center justify-center">
                                <User className="h-3 w-3 text-white" />
                              </div>
                              <div>
                                <h3 className="font-semibold text-gray-900 text-sm">{post.userName || 'User'}</h3>
                                <div className="flex items-center space-x-1.5 text-xs text-gray-500">
                                  <MapPin className="h-3 w-3" />
                                  <span>{post.constituencyName || `Constituency ${post.constituency}`}</span>
                                  <span>•</span>
                                  <span>{formatRelativeTime(post.createdAt)}</span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-1.5">
                              {/* Status Badge */}
                              {post.status === 'under_review' && (
                                <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full flex items-center">
                                  <Shield className="h-2.5 w-2.5 mr-1" />
                                  {content.underReview}
                                </span>
                              )}
                              
                              {/* Post Menu (show for post owner or admin) */}
                              {(currentUser?.uid === post.userId || isAdmin) && (
                                <div className="relative post-menu">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      togglePostMenu(post.id);
                                    }}
                                    className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
                                  >
                                    <MoreVertical className="h-3 w-3 text-gray-500" />
                                  </button>
                                  
                                  {showPostMenu[post.id] && (
                                    <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-10 min-w-[100px]">
                                      {/* User can delete their own posts */}
                                      {currentUser?.uid === post.userId && (
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeletePost(post.id);
                                            setShowPostMenu(prev => ({ ...prev, [post.id]: false }));
                                          }}
                                          className="w-full px-3 py-1.5 text-left text-red-600 hover:bg-red-50 flex items-center space-x-1.5 text-sm"
                                        >
                                          <Trash2 className="h-3 w-3" />
                                          <span>{content.delete}</span>
                                        </button>
                                      )}
                                      
                                      {/* Admin can remove any post */}
                                      {isAdmin && (
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleAdminRemovePost(post.id);
                                            setShowPostMenu(prev => ({ ...prev, [post.id]: false }));
                                          }}
                                          className="w-full px-3 py-1.5 text-left text-orange-600 hover:bg-orange-50 flex items-center space-x-1.5 text-sm"
                                        >
                                          <Shield className="h-3 w-3" />
                                          <span>Remove Post</span>
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Post Content */}
                          <div className="mb-3">
                            {/* Poster Name - Above Title */}
                            <div className="mb-1.5">
                              <span className="text-xs text-gray-600">
                                {isEnglish ? `Posted by ${post.userName || 'User'}` : `${post.userName || 'उपयोगकर्ता'} द्वारा पोस्ट किया गया`}
                              </span>
                            </div>
                            
                            {/* Post Title - More Prominent */}
                            <h2 
                              className="text-lg lg:text-xl font-bold text-gray-900 mb-3 hover:text-green-600 transition-colors cursor-pointer leading-tight"
                              onClick={() => handlePostClick(post.id)}
                            >
                              {post.titlefirst} {post.titlesecond}
                            </h2>
                            
                            {/* Post Content */}
                            <p 
                              className="text-gray-700 leading-relaxed mb-3 text-sm"
                              dangerouslySetInnerHTML={{ __html: renderFormattedText(post.content) }}
                            />
                            
                            {/* Tags */}
                            {post.tags && post.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mb-3">
                                {post.tags.map((tag, tagIndex) => (
                                  <span
                                    key={tagIndex}
                                    className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded-full"
                                  >
                                    #{tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Engagement Section */}
                          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                            <div className="flex items-center space-x-4">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleLike(post.id);
                                }}
                                disabled={userReactions[post.id]?.disliked}
                                className={`flex items-center space-x-1.5 p-1.5 rounded-md transition-colors ${
                                  userReactions[post.id]?.liked 
                                    ? 'text-red-500 bg-red-50' 
                                    : userReactions[post.id]?.disliked
                                    ? 'text-gray-300 cursor-not-allowed'
                                    : 'text-gray-500 hover:text-red-500 hover:bg-red-50'
                                }`}
                              >
                                <Heart className={`h-3 w-3 ${userReactions[post.id]?.liked ? 'fill-current' : ''}`} />
                                <span className="text-xs font-medium">{post.likesCount || 0}</span>
                              </button>

                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDislike(post.id);
                                }}
                                disabled={userReactions[post.id]?.liked}
                                className={`flex items-center space-x-1.5 p-1.5 rounded-md transition-colors ${
                                  userReactions[post.id]?.disliked 
                                    ? 'text-blue-500 bg-blue-50' 
                                    : userReactions[post.id]?.liked
                                    ? 'text-gray-300 cursor-not-allowed'
                                    : 'text-gray-500 hover:text-blue-500 hover:bg-blue-50'
                                }`}
                              >
                                <ThumbsDown className={`h-3 w-3 ${userReactions[post.id]?.disliked ? 'fill-current' : ''}`} />
                                <span className="text-xs font-medium">{post.dislikesCount || 0}</span>
                              </button>

                              {/* Share Button */}
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleShare(post.id);
                                }}
                                className="flex items-center space-x-1.5 p-1.5 rounded-md transition-colors text-gray-500 hover:text-green-600 hover:bg-green-50"
                                title={isEnglish ? 'Share this post' : 'इस पोस्ट को शेयर करें'}
                              >
                                {copiedPostId === post.id ? (
                                  <Check className="h-4 w-4 text-green-600" />
                                ) : (
                                  <Share2 className="h-4 w-4" />
                                )}
                                <span className="text-xs font-medium">
                                  {copiedPostId === post.id ? (isEnglish ? 'Copied!' : 'कॉपी किया!') : (isEnglish ? 'Share' : 'शेयर')}
                                </span>
                              </button>
                            </div>
                            
                            <button
                              onClick={() => toggleComments(post.id)}
                              className="text-xs text-gray-500 hover:text-green-600 transition-colors"
                            >
                            {showComments[post.id] ? isEnglish ? 'Hide Comments' : 'टिप्पणियाँ छुपाएं' : isEnglish ? `Show ${post.commentsCount || 0} Comments` : `${post.commentsCount || 0} टिप्पणियाँ दिखाएं `}
                            </button>
                          </div>

                          {/* Comments Section */}
                          {showComments[post.id] && (
                            <div className="mt-3 pt-3 border-t border-gray-100">
                              <div className="space-y-2">
                                {/* Comments will be loaded from Firebase here */}
                                <div className="text-center text-gray-500 py-3 text-sm">
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

            {/* Show All Options */}
            {shouldShowAllConstituenciesOption && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200"
              >
                <div className="text-center">
                  <h3 className="text-base font-semibold text-blue-900 mb-2">
                    {isEnglish ? 'Limited Posts in Selected Constituency' : 'चयनित निर्वाचन क्षेत्र में सीमित पोस्ट'}
                  </h3>
                  <p className="text-blue-700 mb-3 text-sm">
                    {isEnglish 
                      ? `Only ${filteredPosts.length} posts found in the selected constituency. View posts from all constituencies for more discussions.`
                      : `चयनित निर्वाचन क्षेत्र में केवल ${filteredPosts.length} पोस्ट मिले। अधिक चर्चाओं के लिए सभी निर्वाचन क्षेत्रों के पोस्ट देखें।`
                    }
                  </p>
                  <button
                    onClick={handleShowAllConstituencies}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
                  >
                    {isEnglish ? 'Show All Constituencies' : 'सभी निर्वाचन क्षेत्र दिखाएं'}
                  </button>
                </div>
              </motion.div>
            )}
            
            {shouldShowAllResultsOption && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-4 bg-white rounded-lg border border-green-200"
              >
                <div className="text-center">
                  <h3 className="text-base font-semibold text-green-900 mb-2">
                    {isEnglish ? 'Limited Search Results' : 'सीमित खोज परिणाम'}
                  </h3>
                  <p className="text-black mb-3 text-sm">
                    {isEnglish 
                      ? `Only ${filteredPosts.length} results found for "${searchTerm}". View all posts for more discussions.`
                      : `"${searchTerm}" के लिए केवल ${filteredPosts.length} परिणाम मिले। अधिक चर्चाओं के लिए सभी पोस्ट देखें।`
                    }
                  </p>
                  <button
                    onClick={() => setSearchTerm('')}
                    className="px-4 py-2 bg-[#014e5c] text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
                  >
                    {isEnglish ? 'Show All Posts' : 'सभी पोस्ट दिखाएं'}
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Community Rules Section */}
      <div className="mt-1 mb-2 px-2">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-4 lg:p-6">
            {/* Header Section */}
            <div className="text-center mb-6">
              <h2 className="text-xl lg:text-2xl font-bold text-[#014e5c] mb-2">
                {isEnglish ? 'Community Rules' : 'समुदायिक नियम'}
              </h2>
              <p className="text-sm text-gray-600 max-w-xl mx-auto">
                {isEnglish 
                  ? 'Guidelines to ensure a respectful and productive discussion environment'
                  : 'सम्मानजनक और उत्पादक चर्चा वातावरण सुनिश्चित करने के लिए दिशानिर्देश'
                }
              </p>
            </div>
            
            {/* Rules Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 mb-6">
              {/* Rule 1: Respectful Dialogue */}
              <div className="group hover:shadow-md transition-all duration-300 bg-gradient-to-br from-gray-50 to-white rounded-xl p-4 border border-gray-100">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-[#014e5c] to-[#016a7a] rounded-xl flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-300">
                    <MessageSquare className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-gray-900 mb-2">
                      {isEnglish ? 'Respectful Dialogue' : 'सम्मानजनक संवाद'}
                    </h3>
                    <p className="text-gray-700 text-xs leading-relaxed">
                      {isEnglish ? 'Engage in conversations with courtesy, empathy, and respect for all participants. Foster an environment where diverse perspectives are valued and constructive discussions thrive.' : 'सभी प्रतिभागियों के साथ शिष्टाचार, सहानुभूति और सम्मान के साथ बातचीत करें। ऐसा वातावरण बनाएं जहां विविध दृष्टिकोणों को महत्व दिया जाए और रचनात्मक चर्चाएं फलें-फूलें।'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Rule 2: Factual Information */}
              <div className="group hover:shadow-md transition-all duration-300 bg-gradient-to-br from-gray-50 to-white rounded-xl p-4 border border-gray-100">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-[#014e5c] to-[#016a7a] rounded-xl flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-300">
                    <Shield className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-gray-900 mb-2">
                      {isEnglish ? 'Factual Information' : 'तथ्यपरक जानकारी'}
                    </h3>
                    <p className="text-gray-700 text-xs leading-relaxed">
                      {isEnglish ? 'Share only verified, accurate, and well-researched information. Avoid spreading rumors, unverified claims, or misleading content that could harm the community.' : 'केवल सत्यापित, सटीक और अच्छी तरह से शोधित जानकारी साझा करें। अफवाहें, असत्यापित दावे, या भ्रामक सामग्री फैलाने से बचें जो समुदाय को नुकसान पहुंचा सकती है।'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Rule 3: Community Welfare */}
              <div className="group hover:shadow-md transition-all duration-300 bg-gradient-to-br from-gray-50 to-white rounded-xl p-4 border border-gray-100">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-[#014e5c] to-[#016a7a] rounded-xl flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-300">
                    <div className="w-5 h-5 text-white flex items-center justify-center">
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                        <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm4 18v-6h2v6h-2zm-8-4v-6h2v6h-2zm-8-4v-6h2v6H4zm4 4v-6h2v6H8zm4 4v-6h2v6h-2z"/>
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-gray-900 mb-2">
                      {isEnglish ? 'Community Welfare' : 'समुदायिक भलाई'}
                    </h3>
                    <p className="text-gray-700 text-xs leading-relaxed">
                      {isEnglish ? 'Contribute content that benefits the community as a whole. Focus on solutions, positive initiatives, and discussions that promote collective growth and development.' : 'ऐसी सामग्री योगदान करें जो समुदाय के समग्र कल्याण में मदद करे। समाधानों, सकारात्मक पहलों और सामूहिक विकास और प्रगति को बढ़ावा देने वाली चर्चाओं पर ध्यान केंद्रित करें।'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Rule 4: National Unity */}
              <div className="group hover:shadow-md transition-all duration-300 bg-gradient-to-br from-gray-50 to-white rounded-xl p-4 border border-gray-100">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-[#014e5c] to-[#016a7a] rounded-xl flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-300">
                    <div className="w-5 h-5 text-white flex items-center justify-center">
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                        <path d="M3 3h18v2H3V3zm0 8h18v2H3v-2zm0 8h18v2H3v-2z"/>
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-gray-900 mb-2">
                      {isEnglish ? 'National Unity' : 'राष्ट्रीय एकता'}
                    </h3>
                    <p className="text-gray-700 text-xs leading-relaxed">
                      {isEnglish ? 'Promote harmony and unity among all communities. Avoid content that discriminates based on religion, caste, language, or any other divisive factors.' : 'सभी समुदायों के बीच सद्भाव और एकता को बढ़ावा दें। धर्म, जाति, भाषा या किसी अन्य विभाजनकारी कारकों के आधार पर भेदभाव करने वाली सामग्री से बचें।'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Note Section */}
            <div className="bg-gradient-to-r from-gray-50 to-white rounded-xl p-4 border-l-4 border-[#014e5c]">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-[#014e5c] rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-gray-900 mb-2">
                    {isEnglish ? 'Important Note' : 'महत्वपूर्ण नोट'}
                  </h4>
                  <p className="text-gray-700 text-xs leading-relaxed">
                    {isEnglish 
                      ? 'Posts that violate these community rules may be removed. Repeated violations or spreading false information may result in account suspension. We are committed to maintaining a safe and respectful environment for all users.'
                      : 'इन समुदायिक नियमों का उल्लंघन करने वाली पोस्ट हटाई जा सकती हैं। बार-बार उल्लंघन या गलत जानकारी फैलाने पर खाता निलंबित किया जा सकता है। हम सभी उपयोगकर्ताओं के लिए एक सुरक्षित और सम्मानजनक वातावरण बनाए रखने के लिए प्रतिबद्ध हैं।'
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Action Button - Mobile */}
      <div className="lg:hidden fixed bottom-20 right-3 z-30">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowCreatePost(true)}
          className="w-20 h-10 bg-[#014e5c] text-white rounded-full shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center"
        >
          <Plus className="w-4 h-4 mr-1" />
          <span className="text-xs font-medium">{isEnglish ? 'Create Post' : 'नई चर्चा'}</span>
        </motion.button>
      </div>

      {/* Bottom Navigation - Mobile */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-20 shadow-lg">
        <div className="flex items-center justify-around py-2 px-1">
          <button
            onClick={() => navigate('/')}
            className={`flex flex-col items-center space-y-0.5 p-1.5 rounded-md transition-colors ${
              activeTab === 'home' ? 'text-[#014e5c] bg-[#014e5c]/10' : 'text-gray-500'
            }`}
          >
            <Home className="w-4 h-4" />
            <span className="text-xs font-medium">{content.home}</span>
          </button>
          <button
            onClick={() => setActiveTab('discussion')}
            className={`flex flex-col items-center space-y-0.5 p-1.5 rounded-md transition-colors ${
              activeTab === 'discussion' ? 'text-[#014e5c] bg-[#014e5c]/10' : 'text-gray-500'
            }`}
          >
            <ChatBubble className="w-4 h-4" />
            <span className="text-xs font-medium">{content.discussion}</span>
          </button>
          <button
            onClick={() => navigate('/aapka-kshetra')}
            className={`flex flex-col items-center space-y-0.5 p-1.5 rounded-md transition-colors ${
              activeTab === 'area' ? 'text-[#014e5c] bg-[#014e5c]/10' : 'text-gray-500'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span className="text-xs font-medium">{content.area}</span>
          </button>
        </div>
      </div>

      {/* Create Post Modal */}
      <CreatePost
        isOpen={showCreatePost}
        onClose={() => {
          setShowCreatePost(false);
          setEditingPost(null);
          // Clean up URL parameters
          const newSearchParams = new URLSearchParams(searchParams);
          newSearchParams.delete('edit');
          navigate(`/discussion?${newSearchParams.toString()}`, { replace: true });
        }}
        onPostCreated={handlePostCreated}
        editingPost={editingPost}
      />
    </div>
  );
};

export default DiscussionForum;