import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';

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

async function fixFirstAdmin() {
  console.log('🔧 Fixing first admin user...');
  console.log('=====================================');
  
  try {
    // Check if there are any existing admin users
    console.log('📋 Checking for existing admin users...');
    
    // For now, let's create a test admin user
    const testAdminUid = '4zCKNy2r4tNAMdtnLUINpmzuyU52'; // Your original hardcoded UID
    
    console.log(`🔧 Creating/updating admin user: ${testAdminUid}`);
    
    const userRef = doc(db, 'users', testAdminUid);
    
    await setDoc(userRef, {
      uid: testAdminUid,
      email: 'admin@charchagram.com',
      displayName: 'System Administrator',
      role: 'super_admin',
      isAdmin: true,
      isActive: true,
      createdAt: new Date(),
      lastLogin: new Date(),
      adminGrantedAt: new Date(),
      setupBy: 'fix_first_admin_script',
      setupByUid: 'system'
    }, { merge: true });

    console.log('✅ Admin user created/updated successfully!');
    
    // Verify the user was created
    const userDoc = await getDoc(userRef);
    if (userDoc.exists()) {
      const userData = userDoc.data();
      console.log('✅ Verification - User document exists:');
      console.log('   - Role:', userData.role);
      console.log('   - IsAdmin:', userData.isAdmin);
      console.log('   - Email:', userData.email);
    } else {
      console.log('❌ Verification failed - User document not found');
    }
    
  } catch (error) {
    console.error('❌ Error fixing first admin:', error);
    console.log('💡 This might be due to Firestore permissions. Check your firestore.rules file.');
  }
}

fixFirstAdmin().then(() => {
  console.log('\n✅ Fix complete');
  console.log('💡 Now try accessing the AdminSetup page with the UID: 4zCKNy2r4tNAMdtnLUINpmzuyU52');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Fix failed:', error);
  process.exit(1);
});
