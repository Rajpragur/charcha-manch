import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useAdmin } from '../contexts/AdminContext';
import AdminStatusDebug from '../components/AdminStatusDebug';
import { collection, getDocs, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../configs/firebase';
import { 
  Users, 
  MapPin, 
  BarChart3, 
  Settings, 
  Shield, 
  Edit,
  Trash2,
  Plus,
  Search,
  FileText,
  Newspaper,
  Eye,
  Loader,
  ThumbsUp,
  MessageSquare
} from 'lucide-react';
import { doc, deleteDoc } from 'firebase/firestore';

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
  constituencyName: string;
  status: 'draft' | 'published';
  createdAt: Date;
}

interface User {
  uid: string;
  email: string;
  displayName: string;
  role: string;
  createdAt: Date;
  isActive: boolean;
}

// Only allow the specific authorized admin UID to access admin setup
const AUTHORIZED_ADMIN_UID = '4zCKNy2r4tNAMdtnLUINpmzuyU52';

const AdminPanel: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, logout, loading: authLoading } = useAuth();
  const { isAdmin, adminLevel, loading } = useAdmin();
  
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Real data from database
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [constituencies, setConstituencies] = useState<Constituency[]>([]);
  const [constituencyNews, setConstituencyNews] = useState<ConstituencyNews[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (loading || authLoading) return;
    
    if (isAdmin) {
      console.log('✅ User is admin, loading admin data');
      loadAdminData();
    }
  }, [loading, isAdmin, authLoading]);

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
          const usersQuery = query(collection(db, 'users'));
          const usersSnapshot = await getDocs(usersQuery);
          const usersData = usersSnapshot.docs.map(doc => ({
            uid: doc.id,
            ...doc.data()
          })) as User[];
          setUsers(usersData);
          console.log('✅ Users loaded successfully:', usersData.length);
        } else {
          console.log('⚠️ User is not admin, skipping users fetch');
          setUsers([]);
        }
      } catch (error) {
        console.error('❌ Error loading users:', error);
        setUsers([]);
      }
      
    } catch (error) {
      console.error('❌ General error in loadAdminData:', error);
    } finally {
      setDataLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Error logging out:', error);
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
            {currentUser?.uid === AUTHORIZED_ADMIN_UID ? (
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">Charcha Manch Admin Panel</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">Welcome, {currentUser?.email}</span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'dashboard', name: 'Dashboard', icon: BarChart3 },
              { id: 'blogs', name: 'Blogs', icon: FileText },
              { id: 'constituencies', name: 'Constituencies', icon: MapPin },
              { id: 'constituency-news', name: 'Constituency News', icon: Newspaper },
              { id: 'users', name: 'Users', icon: Users },
              { id: 'settings', name: 'Settings', icon: Settings }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-5 w-5 inline mr-2" />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Information Banner */}
        {!dataLoading && totalUsers === 0 && totalBlogs === 0 && totalConstituencies === 0 && totalNews === 0 && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">Welcome to Your Admin Panel!</h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>This is your new admin panel. Currently, there's no data in the system. Here's how to get started:</p>
                  <ul className="mt-2 space-y-1">
                    <li>• <strong>Blogs:</strong> Create blog posts that will be visible to all users</li>
                    <li>• <strong>Constituencies:</strong> Add constituency information and demographic data</li>
                    <li>• <strong>News:</strong> Publish constituency-specific news articles</li>
                    <li>• <strong>Users:</strong> Monitor user registrations and activity</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <Users className="h-6 w-6 text-gray-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Total Users</dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {dataLoading ? <Loader className="animate-spin h-5 w-5" /> : totalUsers}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <FileText className="h-6 w-6 text-gray-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Total Blogs</dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {dataLoading ? <Loader className="animate-spin h-5 w-5" /> : totalBlogs}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <MapPin className="h-6 w-6 text-gray-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Constituencies</dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {dataLoading ? <Loader className="animate-spin h-5 w-5" /> : totalConstituencies}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <Newspaper className="h-6 w-6 text-gray-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">News Articles</dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {dataLoading ? <Loader className="animate-spin h-5 w-5" /> : totalNews}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Detailed Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Blog Statistics</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Published</span>
                      <span className="text-sm font-medium text-gray-900">{publishedBlogs}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Drafts</span>
                      <span className="text-sm font-medium text-gray-900">{draftBlogs}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Total</span>
                      <span className="text-sm font-medium text-gray-900">{totalBlogs}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">User Statistics</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Active Users</span>
                      <span className="text-sm font-medium text-gray-900">{activeUsers}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Total Users</span>
                      <span className="text-sm font-medium text-gray-900">{totalUsers}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">News Articles</span>
                      <span className="text-sm font-medium text-gray-900">{publishedNews}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button
                    onClick={() => setActiveTab('blogs')}
                    className="flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Create New Blog
                  </button>
                  <button
                    onClick={() => setActiveTab('constituency-news')}
                    className="flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Add Constituency News
                  </button>
                  <button
                    onClick={() => setActiveTab('constituencies')}
                    className="flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
                  >
                    <Edit className="h-5 w-5 mr-2" />
                    Update Constituency Data
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Blogs Tab */}
        {activeTab === 'blogs' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Blog Management</h2>
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
                <button
                  onClick={() => navigate('/admin/blog/create')}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Create New Blog
                </button>
              </div>
            </div>

            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                {dataLoading ? (
                  <div className="text-center py-8">
                    <Loader className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-4" />
                    <p className="text-gray-500">Loading blogs...</p>
                  </div>
                ) : blogs.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No blogs yet</h3>
                    <p className="mt-1 text-sm text-gray-500">Get started by creating your first blog post.</p>
                    <div className="mt-6">
                      <button
                        onClick={() => navigate('/admin/blog/create')}
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                      >
                        <Plus className="h-5 w-5 mr-2" />
                        Create Blog
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {blogs.map((blog) => (
                      <div key={blog.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="text-lg font-medium text-gray-900">{blog.title}</h3>
                            <p className="text-sm text-gray-500 mt-1">
                              By {blog.author} • {blog.createdAt instanceof Date ? blog.createdAt.toLocaleDateString() : 'Unknown date'}
                            </p>
                            <div className="flex items-center mt-2 space-x-2">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                blog.status === 'published' ? 'bg-green-100 text-green-800' :
                                blog.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {blog.status}
                              </span>
                              {blog.category && (
                                <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                                  {blog.category}
                                </span>
                              )}
                              {blog.featured && (
                                <span className="px-2 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-800">
                                  Featured
                                </span>
                              )}
                            </div>
                            <div className="flex items-center mt-2 space-x-4 text-xs text-gray-500">
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
                          <div className="flex space-x-2 ml-4">
                            <button
                              onClick={() => navigate(`/admin/blog/edit/${blog.id}`)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-md"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(blog.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-md hover:bg-red-100 transition-colors"
                              title="Delete blog"
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

        {/* Constituencies Tab */}
        {activeTab === 'constituencies' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Constituency Management</h2>
              <button
                onClick={() => navigate('/admin/constituency/create')}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-5 w-5 mr-2" />
                Add New Constituency
              </button>
            </div>

            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                {dataLoading ? (
                  <div className="text-center py-8">
                    <Loader className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-4" />
                    <p className="text-gray-500">Loading constituencies...</p>
                  </div>
                ) : constituencies.length === 0 ? (
                  <div className="text-center py-8">
                    <MapPin className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No constituencies yet</h3>
                    <p className="mt-1 text-sm text-gray-500 mb-4">
                      Start by adding constituency information. You can add details like name, state, voter count, and other demographic information.
                    </p>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                      <h4 className="text-sm font-medium text-blue-800 mb-2">Getting Started:</h4>
                      <ul className="text-sm text-blue-700 space-y-1">
                        <li>• Click "Add New Constituency" to create your first constituency</li>
                        <li>• Include key information like name, state, and voter count</li>
                        <li>• Add demographic data like population and literacy rate</li>
                        <li>• Provide a description of the constituency</li>
                      </ul>
                    </div>
                    <div className="mt-6">
                      <button
                        onClick={() => navigate('/admin/constituency/create')}
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                      >
                        <Plus className="h-5 w-5 mr-2" />
                        Add Constituency
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">State</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Voters</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {constituencies.map((constituency) => (
                          <tr key={constituency.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {constituency.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {constituency.state}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {constituency.totalVoters?.toLocaleString() || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => navigate(`/admin/constituency/edit/${constituency.id}`)}
                                  className="text-blue-600 hover:text-blue-900"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => navigate(`/admin/constituency/view/${constituency.id}`)}
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

        {/* Constituency News Tab */}
        {activeTab === 'constituency-news' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Constituency News Management</h2>
              <button
                onClick={() => navigate('/admin/constituency-news/create')}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-5 w-5 mr-2" />
                Add News Article
              </button>
            </div>

            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                {dataLoading ? (
                  <div className="text-center py-8">
                    <Loader className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-4" />
                    <p className="text-gray-500">Loading news articles...</p>
                  </div>
                ) : constituencyNews.length === 0 ? (
                  <div className="text-center py-8">
                    <Newspaper className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No news articles yet</h3>
                    <p className="mt-1 text-sm text-gray-500">Start by adding constituency news.</p>
                    <div className="mt-6">
                      <button
                        onClick={() => navigate('/admin/constituency-news/create')}
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                      >
                        <Plus className="h-5 w-5 mr-2" />
                        Add News
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {constituencyNews.map((news) => (
                      <div key={news.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="text-lg font-medium text-gray-900">{news.title}</h3>
                            <p className="text-sm text-gray-500 mt-1">
                              Constituency: {news.constituencyName} • {news.createdAt instanceof Date ? news.createdAt.toLocaleDateString() : 'Unknown date'}
                            </p>
                            <div className="flex items-center mt-2">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                news.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {news.status}
                              </span>
                            </div>
                          </div>
                          <div className="flex space-x-2 ml-4">
                            <button
                              onClick={() => navigate(`/admin/constituency-news/edit/${news.id}`)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-md"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(`news-${news.id}`)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-md hover:bg-red-100 transition-colors"
                              title="Delete constituency news"
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
      
      {/* Admin Status Debug Component */}
      <AdminStatusDebug />
    </div>
  );
};

export default AdminPanel;
