// Migration script to add topic field to existing posts
// Run this script once to update all existing posts

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, updateDoc, doc } from 'firebase/firestore';

// Your Firebase config
const firebaseConfig = {
  // Add your Firebase config here
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Default topic for existing posts
const DEFAULT_TOPIC = "Others";

async function migrateTopicsField() {
  try {
    console.log('🔄 Starting migration to add topic field...');
    
    // Get all existing posts
    const postsRef = collection(db, 'discussion_posts');
    const postsSnapshot = await getDocs(postsRef);
    
    console.log(`📊 Found ${postsSnapshot.size} posts to migrate`);
    
    let migratedCount = 0;
    let errorCount = 0;
    
    // Process each post
    for (const postDoc of postsSnapshot.docs) {
      try {
        const postData = postDoc.data();
        
        // Check if post already has topic field
        if (postData.topic !== undefined) {
          console.log(`⏭️  Post ${postDoc.id} already has topic field: ${postData.topic}`);
          continue;
        }
        
        // Update the post with default topic
        await updateDoc(doc(db, 'discussion_posts', postDoc.id), {
          topic: DEFAULT_TOPIC
        });
        
        console.log(`✅ Migrated post ${postDoc.id}: topic = ${DEFAULT_TOPIC}`);
        migratedCount++;
        
      } catch (error) {
        console.error(`❌ Error migrating post ${postDoc.id}:`, error);
        errorCount++;
      }
    }
    
    console.log('\n🎉 Migration completed!');
    console.log(`✅ Successfully migrated: ${migratedCount} posts`);
    console.log(`❌ Errors: ${errorCount} posts`);
    console.log(`⏭️  Skipped (already migrated): ${postsSnapshot.size - migratedCount - errorCount} posts`);
    console.log(`📝 Default topic assigned: "${DEFAULT_TOPIC}"`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

// Run the migration
migrateTopicsField();
