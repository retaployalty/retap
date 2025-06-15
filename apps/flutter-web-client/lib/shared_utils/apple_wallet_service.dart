import 'dart:convert';
import 'package:http/http.dart' as http;

class AppleWalletService {
  static Future<String> createPass({
    required String cardId,
    required String customerName,
    required String cardUid,
  }) async {
    final response = await http.post(
      Uri.parse('https://egmizgydnmvpfpbzmbnj.supabase.co/functions/v1/api/apple-wallet/generate'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'cardId': cardId,
        'customerName': customerName,
        'cardUid': cardUid,
      }),
    );

    if (response.statusCode == 200) {
      // Restituisci direttamente l'endpoint per il download
      return 'https://egmizgydnmvpfpbzmbnj.supabase.co/functions/v1/api/apple-wallet/generate?cardId=$cardId';
    } else {
      throw Exception('Errore nella generazione del pass Apple Wallet');
    }
  }
}
