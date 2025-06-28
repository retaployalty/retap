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

class _QRScannerScreenState extends State<QRScannerScreen> with WidgetsBindingObserver {
  MobileScannerController? _scannerController;
  bool _isProcessing = false;
  bool _isInitialized = false;
  bool _isPaused = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _initializeScanner();
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _scannerController?.dispose();
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.paused) {
      _isPaused = true;
      _scannerController?.stop();
    } else if (state == AppLifecycleState.resumed) {
      _isPaused = false;
      if (_isInitialized) {
        _scannerController?.start();
      }
    }
  }

  Future<void> _initializeScanner() async {
    try {
      _scannerController = MobileScannerController(
        detectionSpeed: DetectionSpeed.noDuplicates,
        facing: CameraFacing.back,
        torchEnabled: false,
        formats: [BarcodeFormat.qrCode], // Solo QR code per velocizzare
      );
      
      setState(() {
        _isInitialized = true;
      });
    } catch (e) {
      debugPrint('Errore nell\'inizializzazione dello scanner: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Errore nell\'accesso alla fotocamera'),
            backgroundColor: Colors.red,
          ),
        );
        Navigator.of(context).pop();
      }
    }
  }

  void _handleQRCode(BarcodeCapture capture) {
    if (_isProcessing || _isPaused) return;
    
    setState(() => _isProcessing = true);
    
    // Ferma temporaneamente lo scanner per evitare scansioni multiple
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

            // Naviga direttamente senza pop per evitare doppia navigazione
            Navigator.of(context).pushReplacement(
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
        duration: const Duration(seconds: 2),
      ),
    );
    // Riattiva la scansione dopo un breve ritardo
    Future.delayed(const Duration(seconds: 1), () {
      if (mounted && !_isPaused) {
        setState(() => _isProcessing = false);
        _scannerController?.start();
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    if (!_isInitialized) {
      return Scaffold(
        appBar: AppBar(
          title: const Text('Inizializzazione Scanner'),
          backgroundColor: Theme.of(context).colorScheme.primary,
          foregroundColor: Colors.white,
        ),
        body: const Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              CircularProgressIndicator(),
              SizedBox(height: 16),
              Text('Avvio scanner...'),
            ],
          ),
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Inquadra il QR Code'),
        backgroundColor: Theme.of(context).colorScheme.primary,
        foregroundColor: Colors.white,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.of(context).pop(),
        ),
      ),
      body: Stack(
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
                'Inquadra il QR Code della carta ReTap',
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
      ),
    );
  }
} 