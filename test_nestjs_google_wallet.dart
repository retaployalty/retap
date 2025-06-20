import 'package:http/http.dart' as http;
import 'dart:convert';

void main() async {
  print('Test del controller NestJS Google Wallet...');
  
  try {
    final response = await http.post(
      Uri.parse('http://localhost:3001/google-wallet/generate'),
      headers: {
        'Content-Type': 'application/json',
      },
      body: jsonEncode({
        'cardId': 'test-card-123',
        'customerName': 'Mario Rossi',
        'cardUid': 'test-uid-456',
      }),
    );

    print('Status Code: ${response.statusCode}');
    print('Response Body: ${response.body}');
    
    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      final saveUrl = data['saveUrl'] as String;
      print('✅ Test riuscito! URL generato: $saveUrl');
      
      // Verifica che l'URL sia un JWT valido
      if (saveUrl.contains('https://pay.google.com/gp/v/save/') && 
          saveUrl.split('/').last.contains('.')) {
        print('✅ URL sembra essere un JWT valido');
      } else {
        print('❌ URL non sembra essere un JWT valido');
      }
    } else {
      print('❌ Test fallito con status code: ${response.statusCode}');
    }
  } catch (e) {
    print('❌ Errore durante il test: $e');
  }
} 