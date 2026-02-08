# Firebase Integration Guide

This document explains how to set up and use Firebase features in the DENUEL Rental Platform.

## Overview

Firebase has been integrated to provide:
- **Real-time Chat**: Property inquiries and messaging using Firestore
- **Cloud Storage**: Alternative to S3/Vercel Blob for images and documents
- **Push Notifications**: Firebase Cloud Messaging (FCM) for mobile and web
- **Authentication**: Optional social login and phone authentication
- **Analytics**: User behavior and property view tracking

## Setup Instructions

### 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or "Create a project"
3. Enter project name (e.g., "denuel-rental")
4. Enable Google Analytics (optional)
5. Click "Create project"

### 2. Get Firebase Configuration

#### For Client-Side (Web App)

1. In Firebase Console, click the gear icon → Project settings
2. Scroll to "Your apps" section
3. Click the web icon (</>)to add a web app
4. Register your app with a nickname
5. Copy the configuration object

Add these to your `.env` file:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
```

#### For Server-Side (Admin SDK)

1. In Firebase Console, go to Project settings → Service accounts
2. Click "Generate new private key"
3. Save the JSON file securely

**Option 1: Use entire service account JSON (Recommended for Production)**
```env
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"your-project",...}
```

**Option 2: Use individual credentials (Easier for Development)**
```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_STORAGE_BUCKET=your-project.appspot.com
```

### 3. Enable Firebase Services

#### Firestore Database

1. In Firebase Console, go to Firestore Database
2. Click "Create database"
3. Choose "Start in test mode" for development (update rules later)
4. Select your preferred location
5. Click "Enable"

**Production Security Rules** (update before deploying):
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Conversations - only participants can read/write
    match /conversations/{conversationId} {
      allow read: if request.auth != null && 
        (resource.data.landlordId == request.auth.uid || 
         resource.data.tenantId == request.auth.uid);
      allow create: if request.auth != null;
      allow update: if request.auth != null && 
        (resource.data.landlordId == request.auth.uid || 
         resource.data.tenantId == request.auth.uid);
    }
    
    // Messages - only conversation participants can read/write
    match /messages/{messageId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && 
        request.resource.data.senderId == request.auth.uid;
    }
  }
}
```

#### Firebase Storage

1. In Firebase Console, go to Storage
2. Click "Get started"
3. Choose "Start in test mode" for development
4. Select your preferred location
5. Click "Done"

**Production Security Rules**:
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Property images - anyone can read, authenticated users can write
    match /properties/{propertyId}/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // User photos - anyone can read, only owner can write
    match /users/{userId}/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Rental documents - only participants can access
    match /rentals/{rentalId}/{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

#### Firebase Cloud Messaging (FCM)

1. In Firebase Console, go to Project settings → Cloud Messaging
2. Under "Web Push certificates", click "Generate key pair"
3. Copy the VAPID key

Add to `.env`:
```env
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your-vapid-public-key
```

## Usage Examples

### Real-time Chat

```typescript
import { 
  createConversation, 
  sendMessage, 
  subscribeToMessages 
} from '@/lib/firebase-chat';

// Create a conversation
const conversationId = await createConversation({
  propertyId: 'prop-123',
  propertyTitle: '2BR Apartment in Lusaka',
  landlordId: 'user-landlord-id',
  tenantId: 'user-tenant-id'
});

// Send a message
await sendMessage({
  conversationId,
  senderId: 'user-id',
  senderName: 'John Doe',
  message: 'Is this property still available?'
});

// Subscribe to messages (real-time updates)
const unsubscribe = subscribeToMessages(
  conversationId,
  (messages) => {
    console.log('New messages:', messages);
  }
);

// Cleanup
unsubscribe();
```

### Upload to Firebase Storage

```typescript
import { uploadPropertyImage } from '@/lib/firebase-storage';

// Client-side upload with progress
const file = event.target.files[0];
const url = await uploadPropertyImage(
  'property-id',
  file,
  (progress) => {
    console.log(`Upload progress: ${progress}%`);
  }
);

console.log('Image URL:', url);
```

### Send Push Notifications

```typescript
import { sendFirebasePushNotification } from '@/lib/firebase-messaging';

// Server-side push notification
await sendFirebasePushNotification(
  userFcmToken,
  {
    title: 'New Booking Request',
    body: 'You have a new booking for your property'
  },
  {
    propertyId: 'prop-123',
    bookingId: 'booking-456'
  }
);
```

## Features

### 1. Real-time Chat (`lib/firebase-chat.ts`)
- Create conversations between landlords and tenants
- Send text, image, and file messages
- Real-time message updates
- Read receipts
- Unread message counts

### 2. Cloud Storage (`lib/firebase-storage.ts`)
- Upload property images
- Upload user profile photos
- Upload rental documents
- Progress tracking
- File deletion

### 3. Push Notifications (`lib/firebase-messaging.ts`)
- Send to individual devices
- Send to multiple devices
- Topic-based subscriptions
- Notification templates

### 4. Core SDKs
- `lib/firebase.ts` - Client-side SDK
- `lib/firebase-admin.ts` - Server-side Admin SDK

## Architecture

Firebase is integrated as an **optional enhancement** to the existing platform:

- **Database**: Uses existing Prisma/PostgreSQL for core data
- **Storage**: Firebase Storage as alternative to S3/Vercel Blob
- **Messaging**: Firestore for real-time chat (separate from main DB)
- **Auth**: Can use Firebase Auth alongside JWT (optional)

This allows you to use Firebase features selectively without breaking existing functionality.

## Testing

Firebase features have graceful fallbacks when not configured:
- Functions return `null` or `false` if Firebase is not initialized
- Console warnings instead of errors
- Application continues to work with existing features

## Cost Considerations

Firebase free tier (Spark plan) includes:
- Firestore: 1 GB storage, 50K reads/day, 20K writes/day
- Storage: 5 GB, 1 GB/day downloads
- Cloud Messaging: Unlimited notifications

For production, consider the Blaze (pay-as-you-go) plan.

## Troubleshooting

### Firebase not initializing
- Check that all required environment variables are set
- Verify Firebase configuration in console
- Check console for initialization errors

### Storage uploads failing
- Verify Storage is enabled in Firebase Console
- Check security rules
- Ensure file size is within limits

### Messages not appearing
- Check Firestore security rules
- Verify conversation exists
- Check browser console for errors

## Support

For more information:
- [Firebase Documentation](https://firebase.google.com/docs)
- [Firebase Console](https://console.firebase.google.com/)
- [Firestore Documentation](https://firebase.google.com/docs/firestore)
- [Firebase Storage](https://firebase.google.com/docs/storage)
- [FCM Documentation](https://firebase.google.com/docs/cloud-messaging)
