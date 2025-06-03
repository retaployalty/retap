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
    this.onTap,
  }) : super(key: key);

  bool get isOpen => isBusinessOpen(openingHours);
  String get formattedHours => getTodayOpeningHours(openingHours);

  int get totalPointsRewards => rewards?.where((r) => r['is_active'] == true).length ?? 0;

  String get checkpointRewardTitle {
    if (checkpointOffers == null || checkpointOffers!.isEmpty) return 'No Checkpoint Rewards';
    
    // Prendi il primo checkpoint offer attivo
    final activeOffer = checkpointOffers!.firstWhere(
      (offer) => offer['is_active'] == true,
      orElse: () => checkpointOffers!.first,
    );
    
    return activeOffer['name'] ?? 'Checkpoint Reward';
  }

  int get totalCheckpointRewards {
    if (checkpointOffers == null || checkpointOffers!.isEmpty) return 0;
    
    // Conta i checkpoint offers attivi
    return checkpointOffers!.where((offer) => offer['is_active'] == true).length;
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: onTap,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Cover Image with Gradient Overlay
            Stack(
              children: [
                ClipRRect(
                  borderRadius: const BorderRadius.only(
                    topLeft: Radius.circular(16),
                    topRight: Radius.circular(16),
                  ),
                  child: Image.network(
                    imageUrl,
                    height: 160,
                    width: double.infinity,
                    fit: BoxFit.cover,
                    errorBuilder: (context, error, stackTrace) => Container(
                      height: 160,
                      color: AppColors.primary.withOpacity(0.08),
                      child: const Center(child: Icon(Icons.store, color: AppColors.primary, size: 48)),
                    ),
                  ),
                ),
                // Gradient Overlay
                Positioned.fill(
                  child: Container(
                    decoration: BoxDecoration(
                      borderRadius: const BorderRadius.only(
                        topLeft: Radius.circular(16),
                        topRight: Radius.circular(16),
                      ),
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [
                          Colors.transparent,
                          Colors.black.withOpacity(0.7),
                        ],
                      ),
                    ),
                  ),
                ),
                // Business Name and Status Overlay
                Positioned(
                  bottom: 16,
                  left: 16,
                  right: 16,
                  child: Row(
                    children: [
                      Expanded(
                        child: Text(
                          name,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 20,
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
                      ),
                    ],
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
                  // Hours and Status
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: isOpen ? Colors.green.withOpacity(0.1) : Colors.red.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Container(
                              width: 6,
                              height: 6,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                color: isOpen ? Colors.green : Colors.red,
                              ),
                            ),
                            const SizedBox(width: 4),
                            Text(
                              isOpen ? 'Open' : 'Closed',
                              style: TextStyle(
                                color: isOpen ? Colors.green : Colors.red,
                                fontSize: 12,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ],
                        ),
                      ),
                      if (formattedHours.isNotEmpty) ...[
                        const SizedBox(width: 8),
                        Row(
                          children: [
                            Icon(Icons.access_time, color: Colors.grey[600], size: 14),
                            const SizedBox(width: 6),
                            Text(
                              formattedHours,
                              style: TextStyle(
                                color: Colors.grey[600],
                                fontSize: 12,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ],
                  ),
                  const SizedBox(height: 12),
                  // Rewards Section
                  Row(
                    children: [
                      // Checkpoint Reward
                      Expanded(
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                          decoration: BoxDecoration(
                            color: const Color(0xFFFF6565).withOpacity(0.1),
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(
                              color: const Color(0xFFFF6565).withOpacity(0.3),
                              width: 1,
                            ),
                          ),
                          child: Row(
                            children: [
                              const Icon(Icons.card_giftcard, color: Color(0xFFFF6565), size: 16),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      'Checkpoint Reward',
                                      style: TextStyle(
                                        color: Colors.grey[600],
                                        fontSize: 10,
                                      ),
                                    ),
                                    const SizedBox(height: 2),
                                    Text(
                                      checkpointRewardTitle,
                                      style: const TextStyle(
                                        color: Color(0xFFFF6565),
                                        fontSize: 12,
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
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                        decoration: BoxDecoration(
                          color: AppColors.primary.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(
                            color: AppColors.primary.withOpacity(0.3),
                            width: 1,
                          ),
                        ),
                        child: Row(
                          children: [
                            Icon(Icons.stars, color: AppColors.primary, size: 16),
                            const SizedBox(width: 8),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Points Rewards',
                                  style: TextStyle(
                                    color: Colors.grey[600],
                                    fontSize: 10,
                                  ),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  '$totalPointsRewards available',
                                  style: TextStyle(
                                    color: AppColors.primary,
                                    fontSize: 12,
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
                  const SizedBox(height: 12),
                  // Address and Industry
                  if (address != null || industry != null)
                    Row(
                      children: [
                        if (address != null)
                          Expanded(
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                              decoration: BoxDecoration(
                                color: Colors.grey[100],
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Row(
                                children: [
                                  Icon(Icons.location_on, color: Colors.grey[600], size: 14),
                                  const SizedBox(width: 6),
                                  Expanded(
                                    child: Text(
                                      address!,
                                      style: TextStyle(
                                        color: Colors.grey[600],
                                        fontSize: 12,
                                      ),
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        if (address != null && industry != null)
                          const SizedBox(width: 8),
                        if (industry != null)
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                            decoration: BoxDecoration(
                              color: Colors.grey[100],
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(Icons.store, color: Colors.grey[600], size: 14),
                                const SizedBox(width: 6),
                                Text(
                                  industry!,
                                  style: TextStyle(
                                    color: Colors.grey[600],
                                    fontSize: 12,
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
      ),
    );
  }
} 