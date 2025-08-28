import React from 'react';
import { useLocation } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

const BottomBar: React.FC = () => {
  const location = useLocation();
  const { isEnglish } = useLanguage();

  const navItems = [
    {
      path: '/',
      icon: '/homeicon.svg',
      label: isEnglish ? 'Home' : 'होम',
      active: location.pathname === '/'
    },
    {
      path: '/discussion',
      icon: '/charchaicon.svg',
      label: isEnglish ? 'Discussion Forum' : 'चर्चा मंच',
      active: location.pathname === '/discussion'
    },
    {
      path: '/aapka-kshetra',
      icon: '/yourareaicon.svg',
      label: isEnglish ? 'Your Area' : 'आपका क्षेत्र',
      active: location.pathname === '/aapka-kshetra'
    }
  ];

  return (
    <>
      {/* Mobile Bottom Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-20 shadow-lg">
        <div className="flex justify-around items-center h-16 px-4">
          {navItems.map((item) => (
            <a
              key={item.path}
              href={item.path}
              className="flex flex-col items-center space-y-1"
            >
              <div className={`w-16 h-8 rounded-full flex items-center justify-center ${
                item.active ? 'bg-[#E4E6E8]' : 'bg-transparent'
              }`}>
                <img 
                  src={item.icon} 
                  alt={item.label} 
                  className="w-6 h-6"
                />
              </div>
              <span className={`text-xs font-semibold text-black ${
                item.active ? 'font-semibold' : 'font-medium'
              }`}>
                {item.label}
              </span>
            </a>
          ))}
        </div>
      </div>

      {/* Desktop Bottom Bar */}
      <div className="hidden lg:block fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-20 shadow-lg">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex justify-around items-center h-16">
            {navItems.map((item) => (
              <a
                key={item.path}
                href={item.path}
                className="flex flex-col items-center space-y-1"
              >
                <div className={`w-16 h-8 rounded-full flex items-center justify-center ${
                  item.active ? 'bg-[#E4E6E8]' : 'bg-transparent'
                }`}>
                  <img 
                    src={item.icon} 
                    alt={item.label} 
                    className="w-6 h-6"
                  />
                </div>
                <span className={`text-xs font-semibold text-black ${
                  item.active ? 'font-semibold' : 'font-medium'
                }`}>
                  {item.label}
                </span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default BottomBar;
