import 'package:http/http.dart' as http;
import 'dart:convert';
import '../models/reward.dart';
import 'package:flutter/foundation.dart';

class RewardService {
  static const _restUrl = 'https://egmizgydnmvpfpbzmbnj.supabase.co/rest/v1';
  static const _edgeUrl = 'https://egmizgydnmvpfpbzmbnj.supabase.co/functions/v1/api';

  static Future<List<Reward>> fetchRewards(String merchantId) async {
    final response = await http.get(
      Uri.parse('$_restUrl/rewards?merchant_id=eq.$merchantId'),
      headers: {
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVnbWl6Z3lkbm12cGZwYnptYm5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc0NjA2NjUsImV4cCI6MjA2MzAzNjY2NX0.eKlGwWbYq6TUv0AJq8Lv9w6Vejwp2v7CyQEMW0hqL6U',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVnbWl6Z3lkbm12cGZwYnptYm5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc0NjA2NjUsImV4cCI6MjA2MzAzNjY2NX0.eKlGwWbYq6TUv0AJq8Lv9w6Vejwp2v7CyQEMW0hqL6U',
      },
    );
    if (response.statusCode != 200) throw Exception('Errore nel caricamento dei premi');
    final List<dynamic> data = jsonDecode(response.body);
    return data.map((json) => Reward.fromJson(json)).toList();
  }

  static Future<void> redeemReward({
    required String merchantId,
    required String customerId,
    required String rewardId,
    required int pointsSpent,
  }) async {
    debugPrint('Making redeem reward API call...');
    debugPrint('URL: $_edgeUrl/redeemed_rewards');
    debugPrint('Headers: {x-merchant-id: $merchantId}');
    debugPrint('Body: {customer_id: $customerId, merchant_id: $merchantId, reward_id: $rewardId, points_spent: $pointsSpent}');

    final response = await http.post(
      Uri.parse('$_edgeUrl/redeemed_rewards'),
      headers: {
        'x-merchant-id': merchantId,
        'Content-Type': 'application/json',
      },
      body: jsonEncode({
        'customer_id': customerId,
        'merchant_id': merchantId,
        'reward_id': rewardId,
        'points_spent': pointsSpent,
        'status': 'pending',
      }),
    );

    debugPrint('Response status: ${response.statusCode}');
    debugPrint('Response body: ${response.body}');

    if (response.statusCode != 201) {
      throw Exception('Failed to redeem reward: ${response.statusCode} - ${response.body}');
    }
  }
} 