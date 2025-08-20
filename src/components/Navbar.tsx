import React, { useState, useRef, useEffect } from "react";
import { Link,useLocation } from "react-router-dom";
import { Menu, X, User, ToggleRight, ToggleLeft } from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const { isEnglish, toggleLanguage } = useLanguage();
  const profileRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navItems = isEnglish
    ? [
        { name: "Home", href: "/" },
        { name: "Constituencies", href: "/constituency/all-constituencies?showAll=true" },
        { name: "About", href: "/about" },
        { name: "Your Constituency", href: "/aapka-shetra" },
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
              src="images/logo.png"
              className="h-7 w-7 max-[360px]:h-4 max-[360px]:w-4 sm:h-9 sm:w-9 md:h-9 md:w-9 lg:h-11 lg:w-11 object-contain"
              alt="Logo"
            />
          </div>

          {/* Logo fixed left */}
          <Link to="/" className="absolute left-1/2 -translate-x-1/2 flex items-center min-w-0">
            <img src='images/charchagram.png' className='w-40 h-auto max-[340px]:w-30 sm:h-auto sm:w-50 shrink-0 mx-1' />
          </Link>
          {/* Right section (profile + menu) */}
          <div className="flex items-center space-x-2 sm:space-x-4 shrink-0">
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setShowProfile((prev) => !prev)}
                className="p-1.5 sm:p-2 rounded-full hover:text-blue-600"
              >
                <User className="h-4 w-4 max-[340px]:h-3 sm:h-6 sm:w-6 text-gray-700" />
              </button>
              {showProfile && (
                <div className="absolute right-0 mt-2 w-48 bg-white border rounded-lg shadow-lg py-2 z-50">
                  {isLoggedIn ? (
                    <>
                      <Link
                        to="/profile"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        My Profile
                      </Link>
                      <Link
                        to="/settings"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Settings
                      </Link>
                      <button
                        onClick={() => {
                          setIsLoggedIn(false);
                          setShowProfile(false);
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Log out
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        to="/login"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        {isEnglish ? "Log in" : "लॉग इन"}
                      </Link>
                      <Link
                        to="/register"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        {isEnglish ? "Register" : "रजिस्टर"}
                      </Link>
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
