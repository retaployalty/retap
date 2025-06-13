import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:go_router/go_router.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'theme/app_theme.dart';
import 'screens/home_screen.dart';
import 'screens/business_list_screen.dart';
import 'screens/settings_screen.dart';
import 'screens/merchant_details_screen.dart';
import 'screens/merchant_showcase_screen.dart';
import 'screens/splash_screen.dart';
import 'screens/onboarding_screen.dart';
import 'screens/registration_screen.dart';
import 'components/custom_bottom_nav_bar.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Initialize Supabase
  await Supabase.initialize(
    url: 'https://egmizgydnmvpfpbzmbnj.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVnbWl6Z3lkbm12cGZwYnptYm5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc0NjA2NjUsImV4cCI6MjA2MzAzNjY2NX0.eKlGwWbYq6TUv0AJq8Lv9w6Vejwp2v7CyQEMW0hqL6U',
  );
  
  // Precarica il font Fredoka
  await GoogleFonts.pendingFonts([
    GoogleFonts.getFont('Fredoka'),
  ]);
  
  runApp(const ReTapWeb());
}

class ReTapWeb extends StatelessWidget {
  const ReTapWeb({super.key});

  Future<String> _getInitialRoute() async {
    // Prima prova a estrarre l'ID dall'URL
    final uri = Uri.base;
    final segments = uri.pathSegments;
    String? urlCardId;
    
    if (segments.isNotEmpty && segments.first == 'c' && segments.length > 1) {
      urlCardId = segments[1];
    } else if (segments.isNotEmpty && segments.last.isNotEmpty) {
      urlCardId = segments.last;
    }
    
    // Ottieni le SharedPreferences
    final prefs = await SharedPreferences.getInstance();
    
    // Se abbiamo trovato un ID nell'URL, lo salviamo nelle preferences
    if (urlCardId != null && urlCardId.isNotEmpty) {
      await prefs.setString('retap_card_id', urlCardId);
    } 
    // Altrimenti, proviamo a recuperarlo dalle preferences
    else {
      urlCardId = prefs.getString('retap_card_id');
    }

    if (urlCardId == null || urlCardId.isEmpty) {
      return '/onboarding';
    }

    // Controlla se il cliente ha già i dati registrati
    final supabase = Supabase.instance.client;
    try {
      final cardResponse = await supabase
          .from('cards')
          .select('customer_id')
          .eq('id', urlCardId)
          .maybeSingle();

      if (cardResponse == null) {
        return '/onboarding';
      }

      final customerId = cardResponse['customer_id'] as String;
      final customerResponse = await supabase
          .from('customers')
          .select('first_name, last_name, phone_number')
          .eq('id', customerId)
          .maybeSingle();

      if (customerResponse == null || 
          customerResponse['first_name'] == null || 
          customerResponse['last_name'] == null || 
          customerResponse['phone_number'] == null) {
        return '/onboarding';
      }

      return '/';
    } catch (e) {
      print('Error checking customer data: $e');
      return '/onboarding';
    }
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'ReTap Card',
      theme: appTheme,
      debugShowCheckedModeBanner: false,
      routerConfig: GoRouter(
        initialLocation: '/splash',
        redirect: (context, state) async {
          if (state.matchedLocation == '/splash') {
            final initialRoute = await _getInitialRoute();
            return initialRoute;
          }
          return null;
        },
        routes: [
          // Splash screen
          GoRoute(
            path: '/splash',
            builder: (context, state) => const SplashScreen(),
          ),
          // Onboarding flow
          GoRoute(
            path: '/onboarding',
            builder: (context, state) => const OnboardingScreen(),
          ),
          GoRoute(
            path: '/onboarding/register',
            builder: (context, state) => const RegistrationScreen(),
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
      ),
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
