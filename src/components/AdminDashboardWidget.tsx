import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Users, MapPin, BarChart3 } from 'lucide-react';
import { useAdmin } from '../contexts/AdminContext';

const AdminDashboardWidget: React.FC = () => {
  const { isAdmin, adminLevel } = useAdmin();

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-red-100 rounded-lg">
            <Shield className="h-6 w-6 text-red-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-red-900">Admin Dashboard</h3>
            <p className="text-sm text-red-700">
              Welcome, {adminLevel.replace('_', ' ').toUpperCase()}
            </p>
          </div>
        </div>
        <Link
          to="/admin"
          className="inline-flex items-center px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
        >
          Access Admin Panel
        </Link>
      </div>
      
      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex items-center space-x-2 text-sm text-red-700">
          <Users className="h-4 w-4" />
          <span>User Management</span>
        </div>
        <div className="flex items-center space-x-2 text-sm text-red-700">
          <MapPin className="h-4 w-4" />
          <span>Constituency Control</span>
        </div>
        <div className="flex items-center space-x-2 text-sm text-red-700">
          <BarChart3 className="h-4 w-4" />
          <span>System Analytics</span>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardWidget;
