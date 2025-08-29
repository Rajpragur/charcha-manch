import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  PhoneAuthProvider,
  signInWithCredential
} from 'firebase/auth';
import { auth } from '../configs/firebase';
import FirebaseService from '../services/firebaseService';

interface AuthContextType {
  currentUser: User | null;
  signup: (email: string, password: string) => Promise<any>;
  signin: (email: string, password: string) => Promise<any>;
  signInWithGoogle: () => Promise<any>;
  signInWithPhone: (phoneNumber: string, recaptchaVerifier: RecaptchaVerifier) => Promise<any>;
  verifyPhoneCode: (verificationId: string, code: string) => Promise<any>;
  logout: () => Promise<void>;
  loading: boolean;
  onboardingCompleted: boolean;
  checkOnboardingStatus: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);

  const checkOnboardingStatus = async (): Promise<boolean> => {
    if (!currentUser) {
      setOnboardingCompleted(false);
      return false;
    }

    try {
      const userProfile = await FirebaseService.getUserProfile(currentUser.uid);
      const isCompleted = !!(userProfile && userProfile.constituency_id && userProfile.gender && userProfile.age_group && userProfile.area);
      setOnboardingCompleted(isCompleted);
      return isCompleted;
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      setOnboardingCompleted(false);
      return false;
    }
  };

  const signup = async (email: string, password: string) => {
    return createUserWithEmailAndPassword(auth, email, password);
  };

  const signin = async (email: string, password: string) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    return signInWithPopup(auth, provider);
  };

  const signInWithPhone = async (phoneNumber: string, recaptchaVerifier: RecaptchaVerifier) => {
    return signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
  };

  const verifyPhoneCode = async (verificationId: string, code: string) => {
    const credential = PhoneAuthProvider.credential(verificationId, code);
    return signInWithCredential(auth, credential);
  };

  const logout = async () => {
    setOnboardingCompleted(false);
    return signOut(auth);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        // Check onboarding status when user signs in
        await checkOnboardingStatus();
      } else {
        setOnboardingCompleted(false);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = { 
    currentUser, 
    signup, 
    signin, 
    signInWithGoogle, 
    signInWithPhone, 
    verifyPhoneCode, 
    logout, 
    loading,
    onboardingCompleted,
    checkOnboardingStatus
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
