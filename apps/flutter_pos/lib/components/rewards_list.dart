import 'package:flutter/material.dart';
import '../models/reward.dart';
import '../services/api_service.dart';
import '../models/card.dart';
import '../components/skeleton_components.dart';

class RewardsList extends StatefulWidget {
  final String merchantId;
  final int userPoints;
  final bool compactMode;
  final String? cardId;
  final CardModel? card;
  final Function(int)? onPointsUpdated;
  final VoidCallback? onRewardRedeemed;

  const RewardsList({
    super.key,
    required this.merchantId,
    required this.userPoints,
    this.compactMode = false,
    this.cardId,
    this.card,
    this.onPointsUpdated,
    this.onRewardRedeemed,
  });

  @override
  State<RewardsList> createState() => _RewardsListState();
}

class _RewardsListState extends State<RewardsList> {
  bool _isLoading = true;
  List<Reward> _rewards = [];
  String? _error;
  int _userPoints = 0;
  bool _isRedeeming = false;

  @override
  void initState() {
    super.initState();
    _userPoints = widget.userPoints;
    // Carica in background per non bloccare l'UI
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _fetchRewards();
    });
  }

  @override
  void didUpdateWidget(RewardsList oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.userPoints != widget.userPoints) {
      setState(() => _userPoints = widget.userPoints);
    }
  }

  Future<void> _fetchRewards() async {
    if (!mounted) return;
    
    try {
      debugPrint('🔄 Iniziando fetch rewards per merchant: ${widget.merchantId}');
      setState(() {
        _isLoading = true;
        _error = null;
      });

      // Chiamata diretta all'API con timeout ridotto
      debugPrint('🌐 Fetching rewards da API...');
      List<Reward> rewards;
      
      // Se abbiamo un cardId, usiamo l'endpoint completo per ottenere anche i checkpoint
      if (widget.cardId != null) {
        debugPrint('📋 Usando endpoint completo con cardId: ${widget.cardId}');
        final rewardsData = await ApiService.get(
          '/rewards-and-checkpoints',
          merchantId: widget.merchantId,
          queryParams: {'merchantId': widget.merchantId, if (widget.cardId != null) 'cardId': widget.cardId!},
        ).timeout(const Duration(seconds: 5));
        debugPrint('📦 Risposta API rewards: ${rewardsData['rewards']?.length ?? 0} rewards trovati');
        rewards = (rewardsData['rewards'] as List?)?.map((r) => Reward.fromJson(r)).toList() ?? [];
      } else {
        debugPrint('📋 Usando endpoint solo rewards');
        // Fallback: chiamata diretta per solo rewards
        final data = await ApiService.fetchRewards(widget.merchantId).timeout(const Duration(seconds: 5));
        debugPrint('📦 Risposta API rewards: ${data.length} rewards trovati');
        rewards = data.map((r) => Reward.fromJson(r)).toList();
      }
      
      if (!mounted) return;
      
      debugPrint('✅ Rewards caricati con successo: ${rewards.length} rewards');
      setState(() {
        _rewards = rewards;
        _isLoading = false;
      });
    } catch (e) {
      debugPrint('❌ Errore durante fetch rewards: $e');
      if (!mounted) return;
      
      setState(() {
        _error = 'Errore: $e';
        _isLoading = false;
      });
    }
  }

  Future<void> _redeemReward(Reward reward) async {
    if (widget.card == null || widget.card!.customerId == null || _isRedeeming) {
      if (!_isRedeeming) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Carta o cliente non trovato'),
            backgroundColor: Colors.red,
          ),
        );
      }
      return;
    }

    try {
      setState(() => _isRedeeming = true);

      await ApiService.redeemReward(
        merchantId: widget.merchantId,
        customerId: widget.card!.customerId!,
        rewardId: reward.id,
        pointsSpent: reward.priceCoins,
      );

      if (!mounted) return;

      // Aggiorna i punti dopo il riscatto
      final newPoints = _userPoints - reward.priceCoins;
      
      setState(() {
        _userPoints = newPoints;
        _isRedeeming = false;
      });

      // Notifica il parent component del cambiamento dei punti
      widget.onPointsUpdated?.call(newPoints);
      
      // Notifica che un reward è stato riscattato per aggiornare la history
      widget.onRewardRedeemed?.call();

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Premio ${reward.name} riscattato con successo!'),
          backgroundColor: const Color(0xFFFF6565),
        ),
      );
    } catch (e) {
      if (!mounted) return;
      setState(() => _isRedeeming = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Errore nel riscatto del premio: $e'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return SkeletonComponents.buildRewardsSkeleton();
    }

    if (_error != null) {
      return Container(
        width: double.infinity,
        margin: const EdgeInsets.symmetric(vertical: 12),
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: const Color(0xFFFF6565).withOpacity(0.05),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: const Color(0xFFFF6565).withOpacity(0.2), width: 1),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.error, size: 48, color: const Color(0xFFFF6565)),
            const SizedBox(height: 16),
            Text(
              _error!,
              style: const TextStyle(color: Color(0xFFFF6565), fontSize: 16, fontWeight: FontWeight.bold),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            ElevatedButton.icon(
              onPressed: _fetchRewards,
              icon: const Icon(Icons.refresh),
              label: const Text('Retry'),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFFF6565),
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
              ),
            ),
          ],
        ),
      );
    }

    if (_rewards.isEmpty) {
      return Container(
        width: double.infinity,
        margin: const EdgeInsets.symmetric(vertical: 12),
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: const Color(0xFFFF6565).withOpacity(0.05),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: const Color(0xFFFF6565).withOpacity(0.2), width: 1),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.card_giftcard_outlined, size: 48, color: const Color(0xFFFF6565).withOpacity(0.6)),
            const SizedBox(height: 16),
            Text(
              'No rewards available',
              style: const TextStyle(
                color: Color(0xFFFF6565),
                fontWeight: FontWeight.bold,
                fontSize: 16,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Rewards will appear here when configured.',
              style: TextStyle(
                color: const Color(0xFFFF6565).withOpacity(0.6),
                fontSize: 13,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      );
    }

    return Container(
      width: double.infinity,
      margin: const EdgeInsets.symmetric(vertical: 12),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: const Color(0xFFFF6565).withOpacity(0.05),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFFF6565).withOpacity(0.2), width: 1),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          // Header con titolo
          Row(
            children: [
              Icon(Icons.card_giftcard, color: const Color(0xFFFF6565), size: 24),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  'Rewards',
                  style: const TextStyle(
                    color: Color(0xFFFF6565),
                    fontWeight: FontWeight.bold,
                    fontSize: 18,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          SizedBox(
            height: 180,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              itemCount: _rewards.length,
              itemBuilder: (context, index) {
                final reward = _rewards[index];
                final canRedeem = _userPoints >= reward.priceCoins && !_isRedeeming;
                return Container(
                  width: 260,
                  margin: const EdgeInsets.only(right: 16),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color: canRedeem ? const Color(0xFFFF6565) : const Color(0xFFFF6565).withOpacity(0.3),
                      width: 2,
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: const Color(0xFFFF6565).withOpacity(0.08),
                        blurRadius: 8,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: Padding(
                    padding: const EdgeInsets.all(20),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Expanded(
                              child: Text(
                                reward.name,
                                style: const TextStyle(
                                  fontWeight: FontWeight.bold,
                                  fontSize: 15,
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                              decoration: BoxDecoration(
                                color: canRedeem ? const Color(0xFFFF6565) : const Color(0xFFFF6565).withOpacity(0.3),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Icon(
                                    Icons.star,
                                    size: 15,
                                    color: canRedeem ? Colors.white : const Color(0xFFFF6565),
                                  ),
                                  const SizedBox(width: 4),
                                  Text(
                                    '${reward.priceCoins}',
                                    style: TextStyle(
                                      fontSize: 13,
                                      fontWeight: FontWeight.bold,
                                      color: canRedeem ? Colors.white : const Color(0xFFFF6565),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 6),
                        Text(
                          reward.description,
                          style: TextStyle(
                            fontSize: 13,
                            color: const Color(0xFFFF6565).withOpacity(0.7),
                          ),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const Spacer(),
                        if (canRedeem)
                          SizedBox(
                            width: double.infinity,
                            height: 48,
                            child: ElevatedButton.icon(
                              onPressed: _isRedeeming ? null : () => _redeemReward(reward),
                              icon: const Icon(Icons.card_giftcard, size: 20),
                              label: const Text('Redeem', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: const Color(0xFFFF6565),
                                foregroundColor: Colors.white,
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                padding: const EdgeInsets.symmetric(vertical: 12),
                              ),
                            ),
                          )
                        else
                          Container(
                            width: double.infinity,
                            alignment: Alignment.center,
                            padding: const EdgeInsets.symmetric(vertical: 8),
                            decoration: BoxDecoration(
                              color: _userPoints < reward.priceCoins ? Colors.grey[200] : const Color(0xFFFF6565).withOpacity(0.3),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Text(
                              _userPoints < reward.priceCoins ? 'Not enough points' : 'Already redeemed',
                              style: TextStyle(
                                color: _userPoints < reward.priceCoins ? Colors.grey[600] : const Color(0xFFFF6565),
                                fontWeight: FontWeight.bold,
                                fontSize: 13,
                              ),
                            ),
                          ),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
