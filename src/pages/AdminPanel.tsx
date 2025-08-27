import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useAdmin } from '../contexts/AdminContext';
import { collection, getDocs, query } from 'firebase/firestore';
import { db } from '../configs/firebase';
import { FirebaseService } from '../services/firebaseService';
import { 
  Users, 
  MapPin, 
  BarChart3, 
  Settings, 
  Shield, 
  Edit,
  Trash2,
  Plus,
  FileText,
  Newspaper,
  Eye,
  Loader,
  ThumbsUp,
  MessageSquare
} from 'lucide-react';
import { doc, deleteDoc, setDoc } from 'firebase/firestore';

interface Blog {
  id: string;
  title: string;
  content: string;
  excerpt?: string;
  status: 'draft' | 'published' | 'archived';
  createdAt: Date;
  updatedAt?: Date;
  author: string;
  authorId?: string;
  imageUrl?: string;
  slug?: string;
  category?: string;
  featured?: boolean;
  views?: number;
  likes?: number;
  comments?: number;
}

interface Constituency {
  id: string;
  name: string;
  state: string;
  totalVoters: number;
}

interface ConstituencyNews {
  id: string;
  title: string;
  content: string;
  excerpt?: string;
  constituencyId?: string;
  constituencyName?: string;
  candidateId?: string;
  candidateName?: string;
  category: 'constituency' | 'candidate' | 'general';
  status: 'draft' | 'published' | 'archived';
  priority: 'low' | 'medium' | 'high';
  tags: string[];
  imageUrl?: string;
  author: string;
  authorId: string;
  createdAt: Date;
  updatedAt?: Date;
  publishedAt?: Date;
  views?: number;
  isBreaking?: boolean;
}

interface User {
  uid: string;
  email: string;
  displayName: string;
  role: string;
  createdAt: Date;
  isActive: boolean;
}

const AdminPanel: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, logout, loading: authLoading } = useAuth();
  const { isAdmin, loading } = useAdmin();
  
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Real data from database
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [constituencies, setConstituencies] = useState<Constituency[]>([]);
  const [constituencyNews, setConstituencyNews] = useState<ConstituencyNews[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // JSON Data Management State
  const [jsonFiles, setJsonFiles] = useState<{
    hindi: File | null;
    english: File | null;
  }>({ hindi: null, english: null });
  const [uploadingJson, setUploadingJson] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // News Management State
  const [showNewsForm, setShowNewsForm] = useState(false);
  const [editingNews, setEditingNews] = useState<ConstituencyNews | null>(null);
  const [newsFormData, setNewsFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    constituencyId: '',
    constituencyName: '',
    candidateId: '',
    candidateName: '',
    category: 'constituency' as 'constituency' | 'candidate' | 'general',
    priority: 'medium' as 'low' | 'medium' | 'high',
    tags: [] as string[],
    status: 'draft' as 'draft' | 'published' | 'archived',
    isBreaking: false
  });

  useEffect(() => {
    if (loading || authLoading) return;
    
    if (isAdmin) {
      console.log('✅ User is admin, loading admin data');
      loadAdminData();
    } else {
      console.log('❌ User is not admin, redirecting to home');
      navigate('/');
    }
  }, [loading, isAdmin, authLoading, navigate]);

  const loadAdminData = async () => {
    try {
      setDataLoading(true);
      
      // First, let's check what collections are available
      try {
        console.log('🔍 Checking available collections...');
        // Note: This is a debug attempt - listCollections might not work in client-side Firestore
        console.log('🔍 Firestore instance:', db);
        console.log('🔍 Firestore app:', db.app);
        console.log('🔍 Firestore type:', typeof db);
      } catch (error) {
        console.log('⚠️ Could not check collections (this is normal in client-side)');
      }
      
      // Fetch blogs
      try {
        console.log('🔍 Fetching blogs...');
        const blogsQuery = query(collection(db, 'blogs'));
        const blogsSnapshot = await getDocs(blogsQuery);
        const blogsData = blogsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Blog[];
        setBlogs(blogsData);
        console.log('✅ Blogs loaded successfully:', blogsData.length);
      } catch (error) {
        console.error('❌ Error loading blogs:', error);
        setBlogs([]);
      }
      
      // Fetch constituencies
      try {
        console.log('🔍 Fetching constituencies...');
        console.log('🔍 Using collection name: constituencies');
        console.log('🔍 Database instance:', db);
        
        // Try the main constituencies collection first
        const constituenciesQuery = query(collection(db, 'constituencies'));
        console.log('🔍 Query created:', constituenciesQuery);
        
        const constituenciesSnapshot = await getDocs(constituenciesQuery);
        console.log('🔍 Snapshot received:', constituenciesSnapshot);
        console.log('🔍 Snapshot size:', constituenciesSnapshot.size);
        console.log('🔍 Snapshot empty:', constituenciesSnapshot.empty);
        
        const constituenciesData = constituenciesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Constituency[];
        
        console.log('🔍 Mapped data:', constituenciesData);
        console.log('🔍 Data length:', constituenciesData.length);
        
        // If no constituencies found, try the actual collections that exist
        if (constituenciesData.length === 0) {
          console.log('🔍 No constituencies found, trying actual collections...');
          
          // Try constituency_scores collection (we know this has 243 documents)
          try {
            console.log('🔍 Trying collection: constituency_scores');
            const scoresQuery = query(collection(db, 'constituency_scores'));
            const scoresSnapshot = await getDocs(scoresQuery);
            console.log(`🔍 Collection 'constituency_scores' has ${scoresSnapshot.size} documents`);
            
            if (scoresSnapshot.size > 0) {
              console.log(`✅ Found data in collection 'constituency_scores'!`);
              const firstDoc = scoresSnapshot.docs[0];
              console.log('📄 First document data:', firstDoc.data());
              
              // Convert constituency_scores to constituency format
              const convertedData = scoresSnapshot.docs.map(doc => {
                const data = doc.data();
                return {
                  id: doc.id,
                  name: `Constituency ${data.constituency_id || doc.id}`,
                  state: 'Bihar', // Default state
                  totalVoters: data.total_voters || 0,
                  status: 'active',
                  createdAt: data.created_at || new Date(),
                  lastUpdated: data.last_updated || new Date()
                } as Constituency;
              });
              
              setConstituencies(convertedData);
              console.log('✅ Constituencies converted from constituency_scores:', convertedData.length);
              return; // Exit early since we found data
            }
          } catch (error) {
            console.log(`⚠️ Collection 'constituency_scores' not accessible:`, error);
          }
          
          // Try other possible collections
          const alternativeNames = ['constituency', 'constituency_data', 'constituency_info', 'constituency_details', 'areas'];
          
          for (const name of alternativeNames) {
            try {
              console.log(`🔍 Trying collection: ${name}`);
              const altQuery = query(collection(db, name));
              const altSnapshot = await getDocs(altQuery);
              console.log(`🔍 Collection '${name}' has ${altSnapshot.size} documents`);
              
              if (altSnapshot.size > 0) {
                console.log(`✅ Found data in collection '${name}'!`);
                const firstDoc = altSnapshot.docs[0];
                console.log('📄 First document data:', firstDoc.data());
                break;
              }
            } catch (error) {
              console.log(`⚠️ Collection '${name}' not accessible or doesn't exist`);
            }
          }
        }
        
        setConstituencies(constituenciesData);
        console.log('✅ Constituencies loaded successfully:', constituenciesData.length);
        
      } catch (error) {
        console.error('❌ Error loading constituencies:', error);
        console.error('❌ Error details:', {
          message: error instanceof Error ? error.message : String(error),
          code: (error as any)?.code,
          stack: error instanceof Error ? error.stack : undefined
        });
        setConstituencies([]);
      }
      
      // Fetch constituency news
      try {
        console.log('🔍 Fetching constituency news...');
        const newsQuery = query(collection(db, 'constituency_news'));
        const newsSnapshot = await getDocs(newsQuery);
        const newsData = newsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as ConstituencyNews[];
        setConstituencyNews(newsData);
        console.log('✅ Constituency news loaded successfully:', newsData.length);
      } catch (error) {
        console.error('❌ Error loading constituency news:', error);
        setConstituencyNews([]);
      }
      
      // Fetch users
      try {
        console.log('🔍 Fetching users...');
        // Only fetch users if current user is admin (security check)
        if (isAdmin) {
          try {
            // Try to fetch from users collection first
            const usersData = await FirebaseService.getAllUsers();
            setUsers(usersData);
            console.log('✅ Users loaded successfully from users collection:', usersData.length);
          } catch (usersError) {
            console.log('⚠️ Could not fetch from users collection, trying user_profiles...');
            
            try {
              // Fallback to user_profiles collection
              const profilesData = await FirebaseService.getAllUserProfiles();
              // Convert profiles to user format
              const convertedUsers: User[] = profilesData.map(profile => ({
                uid: profile.uid,
                email: profile.email || profile.user_email || 'No email',
                displayName: profile.display_name || profile.name || 'Unknown User',
                role: profile.role || 'user',
                createdAt: profile.created_at || profile.createdAt || new Date(),
                isActive: profile.is_active !== false // Default to true if not specified
              }));
              
              setUsers(convertedUsers);
              console.log('✅ Users loaded successfully from user_profiles collection:', convertedUsers.length);
            } catch (profilesError) {
              console.log('⚠️ Could not fetch from user_profiles collection either');
              console.error('Users collection error:', usersError);
              console.error('User profiles collection error:', profilesError);
              
              // Set a default user (the current admin) so the count shows at least 1
              if (currentUser) {
                const defaultUser: User = {
                  uid: currentUser.uid,
                  email: currentUser.email || 'admin@example.com',
                  displayName: currentUser.displayName || 'Admin User',
                  role: 'admin',
                  createdAt: new Date(),
                  isActive: true
                };
                setUsers([defaultUser]);
                console.log('✅ Set default admin user for display');
              } else {
                setUsers([]);
              }
            }
          }
        } else {
          console.log('⚠️ User is not admin, skipping users fetch');
          setUsers([]);
        }
      } catch (error) {
        console.error('❌ Error loading users:', error);
        // Set a default user if there's an error
        if (currentUser) {
          const defaultUser: User = {
            uid: currentUser.uid,
            email: currentUser.email || 'admin@example.com',
            displayName: currentUser.displayName || 'Admin User',
            role: 'admin',
            createdAt: new Date(),
            isActive: true
          };
          setUsers([defaultUser]);
        } else {
          setUsers([]);
        }
      }
      
    } catch (error) {
      console.error('❌ General error in loadAdminData:', error);
    } finally {
      setDataLoading(false);
    }
  };

  const handleDeleteBlog = async (blogId: string) => {
    try {
      setIsDeleting(true);
      
      // Delete the blog document
      const blogRef = doc(db, 'blogs', blogId);
      await deleteDoc(blogRef);
      
      // Remove from local state
      setBlogs(blogs.filter(blog => blog.id !== blogId));
      
      // Close confirmation
      setDeleteConfirm(null);
      
      console.log('✅ Blog deleted successfully');
    } catch (error) {
      console.error('❌ Error deleting blog:', error);
      alert('Error deleting blog. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteConstituencyNews = async (newsId: string) => {
    try {
      setIsDeleting(true);
      
      // Delete the constituency news document
      const newsRef = doc(db, 'constituency_news', newsId);
      await deleteDoc(newsRef);
      
      // Remove from local state
      setConstituencyNews(constituencyNews.filter(news => news.id !== newsId));
      
      // Close confirmation
      setDeleteConfirm(null);
      
      console.log('✅ Constituency news deleted successfully');
    } catch (error) {
      console.error('❌ Error deleting constituency news:', error);
      alert('Error deleting constituency news. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  // News Management Functions
  const handleCreateNews = async () => {
    try {
      if (!currentUser) return;
      
      const newsData = {
        ...newsFormData,
        author: currentUser.displayName || currentUser.email || 'Admin',
        authorId: currentUser.uid,
        createdAt: new Date(),
        updatedAt: new Date(),
        publishedAt: newsFormData.status === 'published' ? new Date() : undefined,
        views: 0,
        tags: newsFormData.tags.filter(tag => tag.trim() !== '')
      };

      // Add to Firestore
      const newsRef = doc(collection(db, 'constituency_news'));
      await setDoc(newsRef, { ...newsData, id: newsRef.id });

      // Add to local state
      const newNews: ConstituencyNews = { ...newsData, id: newsRef.id };
      setConstituencyNews([newNews, ...constituencyNews]);

      // Reset form
      setNewsFormData({
        title: '',
        content: '',
        excerpt: '',
        constituencyId: '',
        constituencyName: '',
        candidateId: '',
        candidateName: '',
        category: 'constituency',
        priority: 'medium',
        tags: [],
        status: 'draft',
        isBreaking: false
      });
      setShowNewsForm(false);
      setEditingNews(null);

      console.log('✅ News created successfully');
    } catch (error) {
      console.error('❌ Error creating news:', error);
    }
  };

  const handleUpdateNews = async () => {
    try {
      if (!editingNews || !currentUser) return;
      
      const updatedNews = {
        ...editingNews,
        ...newsFormData,
        updatedAt: new Date(),
        publishedAt: newsFormData.status === 'published' ? new Date() : editingNews.publishedAt,
        tags: newsFormData.tags.filter(tag => tag.trim() !== '')
      };

      // Update in Firestore
      const newsRef = doc(db, 'constituency_news', editingNews.id);
      await setDoc(newsRef, updatedNews);

      // Update local state
      setConstituencyNews(constituencyNews.map(news => 
        news.id === editingNews.id ? updatedNews : news
      ));

      // Reset form
      setNewsFormData({
        title: '',
        content: '',
        excerpt: '',
        constituencyId: '',
        constituencyName: '',
        candidateId: '',
        candidateName: '',
        category: 'constituency',
        priority: 'medium',
        tags: [],
        status: 'draft',
        isBreaking: false
      });
      setShowNewsForm(false);
      setEditingNews(null);

      console.log('✅ News updated successfully');
    } catch (error) {
      console.error('❌ Error updating news:', error);
    }
  };

  const handleEditNews = (news: ConstituencyNews) => {
    setEditingNews(news);
    setNewsFormData({
      title: news.title,
      content: news.content,
      excerpt: news.excerpt || '',
      constituencyId: news.constituencyId || '',
      constituencyName: news.constituencyName || '',
      candidateId: news.candidateId || '',
      candidateName: news.candidateName || '',
      category: news.category,
      priority: news.priority,
      tags: news.tags || [],
      status: news.status,
      isBreaking: news.isBreaking || false
    });
    setShowNewsForm(true);
  };

  const handleAddTag = (tag: string) => {
    if (tag.trim() && !newsFormData.tags.includes(tag.trim())) {
      setNewsFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag.trim()]
      }));
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setNewsFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  // JSON File Management Handlers
  const handleJsonFileUpload = (event: React.ChangeEvent<HTMLInputElement>, type: 'hindi' | 'english') => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/json') {
      setJsonFiles(prev => ({ ...prev, [type]: file }));
    } else {
      alert('Please select a valid JSON file.');
    }
  };

  const handleBulkJsonUpload = async () => {
    if (!jsonFiles.hindi && !jsonFiles.english) {
      alert('Please select at least one JSON file to upload.');
      return;
    }

    try {
      setUploadingJson(true);
      setUploadProgress(0);

      // Upload Hindi data if selected
      if (jsonFiles.hindi) {
        await uploadJsonToDatabase(jsonFiles.hindi, 'hindi');
        setUploadProgress(50);
      }

      // Upload English data if selected
      if (jsonFiles.english) {
        await uploadJsonToDatabase(jsonFiles.english, 'english');
        setUploadProgress(100);
      }

      // Clear files after successful upload
      setJsonFiles({ hindi: null, english: null });
      
      alert('JSON data uploaded successfully! The app will now use the updated data.');
      
      // Refresh admin data
      await loadAdminData();
      
    } catch (error) {
      console.error('Error uploading JSON data:', error);
      alert('Failed to upload JSON data. Please try again.');
    } finally {
      setUploadingJson(false);
      setUploadProgress(0);
    }
  };

  const uploadJsonToDatabase = async (file: File, type: 'hindi' | 'english') => {
    try {
      const text = await file.text();
      const jsonData = JSON.parse(text);
      
      // Validate JSON structure
      if (!Array.isArray(jsonData)) {
        throw new Error('Invalid JSON structure. Expected an array.');
      }

      // Store in Firebase
      const collectionName = type === 'hindi' ? 'constituency_data_hindi' : 'constituency_data_english';
      
      // Clear existing data
      const existingDocs = await getDocs(collection(db, collectionName));
      const deletePromises = existingDocs.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
      
      // Upload new data
      const uploadPromises = jsonData.map((item, index) => {
        const docRef = doc(collection(db, collectionName));
        return setDoc(docRef, {
          ...item,
          id: docRef.id,
          order: index,
          uploaded_at: new Date(),
          uploaded_by: currentUser?.uid
        });
      });
      
      await Promise.all(uploadPromises);
      
      console.log(`✅ ${type} constituency data uploaded successfully:`, jsonData.length, 'constituencies');
      
    } catch (error) {
      console.error(`Error uploading ${type} JSON data:`, error);
      throw error;
    }
  };

  const handleDownloadJsonData = async () => {
    try {
      // Download both Hindi and English data
      const [hindiData, englishData] = await Promise.all([
        FirebaseService.getConstituencyData('hindi'),
        FirebaseService.getConstituencyData('english')
      ]);

      // Create and download Hindi JSON
      if (hindiData.length > 0) {
        const hindiBlob = new Blob([JSON.stringify(hindiData, null, 2)], { type: 'application/json' });
        const hindiUrl = URL.createObjectURL(hindiBlob);
        const hindiLink = document.createElement('a');
        hindiLink.href = hindiUrl;
        hindiLink.download = 'candidates_updated.json';
        hindiLink.click();
        URL.revokeObjectURL(hindiUrl);
      }

      // Create and download English JSON
      if (englishData.length > 0) {
        const englishBlob = new Blob([JSON.stringify(englishData, null, 2)], { type: 'application/json' });
        const englishUrl = URL.createObjectURL(englishBlob);
        const englishLink = document.createElement('a');
        englishLink.href = englishUrl;
        englishLink.download = 'candidates_en_updated.json';
        englishLink.click();
        URL.revokeObjectURL(englishUrl);
      }

      alert('JSON files downloaded successfully!');
    } catch (error) {
      console.error('Error downloading JSON data:', error);
      alert('Failed to download JSON data. Please try again.');
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-2xl font-semibold text-gray-700 mb-2">
            {authLoading ? 'Checking Authentication...' : 'Verifying Admin Access...'}
          </h2>
          <p className="text-gray-500">Please wait while we verify your permissions...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
            <Shield className="h-10 w-10 text-red-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-lg text-gray-600 mb-6">
            You don't have permission to access the admin panel.
          </p>
          <div className="space-y-3">
            {isAdmin ? (
              <button
                onClick={() => navigate('/admin-setup')}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Set Up Admin Access
              </button>
            ) : (
              <div className="w-full px-6 py-3 bg-gray-400 text-white rounded-lg text-center">
                Admin Setup Restricted
              </div>
            )}
            <button
              onClick={() => navigate('/')}
              className="w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Go to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Calculate real statistics
  const totalUsers = users.length;
  const totalBlogs = blogs.length;
  const totalConstituencies = constituencies.length;
  const totalNews = constituencyNews.length;
  
  const publishedBlogs = blogs.filter(blog => blog.status === 'published').length;
  const draftBlogs = blogs.filter(blog => blog.status === 'draft').length;
  const publishedNews = constituencyNews.filter(news => news.status === 'published').length;
  const activeUsers = users.filter(user => user.isActive).length;

  // Note: totalUsers should be at least 1 since the current admin user is accessing this panel
  // If it shows 0, there might be a permission issue with the users collection

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-[#014e5c] shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-6 space-y-4 sm:space-y-0">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mr-4">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white">
                  Charcha Manch Admin Panel
                </h1>
                <p className="text-sm text-white/80 mt-1">Manage your platform with ease</p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
              <div className="flex items-center space-x-2 text-sm text-white/80">
                <div className="w-2 h-2 bg-white rounded-full"></div>
                <span>Admin Access</span>
              </div>
              <button
                onClick={logout}
                className="px-4 py-2 bg-white text-[#014e5c] rounded-lg hover:bg-white/90 transition-all duration-200 text-sm font-medium shadow-sm hover:shadow-md"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Stats Grid */}
        {activeTab === 'dashboard' && (
          <div className="mb-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <div className="bg-white rounded-2xl shadow-sm border border-[#014e5c]/20 p-6 hover:shadow-md transition-all duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[#014e5c]/70">Total Users</p>
                    <p className="text-3xl font-bold text-[#014e5c]">{totalUsers}</p>
                  </div>
                  <div className="w-12 h-12 bg-[#014e5c]/10 rounded-xl flex items-center justify-center">
                    <Users className="h-6 w-6 text-[#014e5c]" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm">
                  <span className="text-[#014e5c] font-medium">Active</span>
                  <span className="text-[#014e5c]/60 ml-2">{activeUsers} users</span>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-[#014e5c]/20 p-6 hover:shadow-md transition-all duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[#014e5c]/70">Total Blogs</p>
                    <p className="text-3xl font-bold text-[#014e5c]">{totalBlogs}</p>
                  </div>
                  <div className="w-12 h-12 bg-[#014e5c]/10 rounded-xl flex items-center justify-center">
                    <FileText className="h-6 w-6 text-[#014e5c]" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm">
                  <span className="text-[#014e5c] font-medium">{publishedBlogs}</span>
                  <span className="text-[#014e5c]/60 ml-2">published</span>
                  <span className="text-[#014e5c]/80 font-medium ml-2">{draftBlogs}</span>
                  <span className="text-[#014e5c]/60 ml-1">drafts</span>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-[#014e5c]/20 p-6 hover:shadow-md transition-all duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[#014e5c]/70">Constituencies</p>
                    <p className="text-3xl font-bold text-[#014e5c]">{totalConstituencies}</p>
                  </div>
                  <div className="w-12 h-12 bg-[#014e5c]/10 rounded-xl flex items-center justify-center">
                    <MapPin className="h-6 w-6 text-[#014e5c]" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm">
                  <span className="text-[#014e5c] font-medium">Active</span>
                  <span className="text-[#014e5c]/60 ml-2">constituencies</span>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-[#014e5c]/20 p-6 hover:shadow-md transition-all duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[#014e5c]/70">News Articles</p>
                    <p className="text-3xl font-bold text-[#014e5c]">{totalNews}</p>
                  </div>
                  <div className="w-12 h-12 bg-[#014e5c]/10 rounded-xl flex items-center justify-center">
                    <Newspaper className="h-6 w-6 text-[#014e5c]" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm">
                  <span className="text-[#014e5c] font-medium">{publishedNews}</span>
                  <span className="text-[#014e5c]/60 ml-2">published</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mt-8 bg-white rounded-2xl shadow-sm border border-[#014e5c]/20 p-6">
              <h3 className="text-lg font-semibold text-[#014e5c] mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <button
                  onClick={() => setActiveTab('blogs')}
                  className="flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-xl text-white bg-[#014e5c] hover:bg-[#014e5c]/90 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Create Blog
                </button>
                <button
                  onClick={() => setActiveTab('constituency-news')}
                  className="flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-xl text-white bg-[#014e5c] hover:bg-[#014e5c]/90 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Add News
                </button>
                <button
                  onClick={() => setActiveTab('constituencies')}
                  className="flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-xl text-white bg-[#014e5c] hover:bg-[#014e5c]/90 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  <Edit className="h-5 w-5 mr-2" />
                  Manage Data
                </button>
                <button
                  onClick={() => setActiveTab('json-data')}
                  className="flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-xl text-white bg-[#014e5c] hover:bg-[#014e5c]/90 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  <FileText className="h-5 w-5 mr-2" />
                  JSON Data
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#014e5c]/20 mb-6 overflow-hidden">
          <div className="flex flex-wrap border-b border-[#014e5c]/20">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center px-4 sm:px-6 py-3 sm:py-4 text-sm font-medium transition-all duration-200 ${
                activeTab === 'dashboard'
                  ? 'text-[#014e5c] border-b-2 border-[#014e5c] bg-[#014e5c]/10'
                  : 'text-[#014e5c]/70 hover:text-[#014e5c] hover:bg-[#014e5c]/5'
              }`}
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Dashboard</span>
              <span className="sm:hidden">Dash</span>
            </button>
            
            <button
              onClick={() => setActiveTab('blogs')}
              className={`flex items-center px-4 sm:px-6 py-3 sm:py-4 text-sm font-medium transition-all duration-200 ${
                activeTab === 'blogs'
                  ? 'text-[#014e5c] border-b-2 border-[#014e5c] bg-[#014e5c]/10'
                  : 'text-[#014e5c]/70 hover:text-[#014e5c] hover:bg-[#014e5c]/5'
              }`}
            >
              <FileText className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Blogs</span>
              <span className="sm:hidden">Blogs</span>
            </button>
            
            <button
              onClick={() => setActiveTab('constituency-news')}
              className={`flex items-center px-4 sm:px-6 py-3 sm:py-4 text-sm font-medium transition-all duration-200 ${
                activeTab === 'constituency-news'
                  ? 'text-[#014e5c] border-b-2 border-[#014e5c] bg-[#014e5c]/10'
                  : 'text-[#014e5c]/70 hover:text-[#014e5c] hover:bg-[#014e5c]/5'
              }`}
            >
              <Newspaper className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">News</span>
              <span className="sm:hidden">News</span>
            </button>
            
            <button
              onClick={() => setActiveTab('constituencies')}
              className={`flex items-center px-4 sm:px-6 py-3 sm:py-4 text-sm font-medium transition-all duration-200 ${
                activeTab === 'constituencies'
                  ? 'text-[#014e5c] border-b-2 border-[#014e5c] bg-[#014e5c]/10'
                  : 'text-[#014e5c]/70 hover:text-[#014e5c] hover:bg-[#014e5c]/5'
              }`}
            >
              <MapPin className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Constituencies</span>
              <span className="sm:hidden">Const</span>
            </button>
            
            <button
              onClick={() => setActiveTab('users')}
              className={`flex items-center px-4 sm:px-6 py-3 sm:py-4 text-sm font-medium transition-all duration-200 ${
                activeTab === 'users'
                  ? 'text-[#014e5c] border-b-2 border-[#014e5c] bg-[#014e5c]/10'
                  : 'text-[#014e5c]/70 hover:text-[#014e5c] hover:bg-[#014e5c]/5'
              }`}
            >
              <Users className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Users</span>
              <span className="sm:hidden">Users</span>
            </button>
            
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex items-center px-4 sm:px-6 py-3 sm:py-4 text-sm font-medium transition-all duration-200 ${
                activeTab === 'settings'
                  ? 'text-[#014e5c] border-b-2 border-[#014e5c] bg-[#014e5c]/10'
                  : 'text-[#014e5c]/70 hover:text-[#014e5c] hover:bg-[#014e5c]/5'
              }`}
            >
              <Settings className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Settings</span>
              <span className="sm:hidden">Settings</span>
            </button>
          </div>
        </div>

        {/* Information Banner */}
        {!dataLoading && totalUsers === 0 && totalBlogs === 0 && totalConstituencies === 0 && totalNews === 0 && (
          <div className="mb-6 bg-[#014e5c]/10 border border-[#014e5c]/20 rounded-2xl p-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-[#014e5c] rounded-full flex items-center justify-center">
                  <svg className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-[#014e5c]">Welcome to Your Admin Panel!</h3>
                <div className="mt-2 text-[#014e5c]/80">
                  <p>This is your new admin panel. Currently, there's no data in the system. Here's how to get started:</p>
                  <ul className="mt-3 space-y-2">
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-[#014e5c] rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span><strong>Blogs:</strong> Create blog posts that will be visible to all users</span>
                    </li>
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-[#014e5c] rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span><strong>Constituencies:</strong> Add constituency information and demographic data</span>
                    </li>
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-[#014e5c] rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span><strong>News:</strong> Publish constituency-specific news articles</span>
                    </li>
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-[#014e5c] rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span><strong>Users:</strong> Monitor user registrations and activity</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Blogs Tab */}
        {activeTab === 'blogs' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
              <div>
                <h2 className="text-2xl font-bold text-[#014e5c]">Blog Management</h2>
                <p className="text-[#014e5c]/70 mt-1">Create, edit, and manage blog posts</p>
              </div>
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                <button
                  onClick={loadAdminData}
                  className="inline-flex items-center justify-center px-4 py-2 border border-[#014e5c]/30 text-sm font-medium rounded-xl text-[#014e5c] bg-white hover:bg-[#014e5c]/5 transition-all duration-200 shadow-sm"
                >
                  <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh
                </button>
                <button
                  onClick={() => navigate('/admin/blog/create')}
                  className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-xl text-white bg-[#014e5c] hover:bg-[#014e5c]/90 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Create New Blog
                </button>
              </div>
            </div>

            <div className="bg-white shadow-sm border border-[#014e5c]/20 rounded-2xl">
              <div className="px-6 py-6">
                {dataLoading ? (
                  <div className="text-center py-8">
                    <Loader className="animate-spin h-8 w-8 text-[#014e5c] mx-auto mb-4" />
                    <p className="text-[#014e5c]/70">Loading blogs...</p>
                  </div>
                ) : blogs.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-[#014e5c]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FileText className="h-8 w-8 text-[#014e5c]" />
                    </div>
                    <h3 className="text-lg font-semibold text-[#014e5c] mb-2">No blogs yet</h3>
                    <p className="text-[#014e5c]/70 mb-6">Get started by creating your first blog post.</p>
                    <div className="mt-6">
                      <button
                        onClick={() => navigate('/admin/blog/create')}
                        className="inline-flex items-center px-6 py-3 border border-transparent shadow-sm text-sm font-medium rounded-xl text-white bg-[#014e5c] hover:bg-[#014e5c]/90 transition-all duration-200"
                      >
                        <Plus className="h-5 w-5 mr-2" />
                        Create Blog
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {blogs.map((blog) => (
                      <div key={blog.id} className="bg-white border border-[#014e5c]/20 rounded-2xl p-6 hover:shadow-md transition-all duration-200">
                        <div className="flex flex-col h-full">
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-3">
                              <h3 className="text-lg font-semibold text-[#014e5c] line-clamp-2">{blog.title}</h3>
                              <div className="flex items-center space-x-2 ml-3">
                                <button
                                  onClick={() => navigate(`/admin/blog/edit/${blog.id}`)}
                                  className="p-2 text-[#014e5c] hover:bg-[#014e5c]/10 rounded-lg transition-all duration-200"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => setDeleteConfirm(blog.id)}
                                  className="p-2 text-[#014e5c]/80 hover:bg-[#014e5c]/10 rounded-lg transition-all duration-200"
                                  title="Delete blog"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                            
                            <p className="text-sm text-[#014e5c]/70 mb-3">
                              By <span className="font-medium text-[#014e5c]">{blog.author}</span> • 
                              <span className="ml-1">{blog.createdAt instanceof Date ? blog.createdAt.toLocaleDateString() : 'Unknown date'}</span>
                            </p>
                            
                            <div className="flex flex-wrap items-center gap-2 mb-4">
                              <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                                blog.status === 'published' ? 'bg-[#014e5c]/20 text-[#014e5c]' :
                                blog.status === 'draft' ? 'bg-[#014e5c]/10 text-[#014e5c]/80' :
                                'bg-[#014e5c]/5 text-[#014e5c]/60'
                              }`}>
                                {blog.status}
                              </span>
                              {blog.category && (
                                <span className="px-3 py-1 text-xs font-medium rounded-full bg-[#014e5c]/10 text-[#014e5c]/80">
                                  {blog.category}
                                </span>
                              )}
                              {blog.featured && (
                                <span className="px-3 py-1 text-xs font-medium rounded-full bg-[#014e5c]/20 text-[#014e5c]">
                                  Featured
                                </span>
                              )}
                            </div>
                            
                            <div className="flex items-center justify-between text-xs text-[#014e5c]/60">
                              <div className="flex items-center space-x-4">
                                <span className="flex items-center">
                                  <Eye className="h-3 w-3 mr-1" />
                                  {blog.views || 0} views
                                </span>
                                <span className="flex items-center">
                                  <ThumbsUp className="h-3 w-3 mr-1" />
                                  {blog.likes || 0} likes
                                </span>
                                <span className="flex items-center">
                                  <MessageSquare className="h-3 w-3 mr-1" />
                                  {blog.comments || 0} comments
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Constituencies Tab */}
        {activeTab === 'constituencies' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-xl sm:text-2xl font-bold text-[#014e5c]">Constituency Management</h2>
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <button
                  onClick={() => setActiveTab('json-data')}
                  className="inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-[#014e5c] hover:bg-[#014e5c]/90 transition-colors"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Manage JSON Data
                </button>
                <button
                  onClick={() => navigate('/admin/constituency/create')}
                  className="inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-[#014e5c] hover:bg-[#014e5c]/90 transition-colors"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Constituency
                </button>
              </div>
            </div>

            <div className="bg-white shadow-sm border border-[#014e5c]/20 rounded-2xl">
              <div className="px-4 py-5 sm:p-6">
                {dataLoading ? (
                  <div className="text-center py-8">
                    <Loader className="animate-spin h-6 w-6 text-[#014e5c] mx-auto mb-3" />
                    <p className="text-[#014e5c]/70 text-sm">Loading constituencies...</p>
                  </div>
                ) : constituencies.length === 0 ? (
                  <div className="text-center py-8">
                    <MapPin className="mx-auto h-10 w-10 text-[#014e5c]/40" />
                    <h3 className="mt-2 text-sm font-medium text-[#014e5c]">No constituencies yet</h3>
                    <p className="mt-1 text-sm text-[#014e5c]/70 mb-4">
                      Start by adding constituency information. You can add details like name, state, voter count, and other demographic information.
                    </p>
                    <div className="bg-[#014e5c]/5 border border-[#014e5c]/20 rounded-lg p-4 mb-4">
                      <h4 className="text-sm font-medium text-[#014e5c] mb-2">Getting Started:</h4>
                      <ul className="text-sm text-[#014e5c]/80 space-y-1">
                        <li>• Click "Add New Constituency" to create your first constituency</li>
                        <li>• Include key information like name, state, and voter count</li>
                        <li>• Add demographic data like population and literacy rate</li>
                        <li>• Provide a description of the constituency</li>
                      </ul>
                    </div>
                    <div className="mt-6">
                      <button
                        onClick={() => navigate('/admin/constituency/create')}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-[#014e5c] hover:bg-[#014e5c]/90 transition-colors"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Constituency
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-[#014e5c]/20">
                      <thead className="bg-[#014e5c]/5">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-[#014e5c] uppercase tracking-wider">Name</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-[#014e5c] uppercase tracking-wider">State</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-[#014e5c] uppercase tracking-wider">Voters</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-[#014e5c] uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-[#014e5c]/20">
                        {constituencies.map((constituency) => (
                          <tr key={constituency.id} className="hover:bg-[#014e5c]/2 transition-colors">
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-[#014e5c]">
                              {constituency.name}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-[#014e5c]/70">
                              {constituency.state}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-[#014e5c]/70">
                              {constituency.totalVoters?.toLocaleString() || 'N/A'}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => navigate(`/admin/constituency/edit/${constituency.id}`)}
                                  className="text-[#014e5c] hover:text-[#014e5c]/80 hover:bg-[#014e5c]/10 p-1 rounded transition-colors"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => navigate(`/admin/constituency/view/${constituency.id}`)}
                                  className="text-[#014e5c] hover:text-[#014e5c]/80 hover:bg-[#014e5c]/10 p-1 rounded transition-colors"
                                >
                                  <Eye className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Constituency News Tab */}
        {activeTab === 'constituency-news' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-xl sm:text-2xl font-bold text-[#014e5c]">News Management</h2>
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <button
                  onClick={loadAdminData}
                  className="inline-flex items-center justify-center px-3 py-2 border border-[#014e5c]/30 text-sm font-medium rounded-lg text-[#014e5c] bg-white hover:bg-[#014e5c]/5 transition-colors"
                >
                  <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh
                </button>
                <button
                  onClick={() => setShowNewsForm(true)}
                  className="inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-[#014e5c] hover:bg-[#014e5c]/90 transition-colors"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add News Article
                </button>
              </div>
            </div>

            {/* News Form */}
            {showNewsForm && (
              <div className="bg-white shadow-sm border border-[#014e5c]/20 rounded-2xl p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-[#014e5c]">
                    {editingNews ? 'Edit News Article' : 'Create News Article'}
                  </h3>
                  <button
                    onClick={() => {
                      setShowNewsForm(false);
                      setEditingNews(null);
                      setNewsFormData({
                        title: '',
                        content: '',
                        excerpt: '',
                        constituencyId: '',
                        constituencyName: '',
                        candidateId: '',
                        candidateName: '',
                        category: 'constituency',
                        priority: 'medium',
                        tags: [],
                        status: 'draft',
                        isBreaking: false
                      });
                    }}
                    className="text-[#014e5c]/70 hover:text-[#014e5c] transition-colors"
                  >
                    ✕
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#014e5c] mb-2">Title *</label>
                    <input
                      type="text"
                      value={newsFormData.title}
                      onChange={(e) => setNewsFormData(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-3 py-2 border border-[#014e5c]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#014e5c]/50 focus:border-[#014e5c]"
                      placeholder="Enter news title"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#014e5c] mb-2">Category</label>
                    <select
                      value={newsFormData.category}
                      onChange={(e) => setNewsFormData(prev => ({ ...prev, category: e.target.value as any }))}
                      className="w-full px-3 py-2 border border-[#014e5c]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#014e5c]/50 focus:border-[#014e5c]"
                    >
                      <option value="constituency">Constituency News</option>
                      <option value="candidate">Candidate News</option>
                      <option value="general">General News</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#014e5c] mb-2">Constituency</label>
                    <input
                      type="text"
                      value={newsFormData.constituencyName}
                      onChange={(e) => setNewsFormData(prev => ({ ...prev, constituencyName: e.target.value }))}
                      className="w-full px-3 py-2 border border-[#014e5c]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#014e5c]/50 focus:border-[#014e5c]"
                      placeholder="Enter constituency name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#014e5c] mb-2">Candidate (if applicable)</label>
                    <input
                      type="text"
                      value={newsFormData.candidateName}
                      onChange={(e) => setNewsFormData(prev => ({ ...prev, candidateName: e.target.value }))}
                      className="w-full px-3 py-2 border border-[#014e5c]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#014e5c]/50 focus:border-[#014e5c]"
                      placeholder="Enter candidate name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#014e5c] mb-2">Priority</label>
                    <select
                      value={newsFormData.priority}
                      onChange={(e) => setNewsFormData(prev => ({ ...prev, priority: e.target.value as any }))}
                      className="w-full px-3 py-2 border border-[#014e5c]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#014e5c]/50 focus:border-[#014e5c]"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#014e5c] mb-2">Status</label>
                    <select
                      value={newsFormData.status}
                      onChange={(e) => setNewsFormData(prev => ({ ...prev, status: e.target.value as any }))}
                      className="w-full px-3 py-2 border border-[#014e5c]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#014e5c]/50 focus:border-[#014e5c]"
                    >
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>

                  <div className="lg:col-span-2">
                    <label className="block text-sm font-medium text-[#014e5c] mb-2">Excerpt</label>
                    <input
                      type="text"
                      value={newsFormData.excerpt}
                      onChange={(e) => setNewsFormData(prev => ({ ...prev, excerpt: e.target.value }))}
                      className="w-full px-3 py-2 border border-[#014e5c]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#014e5c]/50 focus:border-[#014e5c]"
                      placeholder="Brief summary of the news"
                    />
                  </div>

                  <div className="lg:col-span-2">
                    <label className="block text-sm font-medium text-[#014e5c] mb-2">Content *</label>
                    <textarea
                      value={newsFormData.content}
                      onChange={(e) => setNewsFormData(prev => ({ ...prev, content: e.target.value }))}
                      rows={6}
                      className="w-full px-3 py-2 border border-[#014e5c]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#014e5c]/50 focus:border-[#014e5c]"
                      placeholder="Enter the full news content"
                    />
                  </div>

                  <div className="lg:col-span-2">
                    <label className="block text-sm font-medium text-[#014e5c] mb-2">Tags</label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {newsFormData.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-[#014e5c]/10 text-[#014e5c]"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(tag)}
                            className="ml-1 text-[#014e5c]/70 hover:text-[#014e5c]"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Add a tag"
                        className="flex-1 px-3 py-2 border border-[#014e5c]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#014e5c]/50 focus:border-[#014e5c]"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddTag((e.target as HTMLInputElement).value);
                            (e.target as HTMLInputElement).value = '';
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const input = document.querySelector('input[placeholder="Add a tag"]') as HTMLInputElement;
                          if (input && input.value.trim()) {
                            handleAddTag(input.value);
                            input.value = '';
                          }
                        }}
                        className="px-3 py-2 bg-[#014e5c] text-white rounded-lg hover:bg-[#014e5c]/90 transition-colors"
                      >
                        Add
                      </button>
                    </div>
                  </div>

                  <div className="lg:col-span-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newsFormData.isBreaking}
                        onChange={(e) => setNewsFormData(prev => ({ ...prev, isBreaking: e.target.checked }))}
                        className="rounded border-[#014e5c]/30 text-[#014e5c] focus:ring-[#014e5c]/50"
                      />
                      <span className="ml-2 text-sm text-[#014e5c]">Mark as breaking news</span>
                    </label>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-[#014e5c]/20">
                  <button
                    onClick={() => {
                      setShowNewsForm(false);
                      setEditingNews(null);
                      setNewsFormData({
                        title: '',
                        content: '',
                        excerpt: '',
                        constituencyId: '',
                        constituencyName: '',
                        candidateId: '',
                        candidateName: '',
                        category: 'constituency',
                        priority: 'medium',
                        tags: [],
                        status: 'draft',
                        isBreaking: false
                      });
                    }}
                    className="px-4 py-2 border border-[#014e5c]/30 text-[#014e5c] rounded-lg hover:bg-[#014e5c]/5 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={editingNews ? handleUpdateNews : handleCreateNews}
                    disabled={!newsFormData.title || !newsFormData.content}
                    className="px-4 py-2 bg-[#014e5c] text-white rounded-lg hover:bg-[#014e5c]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {editingNews ? 'Update News' : 'Create News'}
                  </button>
                </div>
              </div>
            )}

            <div className="bg-white shadow-sm border border-[#014e5c]/20 rounded-2xl">
              <div className="px-4 py-5 sm:p-6">
                {dataLoading ? (
                  <div className="text-center py-8">
                    <Loader className="animate-spin h-6 w-6 text-[#014e5c] mx-auto mb-3" />
                    <p className="text-[#014e5c]/70 text-sm">Loading news articles...</p>
                  </div>
                ) : constituencyNews.length === 0 ? (
                  <div className="text-center py-8">
                    <Newspaper className="mx-auto h-10 w-10 text-[#014e5c]/40" />
                    <h3 className="mt-2 text-sm font-medium text-[#014e5c]">No news articles yet</h3>
                    <p className="mt-1 text-sm text-[#014e5c]/70">Start by adding constituency news.</p>
                    <div className="mt-6">
                      <button
                        onClick={() => setShowNewsForm(true)}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-[#014e5c] hover:bg-[#014e5c]/90 transition-colors"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add News
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {constituencyNews.map((news) => (
                      <div key={news.id} className="border border-[#014e5c]/20 rounded-lg p-4 hover:bg-[#014e5c]/2 transition-colors">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="text-lg font-medium text-[#014e5c]">{news.title}</h3>
                              {news.isBreaking && (
                                <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                                  Breaking
                                </span>
                              )}
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                news.status === 'published' ? 'bg-green-100 text-green-800' : 
                                news.status === 'archived' ? 'bg-gray-100 text-gray-800' : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {news.status}
                              </span>
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                news.priority === 'high' ? 'bg-red-100 text-red-800' : 
                                news.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'
                              }`}>
                                {news.priority}
                              </span>
                            </div>
                            <p className="text-sm text-[#014e5c]/70 mb-2">
                              {news.excerpt && <span className="block mb-1">{news.excerpt}</span>}
                              <span className="block">
                                Category: {news.category} • 
                                {news.constituencyName && ` Constituency: ${news.constituencyName}`} • 
                                {news.candidateName && ` Candidate: ${news.candidateName}`} • 
                                {news.createdAt instanceof Date ? news.createdAt.toLocaleDateString() : 'Unknown date'}
                              </span>
                            </p>
                            {news.tags && news.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mb-2">
                                {news.tags.map((tag, index) => (
                                  <span key={index} className="px-2 py-1 text-xs bg-[#014e5c]/10 text-[#014e5c] rounded">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="flex space-x-2 ml-4">
                            <button
                              onClick={() => handleEditNews(news)}
                              className="p-2 text-[#014e5c] hover:bg-[#014e5c]/10 rounded-md transition-colors"
                              title="Edit news"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(`news-${news.id}`)}
                              className="p-2 text-red-600 hover:bg-red-100 rounded-md transition-colors"
                              title="Delete news"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
            </div>

            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                {dataLoading ? (
                  <div className="text-center py-8">
                    <Loader className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-4" />
                    <p className="text-gray-500">Loading users...</p>
                  </div>
                ) : users.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No users yet</h3>
                    <p className="mt-1 text-sm text-gray-500">Users will appear here as they register.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {users.map((user) => (
                          <tr key={user.uid}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {user.displayName || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {user.email}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {user.role || 'user'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {user.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => navigate(`/admin/user/edit/${user.uid}`)}
                                  className="text-blue-600 hover:text-blue-900"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => navigate(`/admin/user/view/${user.uid}`)}
                                  className="text-green-600 hover:text-green-900"
                                >
                                  <Eye className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* JSON Data Management Tab */}
        {activeTab === 'json-data' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">JSON Data Management</h2>
              <div className="flex space-x-2">
                <button
                  onClick={loadAdminData}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Upload JSON Files */}
              <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Upload JSON Data</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Hindi/Devanagari Data</label>
                      <input
                        type="file"
                        accept=".json"
                        onChange={(e) => handleJsonFileUpload(e, 'hindi')}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                      <p className="mt-1 text-xs text-gray-500">Upload candidates.json file</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">English Data</label>
                      <input
                        type="file"
                        accept=".json"
                        onChange={(e) => handleJsonFileUpload(e, 'english')}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                      <p className="mt-1 text-xs text-gray-500">Upload candidates_en.json file</p>
                    </div>

                    <div className="pt-4">
                      <button
                        onClick={handleBulkJsonUpload}
                        disabled={uploadingJson || (!jsonFiles.hindi && !jsonFiles.english)}
                        className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {uploadingJson ? (
                          <>
                            <Loader className="animate-spin h-5 w-5 mr-2" />
                            Uploading... {uploadProgress}%
                          </>
                        ) : (
                          <>
                            <FileText className="h-5 w-5 mr-2" />
                            Upload {jsonFiles.hindi && jsonFiles.english ? 'Both Files' : 'Selected Files'}
                          </>
                        )}
                      </button>
                      
                      {uploadingJson && (
                        <div className="mt-3">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                              style={{ width: `${uploadProgress}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Current Data Status */}
              <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Current Data Status</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                          <FileText className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Hindi Data</p>
                          <p className="text-xs text-gray-500">candidates.json</p>
                        </div>
                      </div>
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                        Active
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                          <FileText className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">English Data</p>
                          <p className="text-xs text-gray-500">candidates_en.json</p>
                        </div>
                      </div>
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                        Active
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Data Preview and Management */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Data Preview & Management</h3>
                <div className="space-y-4">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setActiveTab('constituency-editor')}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
                    >
                      <Edit className="h-5 w-5 mr-2" />
                      Edit Constituency Data
                    </button>
                    <button
                      onClick={() => setActiveTab('candidate-editor')}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                    >
                      <Users className="h-5 w-5 mr-2" />
                      Edit Candidate Data
                    </button>
                    <button
                      onClick={() => setActiveTab('department-editor')}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700"
                    >
                      <BarChart3 className="h-5 w-5 mr-2" />
                      Edit Department Data
                    </button>
                    <button
                      onClick={handleDownloadJsonData}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                    >
                      <FileText className="h-5 w-5 mr-2" />
                      Download JSON
                    </button>
                  </div>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-blue-800 mb-2">How it works:</h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• Upload your updated JSON files to replace the current data</li>
                      <li>• Use the editors to make individual changes to constituencies, candidates, or departments</li>
                      <li>• All changes are saved to the database and immediately available across the app</li>
                      <li>• You can download the updated JSON files anytime</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">System Settings</h2>
            
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">General Settings</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Site Name</label>
                    <input
                      type="text"
                      defaultValue="Charcha Manch"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Maintenance Mode</label>
                    <div className="mt-1">
                      <label className="inline-flex items-center">
                        <input type="checkbox" className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50" />
                        <span className="ml-2 text-sm text-gray-900">Enable maintenance mode</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md mx-4 shadow-2xl">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {deleteConfirm.startsWith('news-') ? 'Delete Constituency News' : 'Delete Blog'}
              </h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this {deleteConfirm.startsWith('news-') ? 'constituency news' : 'blog'}? 
                <br />
                <span className="font-medium text-red-600">This action cannot be undone.</span>
              </p>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-medium hover:border-gray-400 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (deleteConfirm.startsWith('news-')) {
                      handleDeleteConstituencyNews(deleteConfirm.replace('news-', ''));
                    } else {
                      handleDeleteBlog(deleteConfirm);
                    }
                  }}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center"
                >
                  {isDeleting ? (
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
    </div>
  );
};

export default AdminPanel;
