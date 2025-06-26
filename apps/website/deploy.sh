#!/bin/bash

# Script per il deployment su Vercel
# Assicurati di avere Vercel CLI installato: npm i -g vercel

echo "🚀 Iniziando il deployment su Vercel..."

# Controlla se siamo nella directory corretta
if [ ! -f "package.json" ]; then
    echo "❌ Errore: package.json non trovato. Assicurati di essere nella directory apps/website"
    exit 1
fi

# Installa le dipendenze
echo "📦 Installando le dipendenze..."
npm install

# Build dell'applicazione
echo "🔨 Building l'applicazione..."
npm run build

# Deploy su Vercel
echo "🚀 Deploying su Vercel..."
vercel --prod

echo "✅ Deployment completato!"
echo "🌐 Il sito sarà disponibile su: https://retapcard.com" 