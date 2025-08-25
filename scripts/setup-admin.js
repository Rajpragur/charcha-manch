const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc, getDoc } = require('firebase/firestore');

// Your Firebase config - replace with your actual config
const firebaseConfig = {
  // Add your Firebase config here
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function setupAdminUser(uid, email, displayName, role = 'admin') {
  try {
    // Check if user document exists
    const userRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      // Update existing user with admin role
      await setDoc(userRef, {
        ...userDoc.data(),
        role: role,
        isAdmin: true,
        updatedAt: new Date(),
        adminGrantedAt: new Date()
      }, { merge: true });
      console.log(`✅ Updated user ${email} to ${role} role`);
    } else {
      // Create new admin user document
      await setDoc(userRef, {
        email: email,
        displayName: displayName || email.split('@')[0],
        role: role,
        isAdmin: true,
        isActive: true,
        createdAt: new Date(),
        adminGrantedAt: new Date(),
        lastLogin: new Date()
      });
      console.log(`✅ Created new ${role} user: ${email}`);
    }
  } catch (error) {
    console.error(`❌ Error setting up admin user ${email}:`, error);
  }
}

async function setupSystemSettings() {
  try {
    const settingsRef = doc(db, 'system', 'settings');
    await setDoc(settingsRef, {
      maintenanceMode: false,
      emailNotifications: true,
      sessionTimeout: 30, // minutes
      require2FA: false,
      maxFileSize: 5 * 1024 * 1024, // 5MB
      allowedFileTypes: ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx'],
      createdAt: new Date(),
      updatedAt: new Date()
    });
    console.log('✅ System settings configured');
  } catch (error) {
    console.error('❌ Error setting up system settings:', error);
  }
}

async function main() {
  console.log('🚀 Setting up admin users and system configuration...\n');
  
  // Add your admin users here
  const adminUsers = [
    {
      uid: 'your-user-uid-here', // Replace with actual UID from Firebase Auth
      email: 'admin@charchamanch.com',
      displayName: 'Super Admin',
      role: 'super_admin'
    },
    {
      uid: 'another-user-uid', // Replace with actual UID from Firebase Auth
      email: 'moderator@charchamanch.com',
      displayName: 'Moderator',
      role: 'moderator'
    }
  ];
  
  // Setup admin users
  for (const user of adminUsers) {
    if (user.uid !== 'your-user-uid-here') { // Skip placeholder
      await setupAdminUser(user.uid, user.email, user.displayName, user.role);
    }
  }
  
  // Setup system settings
  await setupSystemSettings();
  
  console.log('\n✨ Admin setup complete!');
  console.log('\n📝 Next steps:');
  console.log('1. Replace the placeholder UIDs with actual Firebase Auth user UIDs');
  console.log('2. Run this script again with real UIDs');
  console.log('3. Users will now have admin access to the panel');
  console.log('4. Access the admin panel at /admin route');
}

// Run the setup
main().catch(console.error);
