import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:shared_preferences/shared_preferences.dart';

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
        _error = "Card ID non trovata nell'URL";
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
        throw Exception('Carta non trovata');
      }

      _customerId = cardResponse['customer_id'] as String;

      // Poi otteniamo i dati del cliente
      final customerResponse = await _supabase
          .from('customers')
          .select('first_name, last_name, phone_number')
          .eq('id', _customerId!)
          .maybeSingle();

      if (customerResponse == null) {
        throw Exception('Cliente non trovato');
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
        _error = "ID cliente non trovato";
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
        throw Exception('Errore durante l\'aggiornamento del profilo');
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
      appBar: AppBar(
        title: const Text('Completa il tuo profilo'),
        elevation: 0,
      ),
      body: Column(
        children: [
          // Progress indicator
          LinearProgressIndicator(
            value: (_currentStep + 1) / 3,
            backgroundColor: Colors.grey[200],
            valueColor: AlwaysStoppedAnimation<Color>(
              Theme.of(context).primaryColor,
            ),
          ),
          if (_error != null)
            Padding(
              padding: const EdgeInsets.all(16.0),
              child: Text(
                _error!,
                style: const TextStyle(color: Colors.red),
                textAlign: TextAlign.center,
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
    return Padding(
      padding: const EdgeInsets.all(24.0),
      child: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text(
              'Informazioni personali',
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 32),
            TextFormField(
              controller: _firstNameController,
              decoration: InputDecoration(
                labelText: 'Nome',
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                prefixIcon: const Icon(Icons.person_outline),
              ),
              validator: (value) {
                if (value == null || value.isEmpty) {
                  return 'Per favore inserisci il tuo nome';
                }
                return null;
              },
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _lastNameController,
              decoration: InputDecoration(
                labelText: 'Cognome',
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                prefixIcon: const Icon(Icons.person_outline),
              ),
              validator: (value) {
                if (value == null || value.isEmpty) {
                  return 'Per favore inserisci il tuo cognome';
                }
                return null;
              },
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _phoneController,
              decoration: InputDecoration(
                labelText: 'Numero di telefono',
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                prefixIcon: const Icon(Icons.phone_outlined),
              ),
              keyboardType: TextInputType.phone,
              validator: (value) {
                if (value == null || value.isEmpty) {
                  return 'Per favore inserisci il tuo numero di telefono';
                }
                return null;
              },
            ),
            const Spacer(),
            ElevatedButton(
              onPressed: _isLoading ? null : _updateCustomerData,
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              child: _isLoading
                  ? const SizedBox(
                      height: 20,
                      width: 20,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Text(
                      'Continua',
                      style: TextStyle(fontSize: 18),
                    ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildWalletStep() {
    return Center(
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
                  color: Colors.blue.withOpacity(0.1),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.phone_android,
                  size: 100,
                  color: Colors.blue,
                ),
              ),
              const SizedBox(height: 48),
              const Text(
                'Aggiungi al Wallet',
                style: TextStyle(
                  fontSize: 28,
                  fontWeight: FontWeight.bold,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 16),
              const Text(
                'Aggiungi la tua carta ReTap al wallet digitale del tuo dispositivo',
                style: TextStyle(
                  fontSize: 16,
                  color: Colors.grey,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 48),
              ElevatedButton.icon(
                onPressed: () {
                  // TODO: Implement wallet integration
                  _nextStep();
                },
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 32,
                    vertical: 16,
                  ),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                icon: const Icon(Icons.add_to_home_screen, size: 24),
                label: const Text(
                  'Aggiungi al Wallet',
                  style: TextStyle(fontSize: 18),
                ),
              ),
              const SizedBox(height: 16),
              TextButton(
                onPressed: _previousStep,
                child: const Text('Indietro'),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildPwaStep() {
    return Center(
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
                  color: Colors.blue.withOpacity(0.1),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.add_to_home_screen,
                  size: 100,
                  color: Colors.blue,
                ),
              ),
              const SizedBox(height: 48),
              const Text(
                'Installa App',
                style: TextStyle(
                  fontSize: 28,
                  fontWeight: FontWeight.bold,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 16),
              const Text(
                'Aggiungi ReTap alla schermata Home per un accesso rapido',
                style: TextStyle(
                  fontSize: 16,
                  color: Colors.grey,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 48),
              ElevatedButton.icon(
                onPressed: () {
                  // TODO: Implement PWA installation
                  _nextStep();
                },
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 32,
                    vertical: 16,
                  ),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                icon: const Icon(Icons.add_to_home_screen, size: 24),
                label: const Text(
                  'Aggiungi alla Home',
                  style: TextStyle(fontSize: 18),
                ),
              ),
              const SizedBox(height: 16),
              TextButton(
                onPressed: _previousStep,
                child: const Text('Indietro'),
              ),
            ],
          ),
        ),
      ),
    );
  }
} 