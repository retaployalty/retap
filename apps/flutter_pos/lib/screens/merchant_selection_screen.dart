import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../theme/app_theme.dart';
import '../theme/text_styles.dart';
import 'main_screen.dart';
import '../services/merchant_service.dart';

class MerchantSelectionScreen extends StatefulWidget {
  const MerchantSelectionScreen({super.key});

  @override
  State<MerchantSelectionScreen> createState() => _MerchantSelectionScreenState();
}

class _MerchantSelectionScreenState extends State<MerchantSelectionScreen> {
  List<Map<String, dynamic>> _merchants = [];
  bool _isLoading = true;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _loadMerchants();
  }

  Future<void> _loadMerchants() async {
    try {
      final user = Supabase.instance.client.auth.currentUser;
      if (user == null) {
        throw Exception('User not authenticated');
      }

      final response = await Supabase.instance.client
          .from('merchants')
          .select()
          .eq('profile_id', user.id)
          .order('name');

      setState(() {
        _merchants = List<Map<String, dynamic>>.from(response);
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _errorMessage = e.toString();
        _isLoading = false;
      });
    }
  }

  Future<void> _selectMerchant(String merchantId, String merchantName) async {
    debugPrint('Saving merchant: $merchantId - $merchantName');
    // Salva il merchant selezionato
    await MerchantService.saveSelectedMerchant(merchantId, merchantName);
    
    // Verifica che sia stato salvato correttamente
    final savedMerchant = await MerchantService.getSelectedMerchant();
    debugPrint('Saved merchant verification: ${savedMerchant['id']} - ${savedMerchant['name']}');
    
    if (!mounted) return;

    final user = Supabase.instance.client.auth.currentUser;
    if (user == null) {
      throw Exception('User not authenticated');
    }

    // Naviga alla main screen
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(
        builder: (context) => MainScreen(
          customerId: user.id,
          merchantId: merchantId,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text(
          'Select Merchant',
          style: AppTextStyles.titleLarge,
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () async {
              await Supabase.instance.client.auth.signOut();
              await MerchantService.clearSelectedMerchant();
              if (!mounted) return;
              Navigator.of(context).pushReplacementNamed('/login');
            },
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _errorMessage != null
              ? Center(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          'Error loading merchants',
                          style: AppTextStyles.titleMedium.copyWith(
                            color: Colors.red,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          _errorMessage!,
                          style: AppTextStyles.bodyMedium.copyWith(
                            color: AppColors.textSecondary,
                          ),
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 16),
                        ElevatedButton(
                          onPressed: _loadMerchants,
                          child: const Text('Retry'),
                        ),
                      ],
                    ),
                  ),
                )
              : _merchants.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(
                            'No merchants found',
                            style: AppTextStyles.titleMedium.copyWith(
                              color: AppColors.textSecondary,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            'Please contact support to add your merchant account',
                            style: AppTextStyles.bodyMedium.copyWith(
                              color: AppColors.textSecondary,
                            ),
                            textAlign: TextAlign.center,
                          ),
                        ],
                      ),
                    )
                  : ListView.builder(
                      padding: const EdgeInsets.all(16),
                      itemCount: _merchants.length,
                      itemBuilder: (context, index) {
                        final merchant = _merchants[index];
                        return Card(
                          margin: const EdgeInsets.only(bottom: 12),
                          child: ListTile(
                            contentPadding: const EdgeInsets.all(16),
                            title: Text(
                              merchant['name'] ?? 'Unnamed Merchant',
                              style: AppTextStyles.titleMedium,
                            ),
                            subtitle: Text(
                              merchant['industry'] ?? 'No industry specified',
                              style: AppTextStyles.bodyMedium.copyWith(
                                color: AppColors.textSecondary,
                              ),
                            ),
                            trailing: const Icon(Icons.chevron_right),
                            onTap: () => _selectMerchant(
                              merchant['id'],
                              merchant['name'],
                            ),
                          ),
                        );
                      },
                    ),
    );
  }
} 