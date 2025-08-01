import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
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
        height: 440,
        margin: const EdgeInsets.symmetric(vertical: 8),
        decoration: ShapeDecoration(
          color: AppColors.primary,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(33),
          ),
          shadows: [
            BoxShadow(
              color: Colors.black.withOpacity(0.15),
              blurRadius: 8,
              spreadRadius: 1,
              offset: const Offset(0, 2),
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
                style: AppTextStyles.headlineSmall.copyWith(color: Colors.white),
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
                    style: AppTextStyles.headlineSmall.copyWith(color: Colors.white),
                  ),
                  const SizedBox(width: 4),
                  SvgPicture.asset(
                    'assets/icons/tabler_coin-filled.svg',
                    width: 26,
                    height: 26,
                    colorFilter: const ColorFilter.mode(Colors.white, BlendMode.srcIn),
                  ),
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
                child: Padding(
                  padding: const EdgeInsets.symmetric(vertical: 10),
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
                style: AppTextStyles.titleMedium.copyWith(color: const Color(0xFF1A1A1A)),
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
                  style: AppTextStyles.bodyMedium.copyWith(color: const Color(0xFF1A1A1A)),
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

class _RewardCard extends StatefulWidget {
  final RewardItem reward;
  final bool unlocked;
  final double width;
  final double height;

  const _RewardCard({required this.reward, required this.unlocked, this.width = 153, this.height = 264});

  @override
  State<_RewardCard> createState() => _RewardCardState();
}

class _RewardCardState extends State<_RewardCard> with TickerProviderStateMixin {
  late AnimationController _pulseController;
  late Animation<double> _pulseAnimation;
  late AnimationController _flipController;
  late Animation<double> _flipAnimation;
  bool _isFlipped = false;

  @override
  void initState() {
    super.initState();
    
    // Controller per l'animazione di pulse (solo per reward sbloccati)
    if (widget.unlocked) {
      _pulseController = AnimationController(
        duration: const Duration(milliseconds: 1000),
        vsync: this,
      );

      _pulseAnimation = Tween<double>(
        begin: 1.0,
        end: 1.05,
      ).animate(CurvedAnimation(
        parent: _pulseController,
        curve: Curves.easeInOut,
      ));

      _pulseController.repeat(reverse: true);
    }
    
    // Controller per l'animazione di flip
    _flipController = AnimationController(
      duration: const Duration(milliseconds: 600),
      vsync: this,
    );

    _flipAnimation = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(CurvedAnimation(
      parent: _flipController,
      curve: Curves.easeInOut,
    ));
  }

  @override
  void dispose() {
    if (widget.unlocked) {
      _pulseController.dispose();
    }
    _flipController.dispose();
    super.dispose();
  }

  void _flipCard() {
    if (_isFlipped) {
      _flipController.reverse();
    } else {
      _flipController.forward();
    }
    setState(() {
      _isFlipped = !_isFlipped;
    });
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _flipAnimation,
      builder: (context, child) {
        final flipValue = _flipAnimation.value;
        final isFrontVisible = flipValue < 0.5;
        
        return Transform(
          alignment: Alignment.center,
          transform: Matrix4.identity()
            ..setEntry(3, 2, 0.001)
            ..rotateY(flipValue * 3.14159),
          child: isFrontVisible ? _buildFrontCard() : _buildBackCard(),
        );
      },
    );
  }

  Widget _buildFrontCard() {
    Widget card = Container(
      width: widget.width,
      height: widget.height,
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
              width: widget.width,
              height: widget.width,
              clipBehavior: Clip.antiAlias,
              decoration: const BoxDecoration(
                color: Color(0xFFF5F5F5),
              ),
              child: Stack(
                children: [
                  Positioned(
                    left: (widget.width-140)/2,
                    top: 18,
                    child: Container(
                      width: 140,
                      height: 140,
                      decoration: BoxDecoration(
                        image: DecorationImage(
                          image: NetworkImage(widget.reward.fullImageUrl),
                          fit: BoxFit.cover,
                        ),
                      ),
                    ),
                  ),
                  if (!widget.unlocked)
                    Positioned(
                      left: (widget.width-60)/2,
                      top: 60,
                      child: Container(
                        width: 60,
                        height: 60,
                        decoration: ShapeDecoration(
                          color: Colors.white.withOpacity(0.8),
                          shape: RoundedRectangleBorder(
                            side: const BorderSide(width: 2, color: Colors.black),
                            borderRadius: BorderRadius.circular(35),
                          ),
                        ),
                        child: const Icon(Icons.lock, size: 32, color: Colors.black),
                      ),
                    ),
                ],
              ),
            ),
          ),
          // Titolo
          Positioned(
            left: 18,
            top: widget.width+18,
            child: SizedBox(
              width: widget.width-36,
              child: Text(
                widget.reward.title,
                style: AppTextStyles.titleMedium.copyWith(color: const Color(0xFF1A1A1A)),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ),
          // Prezzo
          Positioned(
            left: 18,
            top: widget.width+60,
            child: Row(
              children: [
                Text(
                  widget.reward.price.toString(),
                  style: AppTextStyles.bodyMedium.copyWith(color: const Color(0xFF1A1A1A)),
                ),
                const SizedBox(width: 4),
                SvgPicture.asset(
                  'assets/icons/tabler_coin-filled.svg',
                  width: 20,
                  height: 20,
                  colorFilter: const ColorFilter.mode(Color(0xFF1A1A1A), BlendMode.srcIn),
                ),
              ],
            ),
          ),
        ],
      ),
    );

    // Aggiungi il tap per flip
    card = Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: _flipCard,
        borderRadius: BorderRadius.circular(28),
        child: card,
      ),
    );

    // Se è sbloccato, aggiungi l'animazione di pulse
    if (widget.unlocked) {
      return AnimatedBuilder(
        animation: _pulseAnimation,
        builder: (context, child) {
          return Transform.scale(
            scale: _pulseAnimation.value,
            child: child,
          );
        },
        child: card,
      );
    }

    return card;
  }

  Widget _buildBackCard() {
    return Transform(
      alignment: Alignment.center,
      transform: Matrix4.rotationY(3.14159), // Ruota di 180 gradi
      child: Container(
        width: widget.width,
        height: widget.height,
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
            // Icona del reward
            Positioned(
              left: (widget.width-80)/2,
              top: 40,
              child: Container(
                width: 80,
                height: 80,
                decoration: BoxDecoration(
                  color: AppColors.primary,
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.card_giftcard,
                  size: 40,
                  color: Colors.white,
                ),
              ),
            ),
            // Titolo del reward
            Positioned(
              left: 18,
              top: 140,
              child: SizedBox(
                width: widget.width-36,
                child: Text(
                  widget.reward.title,
                  style: AppTextStyles.titleMedium.copyWith(color: const Color(0xFF1A1A1A)),
                  textAlign: TextAlign.center,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ),
            // Prezzo
            Positioned(
              left: 18,
              top: 180,
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    widget.reward.price.toString(),
                    style: AppTextStyles.bodyMedium.copyWith(color: const Color(0xFF1A1A1A)),
                  ),
                  const SizedBox(width: 4),
                  SvgPicture.asset(
                    'assets/icons/tabler_coin-filled.svg',
                    width: 20,
                    height: 20,
                    colorFilter: const ColorFilter.mode(Color(0xFF1A1A1A), BlendMode.srcIn),
                  ),
                ],
              ),
            ),
            // Descrizione
            Positioned(
              left: 18,
              top: 220,
              child: SizedBox(
                width: widget.width-36,
                child: Text(
                  widget.reward.description,
                  style: AppTextStyles.bodySmall.copyWith(color: const Color(0xFF666666)),
                  textAlign: TextAlign.center,
                  maxLines: 3,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ),
            // Pulsante per tornare
            Positioned(
              bottom: 20,
              left: 18,
              right: 18,
              child: SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _flipCard,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    padding: const EdgeInsets.symmetric(vertical: 8),
                  ),
                  child: Text(
                    'Back',
                    style: AppTextStyles.bodySmall.copyWith(color: Colors.white),
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

class RewardItem {
  final String imageUrl;
  final String title;
  final int price;
  final String description;

  RewardItem({required this.imageUrl, required this.title, required this.price, required this.description});

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