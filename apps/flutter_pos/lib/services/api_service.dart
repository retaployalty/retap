import 'dart:convert';
import 'package:http/http.dart' as http;
import 'dart:async';
import 'package:flutter/foundation.dart';

class ApiService {
  static const String _baseUrl = 'https://egmizgydnmvpfpbzmbnj.supabase.co';
  static const String _functionsUrl = '$_baseUrl/functions/v1/api';
  
  // Cache in memoria per performance
  static final Map<String, dynamic> _memoryCache = {};
  static final Map<String, DateTime> _cacheTimestamps = {};
  static const Duration _cacheDuration = Duration(minutes: 5);
  
  // Debouncing per evitare chiamate multiple
  static final Map<String, Timer> _debounceTimers = {};
  static const Duration _debounceDelay = Duration(milliseconds: 300);

  // Headers comuni
  static Map<String, String> _getHeaders(String merchantId) {
    return {
      'Content-Type': 'application/json',
      'x-merchant-id': merchantId,
    };
  }

  // Metodo generico per chiamate GET con cache
  static Future<Map<String, dynamic>> get(
    String endpoint, {
    required String merchantId,
    Map<String, String>? queryParams,
    bool useCache = true,
  }) async {
    final cacheKey = '${endpoint}_${merchantId}_${queryParams?.toString() ?? ''}';
    
    // Controlla cache in memoria
    if (useCache && _memoryCache.containsKey(cacheKey)) {
      final timestamp = _cacheTimestamps[cacheKey];
      if (timestamp != null && DateTime.now().difference(timestamp) < _cacheDuration) {
        debugPrint('📦 Cache hit: $cacheKey');
        return _memoryCache[cacheKey];
      }
    }

    final uri = Uri.parse('$_functionsUrl$endpoint').replace(queryParameters: queryParams);
    
    debugPrint('🌐 API call: $uri');
    
    final response = await http.get(
      uri,
      headers: _getHeaders(merchantId),
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      
      // Salva in cache
      if (useCache) {
        _memoryCache[cacheKey] = data;
        _cacheTimestamps[cacheKey] = DateTime.now();
        debugPrint('💾 Cached: $cacheKey');
      }
      
      return data;
    } else {
      throw Exception('API Error ${response.statusCode}: ${response.body}');
    }
  }

  // Metodo generico per chiamate POST con debouncing
  static Future<Map<String, dynamic>> post(
    String endpoint, {
    required String merchantId,
    Map<String, dynamic>? body,
    String? debounceKey,
  }) async {
    // Debouncing se specificato
    if (debounceKey != null) {
      _debounceTimers[debounceKey]?.cancel();
      
      return Future.delayed(_debounceDelay, () async {
        _debounceTimers.remove(debounceKey);
        return _performPost(endpoint, merchantId, body);
      });
    }
    
    return _performPost(endpoint, merchantId, body);
  }

  static Future<Map<String, dynamic>> _performPost(
    String endpoint,
    String merchantId,
    Map<String, dynamic>? body,
  ) async {
    final uri = Uri.parse('$_functionsUrl$endpoint');
    
    debugPrint('🌐 POST: $uri');
    
    final response = await http.post(
      uri,
      headers: _getHeaders(merchantId),
      body: body != null ? jsonEncode(body) : null,
    );

    if (response.statusCode == 200 || response.statusCode == 201) {
      return jsonDecode(response.body);
    } else {
      throw Exception('API Error ${response.statusCode}: ${response.body}');
    }
  }

  // Metodi specifici per i checkpoint
  static Future<Map<String, dynamic>> fetchCheckpoints(
    String merchantId, {
    String? cardId,
  }) async {
    final queryParams = {
      'merchantId': merchantId,
      if (cardId != null) 'cardId': cardId,
    };
    
    final data = await get('/rewards-and-checkpoints', merchantId: merchantId, queryParams: queryParams);
    
    // Estrai solo i checkpoint dalla risposta
    return {
      'checkpoint_offers': data['checkpoint_offers'] ?? [],
      'current_step': data['current_step'] ?? 0,
    };
  }

  static Future<Map<String, dynamic>> advanceCheckpoint({
    required String merchantId,
    required String cardId,
    required String offerId,
  }) async {
    return post(
      '/checkpoints/advance',
      merchantId: merchantId,
      body: {
        'cardId': cardId,
        'offerId': offerId,
      },
      debounceKey: 'advance_${cardId}_$offerId',
    );
  }

  // Metodi specifici per i rewards
  static Future<List<Map<String, dynamic>>> fetchRewards(String merchantId) async {
    // L'endpoint corretto è /rewards-and-checkpoints che restituisce sia rewards che checkpoints
    final data = await get('/rewards-and-checkpoints', merchantId: merchantId);
    return (data['rewards'] as List?)?.cast<Map<String, dynamic>>() ?? [];
  }

  static Future<Map<String, dynamic>> redeemReward({
    required String merchantId,
    required String customerId,
    required String rewardId,
    required int pointsSpent,
  }) async {
    return post(
      '/redeemed_rewards',
      merchantId: merchantId,
      body: {
        'customer_id': customerId,
        'reward_id': rewardId,
        'points_spent': pointsSpent,
      },
      debounceKey: 'redeem_${customerId}_$rewardId',
    );
  }

  // Metodi specifici per le carte
  static Future<Map<String, dynamic>> fetchCard(String merchantId, String uid) async {
    return get('/cards', merchantId: merchantId, queryParams: {'uid': uid});
  }

  static Future<Map<String, dynamic>> createCard({
    required String merchantId,
    required String cardId,
    required String uid,
    required String customerId,
  }) async {
    return post(
      '/cards',
      merchantId: merchantId,
      body: {
        'cardId': cardId,
        'uid': uid,
        'customerId': customerId,
      },
    );
  }

  static Future<Map<String, dynamic>> createTransaction({
    required String merchantId,
    required String cardId,
    required int points,
  }) async {
    return post(
      '/tx',
      merchantId: merchantId,
      body: {
        'cardId': cardId,
        'points': points,
      },
      debounceKey: 'tx_${cardId}_$points',
    );
  }

  // Metodi specifici per i customer
  static Future<Map<String, dynamic>> createCustomer(String merchantId) async {
    return post(
      '/customers',
      merchantId: merchantId,
      body: {'merchant_id': merchantId},
    );
  }

  // Utility per pulire la cache
  static void clearCache([String? pattern]) {
    if (pattern != null) {
      _memoryCache.removeWhere((key, value) => key.contains(pattern));
      _cacheTimestamps.removeWhere((key, value) => key.contains(pattern));
    } else {
      _memoryCache.clear();
      _cacheTimestamps.clear();
    }
    debugPrint('🧹 Cache cleared${pattern != null ? ' for pattern: $pattern' : ''}');
  }

  // Utility per pulire i timer di debouncing
  static void clearDebounceTimers() {
    for (final timer in _debounceTimers.values) {
      timer.cancel();
    }
    _debounceTimers.clear();
  }
} 