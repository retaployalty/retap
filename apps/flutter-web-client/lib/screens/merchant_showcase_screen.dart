import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import '../theme/app_theme.dart';
import '../theme/text_styles.dart';
import '../components/checkpoint_rewards_progress.dart';
import '../components/reward_list.dart';

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
  int _userPoints = 0;
  int _currentCheckpointStep = 0;
  bool _showCheck = false;

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
        _userPoints = data['balance'] ?? 0;
        _currentCheckpointStep = data['currentStep'] ?? 0;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
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
    final logoUrl = merchant['logo_url'];
    final rewards = merchant['rewards'] ?? [];
    final checkpointOffers = merchant['checkpoint_offers'] ?? [];

    // Converti i rewards nel formato richiesto da RewardList
    final rewardItems = rewards.map((r) => RewardItem(
      imageUrl: r['image_path'] ?? '',
      title: r['name'] ?? '',
      price: r['price_coins'] ?? 0,
    )).toList().cast<RewardItem>();

    // Converti i checkpoint offers nel formato richiesto
    final checkpointOfferItems = checkpointOffers
        .map((o) => CheckpointOffer.fromJson(o))
        .toList()
        .cast<CheckpointOffer>();

    return Scaffold(
      body: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16.0),
          child: Column(
            children: [
              // Header con logo e messaggio di benvenuto
              Container(
                padding: const EdgeInsets.symmetric(vertical: 8),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    if (logoUrl != null)
                      Stack(
                        alignment: Alignment.center,
                        children: [
                          Container(
                            width: 136,
                            height: 136,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              border: Border.all(color: Colors.black, width: 3),
                            ),
                          ),
                          Container(
                            width: 130,
                            height: 130,
                            color: Colors.transparent,
                          ),
                          CircleAvatar(
                            radius: 66,
                            backgroundColor: Colors.transparent,
                            child: ClipOval(
                              child: Image.network(
                                logoUrl,
                                fit: BoxFit.cover,
                                width: 124,
                                height: 124,
                              ),
                            ),
                          ),
                        ],
                      ),
                    const SizedBox(width: 24),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Riga "Hi, welcome"
                          Row(
                            crossAxisAlignment: CrossAxisAlignment.end,
                            children: [
                              Text(
                                'Hi, ',
                                style: AppTextStyles.headlineLarge.copyWith(
                                  color: AppColors.textPrimary,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                              Text(
                                'welcome',
                                style: AppTextStyles.headlineLarge.copyWith(
                                  color: const Color(0xFFFF6B6B),
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                            ],
                          ),
                          // Riga "da Nome!"
                          Text(
                            'da $name!',
                            style: AppTextStyles.headlineLarge.copyWith(
                              color: AppColors.textPrimary,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),

              // Checkpoint Progress
              if (checkpointOfferItems.isNotEmpty) ...[
                Padding(
                  padding: const EdgeInsets.only(top: 4.0, bottom: 4.0),
                  child: Builder(
                    builder: (context) {
                      final steps = checkpointOfferItems.first.steps;
                      final rewardSteps = steps
                          .where((step) => step.reward != null)
                          .map((step) => step.stepNumber)
                          .toList()
                          .cast<int>();

                      // Converti esplicitamente i reward labels in Map<int, String>
                      final rewardLabels = Map<int, String>.fromEntries(
                        steps
                            .where((step) => step.reward != null)
                            .map((step) => MapEntry<int, String>(
                                  step.stepNumber,
                                  step.reward?.name ?? 'Free Reward',
                                ))
                            .toList()
                            .cast<MapEntry<int, String>>(),
                      );

                      return CheckpointRewardsProgress(
                        currentStep: _currentCheckpointStep,
                        totalSteps: checkpointOfferItems.first.totalSteps,
                        rewardSteps: rewardSteps,
                        rewardLabels: rewardLabels,
                        offerName: checkpointOfferItems.first.name,
                        offerDescription: checkpointOfferItems.first.description,
                      );
                    },
                  ),
                ),
              ],

              // Rewards List
              if (rewardItems.isNotEmpty)
                Padding(
                  padding: const EdgeInsets.only(bottom: 6.0),
                  child: RewardList(
                    userPoints: _userPoints,
                    rewards: rewardItems,
                    checkpointOffers: checkpointOfferItems,
                    currentCheckpointStep: _currentCheckpointStep,
                  ),
                ),

              // Grande tasto in fondo
              const SizedBox(height: 8),
              SizedBox(
                width: double.infinity,
                child: AnimatedSwitcher(
                  duration: const Duration(milliseconds: 500),
                  transitionBuilder: (child, animation) => ScaleTransition(scale: animation, child: child),
                  child: _showCheck
                      ? SizedBox(
                          key: const ValueKey('check'),
                          height: 64,
                          width: double.infinity,
                          child: ElevatedButton(
                            onPressed: () {
                              showLoyaltyCardPopup(context);
                            },
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Color(0xFFFF6B6B),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(16),
                              ),
                              padding: EdgeInsets.zero,
                            ),
                            child: const Center(
                              child: Icon(Icons.check_circle, color: Colors.white, size: 38),
                            ),
                          ),
                        )
                      : SizedBox(
                          key: const ValueKey('redeem'),
                          height: 64,
                          width: double.infinity,
                          child: ElevatedButton(
                            onPressed: () {
                              showLoyaltyCardPopup(context);
                              setState(() {
                                _showCheck = true;
                              });
                            },
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Color(0xFFFF6B6B),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(16),
                              ),
                              textStyle: AppTextStyles.headlineMedium.copyWith(
                                color: Colors.white,
                                fontWeight: FontWeight.bold,
                              ),
                              padding: EdgeInsets.zero,
                            ),
                            child: const Center(
                              child: Text(
                                'Redeem rewards!',
                                style: TextStyle(
                                  color: Colors.white,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 24,
                                ),
                              ),
                            ),
                          ),
                        ),
              ),
          )],
          ),
        ),
      ),
    );
  }

  // Funzione helper per mostrare il popup persuasivo
  void showLoyaltyCardPopup(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) {
        return Dialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
          backgroundColor: Colors.white,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  decoration: const BoxDecoration(
                    color: Color(0xFFFFE0E0),
                    shape: BoxShape.circle,
                  ),
                  padding: const EdgeInsets.all(18),
                  child: Icon(Icons.card_giftcard, color: Color(0xFFFF6565), size: 48),
                ),
                const SizedBox(height: 24),
                Text(
                  'Get your FREE loyalty card!',
                  style: AppTextStyles.headlineMedium.copyWith(
                    color: Color(0xFFFF6565),
                    fontWeight: FontWeight.bold,
                    fontSize: 22,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 16),
                Text(
                  'Ask the business for your free loyalty card and start collecting points and exclusive rewards!',
                  style: AppTextStyles.bodyLarge.copyWith(
                    color: Color(0xFF222222),
                    fontWeight: FontWeight.w500,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 28),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () => Navigator.of(context).pop(),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFFFF6565),
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      padding: const EdgeInsets.symmetric(vertical: 14),
                    ),
                    child: const Text('OK', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
} 