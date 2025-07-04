import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:html' as html;
import 'package:flutter/services.dart';
import 'dart:convert';
import 'dart:io' show Platform;
import 'package:universal_html/html.dart' as universal_html;
import '../theme/app_theme.dart';
import '../theme/text_styles.dart';
import '../shared_utils/google_wallet_service.dart';
import '../shared_utils/apple_wallet_service.dart';
import '../shared_utils/platform_detector.dart';
import '../components/wallet_status_card.dart';

class RegistrationScreen extends StatefulWidget {
  const RegistrationScreen({super.key});

  @override
  State<RegistrationScreen> createState() => _RegistrationScreenState();
}

class _RegistrationScreenState extends State<RegistrationScreen> with SingleTickerProviderStateMixin {
  int _currentStep = 0;
  final _formKey = GlobalKey<FormState>();
  late AnimationController _animationController;
  late Animation<double> _fadeAnimation;
  late Animation<Offset> _slideAnimation;
  bool _isLoading = false;
  String? _error;
  String? _cardId;
  String? _customerId;
  
  // Form fields
  final _firstNameController = TextEditingController();
  final _lastNameController = TextEditingController();
  final _phoneController = TextEditingController();

  // Supabase client
  final _supabase = Supabase.instance.client;

  bool _showInstallGuide = false;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 500),
    );
    _fadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _animationController,
        curve: Curves.easeInOut,
      ),
    );
    _slideAnimation = Tween<Offset>(
      begin: const Offset(0.5, 0.0),
      end: Offset.zero,
    ).animate(
      CurvedAnimation(
        parent: _animationController,
        curve: Curves.easeInOut,
      ),
    );
    _animationController.forward();
    _extractCardIdAndLoad();
    // Redirect to home if app is running in standalone mode (PWA from home)
    WidgetsBinding.instance.addPostFrameCallback((_) {
      try {
        // ignore: undefined_prefixed_name
        final isStandalone = html.window.matchMedia('(display-mode: standalone)').matches;
        if (isStandalone) {
          context.go('/');
        }
      } catch (_) {}
    });
  }

  Future<void> _extractCardIdAndLoad() async {
    // Prima prova a estrarre l'ID dall'URL
    final uri = Uri.base;
    final segments = uri.pathSegments;
    String? urlCardId;
    
    if (segments.isNotEmpty && segments.first == 'c' && segments.length > 1) {
      urlCardId = segments[1];
    } else if (segments.isNotEmpty && segments.last.isNotEmpty) {
      urlCardId = segments.last;
    }
    
    // Ottieni le SharedPreferences
    final prefs = await SharedPreferences.getInstance();
    
    // Se abbiamo trovato un ID nell'URL, lo salviamo nelle preferences
    if (urlCardId != null && urlCardId.isNotEmpty) {
      _cardId = urlCardId;
      await prefs.setString('retap_card_id', urlCardId);
    } 
    // Altrimenti, proviamo a recuperarlo dalle preferences
    else {
      _cardId = prefs.getString('retap_card_id');
    }
    
    // Se abbiamo un cardId valido, carichiamo i dati del cliente
    if (_cardId != null && _cardId!.isNotEmpty) {
      await _loadCustomerData();
    } else {
      setState(() {
        _error = "Card ID not found in URL";
      });
    }
  }

  Future<void> _loadCustomerData() async {
    try {
      // Prima otteniamo l'ID del cliente dalla carta
      final cardResponse = await _supabase
          .from('cards')
          .select('customer_id')
          .eq('id', _cardId!)
          .maybeSingle();

      if (cardResponse == null) {
        throw Exception('Card not found');
      }

      _customerId = cardResponse['customer_id'] as String;

      // Poi otteniamo i dati del cliente
      final customerResponse = await _supabase
          .from('customers')
          .select('first_name, last_name, phone_number')
          .eq('id', _customerId!)
          .maybeSingle();

      if (customerResponse == null) {
        throw Exception('Customer not found');
      }

      // Popoliamo i campi del form con i dati esistenti
      setState(() {
        _firstNameController.text = customerResponse['first_name'] as String? ?? '';
        _lastNameController.text = customerResponse['last_name'] as String? ?? '';
        _phoneController.text = customerResponse['phone_number'] as String? ?? '';
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
      });
    }
  }

  Future<void> _updateCustomerData() async {
    if (!_formKey.currentState!.validate()) return;
    if (_customerId == null) {
      setState(() {
        _error = "Customer ID not found";
      });
      return;
    }

    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final response = await _supabase
          .from('customers')
          .update({
            'first_name': _firstNameController.text,
            'last_name': _lastNameController.text,
            'phone_number': _phoneController.text,
          })
          .eq('id', _customerId!)
          .select()
          .single();

      if (response == null) {
        throw Exception('Error updating profile');
      }

      _nextStep();
    } catch (e) {
      setState(() {
        _error = e.toString();
      });
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  @override
  void dispose() {
    _animationController.dispose();
    _firstNameController.dispose();
    _lastNameController.dispose();
    _phoneController.dispose();
    super.dispose();
  }

  void _nextStep() {
    if (_currentStep < 2) {
      _animationController.reverse().then((_) {
        setState(() {
          _currentStep += 1;
        });
        _animationController.forward();
      });
    } else {
      // Complete registration
      context.go('/');
    }
  }

  void _previousStep() {
    if (_currentStep > 0) {
      _animationController.reverse().then((_) {
        setState(() {
          _currentStep -= 1;
        });
        _animationController.forward();
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Column(
          children: [
            // Progress indicator
            Container(
              height: 4,
              margin: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(2),
                child: LinearProgressIndicator(
                  value: (_currentStep + 1) / 3,
                  backgroundColor: const Color(0xFFF5F5F5),
                  valueColor: const AlwaysStoppedAnimation<Color>(Color(0xFFFF6565)),
                ),
              ),
            ),
            if (_error != null)
              Container(
                margin: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: const Color(0xFFFF6565).withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.error_outline, color: Color(0xFFFF6565)),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        _error!,
                        style: const TextStyle(
                          color: Color(0xFFFF6565),
                          fontSize: 14,
                          fontFamily: 'Fredoka',
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            Expanded(
              child: FadeTransition(
                opacity: _fadeAnimation,
                child: SlideTransition(
                  position: _slideAnimation,
                  child: _buildCurrentStep(),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCurrentStep() {
    switch (_currentStep) {
      case 0:
        return _buildPersonalInfoStep();
      case 1:
        return _buildWalletStep();
      case 2:
        return _buildPwaStep();
      default:
        return const SizedBox.shrink();
    }
  }

  Widget _buildPersonalInfoStep() {
    return Column(
      children: [
        Expanded(
          child: SingleChildScrollView(
            child: Padding(
              padding: const EdgeInsets.all(24.0),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(24),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF5F5F5),
                        borderRadius: BorderRadius.circular(33),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.05),
                            blurRadius: 8,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: Column(
                        children: [
                          const Text(
                            'Personal Information',
                            style: TextStyle(
                              fontSize: 24,
                              fontFamily: 'Fredoka',
                              fontWeight: FontWeight.w600,
                              color: Color(0xFF1A1A1A),
                            ),
                            textAlign: TextAlign.center,
                          ),
                          const SizedBox(height: 32),
                          _buildTextField(
                            controller: _firstNameController,
                            label: 'First Name',
                            icon: Icons.person_outline,
                            validator: (value) {
                              if (value == null || value.isEmpty) {
                                return 'Please enter your first name';
                              }
                              return null;
                            },
                          ),
                          const SizedBox(height: 16),
                          _buildTextField(
                            controller: _lastNameController,
                            label: 'Last Name',
                            icon: Icons.person_outline,
                            validator: (value) {
                              if (value == null || value.isEmpty) {
                                return 'Please enter your last name';
                              }
                              return null;
                            },
                          ),
                          const SizedBox(height: 16),
                          _buildTextField(
                            controller: _phoneController,
                            label: 'Phone Number',
                            icon: Icons.phone_outlined,
                            keyboardType: TextInputType.number,
                            inputFormatters: [
                              FilteringTextInputFormatter.digitsOnly,
                            ],
                            validator: (value) {
                              if (value == null || value.isEmpty) {
                                return 'Please enter your phone number';
                              }
                              if (value.length < 10 || value.length > 11) {
                                return 'The number must be 10 or 11 digits';
                              }
                              if (!value.startsWith('3')) {
                                return 'The number must start with 3';
                              }
                              return null;
                            },
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
        Container(
          padding: const EdgeInsets.all(24.0),
          child: SizedBox(
            width: double.infinity,
            height: 56,
            child: ElevatedButton(
              onPressed: _isLoading ? null : _updateCustomerData,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFFF6565),
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(28),
                ),
                elevation: 0,
              ),
              child: _isLoading
                  ? const SizedBox(
                      height: 20,
                      width: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                      ),
                    )
                  : const Text(
                      'Continue',
                      style: TextStyle(
                        fontSize: 16,
                        fontFamily: 'Fredoka',
                        fontWeight: FontWeight.w600,
                      ),
                    ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String label,
    required IconData icon,
    TextInputType? keyboardType,
    List<TextInputFormatter>? inputFormatters,
    String? Function(String?)? validator,
  }) {
    return TextFormField(
      controller: controller,
      decoration: InputDecoration(
        labelText: label,
        labelStyle: const TextStyle(
          color: Color(0xFF1A1A1A),
          fontSize: 16,
          fontFamily: 'Fredoka',
        ),
        prefixIcon: Icon(icon, color: const Color(0xFFFF6565)),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: Color(0xFFE6E6E6)),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: Color(0xFFE6E6E6)),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: Color(0xFFFF6565)),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: Color(0xFFFF6565)),
        ),
        filled: true,
        fillColor: Colors.white,
      ),
      keyboardType: keyboardType,
      inputFormatters: inputFormatters,
      validator: validator,
    );
  }

  Widget _buildWalletStep() {
    return Column(
      children: [
        Expanded(
          child: Center(
            child: SingleChildScrollView(
              child: Padding(
                padding: const EdgeInsets.all(24.0),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Container(
                      width: 200,
                      height: 200,
                      decoration: BoxDecoration(
                        color: const Color(0xFFFF6565).withOpacity(0.1),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(
                        Icons.phone_android,
                        size: 100,
                        color: Color(0xFFFF6565),
                      ),
                    ),
                    const SizedBox(height: 48),
                    const Text(
                      'Add to Wallet',
                      style: TextStyle(
                        fontSize: 28,
                        fontFamily: 'Fredoka',
                        fontWeight: FontWeight.w600,
                        color: Color(0xFF1A1A1A),
                      ),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 16),
                    const Text(
                      'Add your ReTap card to your device digital wallet',
                      style: TextStyle(
                        fontSize: 16,
                        fontFamily: 'Fredoka',
                        color: Color(0xFF666666),
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
        Container(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            children: [
              SizedBox(
                width: double.infinity,
                height: 56,
                child: ElevatedButton.icon(
                  onPressed: _addToWallet,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFFFF6565),
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(28),
                    ),
                    elevation: 0,
                  ),
                  icon: const Icon(Icons.add_to_home_screen, size: 24),
                  label: const Text(
                    'Add to Wallet',
                    style: TextStyle(
                      fontSize: 16,
                      fontFamily: 'Fredoka',
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              TextButton(
                onPressed: _previousStep,
                style: TextButton.styleFrom(
                  foregroundColor: const Color(0xFF666666),
                ),
                child: const Text(
                  'Back',
                  style: TextStyle(
                    fontSize: 16,
                    fontFamily: 'Fredoka',
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildInstallGuide() {
    return Stack(
      children: [
        // Overlay scuro
        Positioned.fill(
          child: Container(
            color: Colors.black.withOpacity(0.7),
          ),
        ),
        // Guida di installazione
        Center(
          child: Container(
            margin: const EdgeInsets.all(24),
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(
                  Icons.phone_iphone,
                  size: 48,
                  color: Color(0xFFFF6565),
                ),
                const SizedBox(height: 24),
                const Text(
                  'How to install ReTap',
                  style: TextStyle(
                    fontSize: 20,
                    fontFamily: 'Fredoka',
                    fontWeight: FontWeight.w600,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 16),
                const Text(
                  '1. Tap the share icon\n2. Select "Add to Home"\n3. Confirm installation',
                  style: TextStyle(
                    fontSize: 16,
                    fontFamily: 'Fredoka',
                    color: Color(0xFF666666),
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 24),
                SizedBox(
                  width: double.infinity,
                  height: 48,
                  child: ElevatedButton(
                    onPressed: () {
                      setState(() {
                        _showInstallGuide = false;
                      });
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFFFF6565),
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(24),
                      ),
                      elevation: 0,
                    ),
                    child: const Text(
                      'Got it',
                      style: TextStyle(
                        fontSize: 16,
                        fontFamily: 'Fredoka',
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildPwaStep() {
    return Stack(
      children: [
        Column(
          children: [
            Expanded(
              child: Center(
                child: SingleChildScrollView(
                  child: Padding(
                    padding: const EdgeInsets.all(24.0),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Container(
                          width: 200,
                          height: 200,
                          decoration: BoxDecoration(
                            color: const Color(0xFFFF6565).withOpacity(0.1),
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(
                            Icons.add_to_home_screen,
                            size: 100,
                            color: Color(0xFFFF6565),
                          ),
                        ),
                        const SizedBox(height: 48),
                        const Text(
                          'Install App',
                          style: TextStyle(
                            fontSize: 28,
                            fontFamily: 'Fredoka',
                            fontWeight: FontWeight.w600,
                            color: Color(0xFF1A1A1A),
                          ),
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 16),
                        const Text(
                          'Add ReTap to your Home screen for quick access',
                          style: TextStyle(
                            fontSize: 16,
                            fontFamily: 'Fredoka',
                            color: Color(0xFF666666),
                          ),
                          textAlign: TextAlign.center,
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
            Container(
              padding: const EdgeInsets.all(24.0),
              child: Column(
                children: [
                  SizedBox(
                    width: double.infinity,
                    height: 56,
                    child: ElevatedButton.icon(
                      onPressed: () async {
                        try {
                          // Verifica se l'app è già installata
                          if (html.window.matchMedia('(display-mode: standalone)').matches) {
                            _nextStep();
                            return;
                          }

                          // Verifica se il browser supporta l'API di installazione
                          final beforeInstallPrompt = html.window.localStorage['beforeinstallprompt'];
                          if (beforeInstallPrompt != null) {
                            // Mostra il prompt di installazione
                            html.window.dispatchEvent(html.Event('beforeinstallprompt'));
                            
                            // Aspetta un momento per dare tempo al prompt di apparire
                            await Future.delayed(const Duration(milliseconds: 500));
                            
                            // Procedi al prossimo step
                            _nextStep();
                          } else {
                            // Se non possiamo installare automaticamente, mostra la guida
                            setState(() {
                              _showInstallGuide = true;
                            });
                          }
                        } catch (e) {
                          // In caso di errore, mostra la guida
                          setState(() {
                            _showInstallGuide = true;
                          });
                        }
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFFFF6565),
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(28),
                        ),
                        elevation: 0,
                      ),
                      icon: const Icon(Icons.add_to_home_screen, size: 24),
                      label: const Text(
                        'Add to Home',
                        style: TextStyle(
                          fontSize: 16,
                          fontFamily: 'Fredoka',
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  SizedBox(
                    width: double.infinity,
                    height: 56,
                    child: ElevatedButton(
                      onPressed: _nextStep,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.white,
                        foregroundColor: const Color(0xFF666666),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(28),
                          side: const BorderSide(color: Color(0xFFDDDDDD)),
                        ),
                        elevation: 0,
                      ),
                      child: const Text(
                        'Continue',
                        style: TextStyle(
                          fontSize: 16,
                          fontFamily: 'Fredoka',
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  TextButton(
                    onPressed: _previousStep,
                    style: TextButton.styleFrom(
                      foregroundColor: const Color(0xFF666666),
                    ),
                    child: const Text(
                      'Back',
                      style: TextStyle(
                        fontSize: 16,
                        fontFamily: 'Fredoka',
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
        if (_showInstallGuide) _buildInstallGuide(),
      ],
    );
  }

  Future<void> _addToWallet() async {
    try {
      print('🚀 Inizio _addToWallet');
      
      if (_cardId == null) {
        throw Exception('Card ID not found');
      }

      print('📋 Card ID: $_cardId');

      // Get card details from Supabase
      final cardResponse = await _supabase
          .from('cards')
          .select('customer_id, uid')
          .eq('id', _cardId!)
          .single();

      final customerResponse = await _supabase
          .from('customers')
          .select('first_name, last_name')
          .eq('id', cardResponse['customer_id'])
          .single();

      final customerName = '${customerResponse['first_name']} ${customerResponse['last_name']}';
      final cardUid = cardResponse['uid'];

      print('👤 Customer Name: $customerName');
      print('🆔 Card UID: $cardUid');

      // Usa il nuovo PlatformDetector
      final isApplePlatform = PlatformDetector.isApplePlatform;
      final platformName = PlatformDetector.platformName;
      
      print('🖥️  Piattaforma rilevata: $platformName');
      print('🍎 È piattaforma Apple: $isApplePlatform');
      print('👛 Tipo wallet: ${PlatformDetector.walletType}');

      if (isApplePlatform) {
        print('🍎 Avvio generazione Apple Wallet...');
        // Crea il pass per Apple Wallet
        await AppleWalletService.createPass(
          cardId: _cardId!,
          customerName: customerName,
          cardUid: cardUid,
        );
        print('✅ Apple Wallet completato');
      } else {
        print('🤖 Avvio generazione Google Wallet...');
        // Crea il pass per Google Wallet
        final saveUrl = await GoogleWalletService.createLoyaltyCard(
          cardId: _cardId!,
          customerName: customerName,
          cardUid: cardUid,
        );

        print('🔗 Google Wallet URL: $saveUrl');
      // Apri l'URL in una nuova tab
      html.window.open(saveUrl, '_blank');
        print('✅ Google Wallet completato');
      }

      // Mostra messaggio di successo
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(isApplePlatform 
              ? 'Apple Wallet pass successfully downloaded. Open the file to add it to your Wallet.'
              : 'Card successfully added to Google Wallet'
            ),
            backgroundColor: Colors.green,
            duration: const Duration(seconds: 5),
          ),
        );
      }

      // Procedi al prossimo step
      _nextStep();
    } catch (e) {
      print('❌ Errore nell\'aggiunta al wallet: $e');
      setState(() {
        _error = e.toString();
      });
      
      // Mostra messaggio di errore
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error adding to wallet: ${e.toString()}'),
            backgroundColor: Colors.red,
            duration: const Duration(seconds: 5),
          ),
        );
      }
    }
  }
} 