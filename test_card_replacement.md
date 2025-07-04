# Test Funzionalità Sostituzione Carta Persa

## Endpoint API Testato

### POST /cards/replace

**URL:** `https://egmizgydnmvpfpbzmbnj.supabase.co/functions/v1/api/cards/replace`

**Headers:**
```
Content-Type: application/json
x-merchant-id: {merchant_id}
```

**Body:**
```json
{
  "oldCardId": "uuid-della-carta-esistente",
  "newUid": "nuovo-uid-nfc"
}
```

**Risposta di Successo:**
```json
{
  "message": "Card replaced successfully",
  "oldUid": "vecchio-uid-nfc",
  "newUid": "nuovo-uid-nfc",
  "cardId": "uuid-della-carta",
  "customerId": "uuid-del-customer"
}
```

## Processo Flutter

### Step 1: Scansione QR
- L'utente scansiona il QR code della carta digitale del cliente
- Il sistema estrae il `cardId` dal JSON del QR code: `{"type": "retap_card", "id": "cardId", "uid": "cardUid"}`
- Viene mostrato il secondo step

### Step 2: Scrittura Nuova Carta
- L'utente avvicina una carta NTAG vuota
- Il sistema scrive il link NDEF con il `cardId` della carta originale
- Viene chiamato l'endpoint `/cards/replace` per aggiornare il database
- La schermata viene reindirizzata ai dettagli della carta sostituita

## Sicurezza

- Solo il merchant che ha emesso la carta o è associato ad essa può sostituirla
- La nuova carta deve essere vuota (non già programmata)
- Se la nuova carta appartiene già allo stesso customer, viene aggiornata l'UID
- Se la nuova carta appartiene a un customer diverso, viene restituito un errore

## Vantaggi

✅ Mantiene tutti i dati del cliente (punti, transazioni, checkpoint)
✅ Non richiede ricreazione di customer o relazioni
✅ Processo semplice e intuitivo
✅ Tracciabilità delle sostituzioni
✅ Sicurezza garantita tramite autorizzazioni merchant 