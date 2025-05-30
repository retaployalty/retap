import 'package:flutter/material.dart';
import '../theme/app_theme.dart';
import '../theme/text_styles.dart';
import '../shared_utils/business_hours.dart';

class BusinessCard extends StatelessWidget {
  final String category;
  final IconData categoryIcon;
  final String logoUrl;
  final String name;
  final bool isOpen;
  final int checkpointsCurrent;
  final int checkpointsTotal;
  final int points;
  final VoidCallback? onTap;
  final dynamic hours;

  const BusinessCard({
    Key? key,
    required this.category,
    required this.categoryIcon,
    required this.logoUrl,
    required this.name,
    required this.isOpen,
    required this.checkpointsCurrent,
    required this.checkpointsTotal,
    required this.points,
    this.onTap,
    this.hours,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 300,
        height: 320,
        margin: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(28),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.07),
              blurRadius: 16,
              offset: const Offset(0, 8),
            ),
          ],
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Immagine con pillola categoria
            Stack(
              clipBehavior: Clip.none,
              children: [
                Container(
                  height: 160,
                  width: 300,
                  decoration: const BoxDecoration(
                    borderRadius: BorderRadius.only(
                      topLeft: Radius.circular(28),
                      topRight: Radius.circular(28),
                    ),
                    color: Colors.white,
                  ),
                  child: Center(
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(24),
                      child: Image.network(
                        logoUrl,
                        height: 160,
                        width: 160,
                        fit: BoxFit.contain,
                        errorBuilder: (context, error, stackTrace) => Container(
                          height: 160,
                          width: 160,
                          color: AppColors.primary.withOpacity(0.08),
                          child: Icon(Icons.store, color: AppColors.primary, size: 64),
                        ),
                      ),
                    ),
                  ),
                ),
                Positioned(
                  top: 16,
                  left: 16,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(22),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.08),
                          blurRadius: 6,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(categoryIcon, color: Colors.black87, size: 20),
                        const SizedBox(width: 6),
                        Text(
                          category,
                          style: const TextStyle(
                            fontWeight: FontWeight.w700,
                            fontSize: 16,
                            color: Colors.black87,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
            // Contenuto principale
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Nome business
                  Text(
                    name,
                    style: AppTextStyles.titleMedium,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 4),
                  // Stato apertura
                  Row(
                    children: [
                      Container(
                        width: 8,
                        height: 8,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: isOpen ? Colors.green : Colors.red,
                        ),
                      ),
                      const SizedBox(width: 6),
                      Text(
                        isOpen ? 'Open' : 'Closed',
                        style: AppTextStyles.bodyMedium.copyWith(
                          color: isOpen ? Colors.green : Colors.red,
                        ),
                      ),
                      if (!isOpen && hours != null && getTodayOpeningHours(hours).isNotEmpty) ...[
                        const SizedBox(width: 8),
                        Text(
                          getTodayOpeningHours(hours),
                          style: AppTextStyles.bodyMedium.copyWith(
                            color: Colors.black,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ],
                  ),
                  const SizedBox(height: 12),
                  // Stats
                  Row(
                    children: [
                      Expanded(
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                          decoration: BoxDecoration(
                            color: AppColors.primary,
                            borderRadius: BorderRadius.circular(18),
                          ),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              const Icon(Icons.card_giftcard, color: Colors.white, size: 16),
                              const SizedBox(width: 4),
                              Text(
                                '$checkpointsCurrent/$checkpointsTotal',
                                style: AppTextStyles.labelLarge.copyWith(color: Colors.white),
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                          decoration: BoxDecoration(
                            color: AppColors.primary,
                            borderRadius: BorderRadius.circular(18),
                          ),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              const Icon(Icons.attach_money, color: Colors.white, size: 16),
                              const SizedBox(width: 4),
                              Text(
                                '$points',
                                style: AppTextStyles.labelLarge.copyWith(color: Colors.white),
                              ),
                            ],
                          ),
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