# Discussion Forum - CharchaManch

A Reddit-style discussion forum for constituency-based conversations, built with React, TypeScript, and Firebase.

## 🚀 Features

### Core Functionality
- **Constituency-based Discussions**: Filter posts by specific constituencies
- **Reddit-style Layout**: Upvote/downvote system, comment counts, and modern card design
- **Advanced Search**: Search through posts, titles, content, and tags
- **Multiple Sort Options**: Sort by latest, trending, most active, or top posts
- **Rich Media Support**: Upload images and videos with posts
- **Tag System**: Categorize posts with relevant tags
- **Responsive Design**: Works on desktop, tablet, and mobile devices

### User Experience
- **Modern UI**: Clean, intuitive interface inspired by Reddit
- **Real-time Updates**: Live post creation and updates
- **Interactive Elements**: Hover effects, animations, and smooth transitions
- **Multi-language Support**: English and Hindi interface
- **Admin Controls**: Post moderation and approval system

## 🛠️ Setup Instructions

### 1. Prerequisites
- Node.js (v16 or higher)
- Firebase project with Firestore enabled
- Firebase Storage enabled (for media uploads)

### 2. Firebase Configuration
Update your Firebase configuration in `src/configs/firebase.ts`:

```typescript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};
```

### 3. Firestore Security Rules
Update your Firestore rules to allow discussion forum access:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Discussion posts - public read, authenticated write
    match /discussion_posts/{postId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // Constituencies - public read
    match /constituencies/{constituencyId} {
      allow read: if true;
      allow write: if false; // Admin only
    }
    
    // User profiles - user can read/write own profile
    match /user_profiles/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### 4. Install Dependencies
```bash
npm install
```

### 5. Load Sample Data
Run the setup script to populate your database with sample constituencies and discussion posts:

```bash
# Update the Firebase config in the script first
node scripts/setup-discussion-forum.js
```

This will create:
- 10 sample constituencies
- 8 sample discussion posts
- Constituency scores and statistics

## 📱 Usage

### Creating Posts
1. Click the "Create Post" button
2. Fill in the title and content
3. Select your constituency
4. Add relevant tags
5. Upload media (optional)
6. Submit for review

### Filtering and Search
- **Constituency Filter**: Use the left sidebar to filter posts by specific constituencies
- **Search**: Use the search bar to find posts by keywords, tags, or content
- **Sort Options**: Choose from Latest, Trending, Most Active, or Top posts

### Post Interactions
- **Upvote/Downvote**: Click the arrow buttons to vote on posts
- **Comments**: View and add comments to discussions
- **Share**: Share posts with others
- **Save**: Bookmark posts for later reading

## 🗄️ Database Schema

### Discussion Posts Collection
```typescript
interface DiscussionPost {
  id: string;
  title: string;
  content: string;
  constituency: number;
  constituencyName: string;
  userId: string;
  status: 'published' | 'under_review' | 'removed';
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  likesCount: number;
  commentsCount: number;
  tags: string[];
  media: {
    type: 'image' | 'video';
    url: string;
    thumbnail?: string;
  }[];
}
```

### Constituencies Collection
```typescript
interface Constituency {
  id: number;
  name: string;
  area_name: string;
  district: string;
  state: string;
  total_users: number;
  level1_users: number;
  level2_users: number;
  level3_users: number;
  level4_users: number;
  last_calculated: Timestamp;
  created_at: Timestamp;
}
```

## 🔧 Customization

### Adding New Constituencies
Update the `constituencies` array in `scripts/setup-discussion-forum.js`:

```javascript
const constituencies = [
  { id: 11, name: 'New Constituency', area_name: 'New Area', district: 'New District', state: 'Bihar' },
  // ... more constituencies
];
```

### Modifying Post Layout
The post layout is defined in `src/pages/DiscussionForum.tsx`. You can customize:
- Voting system appearance
- Post card design
- Action buttons
- Media display

### Adding New Features
The forum is built with a modular architecture. You can easily add:
- Comment system
- User reputation
- Post categories
- Advanced moderation tools

## 🚨 Troubleshooting

### Common Issues

1. **Posts not loading**
   - Check Firebase configuration
   - Verify Firestore rules
   - Check browser console for errors

2. **Media uploads failing**
   - Ensure Firebase Storage is enabled
   - Check storage rules
   - Verify file size limits (10MB max)

3. **Constituency filter not working**
   - Run the setup script to create constituencies
   - Check if constituencies collection exists in Firestore

4. **Search not working**
   - Ensure Fuse.js is properly installed
   - Check if posts have proper content structure

### Debug Mode
Enable debug logging by adding this to your browser console:
```javascript
localStorage.setItem('debug', 'true');
```

## 📊 Performance Optimization

### Database Queries
- Posts are fetched with pagination
- Constituency filtering uses indexed queries
- Search uses client-side fuzzy matching for better performance

### Caching
- Constituency data is cached locally
- Post data is refreshed on demand
- Media files are cached by the browser

## 🔒 Security Considerations

### Content Moderation
- Posts are automatically checked for inappropriate content
- Admin approval system for new posts
- User reporting system (can be implemented)

### Data Privacy
- User IDs are not exposed in public posts
- Personal information is protected
- Anonymous posting option available

## 🚀 Future Enhancements

### Planned Features
- [ ] Real-time comments and replies
- [ ] User reputation system
- [ ] Advanced moderation tools
- [ ] Mobile app version
- [ ] Push notifications
- [ ] Analytics dashboard

### Contributing
To contribute to the discussion forum:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📞 Support

For issues or questions:
1. Check the troubleshooting section
2. Review Firebase documentation
3. Check browser console for errors
4. Create an issue in the repository

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**Happy Discussing! 🎉**

The discussion forum is now ready to facilitate meaningful conversations in your constituencies.
