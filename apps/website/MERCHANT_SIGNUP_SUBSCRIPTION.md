# Merchant Signup Subscription System

## Panoramica

Il sistema di merchant signup è stato aggiornato per offrire una subscription speciale invece di un pagamento una tantum.

## Funzionalità

### Offerta Speciale
- **Primo mese**: €1.00
- **Mesi successivi**: €49.00
- **Cancellazione**: Anytime

### Come Funziona

1. **Registrazione**: Il merchant si registra tramite `/merchant-signup`
2. **Prima Subscription**: Viene creata una subscription con il price ID speciale (€1)
3. **Webhook**: Il webhook di Stripe gestisce automaticamente il cambio di prezzo
4. **Secondo mese**: Dopo 30 giorni, la subscription viene aggiornata al prezzo regolare (€49)

## Configurazione Stripe

### Price IDs Richiesti
```env
STRIPE_FIRST_MONTH_PRICE_ID=price_xxx  # €1 per il primo mese
STRIPE_REGULAR_MONTHLY_PRICE_ID=price_yyy  # €49 per i mesi successivi
```

### Webhook Events
Il sistema gestisce i seguenti eventi Stripe:
- `checkout.session.completed` - Attivazione subscription
- `invoice.payment_succeeded` - Gestione cambio prezzo
- `customer.subscription.updated` - Aggiornamento stato
- `customer.subscription.deleted` - Cancellazione

## Database Schema

### Tabella `merchants`
Nuovi campi aggiunti:
- `is_first_month_special` (boolean) - Indica se è in periodo speciale
- `first_month_end_date` (timestamp) - Fine del primo mese speciale
- `subscription_start_date` (timestamp) - Inizio subscription
- `subscription_end_date` (timestamp) - Fine subscription (null se attiva)
- `payment_status` (text) - Stato pagamento
- `activation_fee_paid` (boolean) - Tassa di attivazione pagata

## Flusso di Attivazione

1. **Checkout Session**: Crea subscription con price ID speciale
2. **Webhook**: Aggiorna merchant con flag `is_first_month_special = true`
3. **30 giorni dopo**: Webhook cambia automaticamente il prezzo
4. **Aggiornamento**: Flag `is_first_month_special` diventa `false`

## Gestione Errori

- Se il cambio di prezzo fallisce, il sistema mantiene il prezzo speciale
- I log dettagliati vengono salvati per debugging
- Fallback automatico in caso di problemi con Stripe

## Monitoraggio

### Log Importanti
- `Merchant subscription activated successfully`
- `First month special period ended, updating subscription price`
- `Subscription price updated to regular monthly rate`

### Metriche da Monitorare
- Numero di subscription attivate
- Tasso di conversione primo mese → secondo mese
- Errori nel cambio di prezzo
- Cancellazioni nel primo mese

## Note Tecniche

- Il sistema usa `proration_behavior: 'none'` per evitare addebiti extra
- Le date sono gestite in UTC per consistenza
- Il webhook è idempotente per evitare duplicazioni
- Backup automatico dei dati merchant prima delle modifiche 