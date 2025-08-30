// Migration script to add nagrik numbers to existing user profiles
// This script should be run after updating the database schema

const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc, getDoc, collection, getDocs, query, orderBy, limit } = require('firebase/firestore');

// Firebase configuration (you'll need to add your config here)
const firebaseConfig = {
  // Add your Firebase config here
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Generate nagrik number for existing users
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
    
    return nextNumber;
  } catch (error) {
    console.error('Error generating nagrik number:', error);
    // Fallback: generate a random number between 1001 and 9999
    return Math.floor(Math.random() * 9000) + 1001;
  }
}

// Migrate existing user profiles to include nagrik numbers
async function migrateExistingUsers() {
  try {
    console.log('🔄 Starting migration of existing user profiles...');
    
    const usersRef = collection(db, 'user_profiles');
    const querySnapshot = await getDocs(usersRef);
    
    console.log(`📊 Found ${querySnapshot.docs.length} existing user profiles`);
    
    let migratedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    for (const userDoc of querySnapshot.docs) {
      try {
        const userData = userDoc.data();
        const userId = userDoc.id;
        
        // Skip if user already has a nagrik number
        if (userData.nagrik_number) {
          console.log(`⏭️  User ${userId} already has nagrik number: ${userData.nagrik_number}`);
          skippedCount++;
          continue;
        }
        
        // Generate new nagrik number
        const nagrikNumber = await generateNagrikNumber();
        
        // Update user profile with nagrik number
        await setDoc(doc(db, 'user_profiles', userId), {
          nagrik_number: nagrikNumber,
          updated_at: new Date()
        }, { merge: true });
        
        console.log(`✅ User ${userId} migrated with nagrik number: ${nagrikNumber}`);
        migratedCount++;
        
        // Small delay to avoid overwhelming the database
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`❌ Error migrating user ${userDoc.id}:`, error);
        errorCount++;
      }
    }
    
    console.log('\n🎉 Migration completed!');
    console.log(`📈 Total users processed: ${querySnapshot.docs.length}`);
    console.log(`✅ Successfully migrated: ${migratedCount}`);
    console.log(`⏭️  Skipped (already had numbers): ${skippedCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Verify migration results
async function verifyMigration() {
  try {
    console.log('\n🔍 Verifying migration results...');
    
    const usersRef = collection(db, 'user_profiles');
    const querySnapshot = await getDocs(usersRef);
    
    const usersWithNagrikNumbers = [];
    const usersWithoutNagrikNumbers = [];
    
    querySnapshot.forEach((doc) => {
      const userData = doc.data();
      if (userData.nagrik_number) {
        usersWithNagrikNumbers.push({
          id: doc.id,
          nagrik_number: userData.nagrik_number,
          display_name: userData.display_name || 'Unknown'
        });
      } else {
        usersWithoutNagrikNumbers.push({
          id: doc.id,
          display_name: userData.display_name || 'Unknown'
        });
      }
    });
    
    console.log(`📊 Migration verification results:`);
    console.log(`✅ Users with nagrik numbers: ${usersWithNagrikNumbers.length}`);
    console.log(`❌ Users without nagrik numbers: ${usersWithoutNagrikNumbers.length}`);
    
    if (usersWithoutNagrikNumbers.length > 0) {
      console.log('\n⚠️  Users still missing nagrik numbers:');
      usersWithoutNagrikNumbers.forEach(user => {
        console.log(`   - ${user.id}: ${user.display_name}`);
      });
    }
    
    // Check for duplicate nagrik numbers
    const nagrikNumbers = usersWithNagrikNumbers.map(u => u.nagrik_number);
    const uniqueNumbers = new Set(nagrikNumbers);
    const hasDuplicates = nagrikNumbers.length !== uniqueNumbers.size;
    
    console.log(`\n🔢 Nagrik number uniqueness:`);
    console.log(`   Total numbers: ${nagrikNumbers.length}`);
    console.log(`   Unique numbers: ${uniqueNumbers.size}`);
    console.log(`   Has duplicates: ${hasDuplicates ? '❌ YES' : '✅ NO'}`);
    
    if (hasDuplicates) {
      console.log('\n⚠️  Duplicate nagrik numbers found:');
      const duplicates = nagrikNumbers.filter((item, index) => nagrikNumbers.indexOf(item) !== index);
      console.log(`   Duplicates: ${duplicates.join(', ')}`);
    }
    
    return {
      totalUsers: querySnapshot.docs.length,
      withNagrikNumbers: usersWithNagrikNumbers.length,
      withoutNagrikNumbers: usersWithoutNagrikNumbers.length,
      hasDuplicates: hasDuplicates
    };
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
    throw error;
  }
}

// Main migration function
async function runMigration() {
  try {
    console.log('🚀 Starting Nagrik Number Migration...\n');
    
    // Step 1: Migrate existing users
    await migrateExistingUsers();
    
    // Step 2: Verify migration results
    const results = await verifyMigration();
    
    // Step 3: Summary
    console.log('\n📋 Migration Summary:');
    console.log(`   Total users: ${results.totalUsers}`);
    console.log(`   Successfully migrated: ${results.withNagrikNumbers}`);
    console.log(`   Still pending: ${results.withoutNagrikNumbers}`);
    console.log(`   Data integrity: ${results.hasDuplicates ? '❌ Issues found' : '✅ All good'}`);
    
    if (results.withoutNagrikNumbers > 0) {
      console.log('\n⚠️  Some users still need nagrik numbers. You may need to:');
      console.log('   1. Check for permission issues');
      console.log('   2. Verify database schema updates');
      console.log('   3. Run the migration again');
    }
    
    if (results.hasDuplicates) {
      console.log('\n⚠️  Duplicate nagrik numbers detected. You may need to:');
      console.log('   1. Check the number generation logic');
      console.log('   2. Manually resolve duplicates');
      console.log('   3. Verify database constraints');
    }
    
    console.log('\n🎉 Migration process completed!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration if this script is executed directly
if (require.main === module) {
  runMigration().then(() => {
    console.log('Migration finished');
    process.exit(0);
  }).catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
}

module.exports = {
  migrateExistingUsers,
  verifyMigration,
  runMigration
};
