import 'package:flutter/material.dart';

class CheckpointRewardsProgress extends StatefulWidget {
  final int currentStep;
  final int totalSteps;
  final List<int> rewardSteps; // es: [5, 10]
  final String labelReward;

  const CheckpointRewardsProgress({
    super.key,
    required this.currentStep,
    required this.totalSteps,
    required this.rewardSteps,
    this.labelReward = 'Free Cream',
  });

  @override
  State<CheckpointRewardsProgress> createState() => _CheckpointRewardsProgressState();
}

class _CheckpointRewardsProgressState extends State<CheckpointRewardsProgress> {
  final ScrollController _scrollController = ScrollController();
  double _progress = 0.0;
  double _minProgress = 0.0;

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
    WidgetsBinding.instance.addPostFrameCallback((_) => _onScroll());
  }

  @override
  void dispose() {
    _scrollController.removeListener(_onScroll);
    _scrollController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (!_scrollController.hasClients) return;
    final maxScroll = _scrollController.position.maxScrollExtent;
    final currentScroll = _scrollController.offset;
    double progress = 0.0;
    if (maxScroll > 0) {
      progress = (currentScroll / maxScroll).clamp(0.0, 1.0);
    }
    // La barra parte già dal secondo checkpoint
    progress = _minProgress + (1 - _minProgress) * progress;
    setState(() {
      _progress = progress;
    });
  }

  @override
  Widget build(BuildContext context) {
    // Dimensioni barra
    const double pxPerStep = 90; // distanza molto ampia tra i dot
    const double rewardDotSize = 29;
    const double normalDotSize = 19;
    const double barHeight = 42;
    const double barLeft = 22;
    const double barTop = 87;
    const double barHPadding = 4;
    const double barVPadding = 4;
    const double dotPadding = 10;
    const double firstDotOffset = 60;
    const double lastDotOffset = 30;
    final int visibleSteps = 5;
    final double minBarWidth = (visibleSteps - 1) * pxPerStep + rewardDotSize;
    final double barWidth = (widget.totalSteps - 1) * pxPerStep + rewardDotSize;
    final double scrollBarWidth = barWidth < minBarWidth ? minBarWidth : barWidth;
    final double dotCenterY = barTop + barHeight / 2;
    final double progressBarWidth = barWidth - 2 * barHPadding;
    final double progressBarHeight = barHeight - 2 * barVPadding;

    // Calcolo la progress minima per arrivare al centro del secondo checkpoint
    final bool isSecondReward = widget.rewardSteps.contains(2);
    final double secondDotSize = isSecondReward ? rewardDotSize : normalDotSize;
    final double secondDotPos = barHPadding + firstDotOffset + (barWidth - firstDotOffset - lastDotOffset) * 1 / (widget.totalSteps - 1);
    final double minRedBarLength = secondDotPos - barHPadding + (secondDotSize / 2) + 8;
    final double maxRedBarLength = (barWidth - 2 * barHPadding);
    _minProgress = (minRedBarLength / maxRedBarLength).clamp(0.0, 1.0);

    // Progressivo: la barra rossa cresce in base allo scroll
    final double progress = _progress;
    final double redBarLength = maxRedBarLength * progress;

    return Column(
      children: [
        Container(
          width: double.infinity,
          height: 240,
          clipBehavior: Clip.antiAlias,
          decoration: ShapeDecoration(
            color: const Color(0xFFF5F5F5),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(33),
            ),
          ),
          child: Stack(
            children: [
              // Titolo
              const Positioned(
                left: 22,
                top: 20,
                child: Text(
                  'Our Specialities',
                  style: TextStyle(
                    color: Color(0xFF1A1A1A),
                    fontSize: 22,
                    fontFamily: 'Fredoka',
                    fontWeight: FontWeight.w600,
                    height: 1.10,
                    letterSpacing: 0.66,
                  ),
                ),
              ),
              // Sottotitolo
              const Positioned(
                left: 22,
                top: 50,
                child: Text(
                  'Each 10 icecream you get 1 for Free',
                  style: TextStyle(
                    color: Color(0xFF1A1A1A),
                    fontSize: 16,
                    fontFamily: 'Fredoka',
                    fontWeight: FontWeight.w500,
                    height: 1.40,
                    letterSpacing: 0.48,
                  ),
                ),
              ),
              // Progresso numerico e icona in alto a destra
              Positioned(
                right: 22,
                top: 20,
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      '${widget.currentStep}/${widget.totalSteps}',
                      style: const TextStyle(
                        color: Color(0xFFFF6565),
                        fontSize: 22,
                        fontFamily: 'Fredoka',
                        fontWeight: FontWeight.w600,
                        height: 1.10,
                        letterSpacing: 0.66,
                      ),
                    ),
                    const SizedBox(width: 8),
                    const Icon(Icons.card_giftcard, color: Color(0xFFFF6565), size: 25),
                  ],
                ),
              ),
              // Barra lunga e checkpoint scrollabili
              Positioned(
                left: barLeft,
                top: 85,
                right: 0,
                child: SizedBox(
                  height: 140,
                  child: NotificationListener<ScrollNotification>(
                    onNotification: (notification) {
                      _onScroll();
                      return false;
                    },
                    child: SingleChildScrollView(
                      controller: _scrollController,
                      scrollDirection: Axis.horizontal,
                      child: SizedBox(
                        width: scrollBarWidth,
                        child: Stack(
                          children: [
                            // Barra background (bianca)
                            Container(
                              width: barWidth,
                              height: barHeight,
                              decoration: ShapeDecoration(
                                color: Colors.white,
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(25),
                                ),
                              ),
                            ),
                            // Barra progress (rossa, cresce con lo scroll)
                            Positioned(
                              left: barHPadding,
                              top: barVPadding,
                              child: Container(
                                width: redBarLength,
                                height: progressBarHeight,
                                decoration: ShapeDecoration(
                                  color: const Color(0xFFFF6565),
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(25),
                                  ),
                                ),
                              ),
                            ),
                            // Pallini checkpoint sopra la barra rossa
                            ...List.generate(widget.totalSteps, (i) {
                              final step = i + 1;
                              final isCompleted = step <= widget.currentStep;
                              final isReward = widget.rewardSteps.contains(step);
                              final double dotSize = isReward ? rewardDotSize : normalDotSize;
                              final double left = barHPadding + firstDotOffset
                                + (barWidth - firstDotOffset - lastDotOffset) * i / (widget.totalSteps - 1)
                                - dotSize / 2;
                              return Positioned(
                                left: left,
                                top: (barHeight - dotSize) / 2,
                                child: _CheckpointDot(
                                  isActive: isCompleted,
                                  isReward: isReward,
                                  showIceCream: isReward,
                                  size: dotSize,
                                ),
                              );
                            }),
                            // Pillola reward sotto ogni dot reward
                            ...List.generate(widget.totalSteps, (i) {
                              final step = i + 1;
                              if (!widget.rewardSteps.contains(step)) return const SizedBox.shrink();
                              final isReward = true;
                              final double dotSize = isReward ? rewardDotSize : normalDotSize;
                              final double left = barHPadding + firstDotOffset
                                + (barWidth - firstDotOffset - lastDotOffset) * i / (widget.totalSteps - 1)
                                - dotSize / 2;
                              return Positioned(
                                left: left + dotSize / 2 - 53.5,
                                top: barHeight + 10,
                                child: Column(
                                  children: [
                                    Container(
                                      width: 6,
                                      height: 20,
                                      decoration: ShapeDecoration(
                                        color: const Color(0xFFFF6565),
                                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                                      ),
                                    ),
                                    const SizedBox(height: 4),
                                    Container(
                                      width: 107,
                                      height: 48,
                                      padding: const EdgeInsets.symmetric(horizontal: 13, vertical: 6),
                                      clipBehavior: Clip.antiAlias,
                                      decoration: ShapeDecoration(
                                        color: const Color(0xFFFF6565),
                                        shape: RoundedRectangleBorder(
                                          side: const BorderSide(
                                            width: 1,
                                            color: Color(0xFFE6E6E6),
                                          ),
                                          borderRadius: BorderRadius.circular(32),
                                        ),
                                      ),
                                      child: Center(
                                        child: Text(
                                          widget.labelReward,
                                          textAlign: TextAlign.center,
                                          style: const TextStyle(
                                            color: Colors.white,
                                            fontSize: 15,
                                            fontFamily: 'Fredoka',
                                            fontWeight: FontWeight.w600,
                                            height: 1.1,
                                            letterSpacing: 0.48,
                                          ),
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              );
                            }),
                          ],
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _CheckpointDot extends StatelessWidget {
  final bool isActive;
  final bool isReward;
  final bool showIceCream;
  final double size;
  const _CheckpointDot({this.isActive = false, this.isReward = false, this.showIceCream = false, this.size = 29});
  @override
  Widget build(BuildContext context) {
    return Stack(
      alignment: Alignment.center,
      children: [
        Container(
          width: size,
          height: size,
          margin: const EdgeInsets.symmetric(horizontal: 0, vertical: 2),
          decoration: ShapeDecoration(
            color: isReward
                ? const Color(0xFFFF6565)
                : (isActive ? Colors.white : const Color(0xFFF5F5F5).withOpacity(0.5)),
            shape: OvalBorder(
              side: BorderSide(
                width: 1,
                color: isReward
                    ? const Color(0xFFFF6565)
                    : (isActive ? const Color(0xFFFF6565) : const Color(0xFFF5F5F5).withOpacity(0.5)),
              ),
            ),
          ),
        ),
        if (showIceCream)
          Icon(Icons.icecream, color: Colors.white, size: size * 0.72),
      ],
    );
  }
} 