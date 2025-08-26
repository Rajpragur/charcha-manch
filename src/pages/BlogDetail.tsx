import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { Calendar, User, Eye, ArrowLeft, Loader, Heart, Share2, BookOpen, Tag, Award } from 'lucide-react';
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

const BlogDetail: React.FC = () => {
  const { blogId } = useParams<{ blogId: string }>();
  const navigate = useNavigate();
  const { isEnglish } = useLanguage();
  const { currentUser } = useAuth();
  const [blog, setBlog] = useState<BlogPost | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);
  const [showSignInPopup, setShowSignInPopup] = useState(false);

  const content = {
    backToBlogs: isEnglish ? 'Back to Blogs' : 'ब्लॉग्स पर वापस जाएं',
    views: isEnglish ? 'views' : 'दृश्य',
    likes: isEnglish ? 'likes' : 'लाइक',
    comments: isEnglish ? 'comments' : 'टिप्पणियां',
    readTime: isEnglish ? 'min read' : 'मिनट पढ़ने में',
    by: isEnglish ? 'by' : 'द्वारा',
    featured: isEnglish ? 'Featured' : 'विशेष',
    loading: isEnglish ? 'Loading blog...' : 'ब्लॉग लोड हो रहा है...',
    error: isEnglish ? 'Error loading blog' : 'ब्लॉग लोड करने में त्रुटि',
    notFound: isEnglish ? 'Blog not found' : 'ब्लॉग नहीं मिला',
    like: isEnglish ? 'Like' : 'लाइक',
    share: isEnglish ? 'Share' : 'शेयर करें',
    publishedOn: isEnglish ? 'Published on' : 'प्रकाशित किया गया',
    readingTime: isEnglish ? 'Reading time' : 'पढ़ने का समय',
    category: isEnglish ? 'Category' : 'श्रेणी',
    author: isEnglish ? 'Author' : 'लेखक'
  };

  // Fetch blog data
  useEffect(() => {
    const fetchBlog = async () => {
      if (!blogId) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        const blogData = await FirebaseService.getBlogById(blogId);
        
        if (blogData) {
          setBlog(blogData);
          
          // Check if user has liked this blog
          if (currentUser?.uid) {
            const likedBlogIds = await FirebaseService.getUserLikedBlogs(currentUser.uid);
            setIsLiked(likedBlogIds.includes(blogId));
          }

          // Increment view count (one per user)
          if (currentUser?.uid) {
            await FirebaseService.incrementBlogViews(blogId, currentUser.uid);
          }
        } else {
          setError(content.notFound);
        }
      } catch (err) {
        console.error('Error fetching blog:', err);
        setError(content.error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBlog();
  }, [blogId, currentUser?.uid, content.notFound, content.error]);

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
        return date.toDate().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      } else if (date instanceof Date) {
        return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      } else {
        return new Date(date).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      }
    } catch {
      return 'Unknown date';
    }
  };

  // Handle blog like
  const handleLike = async () => {
    if (!currentUser?.uid) {
      setShowSignInPopup(true);
      return;
    }

    if (!blog || likeLoading) return;

    try {
      setLikeLoading(true);
      
      const result = await FirebaseService.toggleBlogLike(blog.id, currentUser.uid);
      
      if (result.success) {
        setIsLiked(result.isLiked);
        setBlog(prev => prev ? { ...prev, likes: result.newLikeCount } : null);
      }
    } catch (error) {
      console.error('Error handling like:', error);
      alert('Failed to update like. Please try again.');
    } finally {
      setLikeLoading(false);
    }
  };

  // Handle share
  const handleShare = () => {
    if (!blog) return;

    const shareData = {
      title: blog.title,
      text: blog.excerpt,
      url: window.location.href
    };

    if (navigator.share) {
      navigator.share(shareData);
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href).then(() => {
        alert('Blog link copied to clipboard!');
      }).catch(() => {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = window.location.href;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        alert('Blog link copied to clipboard!');
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#014e5c] mx-auto mb-6"></div>
          <p className="text-gray-600 text-xl font-medium">{content.loading}</p>
        </div>
      </div>
    );
  }

  if (error || !blog) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-8xl mb-6">⚠️</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{content.error}</h1>
          <p className="text-gray-600 mb-8 text-lg">{error || content.notFound}</p>
          <button
            onClick={() => navigate('/blog')}
            className="bg-[#014e5c] text-white px-8 py-3 rounded-xl hover:bg-[#013a47] transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
          >
            {content.backToBlogs}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => navigate('/blog')}
            className="flex items-center text-[#014e5c] hover:text-[#013a47] transition-colors font-medium"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            {content.backToBlogs}
          </button>
        </div>
      </div>

      {/* Blog Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <article className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
          {/* Blog Header */}
          <div className="p-6 sm:p-8 lg:p-10 border-b border-gray-100">
            <div className="flex flex-wrap items-center gap-3 mb-6">
              {blog.featured && (
                <span className="px-4 py-2 bg-amber-100 text-amber-800 text-sm font-semibold rounded-full flex items-center">
                  <Award className="h-4 w-4 mr-2" />
                  {content.featured}
                </span>
              )}
              {blog.category && (
                <span className="px-4 py-2 bg-[#014e5c]/10 text-[#014e5c] text-sm font-semibold rounded-full flex items-center">
                  <Tag className="h-4 w-4 mr-2" />
                  {blog.category}
                </span>
              )}
            </div>
            
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight">
              {blog.title}
            </h1>
            
            <p className="text-lg sm:text-xl text-gray-600 mb-8 leading-relaxed max-w-4xl">
              {blog.excerpt}
            </p>
            
            {/* Author and Meta Info */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-[#014e5c] rounded-full flex items-center justify-center">
                  <User className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{blog.author}</p>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2" />
                      {formatDate(blog.createdAt)}
                    </span>
                    <span className="flex items-center">
                      <BookOpen className="h-4 w-4 mr-2" />
                      {calculateReadingTime(blog.content)} {content.readTime}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Blog Image */}
          {blog.imageUrl && (
            <div className="w-full">
              <img 
                src={blog.imageUrl} 
                alt={blog.title}
                className="w-full h-64 sm:h-80 lg:h-96 object-cover"
              />
            </div>
          )}

          {/* Blog Content */}
          <div className="p-6 sm:p-8 lg:p-10">
            <div className="prose prose-lg max-w-none">
              <div className="text-gray-800 leading-relaxed text-lg whitespace-pre-wrap font-normal">
                {blog.content}
              </div>
            </div>
          </div>

          {/* Blog Footer */}
          <div className="px-6 sm:px-8 lg:px-10 py-8 border-t border-gray-100 bg-gray-50">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
              <div className="flex items-center space-x-6 text-sm text-gray-600">
                <span className="flex items-center">
                  <Eye className="h-4 w-4 mr-2" />
                  {blog.views || 0} {content.views}
                </span>
                <span className="flex items-center">
                  <Heart className="h-4 w-4 mr-2" />
                  {blog.likes || 0} {content.likes}
                </span>
              </div>
              
              <div className="flex space-x-3">
                <button 
                  onClick={handleLike}
                  disabled={likeLoading}
                  className={`px-6 py-3 rounded-xl transition-all duration-200 text-sm font-semibold flex items-center shadow-md hover:shadow-lg ${
                    isLiked
                      ? 'bg-red-100 text-red-700 hover:bg-red-200 border border-red-200'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 hover:border-[#014e5c] hover:text-[#014e5c]'
                  } ${likeLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {likeLoading ? (
                    <Loader className="h-4 w-4 inline mr-2 animate-spin" />
                  ) : (
                    <Heart className={`h-4 w-4 inline mr-2 ${isLiked ? 'fill-current' : ''}`} />
                  )}
                  {content.like}
                </button>

                <button 
                  onClick={handleShare}
                  className="px-6 py-3 bg-white text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 text-sm font-semibold border border-gray-200 hover:border-[#014e5c] hover:text-[#014e5c] shadow-md hover:shadow-lg flex items-center"
                >
                  <Share2 className="h-4 w-4 inline mr-2" />
                  {content.share}
                </button>
              </div>
            </div>
          </div>
        </article>
      </div>

      {/* Sign In Popup */}
      <SignInPopup 
        isOpen={showSignInPopup} 
        onClose={() => setShowSignInPopup(false)} 
      />
    </div>
  );
};

export default BlogDetail;
