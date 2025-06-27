import 'dart:math';

class DistanceCalculator {
  static const double _earthRadius = 6371; // Raggio della Terra in km

  /// Calcola la distanza in km tra due punti geografici usando la formula di Haversine
  static double calculateDistance(
    double lat1, 
    double lon1, 
    double lat2, 
    double lon2
  ) {
    // Converti le coordinate in radianti
    final lat1Rad = _degreesToRadians(lat1);
    final lon1Rad = _degreesToRadians(lon1);
    final lat2Rad = _degreesToRadians(lat2);
    final lon2Rad = _degreesToRadians(lon2);

    // Differenze delle coordinate
    final deltaLat = lat2Rad - lat1Rad;
    final deltaLon = lon2Rad - lon1Rad;

    // Formula di Haversine
    final a = sin(deltaLat / 2) * sin(deltaLat / 2) +
        cos(lat1Rad) * cos(lat2Rad) * sin(deltaLon / 2) * sin(deltaLon / 2);
    final c = 2 * atan2(sqrt(a), sqrt(1 - a));

    return _earthRadius * c;
  }

  /// Converte i gradi in radianti
  static double _degreesToRadians(double degrees) {
    return degrees * (pi / 180);
  }

  /// Formatta la distanza in modo leggibile
  static String formatDistance(double distanceKm) {
    if (distanceKm < 1) {
      final meters = (distanceKm * 1000).round();
      return '${meters}m';
    } else if (distanceKm < 10) {
      return '${distanceKm.toStringAsFixed(1)}km';
    } else {
      return '${distanceKm.round()}km';
    }
  }

  /// Ordina una lista di business per distanza dalla posizione dell'utente
  static List<Map<String, dynamic>> sortByDistance(
    List<Map<String, dynamic>> businesses,
    double userLat,
    double userLon,
  ) {
    print('DistanceCalculator: Calcolo distanze per ${businesses.length} business');
    print('DistanceCalculator: Posizione utente: $userLat, $userLon');
    
    final businessesWithDistance = businesses.map((business) {
      final lat = business['latitude'];
      final lon = business['longitude'];
      
      print('DistanceCalculator: Business ${business['name']} - lat: $lat, lon: $lon');
      
      double distance = double.infinity;
      if (lat != null && lon != null) {
        distance = calculateDistance(userLat, userLon, lat.toDouble(), lon.toDouble());
        print('DistanceCalculator: Distanza calcolata per ${business['name']}: ${formatDistance(distance)}');
      } else {
        print('DistanceCalculator: Coordinate mancanti per ${business['name']}');
      }
      
      return {
        ...business,
        'distance': distance,
        'distanceFormatted': distance == double.infinity ? 'N/A' : formatDistance(distance),
      };
    }).toList();

    // Ordina per distanza (prima quelli con coordinate, poi quelli senza)
    businessesWithDistance.sort((a, b) {
      final aDistance = a['distance'] as double;
      final bDistance = b['distance'] as double;
      
      // Se entrambi hanno coordinate, ordina per distanza
      if (aDistance != double.infinity && bDistance != double.infinity) {
        return aDistance.compareTo(bDistance);
      }
      
      // Se solo uno ha coordinate, metti quello con coordinate prima
      if (aDistance != double.infinity) return -1;
      if (bDistance != double.infinity) return 1;
      
      // Se nessuno ha coordinate, mantieni l'ordine originale
      return 0;
    });

    print('DistanceCalculator: Ordinamento completato');
    return businessesWithDistance;
  }
} 