#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚀 Preparazione certificati per production...\n');

// Percorsi dei certificati
const p12Path = path.join(__dirname, '../certs/pass.com.retapcard.loyalty.p12');
const wwdrPath = path.join(__dirname, '../certs/wwdr.pem');

// Verifica che i file esistano
if (!fs.existsSync(p12Path)) {
  console.error('❌ File .p12 non trovato:', p12Path);
  process.exit(1);
}

if (!fs.existsSync(wwdrPath)) {
  console.error('❌ File WWDR non trovato:', wwdrPath);
  process.exit(1);
}

// Leggi i file
const p12Buffer = fs.readFileSync(p12Path);
const wwdrContent = fs.readFileSync(wwdrPath, 'utf8');

// Converti in base64
const p12Base64 = p12Buffer.toString('base64');

console.log('✅ Certificati preparati con successo!\n');

console.log('📋 Variabili d\'ambiente da configurare su Vercel:\n');

// Apple Wallet
console.log('🍎 Apple Wallet:');
console.log('APPLE_WALLET_P12_BASE64=');
console.log(p12Base64);
console.log('\n');

console.log('APPLE_WALLET_WWDR_PEM=');
console.log(wwdrContent);
console.log('\n');

console.log('APPLE_WALLET_CERT_PASSWORD=Rava06103!');
console.log('\n');

// Google Wallet
console.log('🤖 Google Wallet:');
console.log('GOOGLE_WALLET_ISSUER_ID=3388000000022918092');
console.log('GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL=retap-wallet-212@retap-460215.iam.gserviceaccount.com');
console.log('GOOGLE_WALLET_PRIVATE_KEY_ID=3be4fed613691c1bfdae290fc499c8b2be84697e');
console.log('GOOGLE_WALLET_PROJECT_ID=retap-460215');
console.log('GOOGLE_WALLET_CLIENT_ID=101881625879357914024');
console.log('GOOGLE_WALLET_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDekvbfNZt7p4gx\\nVzrWBHdWFCIk4m0J65M9HzROKRFZTdK9IwCKiQsD4db6vqqHKbMfTvtN1MmAJfUb\\ne6dsH1Us922PlmMwhBq/nEGWCEcujyq8iujDK8Bprxr01Ye0GoKaSA3t7PBTkha6\\n5yt7tEb2YVyjosaxYjLQsGwyjQ8aJDTVR8Lh3y/+a4PZ/Wd74WwD+/akuHUgXWFv\\n6KzDmRe1Kye+sDS3F0KG/nZFHxKhkK9FW4T8ZbiIdxC41jlpxc7z6+UC3l3MVWnn\\njaZDTFxeN9VqfL+v2ub0WYvJu6bgRkQmdwDOFfCA0Isug9tcSRYUXwT4MG3mzwlZ\\nMBB/HslBAgMBAAECggEABOWCPO0ONQZNmjKIW8xKiu43pbSlpARiw3NQ8nvfvt19\\n9olPQBT5jRfoK6EzgaSJrU1+vMayycT4AV8vItNGA6akOl6bUzZCS4MovBgFtx75\\nIG+MxSuslJSgouiSTxx+0V2mwQxjiX6hHXKzzal8vsuLuvm8HduWeSnq8PIijhNZ\\npZhFejk2lV08nrunhKM2FT9rtjFoHxZmZBML5qDmYPZe6wV6VB483TMYqzm7jYoF\\nUzR3kJ4pVC4BMDRnWbW17oWUr+9zk3ctN7Ju3P7OJ7AdN7NjYHXkoU+piUlBuhD0\\ngGuoaJCVhVzpKP+uDc2ML4jgaPc45/tZqNUiBBSRoQKBgQDvQNOLv2IYMckBHAIy\\nwjHrz55f6+C8ou2DZ4ye21/+huXbQSuNA1PE/T3iWu9DF9xeXvujXbLkZXZ1FPSw\\nsHQqHJpvJ3Id7CS9Ar6P35x5dgUPfWPDPelpyNzpS3intkd4T0+ZF0aSMdMyno4o\\nmDtlfd2OvRyMseYNfIhPYaTgYQKBgQDuJ0PBxQrldX8sg+eCBbNj3n5MyagHgR+A\\n/ypZFUC0TsqqiwrMlX6tvVcFSLQ7EVQ8nkGaqMYMNldldAvIevwzxHS6xkkTB4CM\\nsH3G/qpWtZzxI5KQ/mkUmKOE8cn3Y3KL614DLqV+bDXHEF+w8BS6QXpDj3SPiFP3\\nG4f1om4U4QKBgGiKTuUVLuubdVTCxEMhj2aWRYFsM7q5BkcQi+UtvfgdQXpYM4te\\nFNBSRyQMz9blKikiH5n2ayBZJTVrfq9lqpxr+x7ugXKJqFPeSx3aeyinZPart1es\\nSb0rQzu8+m9tujTbktA112Qx2TKZDUy3l9x07sZb44mmgfsKmxT0eXKBAoGBANzv\\nokVeRniPI3cpu5l9LmpFHAiiv/aOTKrAjgns1IUx34SNz2vyeH43/EYTp9hwgCRo\\ncNZJIsprk3K0UMYhil2AMQahM2Oq/xAGH/l/golEnR98b9mBm/yWioSoR0Txhm/V\\n3/a1zKRXQSC2yP9+CsysN//7UxhhUfwaF2zCzrshAoGBAIHlnR0NXNCPZvW17MnF\\n9ZcKzkjGPT1AsWsrEU0n5+7Eg7WCBkOC4nk7dEIHpgDD1r4F5rLwYimpBGUyrTnx\\nbgXcMc/NC84FVcIwygUgbdepC9AfFJ998X1CFlhDB5ALszZ9q6Dr4DhWDF3478v9\\n8xN9xjWMYEUFHCSu0S9lPfA5\\n-----END PRIVATE KEY-----');
console.log('\n');

console.log('🔧 Istruzioni per Vercel:');
console.log('1. Vai su https://vercel.com/dashboard');
console.log('2. Seleziona il tuo progetto');
console.log('3. Vai su Settings > Environment Variables');
console.log('4. Aggiungi le variabili sopra elencate');
console.log('5. Assicurati che siano configurate per Production');
console.log('6. Deploy! 🚀\n');

// Salva in file temporanei per facilitare il copy-paste
const envFile = path.join(__dirname, '../.env.production');
const envContent = `# Apple Wallet
APPLE_WALLET_P12_BASE64=${p12Base64}
APPLE_WALLET_WWDR_PEM=${wwdrContent.replace(/\n/g, '\\n')}
APPLE_WALLET_CERT_PASSWORD=Rava06103!

# Google Wallet
GOOGLE_WALLET_ISSUER_ID=3388000000022918092
GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL=retap-wallet-212@retap-460215.iam.gserviceaccount.com
GOOGLE_WALLET_PRIVATE_KEY_ID=3be4fed613691c1bfdae290fc499c8b2be84697e
GOOGLE_WALLET_PROJECT_ID=retap-460215
GOOGLE_WALLET_CLIENT_ID=101881625879357914024
GOOGLE_WALLET_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDekvbfNZt7p4gx\\nVzrWBHdWFCIk4m0J65M9HzROKRFZTdK9IwCKiQsD4db6vqqHKbMfTvtN1MmAJfUb\\ne6dsH1Us922PlmMwhBq/nEGWCEcujyq8iujDK8Bprxr01Ye0GoKaSA3t7PBTkha6\\n5yt7tEb2YVyjosaxYjLQsGwyjQ8aJDTVR8Lh3y/+a4PZ/Wd74WwD+/akuHUgXWFv\\n6KzDmRe1Kye+sDS3F0KG/nZFHxKhkK9FW4T8ZbiIdxC41jlpxc7z6+UC3l3MVWnn\\njaZDTFxeN9VqfL+v2ub0WYvJu6bgRkQmdwDOFfCA0Isug9tcSRYUXwT4MG3mzwlZ\\nMBB/HslBAgMBAAECggEABOWCPO0ONQZNmjKIW8xKiu43pbSlpARiw3NQ8nvfvt19\\n9olPQBT5jRfoK6EzgaSJrU1+vMayycT4AV8vItNGA6akOl6bUzZCS4MovBgFtx75\\nIG+MxSuslJSgouiSTxx+0V2mwQxjiX6hHXKzzal8vsuLuvm8HduWeSnq8PIijhNZ\\npZhFejk2lV08nrunhKM2FT9rtjFoHxZmZBML5qDmYPZe6wV6VB483TMYqzm7jYoF\\nUzR3kJ4pVC4BMDRnWbW17oWUr+9zk3ctN7Ju3P7OJ7AdN7NjYHXkoU+piUlBuhD0\\ngGuoaJCVhVzpKP+uDc2ML4jgaPc45/tZqNUiBBSRoQKBgQDvQNOLv2IYMckBHAIy\\nwjHrz55f6+C8ou2DZ4ye21/+huXbQSuNA1PE/T3iWu9DF9xeXvujXbLkZXZ1FPSw\\nsHQqHJpvJ3Id7CS9Ar6P35x5dgUPfWPDPelpyNzpS3intkd4T0+ZF0aSMdMyno4o\\nmDtlfd2OvRyMseYNfIhPYaTgYQKBgQDuJ0PBxQrldX8sg+eCBbNj3n5MyagHgR+A\\n/ypZFUC0TsqqiwrMlX6tvVcFSLQ7EVQ8nkGaqMYMNldldAvIevwzxHS6xkkTB4CM\\nsH3G/qpWtZzxI5KQ/mkUmKOE8cn3Y3KL614DLqV+bDXHEF+w8BS6QXpDj3SPiFP3\\nG4f1om4U4QKBgGiKTuUVLuubdVTCxEMhj2aWRYFsM7q5BkcQi+UtvfgdQXpYM4te\\nFNBSRyQMz9blKikiH5n2ayBZJTVrfq9lqpxr+x7ugXKJqFPeSx3aeyinZPart1es\\nSb0rQzu8+m9tujTbktA112Qx2TKZDUy3l9x07sZb44mmgfsKmxT0eXKBAoGBANzv\\nokVeRniPI3cpu5l9LmpFHAiiv/aOTKrAjgns1IUx34SNz2vyeH43/EYTp9hwgCRo\\ncNZJIsprk3K0UMYhil2AMQahM2Oq/xAGH/l/golEnR98b9mBm/yWioSoR0Txhm/V\\n3/a1zKRXQSC2yP9+CsysN//7UxhhUfwaF2zCzrshAoGBAIHlnR0NXNCPZvW17MnF\\n9ZcKzkjGPT1AsWsrEU0n5+7Eg7WCBkOC4nk7dEIHpgDD1r4F5rLwYimpBGUyrTnx\\nbgXcMc/NC84FVcIwygUgbdepC9AfFJ998X1CFlhDB5ALszZ9q6Dr4DhWDF3478v9\\n8xN9xjWMYEUFHCSu0S9lPfA5\\n-----END PRIVATE KEY-----
`;

fs.writeFileSync(envFile, envContent);
console.log(`✅ File .env.production creato in: ${envFile}`);
console.log('📝 Puoi copiare il contenuto di questo file nelle Environment Variables di Vercel'); 