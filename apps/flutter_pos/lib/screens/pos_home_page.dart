import 'package:flutter/material.dart';
import 'package:flutter_nfc_kit/flutter_nfc_kit.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:uuid/uuid.dart';
import 'package:ndef/ndef.dart' as ndef;
import 'card_details_screen.dart';
import 'qr_scanner_screen.dart';

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

class _POSHomePageState extends State<POSHomePage> with WidgetsBindingObserver {
  bool _isPolling = false;
  bool _isScreenOpen = false;
  bool _nfcAvailable = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _initializeNfc();
  }

  @override
  void dispose() {
    _isPolling = false;
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      debugPrint('App ripresa, controllo NFC e riavvio polling');
      _initializeNfc();
    } else if (state == AppLifecycleState.paused) {
      debugPrint('App in pausa, fermo polling');
      _isPolling = false;
    } else if (state == AppLifecycleState.detached) {
      debugPrint('App distaccata, fermo polling');
      _isPolling = false;
    }
  }

  Future<void> _checkNfcAvailability() async {
    try {
      final availability = await FlutterNfcKit.nfcAvailability;
      setState(() {
        _nfcAvailable = availability == NFCAvailability.available;
      });
      
      if (!_nfcAvailable) {
        debugPrint('NFC non disponibile. Stato: $availability');
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('NFC non disponibile: $availability'),
              backgroundColor: Colors.red,
              duration: const Duration(seconds: 3),
            ),
          );
        }
      }
    } catch (e) {
      debugPrint('Errore nel controllo disponibilità NFC: $e');
      setState(() {
        _nfcAvailable = false;
      });
    }
  }

  Future<void> _startPolling() async {
    if (_isPolling || !_nfcAvailable) {
      debugPrint('Polling non avviato: _isPolling=$_isPolling, _nfcAvailable=$_nfcAvailable');
      return;
    }
    
    debugPrint('🚀 Avvio polling NFC...');
    _isPolling = true;
    setState(() {}); // Aggiorna l'UI per mostrare che il polling è attivo

    try {
      while (_isPolling && _nfcAvailable) {
        try {
          debugPrint('📱 In attesa di una carta NFC...');
          final tag = await FlutterNfcKit.poll();
          debugPrint('✅ Carta rilevata! UID: ${tag.id}');

          if (_isScreenOpen) {
            debugPrint('⚠️ Una schermata è già aperta, ignoro la rilevazione');
            await FlutterNfcKit.finish();
            continue;
          }

          if (mounted) {
            debugPrint('🔄 Apertura schermata dettagli carta...');
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
            debugPrint('✅ Schermata chiusa, continuo polling...');
          }

          await FlutterNfcKit.finish();
        } catch (e) {
          debugPrint('❌ Errore durante il polling NFC: $e');
          await FlutterNfcKit.finish();
          
          // Se l'errore è dovuto a un timeout o comunicazione, riprova dopo un breve delay
          if (e.toString().contains('Timeout') || e.toString().contains('Communication error')) {
            debugPrint('⏳ Timeout/comunicazione, attendo 500ms prima di riprovare...');
            await Future.delayed(const Duration(milliseconds: 500));
          } else if (e.toString().contains('User cancelled')) {
            debugPrint('👤 Utente ha annullato, continuo polling...');
            await Future.delayed(const Duration(milliseconds: 100));
          } else {
            debugPrint('⚠️ Errore sconosciuto, attendo 1 secondo...');
            await Future.delayed(const Duration(seconds: 1));
          }
        }
      }
    } catch (e) {
      debugPrint('💥 Errore fatale durante il polling NFC: $e');
    } finally {
      debugPrint('🛑 Polling fermato. _isPolling=$_isPolling, _nfcAvailable=$_nfcAvailable');
      _isPolling = false;
      setState(() {}); // Aggiorna l'UI
      
      // Se il polling si è fermato ma NFC è ancora disponibile, riavvialo
      if (_nfcAvailable && mounted) {
        debugPrint('🔄 Polling fermato, riavvio automatico tra 1 secondo...');
        Future.delayed(const Duration(seconds: 1), () {
          if (mounted && !_isPolling && _nfcAvailable) {
            debugPrint('🔄 Riavvio automatico del polling...');
            _startPolling();
          }
        });
      }
    }
  }

  Future<void> _writeCard(BuildContext context) async {
    if (!_nfcAvailable) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('NFC non disponibile su questo dispositivo'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    try {
      debugPrint('Iniziando la scrittura della carta...');
      debugPrint('In attesa di una carta NFC...');
      
      // 1. Leggi il chip NFC
      final tag = await FlutterNfcKit.poll();
      debugPrint('Carta rilevata!');
      debugPrint('Tipo di tag: ${tag.type}');
      debugPrint('UID: ${tag.id}');

      // Verifica se il tag supporta NDEF
      if (tag.ndefAvailable == false) {
        throw Exception('Questa carta non supporta NDEF. Usa una carta NTAG.');
      }

      // Verifica se il tag è scrivibile
      if (tag.ndefWritable == false) {
        throw Exception('Questa carta è in sola lettura o già programmata.');
      }

      // Verifica se la carta è già programmata leggendo i dati NDEF
      try {
        debugPrint('Verifico se la carta è già programmata...');
        final existingRecords = await FlutterNfcKit.readNDEFRecords();
        if (existingRecords.isNotEmpty) {
          debugPrint('Carta già programmata con ${existingRecords.length} record NDEF');
          for (final record in existingRecords) {
            debugPrint('Record: ${record.toString()}');
          }
          throw Exception('Questa carta è già programmata. Usa una carta NTAG vuota.');
        }
        debugPrint('Carta vuota, procedo con la programmazione...');
      } catch (readError) {
        if (readError.toString().contains('già programmata')) {
          rethrow;
        }
        debugPrint('Errore nella lettura NDEF (normale per carte vuote): $readError');
      }

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
        // La carta non esiste, prepara i dati ma NON creare ancora
        debugPrint('Carta non trovata, preparo i dati per la creazione...');
        cardId = const Uuid().v4();
        // CustomerId verrà creato solo dopo la scrittura NFC riuscita
      }

      // 3. Crea il link
      final cardUrl = 'https://retapcard.com/c/$cardId';
      debugPrint('Link generato: $cardUrl');

      // 4. Scrivi il link sul chip in formato NDEF
      try {
        debugPrint('Tentativo di scrittura NFC...');
        
        // Crea il record NDEF
        final uriRecord = ndef.UriRecord.fromUri(Uri.parse(cardUrl));
        debugPrint('Record NDEF creato, lunghezza: ${uriRecord.toString().length} caratteri');
        
        // Tentativo di scrittura con retry
        bool writeSuccess = false;
        int retryCount = 0;
        const maxRetries = 3;
        
        while (!writeSuccess && retryCount < maxRetries) {
          try {
            retryCount++;
            debugPrint('Tentativo di scrittura $retryCount/$maxRetries...');
            
            // Scrivi il record
            await FlutterNfcKit.writeNDEFRecords([uriRecord]);
            writeSuccess = true;
            debugPrint('✅ Link scritto sul chip con successo!');
          } catch (writeError) {
            debugPrint('❌ Tentativo $retryCount fallito: $writeError');
            
            if (retryCount < maxRetries) {
              debugPrint('Attendo 1 secondo prima del prossimo tentativo...');
              await Future.delayed(const Duration(seconds: 1));
              
              // Verifica che il tag sia ancora presente
              try {
                await FlutterNfcKit.poll();
                debugPrint('Tag ancora presente, riprovo...');
              } catch (pollError) {
                debugPrint('Tag perso durante il retry: $pollError');
                throw Exception('La carta è stata allontanata durante la scrittura');
              }
            } else {
              throw writeError;
            }
          }
        }

        // 5. SOLO DOPO la scrittura riuscita, crea customer e carta se necessario
        if (!isExistingCard) {
          debugPrint('Creo il customer e la carta nel database...');
          
          // Crea il customer
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

          if (customerRes.statusCode != 200 && customerRes.statusCode != 201) {
            throw Exception('Errore nella creazione del customer: ${customerRes.body}');
          }

          final customer = jsonDecode(customerRes.body);
          customerId = customer['id'];
          debugPrint('Customer creato: $customerId');

          // Crea la carta
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

          if (res.statusCode != 200 && res.statusCode != 201) {
            throw Exception('Errore nella creazione della carta: ${res.body}');
          }
          debugPrint('✅ Carta creata nel database');
        }

        // 6. Blocca il chip in sola lettura (se supportato)
        if (tag.type == NFCTagType.iso15693) {
          try {
            await FlutterNfcKit.finish(iosAlertMessage: 'Chip bloccato in sola lettura');
            debugPrint('Chip bloccato in sola lettura');
          } catch (e) {
            debugPrint('Impossibile bloccare il chip: $e');
          }
        }

        // 7. Mostra messaggio di successo
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(isExistingCard ? 'Carta già associata' : '✅ Carta programmata con successo!'),
              backgroundColor: isExistingCard ? Colors.orange : Colors.green,
              duration: const Duration(seconds: 3),
            ),
          );
        }

        await FlutterNfcKit.finish(iosAlertMessage: isExistingCard ? 'Carta già associata' : '✅ Fatto!');
        debugPrint('🎉 Operazione completata con successo!');
      } catch (e) {
        debugPrint('❌ ERRORE durante la scrittura NFC:');
        debugPrint('Tipo di errore: ${e.runtimeType}');
        debugPrint('Messaggio: $e');
        
        String errorMessage = 'Errore nella scrittura NFC';
        
        if (e.toString().contains('Communication error')) {
          errorMessage = 'Errore di comunicazione con la carta.\n\nSuggerimenti:\n• Mantieni la carta ferma e ben posizionata\n• Assicurati che sia una carta NTAG vuota\n• Riprova più volte se necessario';
        } else if (e.toString().contains('Tag was lost') || e.toString().contains('carta è stata allontanata')) {
          errorMessage = 'La carta è stata allontanata durante la scrittura.\n\nMantieni la carta ferma sul dispositivo fino al completamento.';
        } else if (e.toString().contains('Not enough space')) {
          errorMessage = 'Carta piena o non supportata.\n\nUsa una carta NTAG vuota (NTAG213/215/216).';
        } else if (e.toString().contains('NDEF')) {
          errorMessage = 'Carta non supportata.\n\nUsa una carta NTAG standard (NTAG213/215/216).';
        }
        
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(errorMessage),
              backgroundColor: Colors.red,
              duration: const Duration(seconds: 8),
              action: SnackBarAction(
                label: 'Riprova',
                textColor: Colors.white,
                onPressed: () => _writeCard(context),
              ),
            ),
          );
        }
        
        await FlutterNfcKit.finish(iosAlertMessage: '❌ Errore nella scrittura NFC');
      }
    } catch (e) {
      debugPrint('❌ ERRORE durante l\'operazione:');
      debugPrint('Tipo di errore: ${e.runtimeType}');
      debugPrint('Messaggio: $e');
      
      String errorMessage = 'Errore sconosciuto';
      
      if (e.toString().contains('NFC not available')) {
        errorMessage = 'NFC non disponibile su questo dispositivo';
      } else if (e.toString().contains('User cancelled')) {
        errorMessage = 'Operazione annullata dall\'utente';
      } else if (e.toString().contains('Timeout')) {
        errorMessage = 'Timeout: nessuna carta rilevata';
      } else if (e.toString().contains('Communication error')) {
        errorMessage = 'Errore di comunicazione con la carta';
      } else if (e.toString().contains('NDEF')) {
        errorMessage = 'Carta non supportata. Usa una carta NTAG standard.';
      } else {
        errorMessage = 'Errore: $e';
      }
      
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(errorMessage),
            backgroundColor: Colors.red,
          ),
        );
      }
      
      await FlutterNfcKit.finish(iosAlertMessage: errorMessage);
    }
  }

  Future<void> _writeMerchantCard(BuildContext context) async {
    if (!_nfcAvailable) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('NFC non disponibile su questo dispositivo'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    try {
      debugPrint('Iniziando la scrittura della carta merchant...');
      debugPrint('In attesa di una carta NFC...');
      
      // 1. Leggi il chip NFC
      final tag = await FlutterNfcKit.poll();
      debugPrint('Carta rilevata!');
      debugPrint('Tipo di tag: ${tag.type}');
      debugPrint('UID: ${tag.id}');

      // Verifica se il tag supporta NDEF
      if (tag.ndefAvailable == false) {
        throw Exception('Questa carta non supporta NDEF');
      }

      // Verifica se il tag è scrivibile
      if (tag.ndefWritable == false) {
        throw Exception('Questa carta è in sola lettura');
      }

      // 2. Crea il link specifico per il merchant
      final cardUrl = 'https://retapcard.com/m/${widget.merchantId}';
      debugPrint('Link merchant generato: $cardUrl');

      // 3. Scrivi il link sul chip in formato NDEF
      try {
        final uriRecord = ndef.UriRecord.fromUri(Uri.parse(cardUrl));
        await FlutterNfcKit.writeNDEFRecords([uriRecord]);
        debugPrint('Link scritto sul chip con successo');

        // 4. Blocca il chip in sola lettura (se supportato)
        if (tag.type == NFCTagType.iso15693) {
          try {
            await FlutterNfcKit.finish(iosAlertMessage: 'Chip bloccato in sola lettura');
            debugPrint('Chip bloccato in sola lettura');
          } catch (e) {
            debugPrint('Impossibile bloccare il chip: $e');
          }
        }

        // 5. Mostra messaggio di successo
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Carta merchant programmata con successo'),
              backgroundColor: Colors.green,
            ),
          );
        }

        await FlutterNfcKit.finish(iosAlertMessage: 'Fatto!');
        debugPrint('Operazione completata con successo!');
      } catch (e) {
        debugPrint('ERRORE durante la scrittura NFC:');
        debugPrint('Tipo di errore: ${e.runtimeType}');
        debugPrint('Messaggio: $e');
        
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Errore nella scrittura NFC: $e'),
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
      
      String errorMessage = 'Errore sconosciuto';
      
      if (e.toString().contains('NFC not available')) {
        errorMessage = 'NFC non disponibile su questo dispositivo';
      } else if (e.toString().contains('User cancelled')) {
        errorMessage = 'Operazione annullata dall\'utente';
      } else if (e.toString().contains('Timeout')) {
        errorMessage = 'Timeout: nessuna carta rilevata';
      } else {
        errorMessage = 'Errore: $e';
      }
      
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(errorMessage),
            backgroundColor: Colors.red,
          ),
        );
      }
      
      await FlutterNfcKit.finish(iosAlertMessage: errorMessage);
    }
  }

  Future<void> _initializeNfc() async {
    await _checkNfcAvailability();
    if (_nfcAvailable) {
      debugPrint('✅ NFC disponibile, avvio polling...');
      _startPolling();
    } else {
      debugPrint('❌ NFC non disponibile');
    }
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
            // Indicatore stato NFC
            if (!_nfcAvailable)
              Container(
                padding: const EdgeInsets.all(16),
                margin: const EdgeInsets.only(bottom: 16),
                decoration: BoxDecoration(
                  color: Colors.red.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.red),
                ),
                child: Row(
                  children: [
                    Icon(Icons.wifi_off, color: Colors.red),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'NFC non disponibile su questo dispositivo',
                        style: TextStyle(color: Colors.red),
                      ),
                    ),
                  ],
                ),
              ),
            
            // Indicatore stato polling NFC
            if (_nfcAvailable)
              Container(
                padding: const EdgeInsets.all(16),
                margin: const EdgeInsets.only(bottom: 16),
                decoration: BoxDecoration(
                  color: Colors.green.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.green),
                ),
                child: Row(
                  children: [
                    Icon(
                      _isPolling ? Icons.nfc : Icons.wifi_off,
                      color: _isPolling ? Colors.green : Colors.orange,
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        _isPolling 
                          ? 'NFC attivo - In attesa di carte...'
                          : 'NFC disponibile ma non attivo',
                        style: TextStyle(
                          color: _isPolling ? Colors.green : Colors.orange,
                        ),
                      ),
                    ),
                    if (!_isPolling)
                      IconButton(
                        icon: Icon(Icons.refresh, color: Colors.blue),
                        onPressed: () {
                          debugPrint('🔄 Riavvio manuale del polling NFC...');
                          _startPolling();
                        },
                        tooltip: 'Riavvia NFC',
                      ),
                  ],
                ),
              ),
            
            Text(
              'Avvicina una carta NFC per i dettagli o usa il QR Code del Wallet.',
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              icon: const Icon(Icons.qr_code_scanner),
              label: const Text('Scannerizza QR Code'),
              style: ElevatedButton.styleFrom(
                minimumSize: const Size(double.infinity, 60),
                textStyle: const TextStyle(fontSize: 18),
              ),
              onPressed: () {
                Navigator.of(context).push(
                  MaterialPageRoute(
                    builder: (context) => QRScannerScreen(merchantId: widget.merchantId),
                  ),
                );
              },
            ),
            const SizedBox(height: 32),
            const Divider(height: 1),
            const SizedBox(height: 16),
            Text(
              'Programmazione Carte',
              style: Theme.of(context).textTheme.titleSmall,
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                minimumSize: const Size(double.infinity, 50),
              ),
              child: const Text('Scrivi Carta Standard'),
              onPressed: _nfcAvailable ? () => _writeCard(context) : null,
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                minimumSize: const Size(double.infinity, 50),
                backgroundColor: Theme.of(context).colorScheme.primary.withOpacity(0.8),
                foregroundColor: Colors.white,
              ),
              child: const Text('Scrivi Carta Merchant'),
              onPressed: _nfcAvailable ? () => _writeMerchantCard(context) : null,
            ),
          ],
        ),
      ),
    );
  }
} 