# Riepilogo Migrazione a retapcard.com

## Modifiche Effettuate

### 1. File di Configurazione

#### ✅ `vercel.json`
- Creato file di configurazione per Vercel
- Configurato dominio `retapcard.com`
- Aggiunto supporto per `www.retapcard.com`

#### ✅ `next.config.ts`
- Aggiunto headers di sicurezza
- Configurato redirect da `/www` a `/`
- Mantenuto supporto per immagini remote di Supabase

#### ✅ `middleware.ts`
- Aggiunto redirect automatico da `www.retapcard.com` a `retapcard.com`
- Corretto redirect per autenticazione dashboard da `/login` a `/auth`

### 2. API Routes

#### ✅ `app/api/create-checkout-session/route.ts`
- Aggiornato fallback URL da `retap.vercel.app` a `retapcard.com`
- Mantenuto supporto per ambiente di sviluppo

#### ✅ `app/api/checkout/route.ts`
- Aggiornato fallback URL per success e cancel
- Aggiunto controllo per ambiente di produzione

### 3. Contenuti

#### ✅ `app/page.tsx`
- Aggiornato email di supporto da `info@retap.com` a `info@retapcard.com`

#### ✅ `app/checkout/page.tsx`
- Aggiornato email pagamenti da `payments@retap.com` a `payments@retapcard.com`

#### ✅ `app/success/page.tsx`
- Mantenuto link WhatsApp (già corretto)

### 4. Deployment

#### ✅ `.github/workflows/deploy.yml`
- Creato workflow GitHub Actions per deployment automatico
- Configurato per trigger su push a main
- Aggiunto build e deploy su Vercel

#### ✅ `deploy.sh`
- Creato script per deployment manuale
- Aggiunto controllo dipendenze e build

#### ✅ `DEPLOYMENT.md`
- Documentazione completa per il deployment
- Istruzioni per configurazione DNS
- Lista variabili d'ambiente necessarie

## Struttura URL Finale

```
https://retapcard.com/                    # Landing page
https://retapcard.com/dashboard           # Dashboard merchant
https://retapcard.com/auth                # Autenticazione
https://retapcard.com/checkout            # Checkout
https://retapcard.com/success             # Pagina successo
https://retapcard.com/pricing             # Prezzi
https://retapcard.com/admin-panel         # Admin panel
https://retapcard.com/c/{cardId}          # Link carte NFC
```

## Variabili d'Ambiente Necessarie

### Su Vercel
```bash
NEXT_PUBLIC_APP_URL=https://retapcard.com
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_MONTHLY_PRICE_ID=price_...
STRIPE_ANNUAL_PRICE_ID=price_...
STRIPE_ACTIVATION_FEE_PRICE_ID=price_...
STRIPE_WEBHOOK_SECRET=whsec_...
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SENDGRID_API_KEY=your_sendgrid_key
```

### GitHub Secrets (per CI/CD)
```bash
VERCEL_TOKEN=your_vercel_token
VERCEL_ORG_ID=your_org_id
VERCEL_PROJECT_ID=your_project_id
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

## Configurazione DNS

### Record A
```
Type: A
Name: @
Value: 76.76.19.19
TTL: 3600
```

### Record CNAME
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
TTL: 3600
```

## Webhook Stripe

Endpoint da configurare:
```
https://retapcard.com/api/webhooks/stripe
```

Eventi da monitorare:
- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

## Prossimi Passi

1. **Configurare il dominio su Vercel**
2. **Impostare le variabili d'ambiente**
3. **Configurare i record DNS**
4. **Aggiornare i webhook Stripe**
5. **Testare il deployment**
6. **Verificare tutti i link e funzionalità**

## Note Importanti

- ✅ Tutti i link hardcoded sono stati aggiornati
- ✅ Il supporto per ambiente di sviluppo è mantenuto
- ✅ La sicurezza è stata migliorata con headers aggiuntivi
- ✅ Il redirect www → non-www è configurato
- ✅ I link delle carte NFC funzioneranno correttamente
- ✅ L'autenticazione e i pagamenti sono configurati per il nuovo dominio 