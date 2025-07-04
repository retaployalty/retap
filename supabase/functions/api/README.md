# ReTap API - Supabase Edge Functions

Questa è l'API principale di ReTap, implementata come Supabase Edge Function in Deno.

## Struttura del Progetto

```
api/
├── index.ts                 # Entry point principale
├── router.ts               # Router centrale che gestisce tutte le route
├── types.ts                # Tipi TypeScript condivisi
├── utils/
│   ├── cors.ts             # Gestione CORS e utility di risposta
│   └── supabase.ts         # Inizializzazione client Supabase
└── handlers/
    ├── customers.ts        # Gestione customers
    ├── cards.ts           # Gestione carte
    ├── transactions.ts    # Gestione transazioni
    ├── merchants.ts       # Gestione merchants
    ├── rewards.ts         # Gestione rewards e checkpoint
    └── wallet.ts          # Generazione wallet (Apple/Google)
```

## Endpoints Disponibili

### Customers
- `POST /customers` - Crea un nuovo customer

### Cards
- `GET /cards?uid=XXX` - Ottiene informazioni su una carta
- `POST /cards` - Crea una nuova carta
- `POST /cards/replace` - Sostituisce una carta persa con una nuova carta fisica
- `GET /cards/status?uid=XXX` - Verifica lo stato di una carta

### Transactions
- `GET /balance?cardId=XXX` - Ottiene il saldo di una carta
- `POST /tx` - Crea una nuova transazione

### Merchants
- `GET /merchants` - Lista tutti i merchants
- `GET /merchant-details?merchantId=XXX&cardId=XXX` - Dettagli di un merchant
- `GET /merchant-history?merchantId=XXX&cardId=XXX` - Storico di un merchant

### Rewards & Checkpoints
- `POST /redeemed_rewards` - Riscatta un reward
- `POST /checkpoints/advance` - Avanza un checkpoint
- `POST /checkpoints/rewind` - Torna indietro di un checkpoint
- `GET /rewards-and-checkpoints?merchantId=XXX&cardId=XXX` - Rewards e checkpoint disponibili

### Wallet
- `POST /apple-wallet/generate` - Genera pass per Apple Wallet
- `POST /google-wallet/generate` - Genera pass per Google Wallet

## Headers Richiesti

- `x-merchant-id`: ID del merchant per le operazioni che lo richiedono

## Sviluppo Locale

Per testare localmente:

```bash
supabase functions serve api --env-file .env.local
```

## Deployment

```bash
supabase functions deploy api
```

## Note

- Tutti gli endpoint supportano CORS
- Le risposte sono sempre in formato JSON
- Gli errori seguono un formato standardizzato
- Il codice è organizzato in moduli per facilitare la manutenzione 