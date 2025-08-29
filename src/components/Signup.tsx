import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { RecaptchaVerifier } from 'firebase/auth';
import { auth } from '../configs/firebase';
import { Mail, Lock, Eye, EyeOff, ArrowRight, X } from 'lucide-react';

const Signup: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { signup, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const recaptchaRef = useRef<HTMLDivElement>(null);
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);

  useEffect(() => {
    if (recaptchaRef.current && !recaptchaVerifierRef.current) {
      recaptchaVerifierRef.current = new RecaptchaVerifier(auth, recaptchaRef.current, {
        size: 'invisible',
        callback: () => {
          console.log('reCAPTCHA solved');
        },
      });
    }
  }, []);

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if email is Gmail
    if (!email.endsWith('@gmail.com')) {
      setError('Please use a Gmail address');
      return;
    }
    
    if (password !== confirmPassword) {
      return setError('Passwords do not match');
    }

    if (password.length < 6) {
      return setError('Password must be at least 6 characters long');
    }

    try {
      setError('');
      setSuccess('');
      setLoading(true);
      await signup(email, password);
      setSuccess('Account created successfully! Redirecting...');
      setTimeout(() => navigate('/'), 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    try {
      setError('');
      setSuccess('');
      setLoading(true);
      await signInWithGoogle();
      setSuccess('Signed in with Google successfully! Redirecting...');
      setTimeout(() => navigate('/'), 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#c1cad1] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden relative">
        {/* Close Button */}
        <button
          onClick={() => navigate('/')}
          className="absolute top-4 right-4 w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 transition-colors z-10"
        >
          <X className="w-4 h-4 text-gray-600" />
        </button>

        {/* Header */}
        <div className="px-8 py-8 text-center">
          {/* Community Icon */}
          <div className="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <div className="w-12 h-12 text-white flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-12 h-12">
                <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm4 18v-6h2v6h-2zm-8-4v-6h2v6h-2zm-8-4v-6h2v6H4zm4 4v-6h2v6H8zm4 4v-6h2v6h-2z"/>
              </svg>
            </div>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-800 mb-2">आपका चुनावी साथी</h1>
          <p className="text-gray-600 text-sm">लोकतंत्र में भागीदारी का नया तरीका</p>
        </div>

        <div className="p-8">
          {/* Error/Success Messages */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center">
              <div className="w-2 h-2 bg-red-500 rounded-full mr-3"></div>
              {error}
            </div>
          )}
          
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6 flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
              {success}
            </div>
          )}

          {/* Google Sign Up Button - At Top */}
          <button
            onClick={handleGoogleSignup}
            disabled={loading}
            className="w-full bg-white border-2 border-gray-200 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors mb-6 flex items-center justify-center"
          >
            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Google से जारी रखें
          </button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">या जारी रखें</span>
            </div>
          </div>

          {/* Email Signup Form */}
          <form onSubmit={handleEmailSignup} className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">ईमेल पता (Gmail only)</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors"
                  placeholder="अपना Gmail दर्ज करें"
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">पासवर्ड</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors"
                  placeholder="अपना पासवर्ड दर्ज करें"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">पासवर्ड की पुष्टि करें</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors"
                  placeholder="अपना पासवर्ड फिर से दर्ज करें"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gray-700 text-white py-3 px-4 rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-all duration-200 font-medium flex items-center justify-center"
            >
              {loading ? 'खाता बन रहा है...' : 'खाता बनाएं'}
              <ArrowRight className="h-4 w-4 ml-2" />
            </button>
          </form>

          {/* Phone Number Section - At Bottom (Commented out for now) */}
          {/*<div className="border-t border-gray-200 pt-6">
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-3">फोन नंबर से साइन अप (अभी उपलब्ध नहीं)</p>
              <div className="flex items-center justify-center space-x-2 text-gray-400">
                <Phone className="h-4 w-4" />
                <span className="text-xs">Coming Soon</span>
              </div>
            </div>
          </div>*/}

          {/* reCAPTCHA */}
          <div ref={recaptchaRef} className="mt-4"></div>

          {/* Sign In Link */}
          <div className="mt-8 text-center">
            <p className="text-gray-600">
              पहले से खाता है?{' '}
              <Link to="/signin" className="text-gray-700 hover:text-gray-800 font-medium transition-colors">
                यहां साइन इन करें
              </Link>
            </p>
          </div>

          {/* Continue Without Account */}
          <div className="mt-6 text-center">
            <Link 
              to="/" 
              className="text-gray-500 hover:text-gray-700 text-sm transition-colors"
            >
              खाते के बिना जारी रखें
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
