const { initializeApp } = require('firebase/app');
const { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where,
  serverTimestamp,
  writeBatch,
  doc
} = require('firebase/firestore');

// Firebase configuration - replace with your actual config
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

// Sample constituencies data
const constituencies = [
  { id: 1, name: 'Bhabua', area_name: 'Bhabua', district: 'Kaimur', state: 'Bihar' },
  { id: 2, name: 'Chainpur', area_name: 'Chainpur', district: 'Kaimur', state: 'Bihar' },
  { id: 3, name: 'Buxar', area_name: 'Buxar', district: 'Buxar', state: 'Bihar' },
  { id: 4, name: 'Dumraon', area_name: 'Dumraon', district: 'Buxar', state: 'Bihar' },
  { id: 5, name: 'Rajpur', area_name: 'Rajpur', district: 'Buxar', state: 'Bihar' },
  { id: 6, name: 'Ara', area_name: 'Ara', district: 'Bhojpur', state: 'Bihar' },
  { id: 7, name: 'Jagdishpur', area_name: 'Jagdishpur', district: 'Bhojpur', state: 'Bihar' },
  { id: 8, name: 'Shahpur', area_name: 'Shahpur', district: 'Bhojpur', state: 'Bihar' },
  { id: 9, name: 'Barhara', area_name: 'Barhara', district: 'Bhojpur', state: 'Bihar' },
  { id: 10, name: 'Brahmpur', area_name: 'Brahmpur', district: 'Bhojpur', state: 'Bihar' }
];

// Sample discussion posts
const samplePosts = [
  {
    title: 'Road conditions in our constituency need immediate attention',
    content: 'The main road connecting our village to the highway is in terrible condition. Potholes everywhere, making it dangerous for vehicles and pedestrians. Has anyone else noticed this issue? What can we do to get the authorities to take action?',
    constituency: 1,
    constituencyName: 'Bhabua',
    userId: 'sample_user_1',
    status: 'published',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    likesCount: 12,
    commentsCount: 8,
    tags: ['roads', 'infrastructure', 'safety'],
    media: []
  },
  {
    title: 'Healthcare facilities in rural areas - your experiences?',
    content: 'I recently visited the primary health center in our area and was disappointed with the lack of basic medicines and equipment. Many villagers have to travel 20+ km for basic healthcare. What are your experiences? Any suggestions for improvement?',
    constituency: 2,
    constituencyName: 'Chainpur',
    userId: 'sample_user_2',
    status: 'published',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    likesCount: 18,
    commentsCount: 15,
    tags: ['healthcare', 'rural', 'medicine'],
    media: []
  },
  {
    title: 'Education quality in government schools',
    content: 'My children attend the local government school. While the teachers are dedicated, the infrastructure is lacking - no proper classrooms, limited books, and no computer facilities. How can we work together to improve this?',
    constituency: 3,
    constituencyName: 'Buxar',
    userId: 'sample_user_3',
    status: 'published',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    likesCount: 25,
    commentsCount: 22,
    tags: ['education', 'schools', 'infrastructure'],
    media: []
  },
  {
    title: 'Water supply issues - summer is coming',
    content: 'With summer approaching, water scarcity is becoming a major concern in our area. The hand pumps are not working properly and the municipal water supply is irregular. How are you managing? Any solutions that worked for you?',
    constituency: 1,
    constituencyName: 'Bhabua',
    userId: 'sample_user_4',
    status: 'published',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    likesCount: 31,
    commentsCount: 19,
    tags: ['water', 'summer', 'infrastructure'],
    media: []
  },
  {
    title: 'Local market development - your thoughts?',
    content: 'I think we need a proper market area in our constituency. Currently, vendors are scattered and there\'s no organized space for local businesses. This could boost our local economy and provide better shopping options. What do you think?',
    constituency: 4,
    constituencyName: 'Dumraon',
    userId: 'sample_user_5',
    status: 'published',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    likesCount: 14,
    commentsCount: 11,
    tags: ['market', 'development', 'economy'],
    media: []
  },
  {
    title: 'Electricity problems in rural areas',
    content: 'Power cuts are becoming more frequent in our village. Sometimes we go without electricity for 8-10 hours a day. This affects our daily life, especially students who need to study. Anyone else facing similar issues?',
    constituency: 5,
    constituencyName: 'Rajpur',
    userId: 'sample_user_6',
    status: 'published',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    likesCount: 28,
    commentsCount: 16,
    tags: ['electricity', 'rural', 'power'],
    media: []
  },
  {
    title: 'Agricultural support and subsidies',
    content: 'Farmers in our constituency are struggling with rising input costs and low crop prices. The government announced several schemes but we\'re not getting proper information. How can we better access these benefits?',
    constituency: 6,
    constituencyName: 'Ara',
    userId: 'sample_user_7',
    status: 'published',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    likesCount: 35,
    commentsCount: 24,
    tags: ['agriculture', 'farmers', 'subsidies'],
    media: []
  },
  {
    title: 'Youth employment opportunities',
    content: 'Many young people in our area are educated but unemployed. We need more job opportunities and skill development programs. What initiatives would you like to see in our constituency?',
    constituency: 7,
    constituencyName: 'Jagdishpur',
    userId: 'sample_user_8',
    status: 'published',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    likesCount: 22,
    commentsCount: 18,
    tags: ['employment', 'youth', 'skills'],
    media: []
  }
];

async function setupDiscussionForum() {
  try {
    console.log('🚀 Setting up Discussion Forum...');

    // 1. Create constituencies collection
    console.log('📍 Creating constituencies...');
    const constituenciesRef = collection(db, 'constituencies');
    
    // Check if constituencies already exist
    const existingConstituencies = await getDocs(constituenciesRef);
    if (!existingConstituencies.empty) {
      console.log('✅ Constituencies already exist, skipping creation');
    } else {
      const batch = writeBatch(db);
      constituencies.forEach(constituency => {
        const constituencyRef = doc(constituenciesRef);
        batch.set(constituencyRef, {
          ...constituency,
          total_users: 0,
          level1_users: 0,
          level2_users: 0,
          level3_users: 0,
          level4_users: 0,
          last_calculated: serverTimestamp(),
          created_at: serverTimestamp()
        });
      });
      await batch.commit();
      console.log(`✅ Created ${constituencies.length} constituencies`);
    }

    // 2. Create discussion posts collection
    console.log('💬 Creating discussion posts...');
    const postsRef = collection(db, 'discussion_posts');
    
    // Check if posts already exist
    const existingPosts = await getDocs(postsRef);
    if (!existingPosts.empty) {
      console.log('✅ Discussion posts already exist, skipping creation');
    } else {
      const batch = writeBatch(db);
      samplePosts.forEach(post => {
        const postRef = doc(postsRef);
        batch.set(postRef, post);
      });
      await batch.commit();
      console.log(`✅ Created ${samplePosts.length} sample discussion posts`);
    }

    // 3. Create constituency scores collection
    console.log('📊 Creating constituency scores...');
    const scoresRef = collection(db, 'constituency_scores');
    
    // Check if scores already exist
    const existingScores = await getDocs(scoresRef);
    if (!existingScores.empty) {
      console.log('✅ Constituency scores already exist, skipping creation');
    } else {
      const batch = writeBatch(db);
      constituencies.forEach(constituency => {
        const scoreRef = doc(scoresRef);
        batch.set(scoreRef, {
          constituency_id: constituency.id,
          satisfaction_yes: Math.floor(Math.random() * 50) + 10,
          satisfaction_no: Math.floor(Math.random() * 30) + 5,
          satisfaction_total: 0,
          interaction_count: Math.floor(Math.random() * 100) + 20,
          manifesto_average: Number((Math.random() * 2 + 3).toFixed(2)), // 3.0 to 5.0
          last_updated: serverTimestamp(),
          created_at: serverTimestamp()
        });
      });
      await batch.commit();
      console.log(`✅ Created ${constituencies.length} constituency scores`);
    }

    console.log('🎉 Discussion Forum setup completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`   • ${constituencies.length} constituencies created`);
    console.log(`   • ${samplePosts.length} sample discussion posts created`);
    console.log(`   • Constituency scores initialized`);
    console.log('\n🌐 You can now use the discussion forum with:');
    console.log('   • Constituency-based filtering');
    console.log('   • Search functionality');
    console.log('   • Reddit-like post layout');
    console.log('   • Sample data for testing');

  } catch (error) {
    console.error('❌ Error setting up Discussion Forum:', error);
    process.exit(1);
  }
}

// Run the setup
if (require.main === module) {
  setupDiscussionForum()
    .then(() => {
      console.log('\n✨ Setup completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Setup failed:', error);
      process.exit(1);
    });
}

module.exports = { setupDiscussionForum };
