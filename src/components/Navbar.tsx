import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, User, ToggleRight, ToggleLeft, LogOut, Settings, LogIn, UserPlus } from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";
import { useAuth } from "../contexts/AuthContext";

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const { isEnglish, toggleLanguage } = useLanguage();
  const { currentUser, logout } = useAuth();
  const profileRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  
  const navItems = isEnglish
    ? [
        { name: "Home", href: "/" },
        { name: "Constituencies", href: "/constituency/all-constituencies?showAll=true" },
        { name: "About", href: "/about" },
        { name: "Aapka Kshetra", href: "/aapka-shetra" },
        { name: "Forum", href: "/discussion-forum" },
        { name: "Blog", href: "/blog" },
        { name: "Contact", href: "/contact" },
      ]
    : [
        { name: "होम", href: "/" },
        { name: "निर्वाचन क्षेत्र", href: "/constituency/all-constituencies?showAll=true" },
        { name: "परिचय", href: "/about" },
        { name: "आपका क्षेत्र", href: "/aapka-shetra" },
        { name: "चर्चा मंच", href: "/discussion-forum" },
        { name: "ब्लॉग", href: "/blog" },
        { name: "संपर्क", href: "/contact" },
      ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      ) {
        setShowProfile(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      setShowProfile(false);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50 w-full overflow-x-clip">
      <div className="w-full px-2 sm:px-4 lg:px-6">
        <div className="flex justify-between items-center h-16 relative">
          {/* Language Toggle */}
          <div className="flex items-center gap- lg:gap-4 justify-start">
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-2 px-1.5 sm:px-3 py-1 rounded-lg hover:text-blue-600 shrink-0"
            >
              {isEnglish ? (
                <ToggleLeft className="h-4 w-4 max-[340px]:h-3 sm:h-5 sm:w-5 md:h-6 md:w-6" />
              ) : (
                <ToggleRight className="h-4 w-4 max-[340px]:h-3 sm:h-5 sm:w-5 md:h-6 md:w-6" />
              )}
              <span className="hidden sm:inline text-xs font-medium">
                {isEnglish ? "EN" : "HI"}
              </span>
            </button>
            <img
              src="/images/logo.png"
              className="h-7 w-7 max-[360px]:h-4 max-[360px]:w-4 sm:h-9 sm:w-9 md:h-9 md:w-9 lg:h-11 lg:w-11 object-contain"
              alt="Logo"
            />
          </div>

          {/* Logo fixed left */}
          <Link to="/" className="absolute left-1/2 -translate-x-1/2 flex items-center min-w-0">
            <img src='/images/charchagram.png' className='w-40 h-auto max-[340px]:w-30 sm:h-auto sm:w-50 shrink-0 mx-1' />
          </Link>
          
          {/* Right section (profile + menu) */}
          <div className="flex items-center space-x-2 sm:space-x-4 shrink-0">
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setShowProfile((prev) => !prev)}
                className="p-1.5 sm:p-2 rounded-full hover:text-blue-600 transition-colors"
              >
                {currentUser ? (
                  <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gradient-to-r from-sky-500 to-blue-600 flex items-center justify-center text-white text-xs font-semibold">
                    {currentUser.email?.charAt(0).toUpperCase() || 'U'}
                  </div>
                ) : (
                  <User className="h-4 w-4 max-[340px]:h-3 sm:h-6 sm:w-6 text-gray-700" />
                )}
              </button>
              {showProfile && (
                <div className="absolute right-0 mt-3 w-56 bg-white border border-gray-200 rounded-xl shadow-xl py-3 z-50 backdrop-blur-sm bg-white/95">
                  {currentUser ? (
                    <>
                      <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-green-50 to-emerald-50">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                            {currentUser.displayName?.charAt(0).toUpperCase() || currentUser.email?.charAt(0).toUpperCase() || 'U'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">
                              {currentUser.displayName || 'User'}
                            </p>
                            <p className="text-xs text-gray-600 truncate">
                              {currentUser.email}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="py-2">
                        <Link
                          to="/dashboard"
                          className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 transition-all duration-200 rounded-lg mx-2"
                        >
                          <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                            <User className="h-4 w-4 text-green-600" />
                          </div>
                          <span className="font-medium">{isEnglish ? "Dashboard" : "डैशबोर्ड"}</span>
                        </Link>
                        <Link
                          to="/profile"
                          className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 transition-all duration-200 rounded-lg mx-2"
                        >
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                            <User className="h-4 w-4 text-blue-600" />
                          </div>
                          <span className="font-medium">{isEnglish ? "My Profile" : "मेरी प्रोफाइल"}</span>
                        </Link>
                        <Link
                          to="/settings"
                          className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 transition-all duration-200 rounded-lg mx-2"
                        >
                          <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                            <Settings className="h-4 w-4 text-purple-600" />
                          </div>
                          <span className="font-medium">{isEnglish ? "Settings" : "सेटिंग्स"}</span>
                        </Link>
                        <div className="border-t border-gray-100 my-2"></div>
                        <button
                          onClick={handleLogout}
                          className="flex items-center w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-all duration-200 rounded-lg mx-2"
                        >
                          <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center mr-3">
                            <LogOut className="h-4 w-4 text-red-600" />
                          </div>
                          <span className="font-medium">{isEnglish ? "Log out" : "लॉग आउट"}</span>
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-green-50 to-emerald-50">
                        <p className="text-sm font-medium text-gray-700 text-center">
                          {isEnglish ? "Welcome to Charcha Manch" : "चर्चा मंच में आपका स्वागत है"}
                        </p>
                      </div>
                      <div className="py-2">
                        <Link
                          to="/signin"
                          className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 transition-all duration-200 rounded-lg mx-2"
                        >
                          <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                            <LogIn className="h-4 w-4 text-green-600" />
                          </div>
                          <span className="font-medium">{isEnglish ? "Sign In" : "साइन इन"}</span>
                        </Link>
                        <Link
                          to="/signup"
                          className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 transition-all duration-200 rounded-lg mx-2"
                        >
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                            <UserPlus className="h-4 w-4 text-blue-600" />
                          </div>
                          <span className="font-medium">{isEnglish ? "Sign Up" : "साइन अप"}</span>
                        </Link>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden inline-flex items-center justify-center p-1.5 sm:p-2 rounded-md hover:text-blue-600"
            >
              {isOpen ? (
                <X className="h-4 w-4 max-[340px]:h-3 sm:h-6 sm:w-6" />
              ) : (
                <Menu className="h-4 w-4 max-[340px]:h-3 sm:h-6 sm:w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Desktop nav */}
      <div className="bg-gray-50 w-full">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="hidden md:flex justify-center space-x-6 py-2">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                  location.pathname === item.href
                    ? "text-blue-600 bg-blue-100"
                    : "text-gray-700 hover:text-blue-600 hover:bg-gray-100"
                }`}
              >
                {item.name}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile nav */}
      {isOpen && (
        <div className="md:hidden bg-gray-50 border-t w-full">
          <div className="px-4 pt-2 pb-4 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setIsOpen(false)}
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  location.pathname === item.href
                    ? "text-blue-600 bg-blue-100"
                    : "text-gray-700 hover:text-blue-600 hover:bg-gray-100"
                }`}
              >
                {item.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
