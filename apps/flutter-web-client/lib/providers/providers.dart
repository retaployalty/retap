import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import 'location_provider.dart';

// Provider per la geolocalizzazione
final locationProvider = ChangeNotifierProvider<LocationProvider>((ref) {
  return LocationProvider();
});

// Provider per ottenere solo la posizione dell'utente
final userPositionProvider = Provider<Position?>((ref) {
  return ref.watch(locationProvider).userPosition;
});

// Provider per ottenere lo status della geolocalizzazione
final locationStatusProvider = Provider<LocationStatus>((ref) {
  return ref.watch(locationProvider).status;
});

// Provider per ottenere l'errore della geolocalizzazione
final locationErrorProvider = Provider<String?>((ref) {
  return ref.watch(locationProvider).errorMessage;
});

// Provider per ottenere le coordinate
final latitudeProvider = Provider<double?>((ref) {
  return ref.watch(locationProvider).latitude;
});

final longitudeProvider = Provider<double?>((ref) {
  return ref.watch(locationProvider).longitude;
});

// Provider per controllare se la posizione è valida
final isLocationValidProvider = Provider<bool>((ref) {
  return ref.watch(locationProvider).isLocationValid;
});

// Provider per controllare se è necessario aggiornare la posizione
final needsLocationRefreshProvider = Provider<bool>((ref) {
  return ref.watch(locationProvider).needsRefresh;
}); 