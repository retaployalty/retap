import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';
import '../models/reward.dart';
import '../models/checkpoint.dart';
import 'package:flutter/foundation.dart';

class CacheService {
  // Cache in memoria per performance (dati frequenti)
  static final Map<String, dynamic> _memoryCache = {};
  static final Map<String, DateTime> _memoryTimestamps = {};
  static const Duration _memoryCacheDuration = Duration(minutes: 2);
  
  // Cache persistente per dati importanti
  static const String _rewardsKey = 'cached_rewards_';
  static const String _checkpointsKey = 'cached_checkpoints_';
  static const Duration _persistentCacheDuration = Duration(minutes: 10);

  // === CACHE IN MEMORIA (VELOCE) ===
  
  static void cacheInMemory<T>(String key, T data) {
    _memoryCache[key] = data;
    _memoryTimestamps[key] = DateTime.now();
    debugPrint('💾 Memory cached: $key');
  }

  static T? getFromMemory<T>(String key) {
    final timestamp = _memoryTimestamps[key];
    if (timestamp != null && DateTime.now().difference(timestamp) < _memoryCacheDuration) {
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

  static Future<void> clearCache(String merchantId) async {
    // Clear memory cache
    _memoryCache.removeWhere((key, value) => key.contains(merchantId));
    _memoryTimestamps.removeWhere((key, value) => key.contains(merchantId));
    
    // Clear persistent cache
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_rewardsKey + merchantId);
    await prefs.remove('${_checkpointsKey}$merchantId');
    
    debugPrint('🧹 Cache cleared for merchant: $merchantId');
  }

  static Future<void> clearCheckpointsCache(String merchantId) async {
    _memoryCache.removeWhere((key, value) => key.contains('checkpoint') && key.contains(merchantId));
    _memoryTimestamps.removeWhere((key, value) => key.contains('checkpoint') && key.contains(merchantId));
    
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('${_checkpointsKey}$merchantId');
    
    debugPrint('🧹 Checkpoints cache cleared for merchant: $merchantId');
  }

  static void clearAllMemoryCache() {
    _memoryCache.clear();
    _memoryTimestamps.clear();
    debugPrint('🧹 All memory cache cleared');
  }

  // === CACHE INTELLIGENTE ===
  
  static Future<T?> getCachedData<T>({
    required String key,
    required String merchantId,
    required Future<T> Function() fetchFunction,
    bool useMemoryCache = true,
    bool usePersistentCache = false,
  }) async {
    // 1. Prova cache in memoria (più veloce)
    if (useMemoryCache) {
      final memoryData = getFromMemory<T>('${key}_$merchantId');
      if (memoryData != null) return memoryData;
    }

    // 2. Prova cache persistente (più lento)
    if (usePersistentCache) {
      // Implementazione specifica per tipo
      if (T == List<Reward>) {
        final persistentData = await getCachedRewards(merchantId);
        if (persistentData != null) {
          cacheInMemory('${key}_$merchantId', persistentData);
          return persistentData as T;
        }
      } else if (T == List<Checkpoint>) {
        final persistentData = await getCachedCheckpoints(merchantId);
        if (persistentData != null) {
          cacheInMemory('${key}_$merchantId', persistentData);
          return persistentData as T;
        }
      }
    }

    // 3. Fetch da API
    try {
      final data = await fetchFunction();
      
      // Cache il risultato
      if (useMemoryCache) {
        cacheInMemory('${key}_$merchantId', data);
      }
      
      return data;
    } catch (e) {
      debugPrint('❌ Error fetching data: $e');
      return null;
    }
  }
} 