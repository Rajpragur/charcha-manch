import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useAdmin } from '../contexts/AdminContext';
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
  Hash,
  ThumbsDown,
  Home,
  Clock,
  ChevronDown,
  ChevronUp,
  Check,
  MessageCircle as ChatBubble,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Edit3,
  Trash2,
  Crown,
  X
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
  isEdited: boolean;
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
  likesCount?: number;
  dislikesCount?: number;
}

interface Reply {
  id: string;
  parentCommentId: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: any;
  constituencyName: string;
  likesCount?: number;
  dislikesCount?: number;
}

const PostDetail: React.FC = () => {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const { isEnglish } = useLanguage();
  const { currentUser } = useAuth();
  const { isAdmin } = useAdmin();
  const [post, setPost] = useState<DiscussionPost | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDataFullyLoaded, setIsDataFullyLoaded] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [userReaction, setUserReaction] = useState<{ liked: boolean; disliked: boolean }>({ liked: false, disliked: false });
  const [commentReactions, setCommentReactions] = useState<{ [commentId: string]: { liked: boolean; disliked: boolean } }>({});
  const [replyReactions, setReplyReactions] = useState<{ [replyId: string]: { liked: boolean; disliked: boolean } }>({});
  const [replies, setReplies] = useState<{ [commentId: string]: Reply[] }>({});
  const [replyText, setReplyText] = useState<{ [commentId: string]: string }>({});
  const [isSubmittingReply, setIsSubmittingReply] = useState<{ [commentId: string]: boolean }>({});
  const [showReplyInput, setShowReplyInput] = useState<{ [commentId: string]: boolean }>({});
  const [expandedComments, setExpandedComments] = useState<{ [commentId: string]: boolean }>({});
  const [copiedPostId, setCopiedPostId] = useState<string | null>(null);
  const [userConstituency, setUserConstituency] = useState<string | null>(null);
  const [isEditingPost, setIsEditingPost] = useState(false);
  const [editedPostTitle, setEditedPostTitle] = useState('');
  const [editedPostContent, setEditedPostContent] = useState('');
  const [isEditingComment, setIsEditingComment] = useState<{ [commentId: string]: boolean }>({});
  const [editedCommentContent, setEditedCommentContent] = useState<{ [commentId: string]: string }>({});
  const [isEditingReply, setIsEditingReply] = useState<{ [replyId: string]: boolean }>({});
  const [editedReplyContent, setEditedReplyContent] = useState<{ [replyId: string]: string }>({});

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
    commentingFrom: isEnglish ? 'Commenting from:' : 'टिप्पणी कर रहे हैं:',
    signInToLike: isEnglish ? 'Please sign in to like posts' : 'पोस्ट को लाइक करने के लिए साइन इन करें',
    signInToDislike: isEnglish ? 'Please sign in to dislike posts' : 'पोस्ट को डिसलाइक करने के लिए साइन इन करें',
    delete: isEnglish ? 'Delete' : 'हटाएं',
    edit: isEnglish ? 'Edit' : 'संपादित करें',
    save: isEnglish ? 'Save' : 'सहेजें',
    cancel: isEnglish ? 'Cancel' : 'रद्द करें',
    deleteCommentConfirm: isEnglish ? 'Are you sure you want to delete this comment? This action cannot be undone.' : 'क्या आप वाकई इस टिप्पणी को हटाना चाहते हैं? यह क्रिया पूर्ववत नहीं की जा सकती।',
    commentDeleted: isEnglish ? 'Comment deleted successfully' : 'टिप्पणी सफलतापूर्वक हटा दी गई',
    deleteCommentFailed: isEnglish ? 'Failed to delete comment' : 'टिप्पणी हटाने में विफल',
    showReplies: isEnglish ? 'Show Replies' : 'जवाब दिखाएं',
    hideReplies: isEnglish ? 'Hide Replies' : 'जवाब छिपाएं',
    writeReply: isEnglish ? 'Write your reply...' : 'अपना जवाब लिखें...',
    posting: isEnglish ? 'Posting...' : 'पोस्ट कर रहा है...',
    commentPosted: isEnglish ? 'Comment posted successfully!' : 'टिप्पणी सफलतापूर्वक पोस्ट की गई!',
    replyPosted: isEnglish ? 'Reply posted successfully!' : 'जवाब सफलतापूर्वक पोस्ट किया गया!',
    signInToDeleteComment: isEnglish ? 'Please sign in to delete comments' : 'टिप्पणी हटाने के लिए साइन इन करें',
    signInToDeleteReply: isEnglish ? 'Please sign in to delete replies' : 'जवाब हटाने के लिए साइन इन करें',
    signInToEdit: isEnglish ? 'Please sign in to edit posts' : 'पोस्ट संपादित करने के लिए साइन इन करें',
    signInToDelete: isEnglish ? 'Please sign in to delete posts' : 'पोस्ट हटाने के लिए साइन इन करें',
    edited: isEnglish ? 'Edited' : 'संपादित',
    home: isEnglish ? 'Home' : 'होम',
    discussion: isEnglish ? 'Charcha Manch' : 'चर्चा मंच',
    area: isEnglish ? 'Your Area' : 'आपका क्षेत्र'
  };

  useEffect(() => {
    if (postId) {
      fetchPostAndComments();
    }
  }, [postId, currentUser?.uid]);

  const fetchPostAndComments = async () => {
    try {
      setIsLoading(true);
      
      // Fetch post
      const posts = await FirebaseService.getDiscussionPosts(isEnglish);
      const foundPost = posts.find(p => p.id === postId);
      
      if (!foundPost) {
        toast.error('Post not found');
        return;
      }
      
      // The post data from getDiscussionPosts already includes userName with nagrik number
      setPost(foundPost);
      
      // Fetch comments
      const fetchedComments = await FirebaseService.getComments(postId!, isEnglish);
      setComments(fetchedComments);
      
              // Check user reaction if logged in
      if (currentUser?.uid) {
        const hasLiked = await FirebaseService.hasUserLikedPost(postId!, currentUser.uid);
        const hasDisliked = await FirebaseService.hasUserDislikedPost(postId!, currentUser.uid);
        console.log('🔍 Post reactions for user:', { hasLiked, hasDisliked });
        setUserReaction({ liked: hasLiked, disliked: hasDisliked });
        
        // Fetch user's constituency
        await fetchUserConstituency();
        
        // Check user reactions for comments
        const commentReactionsData: { [commentId: string]: { liked: boolean; disliked: boolean } } = {};
        for (const comment of fetchedComments) {
          const hasLikedComment = await FirebaseService.hasUserLikedComment(comment.id, currentUser.uid);
          const hasDislikedComment = await FirebaseService.hasUserDislikedComment(comment.id, currentUser.uid);
          commentReactionsData[comment.id] = { liked: hasLikedComment, disliked: hasDislikedComment };
          console.log(`🔍 Comment ${comment.id} reactions:`, { hasLikedComment, hasDislikedComment });
        }
        setCommentReactions(commentReactionsData);
        console.log('🔍 Set comment reactions:', commentReactionsData);
      }
      
      // Fetch replies for all comments
      const repliesData: { [commentId: string]: Reply[] } = {};
      const replyReactionsData: { [replyId: string]: { liked: boolean; disliked: boolean } } = {};
      
      for (const comment of fetchedComments) {
        const commentReplies = await FirebaseService.getReplies(comment.id);
        repliesData[comment.id] = commentReplies;
        
        // Check user reactions for replies if logged in
        if (currentUser?.uid) {
          for (const reply of commentReplies) {
            const hasLikedReply = await FirebaseService.hasUserLikedReply(reply.id, currentUser.uid);
            const hasDislikedReply = await FirebaseService.hasUserDislikedReply(reply.id, currentUser.uid);
            replyReactionsData[reply.id] = { liked: hasLikedReply, disliked: hasDislikedReply };
            console.log(`🔍 Reply ${reply.id} reactions:`, { hasLikedReply, hasDislikedReply });
          }
        }
      }
      setReplies(repliesData);
      if (currentUser?.uid) {
        setReplyReactions(replyReactionsData);
        console.log('🔍 Set reply reactions:', replyReactionsData);
      } else {
        // Initialize empty reactions if no user
        setCommentReactions({});
        setReplyReactions({});
        setUserReaction({ liked: false, disliked: false });
      }
      
      // Mark data as fully loaded
      setIsDataFullyLoaded(true);
      console.log('✅ All data fully loaded - user interactions now enabled');
      
    } catch (error) {
      console.error('Error fetching post and comments:', error);
      toast.error('Failed to load post');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserConstituency = async () => {
    if (!currentUser?.uid) return;
    
    try {
      const userProfile = await FirebaseService.getUserProfile(currentUser.uid, true);
      if (userProfile?.constituency_id) {
        const constituencyName = await FirebaseService.getConstituencyName(userProfile.constituency_id);
        setUserConstituency(constituencyName);
      }
    } catch (error) {
      console.error('Error fetching user constituency:', error);
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
      
      // Get user's nagrik number for the comment
      let userName = 'User';
      try {
        const userProfile = await FirebaseService.getUserProfile(currentUser.uid, true);
        if (userProfile?.nagrik_number) {
          userName = isEnglish ? `Nagrik_${userProfile.nagrik_number}` : `नागरिक_${userProfile.nagrik_number}`;
        }
      } catch (error) {
        console.error('Error getting user profile for nagrik number:', error);
        // Fallback to 'User' if there's an error
      }
      
      await FirebaseService.addComment(postId!, {
        userId: currentUser.uid,
        userName: userName,
        content: commentContent,
        constituencyName: userConstituency || post?.constituencyName || 'Unknown'
      });
      
              setCommentText('');
        toast.success(content.commentPosted);
      
      // Refresh comments
      const fetchedComments = await FirebaseService.getComments(postId!);
      setComments(fetchedComments);
      
      // Refresh post to update comment count
      const posts = await FirebaseService.getDiscussionPosts(isEnglish);
      const updatedPost = posts.find(p => p.id === postId);
      if (updatedPost) {
        // The post data from getDiscussionPosts already includes userName with nagrik number
        setPost(updatedPost);
      }
      
      // Update comment reactions for the new comment
      if (currentUser?.uid) {
        // Find the new comment (it should be the last one since we just added it)
        const newComment = fetchedComments[fetchedComments.length - 1];
        if (newComment && newComment.userId === currentUser.uid) {
          // Set the new comment as not liked/disliked initially
          setCommentReactions(prev => ({
            ...prev,
            [newComment.id]: { liked: false, disliked: false }
          }));
        }
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
      console.log('🔍 Before post like - current reactions:', userReaction);
      await FirebaseService.likePost(postId!, currentUser.uid);
      
      // Update local state
      setUserReaction(prev => ({ ...prev, liked: !prev.liked, disliked: false }));
      setPost(prev => prev ? {
        ...prev,
        likesCount: prev.likesCount + (userReaction.liked ? -1 : 1),
        dislikesCount: userReaction.disliked ? prev.dislikesCount - 1 : prev.dislikesCount
      } : null);
      
      console.log('🔍 Post like state change:', { current: userReaction, new: { liked: !userReaction.liked, disliked: false } });
      toast.success(userReaction.liked ? 'Post unliked' : 'Post liked!');
    } catch (error) {
      console.error('Error updating like:', error);
      toast.error('Failed to update like');
    }
  };

  const handleDislike = async () => {
    if (!currentUser?.uid) {
      toast.error(content.signInToDislike);
      return;
    }

    try {
      await FirebaseService.dislikePost(postId!, currentUser.uid);
      
      // Update local state
      setUserReaction(prev => ({ ...prev, disliked: !prev.disliked, liked: false }));
      setPost(prev => prev ? {
        ...prev,
        dislikesCount: prev.dislikesCount + (userReaction.disliked ? -1 : 1),
        likesCount: userReaction.liked ? prev.likesCount - 1 : prev.likesCount
      } : null);
      
      toast.success(userReaction.disliked ? 'Post undisliked' : 'Post disliked!');
    } catch (error) {
      console.error('Error updating dislike:', error);
      toast.error('Failed to update dislike');
    }
  };

  // Handle comment like
  const handleCommentLike = async (commentId: string) => {
    if (!currentUser?.uid) {
      toast.error(content.signInToLike);
      return;
    }

    try {
      console.log('🔍 Before comment like - current reactions:', commentReactions[commentId]);
      await FirebaseService.likeComment(commentId, currentUser.uid);
      
      // Update local state
      const currentReaction = commentReactions[commentId] || { liked: false, disliked: false };
      const newLiked = !currentReaction.liked;
      const newDisliked = false;
      
      console.log('🔍 Comment like state change:', { currentReaction, newLiked, newDisliked });
      
      setCommentReactions(prev => ({
        ...prev,
        [commentId]: { liked: newLiked, disliked: newDisliked }
      }));
      
      // Update comment counts
      setComments(prev => prev.map(comment => {
        if (comment.id === commentId) {
          return {
            ...comment,
            likesCount: (comment.likesCount || 0) + (newLiked ? 1 : -1),
            dislikesCount: (comment.dislikesCount || 0) + (currentReaction.disliked ? -1 : 0)
          };
        }
        return comment;
      }));
      
      toast.success(newLiked ? 'Comment liked!' : 'Comment unliked!');
    } catch (error) {
      console.error('Error updating comment like:', error);
      toast.error('Failed to update comment like');
    }
  };

  // Handle comment dislike
  const handleCommentDislike = async (commentId: string) => {
    if (!currentUser?.uid) {
      toast.error(content.signInToDislike);
      return;
    }

    try {
      await FirebaseService.dislikeComment(commentId, currentUser.uid);
      
      // Update local state
      const currentReaction = commentReactions[commentId] || { liked: false, disliked: false };
      const newDisliked = !currentReaction.disliked;
      const newLiked = false;
      
      setCommentReactions(prev => ({
        ...prev,
        [commentId]: { liked: newLiked, disliked: newDisliked }
      }));
      
      // Update comment counts
      setComments(prev => prev.map(comment => {
        if (comment.id === commentId) {
          return {
            ...comment,
            dislikesCount: (comment.dislikesCount || 0) + (newDisliked ? 1 : -1),
            likesCount: (comment.likesCount || 0) + (currentReaction.liked ? -1 : 0)
          };
        }
        return comment;
      }));
      
      toast.success(newDisliked ? 'Comment disliked!' : 'Comment undisliked!');
    } catch (error) {
      console.error('Error updating comment dislike:', error);
      toast.error('Failed to update comment dislike');
    }
  };

  // Handle reply like
  const handleReplyLike = async (replyId: string, commentId: string) => {
    if (!currentUser?.uid) {
      toast.error(content.signInToLike);
      return;
    }

    try {
      await FirebaseService.likeReply(replyId, currentUser.uid);
      
      // Update local state
      const currentReaction = replyReactions[replyId] || { liked: false, disliked: false };
      const newLiked = !currentReaction.liked;
      const newDisliked = false;
      
      setReplyReactions(prev => ({
        ...prev,
        [replyId]: { liked: newLiked, disliked: newDisliked }
      }));
      
      // Update reply counts
      setReplies(prev => ({
        ...prev,
        [commentId]: prev[commentId].map(reply => {
          if (reply.id === replyId) {
            return {
              ...reply,
              likesCount: (reply.likesCount || 0) + (newLiked ? 1 : -1),
              dislikesCount: (reply.dislikesCount || 0) + (currentReaction.disliked ? -1 : 0)
            };
          }
          return reply;
        })
      }));
      
      toast.success(newLiked ? 'Reply liked!' : 'Reply unliked!');
    } catch (error) {
      console.error('Error updating reply like:', error);
      toast.error('Failed to update reply like');
    }
  };

  // Handle reply dislike
  const handleReplyDislike = async (replyId: string, commentId: string) => {
    if (!currentUser?.uid) {
      toast.error(content.signInToDislike);
      return;
    }

    try {
      await FirebaseService.dislikeReply(replyId, currentUser.uid);
      
      // Update local state
      const currentReaction = replyReactions[replyId] || { liked: false, disliked: false };
      const newDisliked = !currentReaction.disliked;
      const newLiked = false;
      
      setReplyReactions(prev => ({
        ...prev,
        [replyId]: { liked: newLiked, disliked: newDisliked }
      }));
      
      // Update reply counts
      setReplies(prev => ({
        ...prev,
        [commentId]: prev[commentId].map(reply => {
          if (reply.id === replyId) {
            return {
              ...reply,
              dislikesCount: (reply.dislikesCount || 0) + (newDisliked ? 1 : -1),
              likesCount: (reply.likesCount || 0) + (currentReaction.liked ? -1 : 0)
            };
          }
          return reply;
        })
      }));
      
      toast.success(newDisliked ? 'Reply disliked!' : 'Reply undisliked!');
    } catch (error) {
      console.error('Error updating reply dislike:', error);
      toast.error('Failed to update reply dislike');
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
      
      // Get user's nagrik number for the reply
      let userName = 'User';
      try {
        const userProfile = await FirebaseService.getUserProfile(currentUser.uid, true);
        if (userProfile?.nagrik_number) {
          userName = isEnglish ? `Nagrik_${userProfile.nagrik_number}` : `नागरिक_${userProfile.nagrik_number}`;
        }
      } catch (error) {
        console.error('Error getting user profile for nagrik number:', error);
        // Fallback to 'User' if there's an error
      }
      
      await FirebaseService.addReply(commentId, {
        userId: currentUser.uid,
        userName: userName,
        content: replyContent,
        constituencyName: userConstituency || post?.constituencyName || 'Unknown',
        parentCommentId: commentId
      });
      
              setReplyText(prev => ({ ...prev, [commentId]: '' }));
        setShowReplyInput(prev => ({ ...prev, [commentId]: false }));
        toast.success(content.replyPosted);
      
              // Refresh replies
        const commentReplies = await FirebaseService.getReplies(commentId, isEnglish);
      setReplies(prev => ({ ...prev, [commentId]: commentReplies }));
      
      // Update reply reactions for the new reply
      if (currentUser?.uid) {
        // Find the new reply (it should be the last one since we just added it)
        const newReply = commentReplies[commentReplies.length - 1];
        if (newReply && newReply.userId === currentUser.uid) {
          // Set the new reply as not liked/disliked initially
          setReplyReactions(prev => ({
            ...prev,
            [newReply.id]: { liked: false, disliked: false }
          }));
        }
      }
      
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

  const toggleReplies = (commentId: string) => {
    setExpandedComments(prev => ({ ...prev, [commentId]: !prev[commentId] }));
  };

  // Handle share functionality
  const handleShare = async () => {
    if (!post) return;
    
    const postUrl = `${window.location.origin}/post/${post.id}`;
    const postTitle = `${post.titlefirst} ${post.titlesecond}`;
    
    try {
      // Check if navigator.share is available and supported
      if (navigator.share && navigator.canShare) {
        const shareData = {
          title: postTitle,
          text: `इस चर्चा को देखें: ${post.content.substring(0, 100)}...`,
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
        setCopiedPostId(post.id);
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
        
        setCopiedPostId(post.id);
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
        
        setCopiedPostId(post.id);
        toast.success('Post URL copied to clipboard!');
        setTimeout(() => setCopiedPostId(null), 2000);
      } catch (fallbackError) {
        console.error('Fallback copy failed:', fallbackError);
        toast.error('Failed to share post. Please copy the URL manually.');
      }
    }
  };

  // Handle post editing
  const handleEditPost = async () => {
    if (!currentUser?.uid) {
      toast.error(content.signInToEdit);
      return;
    }

    if (!post) return;

    // Set up inline editing
    setIsEditingPost(true);
    setEditedPostTitle(`${post.titlefirst} ${post.titlesecond}`);
    setEditedPostContent(post.content);
  };

  // Handle post update
  const handleUpdatePost = async () => {
    if (!currentUser?.uid || !post) {
      toast.error(content.signInToEdit);
      return;
    }

    const trimmedTitle = editedPostTitle.trim();
    const trimmedContent = editedPostContent.trim();

    if (!trimmedTitle || !trimmedContent) {
      toast.error('Title and content cannot be empty');
      return;
    }

    try {
      // Split title into first and second parts
      const titleParts = trimmedTitle.split(' ');
      const titlefirst = titleParts[0] || '';
      const titlesecond = titleParts.slice(1).join(' ') || '';

      await FirebaseService.updateDiscussionPost(post.id, {
        titlefirst,
        titlesecond,
        content: trimmedContent,
        updatedAt: new Date()
      });

      // Update local state
      setPost(prev => prev ? {
        ...prev,
        titlefirst,
        titlesecond,
        content: trimmedContent,
        isEdited: true,
        updatedAt: new Date()
      } : null);

      toast.success('Post updated successfully');
      setIsEditingPost(false);
      
      // Refresh post data to ensure we have the latest state including isEdited
      try {
        const posts = await FirebaseService.getDiscussionPosts(isEnglish);
        const refreshedPost = posts.find(p => p.id === post.id);
        if (refreshedPost) {
          setPost(refreshedPost);
          console.log('✅ Post refreshed after update, isEdited:', refreshedPost.isEdited);
        }
      } catch (error) {
        console.error('Error refreshing post after update:', error);
      }
    } catch (error: any) {
      console.error('Error updating post:', error);
      toast.error(error.message || 'Failed to update post');
    }
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setIsEditingPost(false);
    setEditedPostTitle('');
    setEditedPostContent('');
  };



  // Handle post deletion
  const handleDeletePost = async (postId: string) => {
    if (!currentUser?.uid) {
      toast.error(content.signInToDelete);
      return;
    }

    if (!window.confirm(isEnglish ? 'Are you sure you want to delete this post? This action cannot be undone.' : 'क्या आप वाकई इस पोस्ट को हटाना चाहते हैं? यह क्रिया पूर्ववत नहीं की जा सकती।')) {
      return;
    }

    try {
      await FirebaseService.deleteDiscussionPost(postId, currentUser.uid);
      toast.success(isEnglish ? 'Post deleted successfully' : 'पोस्ट सफलतापूर्वक हटा दिया गया');
      navigate('/discussion');
    } catch (error: any) {
      console.error('Error deleting post:', error);
      toast.error(error.message || 'Failed to delete post');
    }
  };

  // Handle comment deletion
      const handleDeleteComment = async (commentId: string) => {
      if (!currentUser?.uid) {
        toast.error(content.signInToDeleteComment);
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
        const posts = await FirebaseService.getDiscussionPosts(isEnglish);
        const updatedPost = posts.find(p => p.id === postId);
        if (updatedPost) {
          // The post data from getDiscussionPosts already includes userName with nagrik number
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
        toast.error(content.signInToDeleteReply);
        return;
      }

    if (window.confirm('Are you sure you want to delete this reply? This action cannot be undone.')) {
      try {
        await FirebaseService.deleteReply(replyId, currentUser.uid, postId!);
        toast.success('Reply deleted successfully');
        
        // Refresh replies for this comment
        const commentReplies = await FirebaseService.getReplies(replyId.split('_')[0], isEnglish); // Get parent comment ID
        setReplies(prev => ({ ...prev, [replyId.split('_')[0]]: commentReplies }));
      } catch (error: any) {
        console.error('Error deleting reply:', error);
        toast.error(error.message || 'Failed to delete reply');
      }
    }
  };

  // Handle text formatting for comments
  const handleTextFormat = (format: string) => {
    const textarea = document.getElementById('commentText') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = commentText.substring(start, end);
    let formattedText = '';

    switch (format) {
      case 'bold':
        formattedText = `**${selectedText}**`;
        break;
      case 'italic':
        formattedText = `*${selectedText}*`;
        break;
      case 'underline':
        formattedText = `__${selectedText}__`;
        break;
      case 'bullet':
        formattedText = `• ${selectedText}`;
        break;
      case 'numbered':
        formattedText = `1. ${selectedText}`;
        break;
      default:
        formattedText = selectedText;
    }

    const newContent = commentText.substring(0, start) + formattedText + commentText.substring(end);
    setCommentText(newContent);
    
    // Set cursor position after formatted text
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + formattedText.length, start + formattedText.length);
    }, 0);
  };

  // Handle text formatting for replies
  const handleReplyTextFormat = (format: string, commentId: string) => {
    const textarea = document.getElementById(`replyText_${commentId}`) as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentReplyText = replyText[commentId] || '';
    const selectedText = currentReplyText.substring(start, end);
    let formattedText = '';

    switch (format) {
      case 'bold':
        formattedText = `**${selectedText}**`;
        break;
      case 'italic':
        formattedText = `*${selectedText}*`;
        break;
      case 'underline':
        formattedText = `__${selectedText}__`;
        break;
      case 'bullet':
        formattedText = `• ${selectedText}`;
        break;
      case 'numbered':
        formattedText = `1. ${selectedText}`;
        break;
      default:
        formattedText = selectedText;
    }

    const newContent = currentReplyText.substring(0, start) + formattedText + currentReplyText.substring(end);
    setReplyText(prev => ({
      ...prev,
      [commentId]: newContent
    }));
    
    // Set cursor position after formatted text
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + formattedText.length, start + formattedText.length);
    }, 0);
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

  const handleEditComment = async (commentId: string) => {
    if (!currentUser?.uid) {
      toast.error('Please sign in to edit comments');
      return;
    }

    const newContent = editedCommentContent[commentId]?.trim();
    if (!newContent) {
      toast.error('Comment content cannot be empty');
      return;
    }

    try {
      await FirebaseService.updateComment(commentId, currentUser!.uid, postId!, newContent, isAdmin);
      toast.success('Comment updated successfully!');
      setIsEditingComment(prev => ({ ...prev, [commentId]: false }));
      setEditedCommentContent(prev => ({ ...prev, [commentId]: '' }));

      // Refresh comments
      const fetchedComments = await FirebaseService.getComments(postId!);
      setComments(fetchedComments);

      // Refresh post to update comment count
      const posts = await FirebaseService.getDiscussionPosts(isEnglish);
      const updatedPost = posts.find(p => p.id === postId);
      if (updatedPost) {
        setPost(updatedPost);
      }

    } catch (error: any) {
      console.error('Error updating comment:', error);
      toast.error(error.message || 'Failed to update comment');
    }
  };

  // Admin functions for comment management
  const handleAdminDeleteComment = async (commentId: string) => {
    if (!isAdmin) {
      toast.error('Admin access required');
      return;
    }

    if (window.confirm('Are you sure you want to delete this comment as an admin? This action cannot be undone.')) {
      try {
        await FirebaseService.deleteCommentAsAdmin(commentId, postId!);
        toast.success('Comment deleted successfully by admin');
        
        // Refresh comments
        const fetchedComments = await FirebaseService.getComments(postId!, isEnglish);
        setComments(fetchedComments);
        
        // Refresh post to update comment count
        const posts = await FirebaseService.getDiscussionPosts(isEnglish);
        const updatedPost = posts.find(p => p.id === postId);
        if (updatedPost) {
          // The post data from getDiscussionPosts already includes userName with nagrik number
          setPost(updatedPost);
        }
      } catch (error: any) {
        console.error('Error deleting comment as admin:', error);
        toast.error(error.message || 'Failed to delete comment as admin');
      }
    }
  };

  const startEditingComment = (commentId: string, currentContent: string) => {
    setIsEditingComment(prev => ({ ...prev, [commentId]: true }));
    setEditedCommentContent(prev => ({ ...prev, [commentId]: currentContent }));
  };

  const cancelEditingComment = (commentId: string) => {
    setIsEditingComment(prev => ({ ...prev, [commentId]: false }));
    setEditedCommentContent(prev => ({ ...prev, [commentId]: '' }));
  };

  // Reply editing functions
  const startEditingReply = (replyId: string, currentContent: string) => {
    setIsEditingReply(prev => ({ ...prev, [replyId]: true }));
    setEditedReplyContent(prev => ({ ...prev, [replyId]: currentContent }));
  };

  const cancelEditingReply = (replyId: string) => {
    setIsEditingReply(prev => ({ ...prev, [replyId]: false }));
    setEditedReplyContent(prev => ({ ...prev, [replyId]: '' }));
  };

  const handleEditReply = async (replyId: string) => {
    const newContent = editedReplyContent[replyId]?.trim();
    if (!newContent) {
      toast.error('Reply content cannot be empty');
      return;
    }

    try {
      await FirebaseService.updateReply(replyId, currentUser!.uid, postId!, newContent);
      toast.success('Reply updated successfully');
      
      // Refresh replies
      const commentReplies = await FirebaseService.getReplies(replyId.split('_')[0], isEnglish);
      setReplies(prev => ({ ...prev, [replyId.split('_')[0]]: commentReplies }));
      
      // Exit edit mode
      setIsEditingReply(prev => ({ ...prev, [replyId]: false }));
      setEditedReplyContent(prev => ({ ...prev, [replyId]: '' }));
      
    } catch (error: any) {
      console.error('Error updating reply:', error);
      toast.error(error.message || 'Failed to update reply');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#014e5c] mx-auto mb-4"></div>
          <p className="text-gray-600">{content.loading}</p>
          <p className="text-sm text-gray-500 mt-2">Loading post, comments, and user reactions...</p>
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
            className="bg-[#014e5c] text-white px-6 py-2 rounded-lg hover:bg-[#014e5c]/90 transition-colors"
          >
            {content.backToForum}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 relative">
      {/* Data Loading Overlay - Prevents interactions until fully loaded */}
      {!isDataFullyLoaded && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="text-center bg-white p-6 rounded-lg shadow-lg border">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#014e5c] mx-auto mb-3"></div>
            <p className="text-gray-700 font-medium">Loading user data...</p>
            <p className="text-sm text-gray-500 mt-1">Please wait while we fetch your reactions</p>
          </div>
        </div>
      )}
      {/* Desktop Header */}
      <div className="hidden lg:block bg-[#014e5c] text-white sticky top-0 z-20 shadow-md">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/discussion')}
                className="p-2 hover:bg-white/10 text-white rounded-full transition-colors"
              >
                <ArrowLeft className="w-3 h-3 lg:w-5 lg:h-5" />
              </button>
              <h1 className="text-xs lg:text-lg font-semibold">{content.backToForum}</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Header */}
      <div className="lg:hidden bg-[#014e5c] text-white sticky top-0 z-20 shadow-md">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/discussion')}
              className="p-2 hover:bg-white/10 text-white rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-semibold">{content.backToForum}</h1>
            <div className="w-10"></div> {/* Spacer for centering */}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-3 py-4 pb-20 lg:pb-4">
        {/* Post Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4"
        >
          <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
            {post.status === 'removed' ? (
              <div className="p-8 text-center">
                <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                <p className="text-gray-600 text-lg">{content.postRemoved}</p>
              </div>
            ) : (
              <div className="p-4">
                {/* Post Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-7 h-7 lg:w-10 lg:h-10 bg-gradient-to-br from-[#014e5c] to-[#01798e] rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 lg:h-5 lg:w-5 text-white" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-xs lg:text-sm text-gray-900 text-base">{post.userName || 'User'}</h3>
                        <div className="mt-[2px] lg:mt-1 flex items-center space-x-2 text-xs text-gray-500">
                          <MapPin className="h-3 w-3 lg:h-4 lg:w-4" />
                          <span className="text-[10px] lg:text-sm">{post.constituencyName || `Constituency ${post.constituency}`}</span>
                          <span className="text-xs lg:text-sm">•</span>
                          <Clock className="h-2 w-2 lg:h-3 lg:w-3" />
                          <span className="text-[10px] lg:text-sm">{formatRelativeTime(post.createdAt)}</span>
                          {post.isEdited && (
                            <>
                              <span className="text-xs lg:text-sm">•</span>
                              <span className="text-[10px] lg:text-sm italic text-gray-400">{content.edited}</span>
                            </>
                          )}
                        </div>
                      </div>
                  </div>
                  
                  {/* Status Badge */}
                  {post.status === 'under_review' && (
                    <span className="px-2 py-1 bg-yellow-50 text-yellow-700 border border-yellow-200 text-xs font-medium rounded-full flex items-center gap-1">
                      <Shield className="h-3 w-3" />
                      {content.underReview}
                    </span>
                  )}
                </div>

                {/* Post Content */}
                <div className="mb-4">
                  {/* Post Title and Actions */}
                  <div className="flex items-start justify-between mb-3">
                    {isEditingPost ? (
                      <div className="flex-1">
                        <input
                          type="text"
                          value={editedPostTitle}
                          onChange={(e) => setEditedPostTitle(e.target.value)}
                          className="w-full text-lg lg:text-2xl font-bold text-[#014e5c] bg-white border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#014e5c] focus:border-[#014e5c]"
                          placeholder="Enter post title..."
                        />
                      </div>
                    ) : (
                      <h1 className="text-lg lg:text-2xl font-bold text-[#014e5c] leading-tight flex-1">
                        {post.titlefirst} {post.titlesecond}
                      </h1>
                    )}
                    
                    {/* Post Owner Actions */}
                    {currentUser?.uid === post.userId && (
                      <div className="flex items-center space-x-1 ml-4">
                        {isEditingPost ? (
                          <>
                            <button
                              onClick={handleUpdatePost}
                              className="text-green-600 hover:bg-green-50 p-2 rounded-md transition-colors flex items-center space-x-1"
                            >
                              <Check className="h-3 w-3" />
                              <span className="text-xs font-medium">{content.save}</span>
                            </button>
                            
                            <button
                              onClick={handleCancelEdit}
                              className="text-gray-500 hover:bg-gray-50 p-2 rounded-md transition-colors flex items-center space-x-1"
                            >
                              <X className="h-4 w-4" />
                              <span className="text-xs font-medium">{content.cancel}</span>
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                                onClick={() => handleEditPost()}
                                className="text-[#014e5c] hover:bg-[#014e5c]/10 p-1 rounded-md transition-colors flex items-center space-x-1"
                              >
                              <Edit3 className="h-3 w-3" />
                              <span className="text-[10px] lg:text-sm font-medium">{content.edit}</span>
                            </button>
                            
                            <button
                              onClick={() => handleDeletePost(post.id)}
                              className="text-red-500 hover:bg-red-50 hover:text-red-600 p-1 rounded-md transition-colors flex items-center space-x-1"
                            >
                              <Trash2 className="h-3 w-3" />
                              <span className="text-[10px] lg:text-sm font-medium">{content.delete}</span>
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Post Content */}
                  <div className="mb-4">
                    {isEditingPost ? (
                      <textarea
                        value={editedPostContent}
                        onChange={(e) => setEditedPostContent(e.target.value)}
                        className="w-full text-gray-700 leading-relaxed text-sm lg:text-base bg-white border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#014e5c] focus:border-[#014e5c] resize-none"
                        rows={8}
                        placeholder="Enter post content..."
                      />
                    ) : (
                      <p 
                        className="text-gray-700 leading-relaxed text-sm lg:text-base mb-4"
                        dangerouslySetInnerHTML={{ __html: renderFormattedText(post.content) }}
                      />
                    )}
                  </div>
                  
                  {/* Tags */}
                  {post.tags && post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {post.tags.map((tag, tagIndex) => (
                        <span
                          key={tagIndex}
                          className="px-2 py-1 text-[#014e5c] text-[10px] lg:text-xs rounded-full flex items-center"
                        >
                          <Hash className="h-2 w-2 mr-1 lg:h-3 lg:w-3" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="border-t border-gray-100 my-3"></div>

                {/* Engagement Section */}
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center space-x-2 lg:space-x-3">
                    <button 
                      onClick={handleLike}
                      disabled={userReaction.disliked || !isDataFullyLoaded}
                      className={`flex items-center space-x-1.5 lg:space-x-2 p-1.5 rounded-md transition-colors ${
                        userReaction.liked 
                          ? 'text-red-500 bg-red-50 hover:bg-red-100 hover:text-red-600' 
                          : userReaction.disliked || !isDataFullyLoaded
                          ? 'text-gray-300 cursor-not-allowed'
                          : 'text-gray-500 hover:text-red-500 hover:bg-red-50'
                      }`}
                    >
                      <Heart className={`h-3 w-3 lg:h-4 lg:w-4 ${userReaction.liked ? 'fill-current' : ''}`} />
                      <span className="text-sm font-medium">{post.likesCount || 0}</span>
                    </button>

                    <button 
                      onClick={handleDislike}
                      disabled={userReaction.liked || !isDataFullyLoaded}
                      className={`flex items-center space-x-1.5 lg:space-x-2 p-1.5 rounded-md transition-colors ${
                        userReaction.disliked 
                          ? 'text-blue-500 bg-blue-50 hover:bg-blue-100 hover:text-blue-600' 
                          : userReaction.liked || !isDataFullyLoaded
                          ? 'text-gray-300 cursor-not-allowed'
                          : 'text-gray-500 hover:text-blue-500 hover:bg-blue-50'
                      }`}
                    >
                      <ThumbsDown className={`h-3 w-3 lg:h-4 lg:w-4 ${userReaction.disliked ? 'fill-current' : ''}`} />
                      <span className="text-[10px] lg:text-sm font-medium">{post.dislikesCount || 0}</span>
                    </button>

                    <button 
                      onClick={handleShare}
                      className="text-gray-500 hover:text-[#014e5c] hover:bg-[#014e5c]/10 p-1.5 rounded-md transition-colors flex items-center space-x-1.5 lg:space-x-2"
                    >
                      {copiedPostId === post.id ? (
                        <Check className="h-3 w-3 lg:h-4 lg:w-4 text-green-600" />
                      ) : (
                        <Share2 className="h-3 w-3 lg:h-4 lg:w-4" />
                      )}
                      <span className="text-[10px] lg:text-sm font-medium">
                        {copiedPostId === post.id ? (isEnglish ? 'Copied!' : 'कॉपी किया!') : content.share}
                      </span>
                    </button>
                  </div>
                  
                  <div className="flex items-center space-x-1.5 lg:space-x-2 text-[10px] lg:text-sm text-gray-500">
                    <MessageSquare className="h-3 w-3 lg:h-4 lg:w-4" />
                    <span>{post.commentsCount || 0} {content.comments}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Comments Section */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-white">
            <h2 className="text-sm lg:text-lg font-semibold text-[#014e5c] mb-3">{content.comments}</h2>
            
            {/* Comment Input */}
            <div className="space-y-3">
              {currentUser ? (
                <div className="flex flex-col space-y-2">
                  {/* Text Formatting Toolbar */}
                  <div className="flex items-center gap-1 p-2 bg-[#014e5c]/5 border border-[#014e5c]/20 rounded-md">
                    <button
                      type="button"
                      onClick={() => handleTextFormat('bold')}
                      className="p-1 hover:bg-[#014e5c]/20 rounded transition-colors"
                      title="Bold"
                    >
                      <Bold className="h-3 w-3 text-[#014e5c]" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTextFormat('italic')}
                      className="p-1 hover:bg-[#014e5c]/20 rounded transition-colors"
                      title="Italic"
                    >
                      <Italic className="h-3 w-3 text-[#014e5c]" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTextFormat('underline')}
                      className="p-1 hover:bg-[#014e5c]/20 rounded transition-colors"
                      title="Underline"
                    >
                      <Underline className="h-3 w-3 text-[#014e5c]" />
                    </button>
                    <div className="w-px h-4 bg-[#014e5c]/30 mx-1"></div>
                    <button
                      type="button"
                      onClick={() => handleTextFormat('bullet')}
                      className="p-1 hover:bg-[#014e5c]/20 rounded transition-colors"
                      title="Bullet List"
                    >
                      <List className="h-3 w-3 text-[#014e5c]" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTextFormat('numbered')}
                      className="p-1 hover:bg-[#014e5c]/20 rounded transition-colors"
                      title="Numbered List"
                    >
                      <ListOrdered className="h-3 w-3 text-[#014e5c]" />
                    </button>
                  </div>
                  
                  <textarea
                    id="commentText"
                    placeholder={content.writeComment}
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    className="w-full px-2 py-1.5 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#014e5c] focus:border-[#014e5c] resize-none text-sm lg:text-base"
                    rows={3}
                  />
                  <div className="flex justify-end">
                    <button
                      onClick={handleCommentSubmit}
                      disabled={isSubmittingComment}
                      className="bg-[#014e5c] hover:bg-[#014e5c]/90 text-white px-4 py-1.5 rounded-md transition-colors text-[10px] lg:text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmittingComment ? content.posting : content.comment}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-3 bg-white rounded-md border border-gray-200 shadow-sm">
                  <MessageSquare className="h-5 w-5 lg:h-6 lg:w-6 mx-auto mb-2 text-[#014e5c]/40" />
                  <p className="text-[12px] lg:text-sm text-gray-500">{content.signInToComment}</p>
                </div>
              )}
            </div>
          </div>

          {/* Comments List */}
          <div className="p-4">
            {comments.length === 0 ? (
              <div className="text-center text-gray-500 py-3 lg:py-6">
                <MessageSquare className="w-8 h-8 lg:w-10 lg:h-10 mx-auto mb-2 text-gray-300" />
                <p className="text-[12px] lg:text-sm">{content.noComments}</p>
              </div>
            ) : (
              <div className="space-y-2 lg:space-y-4">
                <AnimatePresence>
                  {comments.map((comment, index) => (
                    <motion.div
                      key={comment.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="space-y-2 lg:space-y-3"
                    >
                      {/* Main Comment */}
                      <div className="border border-gray-200 rounded-md shadow-sm overflow-hidden">
                        <div className="p-2 lg:p-3 bg-white">
                          <div className="flex space-x-2">
                            <div className="w-7 h-7 lg:w-8 lg:h-8 bg-gradient-to-br from-[#014e5c] to-[#01798e] rounded-full flex-shrink-0 flex items-center justify-center">
                              <User className="h-3 w-3 lg:h-4 lg:w-4 text-white" />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center space-x-1.5 lg:space-x-2 text-[10px] lg:text-xs mb-1">
                                  <span className="font-semibold text-[#014e5c]">{comment.userName}</span>
                                  <span className="text-gray-400">•</span>
                                  <span className="text-gray-500 text-[10px] lg:text-sm">{formatRelativeTime(comment.createdAt)}</span>
                                  <span className="text-gray-400">•</span>
                                  <span className="text-gray-500 text-[10px] lg:text-sm">{comment.constituencyName}</span>
                                  {isAdmin && (
                                    <>
                                      <span className="text-gray-400">•</span>
                                      <span className="text-yellow-600 text-xs flex items-center gap-1">
                                        <Crown className="h-3 w-3" />
                                        Admin
                                      </span>
                                    </>
                                  )}
                                </div>
                                
                                {/* Comment Content - Show edit form or display content */}
                                {isEditingComment[comment.id] ? (
                                  <div className="mb-3">
                                    <textarea
                                      value={editedCommentContent[comment.id] || ''}
                                      onChange={(e) => setEditedCommentContent(prev => ({
                                        ...prev,
                                        [comment.id]: e.target.value
                                      }))}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#014e5c] focus:border-[#014e5c] resize-none text-sm"
                                      rows={3}
                                    />
                                    <div className="flex items-center gap-2 mt-2">
                                      <button
                                        onClick={() => handleEditComment(comment.id)}
                                        className="bg-[#014e5c] hover:bg-[#014e5c]/90 text-white px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
                                      >
                                        {content.save}
                                      </button>
                                      <button
                                        onClick={() => cancelEditingComment(comment.id)}
                                        className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
                                      >
                                        {content.cancel}
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <p 
                                    className="text-gray-700 text-[10px] lg:text-sm mb-2"
                                    dangerouslySetInnerHTML={{ __html: renderFormattedText(comment.content) }}
                                  />
                                )}
                              
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  {/* Like Button */}
                                  <button
                                    onClick={() => handleCommentLike(comment.id)}
                                    disabled={commentReactions[comment.id]?.disliked || !isDataFullyLoaded}
                                    className={`flex items-center space-x-1 px-1.5 py-0.5 rounded text-[10px] lg:text-xs font-medium transition-colors ${
                                      commentReactions[comment.id]?.liked 
                                        ? 'text-red-500 bg-red-50 hover:bg-red-100' 
                                        : commentReactions[comment.id]?.disliked || !isDataFullyLoaded
                                        ? 'text-gray-300 cursor-not-allowed'
                                        : 'text-gray-500 hover:text-red-500 hover:bg-red-50'
                                    }`}
                                  >
                                    <Heart className={`h-3 w-3 ${commentReactions[comment.id]?.liked ? 'fill-current' : ''}`} />
                                    <span className="ml-1">{comment.likesCount || 0}</span>
                                  </button>

                                  {/* Dislike Button */}
                                  <button
                                    onClick={() => handleCommentDislike(comment.id)}
                                    disabled={commentReactions[comment.id]?.liked || !isDataFullyLoaded}
                                    className={`flex items-center space-x-1 px-1.5 py-0.5 rounded text-[10px] lg:text-xs font-medium transition-colors ${
                                      commentReactions[comment.id]?.disliked 
                                        ? 'text-blue-500 bg-blue-50 hover:bg-blue-100' 
                                        : commentReactions[comment.id]?.liked || !isDataFullyLoaded
                                        ? 'text-gray-300 cursor-not-allowed'
                                        : 'text-gray-500 hover:text-blue-500 hover:bg-blue-50'
                                    }`}
                                  >
                                    <ThumbsDown className={`h-3 w-3 ${commentReactions[comment.id]?.disliked ? 'fill-current' : ''}`} />
                                    <span className="ml-1">{comment.dislikesCount || 0}</span>
                                  </button>

                                  {/* Reply Button */}
                                  <button
                                    onClick={() => toggleReplyInput(comment.id)}
                                    className="text-[#014e5c] hover:bg-[#014e5c]/10 px-1.5 py-0.5 rounded text-[10px] lg:text-xs font-medium transition-colors"
                                  >
                                    {content.reply}
                                  </button>
                                  
                                  {/* Edit Button (only show for comment owner, post owner, or admin) */}
                                  {(currentUser?.uid === comment.userId || isAdmin) && (
                                    <button
                                      onClick={() => startEditingComment(comment.id, comment.content)}
                                      className="text-[#014e5c] hover:bg-[#014e5c]/10 px-1.5 py-0.5 rounded text-[10px] lg:text-xs font-medium transition-colors"
                                    >
                                      <Edit3 className="h-3 w-3 inline mr-1" />
                                      {content.edit}
                                    </button>
                                  )}
                                  
                                  {/* Delete Button (only show for comment owner or admin) */}
                                  {(currentUser?.uid === comment.userId || isAdmin) && (
                                    <button
                                      onClick={() => isAdmin ? handleAdminDeleteComment(comment.id) : handleDeleteComment(comment.id)}
                                      className="text-red-500 hover:bg-red-50 hover:text-red-600 px-1.5 py-0.5 rounded text-[10px] lg:text-xs font-medium transition-colors"
                                    >
                                      <Trash2 className="h-3 w-3 inline mr-1" />
                                      {isAdmin ? 'Delete (Admin)' : 'Delete'}
                                    </button>
                                  )}
                                </div>
                                
                                {/* Show/Hide Replies Button */}
                                {replies[comment.id] && replies[comment.id].length > 0 && (
                                  <button
                                    onClick={() => toggleReplies(comment.id)}
                                    className="text-gray-500 hover:text-[#014e5c] flex items-center space-x-1 px-2 py-1 rounded text-sm font-medium transition-colors"
                                  >
                                    <span className="text-xs">
                                      {expandedComments[comment.id] ? content.hideReplies : content.showReplies} ({replies[comment.id].length})
                                    </span>
                                    {expandedComments[comment.id] ? (
                                      <ChevronUp className="h-4 w-4" />
                                    ) : (
                                      <ChevronDown className="h-4 w-4" />
                                    )}
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Reply Input */}
                        {showReplyInput[comment.id] && (
                          <div className="p-3 bg-gray-50 border-t border-gray-100">
                            <div className="flex flex-col space-y-2">
                              {/* Text Formatting Toolbar for Replies */}
                              <div className="flex items-center gap-1 p-1.5 bg-[#014e5c]/5 border border-[#014e5c]/20 rounded-md">
                                <button
                                  type="button"
                                  onClick={() => handleReplyTextFormat('bold', comment.id)}
                                  className="p-1 hover:bg-[#014e5c]/20 rounded transition-colors"
                                  title="Bold"
                                >
                                  <Bold className="h-2.5 w-2.5 text-[#014e5c]" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleReplyTextFormat('italic', comment.id)}
                                  className="p-1 hover:bg-[#014e5c]/20 rounded transition-colors"
                                  title="Italic"
                                >
                                  <Italic className="h-2.5 w-2.5 text-[#014e5c]" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleReplyTextFormat('underline', comment.id)}
                                  className="p-1 hover:bg-[#014e5c]/20 rounded transition-colors"
                                  title="Underline"
                                >
                                  <Underline className="h-2.5 w-2.5 text-[#014e5c]" />
                                </button>
                                <div className="w-px h-3 bg-[#014e5c]/30 mx-1"></div>
                                <button
                                  type="button"
                                  onClick={() => handleReplyTextFormat('bullet', comment.id)}
                                  className="p-1 hover:bg-[#014e5c]/20 rounded transition-colors"
                                  title="Bullet List"
                                >
                                  <List className="h-2.5 w-2.5 text-[#014e5c]" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleReplyTextFormat('numbered', comment.id)}
                                  className="p-1 hover:bg-[#014e5c]/20 rounded transition-colors"
                                  title="Numbered List"
                                >
                                  <ListOrdered className="h-2.5 w-2.5 text-[#014e5c]" />
                                </button>
                              </div>
                              
                              <textarea
                                id={`replyText_${comment.id}`}
                                placeholder={content.writeReply}
                                value={replyText[comment.id] || ''}
                                onChange={(e) => setReplyText(prev => ({
                                  ...prev,
                                  [comment.id]: e.target.value
                                }))}
                                className="w-full px-2 py-1.5 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#014e5c] focus:border-[#014e5c] resize-none"
                                rows={2}
                              />
                              <div className="flex justify-end">
                                <button
                                  onClick={() => handleReplySubmit(comment.id)}
                                  disabled={isSubmittingReply[comment.id]}
                                  className="bg-[#014e5c] hover:bg-[#014e5c]/90 text-white px-3 py-1.5 rounded-md transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {isSubmittingReply[comment.id] ? content.posting : content.reply}
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                        {/* Replies */}
                        {replies[comment.id] && replies[comment.id].length > 0 && expandedComments[comment.id] && (
                          <div className="bg-gray-50 border-t border-gray-100">
                            <div className="pl-8 pr-3 py-2 space-y-2">
                              {replies[comment.id].map((reply) => (
                                <div key={reply.id} className="flex space-x-2 p-2 bg-white rounded-md border border-gray-200 shadow-sm">
                                  <div className="w-5 h-5 bg-gradient-to-br from-[#014e5c] to-[#01798e] rounded-full flex-shrink-0 flex items-center justify-center">
                                    <User className="h-2 w-2 text-white" />
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-center space-x-2 text-[10px] lg:text-xs mb-1">
                                      <span className="font-semibold text-[#014e5c]">{reply.userName}</span>
                                      <span className="text-gray-400">•</span>
                                      <span className="text-gray-500">{formatRelativeTime(reply.createdAt)}</span>
                                    </div>
                                    
                                  {/* Reply Content - Show edit form or display content */}
                                     {isEditingReply[reply.id] ? (
                                       <div className="mb-2">
                                         <textarea
                                           value={editedReplyContent[reply.id] || ''}
                                           onChange={(e) => setEditedReplyContent(prev => ({
                                             ...prev,
                                             [reply.id]: e.target.value
                                           }))}
                                           className="w-full px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#014e5c] focus:border-[#014e5c] resize-none text-xs"
                                           rows={2}
                                         />
                                         <div className="flex items-center gap-1 mt-1.5">
                                           <button
                                             onClick={() => handleEditReply(reply.id)}
                                             className="bg-[#014e5c] hover:bg-[#014e5c]/90 text-white px-2 py-1 rounded text-xs font-medium transition-colors"
                                           >
                                             {content.save}
                                           </button>
                                           <button
                                             onClick={() => cancelEditingReply(reply.id)}
                                             className="bg-gray-500 hover:bg-gray-600 text-white px-2 py-1 rounded text-xs font-medium transition-colors"
                                           >
                                             {content.cancel}
                                           </button>
                                         </div>
                                       </div>
                                     ) : (
                                       <p 
                                         className="text-gray-700 text-xs mb-1.5"
                                         dangerouslySetInnerHTML={{ __html: renderFormattedText(reply.content) }}
                                       />
                                     )}
                                     
                                     {/* Action buttons */}
                                     <div className="flex items-center space-x-1.5">
                                       {/* Like Button */}
                                       <button
                                         onClick={() => handleReplyLike(reply.id, comment.id)}
                                         disabled={replyReactions[reply.id]?.disliked || !isDataFullyLoaded}
                                         className={`flex items-center space-x-1 px-1 py-0.5 rounded text-[10px] font-medium transition-colors ${
                                           replyReactions[reply.id]?.liked 
                                             ? 'text-red-500 bg-red-50 hover:bg-red-100' 
                                             : replyReactions[reply.id]?.disliked || !isDataFullyLoaded
                                             ? 'text-gray-300 cursor-not-allowed'
                                             : 'text-gray-500 hover:text-red-500 hover:bg-red-50'
                                         }`}
                                       >
                                         <Heart className={`h-2.5 w-2.5 ${replyReactions[reply.id]?.liked ? 'fill-current' : ''}`} />
                                         <span className="ml-1 text-[10px]">{reply.likesCount || 0}</span>
                                       </button>

                                       {/* Dislike Button */}
                                       <button
                                         onClick={() => handleReplyDislike(reply.id, comment.id)}
                                         disabled={replyReactions[reply.id]?.liked || !isDataFullyLoaded}
                                         className={`flex items-center space-x-1 px-1 py-0.5 rounded text-[10px] font-medium transition-colors ${
                                           replyReactions[reply.id]?.disliked 
                                             ? 'text-blue-500 bg-blue-50 hover:bg-blue-100' 
                                             : replyReactions[reply.id]?.liked || !isDataFullyLoaded
                                             ? 'text-gray-300 cursor-not-allowed'
                                             : 'text-gray-500 hover:text-blue-500 hover:bg-blue-50'
                                         }`}
                                       >
                                         <ThumbsDown className={`h-2.5 w-2.5 ${replyReactions[reply.id]?.disliked ? 'fill-current' : ''}`} />
                                         <span className="ml-1 text-[10px]">{reply.dislikesCount || 0}</span>
                                       </button>

                                       {/* Edit Button (only show for reply owner or admin) */}
                                       {(currentUser?.uid === reply.userId || isAdmin) && !isEditingReply[reply.id] && (
                                         <button
                                           onClick={() => startEditingReply(reply.id, reply.content)}
                                           className="text-[#014e5c] hover:bg-[#014e5c]/10 px-1 py-0.5 rounded text-[10px] font-medium transition-colors"
                                         >
                                           <Edit3 className="h-2.5 w-2.5 inline mr-1" />
                                           {content.edit}
                                         </button>
                                       )}
                                       
                                       {/* Delete Button for replies (only show for reply owner or admin) */}
                                       {(currentUser?.uid === reply.userId || isAdmin) && !isEditingReply[reply.id] && (
                                         <button
                                           onClick={() => handleDeleteReply(reply.id)}
                                           className="text-red-500 hover:bg-red-50 hover:text-red-600 px-1 py-0.5 rounded text-[10px] font-medium transition-colors"
                                         >
                                           <Trash2 className="h-2.5 w-2.5 inline mr-1" />
                                           {content.delete}
                                         </button>
                                       )}
                                     </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
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
        <div className="flex items-center justify-around py-2 px-1">
          <button
            onClick={() => navigate('/')}
            className={`flex flex-col items-center space-y-0.5 p-1.5 rounded-md transition-colors text-gray-500`}
          >
            <Home className="w-4 h-4" />
            <span className="text-xs font-medium">{content.home}</span>
          </button>
          <button
            onClick={() => navigate('discussion')}
            className={`flex flex-col items-center space-y-0.5 p-1.5 rounded-md transition-colors text-[#014e5c] bg-[#014e5c]/10`}
          >
            <ChatBubble className="w-4 h-4" />
            <span className="text-xs font-medium">{content.discussion}</span>
          </button>
          <button
            onClick={() => navigate('/aapka-kshetra')}
            className={`flex flex-col items-center space-y-0.5 p-1.5 rounded-md transition-colors text-gray-500`}
          >
            <MapPin className="w-4 h-4" />
            <span className="text-xs font-medium">{content.area}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PostDetail;
