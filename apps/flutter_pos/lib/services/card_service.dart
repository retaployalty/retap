import 'package:http/http.dart' as http;
import 'dart:convert';
import '../models/card.dart';

class CardService {
  static const _baseUrl = 'https://egmizgydnmvpfpbzmbnj.supabase.co/rest/v1/cards';

  static Future<CardModel?> fetchCardByUid(String uid) async {
    final response = await http.get(
      Uri.parse('$_baseUrl?uid=eq.$uid'),
      headers: {
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVnbWl6Z3lkbm12cGZwYnptYm5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc0NjA2NjUsImV4cCI6MjA2MzAzNjY2NX0.eKlGwWbYq6TUv0AJq8Lv9w6Vejwp2v7CyQEMW0hqL6U',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVnbWl6Z3lkbm12cGZwYnptYm5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc0NjA2NjUsImV4cCI6MjA2MzAzNjY2NX0.eKlGwWbYq6TUv0AJq8Lv9w6Vejwp2v7CyQEMW0hqL6U',
      },
    );
    if (response.statusCode != 200) return null;
    final List<dynamic> data = jsonDecode(response.body);
    if (data.isEmpty) return null;
    return CardModel.fromJson(data[0]);
  }
} 