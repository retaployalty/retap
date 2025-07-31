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
      debugPrint('Error checking NFC availability: $e');
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
      debugPrint('Error initializing scanner: $e');
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
          debugPrint('QR Code detected: $code');
          final decoded = jsonDecode(code);
          
          if (decoded is Map<String, dynamic> && decoded['type'] == 'retap_card' && decoded.containsKey('uid')) {
            final String cardUid = decoded['uid'];
            debugPrint('Card UID extracted: $cardUid');
            
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
              _showError('Invalid QR Code: unable to extract card ID.');
            }
          } else {
            _showError('Invalid QR Code for ReTap.');
          }
        } catch (e) {
          debugPrint('Error decoding QR Code: $e');
          _showError('Unrecognized QR Code format.');
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
      debugPrint('Error extracting cardId: $e');
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
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
        ),
        margin: const EdgeInsets.all(16),
      ),
    );
    setState(() => _isProcessing = false);
    _scannerController?.start();
  }

  Future<void> _writeNewCard() async {
    if (!_nfcAvailable) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text('❌ NFC not available on this device'),
          backgroundColor: Colors.red,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
          margin: const EdgeInsets.all(16),
        ),
      );
      return;
    }

    if (_scannedCardId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text('❌ Error: original card not identified'),
          backgroundColor: Colors.red,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
          margin: const EdgeInsets.all(16),
        ),
      );
      return;
    }

    setState(() => _isProcessing = true);

    try {
      debugPrint('Waiting for an empty NFC card...');
      
      // 1. Leggi il chip NFC
      final tag = await FlutterNfcKit.poll();
      debugPrint('Card detected! UID: ${tag.id}');

      // Verifica se il tag supporta NDEF
      if (tag.ndefAvailable == false) {
        throw Exception('This card does not support NDEF. Use an NTAG card.');
      }

      // Verifica se il tag è scrivibile
      if (tag.ndefWritable == false) {
        throw Exception('This card is read-only or already programmed.');
      }

      // Verifica se la carta è già programmata
      try {
        final existingRecords = await FlutterNfcKit.readNDEFRecords();
        if (existingRecords.isNotEmpty) {
          throw Exception('This card is already programmed. Use an empty NTAG card.');
        }
      } catch (readError) {
        if (readError.toString().contains('already programmed')) {
          rethrow;
        }
        debugPrint('Error reading NDEF (normal for empty cards): $readError');
      }

      // 2. Crea il link per la carta sostituita
      final cardUrl = 'https://app.retapcard.com/c/$_scannedCardId';
      debugPrint('Generated link: $cardUrl');

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
            debugPrint('Write attempt $retryCount/$maxRetries...');
            
            await FlutterNfcKit.writeNDEFRecords([uriRecord]);
            writeSuccess = true;
            debugPrint('✅ Link written to chip successfully!');
          } catch (writeError) {
            debugPrint('❌ Attempt $retryCount failed: $writeError');
            
            if (retryCount < maxRetries) {
              await Future.delayed(const Duration(seconds: 1));
              try {
                await FlutterNfcKit.poll();
              } catch (pollError) {
                throw Exception('The card was moved during writing');
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
          throw Exception('Error updating database: ${res.body}');
        }

        final responseData = jsonDecode(res.body);
        debugPrint('✅ Card replaced in database: ${responseData['message']}');

        // 5. Mostra messaggio di successo
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: const Text('✅ Card replaced successfully!'),
              backgroundColor: Colors.green,
              duration: const Duration(seconds: 3),
              behavior: SnackBarBehavior.floating,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
              ),
              margin: const EdgeInsets.all(16),
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

        await FlutterNfcKit.finish(iosAlertMessage: '✅ Card replaced!');
        debugPrint('🎉 Operation completed successfully!');
      } catch (e) {
        debugPrint('❌ ERROR during NFC writing: $e');
        
        String errorMessage = 'NFC writing error';
        
        if (e.toString().contains('Communication error')) {
          errorMessage = 'Communication error with the card.\n\nTips:\n• Keep the card steady and well positioned\n• Make sure it\'s an empty NTAG card\n• Try again multiple times if needed';
        } else if (e.toString().contains('Tag was lost') || e.toString().contains('card was moved')) {
          errorMessage = 'The card was moved during writing.\n\nKeep the card steady on the device until completion.';
        } else if (e.toString().contains('Not enough space')) {
          errorMessage = 'Card full or not supported.\n\nUse an empty NTAG card (NTAG213/215/216).';
        } else if (e.toString().contains('NDEF')) {
          errorMessage = 'Card not supported.\n\nUse a standard NTAG card (NTAG213/215/216).';
        }
        
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(errorMessage),
              backgroundColor: Colors.red,
              duration: const Duration(seconds: 8),
              action: SnackBarAction(
                label: 'Retry',
                textColor: Colors.white,
                onPressed: () => _writeNewCard(),
              ),
            ),
          );
        }
        
        await FlutterNfcKit.finish(iosAlertMessage: '❌ NFC writing error');
      }
    } catch (e) {
      debugPrint('❌ ERROR during operation: $e');
      
      String errorMessage = 'Unknown error';
      
      if (e.toString().contains('NFC not available')) {
        errorMessage = 'NFC not available on this device';
      } else if (e.toString().contains('User cancelled')) {
        errorMessage = 'Operation cancelled by user';
      } else if (e.toString().contains('Timeout')) {
        errorMessage = 'Timeout: no card detected';
      } else {
        errorMessage = 'Error: $e';
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
        title: const Text('Lost Card Replacement'),
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
                  'QR Scan',
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
                  'Card Writing',
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
            Text('Initializing scanner...'),
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
                    'Processing...',
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
              'Point camera at the customer\'s digital card QR Code',
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
            'Write New Card',
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
              fontWeight: FontWeight.bold,
              color: Theme.of(context).colorScheme.primary,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 16),
          Text(
            'Original card identified:\n${_scannedCardUid ?? 'N/A'}',
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
                  'Bring an empty NTAG card close to replace the lost one',
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
                      Text('Processing...'),
                    ],
                  )
                                  : const Text(
                      'Start Writing',
                      style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                    ),
            ),
          ),
          const SizedBox(height: 16),
          
          // Pulsante per tornare indietro
          TextButton(
            onPressed: _isProcessing ? null : _resetProcess,
            child: const Text('Back to QR Scan'),
          ),
        ],
      ),
    );
  }
} 