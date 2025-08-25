# Admin Panel Documentation

## Overview

The Charcha Manch Admin Panel provides comprehensive administrative capabilities for managing users, constituencies, and system settings. It includes role-based access control with multiple admin levels.

## Features

### 🔐 Role-Based Access Control
- **Super Admin**: Full system access, can manage all users and settings
- **Admin**: Can manage users and constituencies
- **Moderator**: Limited user management and content moderation
- **User**: Standard user access

### 📊 Dashboard
- System metrics and KPIs
- User growth trends
- System health monitoring
- Recent activity feed

### 👥 User Management
- View all users with search and filtering
- Update user roles and permissions
- Toggle user active/inactive status
- Delete users (with confirmation)

### 🗺️ Constituency Management
- View and manage all constituencies
- Add new constituencies
- Update constituency information
- Control constituency status (active/inactive/pending)

### 📈 Analytics
- User growth charts
- Top constituencies by engagement
- System performance metrics
- Custom date range filtering

### ⚙️ System Settings
- Maintenance mode toggle
- Email notification preferences
- Session timeout configuration
- Two-factor authentication settings
- File upload restrictions

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Firebase

Ensure your Firebase configuration is properly set up in `src/configs/firebase.ts`.

### 3. Set Up Admin Users

#### Option A: Using the Setup Script

1. Navigate to the scripts directory:
```bash
cd scripts
```

2. Update the Firebase configuration in `setup-admin.js`:
```javascript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};
```

3. Add your admin users to the script:
```javascript
const adminUsers = [
  {
    uid: 'actual-firebase-uid-1',
    email: 'admin@charchamanch.com',
    displayName: 'Super Admin',
    role: 'super_admin'
  },
  {
    uid: 'actual-firebase-uid-2',
    email: 'moderator@charchamanch.com',
    displayName: 'Moderator',
    role: 'moderator'
  }
];
```

4. Run the setup script:
```bash
node setup-admin.js
```

#### Option B: Manual Setup

1. Create a user document in Firestore:
```javascript
// Collection: users
// Document ID: [firebase-auth-uid]
{
  email: "admin@charchamanch.com",
  displayName: "Admin User",
  role: "super_admin", // or "admin", "moderator"
  isAdmin: true,
  isActive: true,
  createdAt: Timestamp,
  lastLogin: Timestamp
}
```

2. Create system settings document:
```javascript
// Collection: system
// Document ID: settings
{
  maintenanceMode: false,
  emailNotifications: true,
  sessionTimeout: 30,
  require2FA: false,
  maxFileSize: 5242880,
  allowedFileTypes: ["jpg", "jpeg", "png", "pdf", "doc", "docx"],
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### 4. Access the Admin Panel

Once setup is complete, admin users can access the panel at:
- **URL**: `/admin`
- **Navigation**: Admin link appears in the user profile dropdown

## Usage Guide

### Dashboard Overview

The dashboard provides a quick overview of:
- Total users and growth trends
- Active constituencies
- System performance metrics
- Recent system activities

### User Management

1. **View Users**: Navigate to the Users tab to see all registered users
2. **Search & Filter**: Use the search bar and role filter to find specific users
3. **Edit Users**: Click the edit icon to modify user details
4. **Role Management**: Update user roles using the role selector
5. **Status Control**: Toggle user active/inactive status

### Constituency Management

1. **View Constituencies**: Access the Constituencies tab
2. **Add New**: Click "Add Constituency" to create new entries
3. **Edit Details**: Modify constituency information as needed
4. **Status Control**: Change constituency status between active/inactive/pending

### System Settings

1. **Maintenance Mode**: Enable to put the system in maintenance mode
2. **Notifications**: Configure email notification preferences
3. **Security**: Set session timeouts and 2FA requirements
4. **File Uploads**: Configure size limits and allowed file types

## Security Features

### Authentication
- Firebase Authentication integration
- Role-based access control
- Protected admin routes

### Authorization
- Admin context validation
- Route-level protection
- Component-level access control

### Data Protection
- Input validation and sanitization
- Secure API endpoints
- Audit logging for admin actions

## Customization

### Adding New Admin Features

1. **Create Service Methods**: Add new methods to `src/services/adminService.ts`
2. **Update Interfaces**: Extend the admin interfaces as needed
3. **Add UI Components**: Create new components for new features
4. **Update Routes**: Add new admin routes if necessary

### Styling

The admin panel uses Tailwind CSS with a consistent design system:
- Color scheme: Blue primary, red for admin elements
- Responsive design for all screen sizes
- Consistent spacing and typography

### Internationalization

Support for English and Hindi languages:
- Language context integration
- Bilingual labels and messages
- RTL support for Hindi text

## Troubleshooting

### Common Issues

1. **Admin Access Denied**
   - Verify user document exists in Firestore
   - Check user role is set correctly
   - Ensure `isAdmin` field is true

2. **Firebase Connection Errors**
   - Verify Firebase configuration
   - Check Firestore rules allow admin access
   - Ensure proper authentication

3. **Component Not Rendering**
   - Check admin context is properly wrapped
   - Verify route protection is working
   - Check console for JavaScript errors

### Debug Mode

Enable debug logging by setting:
```javascript
localStorage.setItem('adminDebug', 'true');
```

## Support

For technical support or feature requests:
1. Check the console for error messages
2. Verify Firebase configuration
3. Review Firestore security rules
4. Contact the development team

## Version History

- **v1.0.0**: Initial admin panel release
  - Basic user and constituency management
  - Role-based access control
  - System settings configuration
  - Dashboard with metrics

## Contributing

To contribute to the admin panel:
1. Follow the existing code structure
2. Add proper TypeScript types
3. Include error handling
4. Test with different admin roles
5. Update documentation as needed
