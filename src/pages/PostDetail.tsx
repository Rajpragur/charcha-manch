import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft,
  User, 
  MapPin, 
  AlertTriangle, 
  Shield, 
  Heart,
  Share2,
  MessageSquare,
  Calendar,
  Hash,
  ThumbsDown,
  Home
} from 'lucide-react';
import toast from 'react-hot-toast';
import FirebaseService from '../services/firebaseService';

interface DiscussionPost {
  id: string;
  titlefirst: string;
  titlesecond: string;
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

interface Comment {
  id: string;
  postId: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: any;
  constituencyName: string;
}

interface Reply {
  id: string;
  parentCommentId: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: any;
  constituencyName: string;
}

const PostDetail: React.FC = () => {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const { isEnglish } = useLanguage();
  const { currentUser } = useAuth();
  const [post, setPost] = useState<DiscussionPost | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [userReaction, setUserReaction] = useState<{ liked: boolean; disliked: boolean }>({ liked: false, disliked: false });
  const [replies, setReplies] = useState<{ [commentId: string]: Reply[] }>({});
  const [replyText, setReplyText] = useState<{ [commentId: string]: string }>({});
  const [isSubmittingReply, setIsSubmittingReply] = useState<{ [commentId: string]: boolean }>({});
  const [showReplyInput, setShowReplyInput] = useState<{ [commentId: string]: boolean }>({});

  const content = {
    backToForum: isEnglish ? 'Back to Forum' : 'फोरम पर वापस जाएं',
    loading: isEnglish ? 'Loading post...' : 'पोस्ट लोड हो रही है...',
    postNotFound: isEnglish ? 'Post not found' : 'पोस्ट नहीं मिली',
    underReview: isEnglish ? 'Under Review' : 'समीक्षा के तहत',
    postRemoved: isEnglish ? 'This post was removed due to violation of forum rules.' : 'यह पोस्ट फोरम नियमों के उल्लंघन के कारण हटा दी गई थी।',
    writeComment: isEnglish ? 'Write your comment...' : 'अपनी टिप्पणी लिखें...',
    comment: isEnglish ? 'Comment' : 'टिप्पणी करे',
    share: isEnglish ? 'Share' : 'साझा',
    reply: isEnglish ? 'Reply' : 'जवाब दें',
    noComments: isEnglish ? 'No comments yet. Be the first to comment!' : 'अभी तक कोई टिप्पणी नहीं। पहली टिप्पणी करने वाले बनें!',
    comments: isEnglish ? 'Comments' : 'टिप्पणियां',
    signInToComment: isEnglish ? 'Please sign in to comment' : 'टिप्पणी करने के लिए साइन इन करें',
    signInToLike: isEnglish ? 'Please sign in to like posts' : 'पोस्ट को लाइक करने के लिए साइन इन करें',
    signInToDislike: isEnglish ? 'Please sign in to dislike posts' : 'पोस्ट को डिसलाइक करने के लिए साइन इन करें',
    delete: isEnglish ? 'Delete' : 'हटाएं',
    deleteCommentConfirm: isEnglish ? 'Are you sure you want to delete this comment? This action cannot be undone.' : 'क्या आप वाकई इस टिप्पणी को हटाना चाहते हैं? यह क्रिया पूर्ववत नहीं की जा सकती।',
    commentDeleted: isEnglish ? 'Comment deleted successfully' : 'टिप्पणी सफलतापूर्वक हटा दी गई',
    deleteCommentFailed: isEnglish ? 'Failed to delete comment' : 'टिप्पणी हटाने में विफल'
  };

  useEffect(() => {
    if (postId) {
      fetchPostAndComments();
    }
  }, [postId]);

  const fetchPostAndComments = async () => {
    try {
      setIsLoading(true);
      
      // Fetch post
      const posts = await FirebaseService.getDiscussionPosts();
      const foundPost = posts.find(p => p.id === postId);
      
      if (!foundPost) {
        toast.error('Post not found');
        return;
      }
      
      setPost(foundPost);
      
      // Fetch comments
      const fetchedComments = await FirebaseService.getComments(postId!);
      setComments(fetchedComments);
      
      // Check user reaction if logged in
      if (currentUser?.uid) {
        const hasLiked = await FirebaseService.hasUserLikedPost(postId!, currentUser.uid);
        const hasDisliked = await FirebaseService.hasUserDislikedPost(postId!, currentUser.uid);
        setUserReaction({ liked: hasLiked, disliked: hasDisliked });
      }
      
      // Fetch replies for all comments
      const repliesData: { [commentId: string]: Reply[] } = {};
      for (const comment of fetchedComments) {
        const commentReplies = await FirebaseService.getReplies(comment.id);
        repliesData[comment.id] = commentReplies;
      }
      setReplies(repliesData);
      
    } catch (error) {
      console.error('Error fetching post and comments:', error);
      toast.error('Failed to load post');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCommentSubmit = async () => {
    if (!currentUser?.uid) {
      toast.error(content.signInToComment);
      return;
    }

    const commentContent = commentText.trim();
    if (!commentContent) {
      toast.error('Please write a comment');
      return;
    }

    try {
      setIsSubmittingComment(true);
      
      await FirebaseService.addComment(postId!, {
        userId: currentUser.uid,
        userName: currentUser.displayName || 'User',
        content: commentContent,
        constituencyName: post?.constituencyName || 'Unknown'
      });
      
      setCommentText('');
      toast.success('Comment posted successfully!');
      
      // Refresh comments
      const fetchedComments = await FirebaseService.getComments(postId!);
      setComments(fetchedComments);
      
      // Refresh post to update comment count
      const posts = await FirebaseService.getDiscussionPosts();
      const updatedPost = posts.find(p => p.id === postId);
      if (updatedPost) {
        setPost(updatedPost);
      }
      
    } catch (error) {
      console.error('Error posting comment:', error);
      toast.error('Failed to post comment');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleLike = async () => {
    if (!currentUser?.uid) {
      toast.error(content.signInToLike);
      return;
    }

    try {
      await FirebaseService.likePost(postId!, currentUser.uid);
      
      // Update local state
      setUserReaction(prev => ({ ...prev, liked: !prev.liked, disliked: false }));
      setPost(prev => prev ? {
        ...prev,
        likesCount: prev.likesCount + (prev.likesCount ? -1 : 1)
      } : null);
      
      toast.success(userReaction.liked ? 'Post unliked' : 'Post liked!');
    } catch (error) {
      console.error('Error updating like:', error);
      toast.error('Failed to update like');
    }
  };

  const handleDislike = async () => {
    if (!currentUser?.uid) {
      toast.error(content.signInToLike);
      return;
    }

    try {
      await FirebaseService.dislikePost(postId!, currentUser.uid);
      
      // Update local state
      setUserReaction(prev => ({ ...prev, disliked: !prev.disliked, liked: false }));
      setPost(prev => prev ? {
        ...prev,
        dislikesCount: prev.dislikesCount + (prev.dislikesCount ? -1 : 1)
      } : null);
      
      toast.success(userReaction.disliked ? 'Post undisliked' : 'Post disliked!');
    } catch (error) {
      console.error('Error updating dislike:', error);
      toast.error('Failed to update dislike');
    }
  };



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

  const handleReplySubmit = async (commentId: string) => {
    if (!currentUser?.uid) {
      toast.error(content.signInToComment);
      return;
    }

    const replyContent = replyText[commentId]?.trim();
    if (!replyContent) {
      toast.error('Please write a reply');
      return;
    }

    try {
      setIsSubmittingReply(prev => ({ ...prev, [commentId]: true }));
      
      await FirebaseService.addReply(commentId, {
        userId: currentUser.uid,
        userName: currentUser.displayName || 'User',
        content: replyContent,
        constituencyName: post?.constituencyName || 'Unknown',
        parentCommentId: commentId
      });
      
      setReplyText(prev => ({ ...prev, [commentId]: '' }));
      setShowReplyInput(prev => ({ ...prev, [commentId]: false }));
      toast.success('Reply posted successfully!');
      
      // Refresh replies
      const commentReplies = await FirebaseService.getReplies(commentId);
      setReplies(prev => ({ ...prev, [commentId]: commentReplies }));
      
    } catch (error) {
      console.error('Error posting reply:', error);
      toast.error('Failed to post reply');
    } finally {
      setIsSubmittingReply(prev => ({ ...prev, [commentId]: false }));
    }
  };

  const toggleReplyInput = (commentId: string) => {
    setShowReplyInput(prev => ({ ...prev, [commentId]: !prev[commentId] }));
  };

  // Handle comment deletion
  const handleDeleteComment = async (commentId: string) => {
    if (!currentUser?.uid) {
      toast.error('Please sign in to delete comments');
      return;
    }

    if (window.confirm(content.deleteCommentConfirm)) {
      try {
        await FirebaseService.deleteComment(commentId, currentUser.uid, postId!);
        toast.success(content.commentDeleted);
        
        // Refresh comments
        const fetchedComments = await FirebaseService.getComments(postId!);
        setComments(fetchedComments);
        
        // Refresh post to update comment count
        const posts = await FirebaseService.getDiscussionPosts();
        const updatedPost = posts.find(p => p.id === postId);
        if (updatedPost) {
          setPost(updatedPost);
        }
        

      } catch (error: any) {
        console.error('Error deleting comment:', error);
        toast.error(error.message || content.deleteCommentFailed);
      }
    }
  };

  // Handle reply deletion
  const handleDeleteReply = async (replyId: string) => {
    if (!currentUser?.uid) {
      toast.error('Please sign in to delete replies');
      return;
    }

    if (window.confirm('Are you sure you want to delete this reply? This action cannot be undone.')) {
      try {
        await FirebaseService.deleteReply(replyId, currentUser.uid, postId!);
        toast.success('Reply deleted successfully');
        
        // Refresh replies for this comment
        const commentReplies = await FirebaseService.getReplies(replyId.split('_')[0]); // Get parent comment ID
        setReplies(prev => ({ ...prev, [replyId.split('_')[0]]: commentReplies }));
      } catch (error: any) {
        console.error('Error deleting reply:', error);
        toast.error(error.message || 'Failed to delete reply');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{content.loading}</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">{content.postNotFound}</h2>
          <button
            onClick={() => navigate('/discussion')}
            className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition-colors"
          >
            {content.backToForum}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop Header */}
      <div className="hidden lg:block bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/discussion')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <h1 className="text-lg font-semibold text-gray-900">{content.backToForum}</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Header */}
      <div className="lg:hidden bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/discussion')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900">{content.backToForum}</h1>
            <div className="w-10"></div> {/* Spacer for centering */}
          </div>
        </div>
      </div>

      {/* Gap for mobile */}
      <div className="lg:hidden h-4 bg-[#c1cad1]"></div>

      <div className="max-w-7xl mx-auto px-6 py-6 pb-24 lg:pb-6">
        {/* Post Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6"
        >
          {post.status === 'removed' ? (
            <div className="p-8 text-center">
              <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">{content.postRemoved}</p>
            </div>
          ) : (
            <div className="p-6">
              {/* Post Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-red-500 rounded-full flex items-center justify-center">
                    <User className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-lg">{post.userName || 'User'}</h3>
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <MapPin className="h-4 w-4" />
                      <span>{post.constituencyName || `Constituency ${post.constituency}`}</span>
                      <span>•</span>
                      <Calendar className="h-4 w-4" />
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
              <div className="mb-6">
                {/* Poster Name - Above Title */}
                <div className="mb-3">
                  <span className="text-sm text-gray-600">
                    {isEnglish ? 'Posted by ' : 'द्वारा पोस्ट किया गया '}
                    <span className="font-semibold text-[#014e5c]">{post.userName || 'User'}</span>
                  </span>
                </div>
                
                {/* Post Title - More Prominent */}
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-4 leading-tight">
                  {post.titlefirst} {post.titlesecond}
                </h1>
                
                {/* Post Content */}
                <p className="text-gray-700 leading-relaxed text-lg mb-4">{post.content}</p>
                
                {/* Tags */}
                {post.tags && post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {post.tags.map((tag, tagIndex) => (
                      <span
                        key={tagIndex}
                        className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full flex items-center"
                      >
                        <Hash className="h-3 w-3 mr-1" />
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Engagement Section */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="flex items-center space-x-6">
                  <button 
                    onClick={handleLike}
                    disabled={userReaction.disliked}
                    className={`flex items-center space-x-2 p-2 rounded-lg transition-colors ${
                      userReaction.liked 
                        ? 'text-red-500 bg-red-50' 
                        : userReaction.disliked
                        ? 'text-gray-300 cursor-not-allowed'
                        : 'text-gray-500 hover:text-red-500 hover:bg-red-50'
                    }`}
                  >
                    <Heart className={`h-5 w-5 ${userReaction.liked ? 'fill-current' : ''}`} />
                    <span className="text-sm font-medium">{post.likesCount || 0}</span>
                  </button>

                  <button 
                    onClick={handleDislike}
                    disabled={userReaction.liked}
                    className={`flex items-center space-x-2 p-2 rounded-lg transition-colors ${
                      userReaction.disliked 
                        ? 'text-blue-500 bg-blue-50' 
                        : userReaction.liked
                        ? 'text-gray-300 cursor-not-allowed'
                        : 'text-gray-500 hover:text-blue-500 hover:bg-blue-50'
                    }`}
                  >
                    <ThumbsDown className={`h-5 w-5 ${userReaction.disliked ? 'fill-current' : ''}`} />
                    <span className="text-sm font-medium">{post.dislikesCount || 0}</span>
                  </button>

                  <button className="flex items-center space-x-2 text-gray-500 hover:text-green-500 hover:bg-green-50 p-2 rounded-lg transition-colors">
                    <Share2 className="h-5 w-5" />
                    <span className="text-sm font-medium">{content.share}</span>
                  </button>
                </div>
                
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <MessageSquare className="h-4 w-4" />
                  <span>{post.commentsCount || 0} {content.comments}</span>
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* Comments Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">{content.comments}</h2>
            
            {/* Comment Input */}
            <div className="space-y-4">
              {currentUser ? (
                <div className="flex space-x-3">
                  <div className="flex-1">
                    <textarea
                      placeholder={content.writeComment}
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                      rows={3}
                    />
                  </div>
                  <button
                    onClick={handleCommentSubmit}
                    disabled={isSubmittingComment}
                    className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmittingComment ? 'Posting...' : content.comment}
                  </button>
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  {content.signInToComment}
                </div>
              )}
            </div>
          </div>

          {/* Comments List */}
          <div className="p-6">
            {comments.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>{content.noComments}</p>
              </div>
            ) : (
              <div className="space-y-4">
                <AnimatePresence>
                  {comments.map((comment, index) => (
                    <motion.div
                      key={comment.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="space-y-3"
                    >
                      {/* Main Comment */}
                      <div className="flex space-x-3 p-4 bg-gray-50 rounded-lg">
                        <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-red-500 rounded-full flex-shrink-0 flex items-center justify-center">
                          <User className="h-4 w-4 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 text-sm text-gray-500 mb-2">
                            <span className="font-medium text-gray-900">{comment.userName}</span>
                            <span>•</span>
                            <span>{formatRelativeTime(comment.createdAt)}</span>
                            <span>•</span>
                            <span>{comment.constituencyName}</span>
                          </div>
                          <p className="text-gray-700 mb-3">{comment.content}</p>
                          
                          <div className="flex items-center space-x-3">
                            {/* Reply Button */}
                            <button
                              onClick={() => toggleReplyInput(comment.id)}
                              className="text-sm text-green-600 hover:text-green-700 font-medium"
                            >
                              {content.reply}
                            </button>
                            
                            {/* Delete Button (only show for comment owner or post owner) */}
                            {(currentUser?.uid === comment.userId || currentUser?.uid === post?.userId) && (
                              <button
                                onClick={() => handleDeleteComment(comment.id)}
                                className="text-sm text-red-600 hover:text-red-700 font-medium"
                              >
                                {content.delete}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Reply Input */}
                      {showReplyInput[comment.id] && (
                        <div className="ml-11 p-4 bg-white border border-gray-200 rounded-lg">
                          <div className="flex space-x-3">
                            <div className="flex-1">
                              <textarea
                                placeholder="Write your reply..."
                                value={replyText[comment.id] || ''}
                                onChange={(e) => setReplyText(prev => ({
                                  ...prev,
                                  [comment.id]: e.target.value
                                }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                                rows={2}
                              />
                            </div>
                            <button
                              onClick={() => handleReplySubmit(comment.id)}
                              disabled={isSubmittingReply[comment.id]}
                              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {isSubmittingReply[comment.id] ? 'Posting...' : 'Reply'}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Replies */}
                      {replies[comment.id] && replies[comment.id].length > 0 && (
                        <div className="ml-11 space-y-3">
                          {replies[comment.id].map((reply) => (
                            <div key={reply.id} className="flex space-x-3 p-3 bg-white border border-gray-200 rounded-lg">
                              <div className="w-6 h-6 bg-gradient-to-r from-green-500 to-red-500 rounded-full flex-shrink-0 flex items-center justify-center">
                                <User className="h-3 w-3 text-white" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 text-sm text-gray-500 mb-1">
                                  <span className="font-medium text-gray-900">{reply.userName}</span>
                                  <span>•</span>
                                  <span>{formatRelativeTime(reply.createdAt)}</span>
                                  <span>•</span>
                                  <span>{reply.constituencyName}</span>
                                </div>
                                <p className="text-gray-700 text-sm mb-2">{reply.content}</p>
                                
                                {/* Delete Button for replies (only show for reply owner or post owner) */}
                                {(currentUser?.uid === reply.userId || currentUser?.uid === post?.userId) && (
                                  <button
                                    onClick={() => handleDeleteReply(reply.id)}
                                    className="text-sm text-red-600 hover:text-red-700 font-medium"
                                  >
                                    {content.delete}
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Navigation - Mobile */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-20 shadow-lg">
        <div className="flex items-center justify-around py-3 px-2">
          <button
            onClick={() => navigate('/')}
            className="flex flex-col items-center space-y-1 p-2 rounded-lg transition-colors text-gray-500 hover:text-[#014e5c]"
          >
            <Home className="w-5 h-5" />
            <span className="text-xs font-medium">{isEnglish ? 'Home' : 'होम'}</span>
          </button>
          <button
            onClick={() => navigate('/discussion')}
            className="flex flex-col items-center space-y-1 p-2 rounded-lg transition-colors text-[#014e5c] bg-[#014e5c]/10"
          >
            <MessageSquare className="w-5 h-5" />
            <span className="text-xs font-medium">{isEnglish ? 'Discussion' : 'चर्चा'}</span>
          </button>
          <button
            onClick={() => navigate('/aapka-kshetra')}
            className="flex flex-col items-center space-y-1 p-2 rounded-lg transition-colors text-gray-500 hover:text-[#014e5c]"
          >
            <MapPin className="w-5 h-5" />
            <span className="text-xs font-medium">{isEnglish ? 'Area' : 'क्षेत्र'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PostDetail;
