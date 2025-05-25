import 'package:http/http.dart' as http;
import 'dart:convert';

class PointsService {
  static const _baseUrl = 'https://egmizgydnmvpfpbzmbnj.supabase.co/functions/v1/api';

  static Future<int> getCardBalance(String cardId, String merchantId) async {
    try {
      final response = await http.get(
        Uri.parse('$_baseUrl/balance?cardId=$cardId'),
        headers: {
          'x-merchant-id': merchantId,
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode != 200) {
        throw Exception('Failed to load balance: ${response.statusCode}');
      }

      final data = jsonDecode(response.body);
      final balances = data['balances'] as List;
      
      // Trova il saldo per il merchant corrente
      final merchantBalance = balances.firstWhere(
        (b) => b['merchant_id'] == merchantId,
        orElse: () => {'balance': 0},
      );

      return merchantBalance['balance'] as int;
    } catch (e) {
      throw Exception('Failed to load balance: $e');
    }
  }
} 