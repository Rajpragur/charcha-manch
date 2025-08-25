import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import About from './pages/About';
import Contact from './pages/Contact';
import BlogPost from './pages/BlogPost';
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
import ProtectedAdminRoute from './components/ProtectedAdminRoute';
import AdminPanel from './pages/AdminPanel';
import AdminSetup from './pages/AdminSetup';
import './App.css';

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
                  <Route path="/" element={<Home />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/blog" element={<BlogPost />}/>
                  <Route path="/constituency/:constituencySlug" element={<Constituency />} />
                  <Route path="/constituency/:constituencyId" element={<ConstituencyDetails />} />
                  <Route path="/aapka-kshetra" element={<AapkaKshetra />} />
                  <Route path="/signup" element={<Signup />} />
                  <Route path="/signin" element={<Signin />} />
                  <Route path="/onboarding" element={<Onboarding />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route 
                    path="/admin" 
                    element={<AdminPanel />} 
                  />
                  <Route 
                    path="/admin-setup" 
                    element={<AdminSetup />} 
                  />
                </Routes>
              </main>
            </div>
          </Router>
        </AdminProvider>
      </AuthProvider>
    </LanguageProvider>
  );
};

export default App;