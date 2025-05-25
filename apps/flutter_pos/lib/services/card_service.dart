import 'package:http/http.dart' as http;
import 'dart:convert';
import '../models/card.dart';

class CardService {
  static const _baseUrl = 'https://egmizgydnmvpfpbzmbnj.supabase.co/functions/v1/api';

  static Future<CardModel?> fetchCardByUid(String uid, String merchantId) async {
    final response = await http.get(
      Uri.parse('$_baseUrl/cards?uid=$uid'),
      headers: {
        'Content-Type': 'application/json',
        'x-merchant-id': merchantId,
      },
    );
    if (response.statusCode != 200) return null;
    final data = jsonDecode(response.body);
    if (data == null) return null;
    return CardModel.fromJson(data);
  }

  static Future<CardModel?> fetchCardById(String id, String merchantId) async {
    final response = await http.get(
      Uri.parse('$_baseUrl/cards?id=$id'),
      headers: {
        'Content-Type': 'application/json',
        'x-merchant-id': merchantId,
      },
    );
    if (response.statusCode != 200) return null;
    final data = jsonDecode(response.body);
    if (data == null) return null;
    return CardModel.fromJson(data);
  }
} 