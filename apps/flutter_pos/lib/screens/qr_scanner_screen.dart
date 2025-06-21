import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'card_details_screen.dart';

class QRScannerScreen extends StatefulWidget {
  final String merchantId;

  const QRScannerScreen({
    super.key,
    required this.merchantId,
  });

  @override
  State<QRScannerScreen> createState() => _QRScannerScreenState();
}

class _QRScannerScreenState extends State<QRScannerScreen> {
  final MobileScannerController _scannerController = MobileScannerController(
    detectionSpeed: DetectionSpeed.noDuplicates,
  );
  bool _isProcessing = false;

  @override
  void dispose() {
    _scannerController.dispose();
    super.dispose();
  }

  void _handleQRCode(BarcodeCapture capture) {
    if (_isProcessing) return;
    setState(() => _isProcessing = true);

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

            // Naviga alla schermata dei dettagli della carta
            Navigator.of(context).pop(); // Chiude lo scanner
            Navigator.of(context).push(
              MaterialPageRoute(
                builder: (context) => CardDetailsScreen(
                  cardUid: cardUid,
                  merchantId: widget.merchantId,
                ),
              ),
            );
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
  
  void _showError(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.red,
      ),
    );
    // Riattiva la scansione dopo un breve ritardo
    Future.delayed(const Duration(seconds: 2), () {
      if (mounted) {
        setState(() => _isProcessing = false);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Inquadra il QR Code'),
        backgroundColor: Theme.of(context).colorScheme.primary,
        foregroundColor: Colors.white,
      ),
      body: Stack(
        children: [
          MobileScanner(
            controller: _scannerController,
            onDetect: _handleQRCode,
          ),
          Center(
            child: Container(
              width: 250,
              height: 250,
              decoration: BoxDecoration(
                border: Border.all(
                  color: Colors.white.withOpacity(0.7),
                  width: 4,
                ),
                borderRadius: BorderRadius.circular(12),
              ),
            ),
          ),
          if (_isProcessing)
            Container(
              color: Colors.black.withOpacity(0.5),
              child: const Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    CircularProgressIndicator(color: Colors.white),
                    SizedBox(height: 16),
                    Text('Elaborazione...', style: TextStyle(color: Colors.white, fontSize: 16)),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }
} 