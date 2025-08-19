import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

const LanguageExample: React.FC = () => {
  const { isEnglish, toggleLanguage } = useLanguage();

  const content = {
    title: isEnglish ? 'Language Example Component' : 'भाषा उदाहरण कंपोनेंट',
    description: isEnglish 
      ? 'This component demonstrates how to use the global language context in any component.'
      : 'यह कंपोनेंट दिखाता है कि किसी भी कंपोनेंट में वैश्विक भाषा संदर्भ का उपयोग कैसे करें।',
    buttonText: isEnglish ? 'Toggle Language' : 'भाषा बदलें',
    currentLanguage: isEnglish ? 'Current Language: English' : 'वर्तमान भाषा: हिंदी'
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md max-w-md mx-auto mt-8">
      <h2 className="text-xl font-bold text-gray-800 mb-4">
        {content.title}
      </h2>
      
      <p className="text-gray-600 mb-4">
        {content.description}
      </p>
      
      <div className="mb-4 p-3 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-800">
          {content.currentLanguage}
        </p>
      </div>
      
      <button
        onClick={toggleLanguage}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
      >
        {content.buttonText}
      </button>
    </div>
  );
};

export default LanguageExample;
