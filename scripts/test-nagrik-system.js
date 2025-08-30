// Test script for Nagrik Number System
// This script tests the nagrik number generation and assignment

const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc, getDoc, collection, query, orderBy, limit, getDocs } = require('firebase/firestore');

// Firebase configuration (you'll need to add your config here)
const firebaseConfig = {
  // Add your Firebase config here
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Test function to generate nagrik number
async function generateNagrikNumber() {
  try {
    // Get the highest existing nagrik number
    const usersRef = collection(db, 'user_profiles');
    const q = query(usersRef, orderBy('nagrik_number', 'desc'), limit(1));
    const querySnapshot = await getDocs(q);
    
    let nextNumber = 1001; // Default starting number
    
    if (!querySnapshot.empty) {
      const lastUser = querySnapshot.docs[0].data();
      if (lastUser.nagrik_number && lastUser.nagrik_number >= 1001) {
        nextNumber = lastUser.nagrik_number + 1;
      }
    }
    
    console.log(`Generated nagrik number: ${nextNumber}`);
    return nextNumber;
  } catch (error) {
    console.error('Error generating nagrik number:', error);
    // Fallback: generate a random number between 1001 and 9999
    const fallbackNumber = Math.floor(Math.random() * 9000) + 1001;
    console.log(`Fallback nagrik number: ${fallbackNumber}`);
    return fallbackNumber;
  }
}

// Test function to create a test user profile
async function createTestUserProfile(userId, profileData) {
  try {
    const userRef = doc(db, 'user_profiles', userId);
    
    // Generate a unique nagrik number if not provided
    let nagrikNumber = profileData.nagrik_number;
    if (!nagrikNumber) {
      nagrikNumber = await generateNagrikNumber();
    }
    
    const userData = {
      ...profileData,
      id: userId,
      nagrik_number: nagrikNumber,
      created_at: new Date(),
      updated_at: new Date()
    };
    
    await setDoc(userRef, userData, { merge: true });
    console.log(`✅ Test user profile created with nagrik number: ${nagrikNumber}`);
    return nagrikNumber;
  } catch (error) {
    console.error('Error creating test user profile:', error);
    throw error;
  }
}

// Test function to verify nagrik number uniqueness
async function verifyNagrikNumberUniqueness() {
  try {
    const usersRef = collection(db, 'user_profiles');
    const q = query(usersRef, orderBy('nagrik_number', 'asc'));
    const querySnapshot = await getDocs(q);
    
    const nagrikNumbers = [];
    querySnapshot.forEach((doc) => {
      const userData = doc.data();
      if (userData.nagrik_number) {
        nagrikNumbers.push(userData.nagrik_number);
      }
    });
    
    // Check for duplicates
    const uniqueNumbers = new Set(nagrikNumbers);
    const hasDuplicates = nagrikNumbers.length !== uniqueNumbers.size;
    
    console.log(`Total users with nagrik numbers: ${nagrikNumbers.length}`);
    console.log(`Unique nagrik numbers: ${uniqueNumbers.size}`);
    console.log(`Has duplicates: ${hasDuplicates}`);
    
    if (hasDuplicates) {
      console.log('❌ Duplicate nagrik numbers found!');
      const duplicates = nagrikNumbers.filter((item, index) => nagrikNumbers.indexOf(item) !== index);
      console.log('Duplicate numbers:', duplicates);
    } else {
      console.log('✅ All nagrik numbers are unique!');
    }
    
    return !hasDuplicates;
  } catch (error) {
    console.error('Error verifying nagrik number uniqueness:', error);
    return false;
  }
}

// Main test function
async function runTests() {
  console.log('🧪 Starting Nagrik Number System Tests...\n');
  
  try {
    // Test 1: Generate nagrik number
    console.log('Test 1: Generate Nagrik Number');
    const nagrikNumber1 = await generateNagrikNumber();
    console.log(`Generated: ${nagrikNumber1}\n`);
    
    // Test 2: Create test user profile
    console.log('Test 2: Create Test User Profile');
    const testUserId = 'test-user-' + Date.now();
    const testProfile = {
      display_name: 'Test User',
      tier_level: 1,
      engagement_score: 0
    };
    
    const assignedNagrikNumber = await createTestUserProfile(testUserId, testProfile);
    console.log(`Assigned nagrik number: ${assignedNagrikNumber}\n`);
    
    // Test 3: Verify uniqueness
    console.log('Test 3: Verify Nagrik Number Uniqueness');
    const isUnique = await verifyNagrikNumberUniqueness();
    console.log(`Uniqueness check: ${isUnique ? 'PASSED' : 'FAILED'}\n`);
    
    // Test 4: Generate another number
    console.log('Test 4: Generate Another Nagrik Number');
    const nagrikNumber2 = await generateNagrikNumber();
    console.log(`Generated: ${nagrikNumber2}\n`);
    
    console.log('🎉 All tests completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  runTests().then(() => {
    console.log('Tests finished');
    process.exit(0);
  }).catch((error) => {
    console.error('Tests failed:', error);
    process.exit(1);
  });
}

module.exports = {
  generateNagrikNumber,
  createTestUserProfile,
  verifyNagrikNumberUniqueness
};
