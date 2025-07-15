import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import '../theme/app_theme.dart';
import '../theme/text_styles.dart';
import '../shared_utils/business_hours.dart';

class BusinessListCard extends StatelessWidget {
  final String name;
  final String? industry;
  final String? address;
  final String imageUrl;
  final Map<String, dynamic>? openingHours;
  final List<dynamic>? rewards;
  final List<dynamic>? checkpointOffers;
  final String? distance;
  final VoidCallback? onTap;

  const BusinessListCard({
    Key? key,
    required this.name,
    this.industry,
    this.address,
    required this.imageUrl,
    this.openingHours,
    this.rewards,
    this.checkpointOffers,
    this.distance,
    this.onTap,
  }) : super(key: key);

  bool get isOpen => isBusinessOpen(openingHours);

  int get totalPointsRewards => rewards?.where((r) => r['is_active'] == true).length ?? 0;

  String get checkpointRewardTitle {
    if (checkpointOffers == null || checkpointOffers!.isEmpty) return 'No Checkpoint Rewards';
    
    final activeOffer = checkpointOffers!.firstWhere(
      (offer) => offer['is_active'] == true,
      orElse: () => checkpointOffers!.first,
    );
    
    return activeOffer['name'] ?? 'Checkpoint Reward';
  }

  int get totalCheckpointRewards {
    if (checkpointOffers == null || checkpointOffers!.isEmpty) return 0;
    return checkpointOffers!.where((offer) => offer['is_active'] == true).length;
  }

  // Trova il primo step con reward e il suo nome
  Map<String, dynamic> get firstCheckpointReward {
    if (checkpointOffers == null || checkpointOffers!.isEmpty) {
      return {'step': 0, 'name': 'No Rewards'};
    }
    
    // Trova il primo step che ha un reward (il primo in ordine di step_number)
    for (final offer in checkpointOffers!) {
      if (offer['steps'] != null) {
        final steps = offer['steps'] as List;
        // Ordina gli steps per step_number per prendere il primo
        steps.sort((a, b) => (a['step_number'] ?? 0).compareTo(b['step_number'] ?? 0));
        
        for (final step in steps) {
          if (step['reward_id'] != null && step['reward'] != null) {
            // Il reward è nella struttura step.reward
            final reward = step['reward'] as Map<String, dynamic>;
            final rewardName = reward['name'] ?? 'Reward';
            return {
              'step': step['step_number'] ?? 1,
              'name': rewardName
            };
          }
        }
      }
    }
    
    return {'step': 1, 'name': 'Reward'};
  }

  IconData get industryIcon {
    switch (industry?.toLowerCase()) {
      case 'gelateria':
        return Icons.icecream;
      case 'caffè':
      case 'caffe':
        return Icons.coffee;
      case 'ristorante':
        return Icons.restaurant;
      case 'pizzeria':
        return Icons.local_pizza;
      case 'bar':
        return Icons.local_bar;
      default:
        return Icons.store;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.08),
            blurRadius: 12,
            spreadRadius: 0,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: InkWell(
        borderRadius: BorderRadius.circular(24),
        onTap: onTap,
        child: Stack(
          children: [
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Cover Image
                ClipRRect(
                  borderRadius: const BorderRadius.only(
                    topLeft: Radius.circular(24),
                    topRight: Radius.circular(24),
                  ),
                  child: Image.network(
                    imageUrl,
                    height: 200,
                    width: double.infinity,
                    fit: BoxFit.cover,
                    errorBuilder: (context, error, stackTrace) => Container(
                      height: 200,
                      color: AppColors.primary.withOpacity(0.08),
                      child: const Center(child: Icon(Icons.store, color: AppColors.primary, size: 48)),
                    ),
                  ),
                ),
                // Business Info Section
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Business Name
                      Text(
                        name,
                        style: AppTextStyles.titleLarge.copyWith(
                          color: AppColors.textPrimary,
                          fontWeight: FontWeight.bold,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 8),
                      // Industry and Status Row
                      Row(
                        children: [
                          Icon(
                            industryIcon,
                            color: AppColors.textSecondary,
                            size: 16,
                          ),
                          const SizedBox(width: 6),
                          Text(
                            industry ?? 'Business',
                            style: AppTextStyles.bodyMedium.copyWith(
                              color: AppColors.textSecondary,
                            ),
                          ),
                          Container(
                            margin: const EdgeInsets.symmetric(horizontal: 8),
                            width: 4,
                            height: 4,
                            decoration: BoxDecoration(
                              color: AppColors.textSecondary,
                              shape: BoxShape.circle,
                            ),
                          ),
                          Text(
                            isOpen ? 'Open' : 'Closed',
                            style: AppTextStyles.bodyMedium.copyWith(
                              color: isOpen ? AppColors.success : AppColors.primary,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      // Rewards Section
                      Row(
                        children: [
                          // Checkpoint Rewards Pill
                          Expanded(
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(20),
                                border: Border.all(
                                  color: AppColors.textSecondary.withOpacity(0.3),
                                  width: 1,
                                ),
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Text(
                                    '${firstCheckpointReward['step']}/8',
                                    style: AppTextStyles.bodyLarge.copyWith(
                                      color: AppColors.primary,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                  const SizedBox(width: 4),
                                  Expanded(
                                    child: Text(
                                      '${firstCheckpointReward['name']}',
                                      style: AppTextStyles.bodyLarge.copyWith(
                                        color: AppColors.textPrimary,
                                        fontWeight: FontWeight.bold,
                                      ),
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                          const SizedBox(width: 12),
                          // Points Rewards Pill
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(20),
                              border: Border.all(
                                color: AppColors.textSecondary.withOpacity(0.3),
                                width: 1,
                              ),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                SvgPicture.asset(
                                  'assets/icons/mingcute_gift-fill.svg',
                                  width: 18,
                                  height: 18,
                                  colorFilter: ColorFilter.mode(
                                    AppColors.primary,
                                    BlendMode.srcIn,
                                  ),
                                ),
                                const SizedBox(width: 4),
                                Text(
                                  '$totalPointsRewards',
                                  style: AppTextStyles.bodyLarge.copyWith(
                                    color: AppColors.textPrimary,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
            // Distance Badge - positioned above everything
            if (distance != null)
              Positioned(
                top: 185,
                right: 16,
                child: Material(
                  elevation: 2,
                  borderRadius: BorderRadius.circular(20),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.location_on, color: AppColors.textSecondary, size: 18),
                        const SizedBox(width: 6),
                        Text(
                          distance!,
                          style: AppTextStyles.bodyMedium.copyWith(
                            color: AppColors.textSecondary,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
} 