import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import About from './pages/About';
import Contact from './pages/Contact';
import BlogPost from './pages/BlogPost';
import BlogDetail from './pages/BlogDetail';
import DiscussionForum from  './pages/DiscussionForum';
import Constituency from './pages/Constituency';
import ConstituencyDetails from './pages/ConstituencyDetails';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import AapkaKshetra from './pages/AapkaKshetra';
import { LanguageProvider } from './contexts/LanguageContext';
import { AuthProvider } from './contexts/AuthContext';
import { AdminProvider } from './contexts/AdminContext';
import Signup from './components/Signup';
import Signin from './components/Signin';
import Onboarding from './components/Onboarding';
import ProtectedRoute from './components/ProtectedRoute';

import AdminPanel from './pages/AdminPanel';
import AdminSetup from './pages/AdminSetup';
import BlogCreate from './pages/BlogCreate';
import PostDetail from './pages/PostDetail';
import './App.css';
import Footer from './components/Footer';

const App: React.FC = () => {
  return (
    <LanguageProvider>
      <AuthProvider>
        <AdminProvider>
          <Router>
            <div className="App min-h-screen flex flex-col">
              <Navbar />
              <main className="flex-grow">
                <Routes>
                  {/* Public routes - no authentication required */}
                  <Route path="/" element={<Home />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/blog" element={<BlogPost />} />
                  <Route path="/blog/:blogId" element={<BlogDetail />} />
                  <Route path="/signup" element={<Signup />} />
                  <Route path="/signin" element={<Signin />} />

                  {/* Onboarding route - requires authentication but not onboarding completion */}
                  <Route path="/onboarding" element={
                    <ProtectedRoute requireOnboarding={false}>
                      <Onboarding />
                    </ProtectedRoute>
                  } />

                  {/* Admin routes - require authentication and admin role */}
                  <Route path="/admin" element={<ProtectedRoute><AdminPanel /></ProtectedRoute>} />
                  <Route path="/admin-setup" element={<ProtectedRoute><AdminSetup /></ProtectedRoute>} />
                  <Route path="/admin/blog/create" element={<ProtectedRoute><BlogCreate /></ProtectedRoute>} />
                  <Route path="/admin/blog/edit/:blogId" element={<ProtectedRoute><BlogCreate /></ProtectedRoute>} />

                  {/* Protected routes - require authentication AND onboarding completion */}
                  <Route path="/discussion" element={<ProtectedRoute><DiscussionForum /></ProtectedRoute>} />
                  <Route path="/post/:postId" element={<ProtectedRoute><PostDetail /></ProtectedRoute>} />
                  <Route path="/constituency/:constituencySlug" element={<ProtectedRoute><Constituency /></ProtectedRoute>} />
                  <Route path="/constituency/:constituencyId" element={<ProtectedRoute><ConstituencyDetails /></ProtectedRoute>} />
                  <Route path="/aapka-kshetra" element={<ProtectedRoute><AapkaKshetra /></ProtectedRoute>} />
                  <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                  <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                  <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                </Routes>
              </main>
              <div className="pb-20 lg:pb-24">
                <Footer />
              </div>
              <Toaster 
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: '#363636',
                    color: '#fff',
                  },
                  success: {
                    duration: 3000,
                    iconTheme: {
                      primary: '#10b981',
                      secondary: '#fff',
                    },
                  },
                  error: {
                    duration: 4000,
                    iconTheme: {
                      primary: '#ef4444',
                      secondary: '#fff',
                    },
                  },
                }}
              />
            </div>
          </Router>
        </AdminProvider>
      </AuthProvider>
    </LanguageProvider>
  );
};

export default App;