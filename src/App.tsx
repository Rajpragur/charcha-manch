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
import { LanguageProvider } from './contexts/LanguageContext';
import { AuthProvider } from './contexts/AuthContext';
import Signup from './components/Signup';
import Signin from './components/Signin';
import Onboarding from './components/Onboarding';
import './App.css';

const App: React.FC = () => {
  return (
    <LanguageProvider>
      <AuthProvider>
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
                <Route path="/signup" element={<Signup />} />
                <Route path="/signin" element={<Signin />} />
                <Route path="/onboarding" element={<Onboarding />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/settings" element={<Settings />} />
              </Routes>
            </main>
          </div>
        </Router>
      </AuthProvider>
    </LanguageProvider>
  );
};

export default App;