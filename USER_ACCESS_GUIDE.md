# User Access Guide - DENUEL Rental Platform

## Can All Users Register, Login, and Upload Images?

### Quick Answer

| Feature | Anonymous Users | Registered Users | Access Level |
|---------|----------------|------------------|--------------|
| **View Properties** | ✅ Yes | ✅ Yes | Public |
| **Register Account** | ✅ Yes | N/A | Public |
| **Login** | ✅ Yes | N/A | Public |
| **Upload Images** | ❌ No | ✅ Yes | Authenticated Only |
| **Create Listings** | ❌ No | ✅ Yes | Authenticated Only |
| **Book Properties** | ❌ No | ✅ Yes | Authenticated Only |

---

## 1. Registration - Open to Everyone ✅

**Anyone can create an account on the platform.**

### Registration Endpoint
- **URL:** `/api/auth/register`
- **Method:** `POST`
- **Access:** Public (no authentication required)

### Required Information
```json
{
  "email": "user@example.com",
  "password": "minimum8chars"
}
```

### Optional Information
```json
{
  "name": "John Doe",
  "phone": "+260971234567",
  "role": "USER | LANDLORD | AGENT | DRIVER | SERVICE_PROVIDER",
  "serviceType": "For SERVICE_PROVIDER role only"
}
```

### Available Roles
- **USER** - Regular tenant/renter (default)
- **LANDLORD** - Property owner
- **AGENT** - Real estate agent
- **DRIVER** - Transportation service provider
- **SERVICE_PROVIDER** - Maintenance/service provider

### Security Features
✅ Email uniqueness validation (no duplicate accounts)
✅ Password hashing (bcrypt)
✅ Rate limiting (prevents spam registrations)
✅ Input validation (Zod schema)
✅ JWT token issued immediately after registration

---

## 2. Login - Open to All Registered Users ✅

**Any registered user can login with their credentials.**

### Login Endpoint
- **URL:** `/api/auth/login`
- **Method:** `POST`
- **Access:** Public (no authentication required)

### Required Information
```json
{
  "email": "user@example.com",
  "password": "yourpassword"
}
```

### Response
```json
{
  "user": {
    "id": "user-id",
    "name": "John Doe",
    "email": "user@example.com",
    "role": "USER"
  }
}
```

### Security Features
✅ Secure password verification (bcrypt)
✅ Rate limiting (prevents brute force attacks)
✅ JWT tokens (httpOnly cookies)
✅ Refresh token support
✅ Session management

---

## 3. Image Upload - Authenticated Users Only 🔒

**Users must be logged in to upload images.**

### Why Authentication is Required
1. **Spam Prevention** - Prevents unlimited anonymous uploads
2. **File Organization** - Files organized by user ID
3. **Accountability** - Track who uploaded what
4. **Storage Costs** - Prevent abuse of storage resources
5. **Content Moderation** - Link uploads to user accounts

### Upload Endpoints

#### Get Upload URL (Presigned)
- **URL:** `/api/uploads/presign`
- **Method:** `POST`
- **Access:** 🔒 Authenticated users only
- **Body:**
```json
{
  "filename": "my-image.jpg",
  "contentType": "image/jpeg"
}
```

#### Direct Upload
- **URL:** `/api/uploads/direct`
- **Method:** `POST`
- **Access:** 🔒 Authenticated users only
- **Body:** FormData with file

### Supported Storage Options
- ✅ AWS S3 (if configured)
- ✅ Vercel Blob (if configured)
- ✅ Firebase Storage (if configured)

### File Organization
```
uploads/
  ├── {userId}/
  │   ├── 1234567890-property1.jpg
  │   ├── 1234567891-property2.jpg
  │   └── 1234567892-profile.jpg
```

### Who Can Upload?
✅ **ALL authenticated users** regardless of role:
- Regular users (USER)
- Landlords (LANDLORD)
- Agents (AGENT)
- Drivers (DRIVER)
- Service providers (SERVICE_PROVIDER)

### Upload Limits
- ⚠️ File size limits depend on storage provider configuration
- ⚠️ Rate limiting may apply to prevent abuse
- ⚠️ Storage quota may be enforced per user

---

## Workflow Examples

### Example 1: New User Wants to List Property

```
1. User visits the platform (anonymous)
   ✅ Can browse public properties
   
2. User clicks "List Property"
   ⚠️ Redirected to registration page
   
3. User registers account
   POST /api/auth/register
   {
     "email": "landlord@example.com",
     "password": "securepass123",
     "role": "LANDLORD"
   }
   ✅ Account created, automatically logged in
   
4. User creates property listing
   ✅ Can upload property images
   POST /api/uploads/presign → Upload files
   
5. User submits property
   ✅ Property saved with uploaded images
```

### Example 2: Existing User Updates Profile Photo

```
1. User logs in
   POST /api/auth/login
   {
     "email": "user@example.com",
     "password": "password123"
   }
   ✅ JWT token received
   
2. User navigates to profile
   ✅ Authenticated, can access profile
   
3. User uploads profile photo
   POST /api/uploads/presign
   {
     "filename": "profile.jpg",
     "contentType": "image/jpeg"
   }
   ✅ Upload URL received
   
4. User uploads file to URL
   ✅ Image uploaded and saved
```

---

## Current Access Model Summary

### ✅ **OPEN ACCESS** (No Authentication Required)
- View homepage
- Browse properties
- Search properties
- View property details
- View services
- Register new account
- Login to existing account
- View public pages (about, contact, etc.)

### 🔒 **AUTHENTICATED ACCESS** (Login Required)
- Upload images
- Create property listings
- Book properties
- Save favorites
- Send messages
- Update profile
- View personal dashboard
- Manage own listings

### 🔐 **ADMIN ACCESS** (Admin Role Required)
- Access admin dashboard
- Manage all users
- Manage all properties
- View system settings
- Access analytics
- Moderate content

---

## Is Anonymous Upload Needed?

### Current: ❌ Anonymous users cannot upload

**Reasons for current implementation:**
- ✅ Prevents spam and abuse
- ✅ Ensures accountability
- ✅ Controls storage costs
- ✅ Enables content moderation
- ✅ Standard industry practice

### If you need to allow anonymous uploads:

⚠️ **Not recommended** but can be implemented with:
- Heavy rate limiting
- CAPTCHA verification
- Temporary file expiration
- Stricter file validation
- Content scanning/filtering

---

## Support

If you need to modify access permissions, contact the development team or refer to:
- `app/api/auth/register/route.ts` - Registration logic
- `app/api/auth/login/route.ts` - Login logic
- `app/api/uploads/*/route.ts` - Upload endpoints
- `middleware.ts` - Authentication middleware
- `lib/auth.ts` - Authentication utilities

---

## Conclusion

**Your Question:** "Will all users be able to upload images and register or login?"

**Answer:**
- ✅ **YES** - All users can **register** (create account)
- ✅ **YES** - All users can **login** (access account)
- ✅ **YES** - All **authenticated** users can **upload images**
- ❌ **NO** - Anonymous users **cannot** upload images (security measure)

**This is the standard, secure approach used by most platforms.**

Users must complete this simple flow:
1. Register (30 seconds)
2. Login (automatic after registration)
3. Upload images (immediately available)

---

*Last updated: 2026-02-08*
