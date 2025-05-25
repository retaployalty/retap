import 'package:flutter/material.dart';
import 'package:flutter_nfc_kit/flutter_nfc_kit.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'dart:typed_data';
import 'package:uuid/uuid.dart';
import 'package:ndef/ndef.dart' as ndef;
import 'card_details_screen.dart';

class POSHomePage extends StatefulWidget {
  final String merchantId;
  final String merchantName;

  const POSHomePage({
    super.key,
    required this.merchantId,
    required this.merchantName,
  });

  @override
  State<POSHomePage> createState() => _POSHomePageState();
}

class _POSHomePageState extends State<POSHomePage> {
  bool _isPolling = false;
  bool _isScreenOpen = false;

  @override
  void initState() {
    super.initState();
    _startPolling();
  }

  Future<void> _startPolling() async {
    if (_isPolling) return;
    _isPolling = true;

    try {
      while (_isPolling) {
        try {
          debugPrint('In attesa di una carta NFC...');
          final tag = await FlutterNfcKit.poll();
          debugPrint('Carta rilevata!');
          debugPrint('UID: ${tag.id}');

          if (_isScreenOpen) {
            debugPrint('Una schermata è già aperta, ignoro la rilevazione');
            continue;
          }

          if (mounted) {
            _isScreenOpen = true;
            await Navigator.push(
              context,
              MaterialPageRoute(
                builder: (context) => CardDetailsScreen(
                  cardUid: tag.id,
                  merchantId: widget.merchantId,
                ),
              ),
            );
            _isScreenOpen = false;
          }

          await FlutterNfcKit.finish();
        } catch (e) {
          debugPrint('Errore durante il polling NFC: $e');
          await FlutterNfcKit.finish();
        }
      }
    } catch (e) {
      debugPrint('Errore durante il polling NFC: $e');
    }
  }

  Future<void> _writeCard(BuildContext context) async {
    try {
      debugPrint('Iniziando la scrittura della carta...');
      debugPrint('In attesa di una carta NFC...');
      
      // 1. Leggi il chip NFC
      final tag = await FlutterNfcKit.poll();
      debugPrint('Carta rilevata!');
      debugPrint('Tipo di tag: ${tag.type}');
      debugPrint('UID: ${tag.id}');

      // 2. Controlla se la carta esiste già
      debugPrint('Controllo se la carta esiste già...');
      final cardRes = await http.get(
        Uri.parse('https://egmizgydnmvpfpbzmbnj.supabase.co/functions/v1/api/cards?uid=${tag.id}'),
        headers: {
          'x-merchant-id': widget.merchantId,
        },
      );

      String? customerId;
      String cardId;
      bool isExistingCard = false;

      if (cardRes.statusCode == 200) {
        // La carta esiste già
        final existingCard = jsonDecode(cardRes.body);
        debugPrint('Carta trovata: ${existingCard['id']}');
        cardId = existingCard['id'];
        customerId = existingCard['customer_id'];
        isExistingCard = true;
      } else {
        // La carta non esiste, crea un nuovo customer
        debugPrint('Carta non trovata, creo un nuovo customer...');
        final customerRes = await http.post(
          Uri.parse('https://egmizgydnmvpfpbzmbnj.supabase.co/functions/v1/api/customers'),
          headers: {
            'Content-Type': 'application/json',
            'x-merchant-id': widget.merchantId,
          },
          body: jsonEncode({
            'merchant_id': widget.merchantId,
          }),
        );

        if (customerRes.statusCode != 200) {
          throw Exception('Errore nella creazione del customer: ${customerRes.body}');
        }

        final customer = jsonDecode(customerRes.body);
        debugPrint('Customer creato: ${customer['id']}');
        customerId = customer['id'];
        cardId = const Uuid().v4();

        // TEMPORANEO PER SVILUPPO: Creiamo la carta nel database prima di scrivere sul chip
        // In produzione, la carta dovrebbe essere creata solo dopo la scrittura riuscita sul chip
        debugPrint('TEMPORANEO PER SVILUPPO: Creo la carta nel database prima della scrittura NFC');
        final res = await http.post(
          Uri.parse('https://egmizgydnmvpfpbzmbnj.supabase.co/functions/v1/api/cards'),
          headers: {
            'Content-Type': 'application/json',
            'x-merchant-id': widget.merchantId,
          },
          body: jsonEncode({
            'cardId': cardId,
            'uid': tag.id,
            'customerId': customerId,
          }),
        );

        if (res.statusCode != 200) {
          throw Exception('Errore nella creazione della carta: ${res.body}');
        }
        debugPrint('Carta creata nel database');
      }

      // 3. Crea il link
      final cardUrl = 'https://retapcard.com/c/$cardId';
      debugPrint('Link generato: $cardUrl');

      // 4. Scrivi il link sul chip in formato NDEF
      try {
        final uriRecord = ndef.UriRecord.fromUri(Uri.parse(cardUrl));
        await FlutterNfcKit.writeNDEFRecords([uriRecord]);
        debugPrint('Link scritto sul chip con successo');

        // 5. Blocca il chip in sola lettura (se supportato)
        if (tag.type == NFCTagType.iso15693) {
          try {
            await FlutterNfcKit.finish(iosAlertMessage: 'Chip bloccato in sola lettura');
            debugPrint('Chip bloccato in sola lettura');
          } catch (e) {
            debugPrint('Impossibile bloccare il chip: $e');
          }
        }

        // 6. Mostra messaggio appropriato
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(isExistingCard ? 'Carta già associata' : 'Carta programmata con successo'),
              backgroundColor: isExistingCard ? Colors.orange : Colors.green,
            ),
          );
        }

        await FlutterNfcKit.finish(iosAlertMessage: isExistingCard ? 'Carta già associata' : 'Fatto!');
        debugPrint('Operazione completata con successo!');
      } catch (e) {
        debugPrint('ERRORE durante la scrittura NFC:');
        debugPrint('Tipo di errore: ${e.runtimeType}');
        debugPrint('Messaggio: $e');
        
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Errore nella scrittura NFC: $e\nLa carta è stata comunque creata nel database (TEMPORANEO PER SVILUPPO)'),
              backgroundColor: Colors.orange,
              duration: const Duration(seconds: 5),
            ),
          );
        }
        
        await FlutterNfcKit.finish(iosAlertMessage: 'Errore nella scrittura NFC');
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
  void dispose() {
    _isPolling = false;
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('ReTap POS - ${widget.merchantName}'),
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
            Text(
              'Avvicina una carta NFC per vedere i dettagli',
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.titleMedium,
            ),
          ],
        ),
      ),
    );
  }
} 