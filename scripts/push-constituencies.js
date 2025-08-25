import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, getDocs } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function pushConstituenciesToDatabase() {
  try {
    console.log('🚀 Starting constituency data push to database...');
    
    // Read the candidates_en.json file
    const candidatesPath = path.join(process.cwd(), '..', 'public', 'data', 'candidates_en.json');
    const candidatesData = JSON.parse(fs.readFileSync(candidatesPath, 'utf8'));
    
    console.log(`📊 Found ${candidatesData.length} candidates in candidates_en.json`);
    
    // Extract unique constituencies
    const constituencyMap = new Map();
    candidatesData.forEach((candidate, index) => {
      if (candidate.area_name && !constituencyMap.has(candidate.area_name)) {
        constituencyMap.set(candidate.area_name, {
          id: index + 1,
          name: candidate.area_name,
          area_name: candidate.area_name,
          area_name_hi: candidate.area_name, // You can add Hindi names later
          district: candidate.district || '',
          total_candidates: 0,
          created_at: new Date(),
          updated_at: new Date()
        });
      }
    });
    
    const constituencies = Array.from(constituencyMap.values());
    console.log(`🏛️ Extracted ${constituencies.length} unique constituencies`);
    
    // Check if constituencies collection exists and has data
    const existingConstituencies = await getDocs(collection(db, 'constituencies'));
    console.log(`📋 Found ${existingConstituencies.size} existing constituencies in database`);
    
    if (existingConstituencies.size > 0) {
      console.log('⚠️ Constituencies collection already has data. Skipping push to avoid duplicates.');
      return;
    }
    
    // Push constituencies to database
    const constituenciesRef = collection(db, 'constituencies');
    const pushPromises = constituencies.map(async (constituency) => {
      const docRef = doc(constituenciesRef, constituency.id.toString());
      await setDoc(docRef, constituency);
      return constituency.name;
    });
    
    const pushedConstituencies = await Promise.all(pushPromises);
    
    console.log('✅ Successfully pushed constituencies to database:');
    pushedConstituencies.forEach((name, index) => {
      console.log(`  ${index + 1}. ${name}`);
    });
    
    console.log(`\n🎉 Total constituencies pushed: ${pushedConstituencies.length}`);
    
  } catch (error) {
    console.error('❌ Error pushing constituencies to database:', error);
    throw error;
  }
}

// Run the script
pushConstituenciesToDatabase()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
