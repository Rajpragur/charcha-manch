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
import ConstituencyCheck from './components/ConstituencyCheck';
import './App.css';

const App: React.FC = () => {
  return (
    <LanguageProvider>
      <AuthProvider>
        <AdminProvider>
          <Router>
            <div className="App min-h-screen flex flex-col">
              <Navbar />
              <main className="flex-grow pb-20 md:pb-0">
                <Routes>
                  {/* Public routes - no constituency check needed */}
                  <Route path="/signup" element={<Signup />} />
                  <Route path="/signin" element={<Signin />} />
                  <Route path="/onboarding" element={<Onboarding />} />
                  <Route path="/admin" element={<AdminPanel />} />
                  <Route path="/admin-setup" element={<AdminSetup />} />
                  <Route path="/admin/blog/create" element={<BlogCreate />} />
                  <Route path="/admin/blog/edit/:blogId" element={<BlogCreate />} />
                  <Route path="/" element={
                    <ConstituencyCheck>
                      <Home />
                    </ConstituencyCheck>
                  } />
                  <Route path="/about" element={
                    <ConstituencyCheck>
                      <About />
                    </ConstituencyCheck>
                  } />
                  <Route path="/contact" element={
                    <ConstituencyCheck>
                      <Contact />
                    </ConstituencyCheck>
                  } />
                  <Route path="/blog" element={
                    <ConstituencyCheck>
                      <BlogPost />
                    </ConstituencyCheck>
                  } />
                  <Route path="/blog/:blogId" element={
                    <ConstituencyCheck>
                      <BlogDetail />
                    </ConstituencyCheck>
                  } />
                  <Route path="/discussion" element={
                    <ConstituencyCheck>
                      <DiscussionForum />
                    </ConstituencyCheck>
                  } />
                  <Route path="/post/:postId" element={
                    <ConstituencyCheck>
                      <PostDetail />
                    </ConstituencyCheck>
                  } />
                  <Route path="/constituency/:constituencySlug" element={
                    <ConstituencyCheck>
                      <Constituency />
                    </ConstituencyCheck>
                  } />
                  <Route path="/constituency/:constituencyId" element={
                    <ConstituencyCheck>
                      <ConstituencyDetails />
                    </ConstituencyCheck>
                  } />
                  <Route path="/aapka-kshetra" element={
                    <ConstituencyCheck>
                      <AapkaKshetra />
                    </ConstituencyCheck>
                  } />
                  <Route path="/dashboard" element={
                    <ConstituencyCheck>
                      <Dashboard />
                    </ConstituencyCheck>
                  } />
                  <Route path="/profile" element={
                    <ConstituencyCheck>
                      <Profile />
                    </ConstituencyCheck>
                  } />
                  <Route path="/settings" element={
                    <ConstituencyCheck>
                      <Settings />
                    </ConstituencyCheck>
                  } />
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