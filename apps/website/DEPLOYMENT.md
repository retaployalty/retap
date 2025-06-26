# Deployment su Vercel - retapcard.com

## Configurazione del Dominio

### 1. Connessione del Dominio su Vercel

1. Vai su [vercel.com](https://vercel.com) e accedi al tuo account
2. Crea un nuovo progetto o seleziona quello esistente
3. Vai su **Settings** > **Domains**
4. Aggiungi il dominio `retapcard.com`
5. Aggiungi anche `www.retapcard.com` come alias

### 2. Configurazione DNS

Configura i record DNS del tuo dominio con il tuo provider DNS:

```
Type: A
Name: @
Value: 76.76.19.19
TTL: 3600

Type: CNAME
Name: www
Value: cname.vercel-dns.com
TTL: 3600
```

### 3. Variabili d'Ambiente su Vercel

Vai su **Settings** > **Environment Variables** e configura:

```bash
# App URL
NEXT_PUBLIC_APP_URL=https://retapcard.com

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Stripe - Chiavi Live
STRIPE_SECRET_KEY=sk_live_your_live_secret_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_live_publishable_key_here

# Stripe Price IDs
STRIPE_MONTHLY_PRICE_ID=price_your_monthly_price_id_here
STRIPE_ANNUAL_PRICE_ID=price_your_annual_price_id_here
STRIPE_ACTIVATION_FEE_PRICE_ID=price_your_activation_fee_price_id_here

# Stripe Webhook Secret
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Email configuration
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SENDGRID_API_KEY=your_sendgrid_api_key_here
```

### 4. Configurazione Webhook Stripe

1. Vai su [stripe.com](https://stripe.com) > **Developers** > **Webhooks**
2. Crea un nuovo endpoint: `https://retapcard.com/api/webhooks/stripe`
3. Seleziona gli eventi:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copia il webhook secret e aggiungilo alle variabili d'ambiente

### 5. Build e Deploy

```bash
# Installa le dipendenze
npm install

# Build per produzione
npm run build

# Deploy su Vercel
vercel --prod
```

## Struttura URL

Dopo il deployment, la struttura URL sarà:

- **Landing Page**: `https://retapcard.com`
- **Dashboard**: `https://retapcard.com/dashboard`
- **Auth**: `https://retapcard.com/auth`
- **Checkout**: `https://retapcard.com/checkout`
- **Success**: `https://retapcard.com/success`
- **Pricing**: `https://retapcard.com/pricing`
- **Admin Panel**: `https://retapcard.com/admin-panel`

## Link delle Carte NFC

Le carte NFC genereranno link nel formato:
`https://retapcard.com/c/{cardId}`

## Verifica del Deployment

1. Controlla che tutti i link funzionino correttamente
2. Testa il processo di checkout
3. Verifica che i webhook Stripe funzionino
4. Controlla che l'autenticazione Supabase funzioni
5. Testa la generazione dei link delle carte NFC

## Troubleshooting

### Problemi Comuni

1. **Errore "No such price"**: Verifica che i Price IDs siano corretti
2. **Webhook non funzionanti**: Controlla l'URL del webhook e il secret
3. **Dominio non raggiungibile**: Verifica la configurazione DNS
4. **Errori di autenticazione**: Controlla le chiavi Supabase

### Log di Vercel

Controlla i log su Vercel per debug:
1. Vai su **Deployments**
2. Seleziona l'ultimo deployment
3. Clicca su **Functions** per vedere i log delle API routes

## Note Importanti

- Assicurati che tutte le variabili d'ambiente siano configurate
- Usa sempre le chiavi LIVE di Stripe per produzione
- Il dominio deve essere configurato correttamente prima del deployment
- I webhook Stripe devono puntare al dominio di produzione 