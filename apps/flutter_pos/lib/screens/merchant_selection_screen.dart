import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'main_screen.dart';
import '../services/merchant_service.dart';

class MerchantSelectionScreen extends StatefulWidget {
  const MerchantSelectionScreen({super.key});

  @override
  State<MerchantSelectionScreen> createState() => _MerchantSelectionScreenState();
}

class _MerchantSelectionScreenState extends State<MerchantSelectionScreen> {
  bool _isLoading = true;
  String? _error;
  List<Map<String, dynamic>> _merchants = [];

  @override
  void initState() {
    super.initState();
    _loadMerchants();
  }

  Future<void> _loadMerchants() async {
    try {
      setState(() {
        _isLoading = true;
        _error = null;
      });

      final user = Supabase.instance.client.auth.currentUser;
      if (user == null) {
        throw Exception('Utente non autenticato');
      }

      final response = await Supabase.instance.client
          .from('merchants')
          .select()
          .eq('profile_id', user.id);

      setState(() {
        _merchants = List<Map<String, dynamic>>.from(response);
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  Future<void> _selectMerchant(String merchantId, String merchantName) async {
    // Salva il merchant selezionato
    await MerchantService.saveSelectedMerchant(merchantId, merchantName);
    
    if (!mounted) return;

    // Naviga alla main screen
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(
        builder: (context) => MainScreen(
          merchantId: merchantId,
          merchantName: merchantName,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Seleziona Negozio'),
        backgroundColor: Theme.of(context).colorScheme.primary,
        foregroundColor: Colors.white,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(child: Text('Errore: $_error'))
              : ListView.builder(
                  itemCount: _merchants.length,
                  itemBuilder: (context, index) {
                    final merchant = _merchants[index];
                    return ListTile(
                      title: Text(merchant['name']),
                      subtitle: Text(merchant['address']),
                      onTap: () => _selectMerchant(
                        merchant['id'],
                        merchant['name'],
                      ),
                    );
                  },
                ),
    );
  }
} 