import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAdmin } from '../contexts/AdminContext';

const AdminStatusDebug: React.FC = () => {
  const { currentUser } = useAuth();
  const { isAdmin, isSuperAdmin, adminLevel, loading } = useAdmin();

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg shadow-lg p-4 max-w-sm z-50">
      <h3 className="font-semibold text-sm text-gray-700 mb-2">🔍 Admin Status Debug</h3>
      <div className="text-xs space-y-1">
        <div><strong>User:</strong> {currentUser?.email || 'Not signed in'}</div>
        <div><strong>UID:</strong> {currentUser?.uid || 'N/A'}</div>
        <div><strong>Loading:</strong> {loading ? '🔄 Yes' : '✅ No'}</div>
        <div><strong>Is Admin:</strong> {isAdmin ? '✅ Yes' : '❌ No'}</div>
        <div><strong>Is Super Admin:</strong> {isSuperAdmin ? '✅ Yes' : '❌ No'}</div>
        <div><strong>Admin Level:</strong> {adminLevel}</div>
      </div>
      <button 
        onClick={() => window.location.reload()}
        className="mt-2 w-full px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
      >
        Refresh Page
      </button>
    </div>
  );
};

export default AdminStatusDebug;
