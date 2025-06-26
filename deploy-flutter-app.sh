#!/bin/bash

echo "🚀 Deploying Flutter Web App to app.retapcard.com..."

# Build dell'app Flutter
cd apps/flutter-web-client
flutter build web --release

# Deploy su Vercel (progetto: retapcard)
vercel --prod --name retapcard

echo "✅ Flutter app deployed successfully!"
echo "🌐 App available at: https://app.retapcard.com" 