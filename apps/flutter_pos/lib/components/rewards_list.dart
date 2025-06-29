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

  const RewardsList({
    super.key,
    required this.merchantId,
    required this.userPoints,
    this.compactMode = false,
    this.cardId,
    this.card,
    this.onPointsUpdated,
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

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Premio ${reward.name} riscattato con successo!'),
          backgroundColor: Colors.green,
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
      return Card(
        elevation: 2,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        ),
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            children: [
              Icon(Icons.error, size: 48, color: Colors.red[300]),
              const SizedBox(height: 16),
              Text(
                _error!,
                style: TextStyle(color: Colors.red, fontSize: 16),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: _fetchRewards,
                child: const Text('Riprova'),
              ),
            ],
          ),
        ),
      );
    }

    if (_rewards.isEmpty) {
      return Card(
        elevation: 2,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        ),
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Row(
                children: [
                  Icon(
                    Icons.stars,
                    color: Theme.of(context).colorScheme.primary,
                    size: 24,
                  ),
                  const SizedBox(width: 8),
                  Text(
                    'Premi Disponibili',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const Spacer(),
                  if (_error != null)
                    IconButton(
                      onPressed: _fetchRewards,
                      icon: const Icon(Icons.refresh),
                      tooltip: 'Ricarica premi',
                    ),
                ],
              ),
              const SizedBox(height: 16),
              Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      Icons.card_giftcard_outlined,
                      size: 48,
                      color: Theme.of(context).colorScheme.primary.withOpacity(0.5),
                    ),
                    const SizedBox(height: 16),
                    Text(
                      'Nessun premio disponibile',
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        color: Theme.of(context).colorScheme.primary.withOpacity(0.5),
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'I premi verranno mostrati qui quando saranno configurati.',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: Theme.of(context).colorScheme.onSurface.withOpacity(0.6),
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      );
    }

    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Row(
              children: [
                Icon(
                  Icons.stars,
                  color: Theme.of(context).colorScheme.primary,
                  size: 24,
                ),
                const SizedBox(width: 8),
                Text(
                  '$_userPoints punti disponibili',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: Theme.of(context).colorScheme.primary,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            SizedBox(
              height: 120,
              child: ListView.builder(
                scrollDirection: Axis.horizontal,
                itemCount: _rewards.length,
                itemBuilder: (context, index) {
                  final reward = _rewards[index];
                  final canRedeem = _userPoints >= reward.priceCoins && !_isRedeeming;
                  
                  return Container(
                    width: 200,
                    margin: const EdgeInsets.only(right: 12),
                    decoration: BoxDecoration(
                      color: canRedeem
                          ? Theme.of(context).colorScheme.primary.withOpacity(0.1)
                          : Theme.of(context).colorScheme.surface,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(
                        color: canRedeem
                            ? Theme.of(context).colorScheme.primary
                            : Theme.of(context).colorScheme.outline.withOpacity(0.1),
                      ),
                    ),
                    child: Padding(
                      padding: const EdgeInsets.all(12),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Expanded(
                                child: Text(
                                  reward.name,
                                  style: const TextStyle(
                                    fontWeight: FontWeight.bold,
                                    fontSize: 14,
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                decoration: BoxDecoration(
                                  color: canRedeem
                                      ? Theme.of(context).colorScheme.primary
                                      : Theme.of(context).colorScheme.outline.withOpacity(0.2),
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Icon(
                                      Icons.star,
                                      size: 14,
                                      color: canRedeem ? Colors.white : Theme.of(context).colorScheme.onSurface,
                                    ),
                                    const SizedBox(width: 4),
                                    Text(
                                      '${reward.priceCoins}',
                                      style: TextStyle(
                                        fontSize: 12,
                                        fontWeight: FontWeight.bold,
                                        color: canRedeem ? Colors.white : Theme.of(context).colorScheme.onSurface,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 4),
                          Text(
                            reward.description,
                            style: TextStyle(
                              fontSize: 12,
                              color: Theme.of(context).colorScheme.onSurface.withOpacity(0.7),
                            ),
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                          const Spacer(),
                          if (canRedeem)
                            SizedBox(
                              width: double.infinity,
                              child: ElevatedButton(
                                onPressed: _isRedeeming ? null : () => _redeemReward(reward),
                                style: ElevatedButton.styleFrom(
                                  padding: const EdgeInsets.symmetric(vertical: 8),
                                  backgroundColor: Theme.of(context).colorScheme.primary,
                                  foregroundColor: Colors.white,
                                ),
                                child: const Text('Riscatta'),
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
      ),
    );
  }
}
