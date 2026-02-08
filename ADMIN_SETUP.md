# Admin Setup Guide

## Default Admin Credentials

### Username and Password

**Email:** `admin@denuel.local`  
**Password:** `Admin#1234`

These default credentials are created automatically when you run the database seed script.

---

## How Admin is Created

### 1. Database Seed Script

When you run the seed script, it creates the admin user:

```bash
npm run seed
```

**Location:** `prisma/seed.ts`

The seed script:
- Creates admin user with email `admin@denuel.local`
- Sets password to `Admin#1234` (bcrypt hashed)
- Assigns `ADMIN` role
- Sets name to "Admin"
- Adds default phone number

### 2. Password Reset Script

If you need to reset the admin password:

```bash
npx ts-node scripts/reset-admin-password.ts
```

**Location:** `scripts/reset-admin-password.ts`

This script:
- Finds or creates user with email `admin@denuel.local`
- Resets password to `Admin#1234`
- Ensures role is set to `ADMIN`
- Works even if admin user already exists

---

## Accessing Admin Panel

### Login Process

1. **Navigate to login page:**
   - Development: `http://localhost:3000/auth/login`
   - Production: `https://your-domain.com/auth/login`

2. **Enter credentials:**
   - Email: `admin@denuel.local`
   - Password: `Admin#1234`

3. **Access admin dashboard:**
   - After login, go to: `/admin`
   - Or click "Admin" in the navigation menu

### Protected Admin Routes

All these routes require admin role:

- `/admin` - Admin dashboard home
- `/admin/users` - User management
- `/admin/properties` - Property management
- `/admin/approvals` - Approval queue
- `/admin/service-providers` - Service provider management
- `/admin/drivers` - Driver management
- `/admin/settings` - System settings
- `/admin/revenue` - Revenue reports
- `/admin/analytics` - Analytics dashboard
- `/admin/support` - Support tickets
- `/admin/verifications` - Document verifications
- And more...

---

## Security Best Practices

### ⚠️ IMPORTANT: Change Default Password

**For production environments, you MUST:**

1. **Change the default password immediately after first deployment**
2. **Use a strong, unique password**
3. **Store credentials securely** (use a password manager)

### Recommended Security Steps

1. **Change Default Email**
   ```typescript
   // Update in seed script or via database
   email: 'your-real-admin@yourdomain.com'
   ```

2. **Use Strong Password**
   - Minimum 12 characters
   - Mix of uppercase, lowercase, numbers, symbols
   - Not a dictionary word
   - Unique to this application

3. **Secure Storage**
   - Use environment variables for production
   - Never commit real passwords to version control
   - Use secret management services (AWS Secrets Manager, etc.)

4. **Regular Rotation**
   - Change admin password every 90 days
   - Use password reset script
   - Document changes securely

5. **Monitor Admin Activity**
   - Review admin action logs regularly
   - Set up alerts for suspicious activity
   - Audit admin access patterns

6. **Limit Admin Accounts**
   - Create admin accounts only when necessary
   - Remove admin access when no longer needed
   - Use role-based permissions where possible

---

## Password Management

### Resetting Admin Password

**Method 1: Using Reset Script (Recommended)**

```bash
npx ts-node scripts/reset-admin-password.ts
```

This will:
- Reset password to `Admin#1234`
- Ensure admin role is set
- Work immediately

**Method 2: Via Database**

If you have direct database access:

```sql
-- Find the admin user ID first
SELECT id, email, role FROM User WHERE email = 'admin@denuel.local';

-- Update password (you need to generate bcrypt hash)
-- Hash for 'Admin#1234': $2a$10$... (generate with bcrypt)
UPDATE User 
SET password = '$2a$10$YOUR_BCRYPT_HASH_HERE'
WHERE email = 'admin@denuel.local';
```

**Method 3: Create New Admin via Seed**

```bash
# Re-run seed script
npm run seed
```

### Creating Additional Admin Users

You can create multiple admin users via the database:

```typescript
// Add to seed.ts or create via API
const newAdmin = await prisma.user.create({
  data: {
    name: 'Admin Name',
    email: 'admin2@denuel.local',
    password: bcrypt.hashSync('SecurePassword123!', 10),
    role: 'ADMIN',
    phone: '+260123456789'
  }
});
```

---

## Environment Variables (Production)

### Recommended Setup

For production, use environment variables:

**.env.production:**

```bash
# Admin Configuration
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=YourSecurePassword123!
ADMIN_NAME=Your Name

# Or use a secure secret management service
ADMIN_CREDENTIALS_SECRET=arn:aws:secretsmanager:region:account:secret:admin-creds
```

### Update Seed Script

Modify `prisma/seed.ts` to use environment variables:

```typescript
const adminEmail = process.env.ADMIN_EMAIL || 'admin@denuel.local';
const adminPassword = bcrypt.hashSync(
  process.env.ADMIN_PASSWORD || 'Admin#1234', 
  10
);
const adminName = process.env.ADMIN_NAME || 'Admin';

const admin = await prisma.user.upsert({
  where: { email: adminEmail },
  update: { password: adminPassword, role: 'ADMIN' },
  create: {
    name: adminName,
    email: adminEmail,
    password: adminPassword,
    role: 'ADMIN',
  }
});
```

---

## Troubleshooting

### Can't Login

**Problem:** Admin credentials don't work

**Solutions:**
1. Verify you're using correct email: `admin@denuel.local`
2. Verify password: `Admin#1234` (case-sensitive)
3. Check database was seeded: `npm run seed`
4. Reset password: `npx ts-node scripts/reset-admin-password.ts`
5. Check user role in database:
   ```sql
   SELECT email, role FROM User WHERE email = 'admin@denuel.local';
   ```

### Forgot Password

**Solution:**
```bash
# Run reset script
npx ts-node scripts/reset-admin-password.ts

# This resets to: Admin#1234
```

### Database Not Seeded

**Problem:** Admin user doesn't exist

**Solution:**
```bash
# Run migrations first
npx prisma migrate dev

# Then seed database
npm run seed
```

### Account Locked

**Problem:** Too many failed login attempts

**Solution:**
- Check if rate limiting is enabled
- Wait 15-30 minutes
- Or reset via database directly

### Wrong Role

**Problem:** User exists but not admin

**Solution:**
```sql
UPDATE User 
SET role = 'ADMIN' 
WHERE email = 'admin@denuel.local';
```

---

## Admin Features Access

### What Admin Can Do

With admin credentials, you can:

✅ **User Management**
- View all users
- Edit user details
- Change user roles
- Suspend/activate accounts
- View user activity

✅ **Property Management**
- Approve/reject listings
- Edit property details
- Feature properties
- Manage property status
- View property analytics

✅ **Service Provider Management**
- Approve/reject applications
- Verify documents
- Manage service provider profiles
- View work experience and certifications

✅ **Driver Management**
- Approve driver applications
- Verify licenses
- Manage driver availability
- View transport bookings

✅ **Financial Management**
- View revenue reports
- Manage subscriptions
- Process refunds
- View transaction history

✅ **System Settings**
- Configure platform settings
- Manage system parameters
- Update business rules
- Configure integrations

✅ **Support**
- View support tickets
- Respond to inquiries
- Manage testimonials
- Handle disputes

✅ **Analytics**
- View platform metrics
- User growth analytics
- Revenue analytics
- Performance dashboards

---

## First-Time Setup Checklist

### Initial Setup (Development)

- [ ] Install dependencies: `npm install`
- [ ] Setup database: `npx prisma migrate dev`
- [ ] Seed database: `npm run seed`
- [ ] Start dev server: `npm run dev`
- [ ] Login with: `admin@denuel.local` / `Admin#1234`
- [ ] Access admin panel: `http://localhost:3000/admin`

### Production Deployment

- [ ] Deploy application to Vercel/hosting
- [ ] Configure environment variables
- [ ] Run database migrations
- [ ] Seed database with admin user
- [ ] **Change default admin password immediately**
- [ ] Change admin email to real address
- [ ] Test admin login
- [ ] Configure admin notification emails
- [ ] Set up 2FA (if available)
- [ ] Document new credentials securely

### Security Checklist

- [ ] Changed default password
- [ ] Using strong, unique password
- [ ] Admin email changed to real address
- [ ] Credentials stored in password manager
- [ ] Environment variables configured
- [ ] 2FA enabled (if available)
- [ ] Admin activity monitoring setup
- [ ] Password rotation schedule created
- [ ] Backup admin accounts created (if needed)

---

## Support

### Need Help?

**Documentation:**
- [Main README](./README.md)
- [Deployment Guide](./DEPLOYMENT_GUIDE.md)
- [Service Provider Guide](./SERVICE_PROVIDER_GUIDE.md)

**Scripts:**
- Password Reset: `scripts/reset-admin-password.ts`
- Database Seed: `prisma/seed.ts`

**Database:**
- Schema: `prisma/schema.prisma`
- Migrations: `prisma/migrations/`

---

## Quick Reference

### Default Credentials
```
Email: admin@denuel.local
Password: Admin#1234
```

### Reset Password
```bash
npx ts-node scripts/reset-admin-password.ts
```

### Seed Database
```bash
npm run seed
```

### Admin Dashboard
```
Development: http://localhost:3000/admin
Production: https://your-domain.com/admin
```

---

**Remember:** Always change default credentials in production! 🔐
