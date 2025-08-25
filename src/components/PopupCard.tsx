import React from 'react';

interface PopupCardProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: 'success' | 'error' | 'info';
  showCloseButton?: boolean;
}

const PopupCard: React.FC<PopupCardProps> = ({
  isOpen,
  onClose,
  title,
  message,
  type = 'info',
  showCloseButton = true
}) => {
  if (!isOpen) return null;

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return 'border-green-500 bg-green-50';
      case 'error':
        return 'border-red-500 bg-red-50';
      case 'info':
      default:
        return 'border-blue-500 bg-blue-50';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return (
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        );
      case 'error':
        return (
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        );
      case 'info':
      default:
        return (
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
            <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className={`relative w-full max-w-md rounded-lg border-2 p-6 shadow-lg ${getTypeStyles()} bg-white`}>
        {/* Icon */}
        {getIcon()}
        
        {/* Title */}
        <h3 className="mt-4 text-center text-lg font-medium text-gray-900">
          {title}
        </h3>
        
        {/* Message */}
        <p className="mt-2 text-center text-sm text-gray-600">
          {message}
        </p>
        
        {/* Close Button */}
        {showCloseButton && (
          <div className="mt-6 flex justify-center">
            <button
              onClick={onClose}
              className="rounded-md bg-gray-600 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Close
            </button>
          </div>
        )}
        
        {/* Auto-close after 3 seconds for success messages */}
        {type === 'success' && (
          <div className="mt-4">
            <div className="h-1 w-full bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-green-500 transition-all duration-3000 ease-linear animate-shrink"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PopupCard;
