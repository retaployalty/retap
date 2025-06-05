import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:go_router/go_router.dart';
import 'theme/app_theme.dart';
import 'screens/home_screen.dart';
import 'screens/business_list_screen.dart';
import 'screens/settings_screen.dart';
import 'screens/merchant_details_screen.dart';
import 'screens/merchant_showcase_screen.dart';
import 'screens/splash_screen.dart';
import 'components/custom_bottom_nav_bar.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Precarica il font Fredoka
  await GoogleFonts.pendingFonts([
    GoogleFonts.getFont('Fredoka'),
  ]);
  
  runApp(const ReTapWeb());
}

class ReTapWeb extends StatelessWidget {
  const ReTapWeb({super.key});

  @override
  Widget build(BuildContext context) {
    final router = GoRouter(
      initialLocation: '/splash',
      debugLogDiagnostics: true,
      routes: [
        // Splash screen come rotta iniziale
        GoRoute(
          path: '/splash',
          builder: (context, state) => const SplashScreen(),
        ),
        // Rotte separate senza bottom navigation bar
        GoRoute(
          path: '/m/:merchantId',
          builder: (context, state) {
            debugPrint('Building MerchantShowcaseScreen');
            debugPrint('MerchantId: ${state.pathParameters['merchantId']}');
            final merchantId = state.pathParameters['merchantId']!;
            return MerchantShowcaseScreen(
              merchantId: merchantId,
            );
          },
        ),
        GoRoute(
          path: '/m/:merchantId/c/:cardId',
          builder: (context, state) {
            debugPrint('Building MerchantDetailsScreen');
            debugPrint('MerchantId: ${state.pathParameters['merchantId']}');
            debugPrint('CardId: ${state.pathParameters['cardId']}');
            final merchantId = state.pathParameters['merchantId']!;
            final cardId = state.pathParameters['cardId']!;
            return MerchantDetailsScreen(
              merchantId: merchantId,
              cardId: cardId,
            );
          },
        ),
        // Rotte principali con bottom navigation bar
        ShellRoute(
          builder: (context, state, child) {
            debugPrint('ShellRoute builder - Current location: ${state.matchedLocation}');
            return Scaffold(
              body: child,
              bottomNavigationBar: CustomBottomNavBar(
                currentIndex: _calculateSelectedIndex(state),
                onTap: (index) => _onItemTapped(context, index),
              ),
            );
          },
          routes: [
            GoRoute(
              path: '/',
              builder: (context, state) {
                debugPrint('Building HomeScreen');
                return const HomeScreen();
              },
            ),
            GoRoute(
              path: '/businesses',
              builder: (context, state) => const BusinessListScreen(),
            ),
            GoRoute(
              path: '/settings',
              builder: (context, state) => const SettingsScreen(),
            ),
          ],
        ),
      ],
    );

    return MaterialApp.router(
      title: 'ReTap Card',
      theme: appTheme,
      debugShowCheckedModeBanner: false,
      routerConfig: router,
    );
  }

  int _calculateSelectedIndex(GoRouterState state) {
    debugPrint('Calculating selected index for: ${state.matchedLocation}');
    if (state.matchedLocation.startsWith('/businesses')) return 1;
    if (state.matchedLocation.startsWith('/settings')) return 2;
    return 0;
  }

  void _onItemTapped(BuildContext context, int index) {
    switch (index) {
      case 0:
        context.go('/');
        break;
      case 1:
        context.go('/businesses');
        break;
      case 2:
        context.go('/settings');
        break;
    }
  }
}
