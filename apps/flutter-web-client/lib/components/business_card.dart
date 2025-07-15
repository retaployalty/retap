import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
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
  final List<int> rewardSteps;
  final String? currentRewardName;
  final bool? isRedeemable;
  final String? distance;
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
    required this.rewardSteps,
    this.currentRewardName,
    this.isRedeemable,
    this.distance,
    this.onTap,
    this.hours,
  }) : super(key: key);

  int _getNextRewardStep() {
    final nextRewardStep = rewardSteps
        .where((step) => step > checkpointsCurrent)
        .firstOrNull;
    return nextRewardStep ?? checkpointsTotal;
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
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
        child: Row(
          children: [
            // Immagine a sinistra
            ClipRRect(
              borderRadius: const BorderRadius.only(
                topLeft: Radius.circular(24),
                bottomLeft: Radius.circular(24),
              ),
              child: Image.network(
                logoUrl,
                height: 160,
                width: 160,
                fit: BoxFit.cover,
                errorBuilder: (context, error, stackTrace) => Container(
                  height: 160,
                  width: 160,
                  color: AppColors.primary.withOpacity(0.08),
                  child: const Center(child: Icon(Icons.store, color: AppColors.primary, size: 48)),
                ),
              ),
            ),
            // Contenuto a destra
            Expanded(
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    // Nome business
                    Text(
                      name,
                      style: AppTextStyles.titleLarge.copyWith(
                        color: AppColors.textPrimary,
                        fontWeight: FontWeight.bold,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 12),
                    // Tipo business, stato e distanza
                    Row(
                      children: [
                        Icon(
                          categoryIcon,
                          color: AppColors.textSecondary,
                          size: 16,
                        ),
                        const SizedBox(width: 6),
                        Text(
                          category,
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
                        if (distance != null) ...[
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
                            distance!,
                            style: AppTextStyles.bodyMedium.copyWith(
                              color: AppColors.textSecondary,
                            ),
                          ),
                        ],
                                              ],
                      ),
                      const SizedBox(height: 20),
                      // Pillole rewards
                    Row(
                      children: [
                        // Checkpoint Rewards Pill
                        Expanded(
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                            decoration: BoxDecoration(
                              color: isRedeemable == true ? const Color(0xFFFF6565) : Colors.white,
                              borderRadius: BorderRadius.circular(20),
                              border: Border.all(
                                color: isRedeemable == true ? const Color(0xFFFF6565) : AppColors.textSecondary.withOpacity(0.3),
                                width: 1,
                              ),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Text(
                                  '$checkpointsCurrent/$checkpointsTotal',
                                  style: AppTextStyles.bodyLarge.copyWith(
                                    color: isRedeemable == true ? Colors.white : const Color(0xFFFF6565),
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                                const SizedBox(width: 4),
                                Expanded(
                                  child: Text(
                                    currentRewardName ?? 'Checkpoint',
                                    style: AppTextStyles.bodyLarge.copyWith(
                                      color: isRedeemable == true ? Colors.white : AppColors.textPrimary,
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
                                'assets/icons/tabler_coin-filled.svg',
                                width: 18,
                                height: 18,
                                colorFilter: ColorFilter.mode(
                                  AppColors.primary,
                                  BlendMode.srcIn,
                                ),
                              ),
                              const SizedBox(width: 4),
                              Text(
                                '$points',
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
            ),
          ],
        ),
      ),
    );
  }
} 