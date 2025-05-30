import 'package:http/http.dart' as http;
import 'dart:convert';
import '../models/checkpoint_offer.dart';

class CheckpointService {
  static const _baseUrl = 'https://egmizgydnmvpfpbzmbnj.supabase.co/rest/v1';

  static Future<List<CheckpointOffer>> fetchOffers(String merchantId) async {
    try {
      // Prima otteniamo le offerte
      final offersUrl = '$_baseUrl/checkpoint_offers?merchant_id=eq.$merchantId';
      
      final offersResponse = await http.get(
        Uri.parse(offersUrl),
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVnbWl6Z3lkbm12cGZwYnptYm5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc0NjA2NjUsImV4cCI6MjA2MzAzNjY2NX0.eKlGwWbYq6TUv0AJq8Lv9w6Vejwp2v7CyQEMW0hqL6U',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVnbWl6Z3lkbm12cGZwYnptYm5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc0NjA2NjUsImV4cCI6MjA2MzAzNjY2NX0.eKlGwWbYq6TUv0AJq8Lv9w6Vejwp2v7CyQEMW0hqL6U',
          'x-merchant-id': merchantId,
        },
      );

      if (offersResponse.statusCode != 200) {
        throw Exception('Failed to load offers: ${offersResponse.statusCode}');
      }

      final List<dynamic> offersJson = jsonDecode(offersResponse.body);
      final List<CheckpointOffer> offers = [];

      // Per ogni offerta, otteniamo i suoi step
      for (var offerJson in offersJson) {
        final stepsUrl = '$_baseUrl/checkpoint_steps?offer_id=eq.${offerJson['id']}&select=*,reward:checkpoint_rewards(*)';
        
        final stepsResponse = await http.get(
          Uri.parse(stepsUrl),
          headers: {
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVnbWl6Z3lkbm12cGZwYnptYm5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc0NjA2NjUsImV4cCI6MjA2MzAzNjY2NX0.eKlGwWbYq6TUv0AJq8Lv9w6Vejwp2v7CyQEMW0hqL6U',
            'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVnbWl6Z3lkbm12cGZwYnptYm5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc0NjA2NjUsImV4cCI6MjA2MzAzNjY2NX0.eKlGwWbYq6TUv0AJq8Lv9w6Vejwp2v7CyQEMW0hqL6U',
            'x-merchant-id': merchantId,
          },
        );

        if (stepsResponse.statusCode == 200) {
          offerJson['steps'] = jsonDecode(stepsResponse.body);
        }

        offers.add(CheckpointOffer.fromJson(offerJson));
      }

      return offers;
    } catch (e) {
      throw Exception('Failed to load offers: $e');
    }
  }
} 