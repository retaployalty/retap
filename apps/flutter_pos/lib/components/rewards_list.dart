import 'package:flutter/material.dart';
import '../models/reward.dart';
import '../services/reward_service.dart';

class RewardsList extends StatefulWidget {
  final String merchantId;
  final int? userPoints; // opzionale, per mostrare saldo punti

  const RewardsList({
    super.key,
    required this.merchantId,
    this.userPoints,
  });

  @override
  State<RewardsList> createState() => _RewardsListState();
}

class _RewardsListState extends State<RewardsList> {
  bool _isLoading = true;
  List<Reward> _rewards = [];
  String? _error;

  @override
  void initState() {
    super.initState();
    _fetchRewards();
  }

  Future<void> _fetchRewards() async {
    try {
      final rewards = await RewardService.fetchRewards(widget.merchantId);
      setState(() {
        _rewards = rewards;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = 'Errore: $e';
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final Color accent = const Color(0xFFEB6E63); // rosso salmone
    final double cardWidth = 180;
    final double cardHeight = 240;
    final int userPoints = widget.userPoints ?? 100; // fallback demo

    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_error != null) {
      return Center(
        child: Text(
          _error!,
          style: const TextStyle(color: Colors.red),
        ),
      );
    }

    if (_rewards.isEmpty) {
      return const Center(
        child: Text('Nessun premio disponibile'),
      );
    }

    return Container(
      decoration: BoxDecoration(
        color: accent,
        borderRadius: BorderRadius.circular(32),
      ),
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Reward',
                style: TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                  fontSize: 26,
                  letterSpacing: 1.2,
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.3),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Row(
                  children: [
                    Text(
                      '$userPoints',
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                        fontSize: 20,
                      ),
                    ),
                    const SizedBox(width: 4),
                    const Icon(Icons.attach_money, color: Colors.white, size: 20),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          SizedBox(
            height: cardHeight,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: _rewards.length,
              separatorBuilder: (_, __) => const SizedBox(width: 16),
              itemBuilder: (context, index) {
                final reward = _rewards[index];
                final bool locked = userPoints < reward.priceCoins;
                return Container(
                  width: cardWidth,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(28),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      Expanded(
                        child: Stack(
                          alignment: Alignment.center,
                          children: [
                            ClipRRect(
                              borderRadius: const BorderRadius.only(
                                topLeft: Radius.circular(28),
                                topRight: Radius.circular(28),
                              ),
                              child: (reward.imagePath != null && reward.imagePath!.isNotEmpty && !reward.imagePath!.toLowerCase().endsWith('.avif'))
                                ? Image.network(
                                    getImageUrl(reward.imagePath)!,
                                    width: cardWidth,
                                    height: cardWidth,
                                    fit: BoxFit.cover,
                                    errorBuilder: (context, error, stackTrace) => Icon(
                                      Icons.broken_image,
                                      size: 80,
                                      color: accent.withOpacity(0.5),
                                    ),
                                  )
                                : Icon(
                                    Icons.icecream,
                                    size: 80,
                                    color: accent.withOpacity(0.5),
                                  ),
                            ),
                            if (locked)
                              Container(
                                width: 56,
                                height: 56,
                                decoration: BoxDecoration(
                                  color: Colors.white.withOpacity(0.85),
                                  shape: BoxShape.circle,
                                  border: Border.all(color: Colors.black, width: 2),
                                ),
                                child: const Icon(Icons.lock, size: 32, color: Colors.black),
                              ),
                          ],
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: const BoxDecoration(
                          borderRadius: BorderRadius.only(
                            bottomLeft: Radius.circular(28),
                            bottomRight: Radius.circular(28),
                          ),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              reward.name,
                              style: const TextStyle(
                                fontWeight: FontWeight.bold,
                                fontSize: 16,
                              ),
                            ),
                            if (reward.description.isNotEmpty) ...[
                              const SizedBox(height: 4),
                              Text(
                                reward.description,
                                style: TextStyle(
                                  fontSize: 13,
                                  color: Colors.black.withOpacity(0.6),
                                ),
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ],
                            const SizedBox(height: 8),
                            Row(
                              children: [
                                Text(
                                  '${reward.priceCoins} ',
                                  style: const TextStyle(
                                    fontWeight: FontWeight.bold,
                                    fontSize: 16,
                                  ),
                                ),
                                const Icon(Icons.attach_money, size: 18),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  String? getImageUrl(String? imagePath) {
    if (imagePath == null || imagePath.isEmpty) return null;
    if (imagePath.startsWith('http')) return imagePath;
    // Sostituisci 'rewards' con il nome del tuo bucket se diverso
    return 'https://egmizgydnmvpfpbzmbnj.supabase.co/storage/v1/object/public/rewards/$imagePath';
  }
}
