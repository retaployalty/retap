import 'package:http/http.dart' as http;
import 'dart:convert';
import '../models/checkpoint.dart';
import 'package:flutter/foundation.dart';

class CheckpointService {
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
} 