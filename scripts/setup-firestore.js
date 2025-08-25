import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env' });

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

const requiredEnvVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingVars.length > 0) {
  console.error('Missing Firebase environment variables:', missingVars);
  console.error('Please create a .env file with your Firebase config');
  process.exit(1);
}

console.log('✅ Environment variables loaded successfully');
console.log('Project ID:', process.env.VITE_FIREBASE_PROJECT_ID);

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function setupFirestore() {
  try {
    console.log('Setting up initial Firestore collections...');
    
    // Create global stats document
    await setDoc(doc(db, 'global_stats', 'latest'), {
      total_users: 0,
      level1_users: 0,
      level2_users: 0,
      level3_users: 0,
      level4_users: 0,
      total_constituencies: 243,
      last_calculated: serverTimestamp(),
      created_at: serverTimestamp()
    });
    
    console.log('Global stats document created');
    console.log('Firestore setup complete!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Deploy the security rules: firebase deploy --only firestore:rules');
    console.log('2. The app should now work without permission errors');
    
  } catch (error) {
    console.error('Error setting up Firestore:', error);
    console.log('');
    console.log('Make sure you have:');
    console.log('1. Created a Firebase project');
    console.log('2. Enabled Firestore database');
    console.log('3. Set up environment variables in .env');
    console.log('4. Deployed security rules');
  }
}

setupFirestore();
