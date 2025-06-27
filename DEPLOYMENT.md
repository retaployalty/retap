# 🚀 Guida Deployment ReTap

## Panoramica
ReTap è un sistema di carte fedeltà NFC con integrazione Apple Wallet e Google Wallet.

## 📋 Prerequisiti
- Account Vercel (gratuito)
- Account Supabase (già configurato)
- Certificati Apple Wallet (già configurati)

---

## 🔧 Step 1: Preparazione Certificati

### Esegui lo script per preparare i certificati:
```bash
cd apps/api-bff
npm run prepare-production
```

Questo script:
- Legge i certificati dalla cartella `certs/`
- Li converte in formato base64
- Crea un file `.env.production` con le variabili d'ambiente

---

## 🌐 Step 2: Deploy Backend API su Vercel

### 2.1 Connetti il repository
1. Vai su [Vercel Dashboard](https://vercel.com/dashboard)
2. Clicca "New Project"
3. Importa il repository GitHub
4. Seleziona la cartella `apps/api-bff`

### 2.2 Configura le variabili d'ambiente
Vai su **Settings > Environment Variables** e aggiungi:

```
# Supabase
SUPABASE_URL=https://egmizgydnmvpfpbzmbnj.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Apple Wallet
APPLE_WALLET_P12_BASE64=your_p12_base64
APPLE_WALLET_WWDR_PEM=your_wwdr_pem_content
APPLE_WALLET_CERT_PASSWORD=Rava06103!

# Google Wallet
GOOGLE_WALLET_ISSUER_ID=3388000000022918092
GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL=retap-wallet-212@retap-460215.iam.gserviceaccount.com
GOOGLE_WALLET_PRIVATE_KEY_ID=3be4fed613691c1bfdae290fc499c8b2be84697e
GOOGLE_WALLET_PROJECT_ID=retap-460215
GOOGLE_WALLET_CLIENT_ID=101881625879357914024
GOOGLE_WALLET_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDekvbfNZt7p4gx\nVzrWBHdWFCIk4m0J65M9HzROKRFZTdK9IwCKiQsD4db6vqqHKbMfTvtN1MmAJfUb\ne6dsH1Us922PlmMwhBq/nEGWCEcujyq8iujDK8Bprxr01Ye0GoKaSA3t7PBTkha6\n5yt7tEb2YVyjosaxYjLQsGwyjQ8aJDTVR8Lh3y/+a4PZ/Wd74WwD+/akuHUgXWFv\n6KzDmRe1Kye+sDS3F0KG/nZFHxKhkK9FW4T8ZbiIdxC41jlpxc7z6+UC3l3MVWnn\njaZDTFxeN9VqfL+v2ub0WYvJu6bgRkQmdwDOFfCA0Isug9tcSRYUXwT4MG3mzwlZ\nMBB/HslBAgMBAAECggEABOWCPO0ONQZNmjKIW8xKiu43pbSlpARiw3NQ8nvfvt19\n9olPQBT5jRfoK6EzgaSJrU1+vMayycT4AV8vItNGA6akOl6bUzZCS4MovBgFtx75\nIG+MxSuslJSgouiSTxx+0V2mwQxjiX6hHXKzzal8vsuLuvm8HduWeSnq8PIijhNZ\npZhFejk2lV08nrunhKM2FT9rtjFoHxZmZBML5qDmYPZe6wV6VB483TMYqzm7jYoF\nUzR3kJ4pVC4BMDRnWbW17oWUr+9zk3ctN7Ju3P7OJ7AdN7NjYHXkoU+piUlBuhD0\ngGuoaJCVhVzpKP+uDc2ML4jgaPc45/tZqNUiBBSRoQKBgQDvQNOLv2IYMckBHAIy\nwjHrz55f6+C8ou2DZ4ye21/+huXbQSuNA1PE/T3iWu9DF9xeXvujXbLkZXZ1FPSw\nsHQqHJpvJ3Id7CS9Ar6P35x5dgUPfWPDPelpyNzpS3intkd4T0+ZF0aSMdMyno4o\nmDtlfd2OvRyMseYNfIhPYaTgYQKBgQDuJ0PBxQrldX8sg+eCBbNj3n5MyagHgR+A\n/ypZFUC0TsqqiwrMlX6tvVcFSLQ7EVQ8nkGaqMYMNldldAvIevwzxHS6xkkTB4CM\nsH3G/qpWtZzxI5KQ/mkUmKOE8cn3Y3KL614DLqV+bDXHEF+w8BS6QXpDj3SPiFP3\nG4f1om4U4QKBgGiKTuUVLuubdVTCxEMhj2aWRYFsM7q5BkcQi+UtvfgdQXpYM4te\nFNBSRyQMz9blKikiH5n2ayBZJTVrfq9lqpxr+x7ugXKJqFPeSx3aeyinZPart1es\nSb0rQzu8+m9tujTbktA112Qx2TKZDUy3l9x07sZb44mmgfsKmxT0eXKBAoGBANzv\nokVeRniPI3cpu5l9LmpFHAiiv/aOTKrAjgns1IUx34SNz2vyeH43/EYTp9hwgCRo\ncNZJIsprk3K0UMYhil2AMQahM2Oq/xAGH/l/golEnR98b9mBm/yWioSoR0Txhm/V\n3/a1zKRXQSC2yP9+CsysN//7UxhhUfwaF2zCzrshAoGBAIHlnR0NXNCPZvW17MnF\n9ZcKzkjGPT1AsWsrEU0n5+7Eg7WCBkOC4nk7dEIHpgDD1r4F5rLwYimpBGUyrTnx\nbgXcMc/NC84FVcIwygUgbdepC9AfFJ998X1CFlhDB5ALszZ9q6Dr4DhWDF3478v9\n8xN9xjWMYEUFHCSu0S9lPfA5\n-----END PRIVATE KEY-----
```

### 2.3 Deploy
1. Clicca "Deploy"
2. Aspetta il completamento
3. Copia l'URL generato (es: `https://retap-api.vercel.app`)

---

## 🎨 Step 3: Deploy Frontend Flutter Web su Vercel

### 3.1 Connetti il repository
1. Vai su [Vercel Dashboard](https://vercel.com/dashboard)
2. Clicca "New Project"
3. Importa lo stesso repository GitHub
4. Seleziona la cartella `apps/flutter-web-client`

### 3.2 Configura il build
Vercel rileverà automaticamente che è un progetto Flutter Web.

### 3.3 Aggiorna l'URL dell'API
Nel file `apps/flutter-web-client/lib/shared_utils/apple_wallet_service.dart` e `google_wallet_service.dart`, sostituisci:
```dart
return 'https://retap-api.vercel.app';
```
con l'URL del tuo backend API.

### 3.4 Deploy
1. Clicca "Deploy"
2. Aspetta il completamento
3. Copia l'URL generato (es: `https://retap-web.vercel.app`)

---

## 🔗 Step 4: Configurazione CORS

### Nel backend API, aggiungi il dominio del frontend:
```typescript
// In apps/api-bff/src/main.ts
app.enableCors({
  origin: [
    'http://localhost:3000',
    'https://retap-web.vercel.app', // Il tuo dominio frontend
  ],
  credentials: true,
});
```

---

## ✅ Step 5: Test

### Testa le funzionalità:
1. **Registrazione carta**: Vai sul frontend e registra una nuova carta
2. **Apple Wallet**: Verifica che il file .pkpass si scarichi
3. **Google Wallet**: Verifica che il JWT si generi
4. **QR Code**: Scansiona il QR code per verificare l'UID

---

## 🔧 Troubleshooting

### Problemi comuni:

#### 1. Certificati Apple Wallet non funzionano
- Verifica che le variabili d'ambiente siano corrette
- Controlla che la password del certificato sia giusta
- Verifica che il file .p12 sia valido

#### 2. CORS errors
- Aggiungi il dominio frontend nelle impostazioni CORS
- Verifica che l'URL dell'API sia corretto nel frontend

#### 3. Build errors
- Verifica che tutte le dipendenze siano installate
- Controlla i log di build su Vercel

---

## 📱 Domini finali

Dopo il deployment avrai:
- **Backend API**: `https://retap-api.vercel.app`
- **Frontend Web**: `https://retap-web.vercel.app`
- **Database**: `https://egmizgydnmvpfpbzmbnj.supabase.co`

---

## 🎉 Risultato finale

ReTap sarà completamente online con:
- ✅ Apple Wallet funzionante
- ✅ Google Wallet funzionante
- ✅ QR code universale
- ✅ Database Supabase
- ✅ Frontend responsive
- ✅ API scalabile

**Non dovrai più eseguire `pnpm run dev` - tutto funzionerà online!** 🚀 