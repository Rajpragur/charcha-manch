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
    console.log('🔍 Checking Firestore collections...');
    
    // List all collections
    const collections = await getDocs(collection(db, ''));
    console.log('📚 Available collections:');
    collections.forEach(doc => {
      console.log(`  - ${doc.id}`);
    });
    
    // Check constituencies collection specifically
    console.log('\n🔍 Checking constituencies collection...');
    try {
      const constituenciesSnapshot = await getDocs(collection(db, 'constituencies'));
      console.log(`✅ Constituencies collection found with ${constituenciesSnapshot.size} documents`);
      
      if (constituenciesSnapshot.size > 0) {
        const firstConstituency = constituenciesSnapshot.docs[0];
        console.log('📄 First constituency document:');
        console.log('  ID:', firstConstituency.id);
        console.log('  Data:', JSON.stringify(firstConstituency.data(), null, 2));
      }
    } catch (error) {
      console.error('❌ Error accessing constituencies collection:', error.message);
    }
    
    // Check if there's a different collection name
    console.log('\n🔍 Checking for alternative collection names...');
    const possibleNames = ['constituency', 'constituency_data', 'constituency_info', 'constituency_details'];
    
    for (const name of possibleNames) {
      try {
        const snapshot = await getDocs(collection(db, name));
        if (snapshot.size > 0) {
          console.log(`✅ Found collection '${name}' with ${snapshot.size} documents`);
        }
      } catch (error) {
        // Collection doesn't exist or no access
      }
    }
    
  } catch (error) {
    console.error('❌ Error checking collections:', error);
  }
}

checkCollections();
