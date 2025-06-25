# Sistema di Geolocalizzazione Centralizzato - ReTap Web Client

## Panoramica

Il sistema di geolocalizzazione è ora centralizzato e disponibile in tutta l'app attraverso Riverpod. Questo permette all'utente di vedere i business Retap nelle vicinanze sia nella Home che nella lista business, con aggiornamenti automatici della posizione.

## Architettura

### 1. LocationProvider (Provider Centralizzato)
- **File**: `lib/providers/location_provider.dart`
- **Funzionalità**:
  - Gestione centralizzata della posizione dell'utente
  - Salvataggio/caricamento della posizione dalle SharedPreferences
  - Gestione degli errori e permessi
  - Aggiornamenti automatici della posizione

### 2. Provider Configuration
- **File**: `lib/providers/providers.dart`
- **Provider disponibili**:
  - `locationProvider`: Provider principale per la geolocalizzazione
  - `userPositionProvider`: Solo la posizione dell'utente
  - `locationStatusProvider`: Status della geolocalizzazione
  - `locationErrorProvider`: Messaggi di errore
  - `latitudeProvider` / `longitudeProvider`: Coordinate separate
  - `isLocationValidProvider`: Se la posizione è valida
  - `needsLocationRefreshProvider`: Se serve aggiornare la posizione

### 3. Inizializzazione Automatica
- **File**: `lib/widgets/location_initializer.dart`
- **Funzionalità**: Inizializza automaticamente il LocationProvider all'avvio dell'app

## Funzionalità Implementate

### 🏠 Home Screen
- **Ordinamento per distanza**: I business visitati sono ordinati per distanza dalla posizione corrente
- **Indicatore di posizione**: Mostra le coordinate attuali
- **Aggiornamento automatico**: La posizione si aggiorna automaticamente

### 📋 Business List Screen
- **Ordinamento per distanza**: Tutti i business sono ordinati per distanza
- **Indicatore di stato**: Badge che mostra lo stato della geolocalizzazione
- **Distanza visibile**: Badge di distanza su ogni card business

### 🎯 Business Cards
- **Distanza visibile**: Badge di distanza accanto allo stato aperto/chiuso
- **Formattazione intelligente**: Metri per distanze < 1km, km per distanze maggiori

## Utilizzo

### Per l'Utente
1. **Avvio app**: La posizione viene richiesta automaticamente
2. **Home**: I business visitati sono ordinati per distanza
3. **Lista business**: Tutti i business sono ordinati per distanza
4. **Aggiornamento**: La posizione si aggiorna automaticamente ogni 2 minuti

### Per lo Sviluppatore
```dart
// In un ConsumerWidget
final userPosition = ref.watch(userPositionProvider);
final locationStatus = ref.watch(locationStatusProvider);
final locationError = ref.watch(locationErrorProvider);

// Aggiornare la posizione
ref.read(locationProvider).refreshLocation();

// Controllare se la posizione è valida
final isValid = ref.watch(isLocationValidProvider);
```

## Gestione degli Errori

### Errori Comuni
1. **Servizi disabilitati**: GPS non attivo
2. **Permessi negati**: Utente non ha concesso i permessi
3. **Timeout**: Localizzazione richiede troppo tempo
4. **Posizione obsoleta**: Posizione più vecchia di 5 minuti

### Messaggi Utente
- "Ottenendo la posizione..." - Durante il caricamento
- "Business ordinati per distanza" - Quando funziona
- "Impossibile ottenere la posizione" - In caso di errore
- Pulsante "Riprova" per tentare nuovamente

## Caratteristiche Tecniche

### Persistenza
- **Salvataggio automatico**: La posizione viene salvata nelle SharedPreferences
- **Caricamento rapido**: All'avvio carica la posizione salvata se recente (< 30 min)
- **Aggiornamento intelligente**: Richiede nuova posizione solo se necessaria

### Prestazioni
- **Calcolo ottimizzato**: Formula di Haversine per distanze precise
- **Ordinamento efficiente**: Solo quando la posizione cambia
- **Cache intelligente**: Riutilizza posizioni recenti

### Privacy
- **Permessi minimi**: Solo quando necessario
- **Nessun tracking**: Posizione non viene tracciata
- **Messaggi chiari**: Spiegazione dell'utilizzo della posizione

## File Modificati

### Nuovi File
1. `lib/providers/location_provider.dart` - Provider principale
2. `lib/providers/providers.dart` - Configurazione provider
3. `lib/widgets/location_initializer.dart` - Inizializzazione
4. `lib/shared_utils/distance_calculator.dart` - Calcoli distanza

### File Aggiornati
1. `lib/main.dart` - Integrazione Riverpod
2. `lib/screens/home_screen.dart` - Ordinamento per distanza
3. `lib/screens/business_list_screen.dart` - Provider centralizzato
4. `lib/components/business_card.dart` - Visualizzazione distanza
5. `lib/components/business_list_card.dart` - Visualizzazione distanza

### Configurazione
1. `pubspec.yaml` - Dipendenza geolocator
2. `android/app/src/main/AndroidManifest.xml` - Permessi Android
3. `ios/Runner/Info.plist` - Permessi iOS

## Vantaggi del Sistema Centralizzato

### ✅ Per l'Utente
- **Esperienza coerente**: Stesso comportamento in tutta l'app
- **Aggiornamenti automatici**: Posizione sempre aggiornata
- **Performance migliori**: Caricamento rapido con cache

### ✅ Per lo Sviluppatore
- **Codice DRY**: Nessuna duplicazione della logica
- **Manutenibilità**: Gestione centralizzata degli errori
- **Scalabilità**: Facile aggiungere nuove funzionalità

### ✅ Per l'App
- **Consistenza**: Stesso comportamento ovunque
- **Affidabilità**: Gestione robusta degli errori
- **Efficienza**: Riutilizzo della posizione salvata 