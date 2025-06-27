import 'package:flutter/material.dart';
import '../theme/app_theme.dart';
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
  String get formattedHours => getTodayOpeningHours(openingHours);

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
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Cover Image with Gradient Overlay
            Stack(
              children: [
                ClipRRect(
                  borderRadius: const BorderRadius.only(
                    topLeft: Radius.circular(24),
                    topRight: Radius.circular(24),
                  ),
                  child: Image.network(
                    imageUrl,
                    height: 180,
                    width: double.infinity,
                    fit: BoxFit.cover,
                    errorBuilder: (context, error, stackTrace) => Container(
                      height: 180,
                      color: AppColors.primary.withOpacity(0.08),
                      child: const Center(child: Icon(Icons.store, color: AppColors.primary, size: 48)),
                    ),
                  ),
                ),
                // Status Badge
                Positioned(
                  top: 16,
                  right: 16,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      // Open/Closed Badge
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: isOpen ? Colors.white : const Color(0xFFFF4B4B),
                          borderRadius: BorderRadius.circular(20),
                          boxShadow: [
                            BoxShadow(
                              color: isOpen 
                                ? Colors.black.withOpacity(0.15)
                                : const Color(0xFFFF4B4B).withOpacity(0.3),
                              blurRadius: 8,
                              offset: const Offset(0, 2),
                            ),
                          ],
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Container(
                              width: 6,
                              height: 6,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                color: isOpen ? const Color(0xFF4CAF50) : Colors.white,
                              ),
                            ),
                            const SizedBox(width: 6),
                            Text(
                              isOpen ? 'Open' : 'Closed',
                              style: TextStyle(
                                color: isOpen ? const Color(0xFF4CAF50) : Colors.white,
                                fontSize: 13,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                // Business Name Overlay
                Positioned(
                  bottom: 0,
                  left: 0,
                  right: 0,
                  child: Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [
                          Colors.transparent,
                          Colors.black.withOpacity(0.8),
                        ],
                      ),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          name,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 22,
                            fontWeight: FontWeight.bold,
                            shadows: [
                              Shadow(
                                offset: Offset(0, 1),
                                blurRadius: 3,
                                color: Colors.black45,
                              ),
                            ],
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        if (industry != null) ...[
                          const SizedBox(height: 4),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                            decoration: BoxDecoration(
                              color: AppColors.primary.withOpacity(0.9),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Text(
                              industry!,
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 12,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                ),
              ],
            ),
            // Business Info
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Hours and Distance
                  if (formattedHours.isNotEmpty)
                    Row(
                      children: [
                        Expanded(
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                            decoration: BoxDecoration(
                              color: Colors.grey[50],
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: Colors.grey[200]!, width: 1),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Container(
                                  padding: const EdgeInsets.all(6),
                                  decoration: BoxDecoration(
                                    color: Colors.grey[100],
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: Icon(Icons.access_time, color: Colors.grey[600], size: 14),
                                ),
                                const SizedBox(width: 8),
                                Text(
                                  formattedHours,
                                  style: TextStyle(
                                    color: Colors.grey[700],
                                    fontSize: 13,
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                        if (distance != null) ...[
                          const SizedBox(width: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                            decoration: BoxDecoration(
                              color: Colors.grey[50],
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: Colors.grey[200]!, width: 1),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Container(
                                  padding: const EdgeInsets.all(6),
                                  decoration: BoxDecoration(
                                    color: Colors.grey[100],
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: Icon(Icons.location_on, color: Colors.grey[600], size: 14),
                                ),
                                const SizedBox(width: 8),
                                Text(
                                  distance!,
                                  style: TextStyle(
                                    color: Colors.grey[700],
                                    fontSize: 13,
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ],
                    ),
                  const SizedBox(height: 16),
                  // Rewards Section
                  Row(
                    children: [
                      // Checkpoint Reward
                      Expanded(
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                          decoration: BoxDecoration(
                            color: Colors.grey[50],
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: Colors.grey[200]!, width: 1),
                          ),
                          child: Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.all(6),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFFF6565).withOpacity(0.1),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: const Icon(Icons.card_giftcard, color: Color(0xFFFF6565), size: 16),
                              ),
                              const SizedBox(width: 10),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      'Checkpoint Reward',
                                      style: TextStyle(
                                        color: Colors.grey[600],
                                        fontSize: 11,
                                        fontWeight: FontWeight.w500,
                                      ),
                                    ),
                                    const SizedBox(height: 2),
                                    Text(
                                      checkpointRewardTitle,
                                      style: const TextStyle(
                                        color: Color(0xFFFF6565),
                                        fontSize: 13,
                                        fontWeight: FontWeight.w600,
                                      ),
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      // Points Rewards
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                        decoration: BoxDecoration(
                          color: Colors.grey[50],
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: Colors.grey[200]!, width: 1),
                        ),
                        child: Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(6),
                              decoration: BoxDecoration(
                                color: AppColors.primary.withOpacity(0.1),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Icon(Icons.stars, color: AppColors.primary, size: 16),
                            ),
                            const SizedBox(width: 10),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Points Rewards',
                                  style: TextStyle(
                                    color: Colors.grey[600],
                                    fontSize: 11,
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  '$totalPointsRewards available',
                                  style: TextStyle(
                                    color: AppColors.primary,
                                    fontSize: 13,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ],
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
      ),
    );
  }
} 