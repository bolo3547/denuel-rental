# 🔥 Firebase Secure Configuration Guide

## ⚠️ CRITICAL SECURITY WARNING

**NEVER commit Firebase service account credentials to your repository!**

Your Firebase service account contains private keys that grant full access to your Firebase project. If these credentials are exposed, malicious actors can:
- Access your database
- Delete data
- Rack up charges
- Compromise user data

## ✅ Secure Setup Instructions

### Step 1: Verify `.gitignore` Protection

Ensure these files are in your `.gitignore`:
```
.env
.env.local
.env*.local
*.pem
service-account*.json
firebase-adminsdk*.json
```

### Step 2: Create Local `.env` File

Create a `.env.local` file in your project root (this file is git-ignored):

```bash
# DO NOT COMMIT THIS FILE!

# Firebase Client SDK (public - safe for browser)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyC... (get from Firebase Console)
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=denuel-rental.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=denuel-rental
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=denuel-rental.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=110245511... (your sender ID)
NEXT_PUBLIC_FIREBASE_APP_ID=1:110245...:web:... (get from Firebase Console)
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-... (get from Firebase Console)

# Firebase Admin SDK (PRIVATE - never expose to browser)
# Option 1: Use entire service account JSON (one line, escaped)
FIREBASE_SERVICE_ACCOUNT='{"type":"service_account","project_id":"your-project-id","private_key_id":"your-key-id","private_key":"-----BEGIN PRIVATE KEY-----\\nYOUR_PRIVATE_KEY_HERE\\n-----END PRIVATE KEY-----\\n","client_email":"firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com","client_id":"your-client-id","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxxxx%40your-project.iam.gserviceaccount.com","universe_domain":"googleapis.com"}'

# Option 2: Use individual credentials (easier to read)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_STORAGE_BUCKET=your-project.appspot.com
```

**Note:** When using Option 1 (JSON), the newlines in the private key must be escaped as `\\n`. When using Option 2, use actual newlines (as shown above).

### Step 3: Get Firebase Client SDK Config

You still need the **public** client SDK configuration from Firebase Console:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `denuel-rental`
3. Click the gear icon → Project settings
4. Scroll to "Your apps" section
5. If no web app exists, click "Add app" → Web (</>)
6. Copy the config values for:
   - `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_APP_ID`
   - `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` (if Analytics enabled)

### Step 4: Test Locally

```bash
# Start your dev server
npm run dev

# Firebase should now be initialized!
# Check browser console for: "Firebase initialized" or similar
```

### Step 5: Deploy to Vercel (Production)

**DO NOT paste credentials in Vercel UI if you're streaming!**

#### Option A: Via Vercel CLI (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Add environment variables (one at a time)
vercel env add FIREBASE_SERVICE_ACCOUNT
# Paste the entire JSON when prompted (Vercel encrypts it)

# Or add individual variables
vercel env add FIREBASE_PRIVATE_KEY
vercel env add FIREBASE_CLIENT_EMAIL
vercel env add FIREBASE_PROJECT_ID
```

#### Option B: Via Vercel Dashboard
1. Go to your project on Vercel
2. Settings → Environment Variables
3. Add each variable:
   - Name: `FIREBASE_SERVICE_ACCOUNT` or individual vars
   - Value: Paste the JSON or individual value
   - Environments: Production, Preview, Development (select as needed)
   - Click "Save"

4. Redeploy your application

## 🔒 Security Checklist

- [ ] `.env.local` file created locally (git-ignored)
- [ ] Firebase credentials added to `.env.local`
- [ ] Verified `.env.local` is NOT tracked by git (`git status`)
- [ ] Environment variables added to Vercel
- [ ] Production deployment successful
- [ ] Firebase features working in production

## ⚡ Quick Test

Create a simple test to verify Firebase is working:

```typescript
// In your Next.js page or API route
import { getFirebaseApp } from '@/lib/firebase';

export default function TestPage() {
  const app = getFirebaseApp();
  
  return (
    <div>
      <h1>Firebase Status</h1>
      <p>{app ? '✅ Firebase Initialized!' : '❌ Firebase Not Configured'}</p>
    </div>
  );
}
```

## 🆘 Troubleshooting

### Error: "Firebase is not configured"
- Check that `.env.local` exists
- Verify environment variables are set correctly
- Restart your dev server

### Error: "Invalid private key"
- Ensure newlines are properly escaped (`\\n` in JSON, or actual `\n` in .env)
- Don't remove the `BEGIN` and `END` markers
- Check for extra spaces or quotes

### Error: "Permission denied" in production
- Verify environment variables are set in Vercel
- Check Firestore/Storage security rules
- Ensure service account has proper permissions

## 📚 Next Steps

1. Enable Firebase services:
   - Firestore Database
   - Firebase Storage
   - Cloud Messaging (FCM)

2. Set up security rules (see `FIREBASE.md`)

3. Start using Firebase features:
   - Real-time chat
   - File uploads
   - Push notifications

## ⚠️ Important Reminders

- **NEVER** commit `.env.local` or service account JSON files
- **NEVER** expose private keys in screenshots or logs
- **ALWAYS** use environment variables for secrets
- **ROTATE** credentials immediately if accidentally exposed
- **MONITOR** Firebase usage for suspicious activity

For more details, see `FIREBASE.md` for feature usage and examples.
