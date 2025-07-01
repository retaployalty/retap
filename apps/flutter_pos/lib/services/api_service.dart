import 'dart:convert';
import 'package:http/http.dart' as http;
import 'dart:async';
import 'package:flutter/foundation.dart';

class ApiService {
  static const String _baseUrl = 'https://egmizgydnmvpfpbzmbnj.supabase.co';
  static const String _functionsUrl = '$_baseUrl/functions/v1/api';
  
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

  // Metodo generico per chiamate GET
  static Future<Map<String, dynamic>> get(
    String endpoint, {
    required String merchantId,
    Map<String, String>? queryParams,
  }) async {
    final uri = Uri.parse('$_functionsUrl$endpoint').replace(queryParameters: queryParams);
    
    debugPrint('🌐 API call: $uri');
    
    final response = await http.get(
      uri,
      headers: _getHeaders(merchantId),
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
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
    debugPrint('📦 Body: $body');
    
    final response = await http.post(
      uri,
      headers: _getHeaders(merchantId),
      body: body != null ? jsonEncode(body) : null,
    );

    debugPrint('📡 Response status: ${response.statusCode}');
    debugPrint('📡 Response body: ${response.body}');

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
    debugPrint('🚀 Avanzamento checkpoint: merchantId=$merchantId, cardId=$cardId, offerId=$offerId');
    
    try {
      final result = await post(
        '/checkpoints/advance',
        merchantId: merchantId,
        body: {
          'cardId': cardId,
          'offerId': offerId,
        },
        debounceKey: 'advance_${cardId}_$offerId',
      );
      
      debugPrint('✅ Checkpoint avanzato con successo: $result');
      
      // Ora il backend restituisce sempre un oggetto singolo
      if (result is Map<String, dynamic>) {
        return result;
      } else {
        throw Exception('Risposta API non valida: $result');
      }
    } catch (e) {
      debugPrint('❌ Errore avanzamento checkpoint: $e');
      rethrow;
    }
  }

  static Future<Map<String, dynamic>> rewindCheckpoint({
    required String merchantId,
    required String cardId,
    required String offerId,
  }) async {
    debugPrint('⏪ Rewind checkpoint: merchantId=$merchantId, cardId=$cardId, offerId=$offerId');
    
    try {
      final result = await post(
        '/checkpoints/rewind',
        merchantId: merchantId,
        body: {
          'cardId': cardId,
          'offerId': offerId,
        },
        debounceKey: 'rewind_${cardId}_$offerId',
      );
      
      debugPrint('✅ Checkpoint rewind con successo: $result');
      
      if (result is Map<String, dynamic>) {
        return result;
      } else {
        throw Exception('Risposta inattesa dal server: $result');
      }
    } catch (e) {
      debugPrint('❌ Errore rewind checkpoint: $e');
      rethrow;
    }
  }

  static Future<Map<String, dynamic>> fetchRedeemedCheckpointRewards({
    required String merchantId,
    required String customerId,
  }) async {
    debugPrint('🔄 Fetching redeemed checkpoint rewards: merchantId=$merchantId, customerId=$customerId');
    
    try {
      final result = await get(
        '/checkpoints/redeemed-rewards',
        merchantId: merchantId,
        queryParams: {
          'customerId': customerId,
          'merchantId': merchantId,
        },
      );
      
      debugPrint('✅ Redeemed checkpoint rewards recuperati: $result');
      return result;
    } catch (e) {
      debugPrint('❌ Errore fetch redeemed checkpoint rewards: $e');
      rethrow;
    }
  }

  // Metodi specifici per i rewards
  static Future<List<Map<String, dynamic>>> fetchRewards(String merchantId) async {
    // L'endpoint corretto è /rewards-and-checkpoints che restituisce sia rewards che checkpoints
    final data = await get('/rewards-and-checkpoints', merchantId: merchantId);
    return (data['rewards'] as List?)?.cast<Map<String, dynamic>>() ?? [];
  }

  // Nuovi metodi per dati generali del merchant (senza cardId)
  static Future<List<Map<String, dynamic>>> fetchMerchantRewards(String merchantId) async {
    final data = await get('/merchant-rewards', merchantId: merchantId);
    return (data['rewards'] as List?)?.cast<Map<String, dynamic>>() ?? [];
  }

  static Future<Map<String, dynamic>> fetchMerchantCheckpoints(String merchantId) async {
    return get('/merchant-checkpoints', merchantId: merchantId);
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
        'issuing_merchant_id': merchantId,
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

  // Utility per pulire i timer di debouncing
  static void clearDebounceTimers() {
    for (final timer in _debounceTimers.values) {
      timer.cancel();
    }
    _debounceTimers.clear();
  }
} 