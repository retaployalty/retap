import 'package:http/http.dart' as http;
import 'dart:convert';

class GoogleWalletService {
  // URL dell'API in base all'ambiente
  static String get _apiUrl {
    // Forza l'URL di produzione per testare l'API deployata
    return 'https://api-bff.vercel.app';
    
    // Codice originale commentato per riferimento
    /*
    // In production, usa l'URL di Vercel
    if (Uri.base.host == 'localhost' || 
        Uri.base.host.contains('127.0.0.1')) {
      return 'http://localhost:4000';
    } else {
      // URL di production - sostituisci con il tuo dominio Vercel
      return 'https://api-bff.vercel.app';
    }
    */
  }

  static Future<String> createLoyaltyCard({
    required String cardId,
    required String customerName,
    required String cardUid,
  }) async {
    try {
      print('Richiesta creazione pass Google Wallet per carta: $cardId');
      print('🌐 API URL: $_apiUrl');
      
      // Chiama il controller NestJS per creare il pass Google Wallet
      final response = await http.post(
        Uri.parse('$_apiUrl/google-wallet/generate'),
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