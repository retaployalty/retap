import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';
import '../models/reward.dart';
import '../models/checkpoint.dart';

class CacheService {
  static const String _rewardsKey = 'cached_rewards_';
  static const String _checkpointsKey = 'cached_checkpoints';
  static const Duration _cacheDuration = Duration(minutes: 5);

  static Future<void> cacheRewards(String merchantId, List<Reward> rewards) async {
    final prefs = await SharedPreferences.getInstance();
    final timestamp = DateTime.now().millisecondsSinceEpoch;
    final data = {
      'timestamp': timestamp,
      'rewards': rewards.map((r) => r.toJson()).toList(),
    };
    await prefs.setString(_rewardsKey + merchantId, jsonEncode(data));
  }

  static Future<List<Reward>?> getCachedRewards(String merchantId) async {
    final prefs = await SharedPreferences.getInstance();
    final cachedData = prefs.getString(_rewardsKey + merchantId);
    
    if (cachedData == null) return null;

    final data = jsonDecode(cachedData) as Map<String, dynamic>;
    final timestamp = data['timestamp'] as int;
    final now = DateTime.now().millisecondsSinceEpoch;

    // Check if cache is expired
    if (now - timestamp > _cacheDuration.inMilliseconds) {
      await prefs.remove(_rewardsKey + merchantId);
      return null;
    }

    final rewards = (data['rewards'] as List)
        .map((r) => Reward.fromJson(r as Map<String, dynamic>))
        .toList();
    return rewards;
  }

  static Future<List<Checkpoint>?> getCachedCheckpoints(String merchantId) async {
    final prefs = await SharedPreferences.getInstance();
    final cachedData = prefs.getString('${_checkpointsKey}_$merchantId');
    
    if (cachedData == null) return null;

    try {
      final data = jsonDecode(cachedData);
      final timestamp = data['timestamp'] as int;
      final now = DateTime.now().millisecondsSinceEpoch;

      // Check if cache is expired
      if (now - timestamp > _cacheDuration.inMilliseconds) {
        await prefs.remove('${_checkpointsKey}_$merchantId');
        return null;
      }

      return (data['checkpoints'] as List)
          .map((c) => Checkpoint.fromJson(c))
          .toList();
    } catch (e) {
      return null;
    }
  }

  static Future<void> cacheCheckpoints(String merchantId, List<Checkpoint> checkpoints) async {
    final prefs = await SharedPreferences.getInstance();
    final data = {
      'timestamp': DateTime.now().millisecondsSinceEpoch,
      'checkpoints': checkpoints.map((c) => c.toJson()).toList(),
    };
    await prefs.setString('${_checkpointsKey}_$merchantId', jsonEncode(data));
  }

  static Future<void> clearCache(String merchantId) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_rewardsKey + merchantId);
    await prefs.remove('${_checkpointsKey}_$merchantId');
  }

  static Future<void> clearCheckpointsCache(String merchantId) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('${_checkpointsKey}_$merchantId');
  }
} 