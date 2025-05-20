import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'pos_home_page.dart';

class MerchantSelectionScreen extends StatefulWidget {
  const MerchantSelectionScreen({super.key});

  @override
  State<MerchantSelectionScreen> createState() => _MerchantSelectionScreenState();
}

class _MerchantSelectionScreenState extends State<MerchantSelectionScreen> {
  bool _isLoading = true;
  List<Map<String, dynamic>> _merchants = [];
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
        setState(() {
          _errorMessage = 'User not logged in';
          _isLoading = false;
        });
        return;
      }

      final response = await Supabase.instance.client
          .from('merchants')
          .select()
          .eq('profile_id', user.id);

      setState(() {
        _merchants = List<Map<String, dynamic>>.from(response);
        _isLoading = false;
      });
    } catch (error) {
      setState(() {
        _errorMessage = 'Error loading merchants';
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Select Business'),
        backgroundColor: Theme.of(context).colorScheme.primary,
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () async {
              await Supabase.instance.client.auth.signOut();
              if (mounted) {
                Navigator.of(context).pushReplacementNamed('/login');
              }
            },
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _errorMessage != null
              ? Center(child: Text(_errorMessage!, style: const TextStyle(color: Colors.red)))
              : _merchants.isEmpty
                  ? const Center(child: Text('No businesses found'))
                  : ListView.builder(
                      padding: const EdgeInsets.all(16),
                      itemCount: _merchants.length,
                      itemBuilder: (context, index) {
                        final merchant = _merchants[index];
                        return Card(
                          child: ListTile(
                            title: Text(merchant['name'] ?? 'Unnamed Business'),
                            subtitle: Text(merchant['industry'] ?? ''),
                            onTap: () {
                              Navigator.of(context).pushReplacement(
                                MaterialPageRoute(
                                  builder: (context) => POSHomePage(
                                    merchantId: merchant['id'],
                                    merchantName: merchant['name'],
                                  ),
                                ),
                              );
                            },
                          ),
                        );
                      },
                    ),
    );
  }
} 