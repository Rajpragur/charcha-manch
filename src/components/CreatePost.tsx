import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { 
  X, 
  MapPin, 
  AlertTriangle, 
  Loader, 
  Upload, 
  Video, 
  Bold, 
  Italic, 
  Underline, 
  List, 
  ListOrdered,
  Trash2,
  Plus,
  Check,
  MessageSquare
} from 'lucide-react';
import toast from 'react-hot-toast';
import FirebaseService from '../services/firebaseService';

interface CreatePostProps {
  isOpen: boolean;
  onClose: () => void;
  onPostCreated: () => void;
  editingPost?: any | null;
}

interface Constituency {
  id: number;
  name: string;
  area_name?: string;
  area_name_hi?: string;
  district?: string;
}

interface MediaFile {
  file: File;
  preview: string;
  type: 'image' | 'video';
}

const CreatePost: React.FC<CreatePostProps> = ({ isOpen, onClose, onPostCreated, editingPost }) => {
  const { isEnglish } = useLanguage();
  const { currentUser } = useAuth();
  const [title, setTitle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [selectedConstituency, setSelectedConstituency] = useState<number | null>(null);
  const [constituencies, setConstituencies] = useState<Constituency[]>([]);
  const [constituencySearchQuery, setConstituencySearchQuery] = useState('');
  const [showConstituencyDropdown, setShowConstituencyDropdown] = useState(false);
  const [filteredConstituencies, setFilteredConstituencies] = useState<Constituency[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const constituencyInputRef = useRef<HTMLInputElement>(null);

  const content = {
    title: isEnglish ? 'Share Your Voice' : 'अपनी आवाज़ साझा करें',
    subtitle: isEnglish ? 'Start a meaningful discussion in your constituency' : 'अपने निर्वाचन क्षेत्र में एक सार्थक चर्चा शुरू करें',
    postTitle: isEnglish ? 'Discussion Title' : 'चर्चा का शीर्षक',
    postTitlePlaceholder: isEnglish ? 'What would you like to discuss?' : 'आप क्या चर्चा करना चाहते हैं?',
    postContent: isEnglish ? 'Your Message' : 'आपका संदेश',
    postContentPlaceholder: isEnglish ? 'Share your thoughts, questions, or concerns with your community...' : 'अपने समुदाय के साथ अपने विचार, प्रश्न या चिंताएं साझा करें...',
    constituency: isEnglish ? 'Constituency' : 'निर्वाचन क्षेत्र',
    selectConstituency: isEnglish ? 'Choose your constituency' : 'अपना निर्वाचन क्षेत्र चुनें',
    tags: isEnglish ? 'Tags & Topics' : 'टैग और विषय',
    addTag: isEnglish ? 'Add Tag' : 'टैग जोड़ें',
    tagPlaceholder: isEnglish ? 'e.g., roads, education, healthcare' : 'जैसे, सड़कें, शिक्षा, स्वास्थ्य',
    media: isEnglish ? 'Add Media' : 'मीडिया जोड़ें',
    uploadImage: isEnglish ? 'Upload Image' : 'छवि अपलोड करें',
    uploadVideo: isEnglish ? 'Upload Video' : 'वीडियो अपलोड करें',
    createPost: isEnglish ? 'Share Discussion' : 'चर्चा साझा करें',
    cancel: isEnglish ? 'Cancel' : 'रद्द करें',
    titleRequired: isEnglish ? 'Please add a title' : 'कृपया एक शीर्षक जोड़ें',
    contentRequired: isEnglish ? 'Please add your message' : 'कृपया अपना संदेश जोड़ें',
    constituencyRequired: isEnglish ? 'Please select your constituency' : 'कृपया अपना निर्वाचन क्षेत्र चुनें',
    postCreated: isEnglish ? 'Discussion shared successfully!' : 'चर्चा सफलतापूर्वक साझा की गई!',
    postCreationFailed: isEnglish ? 'Failed to share discussion. Please try again.' : 'चर्चा साझा करने में विफल। कृपया पुनः प्रयास करें।',
    signInRequired: isEnglish ? 'Please sign in to start discussions' : 'चर्चा शुरू करने के लिए कृपया साइन इन करें',
    loading: isEnglish ? 'Loading constituencies...' : 'निर्वाचन क्षेत्र लोड हो रहे हैं...',
    guidelines: isEnglish ? 'Community Guidelines' : 'समुदाय दिशानिर्देश',
    guidelinesText: isEnglish ? 'Keep discussions respectful, constructive, and focused on local community issues.' : 'चर्चाओं को सम्मानजनक, रचनात्मक और स्थानीय समुदाय के मुद्दों पर केंद्रित रखें।'
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
          // Find the constituency in our list by ID
          const userConstituency = constituencies.find(c => c.id === profile.constituency_id);
          if (userConstituency) {
            setSelectedConstituency(userConstituency.id);
            setConstituencySearchQuery(userConstituency.name);
          }
        }
      });
    }
  }, [currentUser?.uid, constituencies]);

  // Handle editing post - populate form with existing data
  useEffect(() => {
    if (editingPost && isOpen) {
      setTitle(editingPost.title || editingPost.titlefirst || '');
      setPostContent(editingPost.content || '');
      setSelectedConstituency(editingPost.constituency || null);
      setTags(editingPost.tags || []);
      // Note: Media files would need to be handled separately
    }
  }, [editingPost, isOpen]);

  // Filter constituencies based on search query
  useEffect(() => {
    if (constituencySearchQuery.trim() === '') {
      setFilteredConstituencies(constituencies);
    } else {
      const filtered = constituencies.filter(constituency =>
        constituency.name.toLowerCase().includes(constituencySearchQuery.toLowerCase()) ||
        (constituency.area_name && constituency.area_name.toLowerCase().includes(constituencySearchQuery.toLowerCase())) ||
        (constituency.district && constituency.district.toLowerCase().includes(constituencySearchQuery.toLowerCase()))
      );
      setFilteredConstituencies(filtered);
    }
  }, [constituencySearchQuery, constituencies]);

  // Handle constituency selection
  const handleConstituencySelect = (constituency: Constituency) => {
    setSelectedConstituency(constituency.id);
    setConstituencySearchQuery(constituency.name);
    setShowConstituencyDropdown(false);
  };

  // Handle constituency search input
  const handleConstituencySearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setConstituencySearchQuery(query);
    setShowConstituencyDropdown(true);
    
    if (query.trim() === '') {
      setSelectedConstituency(null);
    }
  };

  // Handle click outside dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (constituencyInputRef.current && !constituencyInputRef.current.contains(event.target as Node)) {
        setShowConstituencyDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setShowConstituencyDropdown(false);
      constituencyInputRef.current?.blur();
    } else if (e.key === 'Enter' && filteredConstituencies.length === 1) {
      // Auto-select if only one result
      handleConstituencySelect(filteredConstituencies[0]);
    }
  };



  const fetchConstituencies = async () => {
    try {
      // Use the new service method that loads from merged_candidates.json
      const constituencies = await FirebaseService.getAllConstituencies();
      
      if (constituencies.length > 0) {
        setConstituencies(constituencies);
        console.log(`✅ Loaded ${constituencies.length} constituencies from merged_candidates.json`);
      } else {
        console.warn('No constituencies found');
        setConstituencies([]);
      }
    } catch (error) {
      console.error('Error fetching constituencies:', error);
      setConstituencies([]);
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim()) && tags.length < 5) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleMediaUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      Array.from(files).forEach(file => {
        if (mediaFiles.length >= 3) {
          toast.error('Maximum 3 media files allowed');
          return;
        }

        if (file.size > 10 * 1024 * 1024) { // 10MB limit
          toast.error('File size should be less than 10MB');
          return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
          const preview = e.target?.result as string;
          const type = file.type.startsWith('image/') ? 'image' : 'video';
          
          setMediaFiles(prev => [...prev, { file, preview, type }]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleRemoveMedia = (index: number) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleTextFormat = (format: string) => {
    const textarea = document.getElementById('content') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = postContent.substring(start, end);
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

    const newContent = postContent.substring(0, start) + formattedText + postContent.substring(end);
    setPostContent(newContent);
    
    // Set cursor position after formatted text
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + formattedText.length, start + formattedText.length);
    }, 0);
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

    if (!postContent.trim()) {
      toast.error(content.contentRequired);
      return;
    }

    if (!selectedConstituency) {
      toast.error(content.constituencyRequired);
      return;
    }

    try {
      setIsSubmitting(true);

      // Basic content moderation
      const moderatedContent = await moderateContent(postContent);
      
      if (moderatedContent.status === 'under_review') {
        toast.error('Content contains inappropriate language. Please revise.');
        return;
      }

      // Get constituency name
      const constituency = constituencies.find(c => c.id === selectedConstituency);
      const constituencyName = constituency?.name || constituency?.area_name || `Constituency ${selectedConstituency}`;
      
      // Get user's display name
      const userName = currentUser.displayName || 'User';

      // Split title into titlefirst and titlesecond
      const titleWords = title.trim().split(' ');
      const titlefirst = titleWords[0] || '';
      const titlesecond = titleWords.slice(1).join(' ') || '';

      // Create the post data
      const postData = {
        title: title.trim(),
        titlefirst,
        titlesecond,
        content: postContent.trim(),
        constituency: selectedConstituency,
        constituencyName,
        userId: currentUser.uid,
        userName,
        status: moderatedContent.status,
        createdAt: new Date(),
        likesCount: 0,
        commentsCount: 0,
        tags,
        media: []
      };

      let postId: string;

      if (editingPost) {
        // Update existing post
        await FirebaseService.updateDiscussionPost(editingPost.id, {
          title: postData.title,
          titlefirst: postData.titlefirst,
          titlesecond: postData.titlesecond,
          content: postData.content,
          constituency: postData.constituency,
          constituencyName: postData.constituencyName,
          tags: postData.tags,
          updatedAt: new Date()
        });
        postId = editingPost.id;
        toast.success('Post updated successfully!');
      } else {
        // Create new post
        postId = await FirebaseService.createDiscussionPost(postData);
        toast.success(content.postCreated);
      }

      // Upload media files if any
      if (mediaFiles.length > 0) {
        const mediaPromises = mediaFiles.map(mediaFile => 
          FirebaseService.uploadMedia(mediaFile.file, currentUser.uid, postId)
        );
        
        const uploadedMedia = await Promise.all(mediaPromises);
        
        // Update post with media URLs
        await FirebaseService.updateDiscussionPost(postId, { media: uploadedMedia });
      }
      
      // Reset form
      setTitle('');
      setPostContent('');
      setSelectedConstituency(null);
      setConstituencySearchQuery('');
      setShowConstituencyDropdown(false);
      setTags([]);
      setMediaFiles([]);
      
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

  const moderateContent = async (text: string): Promise<{ status: 'published' | 'under_review'; reason?: string }> => {
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[95vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-[#014e5c] text-white px-6 py-5 rounded-t-2xl">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">{editingPost ? 'Edit Discussion Post' : content.title}</h2>
              <p className="text-white/80 mt-1 text-sm">{editingPost ? 'Update your discussion post' : content.subtitle}</p>
            </div>
            <button
              onClick={() => {
                // Clear editing state when closing
                if (editingPost) {
                  // Reset form to clear editing data
                  setTitle('');
                  setPostContent('');
                  setSelectedConstituency(null);
                  setConstituencySearchQuery('');
                  setTags([]);
                  setMediaFiles([]);
                }
                onClose();
              }}
              className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-all duration-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 max-h-[70vh] overflow-y-auto">
          {/* Title Section */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-[#014e5c] rounded-lg flex items-center justify-center">
                <Bold className="w-4 h-4 text-white" />
              </div>
              <div>
                <label htmlFor="title" className="block text-lg font-semibold text-[#014e5c]">
                  {content.postTitle}
                </label>
                <p className="text-sm text-[#014e5c]/70">Create an engaging title for your discussion</p>
              </div>
            </div>
            <div className="relative">
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={content.postTitlePlaceholder}
                className="w-full px-4 py-3 border-2 border-[#014e5c]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#014e5c]/20 focus:border-[#014e5c] text-base transition-all duration-200 bg-white hover:bg-[#014e5c]/5"
                maxLength={100}
                required
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#014e5c] animate-pulse"></div>
                  <span className="text-sm font-medium text-[#014e5c]/70">
                    {title.length}/100
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Constituency Selection */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-[#014e5c] rounded-lg flex items-center justify-center">
                <MapPin className="w-4 h-4 text-white" />
              </div>
              <div>
                <label htmlFor="constituency" className="block text-lg font-semibold text-[#014e5c]">
                  {content.constituency}
                </label>
                <p className="text-sm text-[#014e5c]/70">Select your constituency to target local discussions</p>
              </div>
            </div>
            <div className="relative">
              {selectedConstituency ? (
                <Check className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#014e5c] h-5 w-5" />
              ) : (
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#014e5c]/40 h-5 w-5" />
              )}
              <input
                ref={constituencyInputRef}
                type="text"
                id="constituency"
                value={constituencySearchQuery}
                onChange={handleConstituencySearch}
                onFocus={() => setShowConstituencyDropdown(true)}
                onKeyDown={handleKeyDown}
                placeholder={content.selectConstituency}
                className={`w-full pl-12 pr-12 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#014e5c]/20 focus:border-[#014e5c] text-base transition-all duration-200 ${
                  selectedConstituency 
                    ? 'border-[#014e5c] bg-[#014e5c]/5 text-[#014e5c]' 
                    : 'border-[#014e5c]/20 bg-white hover:bg-[#014e5c]/5 text-[#014e5c]'
                }`}
                required
              />
              
              {/* Clear button */}
              {constituencySearchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setConstituencySearchQuery('');
                    setSelectedConstituency(null);
                    setShowConstituencyDropdown(false);
                  }}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#014e5c]/60 hover:text-[#014e5c] transition-colors p-1 rounded-lg hover:bg-[#014e5c]/10"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            
            {/* Scrollable Constituency Dropdown */}
            {showConstituencyDropdown && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-[#014e5c]/20 rounded-lg shadow-xl max-h-64 overflow-y-auto z-50">
                <div className="p-2">
                  {filteredConstituencies.length > 0 ? (
                    filteredConstituencies.map(constituency => (
                      <button
                        key={constituency.id}
                        type="button"
                        onClick={() => handleConstituencySelect(constituency)}
                        className="w-full text-left px-3 py-2 hover:bg-[#014e5c]/10 rounded-md transition-colors mb-1 last:mb-0"
                      >
                        <div className="font-medium text-[#014e5c]">{constituency.name}</div>
                        {constituency.district && (
                          <div className="text-sm text-[#014e5c]/70">{constituency.district}</div>
                        )}
                      </button>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-[#014e5c]/70 text-center">
                      {isEnglish ? 'No constituencies found' : 'कोई निर्वाचन क्षेत्र नहीं मिला'}
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Help text */}
            <div className="mt-2 text-sm text-[#014e5c]/70">
              {isEnglish 
                ? 'Type to search for your constituency by name, area, or district' 
                : 'अपने निर्वाचन क्षेत्र को नाम, क्षेत्र या जिले से खोजने के लिए टाइप करें'
              }
            </div>
            
            {/* Selected constituency confirmation */}
            {selectedConstituency && (
              <div className="mt-2 text-sm text-[#014e5c] font-medium">
                {isEnglish 
                  ? '✓ Constituency selected successfully' 
                  : '✓ निर्वाचन क्षेत्र सफलतापूर्वक चुना गया'
                }
              </div>
            )}
          </div>

          {/* Tags */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-[#014e5c] rounded-lg flex items-center justify-center">
                <List className="w-4 h-4 text-white" />
              </div>
              <div>
                <label className="block text-base font-semibold text-[#014e5c]">
                  {content.tags}
                </label>
                <p className="text-xs text-[#014e5c]/70">Add relevant tags to help others discover your post</p>
              </div>
            </div>
            
            {/* Tag Suggestions */}
            <div className="mb-3">
              <p className="text-xs text-[#014e5c]/70 mb-2">Popular tags:</p>
              <div className="flex flex-wrap gap-2">
                {['roads', 'education', 'healthcare', 'water', 'electricity', 'transport'].map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => {
                      if (!tags.includes(suggestion) && tags.length < 5) {
                        setTags([...tags, suggestion]);
                      }
                    }}
                    disabled={tags.includes(suggestion) || tags.length >= 5}
                    className={`px-2 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
                      tags.includes(suggestion)
                        ? 'bg-[#014e5c]/20 text-[#014e5c] cursor-not-allowed'
                        : 'bg-[#014e5c]/10 text-[#014e5c]/80 hover:bg-[#014e5c]/20 hover:text-[#014e5c]'
                    }`}
                  >
                    #{suggestion}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2 mb-3">
              {tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1.5 bg-[#014e5c]/10 text-[#014e5c] rounded-full text-xs font-medium shadow-sm border border-[#014e5c]/20"
                >
                  <span className="mr-1.5">#{tag}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="w-4 h-4 rounded-full bg-[#014e5c]/20 hover:bg-[#014e5c]/30 transition-colors flex items-center justify-center"
                  >
                    <X className="h-2.5 w-2.5 text-[#014e5c]" />
                  </button>
                </span>
              ))}
            </div>
            
            {tags.length < 5 && (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder={content.tagPlaceholder}
                  className="flex-1 px-3 py-2 border-2 border-[#014e5c]/20 rounded-md focus:outline-none focus:ring-2 focus:ring-[#014e5c]/20 focus:border-[#014e5c] transition-all duration-200 text-sm"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="px-4 py-2 bg-[#014e5c] text-white rounded-md hover:bg-[#014e5c]/90 transition-all duration-200 flex items-center gap-2 font-medium shadow-md hover:shadow-lg text-sm"
                >
                  <Plus className="h-3 w-3" />
                  {content.addTag}
                </button>
              </div>
            )}
            
            <div className="mt-2 text-xs text-[#014e5c]/60">
              {tags.length}/5 tags • Tags help categorize your discussion
            </div>
          </div>
          {/* Media Upload */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-[#014e5c] rounded-lg flex items-center justify-center">
                <Upload className="w-4 h-4 text-white" />
              </div>
              <div>
                <label className="block text-base font-semibold text-[#014e5c]">
                  {content.media}
                </label>
                <p className="text-xs text-[#014e5c]/70">Add images or videos to make your post more engaging</p>
              </div>
            </div>
            
            {/* Media Preview Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
              {mediaFiles.map((media, index) => (
                <div key={index} className="relative group aspect-square">
                  {media.type === 'image' ? (
                    <img
                      src={media.preview}
                      alt="Preview"
                      className="w-full h-full object-cover rounded-lg shadow-md"
                    />
                  ) : (
                    <video
                      src={media.preview}
                      className="w-full h-full object-cover rounded-lg shadow-md"
                    />
                  )}
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                    <button
                      type="button"
                      onClick={() => handleRemoveMedia(index)}
                      className="w-8 h-8 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors flex items-center justify-center shadow-md"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="absolute top-2 left-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium text-white ${
                      media.type === 'image' ? 'bg-[#014e5c]' : 'bg-[#014e5c]/80'
                    }`}>
                      {media.type === 'image' ? 'Image' : 'Video'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            
            {mediaFiles.length < 3 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed border-[#014e5c]/30 rounded-lg hover:border-[#014e5c] hover:bg-[#014e5c]/5 transition-all duration-200 group"
                >
                  <div className="w-12 h-12 bg-[#014e5c]/10 rounded-lg flex items-center justify-center group-hover:bg-[#014e5c]/20 transition-all duration-200">
                    <Upload className="h-6 w-6 text-[#014e5c]" />
                  </div>
                  <div className="text-center">
                    <p className="font-medium text-[#014e5c] text-sm">{content.uploadImage}</p>
                    <p className="text-xs text-[#014e5c]/70">JPG, PNG up to 10MB</p>
                  </div>
                </button>
                
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed border-[#014e5c]/30 rounded-lg hover:border-[#014e5c] hover:bg-[#014e5c]/5 transition-all duration-200 group"
                >
                  <div className="w-12 h-12 bg-[#014e5c]/10 rounded-lg flex items-center justify-center group-hover:bg-[#014e5c]/20 transition-all duration-200">
                    <Video className="h-6 w-6 text-[#014e5c]" />
                  </div>
                  <div className="text-center">
                    <p className="font-medium text-[#014e5c] text-sm">{content.uploadVideo}</p>
                    <p className="text-xs text-[#014e5c]/70">MP4, MOV up to 10MB</p>
                  </div>
                </button>
              </div>
            )}
            
            <div className="mt-3 text-xs text-[#014e5c]/60 text-center">
              {mediaFiles.length}/3 files • Drag and drop files here or click to browse
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              multiple
              onChange={handleMediaUpload}
              className="hidden"
            />
          </div>

          {/* Content with Rich Text Tools */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-[#014e5c] rounded-lg flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-white" />
              </div>
              <div>
                <label htmlFor="content" className="block text-base font-semibold text-[#014e5c]">
                  {content.postContent}
                </label>
                <p className="text-xs text-[#014e5c]/70">Share your thoughts, questions, or concerns with your community</p>
              </div>
            </div>
            
            {/* Enhanced Rich Text Toolbar */}
            <div className="bg-white border-2 border-[#014e5c]/20 rounded-lg overflow-hidden shadow-sm">
              <div className="flex items-center justify-between p-3 bg-[#014e5c]/5 border-b border-[#014e5c]/20">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleTextFormat('bold')}
                    className="p-1.5 hover:bg-[#014e5c]/20 rounded-md transition-colors group"
                    title="Bold"
                  >
                    <Bold className="h-3.5 w-3.5 text-[#014e5c] group-hover:text-[#014e5c]" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTextFormat('italic')}
                    className="p-1.5 hover:bg-[#014e5c]/20 rounded-md transition-colors group"
                    title="Italic"
                  >
                    <Italic className="h-3.5 w-3.5 text-[#014e5c] group-hover:text-[#014e5c]" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTextFormat('underline')}
                    className="p-1.5 hover:bg-[#014e5c]/20 rounded-md transition-colors group"
                    title="Underline"
                  >
                    <Underline className="h-3.5 w-3.5 text-[#014e5c] group-hover:text-[#014e5c]" />
                  </button>
                </div>
                
                <div className="w-px h-5 bg-[#014e5c]/30"></div>
                
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleTextFormat('bullet')}
                    className="p-1.5 hover:bg-[#014e5c]/20 rounded-md transition-colors group"
                    title="Bullet List"
                  >
                    <List className="h-3.5 w-3.5 text-[#014e5c] group-hover:text-[#014e5c]" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTextFormat('numbered')}
                    className="p-1.5 hover:bg-[#014e5c]/20 rounded-md transition-colors group"
                    title="Numbered List"
                  >
                    <ListOrdered className="h-3.5 w-3.5 text-[#014e5c] group-hover:text-[#014e5c]" />
                  </button>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowPreview(!showPreview)}
                    className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                      showPreview 
                        ? 'bg-[#014e5c] text-white' 
                        : 'bg-[#014e5c]/10 text-[#014e5c] hover:bg-[#014e5c]/20'
                    }`}
                  >
                    {showPreview ? 'Edit' : 'Preview'}
                  </button>
                  <div className="text-xs text-[#014e5c]/70 font-medium">
                    Rich Text Editor
                  </div>
                </div>
              </div>
              
              {showPreview ? (
                <div className="w-full px-4 py-4 border-0 text-base bg-white min-h-[200px]">
                  <div 
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: renderFormattedText(postContent) || '<span class="text-gray-400">No content to preview</span>' }}
                  />
                </div>
              ) : (
                <textarea
                  id="content"
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  placeholder={content.postContentPlaceholder}
                  rows={8}
                  className="w-full px-4 py-4 border-0 focus:outline-none text-base resize-none transition-all duration-200 bg-white"
                  maxLength={2000}
                  required
                />
              )}
            </div>
            
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-3 text-xs text-[#014e5c]/70">
                <span>💡 Tip: Use formatting tools above to style your text</span>
                <span>📝 {postContent.length}/2000 characters</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#014e5c] animate-pulse"></div>
                <span className="text-xs text-[#014e5c] font-medium">Auto-saving...</span>
              </div>
            </div>
          </div>

          {/* Guidelines */}
          <div className="mb-6 p-4 bg-[#014e5c]/5 rounded-lg border border-[#014e5c]/20 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-[#014e5c] rounded-lg flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-base text-[#014e5c] mb-2">{content.guidelines}</h4>
                <p className="text-[#014e5c]/80 text-sm leading-relaxed mb-3">{content.guidelinesText}</p>
                
                {/* Quick Tips */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                  <div className="flex items-center gap-2 text-xs text-[#014e5c]/80">
                    <div className="w-1.5 h-1.5 bg-[#014e5c] rounded-full"></div>
                    <span>Keep discussions respectful and constructive</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[#014e5c]/80">
                    <div className="w-1.5 h-1.5 bg-[#014e5c] rounded-full"></div>
                    <span>Focus on local community issues</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[#014e5c]/80">
                    <div className="w-1.5 h-1.5 bg-[#014e5c] rounded-full"></div>
                    <span>Use clear and descriptive titles</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[#014e5c]/80">
                    <div className="w-1.5 h-1.5 bg-[#014e5c] rounded-full"></div>
                    <span>Add relevant tags for better discovery</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-[#014e5c]/20">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 border-2 border-[#014e5c]/30 text-[#014e5c] rounded-lg hover:bg-[#014e5c]/10 transition-all duration-200 font-medium text-sm"
            >
              {content.cancel}
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim() || !postContent.trim() || !selectedConstituency}
              className="px-6 py-2.5 bg-[#014e5c] text-white rounded-lg hover:bg-[#014e5c]/90 transition-all duration-200 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-md hover:shadow-lg"
            >
              {isSubmitting ? (
                <>
                  <Loader className="h-4 w-4 animate-spin" />
                  {editingPost ? 'Updating...' : 'Sharing...'}
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  {editingPost ? 'Update Post' : content.createPost}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePost;
