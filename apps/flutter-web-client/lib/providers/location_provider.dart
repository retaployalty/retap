import 'package:flutter/foundation.dart';
import 'package:geolocator/geolocator.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'dart:async';

enum LocationStatus {
  initial,
  loading,
  success,
  error,
  permissionDenied,
  serviceDisabled,
}

class LocationState {
  final LocationStatus status;
  final double? latitude;
  final double? longitude;
  final String? errorMessage;
  final List<String> logs;

  LocationState({
    this.status = LocationStatus.initial,
    this.latitude,
    this.longitude,
    this.errorMessage,
    this.logs = const [],
  });

  LocationState copyWith({
    LocationStatus? status,
    double? latitude,
    double? longitude,
    String? errorMessage,
    List<String>? logs,
  }) {
    return LocationState(
      status: status ?? this.status,
      latitude: latitude ?? this.latitude,
      longitude: longitude ?? this.longitude,
      errorMessage: errorMessage ?? this.errorMessage,
      logs: logs ?? this.logs,
    );
  }
}

class LocationNotifier extends StateNotifier<LocationState> {
  LocationNotifier() : super(LocationState()) {
    _loadSavedLocation();
  }

  void _addLog(String message) {
    final timestamp = DateTime.now().toString().substring(11, 19);
    final logEntry = '[$timestamp] $message';
    state = state.copyWith(logs: [...state.logs, logEntry]);
    print(logEntry);
  }

  Future<void> _loadSavedLocation() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final savedLat = prefs.getDouble('saved_latitude');
      final savedLng = prefs.getDouble('saved_longitude');
      
      if (savedLat != null && savedLng != null) {
        _addLog('Caricata posizione salvata: $savedLat, $savedLng');
        state = state.copyWith(
          status: LocationStatus.success,
          latitude: savedLat,
          longitude: savedLng,
        );
      }
    } catch (e) {
      _addLog('Errore nel caricare posizione salvata: $e');
    }
  }

  Future<void> _saveLocation(double latitude, double longitude) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setDouble('saved_latitude', latitude);
      await prefs.setDouble('saved_longitude', longitude);
      _addLog('Posizione salvata: $latitude, $longitude');
    } catch (e) {
      _addLog('Errore nel salvare posizione: $e');
    }
  }

  Future<void> getCurrentLocation() async {
    _addLog('Richiesta posizione corrente...');
    state = state.copyWith(status: LocationStatus.loading);

    try {
      final position = await _getLocationWithGeolocator();
      if (position != null) {
        await _saveLocation(position.latitude, position.longitude);
        state = state.copyWith(
          status: LocationStatus.success,
          latitude: position.latitude,
          longitude: position.longitude,
        );
        _addLog('Posizione ottenuta: ${position.latitude}, ${position.longitude}');
        return;
      }
    } catch (e) {
      _addLog('Errore con geolocator: $e');
    }

    // Se arriviamo qui, c'è stato un errore
    state = state.copyWith(
      status: LocationStatus.error,
      errorMessage: 'Impossibile ottenere la posizione',
    );
    _addLog('Impossibile ottenere la posizione');
  }

  Future<Position?> _getLocationWithGeolocator() async {
    try {
      _addLog('Tentativo con geolocator...');
      
      // Verifica se il servizio di localizzazione è abilitato
      bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
      _addLog('Servizio di localizzazione abilitato: $serviceEnabled');
      
      if (!serviceEnabled) {
        state = state.copyWith(status: LocationStatus.serviceDisabled);
        return null;
      }

      // Verifica i permessi
      LocationPermission permission = await Geolocator.checkPermission();
      _addLog('Permesso attuale: $permission');
      
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        _addLog('Nuovo permesso dopo richiesta: $permission');
        
        if (permission == LocationPermission.denied) {
          state = state.copyWith(status: LocationStatus.permissionDenied);
          return null;
        }
      }
      
      if (permission == LocationPermission.deniedForever) {
        state = state.copyWith(status: LocationStatus.permissionDenied);
        return null;
      }

      // Prova con diverse precisioni
      final locationSettings = [
        LocationSettings(
          accuracy: LocationAccuracy.high,
          distanceFilter: 10,
        ),
        LocationSettings(
          accuracy: LocationAccuracy.medium,
          distanceFilter: 50,
        ),
        LocationSettings(
          accuracy: LocationAccuracy.low,
          distanceFilter: 100,
        ),
      ];

      for (int i = 0; i < locationSettings.length; i++) {
        try {
          _addLog('Tentativo ${i + 1} con precisione: ${locationSettings[i].accuracy}');
          final position = await Geolocator.getCurrentPosition(
            desiredAccuracy: locationSettings[i].accuracy,
            timeLimit: Duration(seconds: 10),
          );
          _addLog('Posizione ottenuta con precisione ${locationSettings[i].accuracy}');
          return position;
        } catch (e) {
          _addLog('Errore tentativo ${i + 1}: $e');
          if (i == locationSettings.length - 1) rethrow;
        }
      }
      
      return null;
    } catch (e) {
      _addLog('Errore generale geolocator: $e');
      rethrow;
    }
  }

  Future<void> forceRequestPermission() async {
    _addLog('Forzatura richiesta permessi...');
    state = state.copyWith(status: LocationStatus.loading);
    
    try {
      LocationPermission permission = await Geolocator.requestPermission();
      _addLog('Permesso ottenuto: $permission');
      
      if (permission == LocationPermission.denied || 
          permission == LocationPermission.deniedForever) {
        state = state.copyWith(
          status: LocationStatus.permissionDenied,
          errorMessage: 'Permessi di geolocalizzazione negati',
        );
        return;
      }
      
      // Se i permessi sono stati concessi, prova a ottenere la posizione
      await getCurrentLocation();
    } catch (e) {
      _addLog('Errore nella forzatura permessi: $e');
      state = state.copyWith(
        status: LocationStatus.error,
        errorMessage: 'Errore nella richiesta permessi: $e',
      );
    }
  }

  void clearLogs() {
    state = state.copyWith(logs: []);
  }

  void ignoreLocation() {
    _addLog('Geolocalizzazione ignorata dall\'utente');
    state = state.copyWith(
      status: LocationStatus.error,
      errorMessage: 'Geolocalizzazione ignorata',
    );
  }
}

final locationProvider = StateNotifierProvider<LocationNotifier, LocationState>((ref) {
  return LocationNotifier();
}); 