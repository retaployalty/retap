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

# Stripe
STRIPE_SECRET_KEY=your_stripe_secret_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key_here

# Stripe Price IDs (opzionali - se non configurati, usa i default)
STRIPE_MONTHLY_PRICE_ID=your_monthly_price_id_here
STRIPE_ANNUAL_PRICE_ID=your_annual_price_id_here
STRIPE_ACTIVATION_FEE_PRICE_ID=your_activation_fee_price_id_here

# Stripe Webhook Secret
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret_here
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

### Stripe
- **STRIPE_SECRET_KEY**: Chiave segreta di Stripe (inizia con `sk_`)
- **NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY**: Chiave pubblica di Stripe (inizia con `pk_`)
- **STRIPE_WEBHOOK_SECRET**: Segreto del webhook Stripe
- **Scopo**: Gestione dei pagamenti e abbonamenti

### Stripe Price IDs (Opzionali)
- **STRIPE_MONTHLY_PRICE_ID**: ID del prezzo per abbonamento mensile
- **STRIPE_ANNUAL_PRICE_ID**: ID del prezzo per abbonamento annuale
- **STRIPE_ACTIVATION_FEE_PRICE_ID**: ID del prezzo per la tassa di attivazione
- **Scopo**: Se non configurati, l'app usa i price ID di default

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
4. Copia le chiavi pubbliche e segrete
5. Per i Price IDs, vai su Products > Add product
6. Crea i prodotti per abbonamento mensile, annuale e tassa di attivazione
7. Copia i Price IDs generati
8. Per il webhook secret, vai su Developers > Webhooks e crea un nuovo endpoint

## Note Importanti

- Il file `.env.local` è già incluso nel `.gitignore` e non verrà committato
- Le variabili che iniziano con `NEXT_PUBLIC_` sono accessibili nel browser
- Le altre variabili sono accessibili solo lato server
- In produzione, configura queste variabili nel tuo hosting provider (Vercel, Netlify, etc.)
- Se i Price IDs non sono configurati, l'app usa quelli di default (assicurati che esistano nel tuo account Stripe)

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