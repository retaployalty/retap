import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_nfc_kit/flutter_nfc_kit.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:uuid/uuid.dart';
import 'package:ndef/ndef.dart' as ndef;
import 'card_details_screen.dart';
import 'qr_scanner_screen.dart';
import 'lost_card_replacement_screen.dart';
import '../services/api_service.dart';
import '../models/card.dart';

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
  bool _isWritingCard = false;
  bool _isWritingMerchantCard = false;

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
    setState(() {}); // Update UI to show that polling is active

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
          
          // If the error is due to timeout or communication, retry after a short delay
          if (e.toString().contains('Timeout') || e.toString().contains('Communication error')) {
            debugPrint('⏳ Timeout/communication, waiting 500ms before retrying...');
            await Future.delayed(const Duration(milliseconds: 500));
          } else if (e.toString().contains('User cancelled')) {
            debugPrint('👤 User cancelled, continuing polling...');
            await Future.delayed(const Duration(milliseconds: 100));
          } else {
            debugPrint('⚠️ Unknown error, waiting 1 second...');
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
          content: Text('NFC not available on this device'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    // Set loading state
    setState(() {
      _isWritingCard = true;
    });

    try {
      debugPrint('Starting card writing...');
      debugPrint('Waiting for an NFC card...');
      
      // 1. Read the NFC chip
      final tag = await FlutterNfcKit.poll();
      debugPrint('Card detected!');
      debugPrint('Tag type: ${tag.type}');
      debugPrint('UID: ${tag.id}');

      // Check if the tag supports NDEF
      if (tag.ndefAvailable == false) {
        throw Exception('This card does not support NDEF. Use an NTAG card.');
      }

      // Check if the tag is writable
      if (tag.ndefWritable == false) {
        throw Exception('This card is read-only or already programmed.');
      }

      // Check if the card is already programmed by reading NDEF data
      try {
        debugPrint('Checking if the card is already programmed...');
        final existingRecords = await FlutterNfcKit.readNDEFRecords();
        if (existingRecords.isNotEmpty) {
          debugPrint('Card already programmed with ${existingRecords.length} NDEF records');
          for (final record in existingRecords) {
            debugPrint('Record: ${record.toString()}');
          }
          throw Exception('This card is already programmed. Use an empty NTAG card.');
        }
        debugPrint('Empty card, proceeding with programming...');
      } catch (readError) {
        if (readError.toString().contains('already programmed')) {
          rethrow;
        }
        debugPrint('Error reading NDEF (normal for empty cards): $readError');
      }

      // 2. Check if the card already exists
      debugPrint('Checking if the card already exists...');
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
        // The card already exists
        final existingCard = jsonDecode(cardRes.body);
        debugPrint('Card found: ${existingCard['id']}');
        cardId = existingCard['id'];
        customerId = existingCard['customer_id'];
        isExistingCard = true;
      } else {
        // The card doesn't exist, prepare data but DON'T create yet
        debugPrint('Card not found, preparing data for creation...');
        cardId = const Uuid().v4();
        // CustomerId will be created only after successful NFC writing
      }

      // 3. Create the link
      final cardUrl = 'https://app.retapcard.com/c/$cardId';
      debugPrint('Generated link: $cardUrl');

      // 4. Write the link to the chip in NDEF format
      try {
        debugPrint('NFC writing attempt...');
        
        // Create the NDEF record
        final uriRecord = ndef.UriRecord.fromUri(Uri.parse(cardUrl));
        debugPrint('NDEF record created, length: ${uriRecord.toString().length} characters');
        
        // Writing attempt with retry
        bool writeSuccess = false;
        int retryCount = 0;
        const maxRetries = 3;
        
        while (!writeSuccess && retryCount < maxRetries) {
          try {
            retryCount++;
            debugPrint('Writing attempt $retryCount/$maxRetries...');
            
            // Write the record
            await FlutterNfcKit.writeNDEFRecords([uriRecord]);
            writeSuccess = true;
            debugPrint('✅ Link written to chip successfully!');
          } catch (writeError) {
            debugPrint('❌ Attempt $retryCount failed: $writeError');
            
            if (retryCount < maxRetries) {
              debugPrint('Waiting 1 second before next attempt...');
              await Future.delayed(const Duration(seconds: 1));
              
              // Verify that the tag is still present
              try {
                await FlutterNfcKit.poll();
                debugPrint('Tag still present, retrying...');
              } catch (pollError) {
                debugPrint('Tag lost during retry: $pollError');
                throw Exception('The card was moved away during writing');
              }
            } else {
              throw writeError;
            }
          }
        }

        // 5. ONLY AFTER successful writing, create customer and card if necessary
        if (!isExistingCard) {
          debugPrint('Creating customer and card in database...');
          
          // Create the customer
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
            throw Exception('Error creating customer: ${customerRes.body}');
          }

          final customer = jsonDecode(customerRes.body);
          customerId = customer['id'];
          debugPrint('Customer created: $customerId');

          // Create the card
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
              'issuing_merchant_id': widget.merchantId,
            }),
          );

          if (res.statusCode != 200 && res.statusCode != 201) {
            throw Exception('Error creating card: ${res.body}');
          }
          debugPrint('✅ Card created in database');

          // Open the card details screen immediately for the newly created card
          if (context.mounted) {
            await Navigator.push(
              context,
              MaterialPageRoute(
                builder: (context) => CardDetailsScreen(
                  cardUid: tag.id,
                  merchantId: widget.merchantId,
                ),
              ),
            );
          }
        }

        // 6. Lock the chip in read-only mode (if supported)
        if (tag.type == NFCTagType.iso15693) {
          try {
            await FlutterNfcKit.finish(iosAlertMessage: 'Chip locked in read-only mode');
            debugPrint('Chip locked in read-only mode');
          } catch (e) {
            debugPrint('Unable to lock chip: $e');
          }
        }

        // 7. Show success message
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(isExistingCard ? 'Card already associated' : '✅ Card programmed successfully!'),
              backgroundColor: isExistingCard ? Colors.orange : Colors.green,
              duration: const Duration(seconds: 3),
            ),
          );
        }

        await FlutterNfcKit.finish(iosAlertMessage: isExistingCard ? 'Card already associated' : '✅ Done!');
        debugPrint('🎉 Operation completed successfully!');
      } catch (e) {
        debugPrint('❌ ERROR during NFC writing:');
        debugPrint('Error type: ${e.runtimeType}');
        debugPrint('Message: $e');
        
        String errorMessage = 'NFC writing error';
        
        if (e.toString().contains('Communication error')) {
          errorMessage = 'Communication error with the card.\n\nSuggestions:\n• Keep the card steady and well positioned\n• Make sure it\'s an empty NTAG card\n• Try again multiple times if needed';
        } else if (e.toString().contains('Tag was lost') || e.toString().contains('card was moved away')) {
          errorMessage = 'The card was moved away during writing.\n\nKeep the card steady on the device until completion.';
        } else if (e.toString().contains('Not enough space')) {
          errorMessage = 'Card full or not supported.\n\nUse an empty NTAG card (NTAG213/215/216).';
        } else if (e.toString().contains('NDEF')) {
          errorMessage = 'Card not supported.\n\nUse a standard NTAG card (NTAG213/215/216).';
        }
        
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(errorMessage),
              backgroundColor: Colors.red,
              duration: const Duration(seconds: 8),
              action: SnackBarAction(
                label: 'Retry',
                textColor: Colors.white,
                onPressed: () => _writeCard(context),
              ),
            ),
          );
        }
        
        await FlutterNfcKit.finish(iosAlertMessage: '❌ NFC writing error');
      }
    } catch (e) {
      debugPrint('❌ ERROR during operation:');
      debugPrint('Error type: ${e.runtimeType}');
      debugPrint('Message: $e');
      
      String errorMessage = 'Unknown error';
      
      if (e.toString().contains('NFC not available')) {
        errorMessage = 'NFC not available on this device';
      } else if (e.toString().contains('User cancelled')) {
        errorMessage = 'Operation cancelled by user';
      } else if (e.toString().contains('Timeout')) {
        errorMessage = 'Timeout: no card detected';
      } else if (e.toString().contains('Communication error')) {
        errorMessage = 'Communication error with the card';
      } else if (e.toString().contains('NDEF')) {
        errorMessage = 'Card not supported. Use a standard NTAG card.';
      } else {
        errorMessage = 'Error: $e';
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
    } finally {
      // Reset loading state
      if (mounted) {
        setState(() {
          _isWritingCard = false;
        });
      }
    }
  }

  Future<void> _writeMerchantCard(BuildContext context) async {
    if (!_nfcAvailable) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('NFC not available on this device'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    // Set loading state
    setState(() {
      _isWritingMerchantCard = true;
    });

    try {
      debugPrint('Starting merchant card writing...');
      debugPrint('Waiting for an NFC card...');
      
      // 1. Read the NFC chip
      final tag = await FlutterNfcKit.poll();
      debugPrint('Card detected!');
      debugPrint('Tag type: ${tag.type}');
      debugPrint('UID: ${tag.id}');

      // Check if the tag supports NDEF
      if (tag.ndefAvailable == false) {
        throw Exception('This card does not support NDEF');
      }

      // Check if the tag is writable
      if (tag.ndefWritable == false) {
        throw Exception('This card is read-only');
      }

      // 2. Create the merchant-specific link
      final cardUrl = 'https://app.retapcard.com/m/${widget.merchantId}';
      debugPrint('Merchant link generated: $cardUrl');

      // 3. Write the link to the chip in NDEF format
      try {
        final uriRecord = ndef.UriRecord.fromUri(Uri.parse(cardUrl));
        await FlutterNfcKit.writeNDEFRecords([uriRecord]);
        debugPrint('Link written to chip successfully');

        // 4. Lock the chip in read-only mode (if supported)
        if (tag.type == NFCTagType.iso15693) {
          try {
            await FlutterNfcKit.finish(iosAlertMessage: 'Chip locked in read-only mode');
            debugPrint('Chip locked in read-only mode');
          } catch (e) {
            debugPrint('Unable to lock chip: $e');
          }
        }

        // 5. Show success message
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Merchant card programmed successfully'),
              backgroundColor: Colors.green,
            ),
          );
        }

        await FlutterNfcKit.finish(iosAlertMessage: 'Done!');
        debugPrint('Operation completed successfully!');
      } catch (e) {
        debugPrint('ERROR during NFC writing:');
        debugPrint('Error type: ${e.runtimeType}');
        debugPrint('Message: $e');
        
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('NFC writing error: $e'),
              backgroundColor: Colors.orange,
              duration: const Duration(seconds: 5),
            ),
          );
        }
        
        await FlutterNfcKit.finish(iosAlertMessage: 'NFC writing error');
      }
    } catch (e) {
      debugPrint('ERROR during operation:');
      debugPrint('Error type: ${e.runtimeType}');
      debugPrint('Message: $e');
      
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
      
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(errorMessage),
            backgroundColor: Colors.red,
          ),
        );
      }
      
      await FlutterNfcKit.finish(iosAlertMessage: errorMessage);
    } finally {
      // Reset loading state
      if (mounted) {
        setState(() {
          _isWritingMerchantCard = false;
        });
      }
    }
  }

  Future<void> _initializeNfc() async {
    await _checkNfcAvailability();
    if (_nfcAvailable) {
      debugPrint('✅ NFC available, starting polling...');
      _startPolling();
    } else {
      debugPrint('❌ NFC not available');
    }
  }

  @override
  Widget build(BuildContext context) {
    final screenWidth = MediaQuery.of(context).size.width;
    final buttonSize = (screenWidth - 96) / 2; // 2 columns with padding
    
    return Scaffold(
      appBar: AppBar(
        title: Text('ReTap POS - ${widget.merchantName}'),
        backgroundColor: Theme.of(context).colorScheme.primary,
        foregroundColor: Colors.white,
      ),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            // NFC status indicator
            if (!_nfcAvailable)
              Container(
                padding: const EdgeInsets.all(16),
                margin: const EdgeInsets.only(bottom: 16),
                decoration: BoxDecoration(
                  color: Colors.red.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.red),
                ),
                child: Row(
                  children: [
                    Icon(Icons.wifi_off, color: Colors.red, size: 24),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        'NFC not available on this device',
                        style: TextStyle(color: Colors.red, fontSize: 16),
                      ),
                    ),
                  ],
                ),
              ),
            
            // NFC polling status indicator
            if (_nfcAvailable)
              Container(
                padding: const EdgeInsets.all(16),
                margin: const EdgeInsets.only(bottom: 16),
                decoration: BoxDecoration(
                  color: Colors.green.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.green),
                ),
                child: Row(
                  children: [
                    Icon(
                      _isPolling ? Icons.nfc : Icons.wifi_off,
                      color: _isPolling ? Colors.green : Colors.orange,
                      size: 24,
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        _isPolling 
                          ? 'NFC active - Waiting for cards...'
                          : 'NFC available but not active',
                        style: TextStyle(
                          color: _isPolling ? Colors.green : Colors.orange,
                          fontSize: 16,
                        ),
                      ),
                    ),
                    if (!_isPolling)
                      IconButton(
                        icon: Icon(Icons.refresh, color: Colors.blue, size: 24),
                        onPressed: () {
                          debugPrint('🔄 Manual NFC polling restart...');
                          _startPolling();
                        },
                        tooltip: 'Restart NFC',
                      ),
                  ],
                ),
              ),
            
            // Main title
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(20),
              margin: const EdgeInsets.only(bottom: 24),
              decoration: BoxDecoration(
                color: Theme.of(context).colorScheme.primary.withOpacity(0.1),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Column(
                children: [
                  Icon(
                    Icons.touch_app,
                    size: 48,
                    color: Theme.of(context).colorScheme.primary,
                  ),
                  const SizedBox(height: 12),
                  Text(
                    'Select an action',
                    style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                      fontWeight: FontWeight.bold,
                      color: Theme.of(context).colorScheme.primary,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            ),
            
            // Main buttons grid
            Expanded(
              child: GridView.count(
                crossAxisCount: 2,
                crossAxisSpacing: 16,
                mainAxisSpacing: 16,
                childAspectRatio: 1.0, // Restored for 4 buttons
                children: [
                  // Button 1: QR Scanner
                  _buildActionButton(
                    icon: Icons.qr_code_scanner,
                    title: 'QR Scanner',
                    subtitle: 'Wallet',
                    color: Colors.green,
                    onTap: () {
                      // Pre-load scanner to speed up opening
                      Navigator.of(context).push(
                        MaterialPageRoute(
                          builder: (context) => QRScannerScreen(merchantId: widget.merchantId),
                        ),
                      );
                    },
                  ),
                  
                  // Button 2: Program customer card
                  _buildActionButton(
                    icon: _isWritingCard ? Icons.hourglass_empty : Icons.person_add,
                    title: _isWritingCard ? 'Writing...' : 'New Card',
                    subtitle: _isWritingCard ? 'Please wait' : 'Customer',
                    color: _isWritingCard ? Colors.blue : Colors.orange,
                    onTap: (_nfcAvailable && !_isWritingCard) ? () => _writeCard(context) : null,
                    disabled: !_nfcAvailable || _isWritingCard,
                    isLoading: _isWritingCard,
                  ),
                  
                  // Button 3: Lost card
                  _buildActionButton(
                    icon: Icons.find_replace,
                    title: 'Lost Card',
                    subtitle: 'Replacement',
                    color: Colors.red,
                    onTap: () {
                      Navigator.of(context).push(
                        MaterialPageRoute(
                          builder: (context) => LostCardReplacementScreen(
                            merchantId: widget.merchantId,
                            merchantName: widget.merchantName,
                          ),
                        ),
                      );
                    },
                  ),
                  
                  // Button 4: Program merchant card
                  _buildActionButton(
                    icon: _isWritingMerchantCard ? Icons.hourglass_empty : Icons.store,
                    title: _isWritingMerchantCard ? 'Writing...' : 'Store Card',
                    subtitle: _isWritingMerchantCard ? 'Please wait' : 'Promotions',
                    color: _isWritingMerchantCard ? Colors.blue : Colors.purple,
                    onTap: (_nfcAvailable && !_isWritingMerchantCard) ? () => _writeMerchantCard(context) : null,
                    disabled: !_nfcAvailable || _isWritingMerchantCard,
                    isLoading: _isWritingMerchantCard,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildActionButton({
    required IconData icon,
    required String title,
    required String subtitle,
    required Color color,
    required VoidCallback? onTap,
    bool disabled = false,
    bool isLoading = false,
  }) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: disabled ? null : onTap,
        borderRadius: BorderRadius.circular(16),
        child: Container(
          decoration: BoxDecoration(
            color: disabled ? Colors.grey.withOpacity(0.3) : (isLoading ? Colors.blue.withOpacity(0.2) : color.withOpacity(0.1)),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: disabled ? Colors.grey : (isLoading ? Colors.blue : color.withOpacity(0.3)),
              width: isLoading ? 3 : 2,
            ),
            boxShadow: disabled ? null : [
              BoxShadow(
                color: (isLoading ? Colors.blue : color).withOpacity(0.3),
                blurRadius: isLoading ? 12 : 8,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              if (isLoading)
                SizedBox(
                  width: 48,
                  height: 48,
                  child: CircularProgressIndicator(
                    strokeWidth: 3,
                    valueColor: AlwaysStoppedAnimation<Color>(Colors.blue),
                  ),
                )
              else
                Icon(
                  icon,
                  size: 48,
                  color: disabled ? Colors.grey : color,
                ),
              const SizedBox(height: 12),
              Text(
                title,
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: disabled ? Colors.grey : (isLoading ? Colors.blue : color),
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 4),
              Text(
                subtitle,
                style: TextStyle(
                  fontSize: 14,
                  color: disabled ? Colors.grey : (isLoading ? Colors.blue.withOpacity(0.8) : color.withOpacity(0.8)),
                ),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      ),
    );
  }
} 