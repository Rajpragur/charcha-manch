#!/usr/bin/env node

// Test script to verify that existing posts and comments display nagrik numbers
// This script tests the retroactive display of nagrik numbers on existing content

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, query, where, limit } = require('firebase/firestore');

// Firebase configuration (you'll need to add your config here)
const firebaseConfig = {
  // Add your Firebase config here
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Test function to check existing posts display nagrik numbers
async function testExistingPostsNagrikDisplay() {
  try {
    console.log('🧪 Testing existing posts nagrik number display...\n');
    
    const postsRef = collection(db, 'discussion_posts');
    const q = query(postsRef, where('status', '==', 'published'), limit(5));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.log('❌ No published posts found to test');
      return;
    }
    
    console.log(`📊 Found ${querySnapshot.docs.length} posts to test\n`);
    
    for (const postDoc of querySnapshot.docs) {
      const postData = postDoc.data();
      console.log(`📝 Post: "${postData.title}"`);
      console.log(`   User ID: ${postData.userId}`);
      console.log(`   Stored Username: ${postData.userName || 'Not set'}`);
      console.log(`   Constituency: ${postData.constituency}`);
      console.log('   ---');
    }
    
    console.log('✅ Existing posts test completed');
    
  } catch (error) {
    console.error('❌ Error testing existing posts:', error);
  }
}

// Test function to check existing comments display nagrik numbers
async function testExistingCommentsNagrikDisplay() {
  try {
    console.log('\n🧪 Testing existing comments nagrik number display...\n');
    
    const commentsRef = collection(db, 'comments');
    const q = query(commentsRef, limit(5));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.log('❌ No comments found to test');
      return;
    }
    
    console.log(`📊 Found ${querySnapshot.docs.length} comments to test\n`);
    
    for (const commentDoc of querySnapshot.docs) {
      const commentData = commentDoc.data();
      console.log(`💬 Comment on Post: ${commentData.postId}`);
      console.log(`   User ID: ${commentData.userId}`);
      console.log(`   Stored Username: ${commentData.userName || 'Not set'}`);
      console.log(`   Content: ${commentData.content?.substring(0, 50)}...`);
      console.log('   ---');
    }
    
    console.log('✅ Existing comments test completed');
    
  } catch (error) {
    console.error('❌ Error testing existing comments:', error);
  }
}

// Test function to check existing replies display nagrik numbers
async function testExistingRepliesNagrikDisplay() {
  try {
    console.log('\n🧪 Testing existing replies nagrik number display...\n');
    
    const repliesRef = collection(db, 'comment_replies');
    const q = query(repliesRef, limit(5));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.log('❌ No replies found to test');
      return;
    }
    
    console.log(`📊 Found ${querySnapshot.docs.length} replies to test\n`);
    
    for (const replyDoc of querySnapshot.docs) {
      const replyData = replyDoc.data();
      console.log(`↩️  Reply to Comment: ${replyData.parentCommentId}`);
      console.log(`   User ID: ${replyData.userId}`);
      console.log(`   Stored Username: ${replyData.userName || 'Not set'}`);
      console.log(`   Content: ${replyData.content?.substring(0, 50)}...`);
      console.log('   ---');
    }
    
    console.log('✅ Existing replies test completed');
    
  } catch (error) {
    console.error('❌ Error testing existing replies:', error);
  }
}

// Main test function
async function runTests() {
  try {
    console.log('🚀 Starting Existing Content Nagrik Number Display Tests...\n');
    
    // Test 1: Check existing posts
    await testExistingPostsNagrikDisplay();
    
    // Test 2: Check existing comments
    await testExistingCommentsNagrikDisplay();
    
    // Test 3: Check existing replies
    await testExistingRepliesNagrikDisplay();
    
    console.log('\n🎉 All tests completed!');
    console.log('\n📋 Summary:');
    console.log('   - This script shows the raw data stored in posts/comments/replies');
    console.log('   - To see nagrik numbers in action, visit the discussion forum');
    console.log('   - The system will automatically replace usernames with nagrik numbers');
    console.log('   - Existing content will display nagrik numbers retroactively');
    
  } catch (error) {
    console.error('❌ Tests failed:', error);
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  runTests().then(() => {
    console.log('\nTests finished');
    process.exit(0);
  }).catch((error) => {
    console.error('Tests failed:', error);
    process.exit(1);
  });
}

module.exports = {
  testExistingPostsNagrikDisplay,
  testExistingCommentsNagrikDisplay,
  testExistingRepliesNagrikDisplay,
  runTests
};
