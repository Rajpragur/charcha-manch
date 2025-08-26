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

const CreatePost: React.FC<CreatePostProps> = ({ isOpen, onClose, onPostCreated }) => {
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

      // Create the post first to get the ID
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

      const postId = await FirebaseService.createDiscussionPost(postData);

      // Upload media files if any
      if (mediaFiles.length > 0) {
        const mediaPromises = mediaFiles.map(mediaFile => 
          FirebaseService.uploadMedia(mediaFile.file, currentUser.uid, postId)
        );
        
        const uploadedMedia = await Promise.all(mediaPromises);
        
        // Update post with media URLs
        await FirebaseService.updateDiscussionPost(postId, { media: uploadedMedia });
      }

      toast.success(content.postCreated);
      
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[95vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-sky-500 to-blue-600 text-white px-8 py-6 rounded-t-3xl">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-bold">{content.title}</h2>
              <p className="text-sky-100 mt-2 text-lg">{content.subtitle}</p>
            </div>
            <button
              onClick={onClose}
              className="p-3 text-white/80 hover:text-white hover:bg-white/20 rounded-full transition-all duration-200"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 lg:px-8 py-6 max-h-[70vh] overflow-y-auto">
          {/* Title Section */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-[#014e5c] to-[#004030] rounded-xl flex items-center justify-center">
                <Bold className="w-5 h-5 text-white" />
              </div>
              <div>
                <label htmlFor="title" className="block text-xl font-bold text-gray-900">
                  {content.postTitle}
                </label>
                <p className="text-sm text-gray-600">Create an engaging title for your discussion</p>
              </div>
            </div>
            <div className="relative">
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={content.postTitlePlaceholder}
                className="w-full px-6 py-5 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-green-100 focus:border-green-500 text-lg transition-all duration-300 bg-gray-50 hover:bg-white"
                maxLength={100}
                required
              />
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                  <span className="text-sm font-medium text-gray-500">
                    {title.length}/100
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Constituency Selection */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-[#014e5c] to-[#004030] rounded-xl flex items-center justify-center">
                <MapPin className="w-5 h-5 text-white" />
              </div>
              <div>
                <label htmlFor="constituency" className="block text-xl font-bold text-gray-900">
                  {content.constituency}
                </label>
                <p className="text-sm text-gray-600">Select your constituency to target local discussions</p>
              </div>
            </div>
            <div className="relative">
              {selectedConstituency ? (
                <Check className="absolute left-4 top-1/2 transform -translate-y-1/2 text-green-500 h-6 w-6" />
              ) : (
                <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-6 w-6" />
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
                className={`w-full pl-14 pr-12 py-5 border-2 rounded-2xl focus:outline-none focus:ring-4 focus:ring-green-100 focus:border-green-500 text-lg transition-all duration-300 ${
                  selectedConstituency 
                    ? 'border-green-500 bg-green-50 text-green-900' 
                    : 'border-gray-200 bg-gray-50 hover:bg-white text-gray-900'
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
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
            
            {/* Scrollable Constituency Dropdown */}
            {showConstituencyDropdown && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-xl max-h-64 overflow-y-auto z-50">
                <div className="p-2">
                  {filteredConstituencies.length > 0 ? (
                    filteredConstituencies.map(constituency => (
                      <button
                        key={constituency.id}
                        type="button"
                        onClick={() => handleConstituencySelect(constituency)}
                        className="w-full text-left px-4 py-3 hover:bg-green-50 rounded-lg transition-colors mb-1 last:mb-0"
                      >
                        <div className="font-medium text-gray-900">{constituency.name}</div>
                        {constituency.district && (
                          <div className="text-sm text-gray-500">{constituency.district}</div>
                        )}
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-gray-500 text-center">
                      {isEnglish ? 'No constituencies found' : 'कोई निर्वाचन क्षेत्र नहीं मिला'}
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Help text */}
            <div className="mt-2 text-sm text-gray-600">
              {isEnglish 
                ? 'Type to search for your constituency by name, area, or district' 
                : 'अपने निर्वाचन क्षेत्र को नाम, क्षेत्र या जिले से खोजने के लिए टाइप करें'
              }
            </div>
            
            {/* Selected constituency confirmation */}
            {selectedConstituency && (
              <div className="mt-2 text-sm text-green-600 font-medium">
                {isEnglish 
                  ? '✓ Constituency selected successfully' 
                  : '✓ निर्वाचन क्षेत्र सफलतापूर्वक चुना गया'
                }
              </div>
            )}
          </div>

          {/* Tags */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-[#014e5c] to-[#004030] rounded-xl flex items-center justify-center">
                <List className="w-5 h-5 text-white" />
              </div>
              <div>
                <label className="block text-xl font-bold text-gray-900">
                  {content.tags}
                </label>
                <p className="text-sm text-gray-600">Add relevant tags to help others discover your post</p>
              </div>
            </div>
            
            {/* Tag Suggestions */}
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-3">Popular tags:</p>
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
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      tags.includes(suggestion)
                        ? 'bg-green-100 text-green-700 cursor-not-allowed'
                        : 'bg-gray-100 text-gray-700 hover:bg-green-100 hover:text-green-700'
                    }`}
                  >
                    #{suggestion}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2 mb-4">
              {tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 rounded-full text-sm font-medium shadow-sm border border-green-200"
                >
                  <span className="mr-2">#{tag}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="w-5 h-5 rounded-full bg-green-200 hover:bg-green-300 transition-colors flex items-center justify-center"
                  >
                    <X className="h-3 w-3 text-green-700" />
                  </button>
                </span>
              ))}
            </div>
            
            {tags.length < 5 && (
              <div className="flex gap-3">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder={content.tagPlaceholder}
                  className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-100 focus:border-green-500 transition-all duration-200"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all duration-200 flex items-center gap-2 font-medium shadow-lg hover:shadow-xl"
                >
                  <Plus className="h-4 w-4" />
                  {content.addTag}
                </button>
              </div>
            )}
            
            <div className="mt-3 text-sm text-gray-500">
              {tags.length}/5 tags • Tags help categorize your discussion
            </div>
          </div>
          {/* Media Upload */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-[#014e5c] to-[#004030] rounded-xl flex items-center justify-center">
                <Upload className="w-5 h-5 text-white" />
              </div>
              <div>
                <label className="block text-xl font-bold text-gray-900">
                  {content.media}
                </label>
                <p className="text-sm text-gray-600">Add images or videos to make your post more engaging</p>
              </div>
            </div>
            
            {/* Media Preview Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {mediaFiles.map((media, index) => (
                <div key={index} className="relative group aspect-square">
                  {media.type === 'image' ? (
                    <img
                      src={media.preview}
                      alt="Preview"
                      className="w-full h-full object-cover rounded-2xl shadow-lg"
                    />
                  ) : (
                    <video
                      src={media.preview}
                      className="w-full h-full object-cover rounded-2xl shadow-lg"
                    />
                  )}
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex items-center justify-center">
                    <button
                      type="button"
                      onClick={() => handleRemoveMedia(index)}
                      className="w-10 h-10 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors flex items-center justify-center shadow-lg"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="absolute top-3 left-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium text-white ${
                      media.type === 'image' ? 'bg-blue-500' : 'bg-purple-500'
                    }`}>
                      {media.type === 'image' ? 'Image' : 'Video'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            
            {mediaFiles.length < 3 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed border-gray-300 rounded-2xl hover:border-green-400 hover:bg-green-50 transition-all duration-300 group"
                >
                  <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-emerald-100 rounded-2xl flex items-center justify-center group-hover:from-green-200 group-hover:to-emerald-200 transition-all duration-300">
                    <Upload className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="text-center">
                    <p className="font-medium text-gray-900">{content.uploadImage}</p>
                    <p className="text-sm text-gray-500">JPG, PNG up to 10MB</p>
                  </div>
                </button>
                
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed border-gray-300 rounded-2xl hover:border-green-400 hover:bg-green-50 transition-all duration-300 group"
                >
                  <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-emerald-100 rounded-2xl flex items-center justify-center group-hover:from-green-200 group-hover:to-emerald-200 transition-all duration-300">
                    <Video className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="text-center">
                    <p className="font-medium text-gray-900">{content.uploadVideo}</p>
                    <p className="text-sm text-gray-500">MP4, MOV up to 10MB</p>
                  </div>
                </button>
              </div>
            )}
            
            <div className="mt-4 text-sm text-gray-500 text-center">
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
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-[#014e5c] to-[#004030] rounded-xl flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
              <div>
                <label htmlFor="content" className="block text-xl font-bold text-gray-900">
                  {content.postContent}
                </label>
                <p className="text-sm text-gray-600">Share your thoughts, questions, or concerns with your community</p>
              </div>
            </div>
            
            {/* Enhanced Rich Text Toolbar */}
            <div className="bg-white border-2 border-gray-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-green-50 border-b border-gray-200">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleTextFormat('bold')}
                    className="p-2 hover:bg-green-100 rounded-lg transition-colors group"
                    title="Bold"
                  >
                    <Bold className="h-4 w-4 text-gray-700 group-hover:text-green-700" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTextFormat('italic')}
                    className="p-2 hover:bg-green-100 rounded-lg transition-colors group"
                    title="Italic"
                  >
                    <Italic className="h-4 w-4 text-gray-700 group-hover:text-green-700" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTextFormat('underline')}
                    className="p-2 hover:bg-green-100 rounded-lg transition-colors group"
                    title="Underline"
                  >
                    <Underline className="h-4 w-4 text-gray-700 group-hover:text-green-700" />
                  </button>
                </div>
                
                <div className="w-px h-6 bg-gray-300"></div>
                
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleTextFormat('bullet')}
                    className="p-2 hover:bg-green-100 rounded-lg transition-colors group"
                    title="Bullet List"
                  >
                    <List className="h-4 w-4 text-gray-700 group-hover:text-green-700" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTextFormat('numbered')}
                    className="p-2 hover:bg-green-100 rounded-lg transition-colors group"
                    title="Numbered List"
                  >
                    <ListOrdered className="h-4 w-4 text-gray-700 group-hover:text-green-700" />
                  </button>
                </div>
                
                <div className="text-sm text-gray-500 font-medium">
                  Rich Text Editor
                </div>
              </div>
              
              <textarea
                id="content"
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
                placeholder={content.postContentPlaceholder}
                rows={10}
                className="w-full px-6 py-6 border-0 focus:outline-none text-lg resize-none transition-all duration-200 bg-white"
                maxLength={2000}
                required
              />
            </div>
            
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span>💡 Tip: Use formatting tools above to style your text</span>
                <span>📝 {postContent.length}/2000 characters</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse"></div>
                <span className="text-sm text-green-600 font-medium">Auto-saving...</span>
              </div>
            </div>
          </div>

          {/* Guidelines */}
          <div className="mb-8 p-6 bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 rounded-2xl border border-green-200 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-xl text-green-900 mb-3">{content.guidelines}</h4>
                <p className="text-green-800 text-base leading-relaxed mb-4">{content.guidelinesText}</p>
                
                {/* Quick Tips */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 text-sm text-green-700">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Keep discussions respectful and constructive</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-green-700">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Focus on local community issues</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-green-700">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Use clear and descriptive titles</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-green-700">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Add relevant tags for better discovery</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 font-semibold text-lg"
            >
              {content.cancel}
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim() || !postContent.trim() || !selectedConstituency}
              className="px-8 py-4 bg-[#014e5c] text-white rounded-xl hover:bg-[#013a47] transition-all duration-200 font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 shadow-lg hover:shadow-xl"
            >
              {isSubmitting ? (
                <>
                  <Loader className="h-5 w-5 animate-spin" />
                  Sharing...
                </>
              ) : (
                <>
                  <Upload className="h-5 w-5" />
                  {content.createPost}
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
