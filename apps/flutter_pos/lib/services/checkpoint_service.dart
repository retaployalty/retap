import 'package:http/http.dart' as http;
import 'dart:convert';
import '../models/checkpoint.dart';
import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class CheckpointService {
  final SupabaseClient _supabase = Supabase.instance.client;

  static Future<Map<String, dynamic>> fetchOffers(String merchantId, {String? cardId}) async {
    debugPrint('Fetching offers from API for merchant $merchantId${cardId != null ? ' and card $cardId' : ''}');
    
    final queryParams = {
      'merchantId': merchantId,
      if (cardId != null) 'cardId': cardId,
    };
    
    final uri = Uri.parse('https://egmizgydnmvpfpbzmbnj.supabase.co/functions/v1/api/rewards-and-checkpoints')
        .replace(queryParameters: queryParams);
        
    final response = await http.get(
      uri,
      headers: {
        'x-merchant-id': merchantId,
      },
    );

    debugPrint('API Response status: ${response.statusCode}');
    debugPrint('API Response body: ${response.body}');

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      if (data['checkpoint_offers'] == null) {
        debugPrint('No checkpoint offers found in response');
        return {
          'checkpoints': [],
          'currentStep': 0,
        };
      }
      
      final checkpoints = (data['checkpoint_offers'] as List).map((o) => Checkpoint.fromJson(o)).toList();
      final currentStep = data['current_step'] as int? ?? 0;
      
      return {
        'checkpoints': checkpoints,
        'currentStep': currentStep,
      };
    } else {
      throw Exception('Failed to load checkpoints: ${response.statusCode} - ${response.body}');
    }
  }

  static Future<Map<String, int>> fetchCurrentSteps(String merchantId, String cardId) async {
    debugPrint('Fetching current steps for card $cardId');
    final response = await http.get(
      Uri.parse('https://egmizgydnmvpfpbzmbnj.supabase.co/functions/v1/api/checkpoints?cardId=$cardId'),
      headers: {
        'x-merchant-id': merchantId,
      },
    );

    debugPrint('Steps API Response status: ${response.statusCode}');
    debugPrint('Steps API Response body: ${response.body}');

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      if (data['steps'] == null) {
        debugPrint('No steps found in response');
        return {};
      }
      return (data['steps'] as Map<String, dynamic>).map(
        (key, value) => MapEntry(key, value as int)
      );
    } else {
      throw Exception('Failed to load current steps: ${response.statusCode} - ${response.body}');
    }
  }

  Future<Map<String, dynamic>> advanceCheckpoint({
    required String customerId,
    required String merchantId,
    String? offerId,
  }) async {
    try {
      final response = await _supabase.rpc(
        'advance_customer_checkpoint',
        params: {
          'p_customer_id': customerId,
          'p_merchant_id': merchantId,
          if (offerId != null) 'p_offer_id': offerId,
        },
      );
      return response;
    } catch (e) {
      throw Exception('Errore nell\'avanzamento del checkpoint: $e');
    }
  }

  Future<void> redeemCheckpointReward({
    required String customerId,
    required String merchantId,
    required String rewardId,
    required String stepId,
  }) async {
    try {
      await _supabase.rpc(
        'redeem_checkpoint_reward',
        params: {
          'p_customer_id': customerId,
          'p_merchant_id': merchantId,
          'p_checkpoint_reward_id': rewardId,
          'p_checkpoint_step_id': stepId,
        },
      );
    } catch (e) {
      throw Exception('Errore nel riscatto del reward: $e');
    }
  }

  static Future<List<String>> fetchRedeemedCheckpointRewardIds({
    required String customerId,
    required String merchantId,
  }) async {
    final uri = Uri.parse('https://egmizgydnmvpfpbzmbnj.supabase.co/rest/v1/redeemed_checkpoint_rewards?customer_id=eq.$customerId&merchant_id=eq.$merchantId');
    final response = await http.get(
      uri,
      headers: {
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVnbWl6Z3lkbm12cGZwYnptYm5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc0NjA2NjUsImV4cCI6MjA2MzAzNjY2NX0.eKlGwWbYq6TUv0AJq8Lv9w6Vejwp2v7CyQEMW0hqL6U',
        'Authorization': 'Bearer ${Supabase.instance.client.auth.currentSession?.accessToken ?? ''}',
      },
    );
    if (response.statusCode == 200) {
      final data = jsonDecode(response.body) as List;
      // Ritorna la lista degli id dei reward riscattati
      return data.map<String>((e) => e['checkpoint_reward_id'] as String).toList();
    } else {
      throw Exception('Errore nel recupero dei rewards riscattati: \\${response.statusCode}');
    }
  }
} 