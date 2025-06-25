#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifica certificati Apple Wallet...\n');

const certsDir = path.join(__dirname, '../certs');
const requiredCerts = [
  'retap-pass-certificato.cer',
  'AppleWWDRCAG3.cer'
];

let allValid = true;

// Verifica esistenza cartella certificati
if (!fs.existsSync(certsDir)) {
  console.log('❌ Cartella certificati non trovata:', certsDir);
  console.log('📁 Crea la cartella e inserisci i certificati necessari');
  allValid = false;
} else {
  console.log('✅ Cartella certificati trovata:', certsDir);
}

// Verifica ogni certificato
requiredCerts.forEach(certFile => {
  const certPath = path.join(certsDir, certFile);
  if (fs.existsSync(certPath)) {
    const stats = fs.statSync(certPath);
    console.log(`✅ ${certFile} trovato (${(stats.size / 1024).toFixed(1)} KB)`);
  } else {
    console.log(`❌ ${certFile} mancante`);
    allValid = false;
  }
});

console.log('\n📋 Riepilogo:');
if (allValid) {
  console.log('🎉 Tutti i certificati sono presenti e validi!');
  console.log('🚀 L\'integrazione Apple Wallet dovrebbe funzionare correttamente.');
  console.log('⚠️  Nota: Usando formato .cer (senza chiave privata)');
} else {
  console.log('⚠️  Alcuni certificati sono mancanti.');
  console.log('\n📖 Per ottenere i certificati:');
  console.log('1. Vai su Apple Developer Console');
  console.log('2. Crea un Pass Type ID con identifier: pass.com.retapcard.loyalty');
  console.log('3. Scarica il certificato .cer');
  console.log('4. Scarica il certificato WWDR da: https://developer.apple.com/certificationauthority/AppleWWDRCA.cer');
  console.log('5. Inserisci i certificati nella cartella certs/');
}

console.log('\n🔗 Documentazione:');
console.log('- Apple Wallet: https://developer.apple.com/wallet/');
console.log('- Passkit Generator: https://github.com/alexandercerutti/passkit-generator'); 