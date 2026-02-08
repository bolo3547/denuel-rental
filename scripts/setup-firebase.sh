#!/bin/bash

# Firebase Configuration Script for DENUEL Rental Platform
# This script helps you set up Firebase environment variables securely

echo "🔥 Firebase Configuration Setup"
echo "================================"
echo ""
echo "⚠️  WARNING: This script will create a .env.local file"
echo "    Make sure .env.local is in your .gitignore!"
echo ""

# Check if .env.local already exists
if [ -f ".env.local" ]; then
    echo "⚠️  .env.local already exists!"
    read -p "Do you want to append to it? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Setup cancelled"
        exit 1
    fi
    echo "" >> .env.local
    echo "# Firebase Configuration" >> .env.local
else
    touch .env.local
    echo "# Firebase Configuration for DENUEL Rental" > .env.local
    echo "# ⚠️  DO NOT COMMIT THIS FILE!" >> .env.local
    echo "" >> .env.local
fi

echo "📝 Please provide your Firebase configuration..."
echo ""

# Get client SDK config (public keys)
echo "==== Firebase Client SDK (Public Config) ===="
read -p "Enter NEXT_PUBLIC_FIREBASE_API_KEY: " api_key
read -p "Enter NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: " auth_domain
read -p "Enter NEXT_PUBLIC_FIREBASE_PROJECT_ID: " project_id
read -p "Enter NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: " storage_bucket
read -p "Enter NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: " sender_id
read -p "Enter NEXT_PUBLIC_FIREBASE_APP_ID: " app_id
read -p "Enter NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID (optional): " measurement_id

# Write client config
{
    echo "# Firebase Client SDK Configuration"
    echo "NEXT_PUBLIC_FIREBASE_API_KEY=$api_key"
    echo "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=$auth_domain"
    echo "NEXT_PUBLIC_FIREBASE_PROJECT_ID=$project_id"
    echo "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=$storage_bucket"
    echo "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=$sender_id"
    echo "NEXT_PUBLIC_FIREBASE_APP_ID=$app_id"
    [ -n "$measurement_id" ] && echo "NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=$measurement_id"
    echo ""
} >> .env.local

echo ""
echo "==== Firebase Admin SDK (Private Config) ===="
echo "Choose configuration method:"
echo "1) Paste entire service account JSON (recommended)"
echo "2) Enter individual credentials"
read -p "Enter choice (1 or 2): " -n 1 -r
echo ""

if [[ $REPLY == "1" ]]; then
    echo "Paste your service account JSON (Ctrl+D when done):"
    service_account_json=$(cat)
    # Minify and escape JSON
    service_account_json_escaped=$(echo "$service_account_json" | jq -c | sed 's/"/\\"/g')
    echo "FIREBASE_SERVICE_ACCOUNT=\"$service_account_json_escaped\"" >> .env.local
else
    read -p "Enter FIREBASE_PROJECT_ID: " admin_project_id
    echo "Enter FIREBASE_PRIVATE_KEY (paste the entire key including BEGIN/END markers, then Ctrl+D):"
    private_key=$(cat)
    read -p "Enter FIREBASE_CLIENT_EMAIL: " client_email
    read -p "Enter FIREBASE_STORAGE_BUCKET: " admin_storage_bucket
    
    {
        echo "# Firebase Admin SDK Configuration"
        echo "FIREBASE_PROJECT_ID=$admin_project_id"
        echo "FIREBASE_PRIVATE_KEY=\"$private_key\""
        echo "FIREBASE_CLIENT_EMAIL=$client_email"
        echo "FIREBASE_STORAGE_BUCKET=$admin_storage_bucket"
    } >> .env.local
fi

echo ""
echo "✅ Firebase configuration saved to .env.local"
echo ""
echo "📋 Next steps:"
echo "1. Verify .env.local is NOT tracked by git: git status"
echo "2. Start your dev server: npm run dev"
echo "3. Test Firebase connection"
echo ""
echo "🚀 For production (Vercel):"
echo "   Add these same variables to your Vercel project settings"
echo "   Settings → Environment Variables"
echo ""
echo "📚 See FIREBASE_SETUP.md for detailed instructions"

# Set appropriate permissions
chmod 600 .env.local

echo ""
echo "🔒 Set .env.local permissions to 600 (owner read/write only)"
echo "✅ Setup complete!"
