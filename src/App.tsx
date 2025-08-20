import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import About from './pages/About';
import Contact from './pages/Contact';
import BlogPost from './pages/BlogPost';
import { LanguageProvider } from './contexts/LanguageContext';
import './App.css';

const App: React.FC = () => {
  return (
    <LanguageProvider>
      <Router>
        <div className="App min-h-screen flex flex-col">
          <Navbar />
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/blog" element={<BlogPost />}/>
            </Routes>
          </main>
        </div>
      </Router>
    </LanguageProvider>
  );
};

export default App;