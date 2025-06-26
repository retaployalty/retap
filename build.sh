#!/bin/bash

echo "🚀 Iniziando build di ReTap..."

# Install Flutter
if [ ! -d "flutter" ]; then
    echo "📱 Installando Flutter..."
    git clone https://github.com/flutter/flutter.git -b stable
fi
export PATH="$PATH:`pwd`/flutter/bin"

# Build Flutter web app
echo "🔨 Building Flutter Web Client..."
cd apps/flutter-web-client
flutter pub get

# Create a minimal .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "📝 Creating minimal .env file..."
    echo "SUPABASE_URL=https://placeholder.supabase.co" > .env
    echo "SUPABASE_ANON_KEY=placeholder_key" >> .env
fi

flutter build web --release
cd ../..

# Copy Flutter build to Next.js public directory
echo "📁 Copiando file Flutter in Next.js public..."
mkdir -p apps/website/public/app
cp -r apps/flutter-web-client/build/web/* apps/website/public/app/

# Build Next.js website
echo "🌐 Building Next.js Website..."
cd apps/website
npm install
npm run build
cd ../..

echo "✅ Build completato!" 