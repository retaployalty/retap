import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_nfc_kit/flutter_nfc_kit.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:ndef/ndef.dart' as ndef;
import 'package:mobile_scanner/mobile_scanner.dart';
import 'card_details_screen.dart';

class LostCardReplacementScreen extends StatefulWidget {
  final String merchantId;
  final String merchantName;

  const LostCardReplacementScreen({
    super.key,
    required this.merchantId,
    required this.merchantName,
  });

  @override
  State<LostCardReplacementScreen> createState() => _LostCardReplacementScreenState();
}

class _LostCardReplacementScreenState extends State<LostCardReplacementScreen> {
  int _currentStep = 1;
  String? _scannedCardId;
  String? _scannedCardUid;
  bool _isProcessing = false;
  bool _nfcAvailable = false;
  MobileScannerController? _scannerController;

  @override
  void initState() {
    super.initState();
    _checkNfcAvailability();
    _initializeScanner();
  }

  @override
  void dispose() {
    _scannerController?.dispose();
    super.dispose();
  }

  Future<void> _checkNfcAvailability() async {
    try {
      final availability = await FlutterNfcKit.nfcAvailability;
      setState(() {
        _nfcAvailable = availability == NFCAvailability.available;
      });
    } catch (e) {
      debugPrint('Errore nel controllo disponibilità NFC: $e');
      setState(() {
        _nfcAvailable = false;
      });
    }
  }

  Future<void> _initializeScanner() async {
    try {
      _scannerController = MobileScannerController(
        detectionSpeed: DetectionSpeed.noDuplicates,
        facing: CameraFacing.back,
        torchEnabled: false,
        formats: [BarcodeFormat.qrCode],
      );
    } catch (e) {
      debugPrint('Errore nell\'inizializzazione dello scanner: $e');
    }
  }

  void _handleQRCode(BarcodeCapture capture) {
    if (_isProcessing) return;
    
    setState(() => _isProcessing = true);
    _scannerController?.stop();

    final barcodes = capture.barcodes;
    if (barcodes.isNotEmpty) {
      final String? code = barcodes.first.rawValue;
      if (code != null) {
        try {
          debugPrint('QR Code rilevato: $code');
          final decoded = jsonDecode(code);
          
          if (decoded is Map<String, dynamic> && decoded['type'] == 'retap_card' && decoded.containsKey('uid')) {
            final String cardUid = decoded['uid'];
            debugPrint('UID della carta estratto: $cardUid');
            
            // Estrai il cardId dall'URL
            final cardId = _extractCardIdFromUrl(code);
            if (cardId != null) {
              setState(() {
                _scannedCardId = cardId;
                _scannedCardUid = cardUid;
                _currentStep = 2;
                _isProcessing = false;
              });
            } else {
              _showError('QR Code non valido: impossibile estrarre l\'ID della carta.');
            }
          } else {
            _showError('QR Code non valido per ReTap.');
          }
        } catch (e) {
          debugPrint('Errore durante la decodifica del QR Code: $e');
          _showError('Formato QR Code non riconosciuto.');
        }
      }
    }
  }

  String? _extractCardIdFromUrl(String qrData) {
    try {
      // Prima prova a estrarre dal JSON del QR code
      final decoded = jsonDecode(qrData);
      if (decoded is Map<String, dynamic>) {
        // Il QR code del wallet contiene: {"type": "retap_card", "id": "cardId", "uid": "cardUid"}
        if (decoded.containsKey('id')) {
          return decoded['id'];
        }
        // Fallback per il formato legacy
        if (decoded.containsKey('cardId')) {
          return decoded['cardId'];
        }
      }
      
      // Se non trova il JSON, cerca l'URL della carta
      final urlMatch = RegExp(r'https://app\.retapcard\.com/c/([a-f0-9-]+)').firstMatch(qrData);
      if (urlMatch != null) {
        return urlMatch.group(1);
      }
      
      return null;
    } catch (e) {
      debugPrint('Errore nell\'estrazione del cardId: $e');
      return null;
    }
  }

  void _showError(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.red,
        duration: const Duration(seconds: 3),
      ),
    );
    setState(() => _isProcessing = false);
    _scannerController?.start();
  }

  Future<void> _writeNewCard() async {
    if (!_nfcAvailable) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('NFC non disponibile su questo dispositivo'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    if (_scannedCardId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Errore: carta originale non identificata'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    setState(() => _isProcessing = true);

    try {
      debugPrint('In attesa di una carta NFC vuota...');
      
      // 1. Leggi il chip NFC
      final tag = await FlutterNfcKit.poll();
      debugPrint('Carta rilevata! UID: ${tag.id}');

      // Verifica se il tag supporta NDEF
      if (tag.ndefAvailable == false) {
        throw Exception('Questa carta non supporta NDEF. Usa una carta NTAG.');
      }

      // Verifica se il tag è scrivibile
      if (tag.ndefWritable == false) {
        throw Exception('Questa carta è in sola lettura o già programmata.');
      }

      // Verifica se la carta è già programmata
      try {
        final existingRecords = await FlutterNfcKit.readNDEFRecords();
        if (existingRecords.isNotEmpty) {
          throw Exception('Questa carta è già programmata. Usa una carta NTAG vuota.');
        }
      } catch (readError) {
        if (readError.toString().contains('già programmata')) {
          rethrow;
        }
        debugPrint('Errore nella lettura NDEF (normale per carte vuote): $readError');
      }

      // 2. Crea il link per la carta sostituita
      final cardUrl = 'https://app.retapcard.com/c/$_scannedCardId';
      debugPrint('Link generato: $cardUrl');

      // 3. Scrivi il link sul chip in formato NDEF
      try {
        final uriRecord = ndef.UriRecord.fromUri(Uri.parse(cardUrl));
        
        // Tentativo di scrittura con retry
        bool writeSuccess = false;
        int retryCount = 0;
        const maxRetries = 3;
        
        while (!writeSuccess && retryCount < maxRetries) {
          try {
            retryCount++;
            debugPrint('Tentativo di scrittura $retryCount/$maxRetries...');
            
            await FlutterNfcKit.writeNDEFRecords([uriRecord]);
            writeSuccess = true;
            debugPrint('✅ Link scritto sul chip con successo!');
          } catch (writeError) {
            debugPrint('❌ Tentativo $retryCount fallito: $writeError');
            
            if (retryCount < maxRetries) {
              await Future.delayed(const Duration(seconds: 1));
              try {
                await FlutterNfcKit.poll();
              } catch (pollError) {
                throw Exception('La carta è stata allontanata durante la scrittura');
              }
            } else {
              throw writeError;
            }
          }
        }

        // 4. Aggiorna il database con il nuovo UID
        final res = await http.post(
          Uri.parse('https://egmizgydnmvpfpbzmbnj.supabase.co/functions/v1/api/cards/replace'),
          headers: {
            'Content-Type': 'application/json',
            'x-merchant-id': widget.merchantId,
          },
          body: jsonEncode({
            'oldCardId': _scannedCardId,
            'newUid': tag.id,
          }),
        );

        if (res.statusCode != 200 && res.statusCode != 201) {
          throw Exception('Errore nell\'aggiornamento del database: ${res.body}');
        }

        final responseData = jsonDecode(res.body);
        debugPrint('✅ Carta sostituita nel database: ${responseData['message']}');

        // 5. Mostra messaggio di successo
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('✅ Carta sostituita con successo!'),
              backgroundColor: Colors.green,
              duration: Duration(seconds: 3),
            ),
          );

          // Apri la schermata dettagli della carta sostituita
          await Navigator.pushReplacement(
            context,
            MaterialPageRoute(
              builder: (context) => CardDetailsScreen(
                cardUid: tag.id,
                merchantId: widget.merchantId,
              ),
            ),
          );
        }

        await FlutterNfcKit.finish(iosAlertMessage: '✅ Carta sostituita!');
        debugPrint('🎉 Operazione completata con successo!');
      } catch (e) {
        debugPrint('❌ ERRORE durante la scrittura NFC: $e');
        
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
        
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(errorMessage),
              backgroundColor: Colors.red,
              duration: const Duration(seconds: 8),
              action: SnackBarAction(
                label: 'Riprova',
                textColor: Colors.white,
                onPressed: () => _writeNewCard(),
              ),
            ),
          );
        }
        
        await FlutterNfcKit.finish(iosAlertMessage: '❌ Errore nella scrittura NFC');
      }
    } catch (e) {
      debugPrint('❌ ERRORE durante l\'operazione: $e');
      
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
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(errorMessage),
            backgroundColor: Colors.red,
          ),
        );
      }
      
      await FlutterNfcKit.finish(iosAlertMessage: errorMessage);
    } finally {
      if (mounted) {
        setState(() => _isProcessing = false);
      }
    }
  }

  void _resetProcess() {
    setState(() {
      _currentStep = 1;
      _scannedCardId = null;
      _scannedCardUid = null;
      _isProcessing = false;
    });
    _scannerController?.start();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Sostituzione Carta Persa'),
        backgroundColor: Theme.of(context).colorScheme.primary,
        foregroundColor: Colors.white,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.of(context).pop(),
        ),
      ),
      body: Column(
        children: [
          // Indicatore di progresso
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Theme.of(context).colorScheme.primary.withOpacity(0.1),
            ),
            child: Row(
              children: [
                Icon(
                  _currentStep >= 1 ? Icons.check_circle : Icons.radio_button_unchecked,
                  color: _currentStep >= 1 ? Colors.green : Colors.grey,
                ),
                const SizedBox(width: 8),
                Text(
                  'Scansione QR',
                  style: TextStyle(
                    fontWeight: _currentStep >= 1 ? FontWeight.bold : FontWeight.normal,
                  ),
                ),
                const SizedBox(width: 16),
                Icon(
                  _currentStep >= 2 ? Icons.check_circle : Icons.radio_button_unchecked,
                  color: _currentStep >= 2 ? Colors.green : Colors.grey,
                ),
                const SizedBox(width: 8),
                Text(
                  'Scrittura Carta',
                  style: TextStyle(
                    fontWeight: _currentStep >= 2 ? FontWeight.bold : FontWeight.normal,
                  ),
                ),
              ],
            ),
          ),
          
          // Contenuto principale
          Expanded(
            child: _currentStep == 1 ? _buildQRScannerStep() : _buildNFCWriteStep(),
          ),
        ],
      ),
    );
  }

  Widget _buildQRScannerStep() {
    if (_scannerController == null) {
      return const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            CircularProgressIndicator(),
            SizedBox(height: 16),
            Text('Inizializzazione scanner...'),
          ],
        ),
      );
    }

    return Stack(
      children: [
        MobileScanner(
          controller: _scannerController!,
          onDetect: _handleQRCode,
          placeholderBuilder: (context) {
            return Container(
              color: Colors.black,
              child: const Center(
                child: CircularProgressIndicator(color: Colors.white),
              ),
            );
          },
        ),
        // Overlay con cornice di scansione
        Center(
          child: Container(
            width: 250,
            height: 250,
            decoration: BoxDecoration(
              border: Border.all(
                color: Colors.white.withOpacity(0.8),
                width: 3,
              ),
              borderRadius: BorderRadius.circular(16),
            ),
          ),
        ),
        // Indicatore di elaborazione
        if (_isProcessing)
          Container(
            color: Colors.black.withOpacity(0.7),
            child: const Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  CircularProgressIndicator(color: Colors.white),
                  SizedBox(height: 16),
                  Text(
                    'Elaborazione...',
                    style: TextStyle(color: Colors.white, fontSize: 16),
                  ),
                ],
              ),
            ),
          ),
        // Istruzioni per l'utente
        Positioned(
          bottom: 50,
          left: 20,
          right: 20,
          child: Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.black.withOpacity(0.7),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Text(
              'Inquadra il QR Code della carta digitale del cliente',
              style: TextStyle(
                color: Colors.white,
                fontSize: 16,
                fontWeight: FontWeight.w500,
              ),
              textAlign: TextAlign.center,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildNFCWriteStep() {
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          // Icona e titolo
          Icon(
            Icons.nfc,
            size: 80,
            color: Theme.of(context).colorScheme.primary,
          ),
          const SizedBox(height: 24),
          Text(
            'Scrittura Nuova Carta',
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
              fontWeight: FontWeight.bold,
              color: Theme.of(context).colorScheme.primary,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 16),
          Text(
            'Carta originale identificata:\n${_scannedCardUid ?? 'N/A'}',
            style: Theme.of(context).textTheme.bodyMedium,
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 32),
          
          // Istruzioni
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: Colors.blue.withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.blue.withOpacity(0.3)),
            ),
            child: Column(
              children: [
                Icon(
                  Icons.info_outline,
                  color: Colors.blue,
                  size: 32,
                ),
                const SizedBox(height: 12),
                Text(
                  'Avvicina una carta NTAG vuota per sostituire quella persa',
                  style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                    color: Colors.blue.shade700,
                    fontWeight: FontWeight.w500,
                  ),
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          ),
          const SizedBox(height: 32),
          
          // Pulsante per iniziare la scrittura
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: _nfcAvailable && !_isProcessing ? _writeNewCard : null,
              style: ElevatedButton.styleFrom(
                backgroundColor: Theme.of(context).colorScheme.primary,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              child: _isProcessing
                ? const Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                        ),
                      ),
                      SizedBox(width: 12),
                      Text('Elaborazione...'),
                    ],
                  )
                : const Text(
                    'Inizia Scrittura',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                  ),
            ),
          ),
          const SizedBox(height: 16),
          
          // Pulsante per tornare indietro
          TextButton(
            onPressed: _isProcessing ? null : _resetProcess,
            child: const Text('Torna alla Scansione QR'),
          ),
        ],
      ),
    );
  }
} 