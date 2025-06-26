# Configurazione Variabili d'Ambiente

Per far funzionare correttamente l'applicazione ReTap, è necessario configurare le seguenti variabili d'ambiente.

## File .env.local

Crea un file `.env.local` nella directory `apps/website/` con il seguente contenuto:

```bash
# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Stripe - Chiavi Live (obbligatorie per produzione)
STRIPE_SECRET_KEY=sk_live_your_live_secret_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_live_publishable_key_here

# Stripe - Chiavi Test (per sviluppo)
# STRIPE_SECRET_KEY=sk_test_your_test_secret_key_here
# NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_test_publishable_key_here

# Stripe Price IDs (obbligatori - devi crearli nel tuo account Stripe)
STRIPE_MONTHLY_PRICE_ID=price_your_monthly_price_id_here
STRIPE_ANNUAL_PRICE_ID=price_your_annual_price_id_here
STRIPE_ACTIVATION_FEE_PRICE_ID=price_your_activation_fee_price_id_here

# Stripe Webhook Secret (obbligatorio per produzione)
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

## Spiegazione delle Variabili

### NEXT_PUBLIC_APP_URL
- **Sviluppo**: `http://localhost:3000`
- **Produzione**: `https://your-domain.com`
- **Scopo**: URL base dell'applicazione, utilizzato per i redirect di Stripe

### Supabase
- **NEXT_PUBLIC_SUPABASE_URL**: URL del progetto Supabase
- **NEXT_PUBLIC_SUPABASE_ANON_KEY**: Chiave anonima del progetto Supabase
- **Scopo**: Connessione al database e autenticazione

### Stripe - Chiavi API
- **STRIPE_SECRET_KEY**: Chiave segreta di Stripe (inizia con `sk_live_` per produzione, `sk_test_` per sviluppo)
- **NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY**: Chiave pubblica di Stripe (inizia con `pk_live_` per produzione, `pk_test_` per sviluppo)
- **Scopo**: Gestione dei pagamenti e abbonamenti

### Stripe Price IDs (Obbligatori)
- **STRIPE_MONTHLY_PRICE_ID**: ID del prezzo per abbonamento mensile (devi crearlo nel tuo account Stripe)
- **STRIPE_ANNUAL_PRICE_ID**: ID del prezzo per abbonamento annuale (devi crearlo nel tuo account Stripe)
- **STRIPE_ACTIVATION_FEE_PRICE_ID**: ID del prezzo per la tassa di attivazione (devi crearlo nel tuo account Stripe)
- **Scopo**: Identificano i prodotti specifici nel tuo account Stripe

### Stripe Webhook Secret
- **STRIPE_WEBHOOK_SECRET**: Segreto del webhook Stripe (inizia con `whsec_`)
- **Scopo**: Verifica l'autenticità degli eventi webhook da Stripe

## Come Ottenere le Chiavi

### Supabase
1. Vai su [supabase.com](https://supabase.com)
2. Crea un nuovo progetto o accedi a uno esistente
3. Vai su Settings > API
4. Copia l'URL del progetto e la chiave anonima

### Stripe
1. Vai su [stripe.com](https://stripe.com)
2. Accedi al dashboard
3. Vai su Developers > API keys
4. Copia le chiavi pubbliche e segrete (usa quelle LIVE per produzione)
5. Per i Price IDs, vai su Products > Add product
6. Crea i prodotti per abbonamento mensile, annuale e tassa di attivazione
7. Copia i Price IDs generati
8. Per il webhook secret, vai su Developers > Webhooks e crea un nuovo endpoint

## Note Importanti

- **Modalità Live vs Test**: 
  - Usa le chiavi `sk_live_` e `pk_live_` per produzione
  - Usa le chiavi `sk_test_` e `pk_test_` per sviluppo
- Il file `.env.local` è già incluso nel `.gitignore` e non verrà committato
- Le variabili che iniziano con `NEXT_PUBLIC_` sono accessibili nel browser
- Le altre variabili sono accessibili solo lato server
- In produzione, configura queste variabili nel tuo hosting provider (Vercel, Netlify, etc.)
- **I Price IDs sono obbligatori** e devono essere creati nel tuo account Stripe

## Risoluzione Problemi

Se ricevi l'errore "No such price", assicurati che:
1. I Price IDs siano corretti e esistano nel tuo account Stripe
2. I Price IDs corrispondano ai prodotti configurati in Stripe
3. Le variabili d'ambiente siano configurate correttamente
4. Il server sia stato riavviato dopo aver modificato il file `.env.local`

Se ricevi l'errore "Invalid URL: An explicit scheme must be provided", assicurati che:
1. `NEXT_PUBLIC_APP_URL` sia definito correttamente
2. L'URL includa il protocollo (http:// o https://)
3. Il file `.env.local` sia nella directory corretta

Se ricevi l'errore "Stripe configuration is incomplete", assicurati che:
1. Tutti i Price IDs siano configurati nel file `.env.local`
2. Le chiavi API Stripe siano corrette
3. Il server sia stato riavviato dopo le modifiche 