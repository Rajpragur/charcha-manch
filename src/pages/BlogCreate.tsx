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
  Tag, 
  Image as ImageIcon,
  Loader
} from 'lucide-react';

interface Blog {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  author: string;
  authorId: string;
  createdAt: Date;
  updatedAt: Date;
  status: 'draft' | 'published' | 'archived';
  tags: string[];
  imageUrl?: string;
  slug: string;
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
    tags: [],
    status: 'draft',
    imageUrl: ''
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEditing = !!blogId;

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
          tags: blogData.tags || [],
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
    const newErrors: Record<string, string> = {};
    
    if (!blog.title?.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (!blog.content?.trim()) {
      newErrors.content = 'Content is required';
    }
    
    if (!blog.excerpt?.trim()) {
      newErrors.excerpt = 'Excerpt is required';
    }
    
    if (blog.content && blog.content.length < 100) {
      newErrors.content = 'Content must be at least 100 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const generateSlug = (title: string): string => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .replace(/\s+/g, '-');
  };

  const addTag = () => {
    if (newTag.trim() && !blog.tags?.includes(newTag.trim())) {
      setBlog(prev => ({
        ...prev,
        tags: [...(prev.tags || []), newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setBlog(prev => ({
      ...prev,
      tags: prev.tags?.filter(tag => tag !== tagToRemove) || []
    }));
  };

  const handleSave = async (status: 'draft' | 'published') => {
    if (!validateForm()) return;
    
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
      
      const docRef = doc(db, 'blogs', isEditing ? blogId! : blogData.id);
      await setDoc(docRef, blogData, { merge: true });
      
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

  const handlePublish = () => handleSave('published');
  const handleSaveDraft = () => handleSave('draft');

  if (adminLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/admin?tab=blogs')}
                className="mr-4 p-2 text-gray-400 hover:text-gray-600 rounded-md"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {isEditing ? 'Edit Blog' : 'Create New Blog'}
                </h1>
                <p className="text-sm text-gray-500">
                  {isEditing ? 'Update your blog post' : 'Write a new blog post for your audience'}
                </p>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setPreviewMode(!previewMode)}
                className={`px-4 py-2 border border-gray-300 rounded-md text-sm font-medium ${
                  previewMode 
                    ? 'bg-gray-100 text-gray-700' 
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Eye className="h-4 w-4 inline mr-2" />
                {previewMode ? 'Edit' : 'Preview'}
              </button>
              
              <button
                onClick={handleSaveDraft}
                disabled={isSaving}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                {isSaving ? (
                  <Loader className="animate-spin h-4 w-4 inline mr-2" />
                ) : (
                  <Save className="h-4 w-4 inline mr-2" />
                )}
                Save Draft
              </button>
              
              <button
                onClick={handlePublish}
                disabled={isSaving}
                className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              >
                {isSaving ? (
                  <Loader className="animate-spin h-4 w-4 inline mr-2" />
                ) : (
                  <FileText className="h-4 w-4 inline mr-2" />
                )}
                {isEditing ? 'Update' : 'Publish'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {previewMode ? (
          /* Preview Mode */
          <div className="bg-white shadow rounded-lg p-8">
            <div className="max-w-4xl mx-auto">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">{blog.title || 'Untitled Blog'}</h1>
              
              {blog.excerpt && (
                <p className="text-xl text-gray-600 mb-6 italic">{blog.excerpt}</p>
              )}
              
              {blog.tags && blog.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {blog.tags.map((tag, index) => (
                    <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              
              <div className="prose prose-lg max-w-none">
                {blog.content ? (
                  <div dangerouslySetInnerHTML={{ __html: blog.content.replace(/\n/g, '<br>') }} />
                ) : (
                  <p className="text-gray-500 italic">No content yet...</p>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Edit Mode */
          <div className="space-y-6">
            {/* Title */}
            <div className="bg-white shadow rounded-lg p-6">
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Blog Title *
              </label>
              <input
                type="text"
                id="title"
                value={blog.title || ''}
                onChange={(e) => setBlog(prev => ({ ...prev, title: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.title ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter your blog title..."
              />
              {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
            </div>

            {/* Excerpt */}
            <div className="bg-white shadow rounded-lg p-6">
              <label htmlFor="excerpt" className="block text-sm font-medium text-gray-700 mb-2">
                Excerpt *
              </label>
              <textarea
                id="excerpt"
                value={blog.excerpt || ''}
                onChange={(e) => setBlog(prev => ({ ...prev, excerpt: e.target.value }))}
                rows={3}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.excerpt ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Write a brief summary of your blog post..."
              />
              {errors.excerpt && <p className="mt-1 text-sm text-red-600">{errors.excerpt}</p>}
              <p className="mt-1 text-sm text-gray-500">
                This will appear as a preview in blog listings.
              </p>
            </div>

            {/* Content */}
            <div className="bg-white shadow rounded-lg p-6">
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                Content *
              </label>
              <textarea
                id="content"
                value={blog.content || ''}
                onChange={(e) => setBlog(prev => ({ ...prev, content: e.target.value }))}
                rows={20}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm ${
                  errors.content ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Write your blog content here... You can use basic HTML tags like <b>, <i>, <a>, <br>, etc."
              />
              {errors.content && <p className="mt-1 text-sm text-red-600">{errors.content}</p>}
              <p className="mt-1 text-sm text-gray-500">
                Minimum 100 characters. You can use basic HTML tags for formatting.
              </p>
            </div>

            {/* Tags */}
            <div className="bg-white shadow rounded-lg p-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags
              </label>
              <div className="flex space-x-2 mb-3">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Add a tag..."
                />
                <button
                  onClick={addTag}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Add
                </button>
              </div>
              
              {blog.tags && blog.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {blog.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                    >
                      {tag}
                      <button
                        onClick={() => removeTag(tag)}
                        className="ml-2 text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Image URL */}
            <div className="bg-white shadow rounded-lg p-6">
              <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700 mb-2">
                Featured Image URL
              </label>
              <div className="flex space-x-2">
                <input
                  type="url"
                  id="imageUrl"
                  value={blog.imageUrl || ''}
                  onChange={(e) => setBlog(prev => ({ ...prev, imageUrl: e.target.value }))}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://example.com/image.jpg"
                />
                <ImageIcon className="h-5 w-5 text-gray-400 mt-2" />
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Optional: Add a featured image for your blog post.
              </p>
            </div>

            {/* Status */}
            <div className="bg-white shadow rounded-lg p-6">
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                id="status"
                value={blog.status || 'draft'}
                onChange={(e) => setBlog(prev => ({ ...prev, status: e.target.value as 'draft' | 'published' | 'archived' }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
              <p className="mt-1 text-sm text-gray-500">
                Draft: Save for later editing. Published: Make visible to users. Archived: Hide from public view.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BlogCreate;
