# Guida per Concedere Accesso ai Merchant

Questa guida spiega come dare accesso gratuito a un merchant senza che debba pagare l'abbonamento.

## Metodi Disponibili

### 1. Tramite Interfaccia Web (Admin Panel)

1. **Accedi all'Admin Panel**
   - Vai su `/admin-panel/grant-access`
   - Inserisci l'email del merchant
   - Clicca "Concedi Accesso"

2. **Risultato**
   - Il merchant riceverà accesso completo per 1 anno
   - Nessun pagamento richiesto
   - Sottoscrizione automaticamente attiva

### 2. Tramite Pulsante di Test (Solo Sviluppo)

1. **Accedi alle Impostazioni**
   - Vai su `/dashboard/settings`
   - Tab "Subscription"
   - Pulsante giallo "Create Test Subscription" (solo in modalità sviluppo)

2. **Risultato**
   - Crea una sottoscrizione di test per l'utente corrente
   - Durata: 1 anno
   - Nessun pagamento richiesto

### 3. Tramite API Diretta

#### Endpoint: `/api/grant-access`
```bash
POST /api/grant-access
Content-Type: application/json

{
  "merchantEmail": "merchant@example.com"
}
```

#### Endpoint: `/api/grant-access-by-id`
```bash
POST /api/grant-access-by-id
Content-Type: application/json

{
  "profileId": "uuid-del-profilo",
  "durationMonths": 12
}
```

#### Endpoint: `/api/test-subscription`
```bash
POST /api/test-subscription
Content-Type: application/json

# Crea sottoscrizione per l'utente corrente
```

## Cosa Succede Quando Concedi Accesso

1. **Creazione Sottoscrizione**
   - Piano: `base`
   - Fatturazione: `monthly`
   - Stato: `active`
   - Durata: 1 anno (o personalizzabile)
   - `stripe_subscription_id`: `null` (nessun pagamento)

2. **Accesso Completo**
   - Il merchant può accedere a tutte le funzionalità
   - Nessun overlay di blocco
   - Dashboard completamente funzionale

3. **Verifica**
   - Controlla `/dashboard/settings` per vedere lo stato
   - La sottoscrizione apparirà come "Active"

## Controlli di Sicurezza

- **Autenticazione**: Solo utenti autenticati possono usare gli endpoint
- **Duplicati**: Il sistema impedisce di creare sottoscrizioni duplicate
- **Validazione**: Verifica che il merchant esista prima di concedere accesso

## Troubleshooting

### Errore: "Merchant not found"
- Verifica che l'email sia corretta
- Assicurati che il merchant abbia completato la registrazione

### Errore: "Merchant already has an active subscription"
- Il merchant ha già accesso
- Non è necessario concedere nuovamente l'accesso

### Errore: "Unauthorized"
- Devi essere autenticato per usare gli endpoint
- Verifica di essere loggato nell'admin panel

## Note Importanti

- **Solo per Sviluppo**: Il pulsante "Create Test Subscription" è visibile solo in modalità sviluppo
- **Nessun Pagamento**: Le sottoscrizioni create tramite questi metodi non generano addebiti
- **Durata Personalizzabile**: Puoi specificare la durata in mesi tramite l'API
- **Audit Trail**: Tutte le operazioni sono registrate nel database

## Esempi di Utilizzo

### Concedere Accesso a un Nuovo Merchant
1. Il merchant si registra su ReTap
2. Vai su `/admin-panel/grant-access`
3. Inserisci la sua email
4. Clicca "Concedi Accesso"
5. Il merchant può ora usare tutte le funzionalità

### Concedere Accesso Programmaticamente
```javascript
const response = await fetch('/api/grant-access', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ merchantEmail: 'merchant@example.com' })
});

const result = await response.json();
console.log(result.message); // "Access granted to merchant@example.com for 1 year"
``` 