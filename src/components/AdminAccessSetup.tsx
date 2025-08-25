import React, { useState } from 'react';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../configs/firebase';
import { Shield, CheckCircle, AlertCircle, Loader } from 'lucide-react';

const AdminAccessSetup: React.FC = () => {
  const [uidOrEmail, setUidOrEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');

  const setupAdminAccess = async () => {
    if (!uidOrEmail.trim()) {
      setMessage('Please enter a Firebase UID or email');
      setMessageType('error');
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      let uid = uidOrEmail.trim();
      
      // If it looks like an email, we'll use it as is for now
      // In a real app, you'd want to verify the user exists first
      
      // Create or update the user document with admin role
      const userRef = doc(db, 'users', uid);
      
      await setDoc(userRef, {
        email: uidOrEmail.includes('@') ? uidOrEmail : `${uidOrEmail}@admin.local`,
        displayName: uidOrEmail.includes('@') ? uidOrEmail.split('@')[0] : uidOrEmail,
        role: 'super_admin',
        isAdmin: true,
        isActive: true,
        createdAt: new Date(),
        lastLogin: new Date(),
        adminGrantedAt: new Date(),
        setupBy: 'admin_panel_setup'
      }, { merge: true });

      setMessage(`✅ Admin access granted to ${uidOrEmail}! You can now access the admin panel.`);
      setMessageType('success');
      setUidOrEmail('');
      
      // Refresh the page after a short delay to update the admin context
      setTimeout(() => {
        window.location.reload();
      }, 2000);

    } catch (error) {
      console.error('Error setting up admin access:', error);
      setMessage(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`);
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
      <div className="text-center mb-6">
        <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
          <Shield className="h-6 w-6 text-blue-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900">Setup Admin Access</h2>
        <p className="text-sm text-gray-600 mt-2">
          Enter your Firebase UID or email to grant admin access
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="uidOrEmail" className="block text-sm font-medium text-gray-700 mb-2">
            Firebase UID or Email
          </label>
          <input
            type="text"
            id="uidOrEmail"
            value={uidOrEmail}
            onChange={(e) => setUidOrEmail(e.target.value)}
            placeholder="Enter UID or email@example.com"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            disabled={isLoading}
          />
        </div>

        <button
          onClick={setupAdminAccess}
          disabled={isLoading || !uidOrEmail.trim()}
          className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <Loader className="animate-spin -ml-1 mr-2 h-4 w-4" />
              Setting up...
            </>
          ) : (
            'Grant Admin Access'
          )}
        </button>

        {message && (
          <div className={`p-3 rounded-md ${
            messageType === 'success' 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            <div className="flex items-center">
              {messageType === 'success' ? (
                <CheckCircle className="h-4 w-4 mr-2" />
              ) : (
                <AlertCircle className="h-4 w-4 mr-2" />
              )}
              <span className="text-sm">{message}</span>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 text-xs text-gray-500 text-center">
        <p>💡 <strong>Quick Setup:</strong></p>
        <p>1. Enter your Firebase UID or email</p>
        <p>2. Click "Grant Admin Access"</p>
        <p>3. Refresh the page</p>
        <p>4. Access admin panel at /admin</p>
      </div>
    </div>
  );
};

export default AdminAccessSetup;
