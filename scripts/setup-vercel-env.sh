#!/bin/bash

# 🚀 Setup Vercel Environment Variables
# Run this script to add all environment variables to Vercel

echo "🔮 Setting up Vercel Environment Variables"
echo "=========================================="
echo ""

# Check if logged in
vercel whoami > /dev/null 2>&1
if [ $? -ne 0 ]; then
  echo "❌ Not logged in to Vercel"
  echo "Run: vercel login"
  exit 1
fi

echo "✅ Logged in to Vercel"
echo ""

# Load .env file
if [ ! -f .env ]; then
  echo "❌ .env file not found!"
  exit 1
fi

echo "📄 Reading .env file..."
echo ""

# Function to add environment variable
add_env() {
  key=$1
  value=$2

  if [ -z "$value" ] || [ "$value" = "your-"* ] || [ "$value" = "PASTE"* ]; then
    echo "⏭️  Skipping $key (not configured)"
    return
  fi

  echo "➕ Adding: $key"
  echo "$value" | vercel env add "$key" production --yes > /dev/null 2>&1
  echo "$value" | vercel env add "$key" preview --yes > /dev/null 2>&1
  echo "$value" | vercel env add "$key" development --yes > /dev/null 2>&1
}

# Read .env and add variables
echo "🔄 Adding environment variables..."
echo ""

# Parse .env file
while IFS='=' read -r key value; do
  # Skip comments and empty lines
  [[ "$key" =~ ^#.*$ ]] && continue
  [[ -z "$key" ]] && continue

  # Remove quotes from value
  value=$(echo "$value" | sed 's/"//g')

  # Add to Vercel
  add_env "$key" "$value"
done < .env

echo ""
echo "✅ Environment variables added!"
echo ""
echo "🔄 Redeploying..."
vercel --prod --yes

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Try webhook verification in Meta again"
echo "2. Should work now! ✅"
