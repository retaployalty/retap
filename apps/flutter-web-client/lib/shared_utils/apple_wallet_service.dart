import 'dart:convert';
import 'package:http/http.dart' as http;
import 'dart:html' as html;

class AppleWalletService {
  // URL dell'API in base all'ambiente
  static String get _apiUrl {
    // Forza l'URL di produzione per testare l'API deployata
    return 'https://api-bff.vercel.app';
    
    // Codice originale commentato per riferimento
    /*
    final hostname = html.window.location.hostname;
    if (hostname == 'localhost' || 
        hostname?.contains('127.0.0.1') == true) {
      return 'http://localhost:4000';
    } else {
      // URL di production - sostituisci con il tuo dominio Vercel
      return 'https://api-bff.vercel.app';
    }
    */
  }

  static Future<void> createPass({
    required String cardId,
    required String customerName,
    required String cardUid,
  }) async {
    try {
      print('Richiesta creazione pass Apple Wallet per carta: $cardId');
      print('🌐 API URL: $_apiUrl');
      
      // Chiama l'API NestJS per creare il pass Apple Wallet
      final response = await http.post(
        Uri.parse('$_apiUrl/apple-wallet/generate'),
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
          }
          
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
          
          print('✅ Pass Apple Wallet scaricato con successo');
          
          // Mostra messaggio di successo
          html.window.alert('''
Pass Apple Wallet scaricato con successo!

Il file .pkpass è stato scaricato. Per aggiungerlo al Wallet:
1. Apri il file scaricato
2. Tocca "Aggiungi" quando richiesto
3. La carta sarà disponibile nel tuo Apple Wallet

Dati carta:
- ID: $cardId
- Nome: $customerName
- UID: $cardUid
          ''');
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
