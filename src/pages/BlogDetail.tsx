import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { Calendar, User, ThumbsUp, Eye, Clock, ArrowLeft, Loader } from 'lucide-react';
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
    share: isEnglish ? 'Share' : 'शेयर करें'
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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="animate-spin h-12 w-12 text-sky-600 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">{content.loading}</p>
        </div>
      </div>
    );
  }

  if (error || !blog) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">{content.error}</h1>
          <p className="text-gray-600">{error || content.notFound}</p>
          <button
            onClick={() => navigate('/blog')}
            className="mt-4 bg-sky-600 text-white px-6 py-2 rounded-lg hover:bg-sky-700 transition-colors"
          >
            {content.backToBlogs}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => navigate('/blog')}
            className="flex items-center text-slate-600 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            {content.backToBlogs}
          </button>
        </div>
      </div>

      {/* Blog Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <article className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Blog Header */}
          <div className="p-6 sm:p-8 border-b border-slate-100">
            <div className="flex items-center space-x-2 mb-4">
              {blog.featured && (
                <span className="px-3 py-1 bg-amber-100 text-amber-800 text-sm font-medium rounded-full">
                  {content.featured}
                </span>
              )}
              <span className="px-3 py-1 bg-sky-100 text-sky-800 text-sm font-medium rounded-full">
                {blog.category || 'General'}
              </span>
            </div>
            
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-800 mb-4">
              {blog.title}
            </h1>
            
            <p className="text-lg text-slate-600 mb-6 leading-relaxed">
              {blog.excerpt}
            </p>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6 text-sm text-slate-500">
                <span className="flex items-center">
                  <User className="h-4 w-4 mr-2" />
                  {blog.author}
                </span>
                <span className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  {formatDate(blog.createdAt)}
                </span>
                <span className="flex items-center">
                  <Clock className="h-4 w-4 mr-2" />
                  {calculateReadingTime(blog.content)} {content.readTime}
                </span>
              </div>
            </div>
          </div>

          {/* Blog Image */}
          {blog.imageUrl && (
            <div className="w-full">
              <img 
                src={blog.imageUrl} 
                alt={blog.title}
                className="w-full h-64 sm:h-80 object-cover"
              />
            </div>
          )}

          {/* Blog Content */}
          <div className="p-6 sm:p-8">
            <div className="prose prose-lg max-w-none">
              <div className="text-gray-800 leading-relaxed text-lg whitespace-pre-wrap font-normal">
                {blog.content}
              </div>
            </div>
          </div>

          {/* Blog Footer */}
          <div className="px-6 sm:px-8 py-6 border-t border-slate-100 bg-slate-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6 text-sm text-slate-500">
                <span className="flex items-center">
                  <Eye className="h-4 w-4 mr-2" />
                  {blog.views || 0} {content.views}
                </span>
                <span className="flex items-center">
                  <ThumbsUp className="h-4 w-4 mr-2" />
                  {blog.likes || 0} {content.likes}
                </span>

              </div>
              
              <div className="flex space-x-3">
                <button 
                  onClick={handleLike}
                  disabled={likeLoading}
                  className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium flex items-center ${
                    isLiked
                      ? 'bg-red-100 text-red-700 hover:bg-red-200'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  } ${likeLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {likeLoading ? (
                    <Loader className="h-4 w-4 inline mr-2 animate-spin" />
                  ) : (
                    <ThumbsUp className={`h-4 w-4 inline mr-2 ${isLiked ? 'fill-current' : ''}`} />
                  )}
                  {content.like}
                </button>

                <button 
                  onClick={handleShare}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-sm font-medium"
                >
                  <svg className="h-4 w-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                  </svg>
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
