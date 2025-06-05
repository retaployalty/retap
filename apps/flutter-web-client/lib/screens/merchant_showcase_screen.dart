import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import '../theme/app_theme.dart';
import '../theme/text_styles.dart';
import '../shared_utils/business_hours.dart';

class MerchantShowcaseScreen extends StatefulWidget {
  final String merchantId;

  const MerchantShowcaseScreen({
    super.key,
    required this.merchantId,
  });

  @override
  State<MerchantShowcaseScreen> createState() => _MerchantShowcaseScreenState();
}

class _MerchantShowcaseScreenState extends State<MerchantShowcaseScreen> {
  bool _isLoading = true;
  String? _error;
  Map<String, dynamic>? _merchantData;

  @override
  void initState() {
    super.initState();
    _loadMerchantData();
  }

  Future<void> _loadMerchantData() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final response = await http.get(
        Uri.parse('https://egmizgydnmvpfpbzmbnj.supabase.co/functions/v1/api/merchant-details?merchantId=${widget.merchantId}'),
      );

      if (response.statusCode != 200) {
        throw Exception('Errore nel recupero dei dati del merchant: ${response.statusCode} - ${response.body}');
      }

      final data = jsonDecode(response.body);
      setState(() {
        _merchantData = data['merchant'];
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  String? _getCoverImageUrl(dynamic coverImageUrl) {
    if (coverImageUrl == null) return null;
    if (coverImageUrl is String) return coverImageUrl;
    if (coverImageUrl is List && coverImageUrl.isNotEmpty) {
      return coverImageUrl.first.toString();
    }
    return null;
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    if (_error != null || _merchantData == null) {
      return Scaffold(
        body: Center(
          child: Text(
            _error ?? 'Dati del merchant non disponibili',
            style: const TextStyle(color: Colors.red),
          ),
        ),
      );
    }

    final merchant = _merchantData!;
    final name = merchant['name'] ?? '';
    final industry = merchant['industry'] ?? '';
    final address = merchant['address'] ?? '';
    final logoUrl = merchant['logo_url'];
    final coverImageUrl = _getCoverImageUrl(merchant['cover_image_url']);
    final hours = merchant['hours'];
    final isOpen = isBusinessOpen(hours);
    final rewards = merchant['rewards'] ?? [];
    final checkpointOffers = merchant['checkpoint_offers'] ?? [];

    return Scaffold(
      body: CustomScrollView(
        slivers: [
          // App Bar con immagine di copertina
          SliverAppBar(
            expandedHeight: 200,
            pinned: true,
            flexibleSpace: FlexibleSpaceBar(
              background: coverImageUrl != null
                  ? Image.network(
                      coverImageUrl,
                      fit: BoxFit.cover,
                      errorBuilder: (context, error, stackTrace) {
                        return Container(
                          color: Theme.of(context).colorScheme.primary,
                        );
                      },
                    )
                  : Container(
                      color: Theme.of(context).colorScheme.primary,
                    ),
            ),
          ),
          // Contenuto principale
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Logo e nome
                  Row(
                    children: [
                      if (logoUrl != null)
                        CircleAvatar(
                          radius: 30,
                          backgroundImage: NetworkImage(logoUrl),
                        ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              name,
                              style: AppTextStyles.headlineMedium,
                            ),
                            Text(
                              industry,
                              style: AppTextStyles.bodyLarge.copyWith(
                                color: Colors.grey[600],
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),
                  // Indirizzo e stato
                  Row(
                    children: [
                      const Icon(Icons.location_on, color: Colors.grey),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          address,
                          style: AppTextStyles.bodyLarge,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Icon(
                        isOpen ? Icons.circle : Icons.circle_outlined,
                        color: isOpen ? Colors.green : Colors.red,
                        size: 16,
                      ),
                      const SizedBox(width: 8),
                      Text(
                        isOpen ? 'Aperto' : 'Chiuso',
                        style: AppTextStyles.bodyLarge.copyWith(
                          color: isOpen ? Colors.green : Colors.red,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 32),
                  // Rewards
                  if (rewards.isNotEmpty) ...[
                    Text(
                      'Rewards disponibili',
                      style: AppTextStyles.titleLarge,
                    ),
                    const SizedBox(height: 16),
                    ListView.builder(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      itemCount: rewards.length,
                      itemBuilder: (context, index) {
                        final reward = rewards[index];
                        return Card(
                          child: ListTile(
                            leading: reward['image_path'] != null
                                ? Image.network(
                                    reward['image_path'],
                                    width: 50,
                                    height: 50,
                                    fit: BoxFit.cover,
                                  )
                                : const Icon(Icons.card_giftcard),
                            title: Text(reward['name'] ?? ''),
                            subtitle: Text(reward['description'] ?? ''),
                            trailing: Text(
                              '${reward['price_coins']} punti',
                              style: const TextStyle(
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        );
                      },
                    ),
                  ],
                  const SizedBox(height: 32),
                  // Checkpoint offers
                  if (checkpointOffers.isNotEmpty) ...[
                    Text(
                      'Checkpoint offers',
                      style: AppTextStyles.titleLarge,
                    ),
                    const SizedBox(height: 16),
                    ListView.builder(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      itemCount: checkpointOffers.length,
                      itemBuilder: (context, index) {
                        final offer = checkpointOffers[index];
                        return Card(
                          child: Padding(
                            padding: const EdgeInsets.all(16),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  offer['name'] ?? '',
                                  style: AppTextStyles.titleMedium,
                                ),
                                const SizedBox(height: 8),
                                Text(offer['description'] ?? ''),
                                const SizedBox(height: 16),
                                LinearProgressIndicator(
                                  value: 0,
                                  backgroundColor: Colors.grey[200],
                                  valueColor: AlwaysStoppedAnimation<Color>(
                                    Theme.of(context).colorScheme.primary,
                                  ),
                                ),
                                const SizedBox(height: 8),
                                Text(
                                  '0/${offer['total_steps']} passi completati',
                                  style: AppTextStyles.bodySmall,
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
          ),
        ],
      ),
    );
  }
} 