# Sistema di Verifica dei Pagamenti - ReTap

## Panoramica

Il sistema di verifica dei pagamenti di ReTap permette agli utenti di visualizzare tutte le schermate della dashboard, ma con accesso limitato per coloro che non hanno ancora attivato un abbonamento. Gli utenti registrati ma non paganti possono navigare liberamente tra tutte le pagine, ma il contenuto delle pagine limitate appare oscurato con un overlay informativo.

## Componenti Principali

### 1. Hook `useSubscriptionStatus`
**File:** `lib/hooks/useSubscriptionStatus.ts`

Verifica se l'utente ha un abbonamento attivo nel database Supabase.

```typescript
interface SubscriptionStatus {
  hasActiveSubscription: boolean;
  isLoading: boolean;
  error: string | null;
}
```

### 2. Componente `SubscriptionOverlay`
**File:** `components/dashboard/SubscriptionOverlay.tsx`

Mostra un overlay semi-trasparente con messaggio informativo quando l'utente non ha un abbonamento attivo, permettendo di vedere il contenuto sottostante.

### 3. Componente `SubscriptionBanner`
**File:** `components/dashboard/SubscriptionBanner.tsx`

Banner informativo nella pagina tutorial per promuovere l'abbonamento.

### 4. Componente `WelcomeMessage`
**File:** `components/dashboard/WelcomeMessage.tsx`

Messaggio di benvenuto personalizzato nella dashboard per utenti senza abbonamento.

### 5. Componente `SubscriptionStatus`
**File:** `components/dashboard/SubscriptionStatus.tsx`

Indicatore dello stato dell'abbonamento nella sidebar.

## Funzionalità

### Pagine Sempre Accessibili (Nessun Overlay)
- `/dashboard/tutorial` - Pagina tutorial e guida
- `/dashboard/settings` - Impostazioni account

### Pagine con Contenuto Oscurato
- `/dashboard` - Dashboard principale (visibile ma oscurata)
- `/dashboard/customers` - Gestione clienti (visibile ma oscurata)
- `/dashboard/promotions` - Promozioni (visibile ma oscurata)
- `/dashboard/profile` - Profilo (visibile ma oscurata)

### Comportamento per Utenti Senza Abbonamento

1. **Navigazione Libera**: Gli utenti possono navigare a tutte le pagine
2. **Contenuto Visibile**: Tutte le schermate sono visibili ma leggermente oscurate
3. **Overlay Informativo**: Le pagine limitate mostrano un overlay semi-trasparente con messaggio
4. **Sidebar**: I link alle pagine limitate mostrano un'icona di lucchetto ma sono cliccabili
5. **Indicatore**: La sidebar mostra lo stato dell'abbonamento

### Comportamento per Utenti con Abbonamento

1. **Accesso Completo**: Tutte le funzionalità sono disponibili senza limitazioni
2. **Nessun Overlay**: Le pagine si caricano normalmente
3. **Indicatore Verde**: La sidebar mostra "Active" con icona verde

## Implementazione Tecnica

### Verifica Abbonamento
```typescript
// Controlla se esiste un abbonamento attivo e non scaduto
const { data: subscription } = await supabase
  .from('subscriptions')
  .select('status, end_date')
  .eq('profile_id', userId)
  .eq('status', 'active')
  .single();

const hasActiveSubscription = subscription && 
  new Date(subscription.end_date) > new Date();
```

### Layout della Dashboard
```typescript
// Nel layout della dashboard
const shouldShowOverlay = !isLoading && !hasActiveSubscription && !isAlwaysAccessible;

<SubscriptionOverlay isBlocked={shouldShowOverlay}>
  {children}
</SubscriptionOverlay>
```

### Sidebar con Link Sempre Accessibili
```typescript
// Tutti i link sono sempre cliccabili
<Link
  href={item.href}
  className={cn(
    isDisabled ? "text-muted-foreground/70" : "text-muted-foreground"
  )}
>
  {item.name}
  {isDisabled && <Lock className="h-3 w-3 ml-auto" />}
</Link>
```

## Flusso Utente

1. **Registrazione**: L'utente si registra e accede alla dashboard
2. **Verifica**: Il sistema verifica automaticamente lo stato dell'abbonamento
3. **Navigazione Libera**: L'utente può navigare a tutte le pagine
4. **Visualizzazione**: Il contenuto è visibile ma leggermente oscurato nelle pagine limitate
5. **Overlay**: Le pagine limitate mostrano un overlay informativo
6. **Promozione**: L'overlay invita ad attivare l'abbonamento
7. **Pagamento**: Clicca su "Attiva Abbonamento" per andare al checkout
8. **Attivazione**: Dopo il pagamento, l'abbonamento viene attivato via webhook
9. **Accesso Completo**: L'utente può ora interagire completamente con tutte le funzionalità

## Webhook Stripe

Il sistema utilizza i webhook di Stripe per aggiornare automaticamente lo stato dell'abbonamento:

- `checkout.session.completed` - Crea nuovo abbonamento
- `customer.subscription.updated` - Aggiorna stato abbonamento
- `customer.subscription.deleted` - Cancella abbonamento
- `invoice.payment_succeeded` - Conferma pagamento
- `invoice.payment_failed` - Marca come scaduto

## Personalizzazione

### Modificare le Pagine Accessibili
```typescript
const alwaysAccessiblePages = ['/dashboard/tutorial', '/dashboard/settings'];
```

### Modificare l'Opacità del Contenuto
```typescript
// In SubscriptionOverlay.tsx
<div className="blur-[1px] opacity-60 pointer-events-none">
  {children}
</div>
```

### Modificare l'Overlay
```typescript
// In SubscriptionOverlay.tsx
<div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-[2px]">
```

### Modificare i Colori
```typescript
// Usa le classi Tailwind per personalizzare i colori
className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg"
```

## Troubleshooting

### Problemi Comuni

1. **Overlay non scompare dopo il pagamento**
   - Verifica che il webhook Stripe sia configurato correttamente
   - Controlla i log del webhook per errori

2. **Contenuto troppo oscurato**
   - Modifica i valori di `blur` e `opacity` nel componente `SubscriptionOverlay`
   - Prova con `blur-[0.5px]` e `opacity-70` per un effetto più sottile

3. **Navigazione non funziona**
   - Verifica che `useSubscriptionStatus` restituisca i valori corretti
   - Controlla che il database abbia i record corretti

### Debug

```typescript
// Aggiungi log per debug
console.log('Subscription status:', { hasActiveSubscription, isLoading });
console.log('Current pathname:', pathname);
console.log('Should show overlay:', shouldShowOverlay);
```

## Sicurezza

- La verifica avviene sia lato client che lato server
- I webhook Stripe sono verificati con firma digitale
- Le query al database utilizzano Row Level Security (RLS)
- Gli utenti possono vedere il contenuto ma non interagire con esso senza abbonamento 