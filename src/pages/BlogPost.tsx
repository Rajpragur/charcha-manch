import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { Calendar, User, Tag, ThumbsUp, Eye, Clock, ArrowLeft, ArrowRight, Search, Loader } from 'lucide-react';
import FirebaseService from '../services/firebaseService';
import SignInPopup from '../components/SignInPopup';

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  authorId: string;
  createdAt: any;
  updatedAt: any;
  status: 'draft' | 'published' | 'archived';
  imageUrl?: string;
  slug: string;
  category?: string;
  featured?: boolean;
  views?: number;
  likes?: number;
  comments?: number;
}

const BlogPost: React.FC = () => {
  const navigate = useNavigate();
  const { isEnglish } = useLanguage();
  const { currentUser } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [likedBlogs, setLikedBlogs] = useState<Set<string>>(new Set());
  const [likeLoading, setLikeLoading] = useState<Set<string>>(new Set());
  const [showSignInPopup, setShowSignInPopup] = useState(false);

  const content = {
    title: isEnglish ? 'Blog & News' : 'ब्लॉग और समाचार',
    subtitle: isEnglish ? 'Stay updated with the latest political developments and citizen discussions in Bihar' : 'बिहार में नवीनतम राजनीतिक विकास और नागरिक चर्चाओं के साथ अपडेट रहें',
    searchPlaceholder: isEnglish ? 'Search articles...' : 'लेख खोजें...',
    categories: isEnglish ? 'Categories' : 'श्रेणियां',
    all: isEnglish ? 'All' : 'सभी',
    politics: isEnglish ? 'Politics' : 'राजनीति',
    development: isEnglish ? 'Development' : 'विकास',
    education: isEnglish ? 'Education' : 'शिक्षा',
    healthcare: isEnglish ? 'Healthcare' : 'स्वास्थ्य',
    agriculture: isEnglish ? 'Agriculture' : 'कृषि',
    infrastructure: isEnglish ? 'Infrastructure' : 'बुनियादी ढांचा',
    readMore: isEnglish ? 'Read More' : 'और पढ़ें',
    views: isEnglish ? 'views' : 'दृश्य',
    likes: isEnglish ? 'likes' : 'लाइक',

    readTime: isEnglish ? 'min read' : 'मिनट पढ़ने में',
    by: isEnglish ? 'by' : 'द्वारा',
    featured: isEnglish ? 'Featured' : 'विशेष',
    trending: isEnglish ? 'Trending' : 'चर्चित',
    recent: isEnglish ? 'Recent' : 'हाल के',
    popular: isEnglish ? 'Popular' : 'लोकप्रिय',
    noBlogs: isEnglish ? 'No blogs found' : 'कोई ब्लॉग नहीं मिला',
    loading: isEnglish ? 'Loading blogs...' : 'ब्लॉग लोड हो रहे हैं...',
    error: isEnglish ? 'Error loading blogs' : 'ब्लॉग लोड करने में त्रुटि',
    like: isEnglish ? 'Like' : 'लाइक',
    comment: isEnglish ? 'Comment' : 'टिप्पणी',
    share: isEnglish ? 'Share' : 'शेयर करें'
  };

  // Fetch blogs from database
  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        console.log('🔍 Fetching blogs from Firebase...');
        
        // Test basic Firestore access first
        try {
          const { collection, getDocs } = await import('firebase/firestore');
          const { db } = await import('../configs/firebase');
          
          console.log('🔍 Testing basic Firestore access...');
          const testRef = collection(db, 'blogs');
          const testSnapshot = await getDocs(testRef);
          console.log(`🔍 Basic access test: Found ${testSnapshot.size} documents in blogs collection`);
          
          if (testSnapshot.size > 0) {
            const firstDoc = testSnapshot.docs[0];
            console.log('🔍 First document data:', firstDoc.data());
          }
        } catch (testError) {
          console.error('❌ Basic Firestore access test failed:', testError);
        }
        
        // Fetch published blogs from Firebase
        const blogs = await FirebaseService.getPublishedBlogs();
        
        console.log('📝 Raw blogs from Firebase:', blogs);
        console.log('📝 Number of blogs fetched:', blogs.length);
        
        // Transform the data to match our interface
        const transformedBlogs: BlogPost[] = blogs.map((blog: any) => ({
          id: blog.id,
          title: blog.title || 'Untitled',
          excerpt: blog.excerpt || '',
          content: blog.content || '',
          author: blog.author || 'Admin',
          authorId: blog.authorId || '',
          createdAt: blog.createdAt,
          updatedAt: blog.updatedAt,
          status: blog.status || 'draft',
          imageUrl: blog.imageUrl || '',
          slug: blog.slug || '',
          category: blog.category || 'General',
          featured: blog.featured || false,
          views: blog.views || 0,
          likes: blog.likes || 0,
          comments: blog.comments || 0
        }));

        console.log('🔄 Transformed blogs:', transformedBlogs);
        console.log('🔄 Number of transformed blogs:', transformedBlogs.length);

        setBlogPosts(transformedBlogs);
        setFilteredPosts(transformedBlogs);
        
        console.log('✅ Blogs set to state successfully');
      } catch (err) {
        console.error('❌ Error fetching blogs:', err);
        setError(content.error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBlogs();
  }, [content.error]);

  // Load liked blogs from database
  useEffect(() => {
    const loadUserLikes = async () => {
      if (currentUser?.uid) {
        try {
          console.log('🔍 Loading likes for user:', currentUser.uid);
          const likedBlogIds = await FirebaseService.getUserLikedBlogs(currentUser.uid);
          setLikedBlogs(new Set(likedBlogIds));
          console.log('✅ Loaded likes:', likedBlogIds);
        } catch (error) {
          console.error('❌ Error loading user likes:', error);
        }
      } else {
        console.log('👤 No user authenticated, clearing likes');
        setLikedBlogs(new Set());
      }
    };

    loadUserLikes();
  }, [currentUser?.uid]);

  // Filter blogs based on category and search
  useEffect(() => {
    let filtered = blogPosts;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(post => post.category?.toLowerCase() === selectedCategory.toLowerCase());
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(post => 
        post.title.toLowerCase().includes(searchLower) ||
        post.excerpt.toLowerCase().includes(searchLower) ||
        post.content.toLowerCase().includes(searchLower)
      );
    }

    setFilteredPosts(filtered);
  }, [blogPosts, selectedCategory, searchTerm]);

  // Calculate reading time for content
  const calculateReadingTime = (content: string): number => {
    const words = content.trim().split(/\s+/).filter(word => word.length > 0);
    return Math.ceil(words.length / 200); // Average reading speed: 200 words per minute
  };

  // Format date
  const formatDate = (date: any): string => {
    if (!date) return 'Unknown date';
    
    try {
      if (date.toDate) {
        return date.toDate().toLocaleDateString();
      } else if (date instanceof Date) {
        return date.toLocaleDateString();
      } else {
        return new Date(date).toLocaleDateString();
      }
    } catch {
      return 'Unknown date';
    }
  };

  // Function to navigate to blog detail
  const openBlogDetail = (blog: BlogPost) => {
    navigate(`/blog/${blog.id}`);
  };

  // Function to handle blog likes
  const handleLike = async (blogId: string) => {
    if (!currentUser?.uid) {
      console.log('👤 No user authenticated, showing sign-in popup');
      setShowSignInPopup(true);
      return;
    }

    // Prevent multiple clicks while processing
    if (likeLoading.has(blogId)) return;

    try {
      setLikeLoading(prev => new Set(prev).add(blogId));
      
      const result = await FirebaseService.toggleBlogLike(blogId, currentUser.uid);
      
      if (result.success) {
        // Update local state
        setLikedBlogs(prev => {
          const newLikedBlogs = new Set(prev);
          if (result.isLiked) {
            newLikedBlogs.add(blogId);
          } else {
            newLikedBlogs.delete(blogId);
          }
          return newLikedBlogs;
        });

        // Update blog posts with new like count
        setBlogPosts(prev => 
          prev.map(blog => 
            blog.id === blogId 
              ? { ...blog, likes: result.newLikeCount }
              : blog
          )
        );

        // Update filtered posts as well
        setFilteredPosts(prev => 
          prev.map(blog => 
            blog.id === blogId 
              ? { ...blog, likes: result.newLikeCount }
              : blog
          )
        );


      } else {
        console.error('Failed to update like');
      }
    } catch (error) {
      console.error('Error handling like:', error);
      alert('Failed to update like. Please try again.');
    } finally {
      setLikeLoading(prev => {
        const newSet = new Set(prev);
        newSet.delete(blogId);
        return newSet;
      });
    }
  };

  // Function to share blog
  const handleShare = (blog: BlogPost) => {
    const shareData = {
      title: blog.title,
      text: blog.excerpt,
      url: `${window.location.origin}/blog/${blog.slug || blog.id}`
    };

    if (navigator.share) {
      navigator.share(shareData);
    } else {
      // Fallback: copy to clipboard
      const shareUrl = shareData.url;
      navigator.clipboard.writeText(shareUrl).then(() => {
        alert('Blog link copied to clipboard!');
      }).catch(() => {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = shareUrl;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        alert('Blog link copied to clipboard!');
      });
    }
  };

  // Get unique categories from blogs
  const categories = [
    { id: 'all', name: content.all, count: blogPosts.length },
    { id: 'politics', name: content.politics, count: blogPosts.filter(post => post.category?.toLowerCase() === 'politics').length },
    { id: 'development', name: content.development, count: blogPosts.filter(post => post.category?.toLowerCase() === 'development').length },
    { id: 'education', name: content.education, count: blogPosts.filter(post => post.category?.toLowerCase() === 'education').length },
    { id: 'healthcare', name: content.healthcare, count: blogPosts.filter(post => post.category?.toLowerCase() === 'healthcare').length },
    { id: 'agriculture', name: content.agriculture, count: blogPosts.filter(post => post.category?.toLowerCase() === 'agriculture').length },
    { id: 'infrastructure', name: content.infrastructure, count: blogPosts.filter(post => post.category?.toLowerCase() === 'infrastructure').length }
  ];



  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="animate-spin h-12 w-12 text-sky-600 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">{content.loading}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">{content.error}</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Section */}
      <div className="bg-[#014e5c] text-white py-12 sm:py-16 px-4 w-full">
        <div className="w-full max-w-none mx-auto">
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold mb-4 sm:mb-6">
              {content.title}
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl mb-6 sm:mb-8 max-w-4xl mx-auto px-4 text-slate-200">
              {content.subtitle}
            </p>
            
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder={content.searchPlaceholder}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full max-w-none mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          {/* Left Sidebar */}
          <div className="xl:col-span-1 space-y-6">
            {/* Categories */}
            <div className="bg-white rounded-lg shadow-md p-6 border border-slate-100">
              <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                <Tag className="h-5 w-5 mr-2 text-sky-600" />
                {content.categories}
              </h3>
              <div className="space-y-2">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      selectedCategory === category.id
                        ? 'bg-sky-100 text-sky-800 border border-sky-200'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span>{category.name}</span>
                      <span className="text-xs bg-slate-200 px-2 py-1 rounded-full">
                        {category.count}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>


          </div>

          {/* Main Content */}
          <div className="xl:col-span-3 space-y-6">
            {filteredPosts.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-12 text-center border border-slate-100">
                <div className="text-gray-400 text-6xl mb-4">📝</div>
                <h3 className="text-xl font-semibold text-gray-600 mb-2">{content.noBlogs}</h3>
                <p className="text-gray-500">
                  {searchTerm 
                    ? `No blogs found matching "${searchTerm}"`
                    : selectedCategory !== 'all' 
                      ? `No blogs found in ${selectedCategory} category`
                      : 'No published blogs available at the moment.'
                  }
                </p>
              </div>
            ) : (
              <>
                {/* Featured Post */}
                {filteredPosts.filter(post => post.featured).map((post) => (
                  <div key={post.id} className="bg-white rounded-lg shadow-md overflow-hidden border border-slate-100 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => openBlogDetail(post)}>
                    <div className="p-6">
                      <div className="flex items-center space-x-2 mb-3">
                        <span className="px-2 py-1 bg-amber-100 text-amber-800 text-xs font-medium rounded-full">
                          {content.featured}
                        </span>
                        <span className="px-2 py-1 bg-sky-100 text-sky-800 text-xs font-medium rounded-full">
                          {post.category || 'General'}
                        </span>
                      </div>
                      
                      <h2 className="text-2xl font-bold text-slate-800 mb-3">
                        {post.title}
                      </h2>
                      
                      <p className="text-slate-600 mb-4 leading-relaxed">
                        {post.excerpt}
                      </p>
                      
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-4 text-sm text-slate-500">
                          <span className="flex items-center">
                            <User className="h-4 w-4 mr-1" />
                            {post.author}
                          </span>
                          <span className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {formatDate(post.createdAt)}
                          </span>
                          <span className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            {calculateReadingTime(post.content)} {content.readTime}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 text-sm text-slate-500">
                          <span className="flex items-center">
                            <Eye className="h-4 w-4 mr-1" />
                            {post.views || 0} {content.views}
                          </span>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleLike(post.id);
                            }}
                            disabled={likeLoading.has(post.id)}
                            className={`flex items-center space-x-1 px-1 py-1 rounded-md transition-colors ${
                              likedBlogs.has(post.id) 
                                ? 'text-red-600 bg-red-50 hover:bg-red-100' 
                                : 'text-slate-500 hover:text-red-600 hover:bg-red-50'
                            } ${likeLoading.has(post.id) ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            {likeLoading.has(post.id) ? (
                              <Loader className="h-4 w-4 animate-spin" />
                            ) : (
                              <ThumbsUp className={`h-4 w-4 ${likedBlogs.has(post.id) ? 'fill-current' : ''}`} />
                            )}
                            <span>{post.likes || 0}</span>
                          </button>
                          
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleShare(post);
                            }}
                            className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
                            title="Share blog"
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Regular Posts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {filteredPosts.filter(post => !post.featured).map((post) => (
                    <div key={post.id} className="bg-white rounded-lg shadow-md overflow-hidden border border-slate-100 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => openBlogDetail(post)}>
                      <div className="p-6">
                        <div className="flex items-center space-x-2 mb-3">
                          <span className="px-2 py-1 bg-sky-100 text-sky-800 text-xs font-medium rounded-full">
                            {post.category || 'General'}
                          </span>
                        </div>
                        
                        <h3 className="text-lg font-bold text-slate-800 mb-3 line-clamp-2">
                          {post.title}
                        </h3>
                        
                        <p className="text-slate-600 mb-4 text-sm leading-relaxed line-clamp-3">
                          {post.excerpt}
                        </p>
                        
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3 text-xs text-slate-500">
                            <span className="flex items-center">
                              <User className="h-3 w-3 mr-1" />
                              {post.author}
                            </span>
                            <span className="flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              {formatDate(post.createdAt)}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3 text-xs text-slate-500">
                            <span className="flex items-center">
                              <Eye className="h-3 w-3 mr-1" />
                              {post.views || 0}
                            </span>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleLike(post.id);
                              }}
                              disabled={likeLoading.has(post.id)}
                              className={`flex items-center space-x-1 px-1 py-1 rounded transition-colors ${
                                likedBlogs.has(post.id) 
                                  ? 'text-red-600 bg-red-50 hover:bg-red-100' 
                                  : 'text-slate-500 hover:text-red-600 hover:bg-red-50'
                              } ${likeLoading.has(post.id) ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                              {likeLoading.has(post.id) ? (
                                <Loader className="h-3 w-3 animate-spin" />
                              ) : (
                                <ThumbsUp className={`h-3 w-3 ${likedBlogs.has(post.id) ? 'fill-current' : ''}`} />
                              )}
                              <span>{post.likes || 0}</span>
                            </button>

                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleShare(post);
                              }}
                              className="p-1 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"
                              title="Share blog"
                            >
                              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination - Only show if there are many posts */}
                {filteredPosts.length > 10 && (
                  <div className="flex justify-center items-center space-x-2 mt-8">
                    <button className="px-3 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                      <ArrowLeft className="h-4 w-4" />
                    </button>
                    <button className="px-3 py-2 bg-sky-600 text-white rounded-lg">1</button>
                    <button className="px-3 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">2</button>
                    <button className="px-3 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">3</button>
                    <button className="px-3 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Sign In Popup */}
      <SignInPopup 
        isOpen={showSignInPopup} 
        onClose={() => setShowSignInPopup(false)} 
      />
    </div>
  );
};

export default BlogPost;