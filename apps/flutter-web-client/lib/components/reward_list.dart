import 'package:flutter/material.dart';
import '../theme/app_theme.dart';
import '../theme/text_styles.dart';

class RewardList extends StatelessWidget {
  final int userPoints;
  final List<RewardItem> rewards;
  final List<CheckpointOffer> checkpointOffers;
  final int currentCheckpointStep;

  const RewardList({
    Key? key,
    required this.userPoints,
    required this.rewards,
    required this.checkpointOffers,
    required this.currentCheckpointStep,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final double width = MediaQuery.of(context).size.width;
    // Ordina i premi per prezzo crescente
    final sortedRewards = List<RewardItem>.from(rewards)..sort((a, b) => a.price.compareTo(b.price));
    
    return Center(
      child: Container(
        width: width,
        height: 420,
        clipBehavior: Clip.antiAlias,
        margin: const EdgeInsets.symmetric(vertical: 8),
        decoration: ShapeDecoration(
          color: AppColors.primary,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(33),
          ),
          shadows: [
            BoxShadow(
              color: const Color(0x3F000000),
              blurRadius: 4,
              offset: const Offset(0, 1),
            ),
          ],
        ),
        child: Stack(
          children: [
            // Titolo Reward
            Positioned(
              left: 32,
              top: 22,
              child: Text(
                'Reward',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 26,
                  fontFamily: 'Fredoka',
                  fontWeight: FontWeight.w600,
                  height: 1.10,
                  letterSpacing: 0.66,
                ),
              ),
            ),
            // Saldo punti
            Positioned(
              right: 32,
              top: 22,
              child: Row(
                children: [
                  Text(
                    userPoints.toString(),
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 26,
                      fontFamily: 'Fredoka',
                      fontWeight: FontWeight.w600,
                      height: 1.10,
                      letterSpacing: 0.66,
                    ),
                  ),
                  const SizedBox(width: 4),
                  const Icon(Icons.attach_money, color: Colors.white, size: 26),
                ],
              ),
            ),
            // Lista scrollabile di reward
            Positioned(
              left: 0,
              right: 0,
              top: 75,
              bottom: 0,
              child: SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const SizedBox(width: 24),
                    // Mostra solo i rewards normali
                    for (int i = 0; i < sortedRewards.length; i++)
                      Padding(
                        padding: const EdgeInsets.only(right: 18),
                        child: _RewardCard(
                          reward: sortedRewards[i],
                          unlocked: userPoints >= sortedRewards[i].price,
                          width: 200,
                          height: 340,
                        ),
                      ),
                    const SizedBox(width: 24),
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

class _CheckpointOfferCard extends StatelessWidget {
  final CheckpointOffer offer;
  final int currentStep;
  final double width;
  final double height;

  const _CheckpointOfferCard({
    required this.offer,
    required this.currentStep,
    this.width = 153,
    this.height = 264,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: width,
      height: height,
      clipBehavior: Clip.antiAlias,
      margin: const EdgeInsets.only(bottom: 24),
      decoration: ShapeDecoration(
        color: Colors.white,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(28),
        ),
      ),
      child: Stack(
        children: [
          // Immagine
          Positioned(
            left: 0,
            top: 0,
            child: Container(
              width: width,
              height: width,
              clipBehavior: Clip.antiAlias,
              decoration: const BoxDecoration(
                color: Color(0xFFF5F5F5),
              ),
              child: Stack(
                children: [
                  Positioned(
                    left: (width-140)/2,
                    top: 18,
                    child: Container(
                      width: 140,
                      height: 140,
                      decoration: BoxDecoration(
                        color: Colors.white,
                        shape: BoxShape.circle,
                        border: Border.all(color: AppColors.primary, width: 2),
                      ),
                      child: const Icon(Icons.card_giftcard, size: 64, color: AppColors.primary),
                    ),
                  ),
                ],
              ),
            ),
          ),
          // Titolo
          Positioned(
            left: 18,
            top: width+18,
            child: SizedBox(
              width: width-36,
              child: Text(
                offer.name,
                style: const TextStyle(
                  color: Color(0xFF1A1A1A),
                  fontSize: 18,
                  fontFamily: 'Fredoka',
                  fontWeight: FontWeight.w600,
                  height: 1.10,
                  letterSpacing: 0.48,
                ),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ),
          // Progresso
          Positioned(
            left: 18,
            top: width+60,
            child: Row(
              children: [
                Text(
                  '$currentStep/${offer.totalSteps}',
                  style: const TextStyle(
                    color: Color(0xFF1A1A1A),
                    fontSize: 14,
                    fontFamily: 'Roboto',
                    fontWeight: FontWeight.w400,
                    height: 1.33,
                    letterSpacing: 0.40,
                  ),
                ),
                const SizedBox(width: 4),
                const Icon(Icons.card_giftcard, size: 20, color: Color(0xFF1A1A1A)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _RewardCard extends StatelessWidget {
  final RewardItem reward;
  final bool unlocked;
  final double width;
  final double height;

  const _RewardCard({required this.reward, required this.unlocked, this.width = 153, this.height = 264});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: width,
      height: height,
      clipBehavior: Clip.antiAlias,
      margin: const EdgeInsets.only(bottom: 24),
      decoration: ShapeDecoration(
        color: Colors.white,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(28),
        ),
      ),
      child: Stack(
        children: [
          // Immagine
          Positioned(
            left: 0,
            top: 0,
            child: Container(
              width: width,
              height: width,
              clipBehavior: Clip.antiAlias,
              decoration: const BoxDecoration(
                color: Color(0xFFF5F5F5),
              ),
              child: Stack(
                children: [
                  Positioned(
                    left: (width-140)/2,
                    top: 18,
                    child: Container(
                      width: 140,
                      height: 140,
                      decoration: BoxDecoration(
                        image: DecorationImage(
                          image: NetworkImage(reward.fullImageUrl),
                          fit: BoxFit.cover,
                        ),
                      ),
                    ),
                  ),
                  if (!unlocked)
                    Positioned(
                      left: (width-60)/2,
                      top: 60,
                      child: Container(
                        width: 60,
                        height: 60,
                        decoration: ShapeDecoration(
                          color: Colors.white,
                          shape: RoundedRectangleBorder(
                            side: const BorderSide(width: 2),
                            borderRadius: BorderRadius.circular(35),
                          ),
                        ),
                        child: const Icon(Icons.lock, size: 32, color: AppColors.primary),
                      ),
                    ),
                ],
              ),
            ),
          ),
          // Titolo
          Positioned(
            left: 18,
            top: width+18,
            child: SizedBox(
              width: width-36,
              child: Text(
                reward.title,
                style: const TextStyle(
                  color: Color(0xFF1A1A1A),
                  fontSize: 18,
                  fontFamily: 'Fredoka',
                  fontWeight: FontWeight.w600,
                  height: 1.10,
                  letterSpacing: 0.48,
                ),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ),
          // Prezzo
          Positioned(
            left: 18,
            top: width+60,
            child: Row(
              children: [
                Text(
                  reward.price.toString(),
                  style: const TextStyle(
                    color: Color(0xFF1A1A1A),
                    fontSize: 14,
                    fontFamily: 'Roboto',
                    fontWeight: FontWeight.w400,
                    height: 1.33,
                    letterSpacing: 0.40,
                  ),
                ),
                const SizedBox(width: 4),
                const Icon(Icons.attach_money, size: 20, color: Color(0xFF1A1A1A)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class RewardItem {
  final String imageUrl;
  final String title;
  final int price;

  RewardItem({required this.imageUrl, required this.title, required this.price});

  String get fullImageUrl => 'https://egmizgydnmvpfpbzmbnj.supabase.co/storage/v1/object/public/rewards/$imageUrl';
}

class CheckpointOffer {
  final String id;
  final String name;
  final String description;
  final int totalSteps;
  final List<CheckpointStep> steps;

  CheckpointOffer({
    required this.id,
    required this.name,
    required this.description,
    required this.totalSteps,
    required this.steps,
  });

  factory CheckpointOffer.fromJson(Map<String, dynamic> json) {
    return CheckpointOffer(
      id: json['id'],
      name: json['name'],
      description: json['description'],
      totalSteps: json['total_steps'],
      steps: (json['steps'] as List<dynamic>)
          .map((step) => CheckpointStep.fromJson(step))
          .toList(),
    );
  }
}

class CheckpointStep {
  final String id;
  final int stepNumber;
  final String? rewardId;
  final CheckpointReward? reward;

  CheckpointStep({
    required this.id,
    required this.stepNumber,
    this.rewardId,
    this.reward,
  });

  factory CheckpointStep.fromJson(Map<String, dynamic> json) {
    return CheckpointStep(
      id: json['id'],
      stepNumber: json['step_number'],
      rewardId: json['reward_id'],
      reward: json['reward'] != null ? CheckpointReward.fromJson(json['reward']) : null,
    );
  }
}

class CheckpointReward {
  final String id;
  final String name;
  final String description;
  final String icon;

  CheckpointReward({
    required this.id,
    required this.name,
    required this.description,
    required this.icon,
  });

  factory CheckpointReward.fromJson(Map<String, dynamic> json) {
    return CheckpointReward(
      id: json['id'],
      name: json['name'],
      description: json['description'],
      icon: json['icon'],
    );
  }
} 