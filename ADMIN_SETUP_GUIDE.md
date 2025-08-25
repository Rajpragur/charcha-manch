# Charcha Manch Admin Setup Guide

## Overview
This guide explains how to set up admin access for the Charcha Manch application using Firebase Authentication and Firestore.

## Prerequisites
1. Firebase project configured with Authentication and Firestore enabled
2. User account created in Firebase Authentication
3. Proper environment variables set in `.env` file

## Environment Variables
Make sure your `.env` file contains the following Firebase configuration:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

## Setting Up Admin Access

### Method 1: Using the Admin Setup Page (Recommended)

1. **Sign in to your application** using your Firebase account
2. **Navigate to `/admin-setup`** in your browser
3. **Enter your Firebase UID or email**:
   - If you enter an email, your authenticated UID will be used automatically
   - If you enter a UID directly, make sure it matches your Firebase Authentication UID
4. **Click "Grant Admin Access"**
5. **Verify success message** - you should see "Admin access granted!"

### Method 2: Using Firebase Console

1. **Go to Firebase Console** → Your Project → Firestore Database
2. **Navigate to the `users` collection**
3. **Create a new document** with your Firebase UID as the document ID
4. **Add the following fields**:

```json
{
  "uid": "your_firebase_uid",
  "email": "your_email@example.com",
  "displayName": "Your Name",
  "role": "super_admin",
  "isAdmin": true,
  "isActive": true,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "lastLogin": "2024-01-01T00:00:00.000Z",
  "adminGrantedAt": "2024-01-01T00:00:00.000Z",
  "setupBy": "firebase_console",
  "setupByUid": "your_firebase_uid"
}
```

## Finding Your Firebase UID

### Option 1: Firebase Console
1. Go to Firebase Console → Authentication → Users
2. Find your user account
3. Copy the UID (it's a long string of characters)

### Option 2: Browser Console
1. Sign in to your application
2. Open browser console (F12)
3. Run: `console.log(auth.currentUser.uid)`

### Option 3: React DevTools
1. Install React DevTools browser extension
2. Inspect the AuthContext component
3. Look for `currentUser.uid`

## Admin Roles and Permissions

The system supports the following admin levels:

- **`super_admin`**: Full access to all admin features
- **`admin`**: Standard admin access
- **`moderator`**: Limited admin access

## Troubleshooting

### "Missing or insufficient permissions" Error

This error occurs when:
1. **User is not authenticated** - Make sure you're signed in
2. **Firestore rules not deployed** - Run `firebase deploy --only firestore:rules`
3. **Wrong collection** - Admin data goes to `users` collection, not `user_profiles`

### "Authentication Required" Message

This means you need to sign in first:
1. Go to `/signin` page
2. Sign in with your Firebase account
3. Return to `/admin-setup`

### Admin Status Not Updating

If admin status doesn't update after setup:
1. **Refresh the page** - AdminContext checks status on mount
2. **Check browser console** for any errors
3. **Verify document creation** in Firebase Console

## Security Considerations

### Current Rules (Development)
- Users can read/write to `users` collection when authenticated
- This allows admin setup but should be restricted in production

### Production Rules (Recommended)
```javascript
// Users collection - restricted to admins only
match /users/{userId} {
  allow read: if request.auth != null && request.auth.uid == userId;
  allow write: if request.auth != null && 
    get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true;
}
```

## Testing Admin Access

After setting up admin access:

1. **Navigate to `/admin`** - Should show admin panel
2. **Check admin status** - Use `useAdmin()` hook in components
3. **Verify permissions** - Admin features should be accessible

## Next Steps

Once admin access is set up:

1. **Access the admin panel** at `/admin`
2. **Set up additional admin users** if needed
3. **Configure application settings**
4. **Monitor user activity and analytics**

## Support

If you continue to experience issues:

1. **Check Firebase Console** for error logs
2. **Verify Firestore rules** are properly deployed
3. **Ensure authentication** is working correctly
4. **Review browser console** for detailed error messages

## Firestore Rules Reference

Current rules allow:
- Authenticated users to read/write to `users` collection
- Authenticated users to read/write to `admin` collection
- Users to read their own user document
- Admin setup operations for authenticated users

These rules are designed for development and should be restricted for production use.
