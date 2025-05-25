import 'package:http/http.dart' as http;
import 'dart:convert';
import '../models/reward.dart';

class RewardService {
  static const _baseUrl = 'https://egmizgydnmvpfpbzmbnj.supabase.co/rest/v1/rewards';

  static Future<List<Reward>> fetchRewards(String merchantId) async {
    final response = await http.get(
      Uri.parse('$_baseUrl?merchant_id=eq.$merchantId'),
      headers: {
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVnbWl6Z3lkbm12cGZwYnptYm5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc0NjA2NjUsImV4cCI6MjA2MzAzNjY2NX0.eKlGwWbYq6TUv0AJq8Lv9w6Vejwp2v7CyQEMW0hqL6U',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVnbWl6Z3lkbm12cGZwYnptYm5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc0NjA2NjUsImV4cCI6MjA2MzAzNjY2NX0.eKlGwWbYq6TUv0AJq8Lv9w6Vejwp2v7CyQEMW0hqL6U',
      },
    );
    if (response.statusCode != 200) throw Exception('Errore nel caricamento dei premi');
    final List<dynamic> data = jsonDecode(response.body);
    return data.map((json) => Reward.fromJson(json)).toList();
  }
} 