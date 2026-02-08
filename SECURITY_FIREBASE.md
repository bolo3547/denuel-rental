# 🔐 Security Alert: Firebase Credentials

## ⚠️ CRITICAL: Private Keys Detected

If you've received or are viewing Firebase service account credentials, please follow these security guidelines:

### Immediate Actions Required:

1. **DO NOT commit credentials to the repository**
   - Never add private keys to version control
   - Never include them in screenshots or logs
   - Never share them in public channels

2. **Store credentials securely**
   - Use `.env.local` file (already git-ignored)
   - Use environment variables on hosting platforms
   - Use secret management services for production

3. **If credentials were exposed:**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Navigate to Project Settings → Service Accounts
   - Delete the compromised service account
   - Generate a new service account key
   - Update your environment variables

### Secure Configuration Steps:

#### For Local Development:
```bash
# Run the setup script
./scripts/setup-firebase.sh

# Or manually create .env.local (already git-ignored)
# See FIREBASE_SETUP.md for detailed instructions
```

#### For Production (Vercel):
```bash
# Use Vercel CLI to add secrets securely
vercel env add FIREBASE_SERVICE_ACCOUNT
# Paste the JSON when prompted

# Or use Vercel Dashboard
# Settings → Environment Variables
# Add variables there (they're encrypted)
```

### Verification Checklist:

- [ ] `.env.local` file exists and contains Firebase credentials
- [ ] `.env.local` is listed in `.gitignore`
- [ ] Verified with `git status` that `.env.local` is not tracked
- [ ] Production environment variables added to Vercel
- [ ] Old credentials revoked if previously exposed

### Files That Should NEVER Be Committed:

```
.env.local
.env*.local
service-account*.json
firebase-adminsdk*.json
*-firebase-adminsdk-*.json
firebase-service-account.json
```

These patterns are already in `.gitignore`.

### How to Check if Credentials Were Committed:

```bash
# Check git history for exposed secrets
git log --all --full-history --source --oneline -- '*.env*' '*.json'

# If found, see: https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository
```

### Firebase Security Best Practices:

1. **Use service accounts with minimal permissions**
   - Only grant necessary Firebase services access
   - Use Firestore security rules
   - Use Storage security rules

2. **Enable Firebase Authentication**
   - Require authentication for sensitive operations
   - Use proper role-based access control

3. **Monitor usage**
   - Set up billing alerts
   - Monitor for unusual activity
   - Review access logs regularly

4. **Rotate credentials regularly**
   - Generate new service accounts periodically
   - Remove old/unused service accounts

### Resources:

- [Firebase Security Documentation](https://firebase.google.com/docs/rules)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) - Detailed setup guide
- [FIREBASE.md](./FIREBASE.md) - Feature usage and security rules

### Need Help?

If you've accidentally exposed credentials:
1. **Act quickly** - revoke them immediately
2. Generate new credentials
3. Update all environments
4. Monitor for suspicious activity

---

**Remember: Security is not optional. Protect your Firebase credentials like you would protect passwords.**
