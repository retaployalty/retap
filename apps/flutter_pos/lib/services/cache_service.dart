import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';
import '../models/reward.dart';
import '../models/checkpoint.dart';
import 'package:flutter/foundation.dart';
import '../services/api_service.dart';

class CacheService {
  // Cache globale statico che persiste tra le schermate
  static final Map<String, dynamic> _globalCache = {};
  static final Map<String, DateTime> _globalCacheTimestamps = {};
  static const Duration _globalCacheExpiry = Duration(minutes: 5); // 5 minuti di cache

  // Cache in memoria per la sessione corrente
  static final Map<String, dynamic> _memoryCache = {};
  static final Map<String, DateTime> _memoryCacheTimestamps = {};
  static const Duration _memoryCacheExpiry = Duration(minutes: 2); // 2 minuti di cache

  // Cache persistente (SharedPreferences)
  static SharedPreferences? _prefs;
  static const Duration _persistentCacheExpiry = Duration(hours: 1); // 1 ora di cache
  
  // Cache persistente per dati importanti
  static const String _rewardsKey = 'cached_rewards_';
  static const String _checkpointsKey = 'cached_checkpoints_';
  static const Duration _persistentCacheDuration = Duration(minutes: 10);

  // === CACHE IN MEMORIA (VELOCE) ===
  
  static void cacheInMemory<T>(String key, T data) {
    _memoryCache[key] = data;
    _memoryCacheTimestamps[key] = DateTime.now();
    debugPrint('💾 Memory cached: $key');
  }

  static T? getFromMemory<T>(String key) {
    final timestamp = _memoryCacheTimestamps[key];
    if (timestamp != null && DateTime.now().difference(timestamp) < _memoryCacheExpiry) {
      debugPrint('📦 Memory cache hit: $key');
      return _memoryCache[key] as T?;
    }
    return null;
  }

  // === CACHE PERSISTENTE (LENTO MA DURATURO) ===

  static Future<void> cacheRewards(String merchantId, List<Reward> rewards) async {
    final prefs = await SharedPreferences.getInstance();
    final timestamp = DateTime.now().millisecondsSinceEpoch;
    final data = {
      'timestamp': timestamp,
      'rewards': rewards.map((r) => r.toJson()).toList(),
    };
    await prefs.setString(_rewardsKey + merchantId, jsonEncode(data));
    debugPrint('💾 Persistent cached rewards for merchant: $merchantId');
  }

  static Future<List<Reward>?> getCachedRewards(String merchantId) async {
    final prefs = await SharedPreferences.getInstance();
    final cachedData = prefs.getString(_rewardsKey + merchantId);
    
    if (cachedData == null) return null;

    try {
      final data = jsonDecode(cachedData) as Map<String, dynamic>;
      final timestamp = data['timestamp'] as int;
      final now = DateTime.now().millisecondsSinceEpoch;

      // Check if cache is expired
      if (now - timestamp > _persistentCacheDuration.inMilliseconds) {
        await prefs.remove(_rewardsKey + merchantId);
        return null;
      }

      final rewards = (data['rewards'] as List)
          .map((r) => Reward.fromJson(r as Map<String, dynamic>))
          .toList();
      
      debugPrint('📦 Persistent cache hit: rewards for merchant $merchantId');
      return rewards;
    } catch (e) {
      debugPrint('❌ Error parsing cached rewards: $e');
      return null;
    }
  }

  static Future<List<Checkpoint>?> getCachedCheckpoints(String merchantId) async {
    final prefs = await SharedPreferences.getInstance();
    final cachedData = prefs.getString('${_checkpointsKey}$merchantId');
    
    if (cachedData == null) return null;

    try {
      final data = jsonDecode(cachedData);
      final timestamp = data['timestamp'] as int;
      final now = DateTime.now().millisecondsSinceEpoch;

      // Check if cache is expired
      if (now - timestamp > _persistentCacheDuration.inMilliseconds) {
        await prefs.remove('${_checkpointsKey}$merchantId');
        return null;
      }

      final checkpoints = (data['checkpoints'] as List)
          .map((c) => Checkpoint.fromJson(c))
          .toList();
      
      debugPrint('📦 Persistent cache hit: checkpoints for merchant $merchantId');
      return checkpoints;
    } catch (e) {
      debugPrint('❌ Error parsing cached checkpoints: $e');
      return null;
    }
  }

  static Future<void> cacheCheckpoints(String merchantId, List<Checkpoint> checkpoints) async {
    final prefs = await SharedPreferences.getInstance();
    final data = {
      'timestamp': DateTime.now().millisecondsSinceEpoch,
      'checkpoints': checkpoints.map((c) => c.toJson()).toList(),
    };
    await prefs.setString('${_checkpointsKey}$merchantId', jsonEncode(data));
    debugPrint('💾 Persistent cached checkpoints for merchant: $merchantId');
  }

  // === UTILITY METHODS ===

  static void clearCache(String merchantId) {
    // Clear global cache
    clearGlobalCache(merchantId);
    
    // Clear memory cache
    _memoryCache.removeWhere((key, value) => key.contains(merchantId));
    _memoryCacheTimestamps.removeWhere((key, value) => key.contains(merchantId));
    
    // Clear persistent cache
    _clearPersistentCacheForMerchant(merchantId);
    
    debugPrint('🧹 All cache cleared for merchant: $merchantId');
  }

  static Future<void> _clearPersistentCacheForMerchant(String merchantId) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_rewardsKey + merchantId);
    await prefs.remove('${_checkpointsKey}$merchantId');
  }

  static void clearAllMemoryCache() {
    _memoryCache.clear();
    _memoryCacheTimestamps.clear();
    debugPrint('🧹 All memory cache cleared');
  }

  // === CACHE INTELLIGENTE ===
  
  static Future<T?> getCachedData<T>({
    required String key,
    required String merchantId,
    required Future<T> Function() fetchFunction,
    bool useMemoryCache = true,
    bool usePersistentCache = true,
    bool useGlobalCache = true,
  }) async {
    final cacheKey = '${merchantId}_$key';
    
    // 1. Prova cache globale (più veloce, persiste tra schermate)
    if (useGlobalCache) {
      final globalData = getFromGlobalCache<T>(cacheKey);
      if (globalData != null) return globalData;
    }

    // 2. Prova cache in memoria (veloce, solo sessione corrente)
    if (useMemoryCache) {
      final memoryData = getFromMemory<T>(cacheKey);
      if (memoryData != null) return memoryData;
    }

    // 3. Prova cache persistente (lento ma persistente)
    if (usePersistentCache) {
      if (T == List<Reward>) {
        final persistentData = await getCachedRewards(merchantId);
        if (persistentData != null) {
          cacheInMemory(cacheKey, persistentData);
          if (useGlobalCache) cacheGlobally(cacheKey, persistentData);
          return persistentData as T;
        }
      } else if (T == List<Checkpoint>) {
        final persistentData = await getCachedCheckpoints(merchantId);
        if (persistentData != null) {
          cacheInMemory(cacheKey, persistentData);
          if (useGlobalCache) cacheGlobally(cacheKey, persistentData);
          return persistentData as T;
        }
      }
    }

    // 4. Fetch da API se non in cache
    try {
      debugPrint('🌐 Fetching data from API: $key');
      final data = await fetchFunction();
      
      // Cache il risultato
      if (useMemoryCache) {
        cacheInMemory(cacheKey, data);
      }
      if (useGlobalCache) {
        cacheGlobally(cacheKey, data);
      }
      
      // Cache persistente in background (solo se non già presente)
      if (data is List<Reward> && data.isNotEmpty && usePersistentCache) {
        Future.microtask(() async {
          final existingRewards = await getCachedRewards(merchantId);
          if (existingRewards == null) {
            await cacheRewards(merchantId, data as List<Reward>);
          }
        });
      }
      
      return data;
    } catch (e) {
      debugPrint('❌ Error fetching data: $e');
      return null;
    }
  }

  // Cache globale che persiste tra le schermate
  static void cacheGlobally<T>(String key, T data) {
    _globalCache[key] = data;
    _globalCacheTimestamps[key] = DateTime.now();
    debugPrint('🌍 Global cached: $key');
  }

  static T? getFromGlobalCache<T>(String key) {
    final timestamp = _globalCacheTimestamps[key];
    if (timestamp != null && DateTime.now().difference(timestamp) < _globalCacheExpiry) {
      debugPrint('🌍 Global cache hit: $key');
      return _globalCache[key] as T?;
    }
    debugPrint('🌍 Global cache miss: $key');
    return null;
  }

  static void clearGlobalCache(String merchantId) {
    _globalCache.removeWhere((key, value) => key.contains(merchantId));
    _globalCacheTimestamps.removeWhere((key, value) => key.contains(merchantId));
    debugPrint('🧹 Global cache cleared for merchant: $merchantId');
  }

  static void clearAllGlobalCache() {
    _globalCache.clear();
    _globalCacheTimestamps.clear();
    debugPrint('🧹 All global cache cleared');
  }

  // Precarica i dati comuni per un merchant specifico
  static Future<void> preloadMerchantData(String merchantId) async {
    debugPrint('🚀 Precaricamento dati per merchant: $merchantId');
    
    try {
      // Precarica rewards in background
      Future.microtask(() => _preloadRewards(merchantId));
      
      // Precarica checkpoints in background
      Future.microtask(() => _preloadCheckpoints(merchantId));
      
      debugPrint('✅ Precaricamento avviato per merchant: $merchantId');
    } catch (e) {
      debugPrint('❌ Errore nel precaricamento: $e');
    }
  }

  static Future<void> _preloadRewards(String merchantId) async {
    try {
      // Usa il nuovo endpoint per rewards generali del merchant
      final rewardsData = await ApiService.fetchMerchantRewards(merchantId);
      final rewards = rewardsData.map((r) => Reward.fromJson(r)).toList();
      cacheGlobally('${merchantId}_rewards', rewards);
      debugPrint('✅ Rewards precaricati: ${rewards.length} items');
    } catch (e) {
      debugPrint('❌ Errore precaricamento rewards: $e');
    }
  }

  static Future<void> _preloadCheckpoints(String merchantId) async {
    try {
      // Usa il nuovo endpoint per checkpoints generali del merchant
      final checkpointsData = await ApiService.fetchMerchantCheckpoints(merchantId);
      final checkpoints = (checkpointsData['checkpoint_offers'] as List?)
          ?.map((c) => Checkpoint.fromJson(c))
          .toList() ?? [];
      cacheGlobally('${merchantId}_checkpoints', checkpoints);
      debugPrint('✅ Checkpoints precaricati: ${checkpoints.length} items');
    } catch (e) {
      debugPrint('❌ Errore precaricamento checkpoints: $e');
    }
  }
} 