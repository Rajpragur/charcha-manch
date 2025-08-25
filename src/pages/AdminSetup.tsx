import React, { useState } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../configs/firebase';
import { Shield, CheckCircle, AlertCircle, Loader, ArrowRight, Users, Settings, BarChart3 } from 'lucide-react';

const AdminSetup: React.FC = () => {
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
        setupBy: 'admin_setup_page'
      }, { merge: true });

      setMessage(`✅ Admin access granted to ${uidOrEmail}! You can now access the admin panel.`);
      setMessageType('success');
      setUidOrEmail('');
      
    } catch (error) {
      console.error('Error setting up admin access:', error);
      setMessage(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`);
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="mx-auto w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-6">
            <Shield className="h-10 w-10 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Charcha Manch Admin Setup</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Set up admin access for your Charcha Manch application. This will grant you full administrative privileges.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Setup Form */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Quick Admin Setup</h2>
            
            <div className="space-y-6">
              <div>
                <label htmlFor="uidOrEmail" className="block text-sm font-medium text-gray-700 mb-2">
                  Firebase UID or Email
                </label>
                <input
                  type="text"
                  id="uidOrEmail"
                  value={uidOrEmail}
                  onChange={(e) => setUidOrEmail(e.target.value)}
                  placeholder="Enter your Firebase UID or email@example.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
                  disabled={isLoading}
                />
                <p className="mt-2 text-sm text-gray-500">
                  You can find your Firebase UID in the Firebase Console under Authentication `{`>`}` Users
                </p>
              </div>

              <button
                onClick={setupAdminAccess}
                disabled={isLoading || !uidOrEmail.trim()}
                className="w-full flex items-center justify-center px-6 py-3 border border-transparent text-lg font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <>
                    <Loader className="animate-spin -ml-1 mr-2 h-5 w-5" />
                    Setting up Admin Access...
                  </>
                ) : (
                  <>
                    <Shield className="mr-2 h-5 w-5" />
                    Grant Admin Access
                  </>
                )}
              </button>

              {message && (
                <div className={`p-4 rounded-lg border ${
                  messageType === 'success' 
                    ? 'bg-green-50 text-green-800 border-green-200' 
                    : 'bg-red-50 text-red-800 border-red-200'
                }`}>
                  <div className="flex items-center">
                    {messageType === 'success' ? (
                      <CheckCircle className="h-5 w-5 mr-2" />
                    ) : (
                      <AlertCircle className="h-5 w-5 mr-2" />
                    )}
                    <span className="text-sm font-medium">{message}</span>
                  </div>
                </div>
              )}
            </div>

            {messageType === 'success' && (
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-2">🎉 Setup Complete!</h3>
                <p className="text-sm text-blue-700 mb-3">
                  You now have admin access! Here's what you can do next:
                </p>
                <div className="space-y-2 text-sm text-blue-700">
                  <p>• <strong>Go to Admin Panel:</strong> Navigate to <code className="bg-blue-100 px-1 rounded">/admin</code></p>
                  <p>• <strong>Manage Users:</strong> View and control user access</p>
                  <p>• <strong>System Settings:</strong> Configure app preferences</p>
                  <p>• <strong>Analytics:</strong> View system metrics and reports</p>
                </div>
              </div>
            )}
          </div>

          {/* Features Preview */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Users className="h-5 w-5 mr-2 text-blue-600" />
                User Management
              </h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• View all registered users</li>
                <li>• Manage user roles and permissions</li>
                <li>• Toggle user active/inactive status</li>
                <li>• Search and filter users</li>
              </ul>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <BarChart3 className="h-5 w-5 mr-2 text-green-600" />
                Analytics Dashboard
              </h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• System performance metrics</li>
                <li>• User growth trends</li>
                <li>• Constituency engagement data</li>
                <li>• Real-time system health</li>
              </ul>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Settings className="h-5 w-5 mr-2 text-purple-600" />
                System Control
              </h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Maintenance mode toggle</li>
                <li>• Email notification settings</li>
                <li>• Security configurations</li>
                <li>• File upload restrictions</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Quick Access Links */}
        <div className="mt-12 text-center">
          <div className="bg-white rounded-xl shadow-lg p-6 inline-block">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Access</h3>
            <div className="flex flex-wrap gap-3 justify-center">
              <a
                href="/admin"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Go to Admin Panel
                <ArrowRight className="ml-2 h-4 w-4" />
              </a>
              <a
                href="/"
                className="inline-flex items-center px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors"
              >
                Back to Home
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSetup;
