import 'dart:convert';
import 'package:http/http.dart' as http;
import 'dart:html' as html;

class AppleWalletService {
  static Future<void> createPass({
    required String cardId,
    required String customerName,
    required String cardUid,
  }) async {
    try {
      print('Richiesta creazione pass Apple Wallet per carta: $cardId');
      
      // Chiama l'API Supabase Edge Function per creare il pass Apple Wallet
      final response = await http.post(
        Uri.parse('https://egmizgydnmvpfpbzmbnj.supabase.co/functions/v1/apple-wallet'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVnbWl6Z3lkbm12cGZwYnptYm5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc0NjA2NjUsImV4cCI6MjA2MzAzNjY2NX0.eKlGwWbYq6TUv0AJq8Lv9w6Vejwp2v7CyQEMW0hqL6U',
        },
        body: jsonEncode({
          'cardId': cardId,
          'customerName': customerName,
          'cardUid': cardUid,
        }),
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        final contentType = response.headers['content-type'] ?? '';
        
        if (contentType.contains('application/json')) {
          // Nuova modalità - certificati configurati
          final data = jsonDecode(response.body);
          
          if (data['success'] == true) {
            print('✅ Pass Apple Wallet generato con successo');
            print('📋 Dati pass: ${data['passData']}');
            
            // Mostra messaggio di successo
            html.window.alert('''
Pass Apple Wallet generato con successo!

Dati carta:
- ID: ${data['passData']['cardId']}
- Nome: ${data['passData']['customerName']}
- UID: ${data['passData']['cardUid']}
- Organizzazione: ${data['passData']['organizationName']}
- Saldo: ${data['passData']['balance']} punti

Status: ${data['passData']['status']}
Messaggio: ${data['passData']['message']}

Prossimi passi:
${data['passData']['nextSteps'].join('\n')}

Nota: ${data['note']}
            ''');
            
            return;
          } else {
            // Modalità test - certificati non configurati
            print('Modalità test attivata: ${data['message']}');
            
            // Mostra messaggio informativo
            html.window.alert('''
Certificati Apple Wallet non configurati.

Per completare l'integrazione:
${data['instructions'].join('\n')}

Dati carta per test:
- ID: $cardId
- Nome: $customerName
- UID: $cardUid
            ''');
            
            return;
          }
        } else if (contentType.contains('application/vnd.apple.pkpass')) {
          // Modalità normale - certificati configurati e file .pkpass generato
          // Crea un blob dal contenuto della risposta
          final blob = html.Blob([response.bodyBytes], 'application/vnd.apple.pkpass');
          
          // Crea un URL per il blob
          final url = html.Url.createObjectUrlFromBlob(blob);
          
          // Crea un link temporaneo per il download
          final anchor = html.AnchorElement(href: url)
            ..setAttribute('download', 'retap-card-$cardId.pkpass')
            ..click();
          
          // Pulisci l'URL dopo il download
          html.Url.revokeObjectUrl(url);
          
          print('Pass Apple Wallet generato con successo');
        }
      } else {
        print('Errore nella risposta del server: ${response.statusCode}');
        print('Risposta: ${response.body}');
        throw Exception('Errore nella creazione del pass Apple Wallet: ${response.statusCode}');
      }
    } catch (e) {
      print('Errore dettagliato nella creazione del pass Apple Wallet: $e');
      throw Exception('Errore nella creazione del pass Apple Wallet: $e');
    }
  }
}
