const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, doc, getDoc } = require('firebase/firestore');

// Your Firebase config
const firebaseConfig = {
  apiKey: meta.env.VITE_FIREBASE_API_KEY,
  authDomain: meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: meta.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkCollections() {
  try {
    
    // List all collections
    const collections = await getDocs(collection(db, ''));
    
    try {
      const constituenciesSnapshot = await getDocs(collection(db, 'constituencies'));
      
      if (constituenciesSnapshot.size > 0) {
        const firstConstituency = constituenciesSnapshot.docs[0];
      }
    } catch (error) {
      console.error('❌ Error accessing constituencies collection:', error.message);
    }
    
    // Check if there's a different collection name
    const possibleNames = ['constituency', 'constituency_data', 'constituency_info', 'constituency_details'];
    
    for (const name of possibleNames) {
      try {
        const snapshot = await getDocs(collection(db, name));
      } catch (error) {
      }
    }
    
  } catch (error) {
    console.error('❌ Error checking collections:', error);
  }
}

checkCollections();
