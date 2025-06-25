import 'package:http/http.dart' as http;
import 'dart:convert';

class GoogleWalletService {
  static Future<String> createLoyaltyCard({
    required String cardId,
    required String customerName,
    required String cardUid,
  }) async {
    try {
      print('Richiesta creazione pass Google Wallet per carta: $cardId');
      
      // Chiama il controller NestJS per creare il pass Google Wallet
      final response = await http.post(
        Uri.parse('http://localhost:4000/google-wallet/generate'),
        headers: {
          'Content-Type': 'application/json',
        },
        body: jsonEncode({
          'cardId': cardId,
          'customerName': customerName,
          'cardUid': cardUid,
        }),
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = jsonDecode(response.body);
        final saveUrl = data['saveUrl'] as String;
        print('URL Google Wallet generato con successo: $saveUrl');
        return saveUrl;
      } else {
        print('Errore nella risposta del server: ${response.statusCode}');
        print('Risposta: ${response.body}');
        throw Exception('Errore nella creazione del pass Google Wallet: ${response.statusCode}');
      }
    } catch (e) {
      print('Errore dettagliato nella creazione del pass Google Wallet: $e');
      throw Exception('Errore nella creazione del pass Google Wallet: $e');
    }
  }
} 