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
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVnbWl6Z3lkbm12cGZwYnptYm5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc0NjA2NjUsImV4cCI6MjA2MzAzNjY2NX0.eKlGwWbYq6TUv0AJq8Lv9w6Vejwp2v7CyQEMW0hqL6U',
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