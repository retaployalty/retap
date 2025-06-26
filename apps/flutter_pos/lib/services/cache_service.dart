import 'package:flutter/foundation.dart';

class CacheService {
  // Servizio semplificato senza cache per garantire dati sempre aggiornati
  
  static void clearCache(String merchantId) {
    // Non fa nulla, mantenuto per compatibilità
    debugPrint('🧹 Cache clear requested for merchant: $merchantId (no cache active)');
  }

  static void clearAllMemoryCache() {
    // Non fa nulla, mantenuto per compatibilità
    debugPrint('🧹 All memory cache clear requested (no cache active)');
  }

  static void clearGlobalCache(String merchantId) {
    // Non fa nulla, mantenuto per compatibilità
    debugPrint('🧹 Global cache clear requested for merchant: $merchantId (no cache active)');
  }

  // Metodi stub per compatibilità - restituiscono sempre null per forzare il fetch da API
  static Future<T?> getCachedData<T>({
    required String key,
    required String merchantId,
    required Future<T> Function() fetchFunction,
    bool useMemoryCache = true,
    bool usePersistentCache = true,
    bool useGlobalCache = true,
  }) async {
    // Sempre fetch da API, nessun caching
    debugPrint('🌐 Fetching data from API: $key (no cache active)');
    return await fetchFunction();
  }

  static Future<List<dynamic>?> getCachedRewards(String merchantId) async {
    // Sempre null per forzare fetch da API
    return null;
  }

  static Future<List<dynamic>?> getCachedCheckpoints(String merchantId) async {
    // Sempre null per forzare fetch da API
    return null;
  }

  static Future<void> cacheRewards(String merchantId, List<dynamic> rewards) async {
    // Non fa nulla, mantenuto per compatibilità
    debugPrint('💾 Cache rewards requested for merchant: $merchantId (no cache active)');
  }

  static Future<void> cacheCheckpoints(String merchantId, List<dynamic> checkpoints) async {
    // Non fa nulla, mantenuto per compatibilità
    debugPrint('💾 Cache checkpoints requested for merchant: $merchantId (no cache active)');
  }
} 