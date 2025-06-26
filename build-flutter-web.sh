#!/bin/bash

# Script per buildare l'app Flutter Web per Vercel
set -e

echo "🚀 Iniziando build Flutter Web..."

# Verifica che Flutter sia installato
if ! command -v flutter &> /dev/null; then
    echo "❌ Flutter non è installato. Installa Flutter da https://flutter.dev"
    exit 1
fi

# Vai alla directory dell'app Flutter Web
cd apps/flutter-web-client

echo "📦 Installando dipendenze Flutter..."
flutter pub get

echo "🔧 Configurando per web..."
flutter config --enable-web

echo "🏗️ Buildando per web..."
flutter build web \
    --release \
    --dart-define=FLUTTER_WEB_USE_SKIA=true \
    --dart-define=FLUTTER_WEB_AUTO_DETECT=false

echo "✅ Build Flutter Web completato!"
echo "📁 Output in: apps/flutter-web-client/build/web/"

# Torna alla root
cd ../.. 