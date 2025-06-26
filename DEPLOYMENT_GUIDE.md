# Guida al Deploy ReTap su Vercel

## Struttura del Deploy

Questo progetto è configurato per deployare entrambe le applicazioni su un unico progetto Vercel:

- **Website (Next.js)**: `retapcard.com` - Landing page e dashboard admin
- **Flutter Web Client**: `retapcard.com/app/*` - PWA per i clienti

## Configurazione

### 1. Dominio Principale
- **retapcard.com** → Website Next.js
- **www.retapcard.com** → Redirect a retapcard.com

### 2. Subdominio App
- **retapcard.com/app** → Flutter Web Client
- **retapcard.com/c/:cardId** → Deep link per carte specifiche

## Comandi di Deploy

### Deploy Iniziale
```bash
# Dal root del progetto
vercel --prod
```

### Deploy Successivi
```bash
# Push su main branch = deploy automatico
git push origin main
```

## Struttura dei File

```
retap/
├── vercel.json              # Configurazione principale
├── build.sh                 # Script di build
├── package.json             # Script npm
├── apps/
│   ├── website/             # Next.js app
│   │   ├── app/api/flutter-app/  # API per servire Flutter
│   │   └── next.config.ts   # Config Next.js
│   └── flutter-web-client/  # Flutter PWA
└── .vercelignore            # Esclude flutter_pos
```

## Variabili d'Ambiente

Assicurati di configurare le seguenti variabili in Vercel:

### Website
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

### Flutter Web Client
- `FLUTTER_WEB_SUPABASE_URL`
- `FLUTTER_WEB_SUPABASE_ANON_KEY`

## Troubleshooting

### Problema: Flutter app non si carica
1. Verifica che il build di Flutter sia completato
2. Controlla i log di Vercel per errori di build
3. Verifica che l'API route `/api/flutter-app` funzioni

### Problema: Website non si carica
1. Verifica che Next.js sia configurato correttamente
2. Controlla le variabili d'ambiente
3. Verifica che non ci siano conflitti di routing

### Problema: Build fallisce
1. Verifica che Flutter sia installato correttamente
2. Controlla che tutte le dipendenze siano installate
3. Verifica i permessi del file `build.sh`

## Monitoraggio

- **Vercel Dashboard**: Monitora performance e errori
- **Logs**: Controlla i log di build e runtime
- **Analytics**: Monitora traffico e performance

## Aggiornamenti

Per aggiornare l'applicazione:

1. Fai le modifiche nel codice
2. Testa localmente con `npm run dev`
3. Push su main branch
4. Vercel farà il deploy automatico

## Note Importanti

- Il progetto `flutter_pos` è escluso dal deploy
- Entrambe le app condividono lo stesso dominio
- Il routing è gestito tramite Vercel rewrites
- La Flutter app è servita tramite API routes di Next.js 