# 🔥 Firebase Quick Setup - DENUEL Rental

## ⚡ Fastest Way to Get Started

You received Firebase service account credentials. Here's how to use them securely:

### Option 1: Interactive Script (Easiest) ⭐

```bash
./scripts/setup-firebase.sh
```

The script will:
1. Create `.env.local` file (git-ignored)
2. Prompt you for credentials
3. Save them securely
4. Set proper permissions

### Option 2: Manual Setup

1. **Create `.env.local` file:**
   ```bash
   touch .env.local
   chmod 600 .env.local
   ```

2. **Add your credentials:**

   Copy the JSON you received and format it as:
   
   ```bash
   FIREBASE_SERVICE_ACCOUNT='{"type":"service_account","project_id":"denuel-rental",...}'
   ```
   
   ⚠️ Important: 
   - Use single quotes around the JSON
   - Escape newlines in private_key as `\\n`
   - Keep it all on one line

3. **Get client SDK config from Firebase Console:**
   - Go to https://console.firebase.google.com/
   - Select `denuel-rental` project
   - Settings → General → Your apps → Web app
   - Copy config values

4. **Add client config to `.env.local`:**
   ```bash
   NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=denuel-rental.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=denuel-rental
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=denuel-rental.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
   NEXT_PUBLIC_FIREBASE_APP_ID=...
   NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=...
   ```

## ✅ Verify Setup

```bash
# Start dev server
npm run dev

# Check browser console for:
# "Firebase initialized" or test the connection
```

## 🚀 Deploy to Vercel

### Via CLI (Recommended):
```bash
npm i -g vercel
vercel login
vercel env add FIREBASE_SERVICE_ACCOUNT
# Paste your JSON when prompted
```

### Via Dashboard:
1. Vercel Dashboard → Your Project
2. Settings → Environment Variables
3. Add: `FIREBASE_SERVICE_ACCOUNT`
4. Paste your service account JSON
5. Save & Redeploy

## 🔥 Enable Firebase Services

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select `denuel-rental` project
3. Enable these services:
   - **Firestore Database** (for real-time chat)
   - **Storage** (for image uploads)
   - **Cloud Messaging** (for push notifications)

## 📋 Security Rules

After enabling services, update security rules:

### Firestore Rules:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /conversations/{conversationId} {
      allow read, write: if request.auth != null;
    }
    match /messages/{messageId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### Storage Rules:
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /properties/{propertyId}/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    match /users/{userId}/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## 🎯 Test Firebase Features

```typescript
// In your Next.js component or page
import { getFirebaseApp } from '@/lib/firebase';

export default function TestPage() {
  const app = getFirebaseApp();
  return <div>{app ? '✅ Firebase works!' : '❌ Not configured'}</div>;
}
```

## 🆘 Troubleshooting

| Issue | Solution |
|-------|----------|
| "Firebase not configured" | Check `.env.local` exists and has correct format |
| "Invalid private key" | Ensure newlines are escaped as `\\n` in JSON |
| "Permission denied" | Update Firestore/Storage security rules |
| Server won't start | Restart dev server after adding env vars |

## 📚 Full Documentation

- **[FIREBASE_SETUP.md](./FIREBASE_SETUP.md)** - Detailed setup guide
- **[FIREBASE.md](./FIREBASE.md)** - Feature usage & examples
- **[SECURITY_FIREBASE.md](./SECURITY_FIREBASE.md)** - Security best practices

## 🔒 Security Checklist

- [ ] Created `.env.local` file
- [ ] Added credentials to `.env.local`
- [ ] Verified `.env.local` is git-ignored (`git status`)
- [ ] Set file permissions to 600
- [ ] Added credentials to Vercel
- [ ] Enabled Firebase services
- [ ] Updated security rules
- [ ] Tested locally
- [ ] Deployed to production

## 💡 Pro Tips

1. **Use the interactive script** - It handles formatting automatically
2. **Test locally first** - Verify everything works before deploying
3. **Monitor usage** - Set up billing alerts in Firebase Console
4. **Rotate credentials** - Periodically generate new service accounts
5. **Check security rules** - Ensure they're not too permissive

---

**Need help?** Open an issue or check the full documentation above.

**Security concern?** See SECURITY_FIREBASE.md for incident response procedures.
