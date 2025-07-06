# Guida Troubleshooting Abbonamenti ReTap

## Problema
L'abbonamento non viene creato dopo il pagamento tramite `/merchant-signup`.

## Flusso Corretto
1. **Registrazione** → Crea profilo e business
2. **Checkout Stripe** → Crea customer Stripe con metadata `supabase_id`
3. **Pagamento** → Stripe invia webhook
4. **Webhook** → Crea abbonamento attivo

## Verifiche

### 1. Configurazione Stripe
- ✅ `STRIPE_SECRET_KEY` configurato
- ✅ `STRIPE_WEBHOOK_SECRET` configurato
- ✅ Webhook configurato su `https://retapcard.com/api/webhooks/stripe`

### 2. Database
- ✅ Tabella `subscriptions` con tutti i campi necessari
- ✅ Tabella `merchants` con campi subscription
- ✅ Migrazioni applicate

### 3. Webhook Events
Il webhook gestisce questi eventi:
- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`

## Debug in Locale

### Per testare in locale:
1. **Installa Stripe CLI**:
   ```bash
   brew install stripe/stripe-cli/stripe
   ```

2. **Login a Stripe**:
   ```bash
   stripe login
   ```

3. **Avvia listener**:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

4. **Testa il pagamento** da `/merchant-signup`

## Verifiche Manuali

### 1. Controlla il Customer in Stripe
- Vai su [Stripe Dashboard](https://dashboard.stripe.com/customers)
- Cerca il customer per email
- Verifica che abbia `supabase_id` nei metadata

### 2. Controlla la Subscription in Stripe
- Vai su [Stripe Subscriptions](https://dashboard.stripe.com/subscriptions)
- Cerca la subscription per customer ID
- Verifica lo status

### 3. Controlla il Database
```sql
-- Verifica abbonamenti
SELECT * FROM subscriptions WHERE profile_id = 'your-profile-id';

-- Verifica merchant
SELECT * FROM merchants WHERE profile_id = 'your-profile-id';
```

## Log del Webhook

Il webhook logga tutti gli eventi. Controlla i log per:
- `=== CHECKOUT SESSION COMPLETED WEBHOOK ===`
- `=== SUBSCRIPTION CREATED WEBHOOK ===`
- Errori di creazione/aggiornamento

## Problemi Comuni

### 1. Webhook non raggiungibile
- **Sintomi**: Nessun log del webhook
- **Soluzione**: Usa Stripe CLI per test locale

### 2. Customer senza metadata
- **Sintomi**: "No supabase_id found in customer metadata"
- **Soluzione**: Verifica che il customer sia creato con metadata

### 3. Merchant non trovato
- **Sintomi**: "Merchant not found"
- **Soluzione**: Verifica che il merchant sia stato creato prima del pagamento

### 4. Vincolo UNIQUE violato
- **Sintomi**: Error di duplicazione subscription
- **Soluzione**: Il webhook gestisce già questo caso aggiornando l'abbonamento esistente

## Contatti
Se il problema persiste, controlla:
1. Log del webhook
2. Stripe Dashboard
3. Database Supabase 