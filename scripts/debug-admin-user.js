import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBvQvQvQvQvQvQvQvQvQvQvQvQvQvQvQvQ",
  authDomain: "charchagramadmin.firebaseapp.com",
  projectId: "charchagramadmin",
  storageBucket: "charchagramadmin.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdefghijklmnop"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function debugUser(userId) {
  console.log(`🔍 Debugging user: ${userId}`);
  console.log('=====================================');
  
  try {
    // Check users collection
    console.log('📋 Checking users collection...');
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      console.log('✅ User document found in users collection:');
      console.log('   - Role:', userData.role);
      console.log('   - IsAdmin:', userData.isAdmin);
      console.log('   - All fields:', Object.keys(userData));
      console.log('   - Full data:', JSON.stringify(userData, null, 2));
    } else {
      console.log('❌ No user document found in users collection');
    }
    
    console.log('\n📋 Checking user_profiles collection...');
    const profileDoc = await getDoc(doc(db, 'user_profiles', userId));
    if (profileDoc.exists()) {
      const profileData = profileDoc.data();
      console.log('✅ Profile document found in user_profiles collection:');
      console.log('   - Role:', profileData.role);
      console.log('   - Admin Level:', profileData.admin_level);
      console.log('   - IsAdmin:', profileData.isAdmin);
      console.log('   - All fields:', Object.keys(profileData));
      console.log('   - Full data:', JSON.stringify(profileData, null, 2));
    } else {
      console.log('❌ No profile document found in user_profiles collection');
    }
    
  } catch (error) {
    console.error('❌ Error debugging user:', error);
  }
}

// Get user ID from command line argument
const userId = process.argv[2];
if (!userId) {
  console.log('Usage: node scripts/debug-admin-user.js <USER_ID>');
  console.log('Example: node scripts/debug-admin-user.js Rdqj3lxXvHRhM2LTzpgNezJS33K3');
  process.exit(1);
}

debugUser(userId).then(() => {
  console.log('\n✅ Debug complete');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Debug failed:', error);
  process.exit(1);
});
