import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { X, MapPin, AlertTriangle, Loader } from 'lucide-react';
import toast from 'react-hot-toast';
import FirebaseService from '../services/firebaseService';

interface CreatePostProps {
  isOpen: boolean;
  onClose: () => void;
  onPostCreated: () => void;
}

interface Constituency {
  id: number;
  name: string;
}

const CreatePost: React.FC<CreatePostProps> = ({ isOpen, onClose, onPostCreated }) => {
  const { isEnglish } = useLanguage();
  const { currentUser } = useAuth();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedConstituency, setSelectedConstituency] = useState<number | null>(null);
  const [constituencies, setConstituencies] = useState<Constituency[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const content = {
    title: isEnglish ? 'Create New Discussion' : 'नई चर्चा बनाएं',
    subtitle: isEnglish ? 'Share your thoughts with citizens across Bihar' : 'बिहार भर के नागरिकों के साथ अपने विचार साझा करें',
    postTitle: isEnglish ? 'Post Title' : 'पोस्ट का शीर्षक',
    postTitlePlaceholder: isEnglish ? 'Enter a clear, descriptive title...' : 'एक स्पष्ट, वर्णनात्मक शीर्षक दर्ज करें...',
    postContent: isEnglish ? 'Post Content' : 'पोस्ट की सामग्री',
    postContentPlaceholder: isEnglish ? 'Share your thoughts, questions, or concerns...' : 'अपने विचार, प्रश्न या चिंताएं साझा करें...',
    constituency: isEnglish ? 'Constituency' : 'निर्वाचन क्षेत्र',
    selectConstituency: isEnglish ? 'Select your constituency' : 'अपना निर्वाचन क्षेत्र चुनें',
    createPost: isEnglish ? 'Create Post' : 'पोस्ट बनाएं',
    cancel: isEnglish ? 'Cancel' : 'रद्द करें',
    titleRequired: isEnglish ? 'Title is required' : 'शीर्षक आवश्यक है',
    contentRequired: isEnglish ? 'Content is required' : 'सामग्री आवश्यक है',
    constituencyRequired: isEnglish ? 'Please select a constituency' : 'कृपया एक निर्वाचन क्षेत्र चुनें',
    postCreated: isEnglish ? 'Post created successfully!' : 'पोस्ट सफलतापूर्वक बनाई गई!',
    postCreationFailed: isEnglish ? 'Failed to create post. Please try again.' : 'पोस्ट बनाने में विफल। कृपया पुनः प्रयास करें।',
    signInRequired: isEnglish ? 'Please sign in to create posts' : 'पोस्ट बनाने के लिए कृपया साइन इन करें',
    loading: isEnglish ? 'Loading constituencies...' : 'निर्वाचन क्षेत्र लोड हो रहे हैं...'
  };

  // Fetch constituencies on component mount
  useEffect(() => {
    if (isOpen) {
      fetchConstituencies();
    }
  }, [isOpen]);

  // Set default constituency if user is logged in
  useEffect(() => {
    if (currentUser?.uid && constituencies.length > 0) {
      const userProfile = FirebaseService.getUserProfile(currentUser.uid);
      userProfile.then(profile => {
        if (profile?.constituency_id) {
          setSelectedConstituency(profile.constituency_id);
        }
      });
    }
  }, [currentUser?.uid, constituencies]);

  const fetchConstituencies = async () => {
    try {
      setIsLoading(true);
      // For now, we'll create a list of all 243 constituencies
      // This can be enhanced later with actual constituency data
      const allConstituencies: Constituency[] = [];
      for (let i = 1; i <= 243; i++) {
        allConstituencies.push({
          id: i,
          name: `Constituency ${i}`
        });
      }
      setConstituencies(allConstituencies);
    } catch (error) {
      console.error('Error fetching constituencies:', error);
      toast.error('Failed to load constituencies');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser?.uid) {
      toast.error(content.signInRequired);
      return;
    }

    if (!title.trim()) {
      toast.error(content.titleRequired);
      return;
    }

    if (!content.trim()) {
      toast.error(content.contentRequired);
      return;
    }

    if (!selectedConstituency) {
      toast.error(content.constituencyRequired);
      return;
    }

    try {
      setIsSubmitting(true);

      // Basic content moderation (can be enhanced with AI later)
      const moderatedContent = await moderateContent(content);
      
      if (moderatedContent.status === 'flagged') {
        toast.error('Content contains inappropriate language. Please revise.');
        return;
      }

      // Create the post
      const postData = {
        title: title.trim(),
        content: content.trim(),
        constituency: selectedConstituency,
        userId: currentUser.uid,
        status: moderatedContent.status, // 'published' or 'under_review'
        createdAt: new Date(),
        likesCount: 0,
        commentsCount: 0
      };

      await FirebaseService.createDiscussionPost(postData);

      toast.success(content.postCreated);
      
      // Reset form
      setTitle('');
      setContent('');
      setSelectedConstituency(null);
      
      // Close modal and refresh posts
      onClose();
      onPostCreated();
      
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error(content.postCreationFailed);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Basic content moderation (placeholder for future AI integration)
  const moderateContent = async (text: string): Promise<{ status: 'published' | 'under_review'; reason?: string }> => {
    // Simple keyword-based moderation for now
    const inappropriateKeywords = [
      'spam', 'advertisement', 'promotion', 'buy now', 'click here',
      'free money', 'get rich', 'lottery', 'winner', 'urgent'
    ];
    
    const lowerText = text.toLowerCase();
    const hasInappropriateContent = inappropriateKeywords.some(keyword => 
      lowerText.includes(keyword)
    );

    if (hasInappropriateContent) {
      return { status: 'under_review', reason: 'Contains promotional content' };
    }

    return { status: 'published' };
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{content.title}</h2>
              <p className="text-gray-600 mt-1">{content.subtitle}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-6">
          {/* Title */}
          <div className="mb-6">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              {content.postTitle}
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={content.postTitlePlaceholder}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              maxLength={100}
              required
            />
            <div className="text-sm text-gray-500 mt-1">
              {title.length}/100 characters
            </div>
          </div>

          {/* Content */}
          <div className="mb-6">
            <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
              {content.postContent}
            </label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={content.postContentPlaceholder}
              rows={6}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent resize-none"
              maxLength={1000}
              required
            />
            <div className="text-sm text-gray-500 mt-1">
              {content.length}/1000 characters
            </div>
          </div>

          {/* Constituency Selection */}
          <div className="mb-6">
            <label htmlFor="constituency" className="block text-sm font-medium text-gray-700 mb-2">
              {content.constituency}
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <select
                id="constituency"
                value={selectedConstituency || ''}
                onChange={(e) => setSelectedConstituency(Number(e.target.value))}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                required
              >
                <option value="">{content.selectConstituency}</option>
                {isLoading ? (
                  <option disabled>{content.loading}</option>
                ) : (
                  constituencies.map(constituency => (
                    <option key={constituency.id} value={constituency.id}>
                      {constituency.name}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          {/* Guidelines */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <h4 className="font-medium mb-1">Posting Guidelines:</h4>
                <ul className="list-disc list-inside space-y-1">
                  <li>Keep discussions respectful and constructive</li>
                  <li>No spam, advertisements, or promotional content</li>
                  <li>Focus on local issues and community concerns</li>
                  <li>Posts are moderated and may be reviewed</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              {content.cancel}
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim() || !content.trim() || !selectedConstituency}
              className="px-6 py-3 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isSubmitting ? (
                <>
                  <Loader className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                content.createPost
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePost;
