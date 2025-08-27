import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import dotenv from 'dotenv';

dotenv.config();

// Your Firebase config - using environment variables
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

console.log('Firebase config:', {
  projectId: firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain
});

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function setupAdminRole() {
  try {
    const adminUid = '4zCKNy2r4tNAMdtnLUINpmzuyU52'; 
    
    console.log('🔍 Setting up admin role for user:', adminUid);
    
    // Check if user document exists
    const userDocRef = doc(db, 'users', adminUid);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      console.log('✅ User document exists, updating role...');
      console.log('Current user data:', userDoc.data());
      await setDoc(userDocRef, {
        ...userDoc.data(),
        role: 'admin',
        isAdmin: true,
        admin_level: 'admin'
      }, { merge: true });
      console.log('✅ Admin role set successfully!');
    } else {
      console.log('❌ User document does not exist, creating one...');
      await setDoc(userDocRef, {
        role: 'admin',
        isAdmin: true,
        admin_level: 'admin',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log('✅ Admin user document created with role!');
    }
    
    // Also check user_profiles collection
    const profileDocRef = doc(db, 'user_profiles', adminUid);
    const profileDoc = await getDoc(profileDocRef);
    
    if (profileDoc.exists()) {
      console.log('✅ Profile document exists, updating role...');
      console.log('Current profile data:', profileDoc.data());
      await setDoc(profileDocRef, {
        ...profileDoc.data(),
        role: 'admin',
        isAdmin: true,
        admin_level: 'admin'
      }, { merge: true });
      console.log('✅ Admin role set in profile successfully!');
    } else {
      console.log('❌ Profile document does not exist, creating one...');
      await setDoc(profileDocRef, {
        role: 'admin',
        isAdmin: true,
        admin_level: 'admin',
        created_at: new Date(),
        updated_at: new Date()
      });
      console.log('✅ Admin profile document created with role!');
    }
    
    console.log('🎉 Admin setup complete!');
    
  } catch (error) {
    console.error('❌ Error setting up admin role:', error);
    console.error('Error details:', error.message);
    console.error('Error code:', error.code);
  }
}

// Run the setup
setupAdminRole();
