import 'package:flutter/material.dart';
import 'package:flutter_nfc_kit/flutter_nfc_kit.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'dart:typed_data';
import 'package:uuid/uuid.dart';
import 'package:ndef/ndef.dart' as ndef;

class POSHomePage extends StatelessWidget {
  final String merchantId;
  final String merchantName;

  const POSHomePage({
    super.key,
    required this.merchantId,
    required this.merchantName,
  });

  Future<void> _writeCard(BuildContext context) async {
    try {
      debugPrint('Iniziando la scrittura della carta...');
      debugPrint('In attesa di una carta NFC...');
      
      // 1. Leggi il chip NFC
      final tag = await FlutterNfcKit.poll();
      debugPrint('Carta rilevata!');
      debugPrint('Tipo di tag: ${tag.type}');
      debugPrint('UID: ${tag.id}');

      // 2. Genera UUID per la carta
      final cardId = const Uuid().v4();
      debugPrint('UUID carta generato: $cardId');

      // 3. Crea un nuovo customer
      debugPrint('Creazione nuovo customer...');
      final customerRes = await http.post(
        Uri.parse('https://egmizgydnmvpfpbzmbnj.supabase.co/functions/v1/api/customers'),
        headers: {
          'Content-Type': 'application/json',
          'x-merchant-id': merchantId,
        },
        body: jsonEncode({
          'merchant_id': merchantId,
        }),
      );

      if (customerRes.statusCode != 200) {
        throw Exception('Errore nella creazione del customer: ${customerRes.body}');
      }

      final customer = jsonDecode(customerRes.body);
      debugPrint('Customer creato: ${customer['id']}');

      // 4. Crea il link
      final cardUrl = 'https://retapcard.com/c/$cardId';
      debugPrint('Link generato: $cardUrl');

      // 5. Scrivi il link sul chip in formato NDEF
      final uriRecord = ndef.UriRecord.fromUri(Uri.parse(cardUrl));

      await FlutterNfcKit.writeNDEFRecords([uriRecord]);
      debugPrint('Link scritto sul chip con successo');

      // 6. Manda la richiesta POST al backend per creare la carta
      debugPrint('Invio dati al backend...');
      final res = await http.post(
        Uri.parse('https://egmizgydnmvpfpbzmbnj.supabase.co/functions/v1/api/cards'),
        headers: {
          'Content-Type': 'application/json',
          'x-merchant-id': merchantId,
        },
        body: jsonEncode({
          'cardId': cardId,
          'uid': tag.id,
          'customerId': customer['id'],
        }),
      );

      debugPrint('Risposta API ricevuta:');
      debugPrint('Status code: ${res.statusCode}');
      debugPrint('Body: ${res.body}');

      // 7. Blocca il chip in sola lettura (se supportato)
      if (tag.type == NFCTagType.iso15693) {
        try {
          await FlutterNfcKit.finish(iosAlertMessage: 'Chip bloccato in sola lettura');
          debugPrint('Chip bloccato in sola lettura');
        } catch (e) {
          debugPrint('Impossibile bloccare il chip: $e');
        }
      }

      // 8. Mostra messaggio di successo
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Carta programmata con successo'),
            backgroundColor: Colors.green,
          ),
        );
      }

      await FlutterNfcKit.finish(iosAlertMessage: 'Fatto!');
      debugPrint('Operazione completata con successo!');
    } catch (e) {
      debugPrint('ERRORE durante l\'operazione:');
      debugPrint('Tipo di errore: ${e.runtimeType}');
      debugPrint('Messaggio: $e');
      
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Errore: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
      
      await FlutterNfcKit.finish(iosAlertMessage: 'Errore: $e');
    }
  }

  Future<void> _readCard(BuildContext context) async {
    try {
      debugPrint('Iniziando la lettura della carta...');
      debugPrint('In attesa di una carta NFC...');
      final tag = await FlutterNfcKit.poll();
      debugPrint('Carta rilevata!');
      debugPrint('UID: ${tag.id}');

      // Prima cerchiamo la carta nel database
      debugPrint('Cercando la carta nel database...');
      final cardRes = await http.get(
        Uri.parse('https://egmizgydnmvpfpbzmbnj.supabase.co/functions/v1/api/cards?uid=${tag.id}'),
        headers: {
          'x-merchant-id': merchantId,
        },
      );
      debugPrint('Risposta ricerca carta:');
      debugPrint('Status code: ${cardRes.statusCode}');
      debugPrint('Body: ${cardRes.body}');

      if (cardRes.statusCode != 200) {
        debugPrint('Carta non trovata nel database');
        await FlutterNfcKit.finish(iosAlertMessage: 'Carta non registrata');
        return;
      }

      final card = jsonDecode(cardRes.body);
      debugPrint('Carta trovata: $card');

      // Mostra il saldo attuale
      final balanceRes = await http.get(
        Uri.parse('https://egmizgydnmvpfpbzmbnj.supabase.co/functions/v1/api/balance?cardId=${card['id']}'),
        headers: {
          'x-merchant-id': merchantId,
        },
      );

      if (balanceRes.statusCode != 200) {
        debugPrint('Errore nel recupero del saldo');
        await FlutterNfcKit.finish(iosAlertMessage: 'Errore nel recupero del saldo');
        return;
      }

      final balanceData = jsonDecode(balanceRes.body);
      final currentBalance = balanceData['balance'] ?? 0;
      debugPrint('Saldo attuale: $currentBalance punti');
      
      // Mostra un dialog con il saldo
      if (context.mounted) {
        showDialog(
          context: context,
          builder: (context) => AlertDialog(
            title: const Text('Saldo Carta'),
            content: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text('UID: ${card['uid']}'),
                const SizedBox(height: 8),
                Text(
                  '$currentBalance punti',
                  style: const TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                    color: Colors.blue,
                  ),
                ),
              ],
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(context),
                child: const Text('Chiudi'),
              ),
              TextButton(
                onPressed: () async {
                  Navigator.pop(context);
                  // Creiamo la transazione
                  debugPrint('Creando transazione...');
                  final txRes = await http.post(
                    Uri.parse('https://egmizgydnmvpfpbzmbnj.supabase.co/functions/v1/api/tx'),
                    headers: {
                      'Content-Type': 'application/json',
                      'x-merchant-id': merchantId,
                    },
                    body: jsonEncode({
                      'cardId': card['id'],
                      'points': 10, // Punti da accreditare
                    }),
                  );
                  debugPrint('Risposta creazione transazione:');
                  debugPrint('Status code: ${txRes.statusCode}');
                  debugPrint('Body: ${txRes.body}');

                  await FlutterNfcKit.finish(iosAlertMessage: 'Transazione completata!');
                },
                child: const Text('Accredita 10 punti'),
              ),
            ],
          ),
        );
      }
    } catch (e) {
      debugPrint('ERRORE durante l\'operazione:');
      debugPrint('Tipo di errore: ${e.runtimeType}');
      debugPrint('Messaggio: $e');
      
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Errore: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
      
      await FlutterNfcKit.finish(iosAlertMessage: 'Errore: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('ReTap POS - $merchantName'),
        backgroundColor: Theme.of(context).colorScheme.primary,
        foregroundColor: Colors.white,
      ),
      body: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                minimumSize: const Size(double.infinity, 50),
              ),
              child: const Text('Scrivi Carta'),
              onPressed: () => _writeCard(context),
            ),
            const SizedBox(height: 32),
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                minimumSize: const Size(double.infinity, 50),
              ),
              child: const Text('Leggi Carta'),
              onPressed: () => _readCard(context),
            ),
          ],
        ),
      ),
    );
  }
} 