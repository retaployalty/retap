import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../theme/app_theme.dart';
import '../theme/text_styles.dart';
import 'login_screen.dart';
import 'merchant_selection_screen.dart';
import 'main_screen.dart';
import '../services/merchant_service.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  @override
  void initState() {
    super.initState();
    _checkAuth();
  }

  Future<void> _checkAuth() async {
    await Future.delayed(const Duration(seconds: 2));
    if (!mounted) return;

    final session = Supabase.instance.client.auth.currentSession;
    debugPrint('Current session: ${session?.user.id}');
    
    if (session == null) {
      debugPrint('No session found, navigating to login');
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (_) => const LoginScreen()),
      );
      return;
    }

    // Get saved merchant
    final merchant = await MerchantService.getSelectedMerchant();
    debugPrint('Retrieved merchant: ${merchant['id']} - ${merchant['name']}');
    
    if (merchant['id'] != null && merchant['name'] != null) {
      debugPrint('Navigating to main screen with saved merchant');
      // Navigate directly to main screen with saved merchant
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(
          builder: (_) => MainScreen(
            merchantId: merchant['id']!,
            merchantName: merchant['name']!,
          ),
        ),
      );
    } else {
      debugPrint('No merchant found, navigating to selection screen');
      // If no merchant is saved, show selection screen
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (_) => const MerchantSelectionScreen()),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // Logo placeholder
            Container(
              width: 120,
              height: 120,
              decoration: BoxDecoration(
                color: AppColors.primary,
                borderRadius: BorderRadius.circular(20),
              ),
              child: const Icon(
                Icons.point_of_sale,
                size: 60,
                color: AppColors.secondary,
              ),
            ),
            const SizedBox(height: 24),
            Text(
              'ReTap POS',
              style: AppTextStyles.headlineLarge,
            ),
            const SizedBox(height: 8),
            Text(
              'Loyalty System',
              style: AppTextStyles.bodyLarge.copyWith(
                color: AppColors.textSecondary,
              ),
            ),
          ],
        ),
      ),
    );
  }
} 