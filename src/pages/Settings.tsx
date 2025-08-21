import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell, Shield, Globe, Moon, Sun, Palette } from 'lucide-react';

const Settings: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState('en');

  if (!currentUser) {
    navigate('/signin');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 text-slate-600 hover:text-slate-800 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-slate-800">Settings</h1>
              <p className="text-slate-600 mt-1">Customize your experience</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Notifications */}
          <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Bell className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-800">Notifications</h3>
                  <p className="text-slate-600">Manage your notification preferences</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifications}
                  onChange={(e) => setNotifications(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-sky-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-600"></div>
              </label>
            </div>
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-700">Email notifications</span>
                <span className="text-sm text-slate-500">{notifications ? 'Enabled' : 'Disabled'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-700">Push notifications</span>
                <span className="text-sm text-slate-500">{notifications ? 'Enabled' : 'Disabled'}</span>
              </div>
            </div>
          </div>

          {/* Appearance */}
          <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Palette className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-800">Appearance</h3>
                <p className="text-slate-600">Customize the look and feel</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Sun className="h-5 w-5 text-amber-500" />
                  <span className="text-slate-700">Light mode</span>
                </div>
                <input
                  type="radio"
                  name="theme"
                  checked={!darkMode}
                  onChange={() => setDarkMode(false)}
                  className="w-4 h-4 text-sky-600 bg-slate-100 border-slate-300 focus:ring-sky-500"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Moon className="h-5 w-5 text-slate-600" />
                  <span className="text-slate-700">Dark mode</span>
                </div>
                <input
                  type="radio"
                  name="theme"
                  checked={darkMode}
                  onChange={() => setDarkMode(true)}
                  className="w-4 h-4 text-sky-600 bg-slate-100 border-slate-300 focus:ring-sky-500"
                />
              </div>
            </div>
          </div>

          {/* Language */}
          <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <Globe className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-800">Language</h3>
                <p className="text-slate-600">Choose your preferred language</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <label className="flex items-center space-x-3">
                <input
                  type="radio"
                  name="language"
                  value="en"
                  checked={language === 'en'}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-4 h-4 text-sky-600 bg-slate-100 border-slate-300 focus:ring-sky-500"
                />
                <span className="text-slate-700">English</span>
              </label>
              
              <label className="flex items-center space-x-3">
                <input
                  type="radio"
                  name="language"
                  value="hi"
                  checked={language === 'hi'}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-4 h-4 text-sky-600 bg-slate-100 border-slate-300 focus:ring-sky-500"
                />
                <span className="text-slate-700">हिंदी (Hindi)</span>
              </label>
            </div>
          </div>

          {/* Privacy & Security */}
          <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-red-100 rounded-lg">
                <Shield className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-800">Privacy & Security</h3>
                <p className="text-slate-600">Manage your account security</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <button className="w-full text-left px-4 py-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-slate-700">Change password</span>
                  <span className="text-slate-400">→</span>
                </div>
              </button>
              
              <button className="w-full text-left px-4 py-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-slate-700">Two-factor authentication</span>
                  <span className="text-slate-400">→</span>
                </div>
              </button>
              
              <button className="w-full text-left px-4 py-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-slate-700">Privacy settings</span>
                  <span className="text-slate-400">→</span>
                </div>
              </button>
            </div>
          </div>

          {/* Account Actions */}
          <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Account Actions</h3>
            <div className="space-y-3">
              <button className="w-full text-left px-4 py-3 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors">
                Delete account
              </button>
              <button className="w-full text-left px-4 py-3 bg-slate-50 text-slate-700 rounded-lg hover:bg-slate-100 transition-colors">
                Export data
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings; 