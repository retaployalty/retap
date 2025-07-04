import 'package:flutter/material.dart';
import '../theme/app_theme.dart';
import '../theme/text_styles.dart';

class LostCardTutorialScreen extends StatefulWidget {
  const LostCardTutorialScreen({super.key});

  @override
  State<LostCardTutorialScreen> createState() => _LostCardTutorialScreenState();
}

class _LostCardTutorialScreenState extends State<LostCardTutorialScreen> {
  final PageController _pageController = PageController();
  int _currentPage = 0;

  final List<TutorialStep> _steps = [
    TutorialStep(
      stepNumber: 1,
      title: 'Visit a Merchant',
      subtitle: 'Go to any participating ReTap merchant',
      description: 'Find a nearby merchant that accepts ReTap cards. You can use the map to locate them.',
      icon: Icons.store,
      image: 'assets/images/merchant_visit.png', // Placeholder
      color: AppColors.primary,
    ),
    TutorialStep(
      stepNumber: 2,
      title: 'Show Your Digital Wallet',
      subtitle: 'Present your digital card QR code',
      description: 'Open your digital wallet and show the QR code to the merchant. They will scan it to verify your account.',
      icon: Icons.qr_code,
      image: 'assets/images/qr_scan.png', // Placeholder
      color: AppColors.primary,
    ),
    TutorialStep(
      stepNumber: 3,
      title: 'Get Your New Card',
      subtitle: 'Receive your replacement physical card',
      description: 'The merchant will provide you with a new physical card. Keep it safe and add it to your digital wallet.',
      icon: Icons.credit_card,
      image: 'assets/images/new_card.png', // Placeholder
      color: AppColors.primary,
    ),
    TutorialStep(
      stepNumber: 4,
      title: 'Add to Digital Wallet',
      subtitle: 'Update your digital wallet settings',
      description: 'Go to Settings > Wallet and tap "Add Card to Wallet" to link your new physical card.',
      icon: Icons.account_balance_wallet,
      image: 'assets/images/add_wallet.png', // Placeholder
      color: AppColors.success,
    ),
  ];

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text(
          'Replace Lost Card',
          style: AppTextStyles.titleLarge.copyWith(color: AppColors.primary),
        ),
        backgroundColor: AppColors.background,
        elevation: 0,
        iconTheme: const IconThemeData(color: AppColors.primary),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: Text(
              'Skip',
              style: AppTextStyles.labelLarge.copyWith(
                color: AppColors.primary,
              ),
            ),
          ),
        ],
      ),
      body: Column(
        children: [
          // Progress indicator
          _buildProgressIndicator(),
          
          // Page content
          Expanded(
            child: PageView.builder(
              controller: _pageController,
              onPageChanged: (index) {
                setState(() {
                  _currentPage = index;
                });
              },
              itemCount: _steps.length,
              itemBuilder: (context, index) {
                return _buildTutorialStep(_steps[index]);
              },
            ),
          ),
          
          // Navigation buttons
          _buildNavigationButtons(),
        ],
      ),
    );
  }

  Widget _buildProgressIndicator() {
    return Container(
      padding: const EdgeInsets.all(24),
      child: Column(
        children: [
          // Progress dots
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: List.generate(_steps.length, (index) {
              return Container(
                margin: const EdgeInsets.symmetric(horizontal: 4),
                width: _currentPage == index ? 24 : 8,
                height: 8,
                decoration: BoxDecoration(
                  color: _currentPage == index 
                      ? AppColors.primary 
                      : AppColors.primary.withOpacity(0.3),
                  borderRadius: BorderRadius.circular(4),
                ),
              );
            }),
          ),
          const SizedBox(height: 16),
          // Step counter
          Text(
            'Step ${_currentPage + 1} of ${_steps.length}',
            style: AppTextStyles.bodyMedium.copyWith(
              color: AppColors.textSecondary,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTutorialStep(TutorialStep step) {
    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Column(
        children: [
          // Step number and icon
          Container(
            width: 80,
            height: 80,
            decoration: BoxDecoration(
              color: step.color.withOpacity(0.1),
              borderRadius: BorderRadius.circular(40),
            ),
            child: Stack(
              alignment: Alignment.center,
              children: [
                Icon(
                  step.icon,
                  color: step.color,
                  size: 40,
                ),
                Positioned(
                  top: 8,
                  right: 8,
                  child: Container(
                    width: 24,
                    height: 24,
                    decoration: BoxDecoration(
                      color: step.color,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Center(
                      child: Text(
                        step.stepNumber.toString(),
                        style: AppTextStyles.labelMedium.copyWith(
                          color: Colors.white,
                          fontSize: 12,
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
          
          const SizedBox(height: 32),
          
          // Title
          Text(
            step.title,
            style: AppTextStyles.headlineSmall.copyWith(
              color: AppColors.textPrimary,
            ),
            textAlign: TextAlign.center,
          ),
          
          const SizedBox(height: 8),
          
          // Subtitle
          Text(
            step.subtitle,
            style: AppTextStyles.titleMedium.copyWith(
              color: AppColors.primary,
            ),
            textAlign: TextAlign.center,
          ),
          
          const SizedBox(height: 24),
          
          // Description
          Text(
            step.description,
            style: AppTextStyles.bodyLarge.copyWith(
              color: AppColors.textSecondary,
              height: 1.5,
            ),
            textAlign: TextAlign.center,
          ),
          
          const SizedBox(height: 40),
        ],
      ),
    );
  }

  Widget _buildNavigationButtons() {
    return Container(
      padding: const EdgeInsets.all(24),
      child: Row(
        children: [
          // Back button
          if (_currentPage > 0)
            Expanded(
              child: OutlinedButton(
                onPressed: () {
                  _pageController.previousPage(
                    duration: const Duration(milliseconds: 300),
                    curve: Curves.easeInOut,
                  );
                },
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  side: const BorderSide(color: AppColors.primary),
                ),
                child: Text(
                  'Back',
                  style: AppTextStyles.labelLarge.copyWith(
                    color: AppColors.primary,
                  ),
                ),
              ),
            ),
          
          if (_currentPage > 0) const SizedBox(width: 16),
          
          // Next/Finish button
          Expanded(
            child: ElevatedButton(
              onPressed: () {
                if (_currentPage < _steps.length - 1) {
                  _pageController.nextPage(
                    duration: const Duration(milliseconds: 300),
                    curve: Curves.easeInOut,
                  );
                } else {
                  _finishTutorial();
                }
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                padding: const EdgeInsets.symmetric(vertical: 16),
              ),
              child: Text(
                _currentPage < _steps.length - 1 ? 'Next' : 'Finish',
                style: AppTextStyles.labelLarge.copyWith(
                  color: Colors.white,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  void _finishTutorial() {
    // Simply go back to previous screen
    Navigator.of(context).pop();
  }
}

class TutorialStep {
  final int stepNumber;
  final String title;
  final String subtitle;
  final String description;
  final IconData icon;
  final String image;
  final Color color;

  TutorialStep({
    required this.stepNumber,
    required this.title,
    required this.subtitle,
    required this.description,
    required this.icon,
    required this.image,
    required this.color,
  });
} 