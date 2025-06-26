#!/bin/bash

echo "🚀 Deploying ReTap Monorepo..."

# Deploy del website (progetto: retap)
echo "📱 Deploying website to retapcard.com..."
cd apps/website
vercel --prod --name retap

# Deploy dell'app Flutter (progetto: retapcard)
echo "📱 Deploying Flutter app to app.retapcard.com..."
cd ../flutter-web-client
flutter build web --release
vercel --prod --name retapcard

echo "✅ All deployments completed successfully!"
echo "🌐 Website: https://retapcard.com"
echo "📱 Flutter App: https://app.retapcard.com" 