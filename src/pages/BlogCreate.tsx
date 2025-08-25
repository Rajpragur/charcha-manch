import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useAdmin } from '../contexts/AdminContext';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../configs/firebase';
import { 
  ArrowLeft, 
  Save, 
  Eye, 
  FileText, 
  Image as ImageIcon,
  Loader,
  CheckCircle,
  AlertCircle,
  Info,
  Sparkles,
  Calendar,
  User,
  Globe,
  Clock,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Upload,
  Tag,
  Trash2
} from 'lucide-react';

interface Blog {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  author: string;
  authorId: string;
  createdAt: any; // Allow both Date and FieldValue for Firebase compatibility
  updatedAt: any; // Allow both Date and FieldValue for Firebase compatibility
  status: 'draft' | 'published' | 'archived';
  imageUrl?: string;
  slug: string;
  category?: string;
  featured?: boolean;
}

const BlogCreate: React.FC = () => {
  const navigate = useNavigate();
  const { blogId } = useParams<{ blogId: string }>();
  const { currentUser } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  
  const [blog, setBlog] = useState<Partial<Blog>>({
    title: '',
    content: '',
    excerpt: '',
    status: 'draft',
    imageUrl: '',
    category: '',
    featured: false
  });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [autoSave, setAutoSave] = useState(true);
  const [wordCount, setWordCount] = useState(0);
  const [readingTime, setReadingTime] = useState(0);
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
    image: false,
    category: false,
    status: false
  });

  const isEditing = !!blogId;

  // Auto-save functionality
  useEffect(() => {
    if (!autoSave || !blog.title || !blog.content) return;
    
    const timer = setTimeout(() => {
      if (blog.title && blog.content) {
        handleAutoSave();
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [blog.title, blog.content, autoSave]);

  // Calculate word count and reading time
  useEffect(() => {
    if (blog.content) {
      const words = blog.content.trim().split(/\s+/).filter(word => word.length > 0);
      setWordCount(words.length);
      setReadingTime(Math.ceil(words.length / 200)); // Average reading speed: 200 words per minute
    } else {
      setWordCount(0);
      setReadingTime(0);
    }
  }, [blog.content]);

  useEffect(() => {
    if (adminLoading) return;
    
    if (!isAdmin) {
      navigate('/');
      return;
    }

    if (isEditing && blogId) {
      loadBlog(blogId);
    }
  }, [adminLoading, isAdmin, isEditing, blogId, navigate]);

  const loadBlog = async (id: string) => {
    try {
      setIsLoading(true);
      const blogDoc = await getDoc(doc(db, 'blogs', id));
      
      if (blogDoc.exists()) {
        const blogData = blogDoc.data();
        setBlog({
          id: blogDoc.id,
          title: blogData.title || '',
          content: blogData.content || '',
          excerpt: blogData.excerpt || '',
          category: blogData.category || '',
          featured: blogData.featured || false,
          status: blogData.status || 'draft',
          imageUrl: blogData.imageUrl || '',
          slug: blogData.slug || '',
          author: blogData.author || '',
          authorId: blogData.authorId || '',
          createdAt: blogData.createdAt?.toDate() || new Date(),
          updatedAt: blogData.updatedAt?.toDate() || new Date()
        });
      }
    } catch (error) {
      console.error('Error loading blog:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = (): boolean => {
    console.log('Validating form with data:', blog);
    const newErrors: Record<string, string> = {};
    
    if (!blog.title?.trim()) {
      newErrors.title = 'Title is required';
      console.log('Title validation failed');
    }
    
    if (!blog.content?.trim()) {
      newErrors.content = 'Content is required';
      console.log('Content validation failed');
    }
    
    if (!blog.excerpt?.trim()) {
      newErrors.excerpt = 'Excerpt is required';
      console.log('Excerpt validation failed');
    }
    
    if (blog.content && blog.content.length < 50) {
      newErrors.content = 'Content must be at least 50 characters';
      console.log('Content length validation failed:', blog.content.length);
    }
    
    if (!blog.category?.trim()) {
      newErrors.category = 'Category is required';
      console.log('Category validation failed');
    }
    
    console.log('Validation errors:', newErrors);
    setErrors(newErrors);
    const isValid = Object.keys(newErrors).length === 0;
    console.log('Form is valid:', isValid);
    return isValid;
  };

  const generateSlug = (title: string): string => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .replace(/\s+/g, '-');
  };

  // Handle image selection
  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle content change with proper line breaks
  const handleContentChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = event.target.value;
    setBlog(prev => ({ ...prev, content: value }));
  };



  const handleAutoSave = async () => {
    if (!blog.title || !blog.content) return;
    
    try {
      const blogData = {
        ...blog,
        status: 'draft',
        updatedAt: serverTimestamp(),
        author: currentUser?.displayName || currentUser?.email || 'Admin',
        authorId: currentUser?.uid || '',
        slug: generateSlug(blog.title || '')
      };
      
      if (!isEditing) {
        blogData.createdAt = serverTimestamp();
        blogData.id = `blog_${Date.now()}`;
      }
      
      const docRef = doc(db, 'blogs', isEditing ? blogId! : blogData.id!);
      await setDoc(docRef, blogData, { merge: true });
    } catch (error) {
      console.error('Auto-save failed:', error);
    }
  };

  const handleSave = async (status: 'draft' | 'published') => {
    console.log('handleSave called with status:', status);
    console.log('Validating form...');
    
    if (!validateForm()) {
      console.log('Form validation failed');
      return;
    }
    
    console.log('Form validation passed, proceeding to save...');
    
    try {
      setIsSaving(true);
      
      const blogData = {
        ...blog,
        status,
        updatedAt: serverTimestamp(),
        author: currentUser?.displayName || currentUser?.email || 'Admin',
        authorId: currentUser?.uid || '',
        slug: generateSlug(blog.title || '')
      };
      
      if (!isEditing) {
        blogData.createdAt = serverTimestamp();
        blogData.id = `blog_${Date.now()}`;
      }
      
      const docRef = doc(db, 'blogs', isEditing ? blogId! : blogData.id!);
      await setDoc(docRef, blogData, { merge: true });
      
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      
      if (status === 'published') {
        navigate('/admin?tab=blogs');
      } else {
        setBlog(prev => ({ ...prev, status: 'draft' }));
      }
      
    } catch (error) {
      console.error('Error saving blog:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = () => {
    console.log('Publish button clicked');
    console.log('Current blog data:', blog);
    handleSave('published');
  };
  const handleSaveDraft = () => {
    console.log('Save draft button clicked');
    handleSave('draft');
  };

  const handleDelete = async () => {
    if (!isEditing || !blogId) {
      alert('Can only delete existing blogs');
      return;
    }

    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    try {
      setIsSaving(true);
      
      // Import deleteDoc from Firebase
      const { deleteDoc } = await import('firebase/firestore');
      
      // Delete the blog document
      const blogRef = doc(db, 'blogs', blogId!);
      await deleteDoc(blogRef);
      
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      
      // Navigate back to blogs list
      setTimeout(() => {
        navigate('/admin?tab=blogs');
      }, 1000);
    } catch (error) {
      console.error('Error deleting blog:', error);
      alert('Error deleting blog. Please try again.');
    } finally {
      setIsSaving(false);
      setShowDeleteConfirm(false);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  const toggleSection = (section: string) => {
    setCollapsedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  if (adminLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center bg-white rounded-2xl p-8 shadow-xl">
          <div className="relative">
            <Loader className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-6" />
            <div className="absolute inset-0 bg-blue-600 rounded-full opacity-20 animate-ping"></div>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Loading your workspace...</h2>
          <p className="text-gray-600">Setting up everything you need to create amazing content</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center">
        <div className="text-center bg-white rounded-2xl p-8 shadow-xl max-w-md">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-6">You don't have permission to access this page.</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Success Toast */}
      {showSuccess && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in">
          <div className="bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg flex items-center space-x-3">
            <CheckCircle className="h-5 w-5" />
            <span className="font-medium">Blog saved successfully!</span>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md mx-4 shadow-2xl">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Blog</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete "{blog.title || 'this blog'}"? 
                <br />
                <span className="font-medium text-red-600">This action cannot be undone.</span>
              </p>
              
              <div className="flex space-x-3">
                <button
                  onClick={cancelDelete}
                  disabled={isSaving}
                  className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-medium hover:border-gray-400 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={isSaving}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center"
                >
                  {isSaving ? (
                    <Loader className="animate-spin h-4 w-4 mr-2" />
                  ) : (
                    <Trash2 className="h-4 w-4 mr-2" />
                  )}
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/admin?tab=blogs')}
                className="mr-4 p-3 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all duration-200"
                title="Back to blogs"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {isEditing ? 'Edit Blog' : 'Create New Blog'}
                </h1>
                <p className="text-gray-500 flex items-center mt-1">
                  <Sparkles className="h-4 w-4 mr-2 text-yellow-500" />
                  {isEditing ? 'Update your blog post' : 'Write a new blog post for your audience'}
                </p>
              </div>
            </div>
            
            <div className="flex space-x-3">
              {/* Auto-save toggle */}
              <div className="flex items-center space-x-2 mr-4">
                <input
                  type="checkbox"
                  id="autoSave"
                  checked={autoSave}
                  onChange={(e) => setAutoSave(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <label htmlFor="autoSave" className="text-sm text-gray-600">
                  Auto-save
                </label>
              </div>

              <button
                onClick={() => setPreviewMode(!previewMode)}
                className={`px-6 py-3 border-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  previewMode 
                    ? 'bg-blue-50 border-blue-200 text-blue-700' 
                    : 'bg-white border-gray-300 text-gray-700 hover:border-blue-300 hover:text-blue-700'
                }`}
              >
                <Eye className="h-4 w-4 inline mr-2" />
                {previewMode ? 'Edit' : 'Preview'}
              </button>
              
              <button
                onClick={handleSaveDraft}
                disabled={isSaving}
                className="px-6 py-3 border-2 border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:border-blue-300 hover:text-blue-700 disabled:opacity-50 transition-all duration-200 flex items-center"
              >
                {isSaving ? (
                  <Loader className="animate-spin h-4 w-4 mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Draft
              </button>
              
              <button
                onClick={() => {
                  alert('Publish button clicked!');
                  handlePublish();
                }}
                disabled={isSaving}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl text-sm font-medium hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center"
              >
                {isSaving ? (
                  <Loader className="animate-spin h-4 w-4 mr-2" />
                ) : (
                  <FileText className="h-4 w-4 mr-2" />
                )}
                {isEditing ? 'Update' : 'Publish'}
              </button>
              
              {/* Delete Button - Only show when editing existing blog */}
              {isEditing && (
                <button
                  onClick={handleDelete}
                  disabled={isSaving}
                  className="px-6 py-3 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center"
                >
                  {isSaving ? (
                    <Loader className="animate-spin h-4 w-4 mr-2" />
                  ) : (
                    <Trash2 className="h-4 w-4 mr-2" />
                  )}
                  Delete Blog
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {previewMode ? (
          /* Preview Mode */
          <div className="bg-white shadow-xl rounded-2xl p-8">
            <div className="max-w-4xl mx-auto">
              {/* Preview Header */}
              <div className="border-b border-gray-200 pb-6 mb-8">
                <h1 className="text-5xl font-bold text-gray-900 mb-4 leading-tight">
                  {blog.title || 'Untitled Blog'}
                </h1>
                
                {blog.excerpt && (
                  <p className="text-xl text-gray-600 mb-4 italic leading-relaxed">{blog.excerpt}</p>
                )}
                
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center">
                    <User className="h-4 w-4 mr-2" />
                    {blog.author || 'Admin'}
                  </div>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    {new Date().toLocaleDateString()}
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    {readingTime} min read
                  </div>
                  <div className="flex items-center">
                    <BookOpen className="h-4 w-4 mr-2" />
                    {wordCount} words
                  </div>
                </div>
                

              </div>
              
              <div className="prose prose-lg max-w-none">
                {blog.content ? (
                  <div className="text-gray-800 leading-relaxed text-lg whitespace-pre-wrap">
                    {blog.content}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">No content yet...</p>
                    <p className="text-gray-400">Switch to edit mode to start writing</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Edit Mode */
          <div className="space-y-6">
            {/* Title Section */}
            <div className="bg-white shadow-lg rounded-2xl p-8 border border-gray-100">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center mr-4">
                  <FileText className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <label htmlFor="title" className="block text-lg font-semibold text-gray-800">
                    Blog Title *
                  </label>
                  <p className="text-sm text-gray-500">Make it catchy and descriptive</p>
                </div>
              </div>
              
              <input
                type="text"
                id="title"
                value={blog.title || ''}
                onChange={(e) => setBlog(prev => ({ ...prev, title: e.target.value }))}
                className={`w-full px-4 py-4 text-xl border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all duration-200 ${
                  errors.title ? 'border-red-300 focus:ring-red-100' : 'border-gray-200 focus:border-blue-400'
                }`}
                placeholder="Enter your blog title here..."
              />
              {errors.title && (
                <div className="flex items-center mt-3 text-red-600">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  <span className="text-sm">{errors.title}</span>
                </div>
              )}
              
              {/* Character count */}
              <div className="flex justify-between items-center mt-3">
                <span className="text-sm text-gray-500">
                  {blog.title?.length || 0} characters
                </span>
                <span className="text-sm text-gray-400">
                  Recommended: 50-60 characters
                </span>
              </div>
            </div>

            {/* Excerpt Section */}
            <div className="bg-white shadow-lg rounded-2xl p-8 border border-gray-100">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center mr-4">
                  <Info className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <label htmlFor="excerpt" className="block text-lg font-semibold text-gray-800">
                    Blog Excerpt *
                  </label>
                  <p className="text-sm text-gray-500">A brief summary that appears in previews</p>
                </div>
              </div>
              
              <textarea
                id="excerpt"
                value={blog.excerpt || ''}
                onChange={(e) => setBlog(prev => ({ ...prev, excerpt: e.target.value }))}
                rows={3}
                className={`w-full px-4 py-4 text-lg border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-100 transition-all duration-200 resize-none ${
                  errors.excerpt ? 'border-red-300 focus:ring-red-100' : 'border-gray-200 focus:border-green-400'
                }`}
                placeholder="Write a compelling summary of your blog post..."
              />
              {errors.excerpt && (
                <div className="flex items-center mt-3 text-red-600">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  <span className="text-sm">{errors.excerpt}</span>
                </div>
              )}
              
              <div className="flex justify-between items-center mt-3">
                <span className="text-sm text-gray-500">
                  {blog.excerpt?.length || 0} characters
                </span>
                <span className="text-sm text-gray-400">
                  Recommended: 120-160 characters
                </span>
              </div>
            </div>

            {/* Content Section */}
            <div className="bg-white shadow-lg rounded-2xl p-8 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center mr-4">
                    <BookOpen className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <label htmlFor="content" className="block text-lg font-semibold text-gray-800">
                      Blog Content *
                    </label>
                    <p className="text-sm text-gray-500">Write your main content here</p>
                  </div>
                </div>
                
                {/* Content Stats */}
                <div className="flex space-x-4 text-sm">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{wordCount}</div>
                    <div className="text-gray-500">Words</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{readingTime}</div>
                    <div className="text-gray-500">Min read</div>
                  </div>
                </div>
              </div>
              
              <textarea
                id="content"
                value={blog.content || ''}
                onChange={handleContentChange}
                rows={20}
                className={`w-full px-4 py-4 text-lg border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-purple-100 transition-all duration-200 font-mono resize-none ${
                  errors.content ? 'border-red-300 focus:ring-red-100' : 'border-gray-200 focus:border-purple-400'
                }`}
                placeholder="Start writing your blog content here... Press Enter for new paragraphs and double Enter for spacing."
              />
              {errors.content && (
                <div className="flex items-center mt-3 text-red-600">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  <span className="text-sm">{errors.content}</span>
                </div>
              )}
              
              <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
                <div className="flex items-start">
                  <Info className="h-5 w-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">Writing Tips:</p>
                                        <ul className="space-y-1">
                      <li>• Minimum 50 characters required</li>
                      <li>• Press Enter to create new paragraphs</li>
                      <li>• Use double Enter for spacing between sections</li>
                      <li>• Include relevant keywords naturally in your content</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Collapsible Sections */}
            <div className="space-y-4">


              {/* Image Section */}
              <div className="bg-white shadow-lg rounded-2xl border border-gray-100 overflow-hidden">
                <button
                  onClick={() => toggleSection('image')}
                  className="w-full px-8 py-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-pink-100 rounded-xl flex items-center justify-center mr-4">
                      <ImageIcon className="h-5 w-5 text-pink-600" />
                    </div>
                    <div className="text-left">
                      <h3 className="text-lg font-semibold text-gray-800">Featured Image</h3>
                      <p className="text-sm text-gray-500">Add a compelling image to attract readers</p>
                    </div>
                  </div>
                  {collapsedSections.image ? (
                    <ChevronUp className="h-5 w-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  )}
                </button>
                
                {!collapsedSections.image && (
                  <div className="px-8 pb-6 border-t border-gray-100">
                    {/* Image Upload */}
                    <div className="mb-4">
                      <label htmlFor="imageUpload" className="block text-sm font-medium text-gray-700 mb-2">
                        Upload Image
                      </label>
                      <div className="flex items-center space-x-3">
                        <input
                          type="file"
                          id="imageUpload"
                          accept="image/*"
                          onChange={handleImageSelect}
                          className="hidden"
                        />
                        <label
                          htmlFor="imageUpload"
                          className="flex items-center px-4 py-3 bg-pink-100 text-pink-700 rounded-xl hover:bg-pink-200 transition-colors cursor-pointer"
                        >
                          <Upload className="h-5 w-5 mr-2" />
                          Choose Image
                        </label>
                        {selectedImage && (
                          <span className="text-sm text-gray-600">
                            {selectedImage.name}
                          </span>
                        )}
                      </div>
                      
                      {/* Image Preview */}
                      {imagePreview && (
                        <div className="mt-3">
                          <img
                            src={imagePreview}
                            alt="Preview"
                            className="w-32 h-32 object-cover rounded-lg border border-gray-200"
                          />
                        </div>
                      )}
                    </div>

                    {/* Image URL Input (Alternative) */}
                    <div className="border-t border-gray-100 pt-4">
                      <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700 mb-2">
                        Or enter image URL
                      </label>
                      <div className="flex space-x-3">
                        <input
                          type="url"
                          id="imageUrl"
                          value={blog.imageUrl || ''}
                          onChange={(e) => setBlog(prev => ({ ...prev, imageUrl: e.target.value }))}
                          className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-pink-100 focus:border-pink-400 transition-all duration-200"
                          placeholder="https://example.com/image.jpg"
                        />
                        <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center">
                          <ImageIcon className="h-6 w-6 text-pink-600" />
                        </div>
                      </div>
                    </div>
                    
                    <p className="mt-3 text-sm text-gray-500">
                      Upload an image file or provide a URL. Make sure it's high quality and relevant to your content.
                    </p>
                  </div>
                )}
              </div>

              {/* Category Section */}
              <div className="bg-white shadow-lg rounded-2xl border border-gray-100 overflow-hidden">
                <button
                  onClick={() => toggleSection('category')}
                  className="w-full px-8 py-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center mr-4">
                        <Tag className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div className="text-left">
                      <h3 className="text-lg font-semibold text-gray-800">Category</h3>
                      <p className="text-sm text-gray-500">Choose a category to organize your blog</p>
                    </div>
                  </div>
                  {collapsedSections.category ? (
                    <ChevronUp className="h-5 w-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  )}
                </button>
                
                {!collapsedSections.category && (
                  <div className="px-8 pb-6 border-t border-gray-100">
                    <select
                      id="category"
                      value={blog.category || ''}
                      onChange={(e) => setBlog(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-400 transition-all duration-200"
                    >
                      <option value="">Select a category</option>
                      <option value="Politics">Politics</option>
                      <option value="Development">Development</option>
                      <option value="Education">Education</option>
                      <option value="Healthcare">Healthcare</option>
                      <option value="Agriculture">Agriculture</option>
                      <option value="Infrastructure">Infrastructure</option>
                      <option value="General">General</option>
                    </select>
                    <p className="mt-3 text-sm text-gray-500">
                      Choose a category that best describes your blog content. This helps readers find your posts.
                    </p>
                    
                    {errors.category && (
                      <div className="flex items-center mt-3 text-red-600">
                        <AlertCircle className="h-4 w-4 mr-2" />
                        <span className="text-sm">{errors.category}</span>
                      </div>
                    )}
                    
                    {/* Featured Toggle */}
                    <div className="mt-4 flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="featured"
                        checked={blog.featured || false}
                        onChange={(e) => setBlog(prev => ({ ...prev, featured: e.target.checked }))}
                        className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                      />
                      <label htmlFor="featured" className="text-sm text-gray-700">
                        Mark as featured post
                      </label>
                    </div>
                    <p className="mt-1 text-sm text-gray-500">
                      Featured posts appear prominently at the top of the blog listing.
                    </p>
                  </div>
                )}
              </div>

              {/* Status Section */}
              <div className="bg-white shadow-lg rounded-2xl border border-gray-100 overflow-hidden">
                <button
                  onClick={() => toggleSection('status')}
                  className="w-full px-8 py-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center mr-4">
                      <Globe className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div className="text-left">
                      <h3 className="text-lg font-semibold text-gray-800">Publication Status</h3>
                      <p className="text-sm text-gray-500">Control when and how your content is visible</p>
                    </div>
                  </div>
                  {collapsedSections.status ? (
                    <ChevronUp className="h-5 w-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  )}
                </button>
                
                {!collapsedSections.status && (
                  <div className="px-8 pb-6 border-t border-gray-100">
                    <select
                      id="status"
                      value={blog.status || 'draft'}
                      onChange={(e) => setBlog(prev => ({ ...prev, status: e.target.value as 'draft' | 'published' | 'archived' }))}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 transition-all duration-200"
                    >
                      <option value="draft">📝 Draft - Save for later editing</option>
                      <option value="published">🌐 Published - Make visible to users</option>
                      <option value="archived">📁 Archived - Hide from public view</option>
                    </select>
                    
                    <div className="mt-4 p-4 bg-indigo-50 rounded-xl border border-indigo-200">
                      <div className="flex items-start">
                        <Info className="h-5 w-5 text-indigo-600 mr-3 mt-0.5 flex-shrink-0" />
                        <div className="text-sm text-indigo-800">
                          <p className="font-medium mb-1">Status Guide:</p>
                          <ul className="space-y-1">
                            <li>• <strong>Draft:</strong> Your content is saved but not visible to readers</li>
                            <li>• <strong>Published:</strong> Your content is live and visible to all users</li>
                            <li>• <strong>Archived:</strong> Your content is hidden but can be restored later</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BlogCreate;
