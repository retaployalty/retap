import 'package:flutter/foundation.dart';
import 'package:geolocator/geolocator.dart';
import 'package:shared_preferences/shared_preferences.dart';

enum LocationStatus {
  initial,
  loading,
  success,
  error,
  permissionDenied,
  serviceDisabled,
}

class LocationProvider extends ChangeNotifier {
  Position? _userPosition;
  LocationStatus _status = LocationStatus.initial;
  String? _errorMessage;
  bool _isInitialized = false;

  // Getters
  Position? get userPosition => _userPosition;
  LocationStatus get status => _status;
  String? get errorMessage => _errorMessage;
  bool get isInitialized => _isInitialized;
  bool get hasLocation => _userPosition != null;
  
  // Coordinate getters per facilità d'uso
  double? get latitude => _userPosition?.latitude;
  double? get longitude => _userPosition?.longitude;

  /// Inizializza il provider e carica la posizione salvata
  Future<void> initialize() async {
    if (_isInitialized) return;
    
    _isInitialized = true;
    
    // Prova a caricare la posizione salvata
    await _loadSavedLocation();
    
    // Richiedi la posizione corrente
    await getCurrentLocation();
  }

  /// Carica la posizione salvata dalle SharedPreferences
  Future<void> _loadSavedLocation() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final savedLat = prefs.getDouble('saved_latitude');
      final savedLon = prefs.getDouble('saved_longitude');
      final savedTimestamp = prefs.getInt('location_timestamp');
      
      if (savedLat != null && savedLon != null && savedTimestamp != null) {
        final savedTime = DateTime.fromMillisecondsSinceEpoch(savedTimestamp);
        final now = DateTime.now();
        final difference = now.difference(savedTime);
        
        // Usa la posizione salvata solo se è più recente di 30 minuti
        if (difference.inMinutes < 30) {
          _userPosition = Position(
            latitude: savedLat,
            longitude: savedLon,
            timestamp: savedTime,
            accuracy: 0,
            altitude: 0,
            heading: 0,
            speed: 0,
            speedAccuracy: 0,
            altitudeAccuracy: 0,
            headingAccuracy: 0,
          );
          _status = LocationStatus.success;
          notifyListeners();
        }
      }
    } catch (e) {
      print('Errore nel caricamento della posizione salvata: $e');
    }
  }

  /// Salva la posizione corrente nelle SharedPreferences
  Future<void> _saveLocation(Position position) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setDouble('saved_latitude', position.latitude);
      await prefs.setDouble('saved_longitude', position.longitude);
      await prefs.setInt('location_timestamp', position.timestamp?.millisecondsSinceEpoch ?? DateTime.now().millisecondsSinceEpoch);
    } catch (e) {
      print('Errore nel salvataggio della posizione: $e');
    }
  }

  /// Ottiene la posizione corrente dell'utente
  Future<void> getCurrentLocation() async {
    if (_status == LocationStatus.loading) return;
    
    _setStatus(LocationStatus.loading);
    
    try {
      // Controlla se i servizi di localizzazione sono abilitati
      bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        _setStatus(LocationStatus.serviceDisabled, 'I servizi di localizzazione sono disabilitati');
        return;
      }

      // Controlla i permessi
      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) {
          _setStatus(LocationStatus.permissionDenied, 'Permessi di localizzazione negati');
          return;
        }
      }
      
      if (permission == LocationPermission.deniedForever) {
        _setStatus(LocationStatus.permissionDenied, 'I permessi di localizzazione sono negati permanentemente');
        return;
      }

      // Ottieni la posizione
      final position = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
        timeLimit: const Duration(seconds: 10),
      );
      
      _userPosition = position;
      await _saveLocation(position);
      _setStatus(LocationStatus.success);
      
    } catch (e) {
      _setStatus(LocationStatus.error, e.toString());
      print('Errore geolocalizzazione: $e');
    }
  }

  /// Aggiorna la posizione (per aggiornamenti periodici)
  Future<void> refreshLocation() async {
    await getCurrentLocation();
  }

  /// Imposta lo status e notifica i listener
  void _setStatus(LocationStatus status, [String? errorMessage]) {
    _status = status;
    _errorMessage = errorMessage;
    notifyListeners();
  }

  /// Resetta lo stato di errore
  void clearError() {
    if (_status == LocationStatus.error || _status == LocationStatus.permissionDenied) {
      _setStatus(LocationStatus.initial);
    }
  }

  /// Controlla se la posizione è valida e recente
  bool get isLocationValid {
    if (_userPosition == null) return false;
    
    final now = DateTime.now();
    final locationTime = _userPosition!.timestamp ?? now;
    final difference = now.difference(locationTime);
    
    // Considera valida se è più recente di 5 minuti
    return difference.inMinutes < 5;
  }

  /// Ottiene un messaggio descrittivo per lo status corrente
  String get statusMessage {
    switch (_status) {
      case LocationStatus.initial:
        return 'Inizializzazione...';
      case LocationStatus.loading:
        return 'Ottenendo la posizione...';
      case LocationStatus.success:
        return 'Posizione aggiornata';
      case LocationStatus.error:
        return _errorMessage ?? 'Errore sconosciuto';
      case LocationStatus.permissionDenied:
        return 'Permessi di localizzazione negati';
      case LocationStatus.serviceDisabled:
        return 'Servizi di localizzazione disabilitati';
    }
  }

  /// Controlla se è necessario aggiornare la posizione
  bool get needsRefresh {
    if (_userPosition == null) return true;
    
    final now = DateTime.now();
    final locationTime = _userPosition!.timestamp ?? now;
    final difference = now.difference(locationTime);
    
    // Aggiorna se la posizione è più vecchia di 2 minuti
    return difference.inMinutes >= 2;
  }
} 