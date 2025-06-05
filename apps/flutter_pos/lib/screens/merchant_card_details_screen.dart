import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

class MerchantCardDetailsScreen extends StatefulWidget {
  final String merchantId;
  final String cardId;

  const MerchantCardDetailsScreen({
    super.key,
    required this.merchantId,
    required this.cardId,
  });

  @override
  State<MerchantCardDetailsScreen> createState() => _MerchantCardDetailsScreenState();
}

class _MerchantCardDetailsScreenState extends State<MerchantCardDetailsScreen> {
  bool _isLoading = true;
  Map<String, dynamic>? _merchantData;
  int _balance = 0;
  int _currentStep = 0;
  List<dynamic> _rewards = [];
  List<dynamic> _checkpointOffers = [];

  @override
  void initState() {
    super.initState();
    _loadMerchantDetails();
  }

  Future<void> _loadMerchantDetails() async {
    try {
      final url = Uri.parse('https://egmizgydnmvpfpbzmbnj.supabase.co/functions/v1/api/merchant-details?merchantId=${widget.merchantId}&cardId=${widget.cardId}');
      final response = await http.get(url);

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        setState(() {
          _merchantData = data['merchant'];
          _balance = data['balance'] ?? 0;
          _currentStep = data['currentStep'] ?? 0;
          _rewards = data['merchant']['rewards'] ?? [];
          _checkpointOffers = data['merchant']['checkpoint_offers'] ?? [];
          _isLoading = false;
        });
      } else {
        throw Exception('Failed to load merchant details');
      }
    } catch (e) {
      setState(() {
        _isLoading = false;
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Errore nel caricamento dei dettagli: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(
        body: Center(
          child: CircularProgressIndicator(),
        ),
      );
    }

    if (_merchantData == null) {
      return const Scaffold(
        body: Center(
          child: Text('Nessun dato disponibile'),
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: Text(_merchantData!['name'] ?? 'Dettagli Negozio'),
        backgroundColor: Theme.of(context).colorScheme.primary,
        foregroundColor: Colors.white,
      ),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header con logo e indirizzo
            Container(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  if (_merchantData!['logo_url'] != null)
                    ClipRRect(
                      borderRadius: BorderRadius.circular(8),
                      child: Image.network(
                        _merchantData!['logo_url'],
                        width: 80,
                        height: 80,
                        fit: BoxFit.cover,
                        errorBuilder: (context, error, stackTrace) {
                          return Container(
                            width: 80,
                            height: 80,
                            color: Colors.grey[300],
                            child: const Icon(Icons.store, size: 40),
                          );
                        },
                      ),
                    ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          _merchantData!['name'] ?? '',
                          style: Theme.of(context).textTheme.titleLarge,
                        ),
                        if (_merchantData!['address'] != null)
                          Text(
                            _merchantData!['address'],
                            style: Theme.of(context).textTheme.bodyMedium,
                          ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            // Saldo punti
            Container(
              padding: const EdgeInsets.all(16),
              color: Theme.of(context).colorScheme.primary.withOpacity(0.1),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'I tuoi punti',
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                  Text(
                    '$_balance',
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      color: Theme.of(context).colorScheme.primary,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            ),

            // Rewards
            if (_rewards.isNotEmpty) ...[
              Padding(
                padding: const EdgeInsets.all(16),
                child: Text(
                  'Rewards disponibili',
                  style: Theme.of(context).textTheme.titleMedium,
                ),
              ),
              ListView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: _rewards.length,
                itemBuilder: (context, index) {
                  final reward = _rewards[index];
                  return ListTile(
                    leading: reward['image_path'] != null
                        ? Image.network(
                            reward['image_path'],
                            width: 40,
                            height: 40,
                            fit: BoxFit.cover,
                            errorBuilder: (context, error, stackTrace) {
                              return const Icon(Icons.card_giftcard);
                            },
                          )
                        : const Icon(Icons.card_giftcard),
                    title: Text(reward['name'] ?? ''),
                    subtitle: Text(reward['description'] ?? ''),
                    trailing: Text(
                      '${reward['price_coins']} punti',
                      style: TextStyle(
                        color: Theme.of(context).colorScheme.primary,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  );
                },
              ),
            ],

            // Checkpoint offers
            if (_checkpointOffers.isNotEmpty) ...[
              Padding(
                padding: const EdgeInsets.all(16),
                child: Text(
                  'Checkpoint',
                  style: Theme.of(context).textTheme.titleMedium,
                ),
              ),
              ListView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: _checkpointOffers.length,
                itemBuilder: (context, index) {
                  final offer = _checkpointOffers[index];
                  return Card(
                    margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            offer['name'] ?? '',
                            style: Theme.of(context).textTheme.titleMedium,
                          ),
                          if (offer['description'] != null)
                            Padding(
                              padding: const EdgeInsets.only(top: 8),
                              child: Text(offer['description']),
                            ),
                          const SizedBox(height: 16),
                          LinearProgressIndicator(
                            value: _currentStep / (offer['total_steps'] ?? 1),
                            backgroundColor: Colors.grey[300],
                            valueColor: AlwaysStoppedAnimation<Color>(
                              Theme.of(context).colorScheme.primary,
                            ),
                          ),
                          Padding(
                            padding: const EdgeInsets.only(top: 8),
                            child: Text(
                              'Step $_currentStep di ${offer['total_steps']}',
                              style: Theme.of(context).textTheme.bodySmall,
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),
            ],
          ],
        ),
      ),
    );
  }
} 