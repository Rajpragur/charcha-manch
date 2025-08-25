import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAdmin } from '../contexts/AdminContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../configs/firebase';
import { Shield, CheckCircle, XCircle, AlertCircle, Loader } from 'lucide-react';

const AdminAccessChecker: React.FC = () => {
  const { currentUser } = useAuth();
  const { isAdmin, adminLevel } = useAdmin();
  const [userDoc, setUserDoc] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const checkUserDocument = async () => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        setUserDoc(userSnap.data());
      } else {
        setUserDoc(null);
      }
    } catch (error) {
      console.error('Error checking user document:', error);
      setUserDoc(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkUserDocument();
  }, [currentUser]);

  if (!currentUser) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <div className="flex items-center">
          <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
          <span className="text-yellow-800">Please sign in to check admin access</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <Shield className="h-5 w-5 mr-2 text-blue-600" />
        Admin Access Status
      </h3>
      
      <div className="space-y-4">
        {/* Current User Info */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">Current User</h4>
          <div className="text-sm text-gray-600 space-y-1">
            <p><strong>UID:</strong> {currentUser.uid}</p>
            <p><strong>Email:</strong> {currentUser.email}</p>
            <p><strong>Display Name:</strong> {currentUser.displayName || 'Not set'}</p>
          </div>
        </div>

        {/* Admin Context Status */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">Admin Context Status</h4>
          <div className="text-sm text-gray-600 space-y-1">
            <p><strong>Is Admin:</strong> 
              {isAdmin ? (
                <span className="inline-flex items-center text-green-600 ml-2">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Yes
                </span>
              ) : (
                <span className="inline-flex items-center text-red-600 ml-2">
                  <XCircle className="h-4 w-4 mr-1" />
                  No
                </span>
              )}
            </p>
            <p><strong>Admin Level:</strong> {adminLevel}</p>
          </div>
        </div>

        {/* Firestore Document Status */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">Firestore Document</h4>
          <div className="text-sm text-gray-600 space-y-1">
            {loading ? (
              <div className="flex items-center text-gray-500">
                <Loader className="animate-spin h-4 w-4 mr-2" />
                Checking document...
              </div>
            ) : userDoc ? (
              <div className="space-y-1">
                <p><strong>Document Exists:</strong> 
                  <span className="inline-flex items-center text-green-600 ml-2">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Yes
                  </span>
                </p>
                <p><strong>Role:</strong> {userDoc.role || 'Not set'}</p>
                <p><strong>Is Admin:</strong> {userDoc.isAdmin ? 'Yes' : 'No'}</p>
                <p><strong>Is Active:</strong> {userDoc.isActive ? 'Yes' : 'No'}</p>
                <p><strong>Created:</strong> {userDoc.createdAt?.toDate?.()?.toLocaleDateString() || 'Unknown'}</p>
              </div>
            ) : (
              <div className="text-red-600">
                <span className="inline-flex items-center">
                  <XCircle className="h-4 w-4 mr-1" />
                  No document found
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200">
          <button
            onClick={checkUserDocument}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? 'Checking...' : 'Refresh Status'}
          </button>
          
          <a
            href="/admin-setup"
            className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            Setup Admin Access
          </a>
          
          {isAdmin && (
            <a
              href="/admin"
              className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              Go to Admin Panel
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminAccessChecker;
