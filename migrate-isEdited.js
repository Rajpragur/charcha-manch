// Migration script to add isEdited field to existing posts
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

async function migrateIsEditedField() {
  try {
    console.log('🔄 Starting migration to add isEdited field...');
    
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
        
        // Check if post already has isEdited field
        if (postData.isEdited !== undefined) {
          console.log(`⏭️  Post ${postDoc.id} already has isEdited field: ${postData.isEdited}`);
          continue;
        }
        
        // Determine if post was edited by comparing timestamps
        const isEdited = postData.updatedAt && 
                        postData.createdAt && 
                        postData.updatedAt.toDate && 
                        postData.createdAt.toDate &&
                        postData.updatedAt.toDate().getTime() !== postData.createdAt.toDate().getTime();
        
        // Update the post with isEdited field
        await updateDoc(doc(db, 'discussion_posts', postDoc.id), {
          isEdited: isEdited
        });
        
        console.log(`✅ Migrated post ${postDoc.id}: isEdited = ${isEdited}`);
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
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

// Run the migration
migrateIsEditedField();
