import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { X } from 'lucide-react';

interface SignInPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

const SignInPopup: React.FC<SignInPopupProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { isEnglish } = useLanguage();

  const content = {
    title: isEnglish ? 'Sign In Required' : 'साइन इन आवश्यक है',
    message: isEnglish ? 'You need to be signed in to like blogs. Please sign in or create an account to continue.' : 'ब्लॉग्स को लाइक करने के लिए आपको साइन इन करना होगा। कृपया जारी रखने के लिए साइन इन करें या खाता बनाएं।',
    signIn: isEnglish ? 'Sign In' : 'साइन इन करें',
    signUp: isEnglish ? 'Sign Up' : 'साइन अप करें',
    cancel: isEnglish ? 'Cancel' : 'रद्द करें'
  };

  if (!isOpen) return null;

  const handleSignIn = () => {
    onClose();
    navigate('/signin');
  };

  const handleSignUp = () => {
    onClose();
    navigate('/signup');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Content */}
        <div className="text-center">
          <div className="text-amber-500 text-4xl mb-4">🔒</div>
          <h2 className="text-xl font-bold text-gray-900 mb-3">
            {content.title}
          </h2>
          <p className="text-gray-600 mb-6 leading-relaxed">
            {content.message}
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleSignIn}
              className="flex-1 bg-sky-600 text-white px-6 py-3 rounded-lg hover:bg-sky-700 transition-colors font-medium"
            >
              {content.signIn}
            </button>
            <button
              onClick={handleSignUp}
              className="flex-1 bg-slate-100 text-slate-700 px-6 py-3 rounded-lg hover:bg-slate-200 transition-colors font-medium"
            >
              {content.signUp}
            </button>
          </div>

          <button
            onClick={onClose}
            className="mt-4 text-gray-500 hover:text-gray-700 transition-colors text-sm"
          >
            {content.cancel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SignInPopup;
