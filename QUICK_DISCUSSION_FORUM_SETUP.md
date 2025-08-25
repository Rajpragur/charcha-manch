# 🚀 Quick Discussion Forum Setup

Get your discussion forum running in 5 minutes!

## ⚡ Quick Start

### 1. Update Firebase Config
Edit `scripts/setup-discussion-forum.js` and add your Firebase credentials:

```javascript
const firebaseConfig = {
  apiKey: "your-actual-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};
```

### 2. Run Setup Script
```bash
cd scripts
node setup-discussion-forum.js
```

### 3. Start the App
```bash
npm run dev
```

### 4. Visit Discussion Forum
Navigate to `/discussion-forum` in your browser

## 🎯 What You Get

✅ **10 Sample Constituencies** (Bhabua, Chainpur, Buxar, etc.)
✅ **8 Sample Discussion Posts** (roads, healthcare, education, etc.)
✅ **Reddit-style Interface** with upvote/downvote system
✅ **Constituency Filtering** and search functionality
✅ **Modern UI** with smooth animations

## 🔧 If Something Goes Wrong

### Posts Not Loading?
- Check browser console for errors
- Verify Firebase config is correct
- Ensure Firestore is enabled in Firebase console

### Can't Create Posts?
- Make sure you're signed in
- Check if Firebase Auth is enabled
- Verify Firestore write permissions

### Constituency Filter Not Working?
- Run the setup script again
- Check if constituencies collection exists in Firestore

## 📱 Test the Features

1. **Filter by Constituency**: Use the left sidebar
2. **Search Posts**: Try searching for "roads" or "healthcare"
3. **Sort Posts**: Try different sorting options
4. **Create Post**: Click "Create Post" button
5. **Load Sample Data**: Click "Load Sample Data" if needed

## 🎉 You're All Set!

Your discussion forum is now ready with:
- Sample data for testing
- Reddit-like interface
- Constituency-based filtering
- Search and sort functionality
- Modern, responsive design

**Happy Discussing! 🗣️**
