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

import AdminPanel from './pages/AdminPanel';
import AdminSetup from './pages/AdminSetup';
import BlogCreate from './pages/BlogCreate';
import PostDetail from './pages/PostDetail';
import './App.css';

const App: React.FC = () => {
  return (
    <LanguageProvider>
      <AuthProvider>
        <AdminProvider>
          <Router>
            <div className="App min-h-screen flex flex-col">
              <Navbar />
              <main className="flex-grow pb-20 lg:pb-24">
                <Routes>
                  {/* Public routes - no constituency check needed */}
                  <Route path="/signup" element={<Signup />} />
                  <Route path="/signin" element={<Signin />} />
                  <Route path="/onboarding" element={<Onboarding />} />
                  <Route path="/admin" element={<AdminPanel />} />
                  <Route path="/admin-setup" element={<AdminSetup />} />
                  <Route path="/admin/blog/create" element={<BlogCreate />} />
                  <Route path="/admin/blog/edit/:blogId" element={<BlogCreate />} />
                  
                  {/* Main routes - no constituency restrictions */}
                  <Route path="/" element={<Home />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/blog" element={<BlogPost />} />
                  <Route path="/blog/:blogId" element={<BlogDetail />} />
                  <Route path="/discussion" element={<DiscussionForum />} />
                  <Route path="/post/:postId" element={<PostDetail />} />
                  <Route path="/constituency/:constituencySlug" element={<Constituency />} />
                  <Route path="/constituency/:constituencyId" element={<ConstituencyDetails />} />
                  <Route path="/aapka-kshetra" element={<AapkaKshetra />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/settings" element={<Settings />} />
                </Routes>
              </main>
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